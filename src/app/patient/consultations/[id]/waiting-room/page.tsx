"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Wifi, Mic, Video, ArrowLeft, CheckCircle, AlertCircle, Calendar, Clock } from "lucide-react";
import { format } from "date-fns";
import type { Consultation } from "@/types/consultation";

// -- Avatar palette (matches DoctorCard) ---------------------------------------

const AVATAR_PALETTES = [
  { bg: "#E8F4FD", color: "#2B7BB9" },
  { bg: "#FEF3E2", color: "#B5651D" },
  { bg: "#F0FDF4", color: "#15803D" },
  { bg: "#FDF2F8", color: "#9D174D" },
  { bg: "#F5F3FF", color: "#6D28D9" },
  { bg: "#FFF7ED", color: "#C2410C" },
  { bg: "#F0F9FF", color: "#0369A1" },
  { bg: "#FFF1F2", color: "#BE123C" },
  { bg: "#ECFDF5", color: "#065F46" },
  { bg: "#FEF9C3", color: "#854D0E" },
];

function avatarPalette(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) - hash) + name.charCodeAt(i);
    hash |= 0;
  }
  return AVATAR_PALETTES[Math.abs(hash) % AVATAR_PALETTES.length];
}

// -- Device status row ---------------------------------------------------------

type DeviceStatus = "checking" | "ready" | "check";

function DeviceRow({
  icon: Icon,
  label,
  status,
}: {
  icon: typeof Mic;
  label: string;
  status: DeviceStatus;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-elements last:border-0">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-bg-sub flex items-center justify-center shrink-0">
          <Icon size={15} strokeWidth={1.75} className="text-text-sub" />
        </div>
        <span className="text-[15px] text-text-main">{label}</span>
      </div>
      {status === "checking" ? (
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-elements animate-pulse" />
          <span className="text-[13px] text-text-sub">Checking…</span>
        </div>
      ) : status === "ready" ? (
        <div className="flex items-center gap-1.5">
          <CheckCircle size={14} strokeWidth={1.75} className="text-green-600" />
          <span className="text-[13px] font-medium text-green-600">Ready</span>
        </div>
      ) : (
        <div className="flex items-center gap-1.5">
          <AlertCircle size={14} strokeWidth={1.75} className="text-amber-600" />
          <span className="text-[13px] font-medium text-amber-600">Check settings</span>
        </div>
      )}
    </div>
  );
}

// -- Countdown formatter -------------------------------------------------------

function formatCountdown(s: number): string {
  if (s <= 0) return "Starting now";
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${sec.toString().padStart(2, "0")}s`;
  return `${sec}s`;
}

// -- Page ----------------------------------------------------------------------

export default function PatientWaitingRoomPage() {
  const { id }  = useParams<{ id: string }>();
  const router  = useRouter();

  const [consultation, setConsultation] = useState<Consultation | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [secondsLeft,  setSecondsLeft]  = useState<number | null>(null);
  const [wifi,   setWifi]   = useState<DeviceStatus>("checking");
  const [mic,    setMic]    = useState<DeviceStatus>("checking");
  const [camera, setCamera] = useState<DeviceStatus>("checking");

  // Load consultation
  useEffect(() => {
    async function load() {
      try {
        const res  = await fetch(`/api/patient/consultations/${id}`);
        const data = await res.json() as { consultation: Consultation };
        setConsultation(data.consultation);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  // Live countdown
  useEffect(() => {
    if (!consultation?.scheduledAt) return;
    function update() {
      const diff = Math.max(0, Math.floor(
        (new Date(consultation!.scheduledAt).getTime() - Date.now()) / 1000,
      ));
      setSecondsLeft(diff);
    }
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [consultation?.scheduledAt]);

  // Device checks
  useEffect(() => {
    setWifi(navigator.onLine ? "ready" : "check");
    const onOnline  = () => setWifi("ready");
    const onOffline = () => setWifi("check");
    window.addEventListener("online",  onOnline);
    window.addEventListener("offline", onOffline);

    navigator.permissions
      ?.query({ name: "microphone" as PermissionName })
      .then(r => setMic(r.state === "granted" ? "ready" : "check"))
      .catch(() => setMic("check"));

    navigator.permissions
      ?.query({ name: "camera" as PermissionName })
      .then(r => setCamera(r.state === "granted" ? "ready" : "check"))
      .catch(() => setCamera("check"));

    return () => {
      window.removeEventListener("online",  onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  const canJoin = secondsLeft !== null && secondsLeft <= 15 * 60;

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-sub flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-brand border-t-transparent animate-spin" />
      </div>
    );
  }

  const scheduledDate = consultation ? new Date(consultation.scheduledAt) : null;
  const dateLabel = scheduledDate ? format(scheduledDate, "EEEE, MMMM d, yyyy") : "";
  const timeLabel = scheduledDate ? format(scheduledDate, "h:mm aa") : "";

  const initials = consultation?.doctor.name
    .split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() ?? "";
  const palette = consultation ? avatarPalette(consultation.doctor.name) : AVATAR_PALETTES[0];

  return (
    <div className="min-h-screen bg-bg-sub flex flex-col">

      {/* Top nav */}
      <div className="px-6 py-4 shrink-0">
        <button
          type="button"
          onClick={() => router.push("/patient/consultations")}
          className="flex items-center gap-2 text-[14px] text-text-sub
            hover:text-text-main transition-colors duration-200"
        >
          <ArrowLeft size={15} strokeWidth={1.75} />
          Back to consultations
        </button>
      </div>

      {/* Centered content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
        <div
          className="w-full max-w-md flex flex-col gap-6 animate-fadeInDown"
          style={{ animationDuration: "400ms" }}
        >

          {/* Doctor card */}
          {consultation && (
            <div className="bg-bg-main rounded-xl border border-elements p-5 flex items-center gap-4">
              <div
                className="w-16 h-16 rounded-full overflow-hidden shrink-0 flex items-center justify-center border border-elements/50"
                style={{ backgroundColor: palette.bg }}
              >
                {consultation.doctor.profileImage ? (
                  <img
                    src={consultation.doctor.profileImage}
                    alt={consultation.doctor.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-[18px] font-medium select-none" style={{ color: palette.color }}>
                    {initials}
                  </span>
                )}
              </div>
              <div>
                <p className="text-[17px] font-medium text-text-main">Dr. {consultation.doctor.name}</p>
                <p className="text-[14px] text-text-sub mt-0.5">
                  {consultation.doctor.specializations[0] ?? "General Practitioner"}
                </p>
              </div>
            </div>
          )}

          {/* Heading */}
          <div className="text-center flex flex-col gap-2">
            <h1 className="text-[28px] font-medium text-text-main tracking-[-0.03em]">
              You&apos;re in the waiting room.
            </h1>
            <p className="text-[15px] text-text-sub leading-relaxed">
              Your doctor will be with you shortly. Take a moment to get ready.
            </p>
          </div>

          {/* Countdown */}
          {secondsLeft !== null && secondsLeft > 0 && (
            <div className="bg-bg-main rounded-xl border border-elements p-5 text-center">
              <p className="text-[13px] text-text-sub mb-2">Starting in</p>
              <p className="text-[40px] font-medium text-text-main tracking-tight tabular-nums leading-none">
                {formatCountdown(secondsLeft)}
              </p>
            </div>
          )}

          {secondsLeft === 0 && (
            <div className="bg-brand-sub rounded-xl border border-brand/20 p-4 text-center">
              <p className="text-[15px] font-medium text-brand">Your session is starting now</p>
            </div>
          )}

          {/* Device readiness */}
          <div className="bg-bg-main rounded-xl border border-elements px-5 pt-4 pb-1">
            <p className="text-[15px] font-medium text-text-main mb-2">Device readiness</p>
            <DeviceRow icon={Wifi}  label="Connection"  status={wifi}   />
            <DeviceRow icon={Mic}   label="Microphone"  status={mic}    />
            <DeviceRow icon={Video} label="Camera"      status={camera} />
          </div>

          {/* Reassurance */}
          <p className="text-center text-[13px] text-text-sub">
            If you experience any issues, try refreshing the page.
          </p>

          {/* Consultation details */}
          {consultation && (
            <div className="flex flex-col gap-2 px-1">
              <div className="flex items-center gap-2.5">
                <Calendar size={14} className="text-text-sub shrink-0" strokeWidth={1.75} />
                <span className="text-[14px] text-text-sub">{dateLabel}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Clock size={14} className="text-text-sub shrink-0" strokeWidth={1.75} />
                <span className="text-[14px] text-text-sub">
                  {timeLabel} · with Dr. {consultation.doctor.name}
                </span>
              </div>
            </div>
          )}

          {/* Join button with tooltip */}
          <div className="relative group/tooltip">
            <button
              type="button"
              disabled={!canJoin}
              onClick={() => router.push(`/patient/consultations/${id}/session`)}
              className={`w-full h-12 rounded-xl text-[16px] font-medium transition-all duration-200
                ${canJoin
                  ? "bg-brand text-white hover:opacity-90 active:scale-[0.99]"
                  : "bg-elements text-text-sub cursor-not-allowed"
                }`}
            >
              Join consultation
            </button>
            {!canJoin && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2
                opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-200
                pointer-events-none z-50 flex flex-col items-center">
                <div className="px-3 py-1.5 bg-text-main/80 rounded-lg text-[12px] text-white/90 whitespace-nowrap">
                  You can join 15 minutes before your session
                </div>
                <div
                  className="w-0 h-0"
                  style={{
                    borderLeft:  "5px solid transparent",
                    borderRight: "5px solid transparent",
                    borderTop:   "5px solid rgba(17,17,17,0.80)",
                  }}
                />
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
