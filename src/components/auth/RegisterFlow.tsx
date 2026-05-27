"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { RegisterStep1 } from "./RegisterStep1";
import { RegisterStep2 } from "./RegisterStep2";

type Step = "credentials" | "verify";

interface StepData {
  role: "patient" | "doctor";
  email: string;
  password: string;
}

export function RegisterFlow() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("credentials");
  const [data, setData] = useState<StepData | null>(null);

  useEffect(() => {
    const savedStep = sessionStorage.getItem("register_step") as Step | null;
    const savedData = sessionStorage.getItem("register_data");
    if (savedStep === "verify" && savedData) {
      setData(JSON.parse(savedData));
      setStep("verify");
    }
  }, []);

  function goToVerify(incoming: StepData) {
    sessionStorage.setItem("register_step", "verify");
    sessionStorage.setItem("register_data", JSON.stringify(incoming));
    setData(incoming);
    setStep("verify");
  }

  function handleVerified() {
    sessionStorage.removeItem("register_step");
    sessionStorage.removeItem("register_data");
    router.push("/register/profile");
  }

  if (step === "verify" && data) {
    return <RegisterStep2 email={data.email} onVerified={handleVerified} />;
  }

  return <RegisterStep1 onContinue={goToVerify} />;
}
