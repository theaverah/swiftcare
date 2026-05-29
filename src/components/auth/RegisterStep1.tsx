"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Check, AlertCircle } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Role = "patient" | "doctor";

// ─── Constants ────────────────────────────────────────────────────────────────

const PASSWORD_CONDITIONS = [
  { label: "At least 8 characters",         test: (pw: string) => pw.length >= 8 },
  { label: "1 uppercase letter",            test: (pw: string) => /[A-Z]/.test(pw) },
  { label: "1 lowercase letter",            test: (pw: string) => /[a-z]/.test(pw) },
  { label: "1 number",                      test: (pw: string) => /[0-9]/.test(pw) },
  { label: "1 special character (!@#$...)", test: (pw: string) => /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pw) },
] as const;

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

// Change 4: bare check, no circle
function FieldSuccessIcon() {
  return <Check size={16} className="text-success" strokeWidth={1.75} />;
}

interface RoleCardProps {
  label: string;
  description: string;
  selected: boolean;
  error: boolean;
  onClick: () => void;
  paddingClass: string;
}

function RoleCard({ label, description, selected, error, onClick, paddingClass }: RoleCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        flex flex-col items-start ${paddingClass} rounded-lg flex-1
        border transition-all duration-250 cursor-pointer text-left
        ${selected
          ? "border-text-main"
          : error
          ? "border-error"
          : "border-elements hover:border-text-sub"
        }
      `}
    >
      <div className="flex flex-col gap-0.5 w-full">
        {/* Radio + label: vertically centered */}
        <div className="flex gap-2 items-center">
          <div className="p-1 shrink-0">
            <div
              className={`
                w-[18px] h-[18px] rounded-full border flex items-center justify-center
                transition-all duration-250
                ${selected ? "border-brand" : "border-elements"}
              `}
            >
              <div
                className={`
                  rounded-full bg-brand transition-all duration-250
                  ${selected ? "w-[10px] h-[10px] opacity-100" : "w-0 h-0 opacity-0"}
                `}
              />
            </div>
          </div>
          <span className="text-[14px] font-medium text-text-main leading-normal tracking-[-0.176px]">
            {label}
          </span>
        </div>
        {/* Description indented to align with label (p-1 wrapper = 26px + gap-2 = 8px) */}
        <span className="text-[14px] font-normal text-text-sub leading-normal pl-8.5">
          {description}
        </span>
      </div>
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface RegisterStep1Props {
  onContinue?: (data: { role: Role; email: string; password: string }) => void;
}

export function RegisterStep1({ onContinue }: RegisterStep1Props) {
  const [role, setRole]                 = useState<Role | null>(null);
  const [email, setEmail]               = useState("");
  const [password, setPassword]         = useState("");
  const [emailFocused, setEmailFocused] = useState(false);
  const [pwFocused, setPwFocused]       = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [attempted, setAttempted]       = useState(false);
  const [submitting, setSubmitting]     = useState(false);
  const [apiError, setApiError]         = useState("");

  // Derived state
  const conditionResults = PASSWORD_CONDITIONS.map((c) => c.test(password));
  const allConditionsMet = conditionResults.every(Boolean);
  const emailValid       = isValidEmail(email);
  const canContinue      = role !== null && emailValid && allConditionsMet;
  const roleError        = attempted && role === null;

  // Change 6: conditions collapse once all are met
  const showConditions = (pwFocused || password.length > 0) && !allConditionsMet;

  // Right-side icon for password field
  const showPwSuccess = allConditionsMet && !pwFocused;
  const showEyeToggle = !showPwSuccess && (pwFocused || password.length > 0);

  // Change 5: focused border → text-main (black), not brand
  function emailBorderClass() {
    if (attempted && (!email || !emailValid)) return "border-error";
    if (emailValid) return "border-success";
    if (emailFocused) return "border-text-main";
    return "border-elements";
  }

  function pwBorderClass() {
    if (attempted && !password) return "border-error";
    if (allConditionsMet) return "border-success";
    if (pwFocused) return "border-text-main";
    return "border-elements";
  }

  async function handleContinue() {
    if (!canContinue) {
      setAttempted(true);
      return;
    }
    setSubmitting(true);
    setApiError("");
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role }),
      });
      const json = await res.json();
      if (!res.ok) {
        setApiError(json.error ?? "Something went wrong. Please try again.");
        return;
      }
      onContinue?.({ role: role!, email, password });
    } catch {
      setApiError("Network error. Please check your connection.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6 py-16">
      <div className="flex flex-col gap-4 w-full max-w-lg">

        {/* ── Logo ────────────────────────────────────────────────────── */}
        <div className="flex justify-center mb-1 animate-fadeInDown" style={{ animationDelay: "0ms" }}>
          <img src="/logo.png" alt="SwiftCare" className="w-12 h-12 object-contain" />
        </div>

        {/* ── Title + role cards ──────────────────────────────────────── */}
        <div className="flex flex-col gap-6.5 items-center w-full animate-fadeInDown" style={{ animationDelay: "60ms" }}>
          <h1 className="text-[24px] font-medium text-text-main tracking-[-0.264px] leading-normal text-center w-full">
            Let&apos;s get you set up on SwiftCare
          </h1>

          <div className="flex gap-4 items-stretch w-full pb-2">
            <RoleCard
              label="Patient"
              description="I'm looking to consult with a doctor online."
              selected={role === "patient"}
              error={roleError}
              onClick={() => setRole("patient")}
              paddingClass="px-[15px] py-[14px]"
            />
            <RoleCard
              label="Doctor"
              description="I'm here to manage my patients and consultations."
              selected={role === "doctor"}
              error={roleError}
              onClick={() => setRole("doctor")}
              paddingClass="p-[14px]"
            />
          </div>
        </div>

        {/* ── Divider ─────────────────────────────────────────────────── */}
        <div className="h-px bg-elements/50 w-full animate-fadeInDown" style={{ animationDelay: "120ms" }} />

        {/* ── Error banner ────────────────────────────────────────────── */}
        {apiError && (
          <div className="flex items-start gap-3 px-4 py-3 rounded-lg bg-error/8 border border-error/20 animate-fadeInDown w-full" style={{ animationDuration: "200ms" }}>
            <AlertCircle size={16} strokeWidth={1.75} className="text-error shrink-0 mt-0.5" />
            <p className="text-[14px] text-error leading-snug">{apiError}</p>
          </div>
        )}

        {/* ── Email ───────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-1.5 w-full animate-fadeInDown" style={{ animationDelay: "180ms" }}>
          <label
            htmlFor="email"
            className="text-[14px] font-medium text-text-main tracking-[-0.176px] leading-normal"
          >
            Email
          </label>
          <div className="relative">
            <input
              id="email"
              type="email"
              value={email}
              autoComplete="email"
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => setEmailFocused(true)}
              onBlur={() => setEmailFocused(false)}
              className={`
                w-full h-10 rounded-lg border px-4
                text-[14px] text-text-main bg-white outline-none
                transition-colors duration-200 placeholder:text-text-sub
                ${emailValid ? "pr-10" : "pr-4"}
                ${emailBorderClass()}
              `}
            />
            {emailValid && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 animate-fadeInDown" style={{ animationDuration: "200ms" }}>
                <FieldSuccessIcon />
              </div>
            )}
          </div>
          {attempted && !email && (
            <p className="text-[14px] text-error leading-normal animate-fadeInDown" style={{ animationDuration: "200ms" }}>
              Please enter your email
            </p>
          )}
          {attempted && email && !emailValid && (
            <p className="text-[14px] text-error leading-normal animate-fadeInDown" style={{ animationDuration: "200ms" }}>
              Please enter a valid email address
            </p>
          )}
        </div>

        {/* ── Password ────────────────────────────────────────────────── */}
        <div className="flex flex-col w-full animate-fadeInDown" style={{ animationDelay: "240ms" }}>
          <div className="flex flex-col gap-1.5 w-full">
            <label
              htmlFor="password"
              className="text-[14px] font-medium text-text-main tracking-[-0.176px] leading-normal"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                autoComplete="new-password"
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setPwFocused(true)}
                onBlur={() => setPwFocused(false)}
                className={`
                  w-full h-10 rounded-lg border px-4 pr-10
                  text-[14px] text-text-main bg-white outline-none
                  transition-colors duration-200 placeholder:text-text-sub
                  ${pwBorderClass()}
                `}
              />

              {/* Change 4: bare check, no circle */}
              {showPwSuccess && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 animate-fadeInDown" style={{ animationDuration: "200ms" }}>
                  <FieldSuccessIcon />
                </div>
              )}

              {showEyeToggle && (
                <button
                  type="button"
                  tabIndex={-1}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-sub hover:text-text-main transition-colors duration-150"
                >
                  {showPassword
                    ? <Eye size={18} strokeWidth={1.75} />
                    : <EyeOff size={18} strokeWidth={1.75} />
                  }
                </button>
              )}
            </div>
          </div>

          {attempted && !password && (
            <p className="text-[14px] text-error leading-normal animate-fadeInDown mt-1.5" style={{ animationDuration: "200ms" }}>
              Please enter a password
            </p>
          )}

          {/* Change 6: conditions collapse when all met */}
          <div
            className={`
              overflow-hidden transition-all duration-500 ease-in-out
              ${showConditions ? "max-h-40 opacity-100" : "max-h-0 opacity-0"}
            `}
          >
            <div className="flex flex-col gap-1 px-2 pt-3">
              {PASSWORD_CONDITIONS.map((condition, i) => (
                <div key={condition.label} className="flex gap-2 items-center">
                  <div
                    className={`
                      w-[14px] h-[14px] rounded-full border shrink-0
                      flex items-center justify-center
                      transition-all duration-300
                      ${conditionResults[i] ? "border-success bg-success" : "border-elements"}
                    `}
                  >
                    {conditionResults[i] && (
                      <Check size={8} className="text-white" strokeWidth={1.75} />
                    )}
                  </div>
                  {/* Change 2: condition text → 12px */}
                  <span
                    className={`
                      text-[14px] leading-[1.2] transition-colors duration-300 whitespace-nowrap
                      ${conditionResults[i] ? "text-success" : "text-text-sub"}
                    `}
                  >
                    {condition.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Continue + footer ────────────────────────────────────────── */}
        <div className="flex flex-col gap-[14px] items-center w-full mt-4 animate-fadeInDown" style={{ animationDelay: "300ms" }}>
          <button
            type="button"
            onClick={handleContinue}
            disabled={submitting}
            className={`
              w-full h-10 rounded-lg
              text-[14px] font-medium tracking-[-0.176px] text-brand-sub
              transition-all duration-200
              ${canContinue && !submitting
                ? "bg-text-main hover:opacity-90 cursor-pointer"
                : "bg-text-main/40 cursor-not-allowed"
              }
            `}
          >
            {submitting ? "Sending code…" : "Continue"}
          </button>

          <p className="text-[14px] text-text-sub text-center tracking-[-0.132px] leading-normal w-full">
            We&apos;ll send a verification code to confirm your email.
          </p>


          <p className="text-[14px] text-center tracking-[-0.132px] leading-normal w-full">
            <span className="text-text-sub">Already have an account?</span>
            {" "}
            {/* Change 7: Log in → font-bold */}
            <Link href="/login" className="font-medium text-brand hover:underline">
              Log in
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}
