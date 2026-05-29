"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { format } from "date-fns";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import type { Consultation } from "@/types/consultation";

interface Props {
  consultation: Consultation | null;
  onClose:      () => void;
  onCancelled:  (id: string) => void;
}

export function CancelModal({ consultation, onClose, onCancelled }: Props) {
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
    try {
      const res = await fetch(`/api/patient/appointments/${consultation.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed");
      onCancelled(consultation.id);
      onClose();
      toast.success("Consultation cancelled.");
    } catch {
      toast.error("Failed to cancel. Please try again.");
    } finally {
      setCancelling(false);
    }
  }

  if (!mounted) return null;

  const dateLabel = consultation
    ? format(new Date(consultation.scheduledAt), "EEEE, MMMM d, yyyy 'at' h:mm aa")
    : "";

  const panel = (
    <>
      <div
        aria-hidden
        className="fixed inset-0 z-50 bg-black/30 backdrop-blur-[2px]"
        style={{
          opacity:       isOpen ? 1 : 0,
          pointerEvents: isOpen ? "auto" : "none",
          transition:    "opacity 250ms ease",
        }}
        onClick={onClose}
      />
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
      >
        <div
          className="w-full max-w-sm bg-bg-main rounded-xl shadow-[0_8px_40px_rgba(0,0,0,0.16)]
            flex flex-col"
          style={{
            opacity:       isOpen ? 1 : 0,
            pointerEvents: isOpen ? "auto" : "none",
            transform:     isOpen ? "scale(1) translateY(0)" : "scale(0.96) translateY(8px)",
            transition:    "opacity 250ms ease, transform 250ms cubic-bezier(0.25,0.46,0.45,0.94)",
          }}
        >
          <div className="p-6 flex flex-col gap-4">
            {/* Icon */}
            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
              <AlertTriangle size={18} className="text-error" strokeWidth={1.75} />
            </div>

            {/* Text */}
            <div className="flex flex-col gap-1.5">
              <h3 className="text-[18px] font-medium text-text-main tracking-[-0.02em]">
                Cancel your consultation?
              </h3>
              <p className="text-[14px] text-text-sub leading-relaxed">
                This will cancel your consultation with{" "}
                <span className="font-medium text-text-main">
                  Dr. {consultation?.doctor.name}
                </span>{" "}
                on <span className="font-medium text-text-main">{dateLabel}</span>.
                This action cannot be undone.
              </p>
            </div>
          </div>

          <div className="h-px bg-elements/50" />

          {/* Actions */}
          <div className="flex items-center gap-2.5 p-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-10 rounded-lg bg-text-main text-brand-sub text-[14px] font-medium
                hover:opacity-90 active:scale-[0.99] transition-all duration-200"
            >
              Keep it
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={cancelling}
              className="flex-1 h-10 rounded-lg border border-error text-error text-[14px] font-medium
                hover:bg-red-50 active:scale-[0.99] transition-all duration-200 disabled:opacity-50"
            >
              {cancelling ? "Cancelling…" : "Yes, cancel"}
            </button>
          </div>
        </div>
      </div>
    </>
  );

  return createPortal(panel, document.body);
}
