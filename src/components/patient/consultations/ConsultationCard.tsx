"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar, Clock, Video, ArrowRight, RotateCcw, X, CalendarPlus,
} from "lucide-react";
import { format } from "date-fns";
import type { Consultation, ConsultationDoctor } from "@/types/consultation";

// -- Avatar helpers ------------------------------------------------------------

const AVATAR_COLORS = [
  { bg: "bg-[#E8F4F8]", text: "text-[#2196A0]" },
  { bg: "bg-[#FFF3E0]", text: "text-[#E65100]" },
  { bg: "bg-[#F3E5F5]", text: "text-[#7B1FA2]" },
  { bg: "bg-[#E8F5E9]", text: "text-[#2E7D32]" },
  { bg: "bg-[#FBE9E7]", text: "text-[#BF360C]" },
  { bg: "bg-[#E3F2FD]", text: "text-[#1565C0]" },
];

function hashColor(str: string) {
  let h = 0;
  for (const c of str) h = (h * 31 + c.charCodeAt(0)) & 0xffff;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

function DoctorAvatar({ doctor, size = 44 }: { doctor: ConsultationDoctor; size?: number }) {
  const initials = doctor.name
    .split(" ")
    .map(n => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const { bg, text } = hashColor(doctor.userId);

  if (doctor.profileImage) {
    return (
      <img
        src={doctor.profileImage}
        alt={doctor.name}
        className="rounded-full object-cover shrink-0"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className={`rounded-full flex items-center justify-center shrink-0 ${bg}`}
      style={{ width: size, height: size }}
    >
      <span className={`text-[14px] font-medium select-none ${text}`}>{initials}</span>
    </div>
  );
}

// -- Status badges -------------------------------------------------------------

function StatusBadge({ status }: { status: Consultation["status"] }) {
  const map: Record<string, { label: string; cls: string }> = {
    pending:    { label: "Pending",    cls: "bg-amber-50 text-amber-600" },
    confirmed:  { label: "Confirmed",  cls: "bg-brand-sub text-brand" },
    ongoing:    { label: "Ongoing",    cls: "bg-brand-sub text-brand" },
    completed:  { label: "Completed",  cls: "bg-green-50 text-green-600" },
    cancelled:  { label: "Cancelled",  cls: "bg-red-50 text-error" },
    rescheduled:{ label: "Rescheduled",cls: "bg-red-50 text-error" },
    no_show:    { label: "No-show",    cls: "bg-red-50 text-error" },
  };
  const { label, cls } = map[status] ?? { label: status, cls: "bg-bg-sub text-text-sub" };
  return (
    <span className={`text-[14px] font-medium px-2.5 py-1 rounded-full ${cls}`}>
      {label}
    </span>
  );
}

function PaymentBadge({ status }: { status: "pending" | "paid" }) {
  return status === "paid"
    ? <span className="text-[14px] font-medium px-2.5 py-1 rounded-full bg-green-50 text-green-600">Paid</span>
    : <span className="text-[14px] font-medium px-2.5 py-1 rounded-full bg-amber-50 text-amber-600">Payment pending</span>;
}

// -- Countdown -----------------------------------------------------------------

function Countdown({ scheduledAt }: { scheduledAt: string }) {
  const [label, setLabel] = useState("");

  useEffect(() => {
    function update() {
      const diff = new Date(scheduledAt).getTime() - Date.now();
      if (diff <= 0) {
        setLabel("Starting now");
        return;
      }
      const mins  = Math.floor(diff / 60_000);
      const hours = Math.floor(mins / 60);
      if (mins < 60) {
        setLabel(`Starting in ${mins} ${mins === 1 ? "minute" : "minutes"}`);
      } else {
        setLabel(`Starting in ${hours} ${hours === 1 ? "hour" : "hours"}`);
      }
    }
    update();
    const id = setInterval(update, 30_000);
    return () => clearInterval(id);
  }, [scheduledAt]);

  if (!label) return null;

  return (
    <div className="flex items-center gap-2">
      <Clock size={13} className="text-brand shrink-0" strokeWidth={1.75} />
      <span className="text-[14px] text-brand font-medium">{label}</span>
    </div>
  );
}

// -- Skeleton ------------------------------------------------------------------

export function ConsultationCardSkeleton() {
  return (
    <div className="bg-bg-main rounded-xl border border-elements p-5 flex flex-col gap-4 animate-pulse">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-elements/60 shrink-0" />
          <div className="flex flex-col gap-1.5">
            <div className="h-4 w-36 rounded bg-elements/60" />
            <div className="h-3 w-24 rounded bg-elements/40" />
          </div>
        </div>
        <div className="flex gap-2">
          <div className="h-6 w-20 rounded-full bg-elements/40" />
          <div className="h-6 w-28 rounded-full bg-elements/40" />
        </div>
      </div>
      <div className="h-px bg-elements/50" />
      <div className="h-4 w-56 rounded bg-elements/40" />
      <div className="flex gap-2 pt-1">
        <div className="h-9 w-28 rounded-lg bg-elements/40" />
        <div className="h-9 w-28 rounded-lg bg-elements/40" />
      </div>
    </div>
  );
}

// -- Google Calendar link ------------------------------------------------------

function buildCalendarUrl(doctorName: string, scheduledAt: string, durationMinutes: number) {
  const start    = new Date(scheduledAt);
  const end      = new Date(start.getTime() + durationMinutes * 60_000);
  const fmt      = (d: Date) => format(d, "yyyyMMdd'T'HHmmss");
  const params   = new URLSearchParams({
    action:   "TEMPLATE",
    text:     `Consultation with Dr. ${doctorName}`,
    dates:    `${fmt(start)}/${fmt(end)}`,
    details:  "SwiftCare telehealth consultation",
    location: "SwiftCare",
  });
  return `https://www.google.com/calendar/render?${params.toString()}`;
}

// -- Main card -----------------------------------------------------------------

interface Props {
  consultation: Consultation;
  tab: "upcoming" | "past" | "cancelled";
  onReschedule:  (c: Consultation) => void;
  onCancel:      (c: Consultation) => void;
  onBookAgain:   (c: Consultation) => void;
}

export function ConsultationCard({
  consultation,
  tab,
  onReschedule,
  onCancel,
  onBookAgain,
}: Props) {
  const router = useRouter();
  const { doctor, scheduledAt, durationMinutes, status, paymentStatus } = consultation;

  const scheduledDate  = new Date(scheduledAt);
  const now            = Date.now();
  const diffMs         = scheduledDate.getTime() - now;
  const within15min    = diffMs <= 15 * 60_000;
  const within24h      = diffMs > 0 && diffMs <= 24 * 60 * 60_000;

  const isThisYear = scheduledDate.getFullYear() === new Date().getFullYear();
  const dateLabel  = format(scheduledDate, isThisYear ? "EEEE, MMMM d" : "EEEE, MMMM d, yyyy");
  const timeLabel = format(scheduledDate, "h:mm aa");

  return (
    <div className="bg-bg-main rounded-xl border border-elements flex flex-col h-full
      animate-fadeInDown transition-shadow duration-200 hover:shadow-sm overflow-hidden">

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        {/* Badges */}
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={status} />
          {tab === "upcoming" && <PaymentBadge status={paymentStatus} />}
        </div>

        {/* Doctor info */}
        <div className="flex items-center gap-4 min-w-0 mt-3">
          <DoctorAvatar doctor={doctor} size={56} />
          <div className="min-w-0">
            <p className="text-[16px] font-medium text-text-main truncate">
              Dr. {doctor.name}
            </p>
            <p className="text-[14px] text-text-sub mt-0.5 truncate">
              {doctor.specializations[0] ?? "General Practitioner"}
            </p>
          </div>
        </div>

        <div className="h-px bg-elements/50 my-4" />

        {/* Date + time */}
        <div className="flex items-center gap-2">
          <Calendar size={14} className="text-text-sub shrink-0" strokeWidth={1.75} />
          <span className="text-[14px] text-text-main">
            {dateLabel}
            <span className="text-text-sub"> · {timeLabel}</span>
          </span>
        </div>

        {/* Countdown (only within 24h, upcoming) */}
        {tab === "upcoming" && within24h && (
          <div className="mt-3">
            <Countdown scheduledAt={scheduledAt} />
          </div>
        )}
      </div>

      {/* Footer actions */}
      <div className="flex border-t border-elements">
        {tab === "upcoming" && (within15min || status === "ongoing") ? (
          <button
            type="button"
            onClick={() => router.push(`/patient/consultations/${consultation.id}/waiting-room`)}
            className="flex-1 py-3 bg-brand text-white flex items-center justify-center gap-2
              text-[14px] font-medium hover:opacity-90 active:opacity-80 transition-all duration-200"
          >
            <Video size={14} strokeWidth={1.75} />
            Enter waiting room
          </button>
        ) : tab === "upcoming" ? (
          <>
            <button
              type="button"
              onClick={() => onCancel(consultation)}
              className="flex-1 py-3 text-[14px] font-medium text-error
                hover:bg-bg-sub transition-colors duration-200 border-r border-elements"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => onReschedule(consultation)}
              className="flex-1 py-3 flex items-center justify-center gap-2
                text-[14px] font-medium text-text-main hover:bg-bg-sub
                transition-colors duration-200 border-r border-elements"
            >
              <RotateCcw size={13} strokeWidth={1.75} />
              Reschedule
            </button>
            <a
              href={buildCalendarUrl(doctor.name, scheduledAt, durationMinutes)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-3 bg-brand text-white flex items-center justify-center gap-2
                text-[14px] font-medium hover:opacity-90 active:opacity-80 transition-all duration-200"
            >
              <CalendarPlus size={13} strokeWidth={1.75} />
              Add to calendar
            </a>
          </>
        ) : tab === "past" ? (
          <>
            <button
              type="button"
              onClick={() => router.push(`/patient/records`)}
              className="flex-1 py-3 flex items-center justify-center gap-2
                text-[14px] font-medium text-text-main hover:bg-bg-sub
                transition-colors duration-200 border-r border-elements"
            >
              View records
              <ArrowRight size={13} strokeWidth={1.75} />
            </button>
            <button
              type="button"
              onClick={() => onBookAgain(consultation)}
              className="flex-1 py-3 bg-text-main text-brand-sub flex items-center justify-center
                text-[14px] font-medium hover:opacity-90 active:opacity-80 transition-all duration-200"
            >
              Book again
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => onBookAgain(consultation)}
            className="flex-1 py-3 bg-text-main text-brand-sub flex items-center justify-center
              text-[14px] font-medium hover:opacity-90 active:opacity-80 transition-all duration-200"
          >
            Book again
          </button>
        )}
      </div>
    </div>
  );
}
