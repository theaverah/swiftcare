"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { DoctorProfileStepper } from "./DoctorProfileStepper";
import { DoctorStep1Profile } from "./DoctorStep1Profile";
import { DoctorStep2ProfessionalDetails } from "./DoctorStep2ProfessionalDetails";
import { DoctorStep3ConsultationSetup } from "./DoctorStep3ConsultationSetup";
import { DoctorStep4Review } from "./DoctorStep4Review";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BreakSlot {
  startTime: string;
  endTime: string;
}

export interface ScheduleDay {
  enabled: boolean;
  startTime: string;
  endTime: string;
  breaks: BreakSlot[];
}

export interface DoctorProfileData {
  profileImage: string;
  firstName: string;
  lastName: string;
  birthday: string;
  contactNumber: string;
  specializations: string[];
  prcLicense: string;
  yearsOfExperience: string;
  languages: string[];
  bio: string;
  consultationFee: string;
  schedule: Record<string, ScheduleDay>;
}

// ─── Constants ────────────────────────────────────────────────────────────────

export const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const INITIAL: DoctorProfileData = {
  profileImage: "",
  firstName: "",
  lastName: "",
  birthday: "",
  contactNumber: "",
  specializations: [],
  prcLicense: "",
  yearsOfExperience: "",
  languages: [],
  bio: "",
  consultationFee: "",
  schedule: Object.fromEntries(
    DAYS.map((d) => [d, { enabled: false, startTime: "8:00 AM", endTime: "5:00 PM", breaks: [] }])
  ),
};

// ─── Validation ───────────────────────────────────────────────────────────────

function timeToMinutes(t: string): number {
  const [time, ampm] = t.split(" ");
  let [h, m] = time.split(":").map(Number);
  if (ampm === "PM" && h !== 12) h += 12;
  if (ampm === "AM" && h === 12) h = 0;
  return h * 60 + m;
}

function isAtLeast18(birthday: string): boolean {
  if (!birthday) return false;
  const today = new Date();
  const birth = new Date(birthday + "T00:00:00");
  const age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  return (m < 0 || (m === 0 && today.getDate() < birth.getDate())) ? age - 1 >= 18 : age >= 18;
}

function isStep1Valid(d: DoctorProfileData) {
  return (
    !!d.firstName.trim() &&
    !!d.lastName.trim() &&
    !!d.birthday && isAtLeast18(d.birthday) &&
    d.contactNumber.length === 10 && d.contactNumber.startsWith("9")
  );
}

function isStep2Valid(d: DoctorProfileData) {
  return d.specializations.length > 0 && !!d.prcLicense.trim();
}

function hasOverlappingBreaks(breaks: BreakSlot[]): boolean {
  for (let i = 0; i < breaks.length; i++) {
    for (let j = i + 1; j < breaks.length; j++) {
      if (
        timeToMinutes(breaks[i].startTime) < timeToMinutes(breaks[j].endTime) &&
        timeToMinutes(breaks[j].startTime) < timeToMinutes(breaks[i].endTime)
      ) return true;
    }
  }
  return false;
}

function allSlotsBlocked(dayStart: string, dayEnd: string, breaks: BreakSlot[]): boolean {
  const start = timeToMinutes(dayStart);
  const end   = timeToMinutes(dayEnd);
  for (let s = start; s + 30 <= end; s += 30) {
    const free = !breaks.some(
      (b) => timeToMinutes(b.startTime) < s + 30 && timeToMinutes(b.endTime) > s
    );
    if (free) return false;
  }
  return true;
}

function isStep3Valid(d: DoctorProfileData) {
  const fee = parseFloat(d.consultationFee);
  if (isNaN(fee) || fee < 100 || fee > 10000) return false;
  const enabled = DAYS.map((day) => d.schedule[day]).filter((day) => day?.enabled);
  if (enabled.length === 0) return false;
  return enabled.every((day) => {
    if (!day.startTime || !day.endTime) return false;
    if (timeToMinutes(day.startTime) >= timeToMinutes(day.endTime)) return false;
    const breaks = day.breaks ?? [];
    const breaksIndividuallyValid = breaks.every((brk) =>
      timeToMinutes(brk.startTime) < timeToMinutes(brk.endTime) &&
      timeToMinutes(brk.startTime) >= timeToMinutes(day.startTime) &&
      timeToMinutes(brk.endTime) <= timeToMinutes(day.endTime)
    );
    if (!breaksIndividuallyValid) return false;
    if (hasOverlappingBreaks(breaks)) return false;
    if (breaks.length > 0 && allSlotsBlocked(day.startTime, day.endTime, breaks)) return false;
    return true;
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DoctorProfileFlow() {
  const router = useRouter();
  const { update: refreshSession } = useSession();
  const [step,              setStep]              = useState(1);
  const [maxReached,        setMaxReached]        = useState(1);
  const [data,              setData]              = useState<DoctorProfileData>(INITIAL);
  const [direction,         setDirection]         = useState<"forward" | "back">("forward");
  const [triggerValidation, setTriggerValidation] = useState(0);

  useEffect(() => {
    const savedStep = sessionStorage.getItem("doctor_profile_step");
    const savedMax  = sessionStorage.getItem("doctor_profile_max");
    const savedData = sessionStorage.getItem("doctor_profile_data");
    if (savedStep) setStep(Number(savedStep));
    if (savedMax)  setMaxReached(Number(savedMax));
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        const merged = { ...INITIAL, ...parsed };
        if (typeof merged.profileImage !== "string") merged.profileImage = "";
        if (typeof merged.firstName !== "string") merged.firstName = "";
        if (typeof merged.lastName !== "string") merged.lastName = "";
        if (typeof merged.birthday !== "string") merged.birthday = "";
        if (!Array.isArray(merged.specializations)) merged.specializations = [];
        if (!Array.isArray(merged.languages)) merged.languages = [];
        if (typeof merged.schedule !== "object" || merged.schedule === null) {
          merged.schedule = INITIAL.schedule;
        } else {
          for (const day of Object.values(merged.schedule as Record<string, ScheduleDay>)) {
            if (!Array.isArray(day.breaks)) day.breaks = [];
          }
        }
        setData(merged);
      } catch { /* ignore */ }
    }
  }, []);

  const stepValidArr = [false, isStep1Valid(data), isStep2Valid(data), isStep3Valid(data), true];

  function goTo(next: number, dir?: "forward" | "back", allowIncomplete = false) {
    if (!allowIncomplete && next > step) {
      const allValid = stepValidArr.slice(step, next).every(Boolean);
      if (!allValid) {
        setTriggerValidation((c) => c + 1);
        return;
      }
    }
    const resolvedDir = dir ?? (next > step ? "forward" : "back");
    setDirection(resolvedDir);
    const newMax = Math.max(maxReached, next);
    setMaxReached(newMax);
    sessionStorage.setItem("doctor_profile_step", String(next));
    sessionStorage.setItem("doctor_profile_max",  String(newMax));
    setStep(next);
    if (maxReached >= next && !stepValidArr[next]) {
      setTriggerValidation((c) => c + 1);
    }
  }

  function update(patch: Partial<DoctorProfileData>) {
    setData((prev) => {
      const next = { ...prev, ...patch };
      try {
        sessionStorage.setItem("doctor_profile_data", JSON.stringify(next));
      } catch { /* ignore */ }
      return next;
    });
  }

  async function handleFinish() {
    sessionStorage.removeItem("doctor_profile_step");
    sessionStorage.removeItem("doctor_profile_max");
    sessionStorage.removeItem("doctor_profile_data");

    // Read pending credentials set by RegisterFlow after OTP verification
    const rawCreds = sessionStorage.getItem("pending_creds");
    const creds: { email: string; password: string } | null = rawCreds ? JSON.parse(rawCreds) : null;
    sessionStorage.removeItem("pending_creds");

    try {
      await fetch("/api/doctor/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          ...(creds ? { pendingEmail: creds.email } : {}),
        }),
      });
    } catch { /* non-blocking */ }

    if (creds) {
      // New registration — sign in now that the account exists
      await signIn("credentials", { email: creds.email, password: creds.password, redirect: false });
    } else {
      await refreshSession();
    }

    router.push("/doctor/welcome");
  }

  const animClass = direction === "forward" ? "animate-stepForward" : "animate-stepBack";

  return (
    <div className="min-h-screen bg-white flex items-start justify-center px-6 py-16">
      <div className="flex flex-col gap-12 w-full max-w-lg">

        <DoctorProfileStepper
          current={step}
          maxReached={maxReached}
          stepValid={stepValidArr}
          currentValid={stepValidArr[step] ?? true}
          onStepClick={(s) => goTo(s)}
        />

        <div key={`doctor-step-${step}`} className={animClass}>
          {step === 1 && (
            <DoctorStep1Profile
              data={data}
              onChange={update}
              onContinue={() => goTo(2)}
              triggerValidation={triggerValidation}
            />
          )}
          {step === 2 && (
            <DoctorStep2ProfessionalDetails
              data={data}
              onChange={update}
              onContinue={() => goTo(3)}
              onBack={() => goTo(1, "back", true)}
              triggerValidation={triggerValidation}
            />
          )}
          {step === 3 && (
            <DoctorStep3ConsultationSetup
              data={data}
              onChange={update}
              onContinue={() => goTo(4)}
              onBack={() => goTo(2, "back", true)}
              triggerValidation={triggerValidation}
            />
          )}
          {step === 4 && (
            <DoctorStep4Review
              data={data}
              canFinish={isStep1Valid(data) && isStep2Valid(data) && isStep3Valid(data)}
              onEdit={(s) => goTo(s, "back", true)}
              onFinish={handleFinish}
              onBack={() => goTo(3, "back", true)}
            />
          )}
        </div>

      </div>
    </div>
  );
}
