"use client";

import { useState, useEffect, useRef } from "react";
import { Check, ChevronDown, X } from "lucide-react";
import type { DoctorProfileData } from "./DoctorProfileFlow";

interface Props {
  data: DoctorProfileData;
  onChange: (patch: Partial<DoctorProfileData>) => void;
  onContinue: () => void;
  onBack: () => void;
  triggerValidation: number;
}

const SPECIALIZATIONS = [
  "General Practice", "Internal Medicine", "Cardiology", "Dermatology",
  "Obstetrics & Gynecology", "Pediatrics", "Neurology", "Orthopedic Surgery",
  "Psychiatry", "Ophthalmology", "ENT (Ear, Nose & Throat)", "Pulmonology",
  "Endocrinology", "Gastroenterology", "Nephrology", "Oncology", "Urology",
  "Rheumatology", "Infectious Disease", "Emergency Medicine", "Family Medicine",
  "Geriatrics", "Rehabilitation Medicine", "Pathology", "Radiology", "Anesthesiology",
];

const LANGUAGES = [
  "English", "Filipino (Tagalog)", "Cebuano (Bisaya)", "Ilocano",
  "Hiligaynon (Ilonggo)", "Waray", "Bikol", "Kapampangan", "Maranao", "Chavacano",
];

const BIO_MAX = 300;

export function DoctorStep2ProfessionalDetails({ data, onChange, onContinue, onBack, triggerValidation }: Props) {
  const [specOpen,     setSpecOpen]     = useState(false);
  const [specSearch,   setSpecSearch]   = useState("");
  const [specTouched,  setSpecTouched]  = useState(false);
  const [prcTouched,   setPrcTouched]   = useState(false);
  const [prcFocused,   setPrcFocused]   = useState(false);
  const [yearsTouched, setYearsTouched] = useState(false);
  const [yearsFocused, setYearsFocused] = useState(false);
  const [langOpen,     setLangOpen]     = useState(false);
  const [langSearch,   setLangSearch]   = useState("");

  const specRef = useRef<HTMLDivElement>(null);
  const langRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (triggerValidation > 0) {
      setSpecTouched(true);
      setPrcTouched(true);
      if (data.yearsOfExperience !== "") setYearsTouched(true);
    }
  }, [triggerValidation, data.yearsOfExperience]);

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (specRef.current && !specRef.current.contains(e.target as Node)) {
        setSpecOpen(false);
        setSpecSearch("");
      }
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false);
        setLangSearch("");
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const filteredSpecs = SPECIALIZATIONS.filter((s) =>
    s.toLowerCase().includes(specSearch.toLowerCase())
  );

  const filteredLangs = LANGUAGES.filter((l) =>
    l.toLowerCase().includes(langSearch.toLowerCase())
  );

  const specValid = data.specializations.length > 0;
  const prcValid  = /^\d{7}$/.test(data.prcLicense);
  const specError = specTouched && !specValid;
  const prcError  = prcTouched && !prcFocused && !prcValid;

  function prcErrorMessage(): string {
    return "Please enter a valid 7-digit PRC license number";
  }

  function handlePrcChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 7);
    onChange({ prcLicense: digits });
  }

  function toggleSpecialization(spec: string) {
    const has = data.specializations.includes(spec);
    onChange({
      specializations: has
        ? data.specializations.filter((s) => s !== spec)
        : [...data.specializations, spec],
    });
    setSpecTouched(true);
  }

  function specTriggerLabel(): string {
    if (data.specializations.length === 0) return "";
    if (data.specializations.length === 1) return data.specializations[0];
    return `${data.specializations.length} specializations selected`;
  }

  // ── Years of experience validation ────────────────────────────────────────

  function getDoctorAge(): number | null {
    if (!data.birthday) return null;
    const today = new Date();
    const birth = new Date(data.birthday + "T00:00:00");
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  }

  const yearsEntered = data.yearsOfExperience !== "";
  const yearsNum     = parseInt(data.yearsOfExperience, 10);
  const doctorAge    = getDoctorAge();
  const maxYears     = doctorAge !== null ? Math.max(1, doctorAge - 18) : 60;

  const yearsValid = !yearsEntered || (!isNaN(yearsNum) && yearsNum >= 0 && yearsNum <= maxYears);
  const yearsError = yearsTouched && !yearsFocused && yearsEntered && !yearsValid;

  function yearsErrorMessage(): string {
    return "That seems a bit high. Double-check your years of experience.";
  }

  function toggleLanguage(lang: string) {
    const has = data.languages.includes(lang);
    onChange({ languages: has ? data.languages.filter((l) => l !== lang) : [...data.languages, lang] });
  }

  function langTriggerLabel(): string {
    if (data.languages.length === 0) return "";
    if (data.languages.length === 1) return data.languages[0];
    return `${data.languages.length} languages selected`;
  }

  const canContinue = specValid && prcValid && yearsValid;

  const inputBase = "w-full h-10 rounded-lg border px-4 text-[14px] text-text-main bg-white outline-none transition-colors duration-200 placeholder:text-text-sub";

  return (
    <div className="flex flex-col gap-4">

      {/* ── Heading ─────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-0.5 animate-fadeInDown" style={{ animationDelay: "0ms" }}>
        <h1 className="text-[24px] font-medium text-text-main tracking-[-0.264px] leading-normal">
          Tell us about your practice
        </h1>
        <p className="text-[14px] text-text-sub leading-normal">
          Help patients find the right doctor for their needs.
        </p>
      </div>

      {/* ── Specialization ──────────────────────────────────────────── */}
      <div className="flex flex-col gap-1.5 mt-3 animate-fadeInDown z-20" style={{ animationDelay: "60ms" }} ref={specRef}>
        <label className="text-[14px] font-medium text-text-main">Specialization</label>
        <div className="relative">
          <button
            type="button"
            onClick={() => { setSpecOpen((v) => !v); setSpecSearch(""); setLangOpen(false); }}
            onBlur={() => setSpecTouched(true)}
            className={`w-full h-10 rounded-lg border px-4 pr-10 text-[14px] text-left transition-colors duration-200 flex items-center ${specError ? "border-error" : specValid ? "border-success" : specOpen ? "border-text-main" : "border-elements"} bg-white`}
          >
            {data.specializations.length === 0 ? (
              <span className="text-text-sub">Select specializations</span>
            ) : (
              <span className="text-text-sub truncate">{specTriggerLabel()}</span>
            )}
          </button>
          <ChevronDown
            size={14} strokeWidth={1.75}
            className={`absolute right-3 top-1/2 -translate-y-1/2 text-text-sub pointer-events-none transition-transform duration-200 ${specOpen ? "rotate-180" : ""}`}
          />

          {specOpen && (
            <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-elements rounded-lg shadow-md overflow-hidden animate-fadeInDown" style={{ animationDuration: "150ms" }}>
              <div className="p-2 border-b border-elements">
                <input
                  type="text"
                  value={specSearch}
                  onChange={(e) => setSpecSearch(e.target.value)}
                  placeholder="Search..."
                  autoFocus
                  className="w-full h-8 px-3 text-[14px] text-text-main bg-transparent outline-none placeholder:text-text-sub"
                />
              </div>
              <div className="max-h-52 overflow-y-auto">
                {filteredSpecs.length === 0 ? (
                  <p className="px-4 py-3 text-[14px] text-text-sub">No results</p>
                ) : filteredSpecs.map((s) => {
                  const checked = data.specializations.includes(s);
                  return (
                    <button
                      key={s}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => toggleSpecialization(s)}
                      className={`w-full text-left px-4 py-2.5 text-[14px] transition-colors duration-150 flex items-center justify-between ${checked ? "text-brand font-medium bg-brand/5" : "text-text-main hover:bg-background-sub"}`}
                    >
                      {s}
                      {checked && <Check size={14} strokeWidth={1.75} className="text-brand shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Selected specialization chips */}
        {data.specializations.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {data.specializations.map((s) => (
              <span
                key={s}
                className="inline-flex items-center gap-1 h-6 px-2.5 rounded-md bg-background-sub border border-elements text-[13px] text-text-main"
              >
                {s}
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => toggleSpecialization(s)}
                  className="text-text-sub hover:text-text-main transition-colors duration-150"
                >
                  <X size={11} strokeWidth={1.75} />
                </button>
              </span>
            ))}
          </div>
        )}

        {specError && (
          <p className="text-[14px] text-error leading-normal animate-fadeInDown" style={{ animationDuration: "200ms" }}>
            Please select at least one specialization
          </p>
        )}
      </div>

      {/* ── PRC License ─────────────────────────────────────────────── */}
      <div className="flex flex-col gap-1.5 animate-fadeInDown" style={{ animationDelay: "120ms" }}>
        <label className="text-[14px] font-medium text-text-main">PRC License Number</label>
        <div className="relative">
          <input
            type="text"
            inputMode="numeric"
            value={data.prcLicense}
            onChange={handlePrcChange}
            onFocus={() => setPrcFocused(true)}
            onBlur={() => { setPrcFocused(false); setPrcTouched(true); }}
            placeholder="e.g. 0123456"
            maxLength={7}
            className={`${inputBase} ${prcValid ? "pr-10" : ""} focus:border-text-main ${prcError ? "border-error" : prcValid ? "border-success" : "border-elements"}`}
          />
          {prcValid && (
            <Check size={14} strokeWidth={1.75} className="absolute right-3 top-1/2 -translate-y-1/2 text-success pointer-events-none" />
          )}
        </div>
        {prcError && (
          <p className="text-[14px] text-error leading-normal animate-fadeInDown" style={{ animationDuration: "200ms" }}>
            {prcErrorMessage()}
          </p>
        )}
      </div>

      {/* ── Years of Experience ─────────────────────────────────────── */}
      <div className="flex flex-col gap-1.5 animate-fadeInDown" style={{ animationDelay: "180ms" }}>
        <label className="text-[14px] font-medium text-text-main">Years of experience</label>
        <input
          type="number"
          value={data.yearsOfExperience}
          onChange={(e) => onChange({ yearsOfExperience: e.target.value })}
          onKeyDown={(e) => ["e", "E", "+", "-", "."].includes(e.key) && e.preventDefault()}
          onFocus={() => setYearsFocused(true)}
          onBlur={() => { setYearsFocused(false); if (data.yearsOfExperience !== "") setYearsTouched(true); }}
          placeholder="e.g. 5"
          min={1}
          max={maxYears}
          className={`${inputBase} focus:border-text-main [appearance:textfield] [&::-webkit-outer-spin-button]:hidden [&::-webkit-inner-spin-button]:hidden ${yearsError ? "border-error" : yearsEntered && yearsValid ? "border-success" : "border-elements"}`}
        />
        {yearsError && (
          <p className="text-[14px] text-error leading-normal animate-fadeInDown" style={{ animationDuration: "200ms" }}>
            {yearsErrorMessage()}
          </p>
        )}
      </div>

      {/* ── Languages ───────────────────────────────────────────────── */}
      <div className="flex flex-col gap-1.5 animate-fadeInDown z-10" style={{ animationDelay: "240ms" }} ref={langRef}>
        <label className="text-[14px] font-medium text-text-main">Languages spoken</label>
        <div className="relative">
          <button
            type="button"
            onClick={() => { setLangOpen((v) => !v); setLangSearch(""); setSpecOpen(false); }}
            className={`w-full h-10 rounded-lg border px-4 pr-10 text-[14px] text-left transition-colors duration-200 flex items-center ${langOpen ? "border-text-main" : "border-elements"} bg-white`}
          >
            {data.languages.length === 0 ? (
              <span className="text-text-sub">Select languages</span>
            ) : (
              <span className="text-text-sub truncate">{langTriggerLabel()}</span>
            )}
          </button>
          <ChevronDown
            size={14} strokeWidth={1.75}
            className={`absolute right-3 top-1/2 -translate-y-1/2 text-text-sub pointer-events-none transition-transform duration-200 ${langOpen ? "rotate-180" : ""}`}
          />

          {langOpen && (
            <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-elements rounded-lg shadow-md overflow-hidden animate-fadeInDown" style={{ animationDuration: "150ms" }}>
              <div className="p-2 border-b border-elements">
                <input
                  type="text"
                  value={langSearch}
                  onChange={(e) => setLangSearch(e.target.value)}
                  placeholder="Search..."
                  autoFocus
                  className="w-full h-8 px-3 text-[14px] text-text-main bg-transparent outline-none placeholder:text-text-sub"
                />
              </div>
              <div className="max-h-52 overflow-y-auto">
                {filteredLangs.length === 0 ? (
                  <p className="px-4 py-3 text-[14px] text-text-sub">No results</p>
                ) : filteredLangs.map((lang) => {
                  const checked = data.languages.includes(lang);
                  return (
                    <button
                      key={lang}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => toggleLanguage(lang)}
                      className={`w-full text-left px-4 py-2.5 text-[14px] transition-colors duration-150 flex items-center justify-between ${checked ? "text-brand font-medium bg-brand/5" : "text-text-main hover:bg-background-sub"}`}
                    >
                      {lang}
                      {checked && <Check size={14} strokeWidth={1.75} className="text-brand shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Selected language chips */}
        {data.languages.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {data.languages.map((lang) => (
              <span
                key={lang}
                className="inline-flex items-center gap-1 h-6 px-2.5 rounded-md bg-background-sub border border-elements text-[13px] text-text-main"
              >
                {lang}
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => toggleLanguage(lang)}
                  className="text-text-sub hover:text-text-main transition-colors duration-150"
                >
                  <X size={11} strokeWidth={1.75} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── Bio ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-1.5 animate-fadeInDown" style={{ animationDelay: "300ms" }}>
        <div className="flex flex-col gap-0.5">
          <label className="text-[14px] font-medium text-text-main">Bio</label>
          <p className="text-[14px] text-text-sub leading-normal">You can always update this later.</p>
        </div>
        <textarea
          value={data.bio}
          onChange={(e) => onChange({ bio: e.target.value.slice(0, BIO_MAX) })}
          placeholder="Tell patients about your background, expertise, and approach to care..."
          rows={4}
          className={`w-full rounded-lg border px-4 py-2.5 text-[14px] text-text-main bg-white outline-none transition-colors duration-200 placeholder:text-text-sub focus:border-text-main resize-none leading-relaxed ${data.bio.length > 0 ? "border-success" : "border-elements"}`}
        />
        <p className={`text-[13px] text-right leading-normal ${data.bio.length >= BIO_MAX ? "text-error" : "text-text-sub"}`}>
          {data.bio.length}/{BIO_MAX}
        </p>
      </div>

      {/* ── Buttons ─────────────────────────────────────────────────── */}
      <div className="flex gap-3 mt-4 animate-fadeInDown" style={{ animationDelay: "360ms" }}>
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
          disabled={!canContinue}
          className={`flex-3 h-10 rounded-lg text-[14px] font-medium tracking-[-0.176px] text-brand-sub transition-all duration-200 ${canContinue ? "bg-text-main hover:opacity-90 cursor-pointer" : "bg-text-main/40 cursor-not-allowed"}`}
        >
          Continue
        </button>
      </div>

    </div>
  );
}
