"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Calendar, Clock, Video, CalendarPlus, RotateCcw, X, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import type { Consultation, ConsultationDoctor } from "@/types/consultation";
import type { Doctor, DoctorAvailability } from "@/types/doctor";
import { RescheduleModal } from "@/components/patient/booking/RescheduleModal";
import { CancelModal }     from "@/components/patient/consultations/CancelModal";

// -- Avatar --------------------------------------------------------------------

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

// -- toDoctorType helper -------------------------------------------------------

function toDoctorType(cd: ConsultationDoctor): Doctor {
  return {
    doctorProfileId:   cd.doctorProfileId,
    userId:            cd.userId,
    name:              cd.name,
    profileImage:      cd.profileImage,
    specializations:   cd.specializations,
    consultationFee:   cd.consultationFee,
    languages:         [],
    city:              null,
    yearsOfExperience: null,
    licenseNumber:     null,
    bio:               null,
    education:         null,
    certifications:    [],
    affiliations:      [],
    rating:            0,
    totalReviews:      0,
    availability:      cd.availability as DoctorAvailability[],
    nextAvailableLabel:"",
    isAvailableToday:  false,
    todayHours:        null,
    isSaved:           false,
  };
}

// -- Skeleton ------------------------------------------------------------------

function Skeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {[0, 1, 2].map(i => (
        <div key={i} className="bg-bg-main rounded-xl border border-elements p-5 flex flex-col min-h-50 animate-pulse">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-elements/60 shrink-0" />
            <div className="flex flex-col gap-2 flex-1">
              <div className="h-4 w-40 rounded bg-elements/60" />
              <div className="h-3 w-24 rounded bg-elements/40" />
            </div>
          </div>
          <div className="h-px bg-elements/50 my-3" />
          <div className="h-4 w-48 rounded bg-elements/40" />
          <div className="mt-auto pt-4 flex justify-end">
            <div className="h-9 w-24 rounded-lg bg-elements/40" />
          </div>
        </div>
      ))}
    </div>
  );
}

// -- Empty state ---------------------------------------------------------------

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

// -- Card ----------------------------------------------------------------------

function buildCalendarUrl(doctorName: string, scheduledAt: string, durationMinutes: number) {
  const start  = new Date(scheduledAt);
  const end    = new Date(start.getTime() + durationMinutes * 60_000);
  const fmt    = (d: Date) => format(d, "yyyyMMdd'T'HHmmss");
  const params = new URLSearchParams({
    action:   "TEMPLATE",
    text:     `Consultation with Dr. ${doctorName}`,
    dates:    `${fmt(start)}/${fmt(end)}`,
    details:  "SwiftCare telehealth consultation",
    location: "SwiftCare",
  });
  return `https://www.google.com/calendar/render?${params.toString()}`;
}

function ConsultationCard({
  consultation,
  onReschedule,
  onCancel,
}: {
  consultation: Consultation;
  onReschedule: (c: Consultation) => void;
  onCancel:     (c: Consultation) => void;
}) {
  const router = useRouter();
  const { doctor, scheduledAt, durationMinutes, status } = consultation;

  const scheduledDate = new Date(scheduledAt);
  const diffMs        = scheduledDate.getTime() - Date.now();
  const canEnter      = status === "ongoing" || diffMs <= 15 * 60_000;
  const isMissed      = diffMs < 0 && (status === "pending" || status === "confirmed");
  const dateLabel     = format(scheduledDate, "EEEE, MMMM d");
  const timeLabel     = format(scheduledDate, "h:mm aa");

  return (
    <div className="bg-bg-main rounded-xl border border-elements flex flex-col h-full
      overflow-hidden hover:shadow-sm transition-shadow duration-200 animate-fadeInDown">

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">

        {/* Doctor info */}
        <div className="flex items-center gap-4 min-w-0">
          <DoctorAvatar doctor={doctor} />
          <div className="min-w-0">
            <p className="text-[16px] font-medium text-text-main truncate">Dr. {doctor.name}</p>
            <p className="text-[16px] text-text-sub mt-0.5 truncate">
              {doctor.specializations[0] ?? "General Practitioner"}
            </p>
          </div>
        </div>

        <div className="h-px bg-elements/50 my-3" />

        {/* Date + time */}
        <div className="flex items-center gap-2">
          <Calendar size={14} className="text-text-sub shrink-0" strokeWidth={2} />
          <span className="text-[14px]">
            <span className="text-text-main">{dateLabel}</span>
            <span className="text-text-sub"> at </span>
            <span className="text-text-main">{timeLabel}</span>
          </span>
        </div>

        {isMissed && (
          <div className="flex items-center gap-2">
            <Clock size={13} className="text-text-sub shrink-0" strokeWidth={2} />
            <span className="text-[14px] text-error">Missed</span>
          </div>
        )}
      </div>

      {/* Flush footer */}
      <div className="flex border-t border-elements">
        {canEnter ? (
          <button
            type="button"
            onClick={() => router.push(`/patient/consultations/${consultation.id}/waiting-room`)}
            className="flex-1 py-3 bg-brand text-white flex items-center justify-center gap-2
              text-[14px] font-medium hover:opacity-90 active:opacity-80 transition-all duration-200"
          >
            <Video size={14} strokeWidth={2} />
            Enter waiting room
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={() => onCancel(consultation)}
              className="flex-1 py-3 flex items-center justify-center gap-2
                text-[14px] font-medium text-text-main hover:bg-bg-sub
                transition-colors duration-200 border-r border-elements"
            >
              <X size={13} strokeWidth={2} />
              Cancel
            </button>
            <button
              type="button"
              onClick={() => onReschedule(consultation)}
              className="flex-1 py-3 flex items-center justify-center gap-2
                text-[14px] font-medium text-text-main hover:bg-bg-sub
                transition-colors duration-200 border-r border-elements"
            >
              <RotateCcw size={13} strokeWidth={2} />
              Reschedule
            </button>
            <a
              href={buildCalendarUrl(doctor.name, scheduledAt, durationMinutes)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-3 bg-brand text-white flex items-center justify-center gap-2
                text-[14px] font-medium hover:opacity-90 active:opacity-80 transition-all duration-200"
            >
              <CalendarPlus size={13} strokeWidth={2} />
              Add to calendar
            </a>
          </>
        )}
      </div>
    </div>
  );
}

// -- Main component ------------------------------------------------------------

export function UpcomingAppointmentCard() {
  const [loading,          setLoading]          = useState(true);
  const [consultations,    setConsultations]    = useState<Consultation[]>([]);
  const [rescheduleTarget, setRescheduleTarget] = useState<Consultation | null>(null);
  const [cancelTarget,     setCancelTarget]     = useState<Consultation | null>(null);

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

  useEffect(() => { fetchConsultations(); }, []);

  if (loading) return <Skeleton />;
  if (consultations.length === 0) return <EmptyState />;

  return (
    <>
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {consultations.map(c => (
            <ConsultationCard key={c.id} consultation={c} onReschedule={setRescheduleTarget} onCancel={setCancelTarget} />
          ))}
        </div>

        {/* View all — outline button with animated arrow */}
        <div className="flex justify-end">
          <Link
            href="/patient/consultations"
            className="group inline-flex items-center gap-1.5 h-9 px-4 rounded-lg
              border border-elements text-[16px] font-medium text-text-main
              hover:border-text-sub/60 hover:bg-bg-sub active:scale-[0.98]
              transition-all duration-200"
          >
            View all consultations
            <ArrowRight
              size={14}
              strokeWidth={2}
              className="group-hover:animate-arrow-slide"
            />
          </Link>
        </div>
      </div>

      {rescheduleTarget && (
        <RescheduleModal
          doctor={toDoctorType(rescheduleTarget.doctor)}
          appointmentId={rescheduleTarget.id}
          isOpen={true}
          onClose={() => setRescheduleTarget(null)}
          onRescheduled={() => { setRescheduleTarget(null); fetchConsultations(); }}
        />
      )}

      <CancelModal
        consultation={cancelTarget}
        onClose={() => setCancelTarget(null)}
        onCancelled={() => { setCancelTarget(null); fetchConsultations(); }}
      />
    </>
  );
}
