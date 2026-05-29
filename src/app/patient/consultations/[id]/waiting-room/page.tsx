"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Mic, MicOff, Video, VideoOff, PhoneOff, ArrowLeft, Wifi } from "lucide-react";
import { format } from "date-fns";
import type { Consultation } from "@/types/consultation";

// ── Device check ──────────────────────────────────────────────────────────────

function DeviceIndicator({
  icon: Icon,
  activeIcon: ActiveIcon,
  label,
  active,
  onClick,
}: {
  icon: typeof Mic;
  activeIcon: typeof Mic;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border transition-all duration-200
        ${active
          ? "border-brand/30 bg-brand-sub text-brand"
          : "border-elements bg-bg-sub text-text-sub hover:border-text-sub/40"
        }`}
    >
      {active
        ? <ActiveIcon size={16} strokeWidth={1.75} />
        : <Icon size={16} strokeWidth={1.75} />
      }
      <span className="text-[14px] font-medium">{label}</span>
      <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-medium
        ${active ? "bg-brand/10 text-brand" : "bg-elements text-text-sub"}`}>
        {active ? "On" : "Off"}
      </span>
    </button>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function WaitingRoomPage() {
  const { id }   = useParams<{ id: string }>();
  const router   = useRouter();

  const [consultation, setConsultation] = useState<Consultation | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [micOn,        setMicOn]        = useState(true);
  const [cameraOn,     setCameraOn]     = useState(true);
  const [secondsLeft,  setSecondsLeft]  = useState<number | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

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

  // Camera preview
  useEffect(() => {
    if (!cameraOn) {
      if (videoRef.current) videoRef.current.srcObject = null;
      return;
    }
    let stream: MediaStream;
    navigator.mediaDevices?.getUserMedia({ video: true, audio: false })
      .then(s => {
        stream = s;
        if (videoRef.current) videoRef.current.srcObject = s;
      })
      .catch(() => { /* Permission denied — no camera preview */ });
    return () => { stream?.getTracks().forEach(t => t.stop()); };
  }, [cameraOn]);

  // Countdown to appointment
  useEffect(() => {
    if (!consultation?.scheduledAt) return;
    function update() {
      const diff = Math.max(0, Math.floor(
        (new Date(consultation!.scheduledAt).getTime() - Date.now()) / 1000
      ));
      setSecondsLeft(diff);
    }
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [consultation?.scheduledAt]);

  function formatCountdown(s: number): string {
    if (s <= 0) return "Starting now…";
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${sec.toString().padStart(2, "0")}s`;
    return `${sec}s`;
  }

  const scheduledDate = consultation
    ? new Date(consultation.scheduledAt)
    : null;

  const dateLabel = scheduledDate
    ? format(scheduledDate, "EEEE, MMMM d, yyyy 'at' h:mm aa")
    : "";

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-brand border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 max-w-2xl mx-auto py-4">

      {/* Back button */}
      <button
        type="button"
        onClick={() => router.back()}
        className="flex items-center gap-2 text-text-sub hover:text-text-main
          transition-colors duration-200 w-fit text-[14px]"
      >
        <ArrowLeft size={15} strokeWidth={1.75} />
        Back to consultations
      </button>

      {/* Doctor card */}
      {consultation && (
        <div
          className="flex items-center gap-4 p-5 bg-bg-main rounded-xl border border-elements
            animate-fadeInDown"
          style={{ animationDelay: "0ms", animationDuration: "400ms" }}
        >
          {consultation.doctor.profileImage ? (
            <img
              src={consultation.doctor.profileImage}
              alt={consultation.doctor.name}
              className="w-14 h-14 rounded-full object-cover shrink-0"
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-brand-sub flex items-center justify-center shrink-0">
              <span className="text-[18px] font-medium text-brand">
                {consultation.doctor.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
              </span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-[16px] font-medium text-text-main">
              Dr. {consultation.doctor.name}
            </p>
            <p className="text-[14px] text-text-sub">
              {consultation.doctor.specializations[0] ?? "General Practitioner"}
            </p>
            <p className="text-[13px] text-text-sub mt-0.5">{dateLabel}</p>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand-sub">
            <Wifi size={13} className="text-brand" strokeWidth={1.75} />
            <span className="text-[12px] font-medium text-brand">Connected</span>
          </div>
        </div>
      )}

      {/* Main waiting room area */}
      <div
        className="flex flex-col items-center gap-5 text-center animate-fadeInDown"
        style={{ animationDelay: "80ms", animationDuration: "400ms" }}
      >
        <h1 className="text-[28px] font-medium text-text-main tracking-[-0.03em]">
          You&apos;re in the waiting room.
        </h1>
        <p className="text-[15px] text-text-sub max-w-md leading-relaxed">
          Your doctor will be with you shortly. Please make sure your mic and camera are ready.
        </p>
      </div>

      {/* Countdown */}
      {secondsLeft !== null && (
        <div
          className="flex flex-col items-center gap-1.5 animate-fadeInDown"
          style={{ animationDelay: "120ms", animationDuration: "400ms" }}
        >
          <p className="text-[13px] text-text-sub uppercase tracking-widest font-medium">
            Session starts in
          </p>
          <p className="text-[40px] font-medium text-text-main tracking-tighter tabular-nums">
            {formatCountdown(secondsLeft)}
          </p>
        </div>
      )}

      {/* Camera preview + controls */}
      <div
        className="flex flex-col gap-4 animate-fadeInDown"
        style={{ animationDelay: "160ms", animationDuration: "400ms" }}
      >
        {/* Camera preview */}
        <div className="relative w-full aspect-video bg-[#1a1a1a] rounded-xl overflow-hidden
          border border-elements flex items-center justify-center">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className={`w-full h-full object-cover ${cameraOn ? "opacity-100" : "opacity-0"}`}
          />
          {!cameraOn && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
              <VideoOff size={32} className="text-white/40" strokeWidth={1.5} />
              <p className="text-[13px] text-white/40">Camera is off</p>
            </div>
          )}

          {/* Controls overlay */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMicOn(v => !v)}
              className={`w-11 h-11 rounded-full flex items-center justify-center
                transition-all duration-200 shadow-lg
                ${micOn ? "bg-white/20 hover:bg-white/30 text-white" : "bg-white text-error"}`}
            >
              {micOn ? <Mic size={18} strokeWidth={1.75} /> : <MicOff size={18} strokeWidth={1.75} />}
            </button>
            <button
              type="button"
              onClick={() => setCameraOn(v => !v)}
              className={`w-11 h-11 rounded-full flex items-center justify-center
                transition-all duration-200 shadow-lg
                ${cameraOn ? "bg-white/20 hover:bg-white/30 text-white" : "bg-white text-error"}`}
            >
              {cameraOn ? <Video size={18} strokeWidth={1.75} /> : <VideoOff size={18} strokeWidth={1.75} />}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="w-11 h-11 rounded-full bg-error flex items-center justify-center
                hover:opacity-90 transition-opacity duration-200 shadow-lg"
            >
              <PhoneOff size={18} className="text-white" strokeWidth={1.75} />
            </button>
          </div>
        </div>

        {/* Device status chips */}
        <div className="flex items-center gap-3 justify-center flex-wrap">
          <DeviceIndicator
            icon={MicOff}
            activeIcon={Mic}
            label="Microphone"
            active={micOn}
            onClick={() => setMicOn(v => !v)}
          />
          <DeviceIndicator
            icon={VideoOff}
            activeIcon={Video}
            label="Camera"
            active={cameraOn}
            onClick={() => setCameraOn(v => !v)}
          />
        </div>
      </div>

      {/* Reassurance */}
      <p
        className="text-center text-[13px] text-text-sub animate-fadeInDown"
        style={{ animationDelay: "200ms", animationDuration: "400ms" }}
      >
        If you experience any issues, you can switch to audio only.
      </p>
    </div>
  );
}
