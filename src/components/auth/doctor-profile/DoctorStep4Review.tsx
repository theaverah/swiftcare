"use client";

import { useState } from "react";
import { User, Stethoscope, Calendar } from "lucide-react";
import type { DoctorProfileData } from "./DoctorProfileFlow";

function formatBirthday(birthday: string): string {
  if (!birthday) return "—";
  return new Date(birthday + "T00:00:00").toLocaleDateString("en-US", {
    month: "long", day: "numeric", year: "numeric",
  });
}
import { DAYS } from "./DoctorProfileFlow";

interface Props {
  data: DoctorProfileData;
  canFinish: boolean;
  onEdit: (step: number) => void;
  onFinish: () => Promise<void>;
  onBack: () => void;
}

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
          <Icon size={14} strokeWidth={1.75} className={`text-text-main shrink-0 ${iconClassName ?? ""}`} />
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

export function DoctorStep4Review({ data, canFinish, onEdit, onFinish, onBack }: Props) {
  const [saving, setSaving] = useState(false);

  async function handleFinish() {
    setSaving(true);
    await onFinish();
    setSaving(false);
  }

  const enabledSchedule = DAYS
    .filter((d) => data.schedule[d]?.enabled)
    .map((d) => ({ day: d, ...data.schedule[d] }));

  const fullName = [data.firstName, data.lastName].filter(Boolean).join(" ") || "—";

  const contactFormatted = data.contactNumber
    ? `+63 ${data.contactNumber.slice(0, 3)} ${data.contactNumber.slice(3, 6)} ${data.contactNumber.slice(6)}`
    : "—";

  return (
    <div className="flex flex-col gap-4">

      {/* -- Heading --------------------------------------------------- */}
      <div className="flex flex-col gap-0.5 animate-fadeInDown" style={{ animationDelay: "0ms" }}>
        <h1 className="text-[24px] font-medium text-text-main tracking-[-0.264px] leading-normal">
          Almost there!
        </h1>
        <p className="text-[14px] text-text-sub leading-normal">
          Review your profile before going live on SwiftCare.
        </p>
      </div>

      {/* -- Profile section ------------------------------------------- */}
      <div className="animate-fadeInDown mt-1" style={{ animationDelay: "60ms" }}>
        <Section title="Profile" icon={User} onEdit={() => onEdit(1)} noDivider iconClassName="pb-[1.5px]">
          <div className="flex flex-col gap-2.5">
            <Row label="Name"     value={fullName} />
            <Row label="Birthday" value={formatBirthday(data.birthday)} />
            <Row label="Contact"  value={contactFormatted} />
          </div>
        </Section>
      </div>

      {/* -- Professional Details section ------------------------------- */}
      <div className="animate-fadeInDown" style={{ animationDelay: "120ms" }}>
        <Section title="Professional Details" icon={Stethoscope} onEdit={() => onEdit(2)}>
          <div className="flex flex-col gap-2.5">
            <Row label="Specialization"    value={data.specializations.length > 0 ? data.specializations.join(", ") : "—"} />
            <Row label="PRC License"       value={data.prcLicense || "—"} />
            <Row label="Years of Experience" value={data.yearsOfExperience ? `${data.yearsOfExperience} years` : "—"} />
            <Row label="Languages"         value={data.languages.length > 0 ? data.languages.join(", ") : "—"} />
            {data.bio && <Row label="Bio" value={data.bio} />}
          </div>
        </Section>
      </div>

      {/* -- Consultation Setup section --------------------------------- */}
      <div className="animate-fadeInDown" style={{ animationDelay: "180ms" }}>
        <Section title="Consultation Setup" icon={Calendar} onEdit={() => onEdit(3)}>
          <div className="flex flex-col gap-2.5">
            <Row label="Consultation Fee" value={data.consultationFee ? `PHP ${data.consultationFee}` : "—"} />
            <div className="flex flex-col gap-0.5">
              <span className="text-[14px] text-text-sub">Weekly Schedule</span>
              {enabledSchedule.length > 0 ? (
                <div className="flex flex-col gap-0.5">
                  {enabledSchedule.map(({ day, startTime, endTime }) => (
                    <span key={day} className="text-[14px] text-text-main">{day}: {startTime} – {endTime}</span>
                  ))}
                </div>
              ) : (
                <span className="text-[14px] text-text-main">—</span>
              )}
            </div>
          </div>
        </Section>
      </div>

      {/* -- Buttons --------------------------------------------------- */}
      <div className="flex gap-3 mt-4 animate-fadeInDown" style={{ animationDelay: "240ms" }}>
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
          {saving ? "Saving…" : "Complete setup"}
        </button>
      </div>

    </div>
  );
}
