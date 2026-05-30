"use client";

import { useState, useEffect } from "react";
import { Check } from "lucide-react";
import type { ProfileData } from "./ProfileFlow";

// --- Types --------------------------------------------------------------------

interface Props {
  data: ProfileData;
  onChange: (patch: Partial<ProfileData>) => void;
  onContinue: () => void;
  triggerValidation: number;
}

// --- Helpers ------------------------------------------------------------------

function toTitleCase(str: string) {
  return str.replace(/\b\w/g, (c) => c.toUpperCase());
}

function sanitizeName(str: string) {
  return str.replace(/[^a-zA-ZÀ-ÿ\s'\-]/g, "");
}

function isAtLeast13(birthday: string): boolean {
  if (!birthday) return false;
  const today = new Date();
  const birth = new Date(birthday);
  const age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  return (m < 0 || (m === 0 && today.getDate() < birth.getDate())) ? age - 1 >= 13 : age >= 13;
}

function formatPhone(digits: string): string {
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
  return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
}

function isValidPhone(n: string) {
  return n.length === 10 && n.startsWith("9");
}

// --- Component ----------------------------------------------------------------

export function Step1Basics({ data, onChange, onContinue, triggerValidation }: Props) {
  const [phoneFocused,      setPhoneFocused]      = useState(false);
  const [phoneTouched,      setPhoneTouched]      = useState(false);
  const [birthdayTouched,   setBirthdayTouched]   = useState(false);
  const [firstNameTouched,  setFirstNameTouched]  = useState(false);
  const [lastNameTouched,   setLastNameTouched]   = useState(false);

  useEffect(() => {
    if (triggerValidation > 0) {
      setPhoneTouched(true);
      setBirthdayTouched(true);
      setFirstNameTouched(true);
      setLastNameTouched(true);
    }
  }, [triggerValidation]);

  function handlePhoneChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/\D/g, "");
    const noCountry = raw.startsWith("63") ? raw.slice(2) : raw;
    const stripped  = noCountry.startsWith("0") ? noCountry.slice(1) : noCountry;
    onChange({ contactNumber: stripped.slice(0, 10) });
  }

  const phoneValid = isValidPhone(data.contactNumber);
  const phoneError = phoneTouched && !phoneFocused && !phoneValid;

  const birthdayValid = !!data.birthday && isAtLeast13(data.birthday);
  const birthdayError = birthdayTouched && !birthdayValid;

  const firstNameValid = !!data.firstName.trim();
  const lastNameValid  = !!data.lastName.trim();
  const firstNameError = firstNameTouched && !firstNameValid;
  const lastNameError  = lastNameTouched  && !lastNameValid;

  function phoneBorderClass() {
    if (phoneError)    return "border-error";
    if (phoneValid)    return "border-success";
    if (phoneFocused)  return "border-text-main";
    return "border-elements";
  }

  const canContinue = firstNameValid && lastNameValid && birthdayValid && phoneValid;

  return (
    <div className="flex flex-col gap-4">

      {/* -- Heading --------------------------------------------------- */}
      <div
        className="flex flex-col gap-0.5 animate-fadeInDown"
        style={{ animationDelay: "0ms" }}
      >
        <h1 className="text-[24px] font-medium text-text-main tracking-[-0.264px] leading-normal">
          Tell us about yourself
        </h1>
        <p className="text-[14px] text-text-sub leading-normal">
          Let your doctor know a little about you before your first consultation.
        </p>
      </div>

      {/* -- First name ------------------------------------------------ */}
      <div
        className="flex flex-col gap-1.5 mt-3 animate-fadeInDown"
        style={{ animationDelay: "60ms" }}
      >
        <label className="text-[14px] font-medium text-text-main">First name</label>
        <div className="relative">
          <input
            type="text"
            autoComplete="off"
            value={data.firstName}
            onChange={(e) => onChange({ firstName: toTitleCase(sanitizeName(e.target.value)) })}
            onBlur={() => setFirstNameTouched(true)}
            placeholder="e.g. Maria"
            className={`w-full h-10 rounded-lg border px-4 ${firstNameValid ? "pr-10" : ""} text-[14px] text-text-main bg-white outline-none transition-colors duration-200 placeholder:text-text-sub focus:border-text-main ${firstNameError ? "border-error" : firstNameValid ? "border-success" : "border-elements"}`}
          />
          {firstNameValid && firstNameTouched && (
            <Check size={14} strokeWidth={1.75} className="absolute right-3 top-1/2 -translate-y-1/2 text-success pointer-events-none" />
          )}
        </div>
        {firstNameError && (
          <p className="text-[14px] text-error leading-normal animate-fadeInDown" style={{ animationDuration: "200ms" }}>
            Please enter your first name
          </p>
        )}
      </div>

      {/* -- Last name ------------------------------------------------- */}
      <div
        className="flex flex-col gap-1.5 animate-fadeInDown"
        style={{ animationDelay: "120ms" }}
      >
        <label className="text-[14px] font-medium text-text-main">Last name</label>
        <div className="relative">
          <input
            type="text"
            autoComplete="off"
            value={data.lastName}
            onChange={(e) => onChange({ lastName: toTitleCase(sanitizeName(e.target.value)) })}
            onBlur={() => setLastNameTouched(true)}
            placeholder="e.g. Santos"
            className={`w-full h-10 rounded-lg border px-4 ${lastNameValid ? "pr-10" : ""} text-[14px] text-text-main bg-white outline-none transition-colors duration-200 placeholder:text-text-sub focus:border-text-main ${lastNameError ? "border-error" : lastNameValid ? "border-success" : "border-elements"}`}
          />
          {lastNameValid && lastNameTouched && (
            <Check size={14} strokeWidth={1.75} className="absolute right-3 top-1/2 -translate-y-1/2 text-success pointer-events-none" />
          )}
        </div>
        {lastNameError && (
          <p className="text-[14px] text-error leading-normal animate-fadeInDown" style={{ animationDuration: "200ms" }}>
            Please enter your last name
          </p>
        )}
      </div>

      {/* -- Birthday -------------------------------------------------- */}
      <div
        className="flex flex-col gap-1.5 animate-fadeInDown"
        style={{ animationDelay: "180ms" }}
      >
        <label className="text-[14px] font-medium text-text-main">Birthday</label>
        <input
          type="date"
          autoComplete="off"
          value={data.birthday}
          onChange={(e) => onChange({ birthday: e.target.value })}
          onBlur={() => setBirthdayTouched(true)}
          className={`w-full h-10 rounded-lg border px-4 text-[14px] text-text-main bg-white outline-none transition-colors duration-200 focus:border-text-main ${
            birthdayError  ? "border-error"   :
            birthdayValid  ? "border-success" :
            "border-elements"
          }`}
        />
        {birthdayError && (
          <p className="text-[14px] text-error leading-normal animate-fadeInDown" style={{ animationDuration: "200ms" }}>
            {!data.birthday ? "Please enter your birthday" : "You must be at least 13 years old to use SwiftCare"}
          </p>
        )}
      </div>

      {/* -- Contact number -------------------------------------------- */}
      <div
        className="flex flex-col gap-1.5 animate-fadeInDown"
        style={{ animationDelay: "240ms" }}
      >
        <label className="text-[14px] font-medium text-text-main">Contact number</label>
        <div
          className={`flex items-center h-10 rounded-lg border overflow-hidden transition-colors duration-200 ${phoneBorderClass()}`}
        >
          <div className="flex items-center gap-1.5 px-3 h-full border-r border-elements shrink-0">
            <span className="text-base leading-none select-none">🇵🇭</span>
            <span className="text-[14px] text-text-sub select-none">+63</span>
          </div>
          <input
            type="tel"
            value={formatPhone(data.contactNumber)}
            onChange={handlePhoneChange}
            onFocus={() => setPhoneFocused(true)}
            onBlur={() => { setPhoneFocused(false); setPhoneTouched(true); }}
            placeholder="9XX XXX XXXX"
            className={`flex-1 h-full px-3 ${phoneValid ? "pr-9" : ""} text-[14px] text-text-main bg-white outline-none placeholder:text-text-sub`}
          />
          {phoneValid && (
            <Check size={14} strokeWidth={1.75} className="text-success shrink-0 mr-3" />
          )}
        </div>
        {phoneError && (
          <p className="text-[14px] text-error leading-normal animate-fadeInDown" style={{ animationDuration: "200ms" }}>
            {data.contactNumber.length === 0 ? "Please enter your contact number" : "Enter a valid 10-digit mobile number (e.g. 917 123 4567)"}
          </p>
        )}
      </div>

      {/* -- Button ---------------------------------------------------- */}
      <div
        className="flex flex-col mt-4 animate-fadeInDown"
        style={{ animationDelay: "300ms" }}
      >
        <button
          type="button"
          onClick={onContinue}
          disabled={!canContinue}
          className={`
            w-full h-10 rounded-lg
            text-[14px] font-medium tracking-[-0.176px] text-brand-sub
            transition-all duration-200
            ${canContinue
              ? "bg-text-main hover:opacity-90 cursor-pointer"
              : "bg-text-main/40 cursor-not-allowed"
            }
          `}
        >
          Continue
        </button>
      </div>

    </div>
  );
}
