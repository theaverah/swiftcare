"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, FileText, Pill, FlaskConical, Award, ArrowRight } from "lucide-react";
import type { DoctorConsultation } from "./DoctorConsultationCard";

// -- Types ---------------------------------------------------------------------

interface HealthRecord {
  id:             string;
  type:           string;
  issuedAt:       string;
  notes?:         string;
  medications?:   { name: string; dosage: string; frequency: string; duration: string }[];
  tests?:         { name: string }[];
  purpose?:       string;
  referredTo?:    string;
  referralReason?:string;
}

// -- Record cards (read-only) --------------------------------------------------

function RecordCard({ icon: Icon, title, color, children }: {
  icon: React.ElementType;
  title: string;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-bg-sub rounded-xl border border-elements p-5 flex flex-col gap-3">
      <div className="flex items-center gap-2.5">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
          <Icon size={16} strokeWidth={1.75} className="text-white" />
        </div>
        <p className="text-[15px] font-medium text-text-main">{title}</p>
      </div>
      <div>{children}</div>
    </div>
  );
}

// -- Main modal ----------------------------------------------------------------

interface Props {
  consultation: DoctorConsultation | null;
  onClose:      () => void;
}

export function ViewRecordsModal({ consultation, onClose }: Props) {
  const [mounted,  setMounted]  = useState(false);
  const [records,  setRecords]  = useState<HealthRecord[]>([]);
  const [loading,  setLoading]  = useState(false);

  const isOpen = !!consultation;

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) onClose();
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen || !consultation) return;
    setLoading(true);
    setRecords([]);
    fetch(`/api/doctor/consultations/${consultation.id}/records`)
      .then((r) => r.json())
      .then((d) => setRecords(d.records ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [isOpen, consultation?.id]);

  if (!mounted || !consultation) return null;

  const note     = records.find((r) => r.type === "consultation_note");
  const rx       = records.find((r) => r.type === "prescription");
  const labs     = records.find((r) => r.type === "lab_request");
  const cert     = records.find((r) => r.type === "medical_certificate");
  const referral = records.find((r) => r.type === "referral");

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        aria-hidden
        className="fixed inset-0 z-[100] bg-black/40"
        style={{
          opacity:       isOpen ? 1 : 0,
          pointerEvents: isOpen ? "auto" : "none",
          transition:    "opacity 300ms ease",
        }}
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 pointer-events-none">
        <div
          role="dialog"
          aria-modal
          className="relative w-full max-w-2xl h-[96vh] max-h-[96vh] bg-bg-main rounded-xl
            shadow-[0_16px_60px_rgba(0,0,0,0.20)] flex flex-col overflow-hidden pointer-events-auto"
          style={{
            opacity:   isOpen ? 1 : 0,
            transform: isOpen ? "scale(1) translateY(0)" : "scale(0.97) translateY(8px)",
            transition:"opacity 300ms ease, transform 300ms cubic-bezier(0.25,0.46,0.45,0.94)",
          }}
        >
          {/* Header */}
          <div className="shrink-0 flex items-start justify-between px-8 py-6 border-b border-elements">
            <div>
              <p className="text-[18px] font-medium text-text-main">Consultation records</p>
              <p className="text-[14px] text-text-sub mt-1">{consultation.patientName}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-text-sub
                hover:bg-bg-sub hover:text-text-main transition-colors duration-200 shrink-0 ml-4"
            >
              <X size={16} strokeWidth={1.75} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-8 py-6 flex flex-col gap-4">
            {loading ? (
              <div className="flex flex-col gap-4">
                {[1, 2].map((i) => (
                  <div key={i} className="h-28 rounded-xl bg-elements/30 animate-pulse" />
                ))}
              </div>
            ) : records.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-12 text-center">
                <img src="/illustrations/no-data.svg" alt="" className="w-44 opacity-80" />
                <p className="text-[16px] text-text-sub">No records found for this consultation.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {note && (
                  <RecordCard icon={FileText} title="Consultation Notes" color="bg-brand">
                    <p className="text-[15px] text-text-main leading-relaxed whitespace-pre-wrap">
                      {note.notes}
                    </p>
                  </RecordCard>
                )}

                {rx && rx.medications && rx.medications.length > 0 && (
                  <RecordCard icon={Pill} title="Prescription" color="bg-[#7C3AED]">
                    <div className="flex flex-col gap-2">
                      {rx.medications.map((m, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-text-sub shrink-0" />
                          <span className="text-[15px] text-text-main">{m.name}</span>
                        </div>
                      ))}
                    </div>
                  </RecordCard>
                )}

                {labs && labs.tests && labs.tests.length > 0 && (
                  <RecordCard icon={FlaskConical} title="Lab Requests" color="bg-[#0369A1]">
                    <div className="flex flex-col gap-2">
                      {labs.tests.map((t, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-text-sub shrink-0" />
                          <span className="text-[15px] text-text-main">{t.name}</span>
                        </div>
                      ))}
                    </div>
                  </RecordCard>
                )}

                {cert && (
                  <RecordCard icon={Award} title="Medical Certificate" color="bg-[#B45309]">
                    <p className="text-[15px] text-text-main">Purpose: {cert.purpose}</p>
                  </RecordCard>
                )}

                {referral && (
                  <RecordCard icon={ArrowRight} title="Referral" color="bg-[#BE123C]">
                    <p className="text-[15px] text-text-main">Referred to: {referral.referredTo}</p>
                  </RecordCard>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="shrink-0 px-8 py-5 border-t border-elements">
            <button
              type="button"
              onClick={onClose}
              className="w-full h-11 rounded-lg bg-text-main text-brand-sub text-[16px] font-medium
                hover:opacity-90 transition-opacity duration-150"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
