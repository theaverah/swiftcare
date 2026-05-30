"use client";

import { useState } from "react";
import { toast } from "sonner";

type PrefKey = "appointmentReminders" | "bookingConfirmations" | "scheduleUpdates";

interface NotificationPrefs {
  appointmentReminders: boolean;
  bookingConfirmations:  boolean;
  scheduleUpdates:       boolean;
}

const PREFS: { key: PrefKey; label: string; description: string }[] = [
  {
    key:         "appointmentReminders",
    label:       "Appointment reminders",
    description: "Get notified before your patient consultations",
  },
  {
    key:         "bookingConfirmations",
    label:       "Booking confirmations",
    description: "Get notified when a patient books with you",
  },
  {
    key:         "scheduleUpdates",
    label:       "Schedule updates",
    description: "Get notified when your schedule changes",
  },
];

interface Props {
  prefs:    NotificationPrefs;
  onUpdate: (patch: Partial<NotificationPrefs>) => void;
}

export function DoctorNotificationsSection({ prefs, onUpdate }: Props) {
  const [saving,    setSaving]    = useState<PrefKey | null>(null);
  const [confirmed, setConfirmed] = useState<PrefKey | null>(null);

  async function toggle(key: PrefKey) {
    const next = !prefs[key];
    onUpdate({ [key]: next });
    setSaving(key);
    try {
      const res = await fetch("/api/doctor/account/notifications", {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ [key]: next }),
      });
      if (!res.ok) throw new Error();
      setConfirmed(key);
      setTimeout(() => setConfirmed(null), 1500);
    } catch {
      onUpdate({ [key]: !next });
      toast.error("Failed to save preference.");
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-[16px] text-text-sub mb-2">
        Manage which notifications you receive from SwiftCare.
      </p>

      {PREFS.map(({ key, label, description }) => {
        const enabled = prefs[key];
        return (
          <div
            key={key}
            className="flex items-center justify-between py-4 border-b border-elements/50 last:border-0"
          >
            <div>
              <p className="text-[16px] font-medium text-text-main">{label}</p>
              <p className="text-[16px] text-text-sub">{description}</p>
            </div>

            <div className="flex items-center gap-2 shrink-0 ml-4">
              {confirmed === key && (
                <span className="text-[14px] text-success animate-fadeInDown" style={{ animationDuration: "150ms" }}>
                  Saved
                </span>
              )}
              <button
                type="button"
                role="switch"
                aria-checked={enabled}
                onClick={() => toggle(key)}
                disabled={saving === key}
                className={`relative w-11 h-6 rounded-full transition-colors duration-200
                  ${enabled ? "bg-brand" : "bg-elements"}
                  ${saving === key ? "opacity-60 cursor-wait" : ""}`}
              >
                <span
                  className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm
                    transition-all duration-200 ${enabled ? "left-5.5" : "left-0.5"}`}
                />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
