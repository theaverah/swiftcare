"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Calendar, Video, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import type { Consultation, ConsultationDoctor } from "@/types/consultation";

// ── Avatar ────────────────────────────────────────────────────────────────────

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

function DoctorAvatar({ doctor }: { doctor: ConsultationDoctor }) {
  const initials = doctor.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  const { bg, text } = hashColor(doctor.userId);
  if (doctor.profileImage) {
    return <img src={doctor.profileImage} alt={doctor.name} className="w-14 h-14 rounded-full object-cover shrink-0" />;
  }
  return (
    <div className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 ${bg}`}>
      <span className={`text-[14px] font-medium select-none ${text}`}>{initials}</span>
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {[0, 1].map(i => (
        <div key={i} className="bg-bg-main rounded-xl border border-elements p-5 flex flex-col min-h-50 animate-pulse">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-elements/60 shrink-0" />
            <div className="flex flex-col gap-2 flex-1">
              <div className="h-4 w-40 rounded bg-elements/60" />
              <div className="h-3 w-24 rounded bg-elements/40" />
            </div>
          </div>
          <div className="h-px bg-elements/50 my-4" />
          <div className="h-4 w-48 rounded bg-elements/40" />
          <div className="mt-auto pt-4 flex justify-end">
            <div className="h-9 w-24 rounded-lg bg-elements/40" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-4 py-12 px-6 rounded-xl border border-elements bg-bg-main text-center">
      <img src="/illustrations/no-data.svg" alt="" aria-hidden className="w-52 max-w-full select-none opacity-90" />
      <div className="flex flex-col gap-1">
        <p className="text-[16px] font-medium text-text-main">No upcoming consultations</p>
        <Link href="/patient/doctors" className="text-[16px] text-brand hover:underline transition-colors duration-200">
          Book your first consultation
        </Link>
      </div>
    </div>
  );
}

// ── Card ──────────────────────────────────────────────────────────────────────

function ConsultationCard({ consultation }: { consultation: Consultation }) {
  const router = useRouter();
  const { doctor, scheduledAt, status } = consultation;

  const scheduledDate = new Date(scheduledAt);
  const diffMs        = scheduledDate.getTime() - Date.now();
  const canEnter      = status === "ongoing" || diffMs <= 15 * 60_000;
  const dateLabel     = format(scheduledDate, "EEEE, MMMM d");
  const timeLabel     = format(scheduledDate, "h:mm aa");

  const statusMap: Record<string, { label: string; cls: string }> = {
    confirmed: { label: "Confirmed", cls: "bg-brand-sub text-brand" },
    ongoing:   { label: "Ongoing",   cls: "bg-brand-sub text-brand" },
    pending:   { label: "Pending",   cls: "bg-amber-50 text-amber-600" },
  };
  const badge = statusMap[status] ?? statusMap.confirmed;

  return (
    <div className="bg-bg-main rounded-xl border border-elements p-5 flex flex-col h-full
      hover:shadow-sm transition-shadow duration-200">

      {/* Doctor info */}
      <div className="flex items-center gap-4 min-w-0">
        <DoctorAvatar doctor={doctor} />
        <div className="min-w-0">
          <p className="text-[16px] font-medium text-text-main truncate">Dr. {doctor.name}</p>
          <p className="text-[13px] text-text-sub mt-0.5 truncate">
            {doctor.specializations[0] ?? "General Practitioner"}
          </p>
        </div>
        <span className={`ml-auto shrink-0 text-[11px] font-medium px-2.5 py-1 rounded-full ${badge.cls}`}>
          {badge.label}
        </span>
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

      {/* Action — pinned to bottom right */}
      <div className="mt-auto pt-4 flex justify-end">
        <button
          type="button"
          onClick={() => canEnter
            ? router.push(`/patient/consultations/${consultation.id}/waiting-room`)
            : router.push(`/patient/consultations`)
          }
          className={`flex items-center gap-1.5 h-9 px-4 rounded-lg text-[13px] font-medium
            transition-all duration-200 active:scale-[0.99] ${
            canEnter
              ? "bg-brand text-white hover:opacity-90"
              : "border border-elements text-text-main hover:bg-bg-sub"
          }`}
        >
          {canEnter ? (
            <><Video size={13} strokeWidth={1.75} /> Join</>
          ) : (
            <>View <ArrowRight size={13} strokeWidth={1.75} /></>
          )}
        </button>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function UpcomingAppointmentCard() {
  const [loading,       setLoading]       = useState(true);
  const [consultations, setConsultations] = useState<Consultation[]>([]);

  useEffect(() => {
    async function fetchConsultations() {
      try {
        const res = await fetch("/api/patient/consultations");
        if (!res.ok) throw new Error();
        const data = await res.json() as { consultations: Consultation[] };

        const now      = Date.now();
        const upcoming = (data.consultations ?? [])
          .filter(c =>
            (c.status === "confirmed" || c.status === "ongoing") &&
            new Date(c.scheduledAt).getTime() > now - 30 * 60_000
          )
          .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
          .slice(0, 4);

        setConsultations(upcoming);
      } catch {
        setConsultations([]);
      } finally {
        setLoading(false);
      }
    }
    fetchConsultations();
  }, []);

  if (loading) return <Skeleton />;
  if (consultations.length === 0) return <EmptyState />;

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {consultations.map(c => (
          <ConsultationCard key={c.id} consultation={c} />
        ))}
      </div>
      <Link
        href="/patient/consultations"
        className="text-[13px] text-text-sub hover:text-text-main transition-colors duration-200 text-right"
      >
        View all consultations →
      </Link>
    </div>
  );
}
