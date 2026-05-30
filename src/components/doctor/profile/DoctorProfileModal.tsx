"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { User, Lock, Bell, X, Calendar } from "lucide-react";
import { toast } from "sonner";
import { DoctorEditableProfileSection } from "./DoctorEditableProfileSection";
import type { DoctorFormState, ScheduleDay } from "./DoctorEditableProfileSection";
import { DoctorAccountSection }       from "./DoctorAccountSection";
import { DoctorNotificationsSection } from "./DoctorNotificationsSection";

// -- Types ---------------------------------------------------------------------

interface DoctorModalData {
  email:            string;
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

const DAYS_ORDER = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAY_FULL: Record<string, string> = {
  Mon: "Monday", Tue: "Tuesday", Wed: "Wednesday", Thu: "Thursday",
  Fri: "Friday", Sat: "Saturday", Sun: "Sunday",
};

interface Props {
  isOpen:  boolean;
  onClose: () => void;
}

// -- Avatar palette (matches DoctorCard) ----------------------------------------

const AVATAR_PALETTES = [
  { bg: "#E8F4FD", color: "#2B7BB9" }, { bg: "#FEF3E2", color: "#B5651D" },
  { bg: "#F0FDF4", color: "#15803D" }, { bg: "#FDF2F8", color: "#9D174D" },
  { bg: "#F5F3FF", color: "#6D28D9" }, { bg: "#FFF7ED", color: "#C2410C" },
  { bg: "#F0F9FF", color: "#0369A1" }, { bg: "#FFF1F2", color: "#BE123C" },
  { bg: "#ECFDF5", color: "#065F46" }, { bg: "#FEF9C3", color: "#854D0E" },
];
function avatarPalette(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) { hash = ((hash << 5) - hash) + name.charCodeAt(i); hash |= 0; }
  return AVATAR_PALETTES[Math.abs(hash) % AVATAR_PALETTES.length];
}

// -- Live preview panel --------------------------------------------------------

function LivePreview({ form }: { form: DoctorFormState }) {
  const initials = form.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "DR";
  const palette  = avatarPalette(form.name || "Doctor");
  const specs    = form.specializations;
  const todayDow = new Date().getDay();
  const DOW: Record<string, number> = { Sun:0, Mon:1, Tue:2, Wed:3, Thu:4, Fri:5, Sat:6 };

  // Convert form schedule to availability list for drawer preview
  const availability = DAYS_ORDER
    .filter((d) => form.schedule[d]?.enabled)
    .map((d) => ({ day: d, startTime: form.schedule[d].startTime, endTime: form.schedule[d].endTime, dow: DOW[d] }));

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-bg-sub">
      {/* Header */}
      <div className="shrink-0 h-18.25 flex flex-col justify-center px-6 border-b border-elements bg-bg-main">
        <p className="text-[15px] font-medium text-text-main">Your public profile</p>
        <p className="text-[13px] text-text-sub mt-0.5">This is exactly how patients see you on SwiftCare. It updates as you make changes.</p>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-6">

        {/* -- Doctor card preview ------------------------------------------ */}
        <div>
          <p className="text-[12px] font-medium text-text-sub uppercase tracking-wider mb-3">Card view</p>
          <div className="bg-bg-main border border-elements rounded-xl overflow-hidden shadow-sm">
            <div className="flex flex-col gap-3 p-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-full overflow-hidden shrink-0 flex items-center justify-center border border-elements/50"
                  style={{ backgroundColor: form.profileImage ? undefined : palette.bg }}
                >
                  {form.profileImage ? (
                    <img src={form.profileImage} alt={form.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[13px] font-semibold select-none" style={{ color: palette.color }}>
                      {initials}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-medium text-text-main leading-tight truncate">
                    Dr. {form.name || "Your Name"}
                  </p>
                  <p className="text-[12px] text-text-sub mt-0.5 leading-snug truncate">
                    {specs.length > 0 ? specs.join(" · ") : "Your specializations"}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-1.5 py-1.5">
                <p className="text-[13px] font-medium text-text-main leading-none">Earliest available schedule</p>
                <div className="flex items-center gap-1.5">
                  <Calendar size={12} className="text-text-sub shrink-0" />
                  <p className="text-[13px] text-text-sub leading-none">
                    {availability.length > 0
                      ? `${DAY_FULL[availability[0].day]}, ${availability[0].startTime}`
                      : "No schedule set"}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex border-t border-elements">
              <div className="flex-1 py-2 flex items-center justify-center text-[13px] font-medium text-text-main border-r border-elements">
                View profile
              </div>
              <div className="flex-1 py-2 bg-brand flex flex-col items-center justify-center gap-0">
                <span className="text-[13px] font-medium text-white leading-tight">Book a consultation</span>
                <span className="text-[14px] font-semibold text-white leading-tight">
                  {form.consultationFee ? `₱${Number(form.consultationFee).toLocaleString("en-PH")}` : "₱–"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* -- Profile drawer preview --------------------------------------- */}
        <div>
          <p className="text-[12px] font-medium text-text-sub uppercase tracking-wider mb-3">Profile drawer</p>
          <div className="bg-bg-main border border-elements rounded-xl overflow-hidden shadow-sm">
            <div className="flex flex-col gap-4 p-5">

              {/* Hero */}
              <div className="flex flex-col items-center gap-2 text-center">
                <div
                  className="w-16 h-16 rounded-full overflow-hidden border-2 border-brand/8 flex items-center justify-center shrink-0"
                  style={{ backgroundColor: form.profileImage ? undefined : palette.bg }}
                >
                  {form.profileImage ? (
                    <img src={form.profileImage} alt={form.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[16px] font-medium select-none" style={{ color: palette.color }}>
                      {initials}
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="text-[16px] font-medium text-text-main tracking-[-0.04em]">
                    Dr. {form.name || "Your Name"}
                  </h3>
                  <p className="text-[13px] text-text-sub mt-0.5">
                    {specs.length > 0 ? specs.join(" · ") : "Your specializations"}
                  </p>
                </div>
              </div>

              {/* Bio */}
              {form.bio && (
                <p className="text-[13px] text-text-sub text-center leading-relaxed">{form.bio}</p>
              )}

              {/* Info row */}
              <div className="flex divide-x divide-elements border-y border-elements text-center">
                {form.yearsOfExperience && (
                  <div className="flex-1 py-3 flex flex-col justify-center">
                    <p className="text-[13px] font-medium text-text-main">Experience</p>
                    <p className="text-[13px] text-text-sub">{form.yearsOfExperience} years</p>
                  </div>
                )}
                {form.languages.length > 0 && (
                  <div className="flex-2 py-3 flex flex-col justify-center px-2">
                    <p className="text-[13px] font-medium text-text-main">Languages</p>
                    <p className="text-[12px] text-text-sub leading-snug">{form.languages.join(", ")}</p>
                  </div>
                )}
                <div className="flex-1 py-3 flex flex-col justify-center">
                  <p className="text-[13px] font-medium text-text-main">Fee</p>
                  <p className="text-[13px] text-text-sub">
                    {form.consultationFee ? `₱${Number(form.consultationFee).toLocaleString("en-PH")}` : "On request"}
                  </p>
                </div>
              </div>

              {/* Education */}
              {(form.education.medicalSchool || form.education.residency) && (
                <div className="flex flex-col gap-1">
                  <p className="text-[13px] font-medium text-text-main">Education</p>
                  {form.education.medicalSchool && (
                    <p className="text-[13px] text-text-sub">{form.education.medicalSchool}</p>
                  )}
                  {form.education.residency && (
                    <p className="text-[13px] text-text-sub">{form.education.residency}</p>
                  )}
                </div>
              )}

              {/* Certifications */}
              {form.certifications.length > 0 && (
                <div className="flex flex-col gap-1">
                  <p className="text-[13px] font-medium text-text-main">Certifications</p>
                  {form.certifications.map((c) => (
                    <p key={c} className="text-[13px] text-text-sub">{c}</p>
                  ))}
                </div>
              )}

              {/* Affiliations */}
              {form.affiliations.length > 0 && (
                <div className="flex flex-col gap-1">
                  <p className="text-[13px] font-medium text-text-main">Affiliations</p>
                  {form.affiliations.map((a) => (
                    <p key={a} className="text-[13px] text-text-sub">{a}</p>
                  ))}
                </div>
              )}

              {/* Weekly schedule */}
              {availability.length > 0 && (
                <div className="flex flex-col gap-1">
                  <p className="text-[13px] font-medium text-text-main">Weekly Schedule</p>
                  {DAYS_ORDER.map((d) => {
                    const slot = form.schedule[d];
                    const isToday = todayDow === DOW[d];
                    return (
                      <div
                        key={d}
                        className={`flex items-center justify-between py-0.5 text-[12px]
                          ${isToday ? "-mx-1 px-1 rounded bg-brand-sub/40" : ""}`}
                      >
                        <span className={isToday ? "text-text-main font-medium" : "text-text-sub"}>
                          {DAY_FULL[d]}
                        </span>
                        {slot?.enabled ? (
                          <span className="text-text-main">{slot.startTime} – {slot.endTime}</span>
                        ) : (
                          <span className="text-text-sub">Not available</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// -- Main component ------------------------------------------------------------

const EMPTY_SCHEDULE = Object.fromEntries(
  ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => [
    d, { enabled: false, startTime: "8:00 AM", endTime: "5:00 PM", breaks: [] } as ScheduleDay,
  ])
);

const EMPTY_FORM: DoctorFormState = {
  name:             "",
  contactNumber:    "",
  profileImage:     null,
  specializations:  [],
  prcLicense:       "",
  yearsOfExperience:"",
  bio:              "",
  languages:        ["English"],
  education:        { medicalSchool: "", residency: "" },
  certifications:   [],
  affiliations:     [],
  consultationFee:  "",
  schedule:         EMPTY_SCHEDULE,
};

export function DoctorProfileModal({ isOpen, onClose }: Props) {
  const [mounted,  setMounted]  = useState(false);
  const [section,  setSection]  = useState<SectionKey>("profile");
  const [meta,     setMeta]     = useState<DoctorModalData | null>(null);
  const [form,     setForm]     = useState<DoctorFormState>(EMPTY_FORM);
  const [saved,    setSaved]    = useState<DoctorFormState>(EMPTY_FORM);
  const [loading,  setLoading]  = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [dirty,    setDirty]    = useState(false);
  const [shaking,  setShaking]  = useState(false);
  const [warnKey,  setWarnKey]  = useState(0);

  useEffect(() => { setMounted(true); }, []);

  // Lock scroll
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  // Fetch on open
  useEffect(() => {
    if (!isOpen) return;
    setSection("profile");
    setDirty(false);
    setLoading(true);

    fetch("/api/doctor/profile")
      .then((r) => r.json())
      .then((d) => {
        const formData: DoctorFormState = {
          name:              d.name             ?? "",
          contactNumber:     d.contactNumber    ?? "",
          profileImage:      d.profileImage     ?? null,
          specializations:   d.specializations  ?? [],
          prcLicense:        d.prcLicense       ?? "",
          yearsOfExperience: d.yearsOfExperience ?? "",
          bio:               d.bio              ?? "",
          languages:         d.languages        ?? ["English"],
          education:         d.education        ?? { medicalSchool: "", residency: "" },
          certifications:    d.certifications   ?? [],
          affiliations:      d.affiliations     ?? [],
          consultationFee:   d.consultationFee  ?? "",
          schedule:          d.schedule         ?? EMPTY_SCHEDULE,
        };
        setForm(formData);
        setSaved(formData);
        setMeta({
          email:             d.email            ?? "",
          notificationPrefs: d.notificationPrefs ?? {
            appointmentReminders: true,
            bookingConfirmations:  true,
            scheduleUpdates:       true,
          },
        });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [isOpen]);

  // Dirty tracking
  useEffect(() => {
    setDirty(JSON.stringify(form) !== JSON.stringify(saved));
  }, [form, saved]);

  // Escape key
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
      setWarnKey((k) => k + 1);
      setTimeout(() => setShaking(false), 500);
      return;
    }
    onClose();
  }

  const onChange = useCallback((patch: Partial<DoctorFormState>) => {
    setForm((prev) => ({ ...prev, ...patch }));
  }, []);

  async function handleSave() {
    const prevSaved = saved;
    setSaved(form);
    setSaving(true);
    try {
      const res = await fetch("/api/doctor/profile", {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      toast.success("Changes saved.");
    } catch {
      setSaved(prevSaved);
      toast.error("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  function handleReset() {
    setForm(saved);
  }

  function handleNotifUpdate(patch: Partial<DoctorModalData["notificationPrefs"]>) {
    if (!meta) return;
    setMeta((prev) => prev ? { ...prev, notificationPrefs: { ...prev.notificationPrefs, ...patch } } : prev);
  }

  if (!mounted) return null;

  const panel = (
    <>
      {/* Backdrop */}
      <div
        aria-hidden
        className="fixed inset-0 z-50 bg-black/40"
        style={{
          opacity:       isOpen ? 1 : 0,
          pointerEvents: isOpen ? "auto" : "none",
          transition:    "opacity 300ms ease",
        }}
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 pointer-events-none">
        <div
          role="dialog"
          aria-modal
          className={`relative w-full bg-bg-main rounded-xl shadow-[0_16px_60px_rgba(0,0,0,0.20)]
            flex overflow-hidden ${shaking ? "animate-shake" : ""}`}
          style={{
            maxWidth:      "min(1600px, calc(100vw - 24px))",
            height:        "96vh",
            opacity:       isOpen ? 1 : 0,
            pointerEvents: isOpen ? "auto" : "none",
            transform:     isOpen ? "scale(1) translateY(0)" : "scale(0.97) translateY(8px)",
            transition:    "opacity 300ms ease, transform 300ms cubic-bezier(0.25,0.46,0.45,0.94)",
          }}
        >

          {/* -- Left sidebar ------------------------------------------- */}
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

          {/* -- Center editing ----------------------------------------- */}
          <div
            className="flex flex-col overflow-hidden bg-bg-main border-r border-elements"
            style={{ flex: 1, minWidth: 0 }}
          >
            {/* Header */}
            <div className="shrink-0 h-18.25 flex items-center justify-between px-8 border-b border-elements">
              <p className="text-[16px] font-medium text-text-main">
                {NAV.find((n) => n.key === section)?.label}
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

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto px-8 py-6">
              {loading || !meta ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-[16px] text-text-sub animate-pulse">Loading…</p>
                </div>
              ) : (
                <div key={section} className="animate-fadeInDown" style={{ animationDuration: "200ms" }}>
                  {section === "profile" && (
                    <DoctorEditableProfileSection
                      form={form}
                      saved={saved}
                      onChange={onChange}
                      onSave={handleSave}
                      onReset={handleReset}
                      isDirty={dirty}
                      saving={saving}
                      warnKey={warnKey}
                    />
                  )}
                  {section === "account" && (
                    <DoctorAccountSection
                      email={meta.email}
                      onDirtyChange={setDirty}
                      onClose={onClose}
                    />
                  )}
                  {section === "notifications" && (
                    <DoctorNotificationsSection
                      prefs={meta.notificationPrefs}
                      onUpdate={handleNotifUpdate}
                    />
                  )}
                </div>
              )}
            </div>
          </div>

          {/* -- Right preview panel (hidden on mobile) ----------------- */}
          {section === "profile" && !loading && (
            <div className="hidden lg:flex flex-1 min-w-0">
              <LivePreview form={form} />
            </div>
          )}
          {section !== "profile" && !loading && (
            <div className="hidden lg:flex flex-1 min-w-0 bg-bg-sub items-center justify-center">
              <p className="text-[14px] text-text-sub text-center px-8 leading-relaxed">
                Edit your profile to see the<br />live patient-facing preview here.
              </p>
            </div>
          )}
          {loading && (
            <div className="hidden lg:flex flex-1 min-w-0 bg-bg-sub" />
          )}
        </div>
      </div>
    </>
  );

  return createPortal(panel, document.body);
}
