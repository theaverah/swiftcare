"use client";

import { useState } from "react";
import { Bookmark, Calendar } from "lucide-react";
import type { Doctor } from "@/types/doctor";

// ── Avatar color palette — soft muted tones ───────────────────────────────────

const AVATAR_PALETTES = [
  { bg: "#E8F4FD", color: "#2B7BB9" },
  { bg: "#FEF3E2", color: "#B5651D" },
  { bg: "#F0FDF4", color: "#15803D" },
  { bg: "#FDF2F8", color: "#9D174D" },
  { bg: "#F5F3FF", color: "#6D28D9" },
  { bg: "#FFF7ED", color: "#C2410C" },
  { bg: "#F0F9FF", color: "#0369A1" },
  { bg: "#FFF1F2", color: "#BE123C" },
  { bg: "#ECFDF5", color: "#065F46" },
  { bg: "#FEF9C3", color: "#854D0E" },
];

function avatarPalette(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) - hash) + name.charCodeAt(i);
    hash |= 0;
  }
  return AVATAR_PALETTES[Math.abs(hash) % AVATAR_PALETTES.length];
}

// ── Component ─────────────────────────────────────────────────────────────────

interface DoctorCardProps {
  doctor: Doctor;
  onSaveToggle: () => void;
  onOpenDrawer: () => void;
  onBook: () => void;
  animationIndex: number;
}

export function DoctorCard({ doctor, onSaveToggle, onOpenDrawer, onBook, animationIndex }: DoctorCardProps) {
  const [popping, setPopping] = useState(false);

  const initials = doctor.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const palette = avatarPalette(doctor.name);
  const specs   = doctor.specializations ?? [];
  const langs   = doctor.languages ?? [];

  function handleSave(e: React.MouseEvent) {
    e.stopPropagation();
    setPopping(true);
    setTimeout(() => setPopping(false), 300);
    onSaveToggle();
  }

  function handleBook(e: React.MouseEvent) {
    e.stopPropagation();
    onBook();
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpenDrawer}
      onKeyDown={(e) => e.key === "Enter" && onOpenDrawer()}
      className="bg-bg-main border border-elements rounded-xl overflow-hidden flex flex-col cursor-pointer
        hover:shadow-[0_4px_16px_rgba(0,0,0,0.10)]
        transition-all duration-200 animate-fadeInDown outline-none
        focus-visible:ring-2 focus-visible:ring-brand/40"
      style={{ animationDelay: `${animationIndex * 65}ms`, animationDuration: "420ms" }}
    >
      {/* ── Content ──────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 p-5 flex-1">

        {/* Top row */}
        <div className="flex items-center gap-4">

          {/* Avatar */}
          <div
            className="w-14 h-14 rounded-full overflow-hidden shrink-0 flex items-center justify-center border border-elements/50"
            style={{ backgroundColor: palette.bg }}
          >
            {doctor.profileImage ? (
              <img src={doctor.profileImage} alt={doctor.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-[14px] font-semibold select-none" style={{ color: palette.color }}>
                {initials}
              </span>
            )}
          </div>

          {/* Name + specializations */}
          <div className="flex-1 min-w-0">
            <p className="text-[16px] font-medium text-text-main leading-tight truncate">Dr. {doctor.name}</p>
            <p className="text-[13px] text-text-sub mt-0.5 leading-snug">
              {specs.length > 0 ? specs.join(" · ") : "General practitioner"}
            </p>
          </div>

          {/* Bookmark + tooltip */}
          <div className="relative group/save shrink-0">
            <button
              type="button"
              aria-label={doctor.isSaved ? "Remove from saved" : "Save doctor"}
              onClick={handleSave}
              className="w-8 h-8 flex items-center justify-center -mr-0.5 -mt-0.5 group/bm"
            >
              <Bookmark
                size={18}
                strokeWidth={1.75}
                style={{
                  color: doctor.isSaved ? "var(--brand)" : undefined,
                  fill: doctor.isSaved ? "var(--brand)" : "transparent",
                  transform: popping ? "scale(1.3)" : "scale(1)",
                  transition: "transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1), color 200ms ease, fill 200ms ease",
                }}
                className={`transition-colors duration-200 ${
                  doctor.isSaved ? "group-hover/bm:brightness-75" : "text-text-sub group-hover/bm:text-text-main"
                }`}
              />
            </button>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2
              opacity-0 group-hover/save:opacity-100 transition-opacity duration-200
              pointer-events-none z-50 flex flex-col items-center">
              <div className="px-2.5 py-1 bg-text-main/70 rounded-md text-[11px] text-white/90 whitespace-nowrap">
                {doctor.isSaved ? "Remove from saved" : "Save doctor"}
              </div>
              <div
                className="w-0 h-0"
                style={{
                  borderLeft: "4px solid transparent",
                  borderRight: "4px solid transparent",
                  borderTop: "4px solid rgba(17,17,17,0.70)",
                }}
              />
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-col gap-2 py-2">
          <p className="text-[14px] font-medium text-text-main leading-none">Earliest available schedule</p>
          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-text-sub shrink-0" />
            <p className="text-[14px] text-text-sub leading-none">{doctor.nextAvailableLabel}</p>
          </div>
        </div>

      </div>

      {/* ── Button footer ─────────────────────────────────────────── */}
      <div className="flex border-t border-elements">
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onOpenDrawer(); }}
          className="flex-1 py-2.5 text-[14px] font-medium text-text-main
            hover:bg-bg-sub transition-colors duration-200 border-r border-elements"
        >
          View profile
        </button>
        <button
          type="button"
          onClick={handleBook}
          className="flex-1 py-2.5 bg-brand text-white hover:opacity-90
            active:opacity-80 transition-all duration-200
            flex flex-col items-center justify-center gap-0.5"
        >
          <span className="text-[14px] font-medium leading-tight">Book a consultation</span>
          <span className="text-[16px] font-semibold leading-tight">
            {doctor.consultationFee != null
              ? `₱${doctor.consultationFee.toLocaleString("en-PH")}`
              : "Fee on request"}
          </span>
        </button>
      </div>
    </div>
  );
}
