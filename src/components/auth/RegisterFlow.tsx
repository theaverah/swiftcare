"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
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
  const { data: session, status } = useSession();
  const [step, setStep] = useState<Step>("credentials");
  const [data, setData] = useState<StepData | null>(null);

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role) {
      router.replace(session.user.role === "doctor" ? "/doctor/dashboard" : "/patient/dashboard");
      return;
    }
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

  async function handleVerified() {
    sessionStorage.removeItem("register_step");
    const { role, email, password } = data!;
    sessionStorage.removeItem("register_data");
    await signIn("credentials", { email, password, redirect: false });
    router.push(role === "doctor" ? "/register/doctor-profile" : "/register/profile");
  }

  if (step === "verify" && data) {
    return <RegisterStep2 email={data.email} onVerified={handleVerified} />;
  }

  return <RegisterStep1 onContinue={goToVerify} />;
}
