"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { X, User, Heart, Lock, Bell, Trash2 } from "lucide-react";
import { PersonalInfoSection }  from "./PersonalInfoSection";
import { HealthProfileSection } from "./HealthProfileSection";
import { AccountSection }       from "./AccountSection";
import { NotificationsSection } from "./NotificationsSection";
import { DangerZoneSection }    from "./DangerZoneSection";

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

type SectionKey = "personal" | "health" | "account" | "notifications" | "danger";

const NAV: { key: SectionKey; label: string; Icon: React.ElementType; danger?: boolean }[] = [
  { key: "personal",      label: "Personal Info",    Icon: User    },
  { key: "health",        label: "Health Profile",   Icon: Heart   },
  { key: "account",       label: "Account",          Icon: Lock    },
  { key: "notifications", label: "Notifications",    Icon: Bell    },
  { key: "danger",        label: "Danger Zone",      Icon: Trash2, danger: true },
];

interface Props {
  isOpen:  boolean;
  onClose: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ProfileModal({ isOpen, onClose }: Props) {
  const [mounted,   setMounted]   = useState(false);
  const [section,   setSection]   = useState<SectionKey>("personal");
  const [data,      setData]      = useState<ProfileData | null>(null);
  const [loading,   setLoading]   = useState(false);
  const [dirty,     setDirty]     = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // Fetch on open
  useEffect(() => {
    if (!isOpen) return;
    setSection("personal");
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
    if (dirty) { setConfirmClose(true); return; }
    onClose();
  }

  function handleForceClose() {
    setConfirmClose(false);
    setDirty(false);
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
          className="relative w-full max-w-[900px] h-[680px] bg-bg-main rounded-xl
            shadow-[0_16px_60px_rgba(0,0,0,0.20)] flex overflow-hidden pointer-events-auto"
          style={{
            opacity:    isOpen ? 1 : 0,
            transform:  isOpen ? "scale(1) translateY(0)" : "scale(0.97) translateY(8px)",
            transition: "opacity 300ms ease, transform 300ms cubic-bezier(0.25,0.46,0.45,0.94)",
          }}
        >
          {/* ── Left sidebar ─────────────────────────────────────────── */}
          <div className="w-[200px] shrink-0 border-r border-elements flex flex-col py-6 bg-bg-sub">
            <p className="px-5 text-[11px] font-medium text-text-sub uppercase tracking-wide mb-3">
              Profile Settings
            </p>

            <nav className="flex flex-col gap-0.5 px-2">
              {NAV.map(({ key, label, Icon, danger }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => { setSection(key); setDirty(false); }}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[14px] font-medium
                    transition-colors duration-150 text-left
                    ${section === key
                      ? danger ? "bg-error/10 text-error" : "bg-bg-main text-text-main"
                      : danger ? "text-error hover:bg-error/10" : "text-text-sub hover:bg-bg-main hover:text-text-main"
                    }`}
                >
                  <Icon size={15} strokeWidth={1.75} className="shrink-0" />
                  {label}
                </button>
              ))}
            </nav>
          </div>

          {/* ── Right content ────────────────────────────────────────── */}
          <div className="flex-1 flex flex-col overflow-hidden">
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
                <X size={16} strokeWidth={1.75} />
              </button>
            </div>

            {/* Scrollable section */}
            <div className="flex-1 overflow-y-auto px-8 py-6">
              {loading || !data ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-[14px] text-text-sub animate-pulse">Loading…</p>
                </div>
              ) : (
                <div key={section} className="animate-fadeInDown" style={{ animationDuration: "200ms" }}>
                  {section === "personal"      && <PersonalInfoSection  data={data} onUpdate={updateData} onDirtyChange={setDirty} />}
                  {section === "health"        && <HealthProfileSection data={data} onUpdate={updateData} onDirtyChange={setDirty} />}
                  {section === "account"       && <AccountSection       data={data}                       onDirtyChange={setDirty} />}
                  {section === "notifications" && <NotificationsSection data={data} onUpdate={updateData} />}
                  {section === "danger"        && <DangerZoneSection    onClose={onClose} />}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Unsaved changes confirm */}
      {confirmClose && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-bg-main rounded-xl border border-elements p-6 shadow-[0_8px_32px_rgba(0,0,0,0.16)] animate-fadeInDown" style={{ animationDuration: "150ms" }}>
            <p className="text-[16px] font-medium text-text-main mb-1">Unsaved changes</p>
            <p className="text-[14px] text-text-sub mb-5">You have unsaved changes. Leave anyway?</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmClose(false)}
                className="flex-1 h-9 rounded-lg border border-elements text-[14px] font-medium text-text-main hover:border-text-sub/60 transition-colors duration-150"
              >
                Keep editing
              </button>
              <button
                type="button"
                onClick={handleForceClose}
                className="flex-1 h-9 rounded-lg bg-text-main text-brand-sub text-[14px] font-medium hover:opacity-90 transition-opacity duration-150"
              >
                Leave anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );

  return createPortal(panel, document.body);
}
