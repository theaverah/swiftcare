"use client";

import { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  getDay, isBefore, startOfDay, isSameDay, addMonths, subMonths, isSameMonth,
} from "date-fns";
import {
  X, ChevronLeft, ChevronRight, Sun, Sunset, Moon,
} from "lucide-react";
import type { Doctor, DoctorAvailability } from "@/types/doctor";

// -- Time helpers --------------------------------------------------------------

function parseHour(t: string): number {
  const [time, ampm] = t.split(" ");
  let [h] = time.split(":").map(Number);
  if (ampm === "PM" && h !== 12) h += 12;
  if (ampm === "AM" && h === 12) h = 0;
  return h;
}
function formatHour(h: number): string {
  const ampm = h < 12 ? "AM" : "PM";
  const hour = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hour}:00 ${ampm}`;
}

const TIME_PREFS = [
  { key: "morning"   as const, label: "Morning",   range: "6 AM – 12 PM",  window: [6,  12] as [number,number], Icon: Sun    },
  { key: "afternoon" as const, label: "Afternoon",  range: "12 PM – 6 PM",  window: [12, 18] as [number,number], Icon: Sunset },
  { key: "evening"   as const, label: "Evening",    range: "6 PM – 10 PM",  window: [18, 22] as [number,number], Icon: Moon   },
];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getAvailablePrefs(slot: DoctorAvailability) {
  const s = parseHour(slot.startTime);
  const e = parseHour(slot.endTime);
  return TIME_PREFS.filter(({ window: [ws, we] }) => s < we && e > ws);
}
function assignSlot(slot: DoctorAvailability, window: [number, number]): string {
  return formatHour(Math.max(parseHour(slot.startTime), window[0]));
}

// -- Props ---------------------------------------------------------------------

interface Props {
  doctor:        Doctor;
  appointmentId: string;
  isOpen:        boolean;
  onClose:       () => void;
  onRescheduled: () => void;
}

// -- Component -----------------------------------------------------------------

export function RescheduleModal({ doctor, appointmentId, isOpen, onClose, onRescheduled }: Props) {
  const [mounted,    setMounted]    = useState(false);
  const [done,       setDone]       = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [date,       setDate]       = useState("");
  const [timePref,   setTimePref]   = useState<"morning" | "afternoon" | "evening" | null>(null);
  const [slot,       setSlot]       = useState("");
  const [month,      setMonth]      = useState(() => startOfMonth(startOfDay(new Date())));

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (isOpen) {
      setDone(false);
      setDate("");
      setTimePref(null);
      setSlot("");
      setMonth(startOfMonth(startOfDay(new Date())));
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else        document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen && !done) onClose();
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, done, onClose]);

  const today = startOfDay(new Date());

  const calDays = useMemo(() => {
    const first = startOfMonth(month);
    const last  = endOfMonth(month);
    return { days: eachDayOfInterval({ start: first, end: last }), prefixCount: getDay(first) };
  }, [month]);

  function isAvailable(d: Date) {
    if (isBefore(d, today)) return false;
    return doctor.availability.some(a => a.dayOfWeek === getDay(d) && a.isAvailable);
  }

  const selectedSlotObj = useMemo(() => {
    if (!date) return null;
    const dow = getDay(new Date(date + "T12:00:00"));
    return doctor.availability.find(a => a.dayOfWeek === dow && a.isAvailable) ?? null;
  }, [date, doctor.availability]);

  const availablePrefs = useMemo(
    () => selectedSlotObj ? getAvailablePrefs(selectedSlotObj) : [],
    [selectedSlotObj]
  );

  function selectDate(d: Date) {
    if (!isAvailable(d)) return;
    setDate(format(d, "yyyy-MM-dd"));
    setTimePref(null);
    setSlot("");
  }

  function selectPref(key: typeof timePref) {
    if (!selectedSlotObj || !key) return;
    const pref = TIME_PREFS.find(p => p.key === key)!;
    setTimePref(key);
    setSlot(assignSlot(selectedSlotObj, pref.window));
  }

  async function handleConfirm() {
    setSubmitting(true);
    try {
      await fetch(`/api/patient/appointments/${appointmentId}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ date, assignedSlot: slot }),
      });
    } catch { /* optimistic */ }
    finally { setSubmitting(false); }
    setDone(true);
    onRescheduled();
  }

  const canConfirm = !!date && !!timePref && !submitting;

  if (!mounted) return null;

  const panel = (
    <>
      {/* Backdrop */}
      <div
        aria-hidden
        className="fixed inset-0 z-50 bg-black/30 backdrop-blur-[2px]"
        style={{ opacity: isOpen ? 1 : 0, pointerEvents: isOpen ? "auto" : "none", transition: "opacity 350ms ease" }}
        onClick={() => !done && onClose()}
      />

      {/* Panel */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Reschedule consultation"
          className="relative w-full max-w-2xl h-[96vh] max-h-[96vh] bg-bg-main rounded-xl shadow-[0_8px_40px_rgba(0,0,0,0.16)]
            flex flex-col pointer-events-auto"
          style={{
            opacity:   isOpen ? 1 : 0,
            transform: isOpen ? "scale(1) translateY(0)" : "scale(0.96) translateY(8px)",
            transition:"opacity 350ms ease, transform 350ms cubic-bezier(0.25,0.46,0.45,0.94)",
          }}
        >
          {/* Header */}
          {!done && (
            <div className="shrink-0 flex items-center justify-between px-6 py-5 border-b border-elements">
              <p className="text-[16px] font-medium text-text-main">Reschedule consultation</p>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-text-sub
                  hover:bg-bg-sub hover:text-text-main transition-colors duration-200"
              >
                <X size={16} strokeWidth={1.75} />
              </button>
            </div>
          )}

          {/* Body */}
          <div className={`flex-1 overflow-y-auto px-10 py-6 ${done ? "flex flex-col items-center justify-center" : ""}`}>
            {done ? (
              /* -- Success -- */
              <div className="flex flex-col items-center gap-4 text-center animate-fadeInDown">
                <img src="/illustrations/success.svg" alt="" aria-hidden className="w-72 max-w-full select-none" />
                <div className="flex flex-col gap-2">
                  <p className="text-[20px] font-medium text-text-main tracking-[-0.03em]">All set!</p>
                  <p className="text-[16px] text-text-sub">
                    Your consultation with Dr. {doctor.name} has been rescheduled to{" "}
                    <span className="text-text-main font-medium">
                      {slot} – {timePref ? formatHour(TIME_PREFS.find(p => p.key === timePref)!.window[1]) : ""}
                    </span>
                    {", on "}
                    <span className="text-text-main font-medium">
                      {format(new Date(date + "T12:00:00"), "MMMM d, yyyy")}
                    </span>.
                  </p>
                </div>
              </div>
            ) : (
              /* -- Picker -- */
              <div className="flex flex-col gap-6 animate-fadeInDown">

                {/* Heading */}
                <div className="flex flex-col gap-1">
                  <h3 className="text-[20px] font-medium text-text-main tracking-[-0.03em]">Pick a new date and time</h3>
                  <p className="text-[14px] text-text-sub">Choose when you'd like to reschedule to.</p>
                </div>

                {/* Doctor context */}
                <div className="flex flex-col gap-2">
                <p className="text-[16px] font-medium text-text-main">Your doctor</p>
                <div className="flex items-center gap-4 p-4 bg-elements/20 rounded-xl border border-elements/60">
                  <div className="w-16 h-16 rounded-full bg-brand-sub flex items-center justify-center shrink-0">
                    {doctor.profileImage ? (
                      <img src={doctor.profileImage} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <span className="text-[18px] font-medium text-brand select-none">
                        {doctor.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[16px] font-medium text-text-main truncate">Dr. {doctor.name}</p>
                    <p className="text-[14px] text-text-sub truncate">
                      {doctor.specializations?.join(", ")}
                    </p>
                  </div>
                </div>
                </div>

                {/* Calendar */}
                <div className="flex flex-col gap-2">
                <p className="text-[16px] font-medium text-text-main">Choose a date</p>
                <div className="flex flex-col gap-3 p-4 rounded-xl bg-elements/20 border border-elements/60">
                  {/* Month nav */}
                  <div className="flex items-center justify-between">
                    <p className="text-[16px] font-medium text-text-main">{format(month, "MMMM yyyy")}</p>
                    <div className="flex items-center gap-1">
                      <button type="button" onClick={() => setMonth(m => subMonths(m, 1))} disabled={isSameMonth(month, today)}
                        className="w-7 h-7 flex items-center justify-center rounded-md text-text-sub hover:bg-bg-sub hover:text-text-main transition-colors duration-150 disabled:opacity-30 disabled:cursor-not-allowed">
                        <ChevronLeft size={14} strokeWidth={2} />
                      </button>
                      <button type="button" onClick={() => setMonth(m => addMonths(m, 1))}
                        className="w-7 h-7 flex items-center justify-center rounded-md text-text-sub hover:bg-bg-sub hover:text-text-main transition-colors duration-150">
                        <ChevronRight size={14} strokeWidth={2} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-7">
                    {WEEKDAYS.map(d => (
                      <div key={d} className="h-6 flex items-center justify-center text-[14px] text-text-sub">{d}</div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-y-0.5">
                    {Array.from({ length: calDays.prefixCount }).map((_, i) => <div key={`pre-${i}`} className="h-7" />)}
                    {calDays.days.map(d => {
                      const avail    = isAvailable(d);
                      const selected = date === format(d, "yyyy-MM-dd");
                      const isToday  = isSameDay(d, today);
                      return (
                        <button key={d.toISOString()} type="button" disabled={!avail} onClick={() => selectDate(d)}
                          className={`h-7 w-full flex items-center justify-center rounded-lg text-[14px] font-medium transition-all duration-150
                            ${selected ? "bg-text-main text-white" : isToday && avail ? "bg-brand/15 text-text-main hover:bg-brand/25 cursor-pointer" : isToday ? "bg-brand/15 text-text-sub/30 cursor-not-allowed" : avail ? "text-text-main hover:bg-bg-sub cursor-pointer" : "text-text-sub/30 cursor-not-allowed"}`}>
                          {format(d, "d")}
                        </button>
                      );
                    })}
                  </div>
                </div>
                </div>

                {/* Time preference */}
                {date && (
                  <div className="flex flex-col gap-2 animate-fadeInDown" style={{ animationDuration: "250ms" }}>
                    <p className="text-[16px] font-medium text-text-main">Choose your preferred time</p>
                    <div className="grid grid-cols-3 gap-2">
                      {TIME_PREFS.map(({ key, label, range, Icon }) => {
                        const available = availablePrefs.some(p => p.key === key);
                        const selected  = timePref === key;
                        return (
                          <button key={key} type="button" disabled={!available} onClick={() => selectPref(key)}
                            className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border text-center transition-all duration-150
                              ${selected ? "border-text-main bg-bg-sub" : available ? "border-elements hover:border-text-sub/60 cursor-pointer" : "border-elements/50 opacity-30 cursor-not-allowed"}`}>
                            <Icon size={16} className={selected ? "text-text-main" : "text-text-sub"} strokeWidth={1.75} />
                            <p className={`text-[14px] font-medium leading-none ${selected ? "text-text-main" : "text-text-sub"}`}>{label}</p>
                            <p className={`text-[12px] leading-tight ${selected ? "text-text-sub" : "text-text-sub/60"}`}>{range}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* New slot summary */}
                {timePref && slot && date && (() => {
                  const pref     = TIME_PREFS.find(p => p.key === timePref)!;
                  const startFmt = formatHour(pref.window[0]);
                  const endFmt   = formatHour(pref.window[1]);
                  const dateFmt  = format(new Date(date + "T12:00:00"), "MMMM d, yyyy");
                  return (
                    <p className="text-[16px] text-text-sub animate-fadeInDown" style={{ animationDuration: "200ms" }}>
                      Your new slot is between{" "}
                      <span className="font-medium text-text-main">{startFmt} – {endFmt}</span>{" "}
                      on <span className="font-medium text-text-main">{dateFmt}</span>.
                    </p>
                  );
                })()}

              </div>
            )}
          </div>

          {/* Sticky footer CTA */}
          <div className="shrink-0 px-6 py-4 border-t border-elements">
            {done ? (
              <button
                type="button"
                onClick={onClose}
                className="w-full h-11 rounded-lg bg-text-main text-brand-sub text-[16px] font-medium
                  hover:opacity-90 active:scale-[0.99] transition-all duration-200"
              >
                Done
              </button>
            ) : (
              <button
                type="button"
                onClick={handleConfirm}
                disabled={!canConfirm}
                className="w-full h-11 rounded-lg bg-text-main text-brand-sub text-[16px] font-medium
                  hover:opacity-90 active:scale-[0.99] transition-all duration-200
                  disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {submitting ? "Rescheduling…" : "Confirm reschedule"}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );

  return createPortal(panel, document.body);
}
