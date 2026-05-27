"use client";

import { useState } from "react";
import { User, Activity, FileHeart } from "lucide-react";
import type { ProfileData } from "./ProfileFlow";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  data: ProfileData;
  canFinish: boolean;
  onEdit: (step: number) => void;
  onFinish: () => Promise<void>;
  onBack: () => void;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Section({
  title,
  icon: Icon,
  onEdit,
  children,
  noDivider,
  iconClassName,
}: {
  title: string;
  icon: React.ElementType;
  onEdit: () => void;
  children: React.ReactNode;
  noDivider?: boolean;
  iconClassName?: string;
}) {
  return (
    <div className={`flex flex-col gap-3 pt-4 ${noDivider ? "" : "border-t border-elements"}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon size={14} strokeWidth={2.5} className={`text-text-main shrink-0 ${iconClassName ?? ""}`} />
          <span className="text-[14px] font-medium text-text-main">{title}</span>
        </div>
        <button
          type="button"
          onClick={onEdit}
          className="text-[14px] text-brand hover:underline transition-colors duration-150"
        >
          Edit
        </button>
      </div>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[14px] text-text-sub">{label}</span>
      <span className="text-[14px] text-text-main">{value || "—"}</span>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function Step4Overview({ data, canFinish, onEdit, onFinish, onBack }: Props) {
  const [saving, setSaving] = useState(false);

  async function handleFinish() {
    setSaving(true);
    await onFinish();
    setSaving(false);
  }

  const conditionList = data.conditions
    .map((c) => (c === "Other" && data.otherCondition ? data.otherCondition : c))
    .join(", ") || "No existing conditions";
  const allergyList = [...data.allergies, ...data.otherAllergies].filter(Boolean).join(", ") || "No known allergies";

  return (
    <div className="flex flex-col gap-4">

      {/* ── Heading ─────────────────────────────────────────────────── */}
      <div
        className="flex flex-col gap-0.5 animate-fadeInDown"
        style={{ animationDelay: "0ms" }}
      >
        <h1 className="text-[24px] font-medium text-text-main tracking-[-0.264px] leading-normal">
          You&apos;re all set!
        </h1>
        <p className="text-[14px] text-text-sub leading-normal">
          Here&apos;s a summary of your profile before you get started.
        </p>
      </div>

      {/* ── Basics card ─────────────────────────────────────────────── */}
      <div
        className="animate-fadeInDown mt-1"
        style={{ animationDelay: "60ms" }}
      >
        <Section title="Profile" icon={User} onEdit={() => onEdit(1)} noDivider iconClassName="pb-[1.5px]">
          <div className="flex flex-col gap-2.5">
            <Row label="Name"     value={[data.firstName, data.lastName].filter(Boolean).join(" ") || "—"} />
            <Row label="Birthday" value={data.birthday ? new Date(data.birthday + "T00:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "—"} />
            <Row label="Contact"  value={data.contactNumber ? `+63 ${data.contactNumber.slice(0, 3)} ${data.contactNumber.slice(3, 6)} ${data.contactNumber.slice(6)}` : "—"} />
          </div>
        </Section>
      </div>

      {/* ── Body Metrics card ───────────────────────────────────────── */}
      <div
        className="animate-fadeInDown"
        style={{ animationDelay: "120ms" }}
      >
        <Section title="Vitals" icon={Activity} onEdit={() => onEdit(2)}>
          <div className="flex gap-8">
            <Row label="Weight" value={data.weight ? `${data.weight} kg` : "—"} />
            <Row label="Height" value={data.height ? `${data.height} cm` : "—"} />
          </div>
        </Section>
      </div>

      {/* ── Medical History card ─────────────────────────────────────── */}
      <div
        className="animate-fadeInDown"
        style={{ animationDelay: "180ms" }}
      >
        <Section title="Medical History" icon={FileHeart} onEdit={() => onEdit(3)}>
          <div className="flex flex-col gap-2.5">
            <Row label="Conditions" value={conditionList} />
            <Row label="Allergies"  value={allergyList} />
            {data.medications.length > 0 && (
              <Row label="Medications" value={data.medications.join(", ")} />
            )}
          </div>
        </Section>
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
          onClick={handleFinish}
          disabled={saving || !canFinish}
          className="flex-3 h-10 rounded-lg bg-text-main text-[14px] font-medium tracking-[-0.176px] text-brand-sub hover:opacity-90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? "Saving…" : "Go to my dashboard"}
        </button>
      </div>

    </div>
  );
}
