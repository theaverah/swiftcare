import { Fragment } from "react";
import { User, Activity, FileHeart, CheckCircle, Check, ChevronRight, AlertCircle } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProfileStepperProps {
  current: number;
  maxReached: number;
  stepValid: boolean[];
  currentValid: boolean;
  onStepClick: (step: number) => void;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const STEPS = [
  { label: "Profile",  Icon: User },
  { label: "Vitals",   Icon: Activity },
  { label: "Medical History", Icon: FileHeart },
  { label: "Overview",        Icon: CheckCircle },
] as const;

// ─── Component ────────────────────────────────────────────────────────────────

export function ProfileStepper({ current, maxReached, stepValid, currentValid, onStepClick }: ProfileStepperProps) {
  return (
    <div className="flex items-center justify-center w-full">
      {STEPS.map((step, i) => {
        const num         = i + 1;
        const isReached   = num <= maxReached;
        const isCurrent   = num === current;
        const isValid     = stepValid[num] ?? true;
        const isCompleted = isReached && !isCurrent && isValid;
        const isInvalid   = isReached && !isCurrent && !isValid;
        const isClickable = isReached && !isCurrent;

        return (
          <Fragment key={num}>
            <button
              type="button"
              onClick={() => isClickable && onStepClick(num)}
              disabled={!isClickable}
              className={`
                flex items-center gap-1.5 shrink-0
                text-[14px] font-medium leading-normal whitespace-nowrap
                transition-all duration-200
                ${isCurrent   ? "text-text-main" : ""}
                ${isCompleted ? "text-success" : ""}
                ${isInvalid   ? "text-error"   : ""}
                ${!isCurrent && !isCompleted && !isInvalid ? "text-text-sub" : ""}
                ${!isCurrent && currentValid && isCompleted ? "cursor-pointer hover:text-success/80" : ""}
                ${!isCurrent && currentValid && isInvalid   ? "cursor-pointer hover:text-error/80"   : ""}
                ${!isCurrent && !currentValid ? "opacity-40 cursor-default" : ""}
              `}
            >
              {isCompleted ? (
                <Check size={14} className="text-success shrink-0" strokeWidth={2.5} />
              ) : isInvalid ? (
                <AlertCircle size={14} className="text-error shrink-0" strokeWidth={2.5} />
              ) : (
                <step.Icon
                  size={14}
                  className={`shrink-0 ${isCurrent ? "text-text-main" : "text-text-sub"}`}
                  strokeWidth={2.5}
                />
              )}
              {step.label}
            </button>

            {i < STEPS.length - 1 && (
              <ChevronRight size={14} className="text-text-sub shrink-0 mx-2.5" />
            )}
          </Fragment>
        );
      })}
    </div>
  );
}
