"use client";

import { format } from "date-fns";
import { Calendar, Clock, User } from "lucide-react";
import type { Doctor } from "@/types/doctor";
import type { BookingData } from "./BookingModal";

interface Props {
  doctor: Doctor;
  data: BookingData;
  onChange: (patch: Partial<BookingData>) => void;
  onConfirm: () => void;
  onBack: () => void;
  submitting: boolean;
}

export function BookingStep2({ doctor, data, onChange, onConfirm, onBack, submitting }: Props) {
  const dateLabel = data.date
    ? format(new Date(data.date + "T12:00:00"), "EEEE, MMMM d, yyyy")
    : "";

  const forLabel = data.forSelf
    ? "Myself"
    : `${data.patientName}${data.relationship ? ` (${data.relationship})` : ""}`;

  const initials = doctor.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="flex flex-col gap-6">

      {/* Heading */}
      <div className="flex flex-col gap-1">
        <h3 className="text-[20px] font-medium text-text-main tracking-[-0.03em]">
          Review your booking
        </h3>
        <p className="text-[14px] text-text-sub">
          Take a moment to check everything before confirming.
        </p>
      </div>

      {/* Summary card */}
      <div className="flex flex-col gap-4 p-4 rounded-lg border border-elements bg-bg-sub">

        {/* Doctor */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-brand-sub flex items-center justify-center shrink-0">
            {doctor.profileImage ? (
              <img src={doctor.profileImage} alt="" className="w-full h-full rounded-full object-cover" />
            ) : (
              <span className="text-[14px] font-medium text-brand select-none">{initials}</span>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-[15px] font-medium text-text-main leading-tight">Dr. {doctor.name}</p>
            <p className="text-[13px] text-text-sub leading-tight truncate">
              {doctor.specializations?.join(", ")}
            </p>
          </div>
        </div>

        <div className="h-px bg-elements/50" />

        {/* Details */}
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center gap-2.5">
            <Calendar size={15} className="text-text-sub shrink-0" strokeWidth={1.75} />
            <div>
              <p className="text-[13px] text-text-sub leading-none mb-0.5">Date &amp; time</p>
              <p className="text-[14px] font-medium text-text-main">{dateLabel}, {data.assignedSlot}</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <User size={15} className="text-text-sub shrink-0" strokeWidth={1.75} />
            <div>
              <p className="text-[13px] text-text-sub leading-none mb-0.5">Patient</p>
              <p className="text-[14px] font-medium text-text-main">{forLabel}</p>
            </div>
          </div>
          {data.reason && (
            <div className="flex items-start gap-2.5">
              <Clock size={15} className="text-text-sub shrink-0 mt-0.5" strokeWidth={1.75} />
              <div>
                <p className="text-[13px] text-text-sub leading-none mb-0.5">Reason for visit</p>
                <p className="text-[14px] text-text-main leading-snug">{data.reason}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Additional note */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[14px] font-medium text-text-main">
          Anything else your doctor should know?{" "}
          <span className="text-text-sub font-normal">(optional)</span>
        </label>
        <textarea
          rows={3}
          value={data.note}
          onChange={e => onChange({ note: e.target.value })}
          placeholder="e.g. I've been experiencing chest pain for 3 days..."
          className="px-3 py-2.5 rounded-lg border border-elements text-[14px] text-text-main
            placeholder:text-text-sub/60 outline-none focus:border-text-main transition-colors
            duration-200 resize-none bg-bg-main"
        />
      </div>

      {/* Reassurance */}
      <p className="text-[13px] text-text-sub text-center">
        Your booking is confirmed right after you submit. No waiting required.
      </p>

      {/* Fee */}
      <div className="flex items-center justify-between px-4 py-3 rounded-lg border border-elements">
        <div>
          <p className="text-[12px] text-text-sub mb-0.5">Consultation fee</p>
          <p className="text-[22px] font-medium text-text-main tracking-tight leading-none">
            {doctor.consultationFee != null
              ? `₱${doctor.consultationFee.toLocaleString("en-PH")}`
              : "On request"}
          </p>
          <p className="text-[11px] text-text-sub mt-1">Payment is collected at the time of your session.</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-brand-sub flex items-center justify-center shrink-0">
          <span className="text-brand text-[16px] font-medium select-none">₱</span>
        </div>
      </div>

      {/* CTAs */}
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={onConfirm}
          disabled={submitting}
          className="w-full h-11 rounded-lg bg-text-main text-brand-sub text-[14px] font-medium
            hover:opacity-90 active:scale-[0.99] transition-all duration-200
            disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? "Confirming…" : "Confirm booking"}
        </button>
        <button
          type="button"
          onClick={onBack}
          disabled={submitting}
          className="w-full h-11 rounded-lg border border-elements text-[14px] font-medium text-text-main
            hover:border-text-sub/60 transition-all duration-200"
        >
          Go back
        </button>
      </div>

    </div>
  );
}
