"use client";

import { useState, useEffect, useCallback, useRef, useLayoutEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import type { Consultation, ConsultationDoctor } from "@/types/consultation";
import type { Doctor, DoctorAvailability } from "@/types/doctor";
import { ConsultationCard, ConsultationCardSkeleton } from "./ConsultationCard";
import { CancelModal }    from "./CancelModal";
import { BookingModal }   from "@/components/patient/booking/BookingModal";

// ── Tab types ─────────────────────────────────────────────────────────────────

type Tab = "upcoming" | "past" | "cancelled";

const TABS: { key: Tab; label: string }[] = [
  { key: "upcoming",  label: "Upcoming" },
  { key: "past",      label: "Past" },
  { key: "cancelled", label: "Cancelled" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function filterByTab(consultations: Consultation[], tab: Tab): Consultation[] {
  const upcoming   = ["pending", "confirmed", "ongoing"];
  const past       = ["completed", "no_show"];
  const cancelled  = ["cancelled", "rescheduled"];

  return consultations.filter(c =>
    tab === "upcoming"  ? upcoming.includes(c.status)  :
    tab === "past"      ? past.includes(c.status)       :
    cancelled.includes(c.status)
  );
}

function toDoctorType(cd: ConsultationDoctor): Doctor {
  return {
    doctorProfileId:   cd.doctorProfileId,
    userId:            cd.userId,
    name:              cd.name,
    profileImage:      cd.profileImage,
    specializations:   cd.specializations,
    consultationFee:   cd.consultationFee,
    languages:         [],
    yearsOfExperience: null,
    licenseNumber:     null,
    bio:               null,
    rating:            0,
    totalReviews:      0,
    availability:      cd.availability as DoctorAvailability[],
    nextAvailableLabel:"",
    isAvailableToday:  false,
    todayHours:        null,
    isSaved:           false,
  };
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({ tab }: { tab: Tab }) {
  if (tab === "upcoming") {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <img src="/illustrations/no-data.svg" alt="" aria-hidden className="w-66 max-w-full select-none opacity-90" />
        <div className="flex flex-col gap-1">
          <p className="text-[16px] font-medium text-text-main">No upcoming consultations.</p>
          <Link
            href="/patient/doctors"
            className="text-[16px] text-brand hover:underline transition-colors"
          >
            Book your first consultation.
          </Link>
        </div>
      </div>
    );
  }

  if (tab === "past") {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <img src="/illustrations/no-data.svg" alt="" aria-hidden className="w-66 max-w-full select-none opacity-90" />
        <div className="flex flex-col gap-1">
          <p className="text-[16px] font-medium text-text-main">No past consultations yet.</p>
          <p className="text-[16px] text-text-sub">Your completed consultations will appear here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <img src="/illustrations/no-data.svg" alt="" aria-hidden className="w-66 max-w-full select-none opacity-90" />
      <div className="flex flex-col gap-1.5">
        <p className="text-[16px] font-medium text-text-main">No cancelled consultations.</p>
        <p className="text-[16px] text-text-sub">Cancelled consultations will appear here.</p>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface BookingTarget {
  doctor:          Doctor;
  rescheduleMode:  boolean;
  appointmentId?:  string;
}

export function ConsultationsPage() {
  const [tab,           setTab]           = useState<Tab>("upcoming");
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [cancelTarget,  setCancelTarget]  = useState<Consultation | null>(null);
  const [booking,       setBooking]       = useState<BookingTarget | null>(null);
  const tabsRef                           = useRef<HTMLDivElement>(null);
  const [indicator,     setIndicator]     = useState({ left: 0, width: 0 });

  useLayoutEffect(() => {
    if (!tabsRef.current) return;
    const btns = tabsRef.current.querySelectorAll<HTMLButtonElement>("button[data-tab]");
    const idx  = TABS.findIndex(t => t.key === tab);
    const btn  = btns[idx];
    if (btn) setIndicator({ left: btn.offsetLeft, width: btn.offsetWidth });
  }, [tab]);

  const fetchConsultations = useCallback(async () => {
    try {
      const res  = await fetch("/api/patient/consultations");
      const data = await res.json() as { consultations: Consultation[] };
      setConsultations(data.consultations ?? []);
    } catch {
      toast.error("Failed to load consultations.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchConsultations(); }, [fetchConsultations]);

  function handleCancelled(id: string) {
    setConsultations(prev =>
      prev.map(c => c.id === id ? { ...c, status: "cancelled" as const } : c)
    );
  }

  function openReschedule(c: Consultation) {
    setBooking({
      doctor:         toDoctorType(c.doctor),
      rescheduleMode: true,
      appointmentId:  c.id,
    });
  }

  function openBookAgain(c: Consultation) {
    setBooking({
      doctor:         toDoctorType(c.doctor),
      rescheduleMode: false,
    });
  }

  const filtered = filterByTab(consultations, tab);
  const tabCounts: Record<Tab, number> = {
    upcoming:  filterByTab(consultations, "upcoming").length,
    past:      filterByTab(consultations, "past").length,
    cancelled: filterByTab(consultations, "cancelled").length,
  };

  return (
    <div className="flex flex-col gap-8 w-full">

      {/* Header */}
      <div
        className="flex flex-col gap-1.5 animate-fadeInDown"
        style={{ animationDelay: "0ms", animationDuration: "400ms" }}
      >
        <h1 className="text-[32px] font-medium text-text-main tracking-tighter leading-tight">
          Consultations
        </h1>
        <p className="text-[16px] text-text-sub">
          Manage your upcoming, past, and cancelled consultations.
        </p>
      </div>

      {/* Tabs */}
      <div
        ref={tabsRef}
        className="relative flex border-b border-elements animate-fadeInDown"
        style={{ animationDelay: "60ms", animationDuration: "400ms" }}
      >
        {/* Sliding indicator */}
        <div
          className="absolute bottom-0 h-0.5 bg-brand transition-all duration-200 ease-out"
          style={{ left: indicator.left, width: indicator.width }}
        />

        {TABS.map(({ key, label }) => {
          const count    = tabCounts[key];
          const isActive = tab === key;
          return (
            <button
              key={key}
              data-tab={key}
              type="button"
              onClick={() => setTab(key)}
              className={`px-4 py-2.5 text-[16px] font-medium transition-colors duration-200
                flex items-center gap-2
                ${isActive ? "text-text-main" : "text-text-sub hover:text-text-main"}`}
            >
              {label}
              {!loading && count > 0 && (
                <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded-full
                  ${isActive ? "bg-brand text-white" : "bg-elements text-text-sub"}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div key={tab} className="flex flex-col gap-3 animate-tabIn">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <ConsultationCardSkeleton key={i} />
          ))
        ) : filtered.length === 0 ? (
          <EmptyState tab={tab} />
        ) : (
          filtered.map((c, i) => (
            <div
              key={c.id}
              className="animate-fadeInDown"
              style={{ animationDelay: `${i * 60}ms`, animationDuration: "400ms" }}
            >
              <ConsultationCard
                consultation={c}
                tab={tab}
                onReschedule={openReschedule}
                onCancel={setCancelTarget}
                onBookAgain={openBookAgain}
              />
            </div>
          ))
        )}
      </div>

      {/* Cancel modal */}
      <CancelModal
        consultation={cancelTarget}
        onClose={() => setCancelTarget(null)}
        onCancelled={handleCancelled}
      />

      {/* Booking/reschedule modal */}
      {booking && (
        <BookingModal
          doctor={booking.doctor}
          isOpen={true}
          onClose={() => setBooking(null)}
          rescheduleMode={booking.rescheduleMode}
          appointmentId={booking.appointmentId}
          onRescheduled={() => {
            fetchConsultations();
            toast.success("Consultation rescheduled.");
          }}
        />
      )}
    </div>
  );
}
