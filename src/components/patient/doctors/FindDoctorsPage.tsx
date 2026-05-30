"use client";

import {
  useState, useEffect, useCallback, useMemo, useRef, useLayoutEffect,
  type ReactNode, type ComponentType,
} from "react";
import { useSearchParams } from "next/navigation";
import { createPortal } from "react-dom";
import {
  Search, X, ChevronDown, Check,
  Stethoscope, Calendar, Clock, PhilippinePeso, MessageCircle, MapPin,
} from "lucide-react";
import { DoctorCard } from "./DoctorCard";
import { DoctorCardSkeleton } from "./DoctorCardSkeleton";
import { DoctorDrawer } from "./DoctorDrawer";
import { BookingModal } from "@/components/patient/booking/BookingModal";
import type { Doctor } from "@/types/doctor";

// -- Constants -----------------------------------------------------------------

const SPECIALIZATIONS = [
  "Allergy & Immunology", "Cardiology", "Dermatology", "Emergency Medicine",
  "Endocrinology", "Family Medicine", "Gastroenterology", "General Practice",
  "Infectious Disease", "Internal Medicine", "Mental Health", "Nephrology",
  "Neurology", "Obstetrics & Gynecology", "Ophthalmology", "Orthopedic Surgery",
  "Pediatrics", "Physical Therapy & Rehabilitation", "Psychiatry", "Pulmonology",
  "Rheumatology", "Sports Medicine", "Urology",
];

const LANGUAGES = [
  "English", "Filipino (Tagalog)", "Cebuano (Bisaya)", "Ilocano",
  "Hiligaynon (Ilonggo)", "Waray", "Bikol", "Kapampangan", "Maranao", "Chavacano",
];

const TIME_OPTIONS = [
  { label: "Morning",   value: "morning",   hint: "6:00 AM – 12:00 PM" },
  { label: "Afternoon", value: "afternoon", hint: "12:00 PM – 6:00 PM"  },
  { label: "Evening",   value: "evening",   hint: "6:00 PM – 10:00 PM"  },
];

const PH_LOCATIONS = [
  // Metro Manila
  "Caloocan", "Las Piñas", "Makati", "Malabon", "Mandaluyong", "Manila",
  "Marikina", "Muntinlupa", "Navotas", "Parañaque", "Pasay", "Pasig",
  "Pateros", "Quezon City", "San Juan", "Taguig", "Valenzuela",
  // Luzon
  "Angeles City", "Baguio", "Legazpi", "Puerto Princesa",
  // Visayas
  "Bacolod", "Cebu City", "Dumaguete", "Iloilo City", "Tacloban",
  // Mindanao
  "Butuan", "Cagayan de Oro", "Davao City", "General Santos",
  "Iligan City", "Zamboanga City",
];

const PAGE_SIZE = 9;
const PLACEHOLDER_SUFFIXES = ["name...", "specialization...", "doctor..."];

// -- Types ---------------------------------------------------------------------

interface FilterState {
  specialties: string[];
  languages:   string[];
  timePref:    string[];
  maxFee:      number;
  date:        string;
  location:    string[];
}

const INITIAL_FILTERS: FilterState = {
  specialties: [],
  languages:   [],
  timePref:    [],
  maxFee:      5000,
  date:        "",
  location:    [],
};

// -- Sub-components ------------------------------------------------------------

function MultiSelectSearch({
  options,
  selected,
  onToggle,
  placeholder,
  showSearch = true,
}: {
  options:     string[];
  selected:    string[];
  onToggle:    (v: string) => void;
  placeholder: string;
  showSearch?: boolean;
}) {
  const [q, setQ] = useState("");
  const filtered = q
    ? options.filter(o => o.toLowerCase().includes(q.toLowerCase()))
    : options;

  return (
    <div className="min-w-52.5">
      {showSearch && (
        <div className="p-2 border-b border-elements">
          <input
            autoFocus
            type="text"
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder={placeholder}
            className="w-full h-8 px-3 text-[14px] text-text-main bg-transparent
              outline-none placeholder:text-text-sub"
          />
        </div>
      )}
      <div className="max-h-52 overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="px-4 py-3 text-[14px] text-text-sub">No results</p>
        ) : filtered.map(opt => {
          const sel = selected.includes(opt);
          return (
            <button
              key={opt}
              type="button"
              onMouseDown={e => e.preventDefault()}
              onClick={() => onToggle(opt)}
              className={`w-full px-4 py-2.5 text-left text-[14px] flex items-center
                justify-between gap-2 transition-colors duration-150 ${
                sel
                  ? "text-brand font-medium bg-brand/5"
                  : "text-text-main hover:bg-bg-sub"
              }`}
            >
              {opt}
              {sel && <Check size={14} strokeWidth={1.75} className="text-brand shrink-0" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SliderContent({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const fillPct = ((value - 100) / (5000 - 100)) * 100;

  return (
    <div className="p-4 w-64">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[12px] text-text-sub">Max consultation fee</p>
        <p className="text-[14px] font-medium text-text-main">
          ₱{value.toLocaleString("en-PH")}
        </p>
      </div>
      <input
        type="range"
        min={100}
        max={5000}
        step={100}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full fee-slider"
        style={{ "--fill-pct": `${fillPct}%` } as React.CSSProperties}
      />
      <div className="flex justify-between mt-2">
        <span className="text-[11px] text-text-sub">₱100</span>
        <span className="text-[11px] text-text-sub">₱5,000</span>
      </div>
    </div>
  );
}

function FilterChip({
  label, icon: Icon, displayValue, isActive, onClear, children,
}: {
  label:         string;
  icon:          ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  displayValue?: string;
  isActive:      boolean;
  onClear:       () => void;
  children:      (close: () => void) => ReactNode;
}) {
  const [open, setOpen]   = useState(false);
  const [pos, setPos]     = useState({ top: 0, left: 0 });
  const buttonRef         = useRef<HTMLButtonElement>(null);
  const dropdownRef       = useRef<HTMLDivElement>(null);
  const close             = useCallback(() => setOpen(false), []);

  // Click-outside: close when clicking outside both the button and the portal dropdown
  useEffect(() => {
    function handler(e: MouseEvent) {
      const target = e.target as Node;
      if (
        !buttonRef.current?.contains(target) &&
        !dropdownRef.current?.contains(target)
      ) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close on external scroll (not when scrolling inside the dropdown itself)
  useEffect(() => {
    if (!open) return;
    const handler = (e: Event) => {
      if (dropdownRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    window.addEventListener("scroll", handler, true);
    return () => window.removeEventListener("scroll", handler, true);
  }, [open]);

  function handleToggle() {
    if (!open && buttonRef.current) {
      const r = buttonRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 8, left: r.left });
    }
    setOpen(v => !v);
  }

  return (
    <div className="shrink-0">
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        className={`h-8.5 px-3.5 flex items-center gap-3 rounded-lg text-[16px] font-normal
          transition-all duration-200 whitespace-nowrap border select-none ${
          isActive
            ? "bg-brand-sub border-brand text-brand"
            : "bg-bg-main border-elements text-text-main hover:border-text-sub/60"
        }`}
      >
        <Icon
          size={15}
          strokeWidth={1.75}
          className={isActive ? "text-brand shrink-0" : "text-text-main shrink-0"}
        />
        <span>{isActive && displayValue ? displayValue : label}</span>
        {isActive ? (
          <span
            role="button"
            tabIndex={0}
            aria-label="Clear filter"
            onClick={e => { e.stopPropagation(); onClear(); close(); }}
            onKeyDown={e => { if (e.key === "Enter") { e.stopPropagation(); onClear(); close(); } }}
            className="flex items-center justify-center w-3.5 h-3.5 rounded-full
              hover:bg-brand/20 transition-colors ml-0.5"
          >
            <X size={9} strokeWidth={2.5} />
          </span>
        ) : (
          <ChevronDown
            size={11}
            strokeWidth={1.75}
            className={`text-text-main transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          />
        )}
      </button>

      {open && createPortal(
        <div
          ref={dropdownRef}
          style={{ position: "fixed", top: pos.top, left: pos.left, zIndex: 9999 }}
          className="bg-bg-main border border-elements rounded-lg
            shadow-[0_4px_16px_rgba(0,0,0,0.12)] overflow-hidden"
        >
          {children(close)}
        </div>,
        document.body
      )}
    </div>
  );
}

function EmptyState({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="flex flex-col items-center gap-4 py-16 px-6 text-center col-span-full">
      <img
        src="/illustrations/no-data.svg"
        alt=""
        aria-hidden
        className="w-66 max-w-full select-none opacity-90"
      />
      <div className="flex flex-col gap-1">
        <p className="text-[16px] font-medium text-text-main">{title}</p>
        <p className="text-[16px] text-text-sub">{subtitle}</p>

      </div>
    </div>
  );
}

// -- Main component ------------------------------------------------------------

export function FindDoctorsPage() {
  const searchParams = useSearchParams();

  // -- Tabs -------------------------------------------------------------------
  const [activeTab,  setActiveTab]  = useState<"all" | "today" | "saved">("all");
  const tabsRef                     = useRef<HTMLDivElement>(null);
  const [indicator, setIndicator]   = useState({ left: 0, width: 0 });
  const [gridVisible,setGridVisible]= useState(true);

  // -- Search -----------------------------------------------------------------
  const [search,           setSearch]           = useState("");
  const [debouncedSearch,  setDebouncedSearch]  = useState("");
  const [searchFocused,    setSearchFocused]    = useState(false);
  const [placeholderIdx,   setPlaceholderIdx]   = useState(0);
  const [placeholderFaded, setPlaceholderFaded] = useState(false);

  // -- Filters — seeded from URL params (e.g. from Swift recommendations) -----
  const [filters, setFilters] = useState<FilterState>(() => {
    const specialties = searchParams.get("specialties")?.split(",").filter(Boolean) ?? [];
    const languages   = searchParams.get("languages")?.split(",").filter(Boolean) ?? [];
    const timePref    = searchParams.get("timePref")?.split(",").filter(Boolean) ?? [];
    const maxFee      = searchParams.get("maxFee") ? Number(searchParams.get("maxFee")) : 5000;
    return { ...INITIAL_FILTERS, specialties, languages, timePref, maxFee };
  });

  // -- Data -------------------------------------------------------------------
  const [doctors,        setDoctors]        = useState<Doctor[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [fetchError,     setFetchError]     = useState(false);
  const [listKey,        setListKey]        = useState(0);
  const [retryKey,       setRetryKey]       = useState(0);
  const [visibleCount,   setVisibleCount]   = useState(PAGE_SIZE);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [drawerOpen,     setDrawerOpen]     = useState(false);
  const [bookingDoctor,  setBookingDoctor]  = useState<Doctor | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // -- Tab indicator ----------------------------------------------------------

  useLayoutEffect(() => {
    if (!tabsRef.current) return;
    const btns = tabsRef.current.querySelectorAll<HTMLButtonElement>("button[data-tab]");
    const idx = { all: 0, today: 1, saved: 2 }[activeTab];
    const btn = btns[idx];
    if (btn) setIndicator({ left: btn.offsetLeft, width: btn.offsetWidth });
  }, [activeTab]);

  // -- Animated placeholder ---------------------------------------------------

  useEffect(() => {
    const id = setInterval(() => {
      setPlaceholderFaded(true);
      setTimeout(() => {
        setPlaceholderIdx(i => (i + 1) % PLACEHOLDER_SUFFIXES.length);
        setPlaceholderFaded(false);
      }, 300);
    }, 3000);
    return () => clearInterval(id);
  }, []);

  // -- Debounce search --------------------------------------------------------

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  // -- Fetch doctors ----------------------------------------------------------

  const specialtyParam = filters.specialties.join(",");
  const languageParam  = filters.languages.join(",");
  const timePrefParam  = filters.timePref.join(",");

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      setLoading(true);
      setFetchError(false);

      // 12-second hard timeout so skeleton never hangs forever
      const timeout = setTimeout(() => {
        if (!controller.signal.aborted) {
          controller.abort();
          setFetchError(true);
          setLoading(false);
        }
      }, 12000);

      try {
        const params = new URLSearchParams();
        if (specialtyParam)   params.set("specialties", specialtyParam);
        if (languageParam)    params.set("languages",  languageParam);
        if (timePrefParam)    params.set("timePref",   timePrefParam);
        if (filters.maxFee < 5000) params.set("maxFee", String(filters.maxFee));

        const res = await fetch(`/api/patient/doctors?${params}`, { signal: controller.signal });
        if (!res.ok) throw new Error("API error");
        const data = await res.json() as { doctors: Doctor[] };
        setDoctors(data.doctors ?? []);
        setListKey(k => k + 1);
      } catch (err: unknown) {
        if ((err as { name?: string }).name !== "AbortError") {
          setDoctors([]);
          setFetchError(true);
        }
      } finally {
        clearTimeout(timeout);
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    load();
    return () => controller.abort();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [specialtyParam, languageParam, timePrefParam, filters.maxFee, retryKey]);

  // -- Infinite scroll --------------------------------------------------------

  useEffect(() => { setVisibleCount(PAGE_SIZE); }, [listKey, activeTab]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      entries => { if (entries[0].isIntersecting) setVisibleCount(c => c + PAGE_SIZE); },
      { rootMargin: "300px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [loading]);

  // -- Client-side tab + date + location filter -------------------------------

  const displayedDoctors = useMemo(() => {
    let result = doctors;

    // Text search is client-side so tab counts are unaffected by typing
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter(d =>
        d.name.toLowerCase().includes(q) ||
        (d.specializations ?? []).some(s => s.toLowerCase().includes(q))
      );
    }

    if (activeTab === "today") result = result.filter(d => d.isAvailableToday);
    if (activeTab === "saved") result = result.filter(d => d.isSaved);
    if (filters.date) {
      const dow = new Date(`${filters.date}T00:00:00`).getDay();
      result = result.filter(d => d.availability.some(a => a.dayOfWeek === dow && a.isAvailable));
    }
    if (filters.location.length > 0) {
      result = result.filter(d =>
        filters.location.some(loc => {
          const q = loc.toLowerCase();
          return d.name.toLowerCase().includes(q) || (d.bio ?? "").toLowerCase().includes(q);
        })
      );
    }
    return result;
  }, [doctors, activeTab, debouncedSearch, filters.date, filters.location]);

  const visibleDoctors = displayedDoctors.slice(0, visibleCount);

  // -- Actions ----------------------------------------------------------------

  function handleTabChange(tab: typeof activeTab) {
    if (tab === activeTab) return;
    setGridVisible(false);
    setTimeout(() => {
      setActiveTab(tab);
      setListKey(k => k + 1);
      setGridVisible(true);
    }, 80);
  }

  function updateFilter<K extends keyof FilterState>(key: K, value: FilterState[K]) {
    setFilters(prev => ({ ...prev, [key]: value }));
  }

  function toggleMulti(key: "specialties" | "languages" | "timePref" | "location", value: string) {
    const current = filters[key];
    setFilters(prev => ({
      ...prev,
      [key]: current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value],
    }));
  }

  function multiLabel(arr: string[], label: string): string | undefined {
    if (arr.length === 0) return undefined;
    if (arr.length === 1) return arr[0];
    return `${label} (${arr.length})`;
  }

  const hasActiveFilters =
    filters.specialties.length > 0 || filters.languages.length > 0 ||
    filters.timePref.length > 0 || filters.maxFee < 5000 ||
    filters.date !== "" || filters.location.length > 0 || search !== "";

  function clearAll() { setFilters(INITIAL_FILTERS); setSearch(""); }

  const toggleSave = useCallback(async (doctor: Doctor) => {
    const next = !doctor.isSaved;
    setDoctors(prev => prev.map(d => d.userId === doctor.userId ? { ...d, isSaved: next } : d));
    setSelectedDoctor(prev => prev?.userId === doctor.userId ? { ...prev, isSaved: next } : prev);
    try {
      const res = await fetch("/api/patient/doctors/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doctorUserId: doctor.userId }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        console.error("[toggleSave] API error", res.status, body);
        throw new Error(`${res.status}`);
      }
    } catch (err) {
      console.error("[toggleSave] failed, reverting:", err);
      setDoctors(prev => prev.map(d => d.userId === doctor.userId ? { ...d, isSaved: doctor.isSaved } : d));
      setSelectedDoctor(prev => prev?.userId === doctor.userId ? { ...prev, isSaved: doctor.isSaved } : prev);
    }
  }, []);

  function openDrawer(doctor: Doctor)  { setSelectedDoctor(doctor); setDrawerOpen(true); }
  function closeDrawer()               { setDrawerOpen(false); setTimeout(() => setSelectedDoctor(null), 420); }
  function openBooking(doctor: Doctor) {
    if (drawerOpen) {
      setDrawerOpen(false);
      setTimeout(() => setBookingDoctor(doctor), 300);
    } else {
      setBookingDoctor(doctor);
    }
  }
  function closeBooking()              { setBookingDoctor(null); }

  const savedCount = doctors.filter(d => d.isSaved).length;
  const todayCount = doctors.filter(d => d.isAvailableToday).length;

  const dateLabelForChip = filters.date
    ? new Date(`${filters.date}T00:00:00`).toLocaleDateString("en-PH", { month: "short", day: "numeric" })
    : undefined;

  // -- Render -----------------------------------------------------------------

  return (
    <>
      <div className="flex flex-col gap-6 w-full">

        {/* -- Page header ------------------------------------------- */}
        <div
          className="flex flex-col gap-1 animate-fadeInDown"
          style={{ animationDelay: "60ms", animationDuration: "400ms" }}
        >
          <h1 className="text-[32px] font-medium text-text-main tracking-tighter leading-tight">
            Find a doctor
          </h1>
          <p className="text-[16px] text-text-sub">
            Browse our network of licensed doctors and find the right one for you.
          </p>
        </div>

        {/* -- Tabs -------------------------------------------------- */}
        <div
          ref={tabsRef}
          className="relative flex border-b border-elements animate-fadeInDown"
          style={{ animationDelay: "100ms", animationDuration: "400ms" }}
        >
          <div
            className="absolute bottom-0 h-0.5 bg-brand transition-all duration-120 ease-out"
            style={{ left: indicator.left, width: indicator.width }}
          />

          {(["all", "today", "saved"] as const).map(tab => {
            const isActive = activeTab === tab;
            const badge    = tab === "today" ? todayCount : tab === "saved" ? savedCount : null;
            const label    = tab === "all" ? "All Doctors" : tab === "today" ? "Available Today" : "Saved";

            return (
              <button
                key={tab}
                data-tab={tab}
                type="button"
                onClick={() => handleTabChange(tab)}
                className={`px-4 py-2.5 text-[16px] font-medium transition-colors duration-200
                  flex items-center gap-2 ${
                  isActive ? "text-text-main" : "text-text-sub hover:text-text-main"
                }`}
              >
                {label}
                {badge != null && badge > 0 && (
                  <span
                    className={`text-[11px] font-medium px-1.5 py-0.5 rounded-full min-w-4.5
                      text-center leading-none transition-colors duration-200 ${
                      isActive ? "bg-brand text-white" : "bg-elements text-text-sub"
                    }`}
                  >
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* -- Search + Filters -------------------------------------- */}
        <div className="flex flex-col gap-2">

        {/* -- Search ------------------------------------------------ */}
        <div
          className="animate-fadeInDown"
          style={{ animationDelay: "140ms", animationDuration: "400ms" }}
        >
          <div
            className={`relative h-13 flex items-center border rounded-lg bg-bg-main
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

            {/* Animated placeholder — only last word cycles */}
            {!search && (
              <span
                aria-hidden
                className="absolute left-11 right-10 text-[16px] text-text-sub pointer-events-none select-none"
              >
                {"Search by "}
                <span
                  className={`transition-opacity duration-300 ${
                    placeholderFaded ? "opacity-0" : "opacity-100"
                  }`}
                >
                  {PLACEHOLDER_SUFFIXES[placeholderIdx]}
                </span>
              </span>
            )}

            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              className="w-full h-full pl-11 pr-10 bg-transparent text-[16px] text-text-main outline-none"
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

        {/* -- Filter chips ------------------------------------------ */}
        <div
          className="animate-fadeInDown"
          style={{ animationDelay: "170ms", animationDuration: "400ms" }}
        >
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">

            {/* Specialty */}
            <FilterChip
              label="Specialty"
              icon={Stethoscope}
              displayValue={multiLabel(filters.specialties, "Specialty")}
              isActive={filters.specialties.length > 0}
              onClear={() => updateFilter("specialties", [])}
            >
              {() => (
                <MultiSelectSearch
                  options={SPECIALIZATIONS}
                  selected={filters.specialties}
                  onToggle={v => toggleMulti("specialties", v)}
                  placeholder="Search specialization..."
                />
              )}
            </FilterChip>

            {/* Schedule */}
            <FilterChip
              label="Availability"
              icon={Calendar}
              displayValue={dateLabelForChip}
              isActive={!!filters.date}
              onClear={() => updateFilter("date", "")}
            >
              {close => (
                <div className="p-3 w-56">
                  <p className="text-[12px] text-text-sub mb-2">Filter by date</p>
                  <input
                    type="date"
                    value={filters.date}
                    min={new Date().toISOString().split("T")[0]}
                    onChange={e => { updateFilter("date", e.target.value); if (e.target.value) close(); }}
                    className="w-full h-9 px-3 border border-elements rounded-lg text-[14px]
                      text-text-main bg-bg-main focus:outline-none focus:border-text-main
                      transition-colors duration-200"
                  />
                </div>
              )}
            </FilterChip>

            {/* Time Preference */}
            <FilterChip
              label="Time Preference"
              icon={Clock}
              displayValue={
                filters.timePref.length === 1
                  ? TIME_OPTIONS.find(o => o.value === filters.timePref[0])?.label
                  : filters.timePref.length > 1
                    ? `Time (${filters.timePref.length})`
                    : undefined
              }
              isActive={filters.timePref.length > 0}
              onClear={() => updateFilter("timePref", [])}
            >
              {() => (
                <div className="w-52 py-1">
                  {TIME_OPTIONS.map(opt => {
                    const sel = filters.timePref.includes(opt.value);
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => toggleMulti("timePref", opt.value)}
                        className={`w-full px-4 py-2.5 text-left flex items-center justify-between
                          gap-2 transition-colors duration-150 ${
                          sel ? "text-brand bg-brand-sub/40" : "text-text-main hover:bg-bg-sub"
                        }`}
                      >
                        <div>
                          <p className={`text-[14px] ${sel ? "font-medium" : ""}`}>{opt.label}</p>
                          <p className="text-[12px] text-text-sub">{opt.hint}</p>
                        </div>
                        {sel && <Check size={13} strokeWidth={2.5} className="text-brand shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </FilterChip>

            {/* Fee */}
            <FilterChip
              label="Fee"
              icon={PhilippinePeso}
              displayValue={
                filters.maxFee < 5000
                  ? `Up to ₱${filters.maxFee.toLocaleString("en-PH")}`
                  : undefined
              }
              isActive={filters.maxFee < 5000}
              onClear={() => updateFilter("maxFee", 5000)}
            >
              {() => (
                <SliderContent
                  value={filters.maxFee}
                  onChange={v => updateFilter("maxFee", v)}
                />
              )}
            </FilterChip>

            {/* Language */}
            <FilterChip
              label="Language"
              icon={MessageCircle}
              displayValue={multiLabel(filters.languages, "Language")}
              isActive={filters.languages.length > 0}
              onClear={() => updateFilter("languages", [])}
            >
              {() => (
                <MultiSelectSearch
                  options={LANGUAGES}
                  selected={filters.languages}
                  onToggle={v => toggleMulti("languages", v)}
                  placeholder="Search language..."
                />
              )}
            </FilterChip>

            {/* Location */}
            <FilterChip
              label="Location"
              icon={MapPin}
              displayValue={multiLabel(filters.location, "Location")}
              isActive={filters.location.length > 0}
              onClear={() => updateFilter("location", [])}
            >
              {() => (
                <MultiSelectSearch
                  options={PH_LOCATIONS}
                  selected={filters.location}
                  onToggle={v => toggleMulti("location", v)}
                  placeholder="Search city..."
                />
              )}
            </FilterChip>

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

        </div>{/* end Search + Filters wrapper */}

        {/* -- Doctor grid ------------------------------------------- */}
        <div
          className={`transition-opacity duration-150 ease-in-out ${
            gridVisible ? "opacity-100" : "opacity-0"
          }`}
        >
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: PAGE_SIZE }).map((_, i) => (
                <DoctorCardSkeleton key={i} />
              ))}
            </div>
          ) : fetchError ? (
            <div className="flex flex-col items-center gap-4 py-16 text-center">
              <p className="text-[16px] font-medium text-text-main">Couldn't load doctors</p>
              <p className="text-[14px] text-text-sub max-w-sm">
                The server took too long to respond. Check your database connection and try again.
              </p>
              <button
                type="button"
                onClick={() => setRetryKey(k => k + 1)}
                className="h-9 px-5 rounded-lg bg-text-main text-brand-sub text-[14px] font-medium hover:opacity-90 transition-opacity duration-200"
              >
                Retry
              </button>
            </div>
          ) : displayedDoctors.length === 0 ? (
            <EmptyState
              title={
                activeTab === "saved" ? "No saved doctors yet." :
                activeTab === "today" ? "No doctors available today." :
                "No doctors match your search."
              }
              subtitle={
                activeTab === "saved" ? "Bookmark a doctor to save them here." :
                activeTab === "today" ? "Try 'All Doctors' or adjust your filters." :
                "Try adjusting your filters."
              }
            />
          ) : (
            <div
              key={listKey}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {visibleDoctors.map((doctor, index) => (
                <DoctorCard
                  key={doctor.doctorProfileId}
                  doctor={doctor}
                  animationIndex={index}
                  onSaveToggle={() => toggleSave(doctor)}
                  onOpenDrawer={() => openDrawer(doctor)}
                  onBook={() => openBooking(doctor)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Infinite scroll sentinel */}
        <div ref={sentinelRef} className="h-4" aria-hidden />
      </div>

      <DoctorDrawer
        doctor={selectedDoctor}
        isOpen={drawerOpen}
        onClose={closeDrawer}
        onBook={() => selectedDoctor && openBooking(selectedDoctor)}
      />

      {bookingDoctor && (
        <BookingModal
          doctor={bookingDoctor}
          isOpen={!!bookingDoctor}
          onClose={closeBooking}
        />
      )}
    </>
  );
}
