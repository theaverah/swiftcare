"use client";

import {
  useState, useEffect, useCallback, useMemo, useRef,
  type ReactNode,
} from "react";
import { Search, X, ChevronDown, Check } from "lucide-react";
import { DoctorCard } from "./DoctorCard";
import { DoctorCardSkeleton } from "./DoctorCardSkeleton";
import { DoctorDrawer } from "./DoctorDrawer";
import type { Doctor } from "@/types/doctor";

// ── Constants ─────────────────────────────────────────────────────────────────

const SPECIALIZATIONS = [
  "General Practice",
  "Internal Medicine",
  "Cardiology",
  "Dermatology",
  "Pediatrics",
  "Obstetrics & Gynecology",
  "Orthopedic Surgery",
  "Sports Medicine",
  "Psychiatry",
  "Mental Health",
];

const LANGUAGES = ["English", "Filipino", "Spanish", "Cebuano", "Mandarin"];

const FEE_RANGES = [
  { label: "Under ₱500",       value: "under500"  },
  { label: "₱500–₱1,000",     value: "500-1000"  },
  { label: "₱1,000–₱2,000",   value: "1000-2000" },
  { label: "₱2,000+",          value: "2000plus"  },
];

const AVAILABILITY_OPTIONS = [
  { label: "Available today", value: "today" },
  { label: "This week",       value: "week"  },
];

const TIME_OPTIONS = [
  { label: "Morning (6AM–12PM)",   value: "morning"   },
  { label: "Afternoon (12PM–6PM)", value: "afternoon" },
  { label: "Evening (6PM–10PM)",   value: "evening"   },
];

// ── Types ─────────────────────────────────────────────────────────────────────

interface FilterState {
  specialty:    string;
  availability: string;
  feeRange:     string;
  language:     string;
  timeOfDay:    string;
  date:         string;
  location:     string;
}

const INITIAL_FILTERS: FilterState = {
  specialty:    "",
  availability: "",
  feeRange:     "",
  language:     "",
  timeOfDay:    "",
  date:         "",
  location:     "",
};

// ── Sub-components ────────────────────────────────────────────────────────────

function FilterChip({
  label,
  displayValue,
  isActive,
  onClear,
  children,
}: {
  label: string;
  displayValue?: string;
  isActive: boolean;
  onClear: () => void;
  children: (close: () => void) => ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`h-8 px-3 flex items-center gap-1.5 rounded-full text-[13px] font-medium
          transition-all duration-200 whitespace-nowrap border select-none ${
          isActive
            ? "bg-brand-sub border-brand text-brand"
            : "bg-transparent border-elements text-text-main hover:border-text-sub/60"
        }`}
      >
        {isActive && displayValue ? displayValue : label}
        {isActive ? (
          <span
            role="button"
            tabIndex={0}
            aria-label="Clear filter"
            onClick={(e) => { e.stopPropagation(); onClear(); close(); }}
            onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); onClear(); close(); }}}
            className="flex items-center justify-center w-3.5 h-3.5 rounded-full
              hover:bg-brand/20 transition-colors ml-0.5"
          >
            <X size={9} strokeWidth={2.5} />
          </span>
        ) : (
          <ChevronDown
            size={11}
            strokeWidth={2}
            className={`text-text-sub transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          />
        )}
      </button>

      {open && (
        <div className="absolute top-full mt-2 left-0 z-30 bg-bg-main border border-elements
          rounded-lg shadow-[0_2px_12px_rgba(0,0,0,0.10)] min-w-[180px] overflow-hidden">
          {children(close)}
        </div>
      )}
    </div>
  );
}

function ChipOption({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full px-4 py-2.5 text-left text-[14px] transition-colors duration-150
        flex items-center justify-between gap-2 ${
        selected
          ? "text-brand bg-brand-sub/40 font-medium"
          : "text-text-main hover:bg-bg-sub"
      }`}
    >
      {label}
      {selected && <Check size={13} strokeWidth={2.5} className="text-brand shrink-0" />}
    </button>
  );
}

function EmptyState({
  title,
  subtitle,
  illustration = "/illustrations/no-data.svg",
}: {
  title: string;
  subtitle: string;
  illustration?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-4 py-16 px-6 text-center col-span-full">
      <img src={illustration} alt="" aria-hidden className="w-52 max-w-full select-none opacity-90" />
      <div className="flex flex-col gap-1.5">
        <p className="text-[16px] font-medium text-text-main">{title}</p>
        <p className="text-[14px] text-text-sub">{subtitle}</p>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function FindDoctorsPage() {
  const [activeTab,      setActiveTab]      = useState<"all" | "saved">("all");
  const [search,         setSearch]         = useState("");
  const [debouncedSearch,setDebouncedSearch]= useState("");
  const [searchFocused,  setSearchFocused]  = useState(false);
  const [filters,        setFilters]        = useState<FilterState>(INITIAL_FILTERS);
  const [doctors,        setDoctors]        = useState<Doctor[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [listKey,        setListKey]        = useState(0);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [drawerOpen,     setDrawerOpen]     = useState(false);

  // ── Debounce search ────────────────────────────────────────────────────────

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  // ── Fetch doctors ──────────────────────────────────────────────────────────

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (debouncedSearch)     params.set("search",       debouncedSearch);
        if (filters.specialty)   params.set("speciality",   filters.specialty);   // API param spelling
        if (filters.feeRange)    params.set("feeRange",     filters.feeRange);
        if (filters.language)    params.set("language",     filters.language);
        if (filters.availability)params.set("availability", filters.availability);
        if (filters.timeOfDay)   params.set("timeOfDay",    filters.timeOfDay);

        const res = await fetch(`/api/patient/doctors?${params}`, { signal: controller.signal });
        if (!res.ok) throw new Error("Failed to fetch doctors");
        const data = await res.json() as { doctors: Doctor[] };
        setDoctors(data.doctors ?? []);
        setListKey((k) => k + 1);
      } catch (err: unknown) {
        if ((err as { name?: string }).name !== "AbortError") setDoctors([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    load();
    return () => controller.abort();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    debouncedSearch,
    filters.specialty,
    filters.feeRange,
    filters.language,
    filters.availability,
    filters.timeOfDay,
  ]);

  // ── Client-side filtering ──────────────────────────────────────────────────

  const displayedDoctors = useMemo(() => {
    let result = doctors;

    if (activeTab === "saved") result = result.filter((d) => d.isSaved);

    if (filters.date) {
      const dow = new Date(`${filters.date}T00:00:00`).getDay();
      result = result.filter((d) =>
        d.availability.some((a) => a.dayOfWeek === dow && a.isAvailable)
      );
    }

    if (filters.location) {
      const q = filters.location.toLowerCase();
      result = result.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          (d.bio ?? "").toLowerCase().includes(q)
      );
    }

    return result;
  }, [doctors, activeTab, filters.date, filters.location]);

  // ── Helpers ────────────────────────────────────────────────────────────────

  function updateFilter<K extends keyof FilterState>(key: K, value: FilterState[K]) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  const hasActiveFilters =
    Object.values(filters).some((v) => v !== "") || search !== "";

  function clearAll() {
    setFilters(INITIAL_FILTERS);
    setSearch("");
  }

  // ── Save toggle ────────────────────────────────────────────────────────────

  const toggleSave = useCallback(
    async (doctor: Doctor) => {
      const next = !doctor.isSaved;

      setDoctors((prev) =>
        prev.map((d) => (d.userId === doctor.userId ? { ...d, isSaved: next } : d))
      );
      setSelectedDoctor((prev) =>
        prev?.userId === doctor.userId ? { ...prev, isSaved: next } : prev
      );

      try {
        const res = await fetch("/api/patient/doctors/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ doctorUserId: doctor.userId }),
        });
        if (!res.ok) throw new Error();
      } catch {
        // Revert on error
        setDoctors((prev) =>
          prev.map((d) => (d.userId === doctor.userId ? { ...d, isSaved: doctor.isSaved } : d))
        );
        setSelectedDoctor((prev) =>
          prev?.userId === doctor.userId ? { ...prev, isSaved: doctor.isSaved } : prev
        );
      }
    },
    []
  );

  // ── Drawer ─────────────────────────────────────────────────────────────────

  function openDrawer(doctor: Doctor) {
    setSelectedDoctor(doctor);
    setDrawerOpen(true);
  }

  function closeDrawer() {
    setDrawerOpen(false);
    setTimeout(() => setSelectedDoctor(null), 420);
  }

  // ── Saved count ────────────────────────────────────────────────────────────

  const savedCount = doctors.filter((d) => d.isSaved).length;

  // ── Date display label for chip ────────────────────────────────────────────

  const dateLabelForChip = filters.date
    ? new Date(`${filters.date}T00:00:00`).toLocaleDateString("en-PH", {
        month: "short",
        day: "numeric",
      })
    : undefined;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      <div className="flex flex-col gap-6 w-full">

        {/* ── Page header ─────────────────────────────────────────── */}
        <div className="flex flex-col gap-1 animate-fadeInDown" style={{ animationDelay: "60ms", animationDuration: "400ms" }}>
          <h1 className="text-[32px] font-medium text-text-main tracking-[-0.05em] leading-tight">
            Find a Doctor
          </h1>
          <p className="text-[16px] text-text-sub">
            Browse our network of licensed doctors and find the right one for you.
          </p>
        </div>

        {/* ── Tabs ────────────────────────────────────────────────── */}
        <div
          className="flex border-b border-elements animate-fadeInDown"
          style={{ animationDelay: "100ms", animationDuration: "400ms" }}
        >
          {(["all", "saved"] as const).map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2.5 text-[16px] font-medium border-b-2 -mb-px
                  transition-colors duration-200 flex items-center gap-2 ${
                  isActive
                    ? "text-text-main border-brand"
                    : "text-text-sub border-transparent hover:text-text-main"
                }`}
              >
                {tab === "all" ? "All Doctors" : "Saved"}
                {tab === "saved" && savedCount > 0 && (
                  <span
                    className={`text-[11px] font-medium px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-none ${
                      isActive
                        ? "bg-brand text-white"
                        : "bg-elements text-text-sub"
                    }`}
                  >
                    {savedCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── Search ──────────────────────────────────────────────── */}
        <div
          className="animate-fadeInDown"
          style={{ animationDelay: "140ms", animationDuration: "400ms" }}
        >
          <div
            className={`relative h-12 flex items-center border rounded-lg bg-bg-main
              transition-all duration-200 ${
              searchFocused
                ? "border-text-main shadow-[0_0_0_3px_rgba(17,17,17,0.05)]"
                : "border-elements"
            }`}
          >
            <Search
              size={18}
              strokeWidth={1.75}
              className={`absolute left-4 shrink-0 transition-colors duration-200 ${
                searchFocused ? "text-text-main" : "text-text-sub"
              }`}
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              placeholder="Search by name or specialization..."
              className="w-full h-full pl-11 pr-4 bg-transparent text-[16px] text-text-main
                placeholder:text-text-sub outline-none"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 w-6 h-6 flex items-center justify-center rounded-full
                  text-text-sub hover:text-text-main hover:bg-bg-sub transition-colors duration-200"
              >
                <X size={13} strokeWidth={2.5} />
              </button>
            )}
          </div>
        </div>

        {/* ── Filter chips ────────────────────────────────────────── */}
        <div
          className="animate-fadeInDown"
          style={{ animationDelay: "170ms", animationDuration: "400ms" }}
        >
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">

            {/* Specialty */}
            <FilterChip
              label="Specialty"
              displayValue={filters.specialty}
              isActive={!!filters.specialty}
              onClear={() => updateFilter("specialty", "")}
            >
              {(close) => (
                <div className="py-1">
                  {SPECIALIZATIONS.map((s) => (
                    <ChipOption
                      key={s}
                      label={s}
                      selected={filters.specialty === s}
                      onClick={() => { updateFilter("specialty", filters.specialty === s ? "" : s); close(); }}
                    />
                  ))}
                </div>
              )}
            </FilterChip>

            {/* Availability */}
            <FilterChip
              label="Availability"
              displayValue={AVAILABILITY_OPTIONS.find((o) => o.value === filters.availability)?.label}
              isActive={!!filters.availability}
              onClear={() => updateFilter("availability", "")}
            >
              {(close) => (
                <div className="py-1">
                  {AVAILABILITY_OPTIONS.map((o) => (
                    <ChipOption
                      key={o.value}
                      label={o.label}
                      selected={filters.availability === o.value}
                      onClick={() => { updateFilter("availability", filters.availability === o.value ? "" : o.value); close(); }}
                    />
                  ))}
                </div>
              )}
            </FilterChip>

            {/* Fee Range */}
            <FilterChip
              label="Fee Range"
              displayValue={FEE_RANGES.find((o) => o.value === filters.feeRange)?.label}
              isActive={!!filters.feeRange}
              onClear={() => updateFilter("feeRange", "")}
            >
              {(close) => (
                <div className="py-1">
                  {FEE_RANGES.map((o) => (
                    <ChipOption
                      key={o.value}
                      label={o.label}
                      selected={filters.feeRange === o.value}
                      onClick={() => { updateFilter("feeRange", filters.feeRange === o.value ? "" : o.value); close(); }}
                    />
                  ))}
                </div>
              )}
            </FilterChip>

            {/* Language */}
            <FilterChip
              label="Language"
              displayValue={filters.language}
              isActive={!!filters.language}
              onClear={() => updateFilter("language", "")}
            >
              {(close) => (
                <div className="py-1">
                  {LANGUAGES.map((lang) => (
                    <ChipOption
                      key={lang}
                      label={lang}
                      selected={filters.language === lang}
                      onClick={() => { updateFilter("language", filters.language === lang ? "" : lang); close(); }}
                    />
                  ))}
                </div>
              )}
            </FilterChip>

            {/* Time of Day */}
            <FilterChip
              label="Time of Day"
              displayValue={TIME_OPTIONS.find((o) => o.value === filters.timeOfDay)?.label}
              isActive={!!filters.timeOfDay}
              onClear={() => updateFilter("timeOfDay", "")}
            >
              {(close) => (
                <div className="py-1">
                  {TIME_OPTIONS.map((o) => (
                    <ChipOption
                      key={o.value}
                      label={o.label}
                      selected={filters.timeOfDay === o.value}
                      onClick={() => { updateFilter("timeOfDay", filters.timeOfDay === o.value ? "" : o.value); close(); }}
                    />
                  ))}
                </div>
              )}
            </FilterChip>

            {/* Date */}
            <FilterChip
              label="Date"
              displayValue={dateLabelForChip}
              isActive={!!filters.date}
              onClear={() => updateFilter("date", "")}
            >
              {(close) => (
                <div className="p-3">
                  <p className="text-[12px] text-text-sub mb-2">Filter by date</p>
                  <input
                    type="date"
                    value={filters.date}
                    min={new Date().toISOString().split("T")[0]}
                    onChange={(e) => {
                      updateFilter("date", e.target.value);
                      if (e.target.value) close();
                    }}
                    className="w-full h-9 px-3 border border-elements rounded-lg text-[14px]
                      text-text-main bg-bg-main focus:outline-none focus:border-text-main
                      transition-colors duration-200"
                  />
                </div>
              )}
            </FilterChip>

            {/* Location */}
            <FilterChip
              label="Location"
              displayValue={filters.location ? `"${filters.location}"` : undefined}
              isActive={!!filters.location}
              onClear={() => updateFilter("location", "")}
            >
              {(close) => (
                <div className="p-3 w-56">
                  <p className="text-[12px] text-text-sub mb-2">Filter by location or keyword</p>
                  <input
                    autoFocus
                    type="text"
                    placeholder="e.g. Manila, Quezon City..."
                    value={filters.location}
                    onChange={(e) => updateFilter("location", e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") close(); }}
                    className="w-full h-9 px-3 border border-elements rounded-lg text-[14px]
                      text-text-main bg-bg-main focus:outline-none focus:border-text-main
                      placeholder:text-text-sub transition-colors duration-200"
                  />
                </div>
              )}
            </FilterChip>

            {/* Clear all */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearAll}
                className="shrink-0 text-[13px] text-brand hover:underline transition-colors duration-200 ml-1 whitespace-nowrap"
              >
                Clear all
              </button>
            )}
          </div>
        </div>

        {/* ── Doctor grid ─────────────────────────────────────────── */}
        {loading ? (
          <div
            key="skeleton"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {Array.from({ length: 9 }).map((_, i) => (
              <DoctorCardSkeleton key={i} />
            ))}
          </div>
        ) : displayedDoctors.length === 0 ? (
          <div className="grid grid-cols-1">
            {activeTab === "saved" ? (
              <EmptyState
                title="No saved doctors yet."
                subtitle="Heart a doctor to save them here."
              />
            ) : (
              <EmptyState
                title="No doctors match your search."
                subtitle="Try adjusting your filters."
              />
            )}
          </div>
        ) : (
          <div
            key={listKey}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {displayedDoctors.map((doctor, index) => (
              <DoctorCard
                key={doctor.doctorProfileId}
                doctor={doctor}
                animationIndex={index}
                onSaveToggle={() => toggleSave(doctor)}
                onOpenDrawer={() => openDrawer(doctor)}
              />
            ))}
          </div>
        )}

        {/* Attribution spacer */}
        <div className="mt-auto" />
      </div>

      {/* ── Drawer ─────────────────────────────────────────────────── */}
      <DoctorDrawer
        doctor={selectedDoctor}
        isOpen={drawerOpen}
        onClose={closeDrawer}
      />
    </>
  );
}
