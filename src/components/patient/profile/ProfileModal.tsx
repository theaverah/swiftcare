"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { X, User, Lock, Bell } from "lucide-react";
import { EditableProfileSection } from "./EditableProfileSection";
import { AccountSection }         from "./AccountSection";
import { NotificationsSection }   from "./NotificationsSection";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ProfileData {
  name:               string;
  email:              string;
  dateOfBirth:        string | null;
  phone:              string;
  weight:             number | null;
  height:             number | null;
  bloodType:          string;
  allergies:          string[];
  currentMedications: string[];
  medicalHistory:     string;
  notificationPrefs: {
    appointmentReminders: boolean;
    bookingConfirmations:  boolean;
    scheduleUpdates:       boolean;
  };
}

type SectionKey = "profile" | "account" | "notifications";

const NAV: { key: SectionKey; label: string; Icon: React.ElementType }[] = [
  { key: "profile",       label: "Profile",       Icon: User },
  { key: "account",       label: "Account",       Icon: Lock },
  { key: "notifications", label: "Notifications", Icon: Bell },
];

interface Props {
  isOpen:  boolean;
  onClose: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ProfileModal({ isOpen, onClose }: Props) {
  const [mounted,   setMounted]   = useState(false);
  const [section,   setSection]   = useState<SectionKey>("profile");
  const [data,     setData]    = useState<ProfileData | null>(null);
  const [loading,  setLoading] = useState(false);
  const [dirty,    setDirty]   = useState(false);
  const [shaking,  setShaking] = useState(false);
  const [warnKey,  setWarnKey] = useState(0);

  useEffect(() => { setMounted(true); }, []);

  // Fetch on open
  useEffect(() => {
    if (!isOpen) return;
    setSection("profile");
    setDirty(false);
    setLoading(true);
    fetch("/api/patient/profile")
      .then(r => r.json())
      .then((d: ProfileData) => setData(d))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [isOpen]);

  // Lock scroll
  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else        document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  // Escape
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) handleClose();
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, dirty]);

  function handleClose() {
    if (dirty) {
      setShaking(true);
      setWarnKey(k => k + 1);
      setTimeout(() => setShaking(false), 500);
      return;
    }
    onClose();
  }

  const updateData = useCallback((patch: Partial<ProfileData>) => {
    setData(prev => prev ? { ...prev, ...patch } : prev);
  }, []);

  if (!mounted) return null;

  const panel = (
    <>
      {/* Backdrop */}
      <div
        aria-hidden
        className="fixed inset-0 z-50 bg-black/40"
        style={{ opacity: isOpen ? 1 : 0, pointerEvents: isOpen ? "auto" : "none", transition: "opacity 300ms ease" }}
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-6 pointer-events-none">
        <div
          className="relative w-full max-w-265 h-210 bg-bg-sub rounded-xl
            shadow-[0_16px_60px_rgba(0,0,0,0.20)] flex overflow-hidden"
          style={{
            opacity:       isOpen ? 1 : 0,
            pointerEvents: isOpen ? "auto" : "none",
            transform:     isOpen ? "scale(1) translateY(0)" : "scale(0.97) translateY(8px)",
            transition:    "opacity 300ms ease, transform 300ms cubic-bezier(0.25,0.46,0.45,0.94)",
          }}
        >
          {/* ── Left sidebar ─────────────────────────────────────────── */}
          <div className="w-55 shrink-0 border-r border-elements flex flex-col py-6 bg-bg-main">
            <nav className="flex flex-col gap-0.5 px-2 mt-2">
              {NAV.map(({ key, label, Icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => { setSection(key); setDirty(false); }}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[16px] font-medium
                    transition-colors duration-150 text-left text-text-main
                    ${section === key ? "bg-bg-sub" : "hover:bg-bg-sub"}`}
                >
                  <Icon size={16} strokeWidth={1.75} className="shrink-0" />
                  {label}
                </button>
              ))}
            </nav>
          </div>

          {/* ── Right content ────────────────────────────────────────── */}
          <div className="flex-1 flex flex-col overflow-hidden bg-bg-main">
            {/* Header */}
            <div className="shrink-0 flex items-center justify-between px-8 py-5 border-b border-elements">
              <p className="text-[16px] font-medium text-text-main">
                {NAV.find(n => n.key === section)?.label}
              </p>
              <button
                type="button"
                onClick={handleClose}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-text-sub
                  hover:bg-bg-sub hover:text-text-main transition-colors duration-200"
              >
                <X size={16} strokeWidth={1.75} className="text-text-main" />
              </button>
            </div>

            {/* Scrollable section */}
            <div className="flex-1 overflow-y-auto px-8 py-6">
              {loading || !data ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-[16px] text-text-sub animate-pulse">Loading…</p>
                </div>
              ) : (
                <div key={section} className="animate-fadeInDown" style={{ animationDuration: "200ms" }}>
                  {section === "profile"       && <EditableProfileSection data={data} onUpdate={updateData} onDirtyChange={setDirty} warnKey={warnKey} />}
                  {section === "account"       && <AccountSection        data={data} onDirtyChange={setDirty} onClose={onClose} />}
                  {section === "notifications" && <NotificationsSection  data={data} onUpdate={updateData} />}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

    </>
  );

  return createPortal(panel, document.body);
}
