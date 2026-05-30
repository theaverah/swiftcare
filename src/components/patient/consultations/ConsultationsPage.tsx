"use client";

import { useState, useEffect, useCallback, useRef, useLayoutEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowUpDown, Check, ChevronDown } from "lucide-react";
import type { Consultation, ConsultationDoctor } from "@/types/consultation";
import type { Doctor, DoctorAvailability } from "@/types/doctor";
import { ConsultationCard, ConsultationCardSkeleton } from "./ConsultationCard";
import { CancelModal }      from "./CancelModal";
import { BookingModal }     from "@/components/patient/booking/BookingModal";
import { RescheduleModal }  from "@/components/patient/booking/RescheduleModal";

// -- Tab types -----------------------------------------------------------------

type Tab = "upcoming" | "past" | "cancelled" | "all";
type SortOrder = "desc" | "asc";

const TABS: { key: Tab; label: string }[] = [
  { key: "upcoming",  label: "Upcoming" },
  { key: "past",      label: "Past" },
  { key: "cancelled", label: "Cancelled" },
  { key: "all",       label: "All" },
];

// -- Helpers -------------------------------------------------------------------

function filterByTab(consultations: Consultation[], tab: Tab): Consultation[] {
  if (tab === "all") return consultations;
  const upcoming  = ["pending", "confirmed", "ongoing"];
  const past      = ["completed", "no_show"];
  const cancelled = ["cancelled", "rescheduled"];
  return consultations.filter(c =>
    tab === "upcoming"  ? upcoming.includes(c.status)  :
    tab === "past"      ? past.includes(c.status)       :
    cancelled.includes(c.status)
  );
}

// -- Sort chip -----------------------------------------------------------------

function SortChip({ order, onChange, isUpcoming }: { order: SortOrder; onChange: (v: SortOrder) => void; isUpcoming: boolean }) {
  const [open, setOpen] = useState(false);
  const ref             = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const isActive = isUpcoming ? order === "desc" : order === "asc";
  const label    = isUpcoming
    ? (order === "asc" ? "Soonest first" : "Latest first")
    : (order === "desc" ? "Newest first" : "Oldest first");

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className={`h-8.5 px-3.5 flex items-center gap-2 rounded-lg text-[14px] font-normal
          transition-all duration-200 whitespace-nowrap border select-none
          ${isActive
            ? "bg-brand-sub border-brand text-brand"
            : "border-transparent text-text-main"
          }`}
      >
        <ArrowUpDown size={13} strokeWidth={1.75} className="shrink-0" />
        {label}
        <ChevronDown size={11} strokeWidth={1.75}
          className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 bg-bg-main border border-elements
          rounded-xl shadow-lg overflow-hidden w-44">
          {(["asc", "desc"] as SortOrder[]).map(opt => {
            const optLabel = isUpcoming
              ? (opt === "asc" ? "Soonest first" : "Latest first")
              : (opt === "desc" ? "Newest first" : "Oldest first");
            return (
              <button
                key={opt}
                type="button"
                onClick={() => { onChange(opt); setOpen(false); }}
                className="w-full px-4 py-2.5 text-left text-[14px] flex items-center justify-between
                  hover:bg-bg-sub transition-colors duration-150"
              >
                <span className={opt === order ? "text-brand font-medium" : "text-text-main"}>
                  {optLabel}
                </span>
                {opt === order && <Check size={13} strokeWidth={1.75} className="text-brand shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
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

// -- Empty state ---------------------------------------------------------------

function EmptyState({ tab }: { tab: Tab }) {
  if (tab === "all") {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <img src="/illustrations/no-data.svg" alt="" aria-hidden className="w-66 max-w-full select-none opacity-90" />
        <p className="text-[16px] font-medium text-text-main">No consultations yet.</p>
      </div>
    );
  }
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

// -- Main component ------------------------------------------------------------

interface BookingTarget {
  doctor:          Doctor;
  rescheduleMode:  boolean;
  appointmentId?:  string;
}

export function ConsultationsPage() {
  const [tab,           setTab]           = useState<Tab>("upcoming");
  // upcoming → soonest first (asc); everything else → most recently completed first (desc)
  const [sortOrder,     setSortOrder]     = useState<SortOrder>("asc");

  function handleTabChange(t: Tab) {
    setTab(t);
    setSortOrder(t === "upcoming" ? "asc" : "desc");
  }
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [cancelTarget,     setCancelTarget]     = useState<Consultation | null>(null);
  const [rescheduleTarget, setRescheduleTarget] = useState<Consultation | null>(null);
  const [booking,          setBooking]          = useState<BookingTarget | null>(null);
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

  function handleRestored(id: string, prevStatus: Consultation["status"]) {
    setConsultations(prev =>
      prev.map(c => c.id === id ? { ...c, status: prevStatus } : c)
    );
  }

  function openReschedule(c: Consultation) {
    setRescheduleTarget(c);
  }

  function openBookAgain(c: Consultation) {
    setBooking({
      doctor:         toDoctorType(c.doctor),
      rescheduleMode: false,
    });
  }

  const filtered = filterByTab(consultations, tab).slice().sort((a, b) => {
    const diff = new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime();
    return sortOrder === "desc" ? -diff : diff;
  });
  const tabCounts: Record<Tab, number> = {
    upcoming:  filterByTab(consultations, "upcoming").length,
    past:      filterByTab(consultations, "past").length,
    cancelled: filterByTab(consultations, "cancelled").length,
    all:       consultations.length,
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

      {/* Tabs + Sort */}
      <div
        className="relative z-10 flex items-end justify-between border-b border-elements animate-fadeInDown"
        style={{ animationDelay: "60ms", animationDuration: "400ms" }}
      >
        {/* Tabs with sliding indicator */}
        <div ref={tabsRef} className="relative flex">
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
                onClick={() => handleTabChange(key)}
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

        {/* Sort chip */}
        <div className="pb-2">
          <SortChip order={sortOrder} onChange={setSortOrder} isUpcoming={tab === "upcoming"} />
        </div>
      </div>

      {/* Content */}
      <div key={tab} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-tabIn">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <ConsultationCardSkeleton key={i} />
          ))
        ) : filtered.length === 0 ? (
          <div className="col-span-full">
            <EmptyState tab={tab} />
          </div>
        ) : (
          filtered.map((c, i) => (
            <div
              key={c.id}
              className="animate-fadeInDown h-full"
              style={{ animationDelay: `${i * 60}ms`, animationDuration: "400ms" }}
            >
              <ConsultationCard
                consultation={c}
                tab={tab === "all"
                  ? (["pending","confirmed","ongoing"].includes(c.status) ? "upcoming"
                    : ["completed","no_show"].includes(c.status) ? "past"
                    : "cancelled")
                  : tab}
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
        onRestored={handleRestored}
      />

      {/* Reschedule modal */}
      {rescheduleTarget && (
        <RescheduleModal
          doctor={toDoctorType(rescheduleTarget.doctor)}
          appointmentId={rescheduleTarget.id}
          isOpen={true}
          onClose={() => setRescheduleTarget(null)}
          onRescheduled={() => fetchConsultations()}
        />
      )}

      {/* Book again modal */}
      {booking && (
        <BookingModal
          doctor={booking.doctor}
          isOpen={true}
          onClose={() => setBooking(null)}
          onRescheduled={() => {
            fetchConsultations();
            toast.success("Consultation booked.");
          }}
        />
      )}
    </div>
  );
}
