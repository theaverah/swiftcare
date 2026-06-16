"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { format } from "date-fns";
import { toast } from "sonner";
import type { Consultation } from "@/types/consultation";

interface Props {
  consultation: Consultation | null;
  onClose:      () => void;
  onCancelled:  (id: string) => void;
  onRestored:   (id: string, prevStatus: Consultation["status"]) => void;
}

export function CancelModal({ consultation, onClose, onCancelled, onRestored }: Props) {
  const [mounted,    setMounted]    = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const isOpen = Boolean(consultation);

  useEffect(() => {
    if (!isOpen) return;
    function handler(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  async function handleCancel() {
    if (!consultation) return;
    setCancelling(true);

    const { id, status: prevStatus } = consultation;

    // 1 — Optimistically update UI and close modal immediately
    onCancelled(id);
    onClose();
    setCancelling(false);

    // 2 — Show custom undo toast (top-right, 5 s)
    let undone = false;
    const DURATION = 4000;
    const toastId = toast.custom(
      (tid) => (
        <div
          className="relative w-85 flex items-center gap-3 px-4 py-3.5 rounded-xl overflow-hidden"
          style={{ background: "#E7DBDD", border: "1px solid #E24F62" }}
        >
          {/* Draining progress bar */}
          <div
            className="absolute bottom-0 left-0 h-0.5 rounded-full"
            style={{
              background: "#E24F62",
              width: "100%",
              animation: `drain ${DURATION}ms linear forwards`,
            }}
          />
          <span className="text-[16px] text-error flex-1 font-medium leading-snug">
            Consultation cancelled.
          </span>
          <button
            type="button"
            onClick={() => {
              undone = true;
              onRestored(id, prevStatus);
              toast.dismiss(tid);
            }}
            className="shrink-0 text-[14px] font-semibold text-error border border-error/50
              px-3 py-1.5 rounded-lg hover:bg-error/10 transition-colors duration-150"
          >
            Undo
          </button>
        </div>
      ),
      { duration: DURATION, position: "top-right" }
    );

    // 3 — After 5 s, fire the real DELETE only if not undone
    setTimeout(async () => {
      if (undone) return;
      try {
        const res = await fetch(`/api/patient/appointments/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error();
      } catch {
        // Revert UI if the server call fails
        onRestored(id, prevStatus);
        toast.error("Failed to cancel. Please try again.", { position: "top-center" });
      }
    }, 5000);
  }

  if (!mounted || !isOpen) return null;

  const d          = new Date(consultation!.scheduledAt);
  const isThisYear = d.getFullYear() === new Date().getFullYear();
  const dateLabel  = format(d, isThisYear ? "EEEE, MMMM d 'at' h:mm aa" : "EEEE, MMMM d, yyyy 'at' h:mm aa");

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-200 bg-black/30 backdrop-blur-[2px]"
        onClick={() => !cancelling && onClose()}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-200 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="relative w-full max-w-2xl h-[96vh] max-h-[96vh] bg-bg-main rounded-xl
            shadow-[0_8px_40px_rgba(0,0,0,0.16)] animate-fadeInDown flex flex-col pointer-events-auto overflow-hidden"
          style={{ animationDuration: "150ms" }}
          onClick={e => e.stopPropagation()}
        >
          {/* Scrollable body */}
          <div className="flex-1 flex flex-col items-center justify-center px-10 py-8 text-center">
            <img src="/illustrations/thinking.svg" alt="" aria-hidden className="w-66 max-w-full select-none mb-4" />
            <p className="text-[20px] font-medium text-text-main mb-2">
              Cancel your consultation?
            </p>
            <p className="text-[16px] text-text-sub">
              This will cancel your consultation with{" "}
              <span className="font-medium text-text-main">Dr. {consultation!.doctor.name}</span>{" "}
              on <span className="font-medium text-text-main">{dateLabel}</span>.{" "}
              This action cannot be undone.
            </p>
          </div>

          {/* Sticky footer */}
          <div className="shrink-0 px-6 py-4 border-t border-elements flex gap-2">
            <button
              type="button"
              onClick={handleCancel}
              disabled={cancelling}
              className="flex-1 h-11 rounded-lg border border-error text-error text-[16px] font-medium
                hover:bg-error/10 transition-colors duration-150 disabled:opacity-50"
            >
              {cancelling ? "Cancelling…" : "Yes, cancel"}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={cancelling}
              className="flex-1 h-11 rounded-lg bg-success text-white text-[16px] font-medium
                hover:opacity-90 transition-opacity duration-150 disabled:opacity-50"
            >
              Keep it
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
