"use client";

import { useState, useEffect } from "react";
import { Check } from "lucide-react";
import type { ProfileData } from "./ProfileFlow";

// --- Types --------------------------------------------------------------------

type WeightUnit = "kg" | "lbs";
type HeightUnit = "cm" | "ft";

interface Props {
  data: ProfileData;
  onChange: (patch: Partial<ProfileData>) => void;
  onContinue: () => void;
  onBack: () => void;
  triggerValidation: number;
}

// --- Validation (always compared against metric internally) -------------------

const WEIGHT_MIN_KG = 20;
const WEIGHT_MAX_KG = 300;
const HEIGHT_MIN_CM = 100;
const HEIGHT_MAX_CM = 250;

function isValidWeight(kg: string) {
  const n = parseFloat(kg);
  return !isNaN(n) && n >= WEIGHT_MIN_KG && n <= WEIGHT_MAX_KG;
}

function isValidHeight(cm: string) {
  const n = parseFloat(cm);
  return !isNaN(n) && n >= HEIGHT_MIN_CM && n <= HEIGHT_MAX_CM;
}

// --- Unit conversion ----------------------------------------------------------

function kgToLbs(kg: number) { return +(kg  * 2.20462).toFixed(1); }
function lbsToKg(lbs: number) { return +(lbs / 2.20462).toFixed(1); }

function cmToFtIn(cm: number) {
  const totalIn = cm / 2.54;
  const ft      = Math.floor(totalIn / 12);
  const inches  = Math.round(totalIn % 12);
  return inches === 12 ? { ft: ft + 1, inches: 0 } : { ft, inches };
}

function ftInToCm(ft: number, inches: number) {
  return +((ft * 30.48) + (inches * 2.54)).toFixed(1);
}

// --- Component ----------------------------------------------------------------

export function Step2BodyMetrics({ data, onChange, onContinue, onBack, triggerValidation }: Props) {
  const [weightUnit, setWeightUnit] = useState<WeightUnit>("kg");
  const [heightUnit, setHeightUnit] = useState<HeightUnit>("cm");

  // Local display state — stored internally as kg / cm
  const [weightInput,   setWeightInput]   = useState(() => data.weight || "");
  const [heightCmInput, setHeightCmInput] = useState(() => data.height || "");
  const [heightFtInput, setHeightFtInput] = useState("");
  const [heightInInput, setHeightInInput] = useState("");

  const [weightFocused, setWeightFocused] = useState(false);
  const [heightFocused, setHeightFocused] = useState(false);
  const [weightTouched, setWeightTouched] = useState(false);
  const [heightTouched, setHeightTouched] = useState(false);

  useEffect(() => {
    if (triggerValidation > 0) {
      setWeightTouched(true);
      setHeightTouched(true);
    }
  }, [triggerValidation]);

  // -- Weight -------------------------------------------------------------------

  function handleWeightChange(val: string) {
    setWeightInput(val);
    const num = parseFloat(val);
    if (!isNaN(num) && val !== "") {
      onChange({ weight: String(weightUnit === "kg" ? num : lbsToKg(num)) });
    } else {
      onChange({ weight: "" });
    }
  }

  function switchWeightUnit(unit: WeightUnit) {
    if (unit === weightUnit) return;
    const num = parseFloat(weightInput);
    if (!isNaN(num)) {
      setWeightInput(String(unit === "lbs" ? kgToLbs(num) : lbsToKg(num)));
    }
    setWeightUnit(unit);
  }

  // -- Height -------------------------------------------------------------------

  function handleHeightCmChange(val: string) {
    setHeightCmInput(val);
    onChange({ height: val });
  }

  function handleFtInChange(ft: string, inches: string) {
    const f = parseInt(ft)     || 0;
    const i = parseInt(inches) || 0;
    onChange({ height: (f > 0 || i > 0) ? String(ftInToCm(f, i)) : "" });
  }

  function switchHeightUnit(unit: HeightUnit) {
    if (unit === heightUnit) return;
    if (unit === "ft" && data.height) {
      const { ft, inches } = cmToFtIn(parseFloat(data.height));
      setHeightFtInput(ft > 0 ? String(ft) : "");
      setHeightInInput(inches > 0 ? String(inches) : "");
    } else if (unit === "cm" && data.height) {
      setHeightCmInput(data.height);
    }
    setHeightUnit(unit);
  }

  // -- Error messages -----------------------------------------------------------

  const weightError = weightTouched && !weightFocused && !isValidWeight(data.weight);
  const heightError = heightTouched && !heightFocused && !isValidHeight(data.height);

  // -- Border classes -----------------------------------------------------------

  function weightBorderClass() {
    if (weightError)                               return "border-error";
    if (data.weight && isValidWeight(data.weight)) return "border-success";
    if (weightFocused)                             return "border-text-main";
    return "border-elements";
  }

  function heightBorderClass() {
    if (heightError)                               return "border-error";
    if (data.height && isValidHeight(data.height)) return "border-success";
    if (heightFocused)                             return "border-text-main";
    return "border-elements";
  }

  const canContinue = isValidWeight(data.weight) && isValidHeight(data.height);

  const blockInvalidKeys = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (["e", "E", "+", "-"].includes(e.key)) e.preventDefault();
  };

  const inputBase = "w-full h-full px-4 text-[14px] text-text-main bg-white outline-none placeholder:text-text-sub [appearance:textfield] [&::-webkit-outer-spin-button]:hidden [&::-webkit-inner-spin-button]:hidden";

  return (
    <div className="flex flex-col gap-4">

      {/* -- Heading --------------------------------------------------- */}
      <div
        className="flex flex-col gap-0.5 animate-fadeInDown"
        style={{ animationDelay: "0ms" }}
      >
        <h1 className="text-[24px] font-medium text-text-main leading-normal">
          A few health details
        </h1>
        <p className="text-[14px] text-text-sub leading-normal">
          Your doctor may reference these during consultations. You can always change these later.
        </p>
      </div>

      {/* -- Weight ---------------------------------------------------- */}
      <div
        className="flex flex-col gap-1.5 mt-3 animate-fadeInDown"
        style={{ animationDelay: "60ms" }}
      >
        <div className="flex items-center justify-between">
          <label className="text-[14px] font-medium text-text-main">Weight</label>
          <div className="relative flex bg-background-sub rounded-lg p-0.75">
            <div
              className={`absolute top-0.75 bottom-0.75 left-0.75 w-[calc(50%-3px)] bg-white rounded-md shadow-[0_1px_3px_rgba(0,0,0,0.12)] pointer-events-none transition-transform duration-200 ease-out ${
                weightUnit === "lbs" ? "translate-x-full" : "translate-x-0"
              }`}
            />
            {(["kg", "lbs"] as WeightUnit[]).map((u) => (
              <button
                key={u}
                type="button"
                onClick={() => switchWeightUnit(u)}
                className={`relative z-10 flex-1 text-center px-2.5 py-1 text-[14px] transition-colors duration-200 ${
                  weightUnit === u ? "text-text-main" : "text-text-sub hover:text-text-main"
                }`}
              >
                {u}
              </button>
            ))}
          </div>
        </div>

        <div className={`relative h-10 rounded-lg border overflow-hidden transition-colors duration-200 ${weightBorderClass()}`}>
          <input
            type="number"
            value={weightInput}
            onChange={(e) => handleWeightChange(e.target.value)}
            onKeyDown={blockInvalidKeys}
            onFocus={() => setWeightFocused(true)}
            onBlur={() => { setWeightFocused(false); setWeightTouched(true); }}
            placeholder="0"
            min={0}
            className={`${inputBase} ${isValidWeight(data.weight) ? "pr-10" : ""}`}
          />
          {isValidWeight(data.weight) && (
            <Check size={14} strokeWidth={1.75} className="absolute right-3 top-1/2 -translate-y-1/2 text-success pointer-events-none" />
          )}
        </div>

        {weightError && (
          <p className="text-[14px] text-error leading-normal animate-fadeInDown" style={{ animationDuration: "200ms" }}>
            {data.weight === "" ? "Please enter your weight" : "Please enter a valid weight"}
          </p>
        )}
      </div>

      {/* -- Height ---------------------------------------------------- */}
      <div
        className="flex flex-col gap-1.5 animate-fadeInDown"
        style={{ animationDelay: "120ms" }}
      >
        <div className="flex items-center justify-between">
          <label className="text-[14px] font-medium text-text-main">Height</label>
          <div className="relative flex bg-background-sub rounded-lg p-0.75">
            <div
              className={`absolute top-0.75 bottom-0.75 left-0.75 w-[calc(50%-3px)] bg-white rounded-md shadow-[0_1px_3px_rgba(0,0,0,0.12)] pointer-events-none transition-transform duration-200 ease-out ${
                heightUnit === "ft" ? "translate-x-full" : "translate-x-0"
              }`}
            />
            {(["cm", "ft"] as HeightUnit[]).map((u) => (
              <button
                key={u}
                type="button"
                onClick={() => switchHeightUnit(u)}
                className={`relative z-10 flex-1 text-center px-2.5 py-1 text-[14px] transition-colors duration-200 ${
                  heightUnit === u ? "text-text-main" : "text-text-sub hover:text-text-main"
                }`}
              >
                {u}
              </button>
            ))}
          </div>
        </div>

        <div key={heightUnit} className="animate-switchIn">
          {heightUnit === "cm" ? (
            <div className={`relative h-10 rounded-lg border overflow-hidden transition-colors duration-200 ${heightBorderClass()}`}>
              <input
                type="number"
                value={heightCmInput}
                onChange={(e) => handleHeightCmChange(e.target.value)}
                onKeyDown={blockInvalidKeys}
                onFocus={() => setHeightFocused(true)}
                onBlur={() => { setHeightFocused(false); setHeightTouched(true); }}
                placeholder="0"
                min={0}
                className={`${inputBase} ${isValidHeight(data.height) ? "pr-10" : ""}`}
              />
              {isValidHeight(data.height) && (
                <Check size={14} strokeWidth={1.75} className="absolute right-3 top-1/2 -translate-y-1/2 text-success pointer-events-none" />
              )}
            </div>
          ) : (
            <div className="flex gap-2">
              <div className={`relative flex-1 h-10 rounded-lg border overflow-hidden transition-colors duration-200 ${heightBorderClass()}`}>
                <input
                  type="number"
                  value={heightFtInput}
                  onChange={(e) => { setHeightFtInput(e.target.value); handleFtInChange(e.target.value, heightInInput); }}
                  onKeyDown={blockInvalidKeys}
                  onFocus={() => setHeightFocused(true)}
                  onBlur={() => { setHeightFocused(false); setHeightTouched(true); }}
                  placeholder="0"
                  min={0}
                  className={`${inputBase} pr-10`}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[14px] text-text-sub select-none pointer-events-none">ft</span>
              </div>
              <div className={`relative flex-1 h-10 rounded-lg border overflow-hidden transition-colors duration-200 ${heightBorderClass()}`}>
                <input
                  type="number"
                  value={heightInInput}
                  onChange={(e) => { setHeightInInput(e.target.value); handleFtInChange(heightFtInput, e.target.value); }}
                  onKeyDown={blockInvalidKeys}
                  onFocus={() => setHeightFocused(true)}
                  onBlur={() => { setHeightFocused(false); setHeightTouched(true); }}
                  placeholder="0"
                  min={0}
                  max={11}
                  className={`${inputBase} pr-10`}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[14px] text-text-sub select-none pointer-events-none">in</span>
              </div>
            </div>
          )}
        </div>

        {heightError && (
          <p className="text-[14px] text-error leading-normal animate-fadeInDown" style={{ animationDuration: "200ms" }}>
            {data.height === "" ? "Please enter your height" : "Please enter a valid height"}
          </p>
        )}
      </div>

      {/* -- Buttons --------------------------------------------------- */}
      <div
        className="flex gap-3 mt-4 animate-fadeInDown"
        style={{ animationDelay: "180ms" }}
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
          disabled={!canContinue}
          className={`
            flex-3 h-10 rounded-lg
            text-[14px] font-medium text-brand-sub
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
