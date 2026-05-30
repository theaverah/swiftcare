"use client";

import { useState, useMemo } from "react";
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  getDay, isBefore, startOfDay, isSameDay, addMonths, subMonths,
  isSameMonth,
} from "date-fns";
import { ChevronLeft, ChevronRight, Sun, Sunset, Moon } from "lucide-react";
import type { Doctor, DoctorAvailability } from "@/types/doctor";
import type { BookingData } from "./BookingModal";

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
  { key: "morning"   as const, label: "Morning",   range: "6:00 AM – 12:00 PM", window: [6,  12] as [number,number], Icon: Sun     },
  { key: "afternoon" as const, label: "Afternoon",  range: "12:00 PM – 6:00 PM", window: [12, 18] as [number,number], Icon: Sunset  },
  { key: "evening"   as const, label: "Evening",    range: "6:00 PM – 10:00 PM", window: [18, 22] as [number,number], Icon: Moon    },
];

function getAvailablePrefs(slot: DoctorAvailability) {
  const s = parseHour(slot.startTime);
  const e = parseHour(slot.endTime);
  return TIME_PREFS.filter(({ window: [ws, we] }) => s < we && e > ws);
}

function assignSlot(slot: DoctorAvailability, window: [number, number]): string {
  const s = parseHour(slot.startTime);
  const start = Math.max(s, window[0]);
  return formatHour(start);
}

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

// -- Props ---------------------------------------------------------------------

interface Props {
  doctor:          Doctor;
  data:            BookingData;
  onChange:        (patch: Partial<BookingData>) => void;
  onContinue:      () => void;
  rescheduleMode?: boolean;
}

// -- Component -----------------------------------------------------------------

export function BookingStep1({ doctor, data, onChange, onContinue, rescheduleMode }: Props) {
  const today = startOfDay(new Date());
  const [month, setMonth] = useState(() => startOfMonth(today));

  const specs = doctor.specializations?.join(", ") || "";

  // Calendar days for current month view
  const calDays = useMemo(() => {
    const first = startOfMonth(month);
    const last  = endOfMonth(month);
    const days  = eachDayOfInterval({ start: first, end: last });
    const prefixCount = getDay(first); // 0=Sun
    return { days, prefixCount };
  }, [month]);

  // Check if a date has doctor availability
  function isAvailable(date: Date) {
    if (isBefore(date, today)) return false;
    const dow = getDay(date);
    return doctor.availability.some(a => a.dayOfWeek === dow && a.isAvailable);
  }

  // Get doctor slot for selected date
  const selectedSlot = useMemo(() => {
    if (!data.date) return null;
    const dow = getDay(new Date(data.date + "T12:00:00"));
    return doctor.availability.find(a => a.dayOfWeek === dow && a.isAvailable) ?? null;
  }, [data.date, doctor.availability]);

  const availablePrefs = useMemo(
    () => selectedSlot ? getAvailablePrefs(selectedSlot) : [],
    [selectedSlot]
  );

  function selectDate(date: Date) {
    if (!isAvailable(date)) return;
    const dateStr = format(date, "yyyy-MM-dd");
    onChange({ date: dateStr, timePreference: null, assignedSlot: "" });
  }

  function selectPref(key: BookingData["timePreference"]) {
    if (!selectedSlot || !key) return;
    const pref = TIME_PREFS.find(p => p.key === key)!;
    const slot = assignSlot(selectedSlot, pref.window);
    onChange({ timePreference: key, assignedSlot: slot });
  }

  const canContinue = !!data.date && !!data.timePreference;

  return (
    <div className="flex flex-col gap-6">

      {/* Doctor context */}
      <div className="flex items-center gap-3 p-3 bg-bg-sub rounded-lg border border-elements">
        <div className="w-10 h-10 rounded-full bg-brand-sub flex items-center justify-center shrink-0">
          {doctor.profileImage ? (
            <img src={doctor.profileImage} alt="" className="w-full h-full rounded-full object-cover" />
          ) : (
            <span className="text-[13px] font-medium text-brand select-none">
              {doctor.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
            </span>
          )}
        </div>
        <div className="min-w-0">
          <p className="text-[14px] font-medium text-text-main leading-tight truncate">Dr. {doctor.name}</p>
          {specs && <p className="text-[12px] text-text-sub leading-tight truncate">{specs}</p>}
        </div>
      </div>

      {/* Reschedule note */}
      {rescheduleMode && (
        <div className="px-3.5 py-2.5 rounded-lg bg-brand-sub border border-brand/20">
          <p className="text-[13px] text-brand leading-relaxed">
            You&apos;re rescheduling your consultation with{" "}
            <span className="font-medium">Dr. {doctor.name}</span>. Pick a new date and time.
          </p>
        </div>
      )}

      {/* Heading */}
      <div className="flex flex-col gap-1">
        <h3 className="text-[20px] font-medium text-text-main tracking-[-0.03em]">
          {rescheduleMode ? "Pick a new date and time" : "When would you like to meet?"}
        </h3>
        <p className="text-[14px] text-text-sub">
          Pick a date and your preferred time of day. We&apos;ll find you the best available slot.
        </p>
      </div>

      {/* Calendar */}
      <div className="flex flex-col gap-3">
        {/* Month nav */}
        <div className="flex items-center justify-between">
          <p className="text-[14px] font-medium text-text-main">
            {format(month, "MMMM yyyy")}
          </p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setMonth(m => subMonths(m, 1))}
              disabled={isSameMonth(month, today)}
              className="w-7 h-7 flex items-center justify-center rounded-md text-text-sub
                hover:bg-bg-sub hover:text-text-main transition-colors duration-150
                disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={14} strokeWidth={2} />
            </button>
            <button
              type="button"
              onClick={() => setMonth(m => addMonths(m, 1))}
              className="w-7 h-7 flex items-center justify-center rounded-md text-text-sub
                hover:bg-bg-sub hover:text-text-main transition-colors duration-150"
            >
              <ChevronRight size={14} strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1">
          {WEEKDAYS.map(d => (
            <div key={d} className="h-7 flex items-center justify-center text-[11px] font-medium text-text-sub">
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: calDays.prefixCount }).map((_, i) => (
            <div key={`pre-${i}`} />
          ))}
          {calDays.days.map(date => {
            const avail    = isAvailable(date);
            const selected = data.date === format(date, "yyyy-MM-dd");
            const isToday  = isSameDay(date, today);

            return (
              <button
                key={date.toISOString()}
                type="button"
                disabled={!avail}
                onClick={() => selectDate(date)}
                className={`
                  h-8 w-full flex items-center justify-center rounded-lg text-[13px] font-medium
                  transition-all duration-150 relative
                  ${selected
                    ? "bg-text-main text-white"
                    : avail
                      ? "text-text-main hover:bg-bg-sub cursor-pointer"
                      : "text-text-sub/30 cursor-not-allowed"}
                `}
              >
                {format(date, "d")}
                {isToday && !selected && (
                  <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-brand" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Time preference */}
      {data.date && (
        <div className="flex flex-col gap-2 animate-fadeInDown" style={{ animationDuration: "250ms" }}>
          <p className="text-[16px] font-medium text-text-main">Time preference</p>
          <div className="grid grid-cols-3 gap-2">
            {TIME_PREFS.map(({ key, label, range, Icon }) => {
              const available = availablePrefs.some(p => p.key === key);
              const selected  = data.timePreference === key;
              return (
                <button
                  key={key}
                  type="button"
                  disabled={!available}
                  onClick={() => selectPref(key)}
                  className={`
                    flex flex-col items-center gap-1.5 p-3 rounded-lg border text-center
                    transition-all duration-150
                    ${selected
                      ? "border-text-main bg-bg-sub"
                      : available
                        ? "border-elements hover:border-text-sub/60 cursor-pointer"
                        : "border-elements/50 opacity-30 cursor-not-allowed"}
                  `}
                >
                  <Icon size={16} className={selected ? "text-text-main" : "text-text-sub"} strokeWidth={1.75} />
                  <p className={`text-[13px] font-medium leading-none ${selected ? "text-text-main" : "text-text-sub"}`}>{label}</p>
                  <p className={`text-[10px] leading-tight ${selected ? "text-text-sub" : "text-text-sub/60"}`}>{range}</p>
                </button>
              );
            })}
          </div>
          {data.timePreference && data.assignedSlot && (
            <p className="text-[12px] text-text-sub animate-fadeInDown" style={{ animationDuration: "200ms" }}>
              Your assigned slot: <span className="font-medium text-text-main">{data.assignedSlot}</span> on{" "}
              <span className="font-medium text-text-main">
                {format(new Date(data.date + "T12:00:00"), "MMMM d, yyyy")}
              </span>
            </p>
          )}
          <p className="text-[11px] text-text-sub/70">
            Your exact slot will be confirmed based on availability within your preferred window.
          </p>
        </div>
      )}

      {/* Who is this for */}
      <div className="flex flex-col gap-2">
        <p className="text-[14px] font-medium text-text-main">Who is this for?</p>
        <div className="grid grid-cols-2 gap-2">
          {(["myself", "someone_else"] as const).map(opt => {
            const selected = data.forSelf ? opt === "myself" : opt === "someone_else";
            return (
              <button
                key={opt}
                type="button"
                onClick={() => onChange({ forSelf: opt === "myself", patientName: "", relationship: "" })}
                className={`
                  flex items-center justify-center py-2.5 px-4 rounded-lg border text-[14px] font-medium
                  transition-all duration-150
                  ${selected
                    ? "border-text-main bg-bg-sub text-text-main"
                    : "border-elements text-text-sub hover:border-text-sub/60"}
                `}
              >
                {opt === "myself" ? "Myself" : "Someone else"}
              </button>
            );
          })}
        </div>

        {!data.forSelf && (
          <div className="flex flex-col gap-2 mt-1 animate-fadeInDown" style={{ animationDuration: "200ms" }}>
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-text-main">Their name</label>
              <input
                type="text"
                value={data.patientName}
                onChange={e => onChange({ patientName: e.target.value })}
                placeholder="Full name"
                className="h-10 px-3 rounded-lg border border-elements text-[14px] text-text-main
                  placeholder:text-text-sub/60 outline-none focus:border-text-main transition-colors duration-200 bg-bg-main"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-text-main">Relationship</label>
              <select
                value={data.relationship}
                onChange={e => onChange({ relationship: e.target.value })}
                className="h-10 px-3 rounded-lg border border-elements text-[14px] text-text-main
                  outline-none focus:border-text-main transition-colors duration-200 bg-bg-main"
              >
                <option value="">Select relationship</option>
                {["Parent", "Child", "Spouse", "Sibling", "Grandparent", "Friend", "Other"].map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Reason */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[14px] font-medium text-text-main">
          Reason for visit <span className="text-text-sub font-normal">(optional)</span>
        </label>
        <textarea
          rows={3}
          value={data.reason}
          onChange={e => onChange({ reason: e.target.value })}
          placeholder="e.g. follow-up checkup, recurring headaches, skin concern..."
          className="px-3 py-2.5 rounded-lg border border-elements text-[14px] text-text-main
            placeholder:text-text-sub/60 outline-none focus:border-text-main transition-colors
            duration-200 resize-none bg-bg-main"
        />
      </div>

      {/* CTA */}
      <button
        type="button"
        onClick={onContinue}
        disabled={!canContinue}
        className="w-full h-11 rounded-lg bg-text-main text-brand-sub text-[14px] font-medium
          hover:opacity-90 active:scale-[0.99] transition-all duration-200
          disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Continue to review
      </button>
    </div>
  );
}
