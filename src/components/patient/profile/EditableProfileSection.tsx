"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import type { ProfileData } from "./ProfileModal";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatPhone(digits: string): string {
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
  return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
}

function kgToLbs(kg: number)  { return +(kg  * 2.20462).toFixed(1); }
function lbsToKg(lbs: number) { return +(lbs / 2.20462).toFixed(1); }

function cmToFtIn(cm: number) {
  const totalIn = cm / 2.54;
  const ft      = Math.floor(totalIn / 12);
  const inches  = Math.round(totalIn % 12);
  return inches === 12 ? { ft: ft + 1, inches: 0 } : { ft, inches };
}

function ftInToCm(ft: number, inches: number) {
  return +((ft * 30.48) + (inches * 2.54)).toFixed(1);
}


// ── TagInput ──────────────────────────────────────────────────────────────────

function TagInput({
  tags,
  onChange,
  placeholder,
}: {
  tags:        string[];
  onChange:    (tags: string[]) => void;
  placeholder: string;
}) {
  const [input, setInput] = useState("");

  function toTitleCase(str: string) {
    return str.replace(/\b\w/g, c => c.toUpperCase());
  }

  function addTag(raw: string) {
    const trimmed = toTitleCase(raw.trim().replace(/,+$/, "").trim());
    if (trimmed && !tags.includes(trimmed)) onChange([...tags, trimmed]);
    setInput("");
  }

  function removeTag(idx: number) {
    onChange(tags.filter((_, i) => i !== idx));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if ((e.key === "Enter" || e.key === ",") && input.trim()) {
      e.preventDefault();
      addTag(input);
    } else if (e.key === "Backspace" && input === "" && tags.length > 0) {
      removeTag(tags.length - 1);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    if (val.endsWith(",")) addTag(val.slice(0, -1));
    else setInput(val);
  }

  return (
    <div className="flex flex-wrap gap-1.5 items-center min-h-11 rounded-lg border border-elements
      px-3 py-2 bg-bg-main focus-within:border-text-main transition-colors duration-200 cursor-text">
      {tags.map((tag, i) => (
        <span key={i} className="flex items-center gap-1 px-2.5 py-0.5 bg-bg-sub rounded-md
          text-[14px] text-text-main border border-elements shrink-0">
          {tag}
          <button type="button" onClick={() => removeTag(i)}
            className="text-text-sub hover:text-error transition-colors leading-none ml-0.5">
            <X size={11} strokeWidth={2} />
          </button>
        </span>
      ))}
      <input
        type="text"
        value={input}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={tags.length === 0 ? placeholder : ""}
        className="flex-1 min-w-36 text-[16px] text-text-main bg-transparent outline-none
          placeholder:text-text-sub"
      />
    </div>
  );
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface Props {
  data:          ProfileData;
  onUpdate:      (patch: Partial<ProfileData>) => void;
  onDirtyChange: (dirty: boolean) => void;
  warnKey?:      number;
}

interface FormState {
  name:               string;
  dateOfBirth:        string;
  phone:              string;
  weight:             string;
  height:             string;
  allergies:          string[];
  currentMedications: string[];
  conditions:         string[];
}

function toForm(data: ProfileData): FormState {
  return {
    name:               data.name,
    dateOfBirth:        data.dateOfBirth?.slice(0, 10) ?? "",
    phone:              data.phone?.replace(/^\+63/, "") ?? "",
    weight:             data.weight  != null ? String(data.weight)  : "",
    height:             data.height  != null ? String(data.height)  : "",
    allergies:          [...data.allergies],
    currentMedications: [...data.currentMedications],
    conditions:         data.medicalHistory
      ? data.medicalHistory.split(",").map(s => s.trim()).filter(s =>
          Boolean(s) && !/^no\b/i.test(s) && !/^none/i.test(s)
        )
      : [],
  };
}

// ── Component ─────────────────────────────────────────────────────────────────

export function EditableProfileSection({ data, onUpdate, onDirtyChange, warnKey }: Props) {
  const [form,        setForm]        = useState<FormState>(() => toForm(data));
  const [saved,       setSaved]       = useState<FormState>(() => toForm(data));
  const [saving,      setSaving]      = useState(false);
  const [bannerWarn,  setBannerWarn]  = useState(false);
  const [shakeCount,  setShakeCount]  = useState(0);

  // ── Metric unit state ────────────────────────────────────────────────────────
  const [weightUnit,  setWeightUnit]  = useState<"kg" | "lbs">("kg");
  const [heightUnit,  setHeightUnit]  = useState<"cm" | "ft">("cm");
  const [weightInput, setWeightInput] = useState(() => toForm(data).weight);
  const [hCmInput,    setHCmInput]    = useState(() => toForm(data).height);
  const [hFtInput,    setHFtInput]    = useState("");
  const [hInInput,    setHInInput]    = useState("");

  const isDirty = JSON.stringify(form) !== JSON.stringify(saved);

  useEffect(() => { onDirtyChange(isDirty); }, [isDirty, onDirtyChange]);

  useEffect(() => {
    if (!warnKey) return;
    setBannerWarn(true);
    setShakeCount(c => c + 1);
    const t = setTimeout(() => setBannerWarn(false), 1500);
    return () => clearTimeout(t);
  }, [warnKey]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  function reset() {
    setForm(saved);
    setWeightInput(saved.weight);
    setHCmInput(saved.height);
    setHFtInput("");
    setHInInput("");
    setWeightUnit("kg");
    setHeightUnit("cm");
  }

  function handleWeightChange(val: string) {
    setWeightInput(val);
    const num = parseFloat(val);
    if (!isNaN(num) && val !== "") {
      set("weight", String(weightUnit === "kg" ? num : lbsToKg(num)));
    } else {
      set("weight", "");
    }
  }

  function switchWeightUnit(unit: "kg" | "lbs") {
    if (unit === weightUnit) return;
    const num = parseFloat(weightInput);
    if (!isNaN(num)) setWeightInput(String(unit === "lbs" ? kgToLbs(num) : lbsToKg(num)));
    setWeightUnit(unit);
  }

  function handleHeightCmChange(val: string) {
    setHCmInput(val);
    set("height", val);
  }

  function handleFtInChange(ft: string, inches: string) {
    const f = parseInt(ft)     || 0;
    const i = parseInt(inches) || 0;
    set("height", (f > 0 || i > 0) ? String(ftInToCm(f, i)) : "");
  }

  function switchHeightUnit(unit: "cm" | "ft") {
    if (unit === heightUnit) return;
    if (unit === "ft" && form.height) {
      const { ft, inches } = cmToFtIn(parseFloat(form.height));
      setHFtInput(ft > 0 ? String(ft) : "");
      setHInInput(inches > 0 ? String(inches) : "");
    } else if (unit === "cm" && form.height) {
      setHCmInput(form.height);
    }
    setHeightUnit(unit);
  }

  const blockInvalidKeys = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (["e", "E", "+", "-"].includes(e.key)) e.preventDefault();
  };

  async function save() {
    const prevSaved = saved;
    setSaved(form);       // optimistic — isDirty becomes false, banner exits immediately
    setSaving(true);
    try {
      const body = {
        name:               form.name.trim(),
        dateOfBirth:        form.dateOfBirth || null,
        phone:              form.phone ? `+63${form.phone.replace(/^0+/, "")}` : "",
        weight:             form.weight ? Number(form.weight) : null,
        height:             form.height ? Number(form.height) : null,
        allergies:          form.allergies,
        currentMedications: form.currentMedications,
        medicalHistory:     form.conditions.join(", "),
      };
      const res = await fetch("/api/patient/profile", {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(body),
      });
      if (!res.ok) throw new Error();
      onUpdate({ ...body });
      toast.success("Changes saved.");
    } catch {
      setSaved(prevSaved); // revert — isDirty becomes true, banner reappears
      toast.error("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const label = "block text-[14px] font-medium text-text-sub mb-1.5";

  const input = `w-full h-11 px-3 rounded-lg border border-elements text-[16px] text-text-main
    outline-none focus:border-text-main transition-colors duration-200 bg-bg-main`;

  return (
    <div className="flex flex-col">

      {/* ── Personal info ─────────────────────────────────────────── */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-0.5">
          <p className="text-[18px] font-medium text-text-main">Personal Information</p>
          <p className="text-[16px] text-text-sub">The basics we use to identify you and keep in touch.</p>
        </div>

        <div>
          <label className={label}>Full Name</label>
          <input type="text" value={form.name}
            onChange={e => set("name", e.target.value)}
            className={input} placeholder="Your full name" />
        </div>

        <div>
          <label className={label}>Date of Birth</label>
          <input type="date" value={form.dateOfBirth}
            onChange={e => set("dateOfBirth", e.target.value)}
            className={input} />
        </div>

        <div>
          <label className={label}>Contact Number</label>
          <div className="flex items-center h-11 rounded-lg border border-elements bg-bg-main
            focus-within:border-text-main transition-colors duration-200">
            <span className="px-3 text-[16px] text-text-sub border-r border-elements h-full
              flex items-center shrink-0">+63</span>
            <input type="tel" value={formatPhone(form.phone)}
              onChange={e => set("phone", e.target.value.replace(/\D/g, ""))}
              className="flex-1 h-full px-3 text-[16px] text-text-main outline-none bg-transparent"
              placeholder="917 123 4567" />
          </div>
        </div>
      </div>

      <div className="h-px bg-elements/50 my-8" />

      {/* ── Health info ───────────────────────────────────────────── */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-0.5">
          <p className="text-[18px] font-medium text-text-main">Health Profile</p>
          <p className="text-[16px] text-text-sub">Shared with your doctor to help them prepare for your consultation.</p>
        </div>

      {/* ── Weight ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-end justify-between">
          <label className={label} style={{ marginBottom: 0 }}>Weight</label>
          <div className="relative flex bg-bg-sub rounded-lg p-0.75">
            <div className={`absolute top-0.75 bottom-0.75 left-0.75 w-[calc(50%-3px)] bg-bg-main rounded-md
              shadow-[0_1px_3px_rgba(0,0,0,0.12)] pointer-events-none transition-transform duration-200 ease-out
              ${weightUnit === "lbs" ? "translate-x-full" : "translate-x-0"}`} />
            {(["kg", "lbs"] as const).map(u => (
              <button key={u} type="button" onClick={() => switchWeightUnit(u)}
                className={`relative z-10 flex-1 text-center px-2.5 py-1 text-[14px] transition-colors duration-200
                  ${weightUnit === u ? "text-text-main" : "text-text-sub hover:text-text-main"}`}>
                {u}
              </button>
            ))}
          </div>
        </div>
        <div className="relative h-11 rounded-lg border border-elements overflow-hidden
          focus-within:border-text-main transition-colors duration-200 bg-bg-main">
          <input
            type="number" value={weightInput}
            onChange={e => handleWeightChange(e.target.value)}
            onKeyDown={blockInvalidKeys}
            placeholder="0" min={0}
            className="w-full h-full px-3 text-[16px] text-text-main bg-transparent outline-none
              [appearance:textfield] [&::-webkit-outer-spin-button]:hidden [&::-webkit-inner-spin-button]:hidden"
          />
        </div>
      </div>

      {/* ── Height ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-end justify-between">
          <label className={label} style={{ marginBottom: 0 }}>Height</label>
          <div className="relative flex bg-bg-sub rounded-lg p-0.75">
            <div className={`absolute top-0.75 bottom-0.75 left-0.75 w-[calc(50%-3px)] bg-bg-main rounded-md
              shadow-[0_1px_3px_rgba(0,0,0,0.12)] pointer-events-none transition-transform duration-200 ease-out
              ${heightUnit === "ft" ? "translate-x-full" : "translate-x-0"}`} />
            {(["cm", "ft"] as const).map(u => (
              <button key={u} type="button" onClick={() => switchHeightUnit(u)}
                className={`relative z-10 flex-1 text-center px-2.5 py-1 text-[14px] transition-colors duration-200
                  ${heightUnit === u ? "text-text-main" : "text-text-sub hover:text-text-main"}`}>
                {u}
              </button>
            ))}
          </div>
        </div>
        <div key={heightUnit} className="animate-switchIn">
          {heightUnit === "cm" ? (
            <div className="relative h-11 rounded-lg border border-elements overflow-hidden
              focus-within:border-text-main transition-colors duration-200 bg-bg-main">
              <input
                type="number" value={hCmInput}
                onChange={e => handleHeightCmChange(e.target.value)}
                onKeyDown={blockInvalidKeys}
                placeholder="0" min={0}
                className="w-full h-full px-3 text-[16px] text-text-main bg-transparent outline-none
                  [appearance:textfield] [&::-webkit-outer-spin-button]:hidden [&::-webkit-inner-spin-button]:hidden"
              />
            </div>
          ) : (
            <div className="flex gap-2">
              <div className="relative flex-1 h-11 rounded-lg border border-elements overflow-hidden
                focus-within:border-text-main transition-colors duration-200 bg-bg-main">
                <input
                  type="number" value={hFtInput}
                  onChange={e => { setHFtInput(e.target.value); handleFtInChange(e.target.value, hInInput); }}
                  onKeyDown={blockInvalidKeys}
                  placeholder="0" min={0}
                  className="w-full h-full px-3 pr-10 text-[16px] text-text-main bg-transparent outline-none
                    [appearance:textfield] [&::-webkit-outer-spin-button]:hidden [&::-webkit-inner-spin-button]:hidden"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[14px] text-text-sub
                  select-none pointer-events-none">ft</span>
              </div>
              <div className="relative flex-1 h-11 rounded-lg border border-elements overflow-hidden
                focus-within:border-text-main transition-colors duration-200 bg-bg-main">
                <input
                  type="number" value={hInInput}
                  onChange={e => { setHInInput(e.target.value); handleFtInChange(hFtInput, e.target.value); }}
                  onKeyDown={blockInvalidKeys}
                  placeholder="0" min={0} max={11}
                  className="w-full h-full px-3 pr-10 text-[16px] text-text-main bg-transparent outline-none
                    [appearance:textfield] [&::-webkit-outer-spin-button]:hidden [&::-webkit-inner-spin-button]:hidden"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[14px] text-text-sub
                  select-none pointer-events-none">in</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div>
        <label className={label}>Existing Conditions</label>
        <TagInput
          tags={form.conditions}
          onChange={v => set("conditions", v)}
          placeholder="e.g. Diabetes, Hypertension, then press ↵ Enter"
        />
      </div>

      <div>
        <label className={label}>Allergies</label>
        {form.allergies.length === 0 && (
          <p className="text-[16px] text-text-sub mb-1.5">None added yet.</p>
        )}
        <TagInput
          tags={form.allergies}
          onChange={v => set("allergies", v)}
          placeholder="Add an allergy, then press ↵ Enter"
        />
      </div>

      <div>
        <label className={label}>Current Medications</label>
        {form.currentMedications.length === 0 && (
          <p className="text-[16px] text-text-sub mb-1.5">None added yet.</p>
        )}
        <TagInput
          tags={form.currentMedications}
          onChange={v => set("currentMedications", v)}
          placeholder="e.g. Metformin 500mg, then press ↵ Enter"
        />
      </div>

      {/* ── Unsaved changes banner — always in DOM, transitions in/out ── */}
      {/* Outer: controls slide in/out — never remounts */}
      <div
        className="sticky bottom-6"
        style={{
          opacity:       isDirty ? 1 : 0,
          transform:     isDirty ? "translateY(0)" : "translateY(14px)",
          pointerEvents: isDirty ? "auto" : "none",
          transition:    "opacity 220ms ease, transform 220ms ease",
        }}
      >
        {/* Inner: key forces remount on each Esc press, restarting shake */}
        <div key={shakeCount} className={shakeCount > 0 ? "animate-shake" : ""}>
        <div
          className="rounded-xl flex items-center justify-between px-5 py-3.5"
          style={{
            backgroundColor: bannerWarn ? "rgb(254 242 242)"     : "var(--brand-sub)",
            border:          bannerWarn ? "1px solid rgba(226,79,98,0.4)" : "1px solid rgba(0,135,134,0.3)",
            boxShadow:       bannerWarn ? "0 4px 16px rgba(226,79,98,0.14)" : "0 4px 16px rgba(0,135,134,0.12)",
            transition:      "background-color 300ms ease, border-color 300ms ease, box-shadow 300ms ease",
          }}
        >
          <p className="text-[14px] font-medium text-text-main">You have unsaved changes.</p>
          <div className="flex items-center gap-4">
            <button type="button" onClick={reset}
              className="text-[14px] font-medium text-text-main hover:text-text-sub transition-colors">
              Reset
            </button>
            <button type="button" onClick={save} disabled={saving}
              className="h-9 px-4 rounded-lg bg-success text-white text-[14px] font-medium
                hover:opacity-90 transition-opacity duration-150 disabled:opacity-50">
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </div>
        </div>
      </div>
    </div>

    </div>
  );
}
