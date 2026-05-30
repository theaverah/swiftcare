"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Video } from "lucide-react";
import { format } from "date-fns";

interface ScheduleAppt {
  id:              string;
  patientName:     string;
  scheduledAt:     string;
  durationMinutes: number;
  status:          string;
  chiefComplaint:  string | null;
}

interface Props {
  appointments: ScheduleAppt[];
}

const HOUR_HEIGHT = 64; // px per hour
const START_HOUR  = 7;  // 7 AM
const END_HOUR    = 21; // 9 PM

function fmt12(hour: number) {
  if (hour === 0)  return "12 AM";
  if (hour === 12) return "12 PM";
  return hour < 12 ? `${hour} AM` : `${hour - 12} PM`;
}

function getTimeTop(date: Date): number {
  return ((date.getHours() - START_HOUR) + date.getMinutes() / 60) * HOUR_HEIGHT;
}

function getApptHeight(minutes: number): number {
  return Math.max((minutes / 60) * HOUR_HEIGHT, 48);
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

export function TodayScheduleSkeleton() {
  return (
    <div className="bg-bg-main rounded-xl border border-elements p-5 flex flex-col gap-4 animate-pulse">
      <div className="h-5 w-40 rounded bg-elements/60" />
      <div className="flex flex-col gap-3">
        {[0, 1, 2].map(i => (
          <div key={i} className="h-14 rounded-lg bg-elements/40" />
        ))}
      </div>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function TodaySchedule({ appointments }: Props) {
  const router                = useRouter();
  const [nowTop, setNowTop]   = useState<number | null>(null);
  const containerRef          = useRef<HTMLDivElement>(null);
  const hours = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);
  const totalHeight = (END_HOUR - START_HOUR) * HOUR_HEIGHT;

  // Update time indicator every minute
  useEffect(() => {
    function update() {
      const now = new Date();
      const h = now.getHours();
      const m = now.getMinutes();
      if (h < START_HOUR || h >= END_HOUR) {
        setNowTop(null);
        return;
      }
      setNowTop(((h - START_HOUR) + m / 60) * HOUR_HEIGHT);
    }
    update();
    const id = setInterval(update, 60_000);
    return () => clearInterval(id);
  }, []);

  // Auto-scroll to current time on mount
  useEffect(() => {
    if (nowTop === null || !containerRef.current) return;
    const scrollTarget = Math.max(0, nowTop - 80);
    containerRef.current.scrollTop = scrollTarget;
  }, [nowTop]);

  if (appointments.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-12 px-6 rounded-xl border border-elements bg-bg-main text-center">
        <img src="/illustrations/no-data.svg" alt="" aria-hidden className="w-52 max-w-full select-none opacity-90" />
        <div className="flex flex-col gap-1">
          <p className="text-[16px] font-medium text-text-main">No consultations scheduled today</p>
          <p className="text-[16px] text-text-sub">Enjoy the break!</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="bg-bg-main rounded-xl border border-elements overflow-auto"
      style={{ maxHeight: "420px" }}
    >
      <div className="flex" style={{ minHeight: `${totalHeight}px` }}>

        {/* Time labels column */}
        <div className="shrink-0 relative" style={{ width: "64px", height: `${totalHeight}px` }}>
          {hours.map(hour => (
            <div
              key={hour}
              className="absolute right-3 text-[16px] text-text-sub select-none"
              style={{ top: `${(hour - START_HOUR) * HOUR_HEIGHT - 7}px` }}
            >
              {fmt12(hour)}
            </div>
          ))}
        </div>

        {/* Grid + appointments */}
        <div className="flex-1 relative border-l border-elements/50" style={{ height: `${totalHeight}px` }}>

          {/* Hour grid lines */}
          {hours.map(hour => (
            <div
              key={hour}
              className="absolute left-0 right-0 border-t border-elements/30"
              style={{ top: `${(hour - START_HOUR) * HOUR_HEIGHT}px` }}
            />
          ))}

          {/* Current time indicator */}
          {nowTop !== null && (
            <div
              className="absolute left-0 right-0 flex items-center gap-1 z-10 pointer-events-none"
              style={{ top: `${nowTop}px` }}
            >
              <div className="w-2 h-2 rounded-full bg-error shrink-0 -ml-1" />
              <div className="flex-1 h-px bg-error" />
            </div>
          )}

          {/* Appointment blocks */}
          {appointments.map(appt => {
            const date   = new Date(appt.scheduledAt);
            const top    = getTimeTop(date);
            const height = getApptHeight(appt.durationMinutes);
            const diffMs = date.getTime() - Date.now();
            const canJoin = appt.status === "ongoing" || diffMs <= 30 * 60_000;
            const timeStr = format(date, "h:mm aa");

            return (
              <div
                key={appt.id}
                className="absolute left-2 right-2 rounded-lg overflow-hidden
                  bg-brand-sub border border-brand/20 px-2.5 py-1.5 flex flex-col justify-between"
                style={{ top: `${top}px`, height: `${height}px` }}
              >
                <div className="flex-1 min-h-0">
                  <p className="text-[16px] font-medium text-brand leading-tight truncate">
                    {appt.patientName}
                  </p>
                  {appt.chiefComplaint && height > 52 && (
                    <p className="text-[16px] text-brand/70 truncate mt-0.5">
                      {appt.chiefComplaint}
                    </p>
                  )}
                  <p className="text-[16px] text-brand/60 mt-0.5">{timeStr}</p>
                </div>
                {canJoin && height >= 60 && (
                  <button
                    type="button"
                    onClick={() => router.push(`/doctor/consultations/${appt.id}/session`)}
                    className="mt-1 self-start flex items-center gap-1 text-[16px] font-medium
                      text-white bg-brand hover:opacity-90 px-2 py-0.5 rounded-md transition-opacity"
                  >
                    <Video size={13} strokeWidth={2} />
                    Join
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
