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

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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

  const canContinue = !!data.date && !!data.timePreference && !!data.reason.trim();

  return (
    <div className="flex flex-col gap-6">

      {/* Heading */}
      <div className="flex flex-col gap-1">
        <p className="text-[18px] font-medium text-text-main">
          {rescheduleMode ? "Pick a new date and time" : "When would you like to meet?"}
        </p>
        <p className="text-[14px] text-text-sub">
          Pick a date and your preferred time of day.
        </p>
      </div>

      {/* Calendar */}
      <div className="flex flex-col gap-2">
        <p className="text-[16px] font-medium text-text-main">Date</p>
        <div className="flex flex-col gap-3 p-4 rounded-xl bg-elements/20 border border-elements/60">
        {/* Month nav */}
        <div className="flex items-center justify-between">
          <p className="text-[16px] font-medium text-text-main">
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
        <div className="grid grid-cols-7">
          {WEEKDAYS.map(d => (
            <div key={d} className="h-6 flex items-center justify-center text-[14px] text-text-sub">
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-y-0.5">
          {Array.from({ length: calDays.prefixCount }).map((_, i) => (
            <div key={`pre-${i}`} className="h-7" />
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
                  h-7 w-full flex items-center justify-center rounded-lg text-[14px] font-medium
                  transition-all duration-150
                  ${selected
                    ? "bg-text-main text-white"
                    : isToday && avail
                      ? "bg-brand/15 text-text-main hover:bg-brand/25 cursor-pointer"
                      : isToday
                        ? "bg-brand/15 text-text-sub/30 cursor-not-allowed"
                        : avail
                          ? "text-text-main hover:bg-bg-sub cursor-pointer"
                          : "text-text-sub/30 cursor-not-allowed"}
                `}
              >
                {format(date, "d")}
              </button>
            );
          })}
        </div>
        </div>
      </div>

      {/* Time preference */}
      {data.date && (
        <div className="flex flex-col gap-2 animate-fadeInDown" style={{ animationDuration: "250ms" }}>
          <div className="flex flex-col gap-0.5">
            <p className="text-[16px] font-medium text-text-main">Preferred time</p>
            <p className="text-[14px] text-text-sub">Your exact slot will be confirmed based on availability within your preferred window.</p>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-2 mb-1">
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
                  <p className={`text-[14px] font-medium leading-none ${available ? "text-text-main" : "text-text-sub"}`}>{label}</p>
                  <p className={`text-[14px] leading-tight ${available ? "text-text-sub" : "text-text-sub/60"}`}>{range}</p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Who is this for */}
      <div className="flex flex-col gap-2">
        <p className="text-[16px] font-medium text-text-main">Booking for</p>
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
        <label className="text-[16px] font-medium text-text-main">
          Reason for visit
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

    </div>
  );
}
