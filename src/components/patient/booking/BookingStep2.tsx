"use client";

import { format } from "date-fns";
import { Calendar, User, FileText } from "lucide-react";
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

export function BookingStep2({ doctor, data }: Props) {
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
        <p className="text-[18px] font-medium text-text-main">
          Review your booking
        </p>
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
            <p className="text-[16px] font-medium text-text-main leading-tight">Dr. {doctor.name}</p>
            <p className="text-[14px] text-text-sub leading-tight truncate">
              {doctor.specializations?.join(", ")}
            </p>
          </div>
        </div>

        <div className="h-px bg-elements/50" />

        {/* Details */}
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center gap-2.5">
            <Calendar size={15} className="text-text-sub shrink-0" strokeWidth={1.75} />
            <p className="text-[16px] text-text-main">{dateLabel}, {data.assignedSlot}</p>
          </div>
          <div className="flex items-center gap-2.5">
            <User size={15} className="text-text-sub shrink-0" strokeWidth={1.75} />
            <p className="text-[16px] text-text-main">{forLabel}</p>
          </div>
          {data.reason && (
            <div className="flex items-start gap-2.5">
              <FileText size={15} className="text-text-sub shrink-0 mt-0.5" strokeWidth={1.75} />
              <p className="text-[16px] text-text-main leading-snug">{data.reason}</p>
            </div>
          )}
        </div>
      </div>

      {/* Fee */}
      <div className="flex items-center justify-between px-4 py-3 rounded-lg border border-elements">
        <div>
          <p className="text-[14px] text-text-sub">Consultation fee</p>
          <p className="text-[16px] font-medium text-text-main leading-none mt-1.5">
            {doctor.consultationFee != null
              ? `₱${doctor.consultationFee.toLocaleString("en-PH")}`
              : "On request"}
          </p>
        </div>
        <div className="w-10 h-10 rounded-full bg-brand-sub flex items-center justify-center shrink-0">
          <span className="text-brand text-[16px] font-medium select-none">₱</span>
        </div>
      </div>
      <p className="text-[14px] text-text-sub -mt-3">Payment is collected at the time of your session.</p>

    </div>
  );
}
