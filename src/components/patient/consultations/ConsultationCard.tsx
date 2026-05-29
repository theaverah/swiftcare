"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar, Clock, Video, ArrowRight, RotateCcw, X,
} from "lucide-react";
import { format } from "date-fns";
import type { Consultation, ConsultationDoctor } from "@/types/consultation";

// ── Avatar helpers ────────────────────────────────────────────────────────────

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

// ── Status badges ─────────────────────────────────────────────────────────────

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
    <span className={`text-[12px] font-medium px-2.5 py-1 rounded-full ${cls}`}>
      {label}
    </span>
  );
}

function PaymentBadge({ status }: { status: "pending" | "paid" }) {
  return status === "paid"
    ? <span className="text-[12px] font-medium px-2.5 py-1 rounded-full bg-green-50 text-green-600">Paid</span>
    : <span className="text-[12px] font-medium px-2.5 py-1 rounded-full bg-amber-50 text-amber-600">Payment pending</span>;
}

// ── Countdown ─────────────────────────────────────────────────────────────────

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
      <span className="text-[13px] text-brand font-medium">{label}</span>
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

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

// ── Main card ─────────────────────────────────────────────────────────────────

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

  const dateLabel = format(scheduledDate, "EEEE, MMMM d, yyyy");
  const timeLabel = format(scheduledDate, "h:mm aa");

  return (
    <div className="bg-bg-main rounded-xl border border-elements p-5 flex flex-col gap-4
      animate-fadeInDown transition-shadow duration-200 hover:shadow-sm">

      {/* Top row: doctor info + badges */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <DoctorAvatar doctor={doctor} />
          <div className="min-w-0">
            <p className="text-[15px] font-medium text-text-main truncate">
              Dr. {doctor.name}
            </p>
            <p className="text-[13px] text-text-sub truncate">
              {doctor.specializations[0] ?? "General Practitioner"}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <StatusBadge status={status} />
          {tab === "upcoming" && <PaymentBadge status={paymentStatus} />}
        </div>
      </div>

      <div className="h-px bg-elements/50" />

      {/* Date + time */}
      <div className="flex items-center gap-2">
        <Calendar size={14} className="text-text-sub shrink-0" strokeWidth={1.75} />
        <span className="text-[14px] text-text-main">
          {dateLabel}
          <span className="text-text-sub"> · {timeLabel}</span>
          {durationMinutes && (
            <span className="text-text-sub"> · {durationMinutes} min</span>
          )}
        </span>
      </div>

      {/* Countdown (only within 24h, upcoming) */}
      {tab === "upcoming" && within24h && (
        <Countdown scheduledAt={scheduledAt} />
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 flex-wrap">
        {tab === "upcoming" && (
          within15min || status === "ongoing" ? (
            <button
              type="button"
              onClick={() => router.push(`/patient/consultations/${consultation.id}/waiting-room`)}
              className="flex items-center gap-2 h-9 px-4 rounded-lg bg-brand text-white
                text-[13px] font-medium hover:opacity-90 active:scale-[0.99]
                transition-all duration-200"
            >
              <Video size={14} strokeWidth={1.75} />
              Enter waiting room
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => onReschedule(consultation)}
                className="flex items-center gap-2 h-9 px-4 rounded-lg border border-elements
                  text-[13px] font-medium text-text-main hover:border-text-sub/60
                  hover:bg-bg-sub transition-all duration-200"
              >
                <RotateCcw size={13} strokeWidth={1.75} />
                Reschedule
              </button>
              <button
                type="button"
                onClick={() => onCancel(consultation)}
                className="flex items-center gap-2 h-9 px-4 rounded-lg border border-elements
                  text-[13px] font-medium text-error hover:border-error/40
                  hover:bg-red-50 transition-all duration-200"
              >
                <X size={13} strokeWidth={1.75} />
                Cancel
              </button>
            </>
          )
        )}

        {tab === "past" && (
          <>
            <button
              type="button"
              onClick={() => router.push(`/patient/records`)}
              className="flex items-center gap-2 h-9 px-4 rounded-lg border border-elements
                text-[13px] font-medium text-text-main hover:border-text-sub/60
                hover:bg-bg-sub transition-all duration-200"
            >
              View records
              <ArrowRight size={13} strokeWidth={1.75} />
            </button>
            <button
              type="button"
              onClick={() => onBookAgain(consultation)}
              className="flex items-center gap-2 h-9 px-4 rounded-lg bg-text-main text-brand-sub
                text-[13px] font-medium hover:opacity-90 active:scale-[0.99]
                transition-all duration-200"
            >
              Book again
            </button>
          </>
        )}

        {tab === "cancelled" && (
          <button
            type="button"
            onClick={() => onBookAgain(consultation)}
            className="flex items-center gap-2 h-9 px-4 rounded-lg bg-text-main text-brand-sub
              text-[13px] font-medium hover:opacity-90 active:scale-[0.99]
              transition-all duration-200"
          >
            Book again
          </button>
        )}
      </div>
    </div>
  );
}
