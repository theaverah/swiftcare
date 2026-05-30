"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, ChevronDown, Check } from "lucide-react";
import { toast } from "sonner";
import type { DoctorConsultation } from "./DoctorConsultationCard";

// -- Constants -----------------------------------------------------------------

const SPECIALIZATIONS = [
  "General Practice", "Internal Medicine", "Cardiology", "Dermatology",
  "Obstetrics & Gynecology", "Pediatrics", "Neurology", "Orthopedic Surgery",
  "Psychiatry", "Ophthalmology", "ENT (Ear, Nose & Throat)", "Pulmonology",
  "Endocrinology", "Gastroenterology", "Nephrology", "Oncology", "Urology",
  "Rheumatology", "Infectious Disease", "Emergency Medicine", "Family Medicine",
  "Geriatrics", "Rehabilitation Medicine", "Pathology", "Radiology", "Anesthesiology",
];

// -- Tag chip input ------------------------------------------------------------

function ChipInput({ chips, onChange, placeholder }: {
  chips: string[];
  onChange: (v: string[]) => void;
  placeholder: string;
}) {
  const [input, setInput] = useState("");

  function add(raw: string) {
    const t = raw.trim().replace(/,+$/, "").trim();
    if (t && !chips.includes(t)) onChange([...chips, t]);
    setInput("");
  }
  function remove(idx: number) { onChange(chips.filter((_, i) => i !== idx)); }
  function handleKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if ((e.key === "Enter" || e.key === ",") && input.trim()) { e.preventDefault(); add(input); }
    else if (e.key === "Backspace" && input === "" && chips.length > 0) remove(chips.length - 1);
  }
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    if (val.endsWith(",")) add(val.slice(0, -1));
    else setInput(val);
  }

  return (
    <div className="flex flex-wrap gap-1.5 items-center min-h-11 rounded-lg border border-elements
      px-3 py-2 bg-bg-main focus-within:border-text-main transition-colors duration-200 cursor-text">
      {chips.map((chip, i) => (
        <span key={i} className="flex items-center gap-1 px-2.5 py-0.5 bg-bg-sub rounded-md
          text-[14px] text-text-main border border-elements shrink-0">
          {chip}
          <button type="button" onClick={() => remove(i)}
            className="text-text-sub hover:text-error transition-colors leading-none ml-0.5">
            <X size={11} strokeWidth={2} />
          </button>
        </span>
      ))}
      <input
        type="text"
        value={input}
        onChange={handleChange}
        onKeyDown={handleKey}
        placeholder={chips.length === 0 ? placeholder : ""}
        className="flex-1 min-w-36 text-[16px] text-text-main bg-transparent outline-none
          placeholder:text-text-sub"
      />
    </div>
  );
}

// -- Toggle row ----------------------------------------------------------------

function ToggleRow({ label, description, enabled, onChange, children }: {
  label: string;
  description: string;
  enabled: boolean;
  onChange: (v: boolean) => void;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[15px] font-medium text-text-main">{label}</p>
          <p className="text-[14px] text-text-sub">{description}</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          onClick={() => onChange(!enabled)}
          className={`relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0 ml-4
            ${enabled ? "bg-brand" : "bg-elements"}`}
        >
          <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm
            transition-all duration-200 ${enabled ? "left-5.5" : "left-0.5"}`} />
        </button>
      </div>
      {enabled && children && (
        <div className="animate-fadeInDown" style={{ animationDuration: "150ms" }}>
          {children}
        </div>
      )}
    </div>
  );
}

// -- Specialization dropdown ---------------------------------------------------

function SpecializationSelect({ value, onChange }: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const filtered = SPECIALIZATIONS.filter((s) => s.toLowerCase().includes(search.toLowerCase()));

  useEffect(() => {
    function handler(e: MouseEvent) {
      const el = document.getElementById("spec-select-dropdown");
      if (el && !el.contains(e.target as Node)) { setOpen(false); setSearch(""); }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div id="spec-select-dropdown" className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full h-11 rounded-lg border border-elements px-3 text-[16px] text-text-main
          bg-bg-main flex items-center justify-between gap-2 focus:border-text-main
          transition-colors duration-200"
      >
        <span className={value ? "text-text-main" : "text-text-sub"}>
          {value || "Select specialization"}
        </span>
        <ChevronDown size={16} strokeWidth={1.75}
          className={`text-text-sub transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute z-50 top-full mt-1 w-full bg-bg-main border border-elements
          rounded-xl shadow-lg overflow-hidden">
          <div className="p-2 border-b border-elements">
            <input
              autoFocus
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search…"
              className="w-full h-8 px-3 text-[14px] text-text-main bg-bg-sub rounded-lg outline-none
                placeholder:text-text-sub"
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filtered.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => { onChange(s); setOpen(false); setSearch(""); }}
                className="w-full px-4 py-2.5 text-left text-[14px] flex items-center justify-between
                  hover:bg-bg-sub transition-colors duration-150"
              >
                <span className={s === value ? "text-brand font-medium" : "text-text-main"}>{s}</span>
                {s === value && <Check size={13} strokeWidth={1.75} className="text-brand shrink-0" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// -- Main modal ----------------------------------------------------------------

interface Props {
  consultation: DoctorConsultation | null;
  onClose:      () => void;
  onSaved:      (id: string) => void;
}

export function AddNotesModal({ consultation, onClose, onSaved }: Props) {
  const [mounted,       setMounted]       = useState(false);
  const [notes,         setNotes]         = useState("");
  const [prescriptions, setPrescriptions] = useState<string[]>([]);
  const [labRequests,   setLabRequests]   = useState<string[]>([]);
  const [certOn,        setCertOn]        = useState(false);
  const [certPurpose,   setCertPurpose]   = useState("");
  const [referralOn,    setReferralOn]    = useState(false);
  const [referralSpec,  setReferralSpec]  = useState("");
  const [saving,        setSaving]        = useState(false);

  const isOpen = !!consultation;

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!isOpen) return;
    setNotes(""); setPrescriptions([]); setLabRequests([]);
    setCertOn(false); setCertPurpose(""); setReferralOn(false); setReferralSpec("");
  }, [isOpen, consultation?.id]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen && !saving) onClose();
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, saving, onClose]);

  async function handleSave() {
    if (!notes.trim()) { toast.error("Consultation notes are required."); return; }
    if (!consultation) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/doctor/consultations/${consultation.id}/records`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          notes,
          prescriptions,
          labRequests,
          medicalCert: { issued: certOn, purpose: certPurpose },
          referral:    { issued: referralOn, specialization: referralSpec },
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Notes saved and shared with your patient.");
      onSaved(consultation.id);
      onClose();
    } catch {
      toast.error("Failed to save notes. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (!mounted || !consultation) return null;

  const label = "block text-[14px] font-medium text-text-sub mb-1.5";
  const inputCls = "w-full h-11 px-3 rounded-lg border border-elements text-[16px] text-text-main outline-none focus:border-text-main transition-colors duration-200 bg-bg-main";

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        aria-hidden
        className="fixed inset-0 z-[100] bg-black/40"
        style={{
          opacity:       isOpen ? 1 : 0,
          pointerEvents: isOpen ? "auto" : "none",
          transition:    "opacity 300ms ease",
        }}
        onClick={() => !saving && onClose()}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 pointer-events-none">
        <div
          role="dialog"
          aria-modal
          className="relative w-full max-w-2xl h-[96vh] max-h-[96vh] bg-bg-main rounded-xl
            shadow-[0_16px_60px_rgba(0,0,0,0.20)] flex flex-col overflow-hidden pointer-events-auto"
          style={{
            opacity:   isOpen ? 1 : 0,
            transform: isOpen ? "scale(1) translateY(0)" : "scale(0.97) translateY(8px)",
            transition:"opacity 300ms ease, transform 300ms cubic-bezier(0.25,0.46,0.45,0.94)",
          }}
        >
          {/* Header */}
          <div className="shrink-0 flex items-start justify-between px-8 py-6 border-b border-elements">
            <div>
              <p className="text-[18px] font-medium text-text-main">Post-consultation notes</p>
              <p className="text-[14px] text-text-sub mt-1">
                These will be shared with your patient in their Health Records.
              </p>
            </div>
            <button
              type="button"
              onClick={() => !saving && onClose()}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-text-sub
                hover:bg-bg-sub hover:text-text-main transition-colors duration-200 shrink-0 ml-4"
            >
              <X size={16} strokeWidth={1.75} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-8 py-6 flex flex-col gap-6">

            {/* Patient name */}
            <div className="flex flex-col gap-0.5">
              <p className="text-[14px] text-text-sub">Patient</p>
              <p className="text-[16px] font-medium text-text-main">{consultation.patientName}</p>
              {consultation.chiefComplaint && (
                <p className="text-[14px] text-text-sub mt-0.5">
                  Chief complaint: {consultation.chiefComplaint}
                </p>
              )}
            </div>

            <div className="h-px bg-elements/50" />

            {/* Consultation notes */}
            <div>
              <label className={label}>
                Consultation Notes <span className="text-error">*</span>
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={5}
                placeholder="Summarize your findings, diagnosis, and recommendations…"
                className="w-full px-3 py-2.5 rounded-lg border border-elements text-[16px] text-text-main
                  outline-none focus:border-text-main transition-colors duration-200 bg-bg-main
                  resize-none leading-relaxed placeholder:text-text-sub"
              />
            </div>

            {/* Prescription */}
            <div>
              <label className={label}>Prescription <span className="text-text-sub font-normal">(optional)</span></label>
              <ChipInput
                chips={prescriptions}
                onChange={setPrescriptions}
                placeholder="e.g. Amoxicillin 500mg, then press Enter"
              />
            </div>

            {/* Lab request */}
            <div>
              <label className={label}>Lab Requests <span className="text-text-sub font-normal">(optional)</span></label>
              <ChipInput
                chips={labRequests}
                onChange={setLabRequests}
                placeholder="e.g. Complete Blood Count (CBC), then press Enter"
              />
            </div>

            <div className="h-px bg-elements/50" />

            {/* Medical certificate */}
            <ToggleRow
              label="Medical Certificate"
              description="Issue a medical certificate for this patient"
              enabled={certOn}
              onChange={setCertOn}
            >
              <div>
                <label className={label}>Purpose</label>
                <input
                  type="text"
                  value={certPurpose}
                  onChange={(e) => setCertPurpose(e.target.value)}
                  placeholder="e.g. For work clearance"
                  className={inputCls}
                />
              </div>
            </ToggleRow>

            {/* Referral */}
            <ToggleRow
              label="Referral"
              description="Refer this patient to another specialist"
              enabled={referralOn}
              onChange={setReferralOn}
            >
              <div>
                <label className={label}>Referring to</label>
                <SpecializationSelect value={referralSpec} onChange={setReferralSpec} />
              </div>
            </ToggleRow>

          </div>

          {/* Footer */}
          <div className="shrink-0 flex gap-3 px-8 py-5 border-t border-elements">
            <button
              type="button"
              onClick={() => !saving && onClose()}
              disabled={saving}
              className="h-11 px-5 rounded-lg border border-elements text-[16px] font-medium text-text-main
                hover:bg-bg-sub transition-colors duration-150 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !notes.trim()}
              className="flex-1 h-11 rounded-lg bg-brand text-white text-[16px] font-medium
                hover:opacity-90 transition-opacity duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Saving…" : "Save and share with patient"}
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
