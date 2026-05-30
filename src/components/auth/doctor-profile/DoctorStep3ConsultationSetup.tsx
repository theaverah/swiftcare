"use client";

import { useState, useEffect, useRef } from "react";
import { Check, ChevronDown, Plus, X } from "lucide-react";
import type { DoctorProfileData, ScheduleDay, BreakSlot } from "./DoctorProfileFlow";
import { DAYS } from "./DoctorProfileFlow";

interface Props {
  data: DoctorProfileData;
  onChange: (patch: Partial<DoctorProfileData>) => void;
  onContinue: () => void;
  onBack: () => void;
  triggerValidation: number;
}

// --- Time slots ---------------------------------------------------------------

function generateTimeSlots(): string[] {
  const slots: string[] = [];
  for (let h = 6; h <= 22; h++) {
    for (const m of [0, 30]) {
      if (h === 22 && m === 30) break;
      const hour = h > 12 ? h - 12 : h === 0 ? 12 : h;
      const ampm = h < 12 ? "AM" : "PM";
      slots.push(`${hour}:${m === 0 ? "00" : "30"} ${ampm}`);
    }
  }
  return slots;
}

const TIME_SLOTS = generateTimeSlots();

function timeToMinutes(t: string): number {
  const [time, ampm] = t.split(" ");
  let [h, m] = time.split(":").map(Number);
  if (ampm === "PM" && h !== 12) h += 12;
  if (ampm === "AM" && h === 12) h = 0;
  return h * 60 + m;
}

// --- TimeSelect ---------------------------------------------------------------

function TimeSelect({ value, onChange, borderClass, height = "h-9" }: {
  value: string;
  onChange: (v: string) => void;
  borderClass: string;
  height?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  return (
    <div ref={ref} className="relative flex-1">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`w-full ${height} rounded-lg border pl-3 pr-3 text-[14px] text-text-main bg-white flex items-center justify-between gap-2 transition-colors duration-200 ${borderClass}`}
      >
        <span className="truncate">{value}</span>
        <ChevronDown size={14} strokeWidth={1.75} className={`text-text-sub shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute z-50 top-full mt-1 w-full bg-white border border-elements rounded-xl shadow-lg overflow-hidden">
          <div className="max-h-48 overflow-y-auto">
            {TIME_SLOTS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => { onChange(t); setOpen(false); }}
                className={`w-full px-4 py-2.5 text-left text-[14px] flex items-center justify-between hover:bg-background-sub transition-colors duration-150 ${
                  t === value ? "text-brand font-medium" : "text-text-main"
                }`}
              >
                {t}
                {t === value && <Check size={13} strokeWidth={1.75} className="text-brand shrink-0" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// --- Component ----------------------------------------------------------------

export function DoctorStep3ConsultationSetup({ data, onChange, onContinue, onBack, triggerValidation }: Props) {
  const [feeFocused,  setFeeFocused]  = useState(false);
  const [feeTouched,  setFeeTouched]  = useState(false);
  const [daysTouched, setDaysTouched] = useState(false);

  useEffect(() => {
    if (triggerValidation > 0) {
      setFeeTouched(true);
      setDaysTouched(true);
    }
  }, [triggerValidation]);

  // -- Schedule helpers --------------------------------------------------------

  function updateDay(day: string, patch: Partial<ScheduleDay>) {
    onChange({
      schedule: { ...data.schedule, [day]: { ...data.schedule[day], ...patch } },
    });
  }

  function toggleDay(day: string) {
    updateDay(day, { enabled: !data.schedule[day].enabled });
  }

  function addBreak(day: string) {
    const current = data.schedule[day];
    updateDay(day, {
      breaks: [...(current.breaks ?? []), { startTime: "12:00 PM", endTime: "12:30 PM" }],
    });
  }

  function updateBreak(day: string, idx: number, patch: Partial<BreakSlot>) {
    const breaks = (data.schedule[day].breaks ?? []).map((b, i) =>
      i === idx ? { ...b, ...patch } : b
    );
    updateDay(day, { breaks });
  }

  function removeBreak(day: string, idx: number) {
    const breaks = (data.schedule[day].breaks ?? []).filter((_, i) => i !== idx);
    updateDay(day, { breaks });
  }

  function breakError(day: string, brk: BreakSlot, idx: number): string {
    const { startTime: dayStart, endTime: dayEnd, breaks } = data.schedule[day];
    const brkStart = timeToMinutes(brk.startTime);
    const brkEnd   = timeToMinutes(brk.endTime);

    if (brkStart >= brkEnd)
      return "Break end time must be after the start time";

    if (brkStart < timeToMinutes(dayStart) || brkEnd > timeToMinutes(dayEnd))
      return "Break must be within your working hours";

    for (let i = 0; i < breaks.length; i++) {
      if (i === idx) continue;
      const o = breaks[i];
      if (timeToMinutes(o.startTime) < brkEnd && timeToMinutes(o.endTime) > brkStart)
        return "This break overlaps with another break";
    }

    return "";
  }

  function noSlotsLeft(day: string): boolean {
    const { startTime: dayStart, endTime: dayEnd, breaks } = data.schedule[day];
    if (!breaks.length) return false;
    // Only flag when all individual breaks are valid
    if (breaks.some((b, i) => breakError(day, b, i))) return false;
    const start = timeToMinutes(dayStart);
    const end   = timeToMinutes(dayEnd);
    for (let s = start; s + 30 <= end; s += 30) {
      const free = !breaks.some(
        (b) => timeToMinutes(b.startTime) < s + 30 && timeToMinutes(b.endTime) > s
      );
      if (free) return false;
    }
    return true;
  }

  // -- Derived state -----------------------------------------------------------

  const feeNum   = parseFloat(data.consultationFee);
  const feeValid = !isNaN(feeNum) && feeNum >= 100 && feeNum <= 5000;
  const feeError = feeTouched && !feeFocused && !feeValid;

  function feeErrorMessage(): string {
    if (!data.consultationFee) return "Please enter your consultation fee";
    if (isNaN(feeNum) || feeNum <= 0) return "Please enter a valid fee";
    if (feeNum < 100) return "Consultation fee must be at least PHP 100.";
    if (feeNum > 5000) return "Consultation fee cannot exceed PHP 5,000.";
    return "Please enter a valid fee";
  }

  const enabledDays = DAYS.filter((d) => data.schedule[d]?.enabled);

  const daysValid = enabledDays.length > 0 && enabledDays.every((d) => {
    const { startTime, endTime } = data.schedule[d];
    return startTime && endTime && timeToMinutes(startTime) < timeToMinutes(endTime);
  });

  const breaksValid = enabledDays.every((d) => {
    const breaks = data.schedule[d].breaks ?? [];
    return breaks.every((brk, i) => !breakError(d, brk, i)) && !noSlotsLeft(d);
  });

  const daysError   = daysTouched && !daysValid;
  const canContinue = feeValid && daysValid && breaksValid;

  function feeBorderClass() {
    if (feeError)   return "border-error";
    if (feeValid)   return "border-success";
    if (feeFocused) return "border-text-main";
    return "border-elements";
  }

  const inputBase = "w-full h-full px-4 text-[14px] text-text-main bg-white outline-none placeholder:text-text-sub [appearance:textfield] [&::-webkit-outer-spin-button]:hidden [&::-webkit-inner-spin-button]:hidden";


  return (
    <div className="flex flex-col gap-4">

      {/* -- Heading --------------------------------------------------- */}
      <div className="flex flex-col gap-0.5 animate-fadeInDown" style={{ animationDelay: "0ms" }}>
        <h1 className="text-[24px] font-medium text-text-main tracking-[-0.264px] leading-normal">
          Set your availability
        </h1>
        <p className="text-[14px] text-text-sub leading-normal">
          Patients will book from the slots you set here.
        </p>
      </div>

      {/* -- Consultation fee ------------------------------------------ */}
      <div className="flex flex-col gap-1.5 mt-3 animate-fadeInDown" style={{ animationDelay: "60ms" }}>
        <div className="flex flex-col gap-0.5">
          <label className="text-[14px] font-medium text-text-main">Consultation fee</label>
          <p className="text-[14px] text-text-sub leading-normal">
            100% goes to you. SwiftCare charges no platform fees.
          </p>
        </div>
        <div className={`flex items-center h-10 rounded-lg border overflow-hidden transition-colors duration-200 ${feeBorderClass()}`}>
          <div className="flex items-center px-3 h-full border-r border-elements shrink-0">
            <span className="text-[14px] text-text-sub select-none font-medium">PHP</span>
          </div>
          <input
            type="number"
            value={data.consultationFee}
            onChange={(e) => onChange({ consultationFee: e.target.value })}
            onKeyDown={(e) => ["e", "E", "+", "-"].includes(e.key) && e.preventDefault()}
            onFocus={() => setFeeFocused(true)}
            onBlur={() => { setFeeFocused(false); setFeeTouched(true); }}
            placeholder="0"
            min={0}
            className={inputBase}
          />
          {feeValid && (
            <div className="flex items-center pr-3 shrink-0">
              <Check size={14} strokeWidth={1.75} className="text-success" />
            </div>
          )}
        </div>
        {feeError && (
          <p className="text-[14px] text-error leading-normal animate-fadeInDown" style={{ animationDuration: "200ms" }}>
            {feeErrorMessage()}
          </p>
        )}
      </div>

      {/* -- Weekly schedule ------------------------------------------- */}
      <div className="flex flex-col gap-3 animate-fadeInDown" style={{ animationDelay: "120ms" }}>
        <div className="flex flex-col gap-0.5">
          <label className="text-[14px] font-medium text-text-main">Weekly schedule</label>
          <p className="text-[14px] text-text-sub leading-normal">
            Appointments are automatically scheduled in 30-minute slots within your set hours.
          </p>
        </div>

        {/* Day chips */}
        <div className="flex gap-2">
          {DAYS.map((day) => {
            const enabled = data.schedule[day]?.enabled;
            return (
              <button
                key={day}
                type="button"
                onClick={() => { toggleDay(day); setDaysTouched(true); }}
                className={`flex-1 h-8 rounded-lg text-[14px] font-medium transition-all duration-200 ${
                  enabled
                    ? "bg-text-main text-brand-sub"
                    : "bg-background-sub border border-elements text-text-sub hover:text-text-main hover:border-text-sub"
                }`}
              >
                {day}
              </button>
            );
          })}
        </div>

        {/* Time pickers for enabled days */}
        {enabledDays.length > 0 && (
          <div className="flex flex-col pt-1 divide-y divide-elements">
            {enabledDays.map((day) => {
              const { startTime, endTime, breaks = [] } = data.schedule[day];
              const timeInvalid = startTime && endTime && timeToMinutes(startTime) >= timeToMinutes(endTime);

              return (
                <div key={day} className="flex flex-col gap-2 pt-4 pb-4 first:pt-0 last:pb-0">

                  {/* Operating hours row */}
                  <div className="flex items-center gap-3">
                    <span className="text-[14px] text-text-sub w-8 shrink-0">{day}</span>
                    <TimeSelect
                      value={startTime}
                      onChange={(v) => updateDay(day, { startTime: v })}
                      borderClass={timeInvalid ? "border-error" : "border-elements focus:border-text-main"}
                    />
                    <span className="text-[14px] text-text-sub shrink-0">to</span>
                    <TimeSelect
                      value={endTime}
                      onChange={(v) => updateDay(day, { endTime: v })}
                      borderClass={timeInvalid ? "border-error" : "border-elements focus:border-text-main"}
                    />
                  </div>

                  {/* Add break button */}
                  <div className="pl-11">
                    <button
                      type="button"
                      onClick={() => addBreak(day)}
                      className="flex items-center gap-1.5 h-7 px-2.5 rounded-md border border-elements text-[13px] text-text-sub hover:border-text-sub hover:text-text-main transition-colors duration-150"
                    >
                      <Plus size={12} strokeWidth={1.75} />
                      Add break
                    </button>
                  </div>

                  {/* Break rows */}
                  {breaks.map((brk, idx) => {
                    const err = breakError(day, brk, idx);
                    return (
                      <div key={idx} className="flex flex-col gap-1 pl-11">
                        <div className="flex items-center gap-3">
                          <TimeSelect
                            value={brk.startTime}
                            onChange={(v) => updateBreak(day, idx, { startTime: v })}
                            borderClass={err ? "border-error" : "border-elements focus:border-text-main"}
                            height="h-8"
                          />
                          <span className="text-[14px] text-text-sub shrink-0">to</span>
                          <TimeSelect
                            value={brk.endTime}
                            onChange={(v) => updateBreak(day, idx, { endTime: v })}
                            borderClass={err ? "border-error" : "border-elements focus:border-text-main"}
                            height="h-8"
                          />
                          <button
                            type="button"
                            onClick={() => removeBreak(day, idx)}
                            className="shrink-0 text-text-sub hover:text-text-main transition-colors duration-150"
                          >
                            <X size={14} strokeWidth={1.75} />
                          </button>
                        </div>
                        {err && (
                          <p className="text-[13px] text-error leading-normal animate-fadeInDown" style={{ animationDuration: "200ms" }}>
                            {err}
                          </p>
                        )}
                      </div>
                    );
                  })}

                  {/* Day-level: no slots left */}
                  {noSlotsLeft(day) && (
                    <p className="text-[13px] text-error leading-normal pl-11 animate-fadeInDown" style={{ animationDuration: "200ms" }}>
                      Your breaks leave no available slots for this day
                    </p>
                  )}

                </div>
              );
            })}
          </div>
        )}

        {daysError && (
          <p className="text-[14px] text-error leading-normal animate-fadeInDown" style={{ animationDuration: "200ms" }}>
            {enabledDays.length === 0
              ? "Please select at least one available day"
              : "End time must be after start time for all selected days"}
          </p>
        )}

      </div>

      {/* -- Buttons --------------------------------------------------- */}
      <div className="flex gap-3 mt-4 animate-fadeInDown" style={{ animationDelay: "180ms" }}>
        <button
          type="button"
          onClick={onBack}
          className="flex-1 h-10 rounded-lg border border-elements text-[14px] font-medium text-text-main hover:border-text-sub transition-colors duration-200"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onContinue}
          disabled={!canContinue}
          className={`flex-3 h-10 rounded-lg text-[14px] font-medium tracking-[-0.176px] text-brand-sub transition-all duration-200 ${canContinue ? "bg-text-main hover:opacity-90 cursor-pointer" : "bg-text-main/40 cursor-not-allowed"}`}
        >
          Continue
        </button>
      </div>

    </div>
  );
}
