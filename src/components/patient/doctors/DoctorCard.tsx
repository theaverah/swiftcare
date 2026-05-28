"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import type { Doctor } from "@/types/doctor";

interface DoctorCardProps {
  doctor: Doctor;
  onSaveToggle: () => void;
  onOpenDrawer: () => void;
  animationIndex: number;
}

export function DoctorCard({ doctor, onSaveToggle, onOpenDrawer, animationIndex }: DoctorCardProps) {
  const [beating, setBeating] = useState(false);

  const initials = doctor.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  function handleSave(e: React.MouseEvent) {
    e.stopPropagation();
    setBeating(true);
    setTimeout(() => setBeating(false), 350);
    onSaveToggle();
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpenDrawer}
      onKeyDown={(e) => e.key === "Enter" && onOpenDrawer()}
      className="bg-bg-main border border-elements rounded-lg p-4 flex flex-col gap-3 cursor-pointer
        hover:shadow-[0_2px_12px_rgba(0,0,0,0.08)] hover:border-elements
        transition-all duration-200 animate-fadeInDown group outline-none
        focus-visible:ring-2 focus-visible:ring-brand/40"
      style={{ animationDelay: `${animationIndex * 65}ms`, animationDuration: "420ms" }}
    >
      {/* Top row: photo + name/specs + heart */}
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="w-12 h-12 rounded-full overflow-hidden border border-elements shrink-0 bg-brand-sub flex items-center justify-center">
          {doctor.profileImage ? (
            <img
              src={doctor.profileImage}
              alt={doctor.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-[13px] font-medium text-brand select-none">{initials}</span>
          )}
        </div>

        {/* Name + specializations */}
        <div className="flex-1 min-w-0">
          <p className="text-[16px] font-medium text-text-main leading-tight truncate">{doctor.name}</p>
          <p className="text-[14px] text-text-sub leading-snug mt-0.5 truncate">
            {doctor.specializations.join(" · ")}
          </p>
        </div>

        {/* Heart */}
        <button
          type="button"
          aria-label={doctor.isSaved ? "Remove from saved" : "Save doctor"}
          onClick={handleSave}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-bg-sub
            transition-colors duration-200 shrink-0 -mr-0.5 -mt-0.5"
        >
          <Heart
            size={18}
            strokeWidth={1.75}
            className={`transition-colors duration-200 ${
              doctor.isSaved ? "fill-brand text-brand" : "text-text-sub fill-transparent"
            }`}
            style={{
              transform: beating ? "scale(1.4)" : "scale(1)",
              transition: "transform 350ms cubic-bezier(0.34, 1.56, 0.64, 1), color 200ms ease",
            }}
          />
        </button>
      </div>

      {/* Divider */}
      <div className="h-px bg-elements/50" />

      {/* Fee + availability */}
      <div className="flex flex-col gap-1.5">
        <p className="text-[16px] font-medium text-text-main leading-none">
          {doctor.consultationFee != null
            ? `₱${doctor.consultationFee.toLocaleString("en-PH")}`
            : "Fee on request"}
          <span className="text-[13px] font-normal text-text-sub ml-1">/ consultation</span>
        </p>

        <p
          className={`text-[14px] font-medium leading-snug ${
            doctor.isAvailableToday ? "text-success" : "text-text-sub"
          }`}
        >
          {doctor.nextAvailableLabel}
        </p>

        <p className="text-[14px] text-text-sub leading-snug">
          {doctor.todayHours ? `Today: ${doctor.todayHours}` : "Not available today"}
        </p>
      </div>

      {/* View Profile button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onOpenDrawer();
        }}
        className="mt-1 w-full h-9 border border-elements rounded-lg text-[14px] font-medium text-text-main
          hover:border-brand hover:text-brand transition-all duration-200"
      >
        View Profile
      </button>
    </div>
  );
}
