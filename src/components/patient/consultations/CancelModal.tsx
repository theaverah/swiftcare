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

    // 2 — Show undo toast (top, red, 5 s)
    let undone = false;
    const toastId = toast.error("Consultation cancelled.", {
      duration: 5000,
      position: "top-center",
      action: {
        label: "Undo",
        onClick: () => {
          undone = true;
          onRestored(id, prevStatus);
          toast.dismiss(toastId);
        },
      },
    });

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
    <div
      className="fixed inset-0 z-200 flex items-center justify-center p-4 bg-black/50"
      onClick={() => !cancelling && onClose()}
    >
      <div
        className="w-full max-w-md bg-bg-main rounded-xl p-8
          shadow-[0_8px_32px_rgba(0,0,0,0.18)] animate-fadeInDown flex flex-col"
        style={{ animationDuration: "150ms" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Illustration + title */}
        <div className="flex flex-col items-center text-center mb-4">
          <img src="/illustrations/thinking.svg" alt="" className="w-66 max-w-full mb-3" />
          <p className="text-[18px] font-medium text-text-main">
            Cancel your consultation?
          </p>
        </div>

        {/* Body */}
        <p className="text-[16px] text-text-sub text-center mb-7">
          This will cancel your consultation with{" "}
          <span className="font-medium text-text-main">Dr. {consultation!.doctor.name}</span>{" "}
          on <span className="font-medium text-text-main">{dateLabel}</span>.{" "}
          This action cannot be undone.
        </p>

        {/* Buttons — Yes cancel first, Keep it second */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleCancel}
            disabled={cancelling}
            className="flex-1 h-11 rounded-lg bg-error text-white text-[16px] font-medium
              hover:opacity-90 transition-opacity duration-150 disabled:opacity-50"
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
    </div>,
    document.body
  );
}
