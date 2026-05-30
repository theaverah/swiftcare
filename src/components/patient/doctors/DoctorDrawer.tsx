"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import type { Doctor } from "@/types/doctor";

interface DoctorDrawerProps {
  doctor: Doctor | null;
  isOpen: boolean;
  onClose: () => void;
  onBook: () => void;
}

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

export function DoctorDrawer({ doctor, isOpen, onClose, onBook }: DoctorDrawerProps) {
  const todayDow = new Date().getDay();

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) onClose();
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else        document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const initials = doctor?.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() ?? "";

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden
        className="fixed inset-0 z-40 bg-black/40"
        style={{
          opacity:       isOpen ? 1 : 0,
          pointerEvents: isOpen ? "auto" : "none",
          transition:    "opacity 300ms ease",
        }}
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-6 pointer-events-none">
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Doctor Profile"
          className="relative w-full max-w-2xl max-h-[90vh] bg-bg-main rounded-xl
            shadow-[0_16px_60px_rgba(0,0,0,0.20)] flex flex-col overflow-hidden"
          style={{
            opacity:       isOpen ? 1 : 0,
            pointerEvents: isOpen ? "auto" : "none",
            transform:     isOpen ? "scale(1) translateY(0)" : "scale(0.97) translateY(8px)",
            transition:    "opacity 300ms ease, transform 300ms cubic-bezier(0.25,0.46,0.45,0.94)",
          }}
        >
          {/* Header */}
          <div className="shrink-0 flex items-center justify-between px-6 h-14 border-b border-elements">
            <p className="text-[16px] text-text-main">Doctor Profile</p>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-text-sub
                hover:bg-bg-sub hover:text-text-main transition-colors duration-200"
            >
              <X size={18} strokeWidth={1.75} />
            </button>
          </div>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto">
            {doctor && (
              <div className="px-8 py-6 flex flex-col gap-6">

                {/* ── Hero ─────────────────────────────────────────────── */}
                <div className="flex flex-col items-center gap-3 text-center">
                  <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-elements
                    bg-brand-sub flex items-center justify-center shrink-0">
                    {doctor.profileImage ? (
                      <img src={doctor.profileImage} alt={doctor.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[20px] font-medium text-brand select-none">{initials}</span>
                    )}
                  </div>
                  <div>
                    <h3 className="text-[20px] font-medium text-text-main tracking-[-0.04em]">
                      Dr. {doctor.name}
                    </h3>
                    <p className="text-[16px] text-text-sub mt-1">
                      {doctor.specializations.join(" · ")}
                    </p>
                  </div>
                </div>

                {/* ── Bio ──────────────────────────────────────────────── */}
                {doctor.bio && (
                  <p className="text-[16px] text-text-sub text-center">{doctor.bio}</p>
                )}

                {/* ── Info row ─────────────────────────────────────────── */}
                <div className="flex gap-2">
                  {doctor.licenseNumber && (
                    <div className="flex-1 text-center">
                      <p className="text-[14px] text-text-sub mb-1">PRC License</p>
                      <p className="text-[16px] text-text-main">{doctor.licenseNumber}</p>
                    </div>
                  )}
                  {doctor.yearsOfExperience != null && (
                    <div className="flex-1 text-center">
                      <p className="text-[14px] text-text-sub mb-1">Experience</p>
                      <p className="text-[16px] text-text-main">{doctor.yearsOfExperience} years</p>
                    </div>
                  )}
                  {doctor.languages.length > 0 && (
                    <div className="flex-1 text-center">
                      <p className="text-[14px] text-text-sub mb-1">Languages</p>
                      <p className="text-[16px] text-text-main">{doctor.languages.join(", ")}</p>
                    </div>
                  )}
                  <div className="flex-1 text-center">
                    <p className="text-[14px] text-text-sub mb-1">Consultation fee</p>
                    <p className="text-[16px] text-text-main">
                      {doctor.consultationFee != null
                        ? `₱${doctor.consultationFee.toLocaleString("en-PH")}`
                        : "On request"}
                    </p>
                  </div>
                </div>

                {/* ── Background & Credentials ─────────────────────────── */}
              {(doctor.education || doctor.certifications.length > 0 || doctor.affiliations.length > 0) && (
                <div className="flex flex-col gap-4">
                  <p className="text-[16px] text-text-main">Background & Credentials</p>

                  {doctor.education && (
                    <div className="flex flex-col gap-1">
                      <p className="text-[14px] text-text-sub">Education</p>
                      <p className="text-[16px] text-text-main">{doctor.education.medicalSchool}</p>
                      <p className="text-[16px] text-text-main">{doctor.education.residency}</p>
                    </div>
                  )}

                  {doctor.certifications.length > 0 && (
                    <div className="flex flex-col gap-1">
                      <p className="text-[14px] text-text-sub">Certifications</p>
                      {doctor.certifications.map(c => (
                        <p key={c} className="text-[16px] text-text-main">{c}</p>
                      ))}
                    </div>
                  )}

                  {doctor.affiliations.length > 0 && (
                    <div className="flex flex-col gap-1">
                      <p className="text-[14px] text-text-sub">Affiliations</p>
                      {doctor.affiliations.map(a => (
                        <p key={a} className="text-[16px] text-text-main">{a}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ── Weekly schedule ──────────────────────────────────── */}
                <div>
                  <p className="text-[16px] font-medium text-text-main mb-3">Weekly Schedule</p>
                  <div className="flex flex-col">
                    {DAY_ORDER.map((dow) => {
                      const slot    = doctor.availability.find(a => a.dayOfWeek === dow && a.isAvailable);
                      const isToday = todayDow === dow;
                      return (
                        <div
                          key={dow}
                          className={`flex items-center justify-between py-1.5 ${
                            isToday ? "-mx-2 px-2 rounded-md bg-brand-sub/40" : ""
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className={`text-[16px] font-normal ${isToday ? "text-text-main" : "text-text-sub"}`}>
                              {DAY_NAMES[dow]}
                            </span>
                            {isToday && (
                              <span className="text-[10px] bg-brand text-white px-1.5 py-0.5 rounded-sm font-medium leading-none">
                                Today
                              </span>
                            )}
                          </div>
                          {slot ? (
                            <span className="text-[16px] font-normal text-text-main">
                              {slot.startTime} – {slot.endTime}
                            </span>
                          ) : (
                            <span className="text-[16px] font-normal text-text-sub">Not available</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            )}
          </div>

          {/* ── Sticky CTA ───────────────────────────────────────────── */}
          <div className="shrink-0 px-8 py-4 border-t border-elements bg-bg-main">
            <button
              type="button"
              onClick={onBook}
              className="w-full h-11 rounded-lg bg-brand text-white text-[16px] font-medium
                hover:opacity-90 active:scale-[0.98] transition-all duration-200"
            >
              Book a consultation
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
