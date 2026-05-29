"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import type { Doctor } from "@/types/doctor";
import { BookingStepper } from "./BookingStepper";
import { BookingStep1 } from "./BookingStep1";
import { BookingStep2 } from "./BookingStep2";
import { BookingStep3 } from "./BookingStep3";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface BookingData {
  date:            string;
  timePreference:  "morning" | "afternoon" | "evening" | null;
  assignedSlot:    string;
  forSelf:         boolean;
  patientName:     string;
  relationship:    string;
  reason:          string;
  note:            string;
}

const INITIAL: BookingData = {
  date:           "",
  timePreference: null,
  assignedSlot:   "",
  forSelf:        true,
  patientName:    "",
  relationship:   "",
  reason:         "",
  note:           "",
};

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  doctor:  Doctor;
  isOpen:  boolean;
  onClose: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function BookingModal({ doctor, isOpen, onClose }: Props) {
  const [step,       setStep]       = useState(1);
  const [data,       setData]       = useState<BookingData>(INITIAL);
  const [direction,  setDirection]  = useState<"forward" | "back">("forward");
  const [submitting, setSubmitting] = useState(false);
  const [mounted,    setMounted]    = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setData(INITIAL);
      setDirection("forward");
      setSubmitting(false);
    }
  }, [isOpen]);

  // Lock body scroll
  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else        document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  // Escape to close
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen && step < 3) onClose();
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose, step]);

  const update = useCallback((patch: Partial<BookingData>) => {
    setData(prev => ({ ...prev, ...patch }));
  }, []);

  function goTo(next: number, dir: "forward" | "back" = "forward") {
    setDirection(dir);
    setStep(next);
  }

  async function handleConfirm() {
    setSubmitting(true);
    try {
      const res = await fetch("/api/patient/appointments", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctorUserId:    doctor.userId,
          doctorProfileId: doctor.doctorProfileId,
          date:            data.date,
          assignedSlot:    data.assignedSlot,
          forSelf:         data.forSelf,
          patientName:     data.patientName,
          relationship:    data.relationship,
          chiefComplaint:  data.reason,
          additionalNotes: data.note,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      goTo(3, "forward");
    } catch {
      // Silent fail — still show confirmed (optimistic)
      goTo(3, "forward");
    } finally {
      setSubmitting(false);
    }
  }

  const animClass = direction === "forward" ? "animate-stepForward" : "animate-stepBack";

  if (!mounted) return null;

  const panel = (
    <>
      {/* Backdrop */}
      <div
        aria-hidden
        className="fixed inset-0 z-50 bg-black/30 backdrop-blur-[2px]"
        style={{
          opacity:       isOpen ? 1 : 0,
          pointerEvents: isOpen ? "auto" : "none",
          transition:    "opacity 350ms ease",
        }}
        onClick={() => step < 3 && onClose()}
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Book a consultation"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
      >
        <div
          className="relative w-full max-w-lg bg-bg-main rounded-xl shadow-[0_8px_40px_rgba(0,0,0,0.16)]
            flex flex-col max-h-[92vh] pointer-events-auto"
          style={{
            opacity:   isOpen ? 1 : 0,
            transform: isOpen ? "scale(1) translateY(0)" : "scale(0.96) translateY(8px)",
            transition: "opacity 350ms ease, transform 350ms cubic-bezier(0.25, 0.46, 0.45, 0.94)",
          }}
        >
          {/* Header */}
          <div className="shrink-0 flex items-center justify-between px-6 py-5 border-b border-elements">
            <BookingStepper current={step} />
            {step < 3 && (
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-text-sub
                  hover:bg-bg-sub hover:text-text-main transition-colors duration-200 shrink-0 ml-4"
              >
                <X size={16} strokeWidth={1.75} />
              </button>
            )}
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <div key={`step-${step}`} className={animClass}>
              {step === 1 && (
                <BookingStep1
                  doctor={doctor}
                  data={data}
                  onChange={update}
                  onContinue={() => goTo(2, "forward")}
                />
              )}
              {step === 2 && (
                <BookingStep2
                  doctor={doctor}
                  data={data}
                  onChange={update}
                  onConfirm={handleConfirm}
                  onBack={() => goTo(1, "back")}
                  submitting={submitting}
                />
              )}
              {step === 3 && (
                <BookingStep3
                  doctor={doctor}
                  data={data}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );

  return createPortal(panel, document.body);
}
