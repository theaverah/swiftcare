"use client";

import { format } from "date-fns";
import type { Doctor } from "@/types/doctor";
import type { BookingData } from "./BookingModal";

interface Props {
  doctor:          Doctor;
  data:            BookingData;
  rescheduleMode?: boolean;
  onClose?:        () => void;
}

export function BookingStep3({ doctor, data, rescheduleMode }: Props) {
  const dateLabel = data.date
    ? format(new Date(data.date + "T12:00:00"), "MMMM d, yyyy")
    : "";

  return (
    <div className="flex flex-col items-center gap-6 text-center">

      {/* Illustration */}
      <img
        src="/illustrations/welcome.svg"
        alt=""
        aria-hidden
        className="w-full max-w-60 select-none animate-fadeInDown"
        style={{ animationDelay: "0ms", animationDuration: "400ms" }}
      />

      {/* Heading */}
      <div
        className="flex flex-col items-center gap-2 animate-fadeInDown"
        style={{ animationDelay: "80ms", animationDuration: "400ms" }}
      >
        <h3 className="text-[24px] font-medium text-text-main">
          {rescheduleMode ? "Consultation rescheduled!" : "You’re all booked!"}
        </h3>
        <p className="text-[14px] text-text-sub max-w-sm leading-relaxed">
          {rescheduleMode
            ? <>Your consultation with <span className="font-medium text-text-main">Dr. {doctor.name}</span> has been rescheduled to <span className="font-medium text-text-main">{dateLabel}</span> at <span className="font-medium text-text-main">{data.assignedSlot}</span>.</>
            : <>Your consultation with <span className="font-medium text-text-main">Dr. {doctor.name}</span> is confirmed on <span className="font-medium text-text-main">{dateLabel}</span> at <span className="font-medium text-text-main">{data.assignedSlot}</span>. You&apos;ll receive a reminder 30 minutes before your session.</>
          }
        </p>
      </div>

    </div>
  );
}
