"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { ProfileStepper } from "./ProfileStepper";
import { Step1Basics } from "./Step1Basics";
import { Step2BodyMetrics } from "./Step2BodyMetrics";
import { Step3MedicalHistory } from "./Step3MedicalHistory";
import { Step4Overview } from "./Step4Overview";

// --- Types --------------------------------------------------------------------

export interface ProfileData {
  firstName: string;
  lastName: string;
  birthday: string;
  contactNumber: string;
  weight: string;
  height: string;
  conditions: string[];
  otherCondition: string;
  allergies: string[];
  otherAllergies: string[];
  medications: string[];
}

// --- Step validation ----------------------------------------------------------

function isStep1Valid(d: ProfileData) {
  if (!d.firstName.trim() || !d.lastName.trim() || !d.birthday) return false;
  const today = new Date(), birth = new Date(d.birthday);
  const age   = today.getFullYear() - birth.getFullYear();
  const m     = today.getMonth() - birth.getMonth();
  const isAtLeast13 = (m < 0 || (m === 0 && today.getDate() < birth.getDate())) ? age - 1 >= 13 : age >= 13;
  return isAtLeast13 && d.contactNumber.length === 10 && d.contactNumber.startsWith("9");
}

function isStep2Valid(d: ProfileData) {
  const w = parseFloat(d.weight), h = parseFloat(d.height);
  return !isNaN(w) && w >= 20 && w <= 300 && !isNaN(h) && h >= 100 && h <= 250;
}

const INITIAL: ProfileData = {
  firstName: "",
  lastName: "",
  birthday: "",
  contactNumber: "",
  weight: "",
  height: "",
  conditions: [],
  otherCondition: "",
  allergies: [],
  otherAllergies: [],
  medications: [],
};

// --- Component ----------------------------------------------------------------

export function ProfileFlow() {
  const router = useRouter();
  const { update: refreshSession } = useSession();
  const [step,              setStep]              = useState(1);
  const [maxReached,        setMaxReached]        = useState(1);
  const [data,              setData]              = useState<ProfileData>(INITIAL);
  const [direction,         setDirection]         = useState<"forward" | "back">("forward");
  const [triggerValidation, setTriggerValidation] = useState(0);

  useEffect(() => {
    const savedStep = sessionStorage.getItem("profile_step");
    const savedMax  = sessionStorage.getItem("profile_max");
    const savedData = sessionStorage.getItem("profile_data");
    if (savedStep) setStep(Number(savedStep));
    if (savedMax)  setMaxReached(Number(savedMax));
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        const merged = { ...INITIAL, ...parsed };
        // Guard against stale string values for fields that are now arrays
        if (!Array.isArray(merged.conditions))    merged.conditions    = [];
        if (!Array.isArray(merged.allergies))     merged.allergies     = [];
        if (!Array.isArray(merged.otherAllergies)) merged.otherAllergies = [];
        if (!Array.isArray(merged.medications))   merged.medications   = [];
        setData(merged);
      } catch { /* ignore */ }
    }
  }, []);

  const stepValidArr = [false, isStep1Valid(data), isStep2Valid(data), true, true];

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
    sessionStorage.setItem("profile_step", String(next));
    sessionStorage.setItem("profile_max",  String(newMax));
    setStep(next);
    // If navigating to a previously-visited step that's now invalid, show its errors immediately
    if (maxReached >= next && !stepValidArr[next]) {
      setTriggerValidation((c) => c + 1);
    }
  }

  function update(patch: Partial<ProfileData>) {
    setData((prev) => {
      const next = { ...prev, ...patch };
      try {
        sessionStorage.setItem("profile_data", JSON.stringify(next));
      } catch { /* ignore storage errors */ }
      return next;
    });
  }

  async function handleFinish() {
    sessionStorage.removeItem("profile_step");
    sessionStorage.removeItem("profile_max");
    sessionStorage.removeItem("profile_data");

    // Read pending credentials set by RegisterFlow after OTP verification
    const rawCreds = sessionStorage.getItem("pending_creds");
    const creds: { email: string; password: string } | null = rawCreds ? JSON.parse(rawCreds) : null;
    sessionStorage.removeItem("pending_creds");

    try {
      await fetch("/api/patient/profile", {
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

    router.push("/patient/welcome");
  }

  const animClass = direction === "forward" ? "animate-stepForward" : "animate-stepBack";

  return (
    <div className="min-h-screen bg-white flex items-start justify-center px-6 py-16">
      <div className="flex flex-col gap-12 w-full max-w-lg">

        <ProfileStepper
          current={step}
          maxReached={maxReached}
          stepValid={stepValidArr}
          currentValid={stepValidArr[step] ?? true}
          onStepClick={(s) => goTo(s)}
        />

        <div key={`step-${step}`} className={animClass}>
          {step === 1 && (
            <Step1Basics
              data={data}
              onChange={update}
              onContinue={() => goTo(2)}
              triggerValidation={triggerValidation}
            />
          )}
          {step === 2 && (
            <Step2BodyMetrics
              data={data}
              onChange={update}
              onContinue={() => goTo(3)}
              onBack={() => goTo(1, "back", true)}
              triggerValidation={triggerValidation}
            />
          )}
          {step === 3 && (
            <Step3MedicalHistory
              data={data}
              onChange={update}
              onContinue={() => goTo(4)}
              onBack={() => goTo(2, "back", true)}
            />
          )}
          {step === 4 && (
            <Step4Overview
              data={data}
              canFinish={isStep1Valid(data) && isStep2Valid(data)}
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
