"use client";

import { useState, useEffect, useCallback, useRef, useLayoutEffect } from "react";
import { toast } from "sonner";
import { DoctorConsultationCard, DoctorConsultationCardSkeleton } from "./DoctorConsultationCard";
import type { DoctorConsultation } from "./DoctorConsultationCard";
import { AddNotesModal }   from "./AddNotesModal";
import { ViewRecordsModal } from "./ViewRecordsModal";

// -- Types ---------------------------------------------------------------------

type Tab = "upcoming" | "past";

const TABS: { key: Tab; label: string }[] = [
  { key: "upcoming", label: "Upcoming" },
  { key: "past",     label: "Past" },
];

// -- Filters -------------------------------------------------------------------

function filterByTab(consultations: DoctorConsultation[], tab: Tab): DoctorConsultation[] {
  const upcomingStatuses = ["pending", "confirmed", "ongoing"];
  const pastStatuses     = ["completed", "cancelled", "rescheduled", "no_show"];
  return consultations.filter((c) =>
    tab === "upcoming" ? upcomingStatuses.includes(c.status) : pastStatuses.includes(c.status)
  );
}

// -- Empty state ---------------------------------------------------------------

function EmptyState({ tab }: { tab: Tab }) {
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <img
        src="/illustrations/no-data.svg"
        alt=""
        aria-hidden
        className="w-66 max-w-full select-none opacity-90"
      />
      <div className="flex flex-col gap-1">
        <p className="text-[16px] font-medium text-text-main">
          {tab === "upcoming" ? "No upcoming consultations." : "No past consultations yet."}
        </p>
        <p className="text-[16px] text-text-sub">
          {tab === "upcoming"
            ? "Your confirmed appointments will appear here."
            : "Completed consultations will appear here."}
        </p>
      </div>
    </div>
  );
}

// -- Main component ------------------------------------------------------------

export function DoctorConsultationsPage() {
  const [tab,           setTab]           = useState<Tab>("upcoming");
  const [consultations, setConsultations] = useState<DoctorConsultation[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [addTarget,     setAddTarget]     = useState<DoctorConsultation | null>(null);
  const [viewTarget,    setViewTarget]    = useState<DoctorConsultation | null>(null);
  const tabsRef                           = useRef<HTMLDivElement>(null);
  const [indicator,     setIndicator]     = useState({ left: 0, width: 0 });

  useLayoutEffect(() => {
    if (!tabsRef.current) return;
    const btns = tabsRef.current.querySelectorAll<HTMLButtonElement>("button[data-tab]");
    const idx  = TABS.findIndex((t) => t.key === tab);
    const btn  = btns[idx];
    if (btn) setIndicator({ left: btn.offsetLeft, width: btn.offsetWidth });
  }, [tab]);

  const fetchConsultations = useCallback(async () => {
    try {
      const res  = await fetch("/api/doctor/consultations");
      const data = await res.json() as { consultations: DoctorConsultation[] };
      setConsultations(data.consultations ?? []);
    } catch {
      toast.error("Failed to load consultations.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchConsultations(); }, [fetchConsultations]);

  function handleNoteSaved(id: string) {
    setConsultations((prev) =>
      prev.map((c) => c.id === id ? { ...c, hasRecords: true } : c)
    );
  }

  const filtered = filterByTab(consultations, tab)
    .slice()
    .sort((a, b) => {
      const diff = new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime();
      return tab === "upcoming" ? diff : -diff;
    });
  const tabCounts: Record<Tab, number> = {
    upcoming: filterByTab(consultations, "upcoming").length,
    past:     filterByTab(consultations, "past").length,
  };

  return (
    <div className="flex flex-col gap-8 w-full">

      {/* Header */}
      <div
        className="flex flex-col gap-1.5 animate-fadeInDown"
        style={{ animationDelay: "0ms", animationDuration: "400ms" }}
      >
        <h1 className="text-[32px] font-medium text-text-mainer leading-tight">
          Consultations
        </h1>
        <p className="text-[16px] text-text-sub">
          View your upcoming appointments and manage past consultation records.
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
      <div key={tab} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-tabIn">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <DoctorConsultationCardSkeleton key={i} />
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
              <DoctorConsultationCard
                consultation={c}
                tab={tab}
                onAddNotes={setAddTarget}
                onViewRecords={setViewTarget}
              />
            </div>
          ))
        )}
      </div>

      <AddNotesModal
        consultation={addTarget}
        onClose={() => setAddTarget(null)}
        onSaved={handleNoteSaved}
      />

      <ViewRecordsModal
        consultation={viewTarget}
        onClose={() => setViewTarget(null)}
      />
    </div>
  );
}
