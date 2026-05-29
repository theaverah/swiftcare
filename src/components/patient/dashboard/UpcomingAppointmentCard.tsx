"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Calendar, Clock, Video } from "lucide-react";

interface Appointment {
  _id: string;
  doctorName: string;
  specialization: string;
  date: string;
  status: "scheduled" | "ongoing" | "completed" | "cancelled";
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric",
  });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric", minute: "2-digit",
  });
}

function statusLabel(status: Appointment["status"]) {
  const map: Record<Appointment["status"], { label: string; className: string }> = {
    scheduled: { label: "Scheduled",  className: "bg-brand-sub text-brand" },
    ongoing:   { label: "Ongoing",    className: "bg-success/10 text-success" },
    completed: { label: "Completed",  className: "bg-bg-sub text-text-sub" },
    cancelled: { label: "Cancelled",  className: "bg-error/10 text-error" },
  };
  return map[status] ?? map.scheduled;
}

function Skeleton() {
  return (
    <div className="flex flex-col gap-4 p-5 rounded-lg border border-elements bg-bg-main">
      <div className="flex items-center justify-between">
        <div className="h-4 w-36 rounded skeleton" />
        <div className="h-5 w-20 rounded skeleton" />
      </div>
      <div className="flex flex-col gap-2">
        <div className="h-5 w-48 rounded skeleton" />
        <div className="h-4 w-32 rounded skeleton" />
      </div>
      <div className="flex items-center gap-4">
        <div className="h-4 w-28 rounded skeleton" />
        <div className="h-4 w-20 rounded skeleton" />
      </div>
      <div className="h-10 w-40 rounded-lg skeleton" />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-4 py-12 px-6 rounded-lg border border-elements bg-bg-main text-center">
      <img
        src="/illustrations/no-data.svg"
        alt=""
        aria-hidden
        className="w-66 max-w-full select-none opacity-90"
      />
      <div className="flex flex-col gap-1">
        <p className="text-[16px] font-medium text-text-main">No upcoming consultations.</p>
        <Link
          href="/patient/doctors"
          className="text-[16px] text-brand hover:underline transition-colors duration-200"
        >
          Book your first consultation.
        </Link>
      </div>
    </div>
  );
}

export function UpcomingAppointmentCard() {
  const [loading,     setLoading]     = useState(true);
  const [appointment, setAppointment] = useState<Appointment | null>(null);

  useEffect(() => {
    async function fetchAppointment() {
      try {
        const res = await fetch("/api/patient/appointments?upcoming=true&limit=1");
        if (!res.ok) throw new Error();
        const data = await res.json();
        setAppointment(data.appointment ?? null);
      } catch {
        setAppointment(null);
      } finally {
        setLoading(false);
      }
    }
    fetchAppointment();
  }, []);

  if (loading) return <Skeleton />;
  if (!appointment) return <EmptyState />;

  const appointmentDate = new Date(appointment.date);
  const now             = new Date();
  const diffMins        = (appointmentDate.getTime() - now.getTime()) / 60000;
  const canJoin         = appointment.status === "ongoing" || (diffMins >= -30 && diffMins <= 15);

  const badge = statusLabel(appointment.status);

  return (
    <div className="flex flex-col gap-4 p-5 rounded-lg border border-elements bg-bg-main">

      <div className="flex items-center justify-between">
        <p className="text-[16px] font-medium text-text-sub">Upcoming appointment</p>
        <span className={`text-[12px] font-medium px-2 py-0.5 rounded ${badge.className}`}>
          {badge.label}
        </span>
      </div>

      <div className="flex flex-col gap-0.5">
        <p className="text-[16px] font-medium text-text-main">Dr. {appointment.doctorName}</p>
        <p className="text-[16px] text-text-sub">{appointment.specialization}</p>
      </div>

      <div className="flex items-center gap-4 text-[16px] text-text-sub">
        <span className="flex items-center gap-1.5">
          <Calendar size={14} strokeWidth={1.75} />
          {formatDate(appointment.date)}
        </span>
        <span className="flex items-center gap-1.5">
          <Clock size={14} strokeWidth={1.75} />
          {formatTime(appointment.date)}
        </span>
      </div>

      {canJoin ? (
        <Link
          href={`/patient/appointments/${appointment._id}/join`}
          className="inline-flex items-center gap-2 h-10 px-5 rounded-lg bg-success text-white text-[16px] font-medium hover:opacity-90 transition-all duration-200 w-fit"
        >
          <Video size={15} strokeWidth={1.75} />
          Join Consultation
        </Link>
      ) : (
        <Link
          href={`/patient/appointments/${appointment._id}`}
          className="text-[16px] text-text-sub hover:text-text-main transition-colors duration-200"
        >
          View Details →
        </Link>
      )}

    </div>
  );
}
