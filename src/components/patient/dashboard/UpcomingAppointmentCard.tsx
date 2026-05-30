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
    return <img src={doctor.profileImage} alt={doctor.name} className="w-11 h-11 rounded-full object-cover shrink-0" />;
  }
  return (
    <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${bg}`}>
      <span className={`text-[13px] font-medium select-none ${text}`}>{initials}</span>
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="flex flex-col gap-3">
      {[0, 1].map(i => (
        <div key={i} className="flex items-center gap-4 p-4 rounded-xl border border-elements bg-bg-main animate-pulse">
          <div className="w-11 h-11 rounded-full bg-elements/60 shrink-0" />
          <div className="flex-1 flex flex-col gap-2">
            <div className="h-4 w-40 rounded bg-elements/60" />
            <div className="h-3 w-28 rounded bg-elements/40" />
          </div>
          <div className="h-3 w-24 rounded bg-elements/40" />
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

// ── Single consultation row ───────────────────────────────────────────────────

function ConsultationRow({ consultation }: { consultation: Consultation }) {
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
    <div className="flex items-center gap-4 p-4 rounded-xl border border-elements bg-bg-main
      hover:shadow-sm transition-shadow duration-200">

      <DoctorAvatar doctor={doctor} />

      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-medium text-text-main truncate">Dr. {doctor.name}</p>
        <p className="text-[13px] text-text-sub truncate mt-0.5">
          {doctor.specializations[0] ?? "General Practitioner"}
        </p>
      </div>

      <div className="flex flex-col items-end gap-1.5 shrink-0">
        <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${badge.cls}`}>
          {badge.label}
        </span>
        <span className="flex items-center gap-1 text-[12px] text-text-sub">
          <Calendar size={11} strokeWidth={1.75} />
          {dateLabel} · {timeLabel}
        </span>
      </div>

      <button
        type="button"
        onClick={() => canEnter
          ? router.push(`/patient/consultations/${consultation.id}/waiting-room`)
          : router.push(`/patient/consultations`)
        }
        className={`flex items-center gap-1.5 h-9 px-4 rounded-lg text-[13px] font-medium shrink-0
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

        const now     = Date.now();
        const upcoming = (data.consultations ?? [])
          .filter(c =>
            (c.status === "confirmed" || c.status === "ongoing") &&
            new Date(c.scheduledAt).getTime() > now - 30 * 60_000
          )
          .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
          .slice(0, 3);

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
      {consultations.map(c => (
        <ConsultationRow key={c.id} consultation={c} />
      ))}
      <Link
        href="/patient/consultations"
        className="text-[13px] text-text-sub hover:text-text-main transition-colors duration-200 text-right"
      >
        View all consultations →
      </Link>
    </div>
  );
}
