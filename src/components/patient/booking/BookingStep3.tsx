"use client";

import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { Calendar, User } from "lucide-react";
import type { Doctor } from "@/types/doctor";
import type { BookingData } from "./BookingModal";

interface Props {
  doctor:          Doctor;
  data:            BookingData;
  rescheduleMode?: boolean;
  onClose?:        () => void;
}

export function BookingStep3({ doctor, data, rescheduleMode, onClose }: Props) {
  const router    = useRouter();
  const dateLabel = data.date
    ? format(new Date(data.date + "T12:00:00"), "MMMM d, yyyy")
    : "";

  const forLabel = data.forSelf
    ? "Myself"
    : `${data.patientName}${data.relationship ? ` (${data.relationship})` : ""}`;

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
        <h3 className="text-[24px] font-medium text-text-main tracking-[-0.03em]">
          {rescheduleMode ? "Consultation rescheduled!" : "You’re all booked!"}
        </h3>
        <p className="text-[14px] text-text-sub max-w-sm leading-relaxed">
          {rescheduleMode
            ? <>Your consultation with <span className="font-medium text-text-main">Dr. {doctor.name}</span> has been rescheduled to <span className="font-medium text-text-main">{dateLabel}</span> at <span className="font-medium text-text-main">{data.assignedSlot}</span>.</>
            : <>Your consultation with <span className="font-medium text-text-main">Dr. {doctor.name}</span> is confirmed on <span className="font-medium text-text-main">{dateLabel}</span> at <span className="font-medium text-text-main">{data.assignedSlot}</span>. You&apos;ll receive a reminder 30 minutes before your session.</>
          }
        </p>
      </div>

      {/* Summary */}
      <div
        className="w-full flex flex-col gap-2.5 p-4 rounded-lg border border-elements bg-bg-sub text-left animate-fadeInDown"
        style={{ animationDelay: "140ms", animationDuration: "400ms" }}
      >
        <div className="flex items-center gap-2.5">
          <Calendar size={15} className="text-text-sub shrink-0" strokeWidth={1.75} />
          <div>
            <p className="text-[12px] text-text-sub">Date &amp; time</p>
            <p className="text-[14px] font-medium text-text-main">{dateLabel}, {data.assignedSlot}</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <User size={15} className="text-text-sub shrink-0" strokeWidth={1.75} />
          <div>
            <p className="text-[12px] text-text-sub">Patient</p>
            <p className="text-[14px] font-medium text-text-main">{forLabel}</p>
          </div>
        </div>
      </div>

      {/* Trust note */}
      <p
        className="text-[13px] text-text-sub animate-fadeInDown"
        style={{ animationDelay: "200ms", animationDuration: "400ms" }}
      >
        If you need to reschedule or cancel, you can do so anytime from your Consultations page.
      </p>

      {/* CTA */}
      <button
        type="button"
        onClick={() => {
          onClose?.();
          router.push("/patient/consultations");
        }}
        className="w-full h-11 rounded-lg bg-text-main text-brand-sub text-[14px] font-medium
          hover:opacity-90 active:scale-[0.99] transition-all duration-200 animate-fadeInDown"
        style={{ animationDelay: "240ms", animationDuration: "400ms" }}
      >
        View my consultations
      </button>

    </div>
  );
}
