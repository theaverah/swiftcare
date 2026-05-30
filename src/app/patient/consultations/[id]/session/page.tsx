"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { PhoneOff } from "lucide-react";
import type { Consultation } from "@/types/consultation";

const AVATAR_PALETTES = [
  { bg: "#E8F4FD", color: "#2B7BB9" },
  { bg: "#FEF3E2", color: "#B5651D" },
  { bg: "#F0FDF4", color: "#15803D" },
  { bg: "#FDF2F8", color: "#9D174D" },
  { bg: "#F5F3FF", color: "#6D28D9" },
  { bg: "#FFF7ED", color: "#C2410C" },
];

function avatarPalette(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) - hash) + name.charCodeAt(i);
    hash |= 0;
  }
  return AVATAR_PALETTES[Math.abs(hash) % AVATAR_PALETTES.length];
}

export default function PatientSessionPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [consultation, setConsultation] = useState<Consultation | null>(null);
  const [showConfirm,  setShowConfirm]  = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res  = await fetch(`/api/patient/consultations/${id}`);
        const data = await res.json() as { consultation: Consultation };
        setConsultation(data.consultation);
      } catch {}
    }
    load();
  }, [id]);

  const initials = consultation?.doctor.name
    .split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() ?? "";
  const palette = consultation ? avatarPalette(consultation.doctor.name) : AVATAR_PALETTES[0];

  return (
    <div className="h-screen flex flex-col">

      {/* Top bar */}
      <div className="shrink-0 h-14 px-6 bg-bg-main border-b border-elements flex items-center justify-between">
        <div className="flex items-center gap-3">
          {consultation ? (
            <>
              <div
                className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center border border-elements/50"
                style={{ backgroundColor: palette.bg }}
              >
                {consultation.doctor.profileImage ? (
                  <img
                    src={consultation.doctor.profileImage}
                    alt={consultation.doctor.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span className="text-[11px] font-medium select-none" style={{ color: palette.color }}>
                    {initials}
                  </span>
                )}
              </div>
              <div>
                <p className="text-[14px] font-medium text-text-main leading-tight">
                  Dr. {consultation.doctor.name}
                </p>
                <p className="text-[12px] text-text-sub leading-tight">
                  {consultation.doctor.specializations[0] ?? "General Practitioner"}
                </p>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-elements animate-pulse" />
              <div className="h-4 w-36 rounded bg-elements animate-pulse" />
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => setShowConfirm(true)}
          className="flex items-center gap-2 h-9 px-4 rounded-lg border border-error/40
            text-error text-[14px] font-medium hover:bg-error/5
            active:scale-[0.99] transition-all duration-200"
        >
          <PhoneOff size={14} strokeWidth={1.75} />
          End consultation
        </button>
      </div>

      {/* Whereby iframe */}
      <iframe
        src="https://whereby.com/swiftcare"
        allow="camera; microphone; fullscreen; speaker; display-capture"
        className="flex-1 w-full border-0"
        title="Consultation session"
      />

      {/* End confirmation modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-6">
          <div
            className="bg-bg-main rounded-xl border border-elements p-6 w-full max-w-sm
              flex flex-col gap-5 shadow-[0_16px_60px_rgba(0,0,0,0.30)] animate-fadeInDown"
            style={{ animationDuration: "200ms" }}
          >
            <div className="flex flex-col gap-1.5">
              <h2 className="text-[18px] font-medium text-text-main">End this session?</h2>
              <p className="text-[14px] text-text-sub leading-relaxed">
                Are you sure you want to end this consultation? You&apos;ll be redirected to your consultations page.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="flex-1 h-10 rounded-lg border border-elements text-[14px] font-medium
                  text-text-main hover:bg-bg-sub transition-colors duration-200"
              >
                Stay
              </button>
              <button
                type="button"
                onClick={() => router.push("/patient/consultations")}
                className="flex-1 h-10 rounded-lg bg-error text-white text-[14px] font-medium
                  hover:opacity-90 transition-opacity duration-200"
              >
                End session
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
