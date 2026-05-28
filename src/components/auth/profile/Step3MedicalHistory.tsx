"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import type { ProfileData } from "./ProfileFlow";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  data: ProfileData;
  onChange: (patch: Partial<ProfileData>) => void;
  onContinue: () => void;
  onBack: () => void;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const CONDITIONS = [
  "Diabetes",
  "Hypertension",
  "Asthma",
  "Heart Disease",
  "Thyroid Disorder",
  "Kidney Disease",
  "Stroke",
  "Cancer",
  "Mental Health Condition",
  "Autoimmune Disease",
  "Other",
  "No existing conditions",
];

const ALLERGIES = [
  "Penicillin",
  "Aspirin",
  "Sulfa drugs",
  "Latex",
  "No known allergies",
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function CheckboxItem({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button type="button" onClick={onChange} className="flex items-center gap-2.5 text-left">
      <div
        className={`
          w-4.5 h-4.5 rounded border shrink-0
          flex items-center justify-center
          transition-all duration-200
          ${checked ? "bg-text-main border-text-main" : "border-elements hover:border-text-sub"}
        `}
      >
        {checked && <Check size={10} className="text-brand-sub" strokeWidth={1.75} />}
      </div>
      <span className="text-[14px] text-text-main leading-normal">{label}</span>
    </button>
  );
}

function TagInput({
  tags,
  onChange,
  placeholder,
  disabled,
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  const [input, setInput] = useState("");

  function toTitleCase(str: string) {
    return str.replace(/\b\w/g, (c) => c.toUpperCase());
  }

  function addTag(raw: string) {
    const trimmed = toTitleCase(raw.trim().replace(/,+$/, "").trim());
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
    }
    setInput("");
  }

  function removeTag(index: number) {
    onChange(tags.filter((_, i) => i !== index));
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
    if (val.endsWith(",")) {
      addTag(val.slice(0, -1));
    } else {
      setInput(val);
    }
  }

  return (
    <div className="flex flex-wrap gap-1.5 items-center min-h-10 rounded-lg border border-elements px-3 py-2 bg-white focus-within:border-text-main transition-colors duration-200 cursor-text">
      {tags.map((tag, i) => (
        <span
          key={i}
          className="flex items-center gap-1 px-2 py-0.5 bg-background-sub rounded text-[13px] text-text-main shrink-0"
        >
          {tag}
          <button
            type="button"
            onClick={() => removeTag(i)}
            className="text-text-sub hover:text-text-main transition-colors duration-150 leading-none"
          >
            <X size={10} strokeWidth={1.75} />
          </button>
        </span>
      ))}
      <input
        type="text"
        value={input}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={tags.length === 0 ? placeholder : ""}
        disabled={disabled}
        className="flex-1 min-w-35 text-[14px] text-text-main bg-transparent outline-none placeholder:text-text-sub disabled:cursor-not-allowed"
      />
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function Step3MedicalHistory({ data, onChange, onContinue, onBack }: Props) {
  function toggleCondition(c: string) {
    if (c === "No existing conditions") {
      onChange({
        conditions: data.conditions.includes(c) ? [] : ["No existing conditions"],
        otherCondition: "",
      });
    } else if (c === "Other") {
      if (data.conditions.includes("Other")) {
        onChange({ conditions: data.conditions.filter((x) => x !== "Other"), otherCondition: "" });
      } else {
        const without = data.conditions.filter((x) => x !== "No existing conditions");
        onChange({ conditions: [...without, "Other"] });
      }
    } else {
      const without = data.conditions.filter((x) => x !== "No existing conditions");
      onChange({
        conditions: without.includes(c)
          ? without.filter((x) => x !== c)
          : [...without, c],
      });
    }
  }

  function toggleAllergy(a: string) {
    if (a === "No known allergies") {
      onChange({
        allergies: data.allergies.includes(a) ? [] : ["No known allergies"],
        otherAllergies: [],
      });
    } else {
      const without = data.allergies.filter((x) => x !== "No known allergies");
      onChange({
        allergies: without.includes(a)
          ? without.filter((x) => x !== a)
          : [...without, a],
      });
    }
  }

  const noneKnown       = data.allergies.includes("No known allergies");
  const hasOtherCondition = data.conditions.includes("Other");

  return (
    <div className="flex flex-col gap-4">

      {/* ── Heading ─────────────────────────────────────────────────── */}
      <div
        className="flex flex-col gap-0.5 animate-fadeInDown"
        style={{ animationDelay: "0ms" }}
      >
        <h1 className="text-[24px] font-medium text-text-main tracking-[-0.264px] leading-normal">
          Your medical background
        </h1>
        <p className="text-[14px] text-text-sub leading-normal">
          This is optional but helps your doctor prepare for your first consultation.
          You can always update this later.
        </p>
      </div>

      {/* ── Existing conditions ─────────────────────────────────────── */}
      <div
        className="flex flex-col gap-2 mt-3 animate-fadeInDown"
        style={{ animationDelay: "60ms" }}
      >
        <label className="text-[14px] font-medium text-text-main">Existing conditions</label>
        <div className="flex flex-col gap-2.5">
          {CONDITIONS.map((c) => (
            <CheckboxItem
              key={c}
              label={c}
              checked={data.conditions.includes(c)}
              onChange={() => toggleCondition(c)}
            />
          ))}
        </div>
        {hasOtherCondition && (
          <input
            type="text"
            value={data.otherCondition}
            onChange={(e) => onChange({ otherCondition: e.target.value })}
            placeholder="Please specify"
            className="w-full h-10 rounded-lg border border-elements px-4 text-[14px] text-text-main bg-white outline-none transition-colors duration-200 placeholder:text-text-sub focus:border-text-main mt-1 animate-fadeInDown"
            style={{ animationDuration: "200ms" }}
          />
        )}
      </div>

      <div className="h-px bg-elements/50 w-full" />

      {/* ── Allergies ───────────────────────────────────────────────── */}
      <div
        className="flex flex-col gap-2 animate-fadeInDown"
        style={{ animationDelay: "120ms" }}
      >
        <label className="text-[14px] font-medium text-text-main">Allergies</label>
        <div className="flex flex-col gap-2.5">
          {ALLERGIES.map((a) => (
            <CheckboxItem
              key={a}
              label={a}
              checked={data.allergies.includes(a)}
              onChange={() => toggleAllergy(a)}
            />
          ))}
        </div>
        {!noneKnown && (
          <TagInput
            tags={data.otherAllergies}
            onChange={(tags) => onChange({ otherAllergies: tags })}
            placeholder="Add an allergy, then press ↵ Enter"
          />
        )}
      </div>

      <div className="h-px bg-elements/50 w-full" />

      {/* ── Current medications ─────────────────────────────────────── */}
      <div
        className="flex flex-col gap-1.5 animate-fadeInDown"
        style={{ animationDelay: "180ms" }}
      >
        <label className="text-[14px] font-medium text-text-main">
          Current medications{" "}
          <span className="font-normal text-text-sub">(optional)</span>
        </label>
        <TagInput
          tags={data.medications}
          onChange={(tags) => onChange({ medications: tags })}
          placeholder="e.g. Metformin 500mg, then press ↵ Enter"
        />
      </div>

      {/* ── Buttons ─────────────────────────────────────────────────── */}
      <div
        className="flex gap-3 mt-4 animate-fadeInDown"
        style={{ animationDelay: "240ms" }}
      >
        <button
          type="button"
          onClick={onBack}
          className="flex-1 h-10 rounded-lg border border-elements text-[14px] font-medium text-text-main hover:border-text-sub transition-colors duration-200"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onContinue}
          className="flex-3 h-10 rounded-lg bg-text-main text-[14px] font-medium tracking-[-0.176px] text-brand-sub hover:opacity-90 transition-all duration-200"
        >
          Continue
        </button>
      </div>

    </div>
  );
}
