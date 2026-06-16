"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Wifi, Mic, Video, CheckCircle, AlertCircle, Calendar, Clock } from "lucide-react";
import { format } from "date-fns";

// -- Types ---------------------------------------------------------------------

interface DoctorConsultation {
  id:              string;
  patientName:     string;
  scheduledAt:     string;
  durationMinutes: number;
  status:          string;
  chiefComplaint:  string | null;
}

// -- Device row ----------------------------------------------------------------

type DeviceStatus = "checking" | "ready" | "check";

function DeviceRow({ icon: Icon, label, status }: {
  icon: typeof Mic;
  label: string;
  status: DeviceStatus;
}) {
  return (
    <div className="flex items-center justify-between py-3.5 border-b border-elements last:border-0">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-bg-sub flex items-center justify-center shrink-0">
          <Icon size={15} strokeWidth={1.75} className="text-text-sub" />
        </div>
        <span className="text-[15px] text-text-main">{label}</span>
      </div>
      {status === "checking" ? (
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-elements animate-pulse" />
          <span className="text-[14px] text-text-sub">Checking…</span>
        </div>
      ) : status === "ready" ? (
        <div className="flex items-center gap-1.5">
          <CheckCircle size={14} strokeWidth={1.75} className="text-green-600" />
          <span className="text-[14px] font-medium text-green-600">Ready</span>
        </div>
      ) : (
        <div className="flex items-center gap-1.5">
          <AlertCircle size={14} strokeWidth={1.75} className="text-amber-600" />
          <span className="text-[14px] font-medium text-amber-600">Check settings</span>
        </div>
      )}
    </div>
  );
}

// -- Countdown -----------------------------------------------------------------

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

export default function DoctorWaitingRoomPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [consultation, setConsultation] = useState<DoctorConsultation | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [secondsLeft,  setSecondsLeft]  = useState<number | null>(null);
  const [wifi,   setWifi]   = useState<DeviceStatus>("checking");
  const [mic,    setMic]    = useState<DeviceStatus>("checking");
  const [camera, setCamera] = useState<DeviceStatus>("checking");

  useEffect(() => {
    async function load() {
      try {
        const res  = await fetch(`/api/doctor/consultations/${id}`);
        const data = await res.json() as { consultation: DoctorConsultation };
        setConsultation(data.consultation);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

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

  useEffect(() => {
    setWifi(navigator.onLine ? "ready" : "check");
    const onOnline  = () => setWifi("ready");
    const onOffline = () => setWifi("check");
    window.addEventListener("online",  onOnline);
    window.addEventListener("offline", onOffline);

    navigator.permissions
      ?.query({ name: "microphone" as PermissionName })
      .then((r) => setMic(r.state === "granted" ? "ready" : "check"))
      .catch(() => setMic("check"));

    navigator.permissions
      ?.query({ name: "camera" as PermissionName })
      .then((r) => setCamera(r.state === "granted" ? "ready" : "check"))
      .catch(() => setCamera("check"));

    return () => {
      window.removeEventListener("online",  onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-brand border-t-transparent animate-spin" />
      </div>
    );
  }

  const scheduledDate = consultation ? new Date(consultation.scheduledAt) : null;
  const dateLabel     = scheduledDate ? format(scheduledDate, "EEEE, MMMM d, yyyy") : "";
  const timeLabel     = scheduledDate ? format(scheduledDate, "h:mm aa") : "";
  const initials      = (consultation?.patientName ?? "")
    .split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="flex flex-col items-center py-6 px-4">
      <div
        className="w-full max-w-md flex flex-col gap-5 animate-fadeInDown"
        style={{ animationDuration: "400ms" }}
      >

        {/* Date + time — at the top */}
        {consultation && (
          <div className="flex flex-col gap-1.5 px-1">
            <div className="flex items-center gap-2.5">
              <Calendar size={14} className="text-text-sub shrink-0" strokeWidth={1.75} />
              <span className="text-[14px] text-text-sub">{dateLabel}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Clock size={14} className="text-text-sub shrink-0" strokeWidth={1.75} />
              <span className="text-[14px] text-text-sub">
                {timeLabel} · with {consultation.patientName}
              </span>
            </div>
          </div>
        )}

        {/* Patient info card */}
        {consultation && (
          <div className="bg-bg-main rounded-xl border border-elements p-5 flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-brand-sub flex items-center justify-center shrink-0">
              <span className="text-[17px] font-medium text-brand select-none">{initials}</span>
            </div>
            <div>
              <p className="text-[16px] font-medium text-text-main">{consultation.patientName}</p>
              {consultation.chiefComplaint && (
                <p className="text-[14px] text-text-sub mt-0.5">
                  &ldquo;{consultation.chiefComplaint}&rdquo;
                </p>
              )}
            </div>
          </div>
        )}

        {/* Heading */}
        <div className="text-center flex flex-col gap-2">
          <h1 className="text-[26px] font-medium text-text-main">
            Your patient is waiting.
          </h1>
          <p className="text-[15px] text-text-sub leading-relaxed">
            Your consultation with{" "}
            <span className="text-text-main font-medium">
              {consultation?.patientName ?? "your patient"}
            </span>{" "}
            starts soon. Get ready.
          </p>
        </div>

        {/* Countdown */}
        {secondsLeft !== null && secondsLeft > 0 && (
          <div className="bg-bg-main rounded-xl border border-elements p-5 text-center">
            <p className="text-[14px] text-text-sub mb-2">Starting in</p>
            <p className="text-[40px] font-medium text-text-main tabular-nums leading-none">
              {formatCountdown(secondsLeft)}
            </p>
          </div>
        )}

        {secondsLeft === 0 && (
          <div className="bg-brand-sub rounded-xl border border-brand/20 p-4 text-center">
            <p className="text-[15px] font-medium text-brand">Your session is starting now</p>
          </div>
        )}

        {/* Device readiness card — flush button at bottom */}
        <div className="bg-bg-main rounded-xl border border-elements overflow-hidden">
          <div className="px-5 pt-5 pb-1">
            <p className="text-[15px] font-medium text-text-main mb-1">Device readiness</p>
          </div>
          <div className="px-5">
            <DeviceRow icon={Wifi}  label="Connection"  status={wifi}   />
            <DeviceRow icon={Mic}   label="Microphone"  status={mic}    />
            <DeviceRow icon={Video} label="Camera"      status={camera} />
          </div>
          <div className="flex border-t border-elements mt-2">
            <button
              type="button"
              onClick={() => router.push(`/doctor/consultations/${id}/session`)}
              className="flex-1 py-3 bg-brand text-white flex items-center justify-center gap-2
                text-[15px] font-medium hover:opacity-90 active:opacity-80 transition-all duration-200"
            >
              <Video size={14} strokeWidth={1.75} />
              Start consultation
            </button>
          </div>
        </div>

        {/* Reassurance — below the button */}
        <p className="text-center text-[14px] text-text-sub -mt-1">
          If you experience any issues, try refreshing the page.
        </p>

      </div>
    </div>
  );
}
