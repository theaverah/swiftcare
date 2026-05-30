"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Stethoscope, Globe, Clock, DollarSign } from "lucide-react";

interface DoctorProfileData {
  name:             string;
  email:            string;
  specializations:  string[];
  bio:              string;
  profileImage:     string | null;
  consultationFee:  number | null;
  yearsOfExperience: number | null;
  languages:        string[];
}

interface Props {
  isOpen:  boolean;
  onClose: () => void;
}

export function DoctorProfileModal({ isOpen, onClose }: Props) {
  const [profile, setProfile] = useState<DoctorProfileData | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!isOpen || profile) return;
    fetch("/api/doctor/profile")
      .then(r => r.json())
      .then(setProfile)
      .catch(() => {});
  }, [isOpen, profile]);

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) onClose();
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  if (!mounted) return null;

  const initials = (profile?.name ?? "")
    .split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  const modal = (
    <>
      {/* Backdrop */}
      <div
        aria-hidden
        className="fixed inset-0 z-40 bg-black/40"
        style={{ opacity: isOpen ? 1 : 0, pointerEvents: isOpen ? "auto" : "none", transition: "opacity 300ms ease" }}
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-6 pointer-events-none">
        <div
          role="dialog"
          aria-modal
          className="relative w-full max-w-lg bg-bg-main rounded-xl shadow-[0_16px_60px_rgba(0,0,0,0.20)]
            flex flex-col overflow-hidden"
          style={{
            opacity:       isOpen ? 1 : 0,
            pointerEvents: isOpen ? "auto" : "none",
            transform:     isOpen ? "scale(1) translateY(0)" : "scale(0.97) translateY(8px)",
            transition:    "opacity 300ms ease, transform 300ms cubic-bezier(0.25,0.46,0.45,0.94)",
          }}
        >
          {/* Close */}
          <div className="flex items-center justify-end px-6 pt-4 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-text-sub
                hover:bg-bg-sub hover:text-text-main transition-colors duration-200"
            >
              <X size={18} strokeWidth={1.75} />
            </button>
          </div>

          <div className="px-8 pb-8 flex flex-col gap-6">
            {/* Avatar + name */}
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-brand-sub flex items-center justify-center shrink-0">
                {profile?.profileImage ? (
                  <img src={profile.profileImage} alt={profile.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[22px] font-medium text-brand select-none">{initials}</span>
                )}
              </div>
              <div>
                <h3 className="text-[20px] font-medium text-text-main tracking-[-0.04em]">
                  {profile?.name ? `Dr. ${profile.name}` : "Doctor"}
                </h3>
                <p className="text-[14px] text-text-sub mt-0.5">{profile?.email}</p>
              </div>
            </div>

            {/* Specializations */}
            {(profile?.specializations?.length ?? 0) > 0 && (
              <div className="flex flex-col gap-2">
                <p className="text-[14px] font-medium text-text-main flex items-center gap-2">
                  <Stethoscope size={14} strokeWidth={1.75} className="text-text-sub" />
                  Specializations
                </p>
                <div className="flex flex-wrap gap-2">
                  {profile!.specializations.map(s => (
                    <span key={s} className="text-[13px] px-3 py-1 rounded-full bg-brand-sub text-brand font-medium">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Bio */}
            {profile?.bio && (
              <p className="text-[15px] text-text-sub leading-relaxed">{profile.bio}</p>
            )}

            {/* Info grid */}
            <div className="grid grid-cols-3 gap-3">
              {profile?.yearsOfExperience != null && (
                <div className="bg-bg-sub rounded-lg p-3 flex flex-col gap-1">
                  <div className="flex items-center gap-1.5">
                    <Clock size={13} strokeWidth={1.75} className="text-text-sub" />
                    <p className="text-[12px] text-text-sub">Experience</p>
                  </div>
                  <p className="text-[16px] font-medium text-text-main">{profile.yearsOfExperience} yrs</p>
                </div>
              )}
              {profile?.consultationFee != null && (
                <div className="bg-bg-sub rounded-lg p-3 flex flex-col gap-1">
                  <div className="flex items-center gap-1.5">
                    <DollarSign size={13} strokeWidth={1.75} className="text-text-sub" />
                    <p className="text-[12px] text-text-sub">Fee</p>
                  </div>
                  <p className="text-[16px] font-medium text-text-main">
                    ₱{profile.consultationFee.toLocaleString("en-PH")}
                  </p>
                </div>
              )}
              {(profile?.languages?.length ?? 0) > 0 && (
                <div className="bg-bg-sub rounded-lg p-3 flex flex-col gap-1">
                  <div className="flex items-center gap-1.5">
                    <Globe size={13} strokeWidth={1.75} className="text-text-sub" />
                    <p className="text-[12px] text-text-sub">Languages</p>
                  </div>
                  <p className="text-[14px] font-medium text-text-main leading-tight">
                    {profile!.languages.join(", ")}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );

  return createPortal(modal, document.body);
}
