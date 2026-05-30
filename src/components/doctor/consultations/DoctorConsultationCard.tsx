"use client";

import { useState, useEffect } from "react";
import { Calendar, Clock, Video, FileText, FilePlus } from "lucide-react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";

// -- Countdown -----------------------------------------------------------------

function Countdown({ scheduledAt }: { scheduledAt: string }) {
  const [diff, setDiff] = useState(() => new Date(scheduledAt).getTime() - Date.now());

  useEffect(() => {
    function update() { setDiff(new Date(scheduledAt).getTime() - Date.now()); }
    const id = setInterval(update, 30_000);
    return () => clearInterval(id);
  }, [scheduledAt]);

  if (diff <= 0) return null;

  const totalMins = Math.floor(diff / 60_000);
  const hours     = Math.floor(totalMins / 60);
  const days      = Math.floor(hours / 24);

  if (days >= 1) {
    return (
      <div className="flex items-center gap-2">
        <Clock size={13} className="text-text-sub shrink-0" strokeWidth={2} />
        <span className="text-[14px] text-text-main">
          In {days} {days === 1 ? "day" : "days"}
        </span>
      </div>
    );
  }

  const label = totalMins < 60
    ? `Starting in ${totalMins} ${totalMins === 1 ? "minute" : "minutes"}`
    : `Starting in ${hours} ${hours === 1 ? "hour" : "hours"}`;

  return (
    <div className="flex items-center gap-2">
      <Clock size={13} className="text-text-sub shrink-0" strokeWidth={2} />
      <span className="text-[14px] text-brand font-medium">{label}</span>
    </div>
  );
}

// -- Types ---------------------------------------------------------------------

export interface DoctorConsultation {
  id:                  string;
  patientId:           string;
  patientName:         string;
  patientActualName:   string;
  patientProfileImage: string | null;
  chiefComplaint:      string | null;
  scheduledAt:         string;
  durationMinutes:     number;
  status:              string;
  hasRecords:          boolean;
}

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

function PatientAvatar({ name, image }: { name: string; image: string | null }) {
  const initials   = name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  const { bg, text } = hashColor(name);

  if (image) {
    return (
      <img
        src={image}
        alt={name}
        className="w-14 h-14 rounded-full object-cover shrink-0"
      />
    );
  }
  return (
    <div className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 ${bg}`}>
      <span className={`text-[15px] font-medium select-none ${text}`}>{initials}</span>
    </div>
  );
}

// -- Status badge --------------------------------------------------------------

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    pending:     { label: "Pending",     cls: "bg-amber-50 text-amber-600" },
    confirmed:   { label: "Confirmed",   cls: "bg-brand-sub text-brand" },
    ongoing:     { label: "Ongoing",     cls: "bg-brand-sub text-brand" },
    completed:   { label: "Completed",   cls: "bg-green-50 text-green-600" },
    cancelled:   { label: "Cancelled",   cls: "bg-red-50 text-error" },
    rescheduled: { label: "Rescheduled", cls: "bg-red-50 text-error" },
    no_show:     { label: "No-show",     cls: "bg-red-50 text-error" },
  };
  const { label, cls } = map[status] ?? { label: status, cls: "bg-bg-sub text-text-sub" };
  return (
    <span className={`text-[14px] font-medium px-2.5 py-1 rounded-full ${cls}`}>
      {label}
    </span>
  );
}

// -- Skeleton ------------------------------------------------------------------

export function DoctorConsultationCardSkeleton() {
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
        <div className="h-6 w-22 rounded-full bg-elements/40" />
      </div>
      <div className="h-px bg-elements/50" />
      <div className="h-4 w-56 rounded bg-elements/40" />
      <div className="flex gap-2 pt-1">
        <div className="h-9 flex-1 rounded-lg bg-elements/40" />
      </div>
    </div>
  );
}

// -- Main card -----------------------------------------------------------------

interface Props {
  consultation: DoctorConsultation;
  tab:          "upcoming" | "past";
  onAddNotes:   (c: DoctorConsultation) => void;
  onViewRecords:(c: DoctorConsultation) => void;
}

export function DoctorConsultationCard({ consultation, tab, onAddNotes, onViewRecords }: Props) {
  const router        = useRouter();
  const scheduledDate = new Date(consultation.scheduledAt);
  const isThisYear    = scheduledDate.getFullYear() === new Date().getFullYear();
  const dateLabel     = format(scheduledDate, isThisYear ? "EEEE, MMMM d" : "EEEE, MMMM d, yyyy");
  const timeLabel     = format(scheduledDate, "h:mm aa");
  const diffMs        = scheduledDate.getTime() - Date.now();
  const within30min   = diffMs <= 30 * 60 * 1000;
  const isMissed      = diffMs < 0 && (consultation.status === "pending" || consultation.status === "confirmed");

  return (
    <div className="bg-bg-main rounded-xl border border-elements flex flex-col h-full
      transition-shadow duration-200 hover:shadow-sm overflow-hidden">

      <div className="p-5 flex flex-col flex-1">
        {/* Badge */}
        <div className="flex items-center gap-2">
          <StatusBadge status={consultation.status} />
        </div>

        {/* Patient info */}
        <div className="flex items-center gap-4 min-w-0 mt-4">
          <PatientAvatar name={consultation.patientName} image={consultation.patientProfileImage} />
          <div className="min-w-0">
            <p className="text-[16px] font-medium text-text-main truncate">
              {consultation.patientName}
            </p>
            {consultation.chiefComplaint && (
              <p className="text-[14px] text-text-sub mt-0.5 truncate">
                {consultation.chiefComplaint}
              </p>
            )}
          </div>
        </div>

        <div className="h-px bg-elements/50 my-3" />

        {/* Date + time */}
        <div className="flex items-center gap-2">
          <Calendar size={14} className="text-text-sub shrink-0" strokeWidth={2} />
          <span className="text-[14px] text-text-main">
            {dateLabel}
            <span className="text-text-sub"> · {timeLabel}</span>
          </span>
        </div>

        {/* Countdown / missed */}
        {tab === "upcoming" && isMissed && (
          <div className="flex items-center gap-2 mt-1">
            <Clock size={13} className="text-text-sub shrink-0" strokeWidth={2} />
            <span className="text-[14px] text-error">Missed</span>
          </div>
        )}
        {tab === "upcoming" && !isMissed && diffMs > 0 && (
          <div className="mt-1">
            <Countdown scheduledAt={consultation.scheduledAt} />
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex border-t border-elements">
        {tab === "upcoming" ? (
          <button
            type="button"
            disabled={!within30min}
            onClick={() => router.push(`/doctor/consultations/${consultation.id}/waiting-room`)}
            title={within30min ? undefined : "Available 30 minutes before the appointment"}
            className={`flex-1 py-3 flex items-center justify-center gap-2
              text-[14px] font-medium transition-all duration-200
              ${within30min
                ? "bg-brand text-white hover:opacity-90 active:opacity-80"
                : "bg-bg-main text-text-sub cursor-not-allowed"
              }`}
          >
            <Video size={14} strokeWidth={2} />
            Enter waiting room
          </button>
        ) : consultation.hasRecords ? (
          <button
            type="button"
            onClick={() => onViewRecords(consultation)}
            className="flex-1 py-3 flex items-center justify-center gap-2
              text-[14px] font-medium text-text-main hover:bg-bg-sub transition-colors duration-200"
          >
            <FileText size={14} strokeWidth={2} />
            View records
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onAddNotes(consultation)}
            className="flex-1 py-3 bg-text-main text-brand-sub flex items-center justify-center gap-2
              text-[14px] font-medium hover:opacity-90 active:opacity-80 transition-all duration-200"
          >
            <FilePlus size={14} strokeWidth={2} />
            Add notes
          </button>
        )}
      </div>
    </div>
  );
}
