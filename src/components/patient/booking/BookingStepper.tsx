import { Fragment } from "react";
import { Calendar, ClipboardList, CheckCircle, Check, ChevronRight } from "lucide-react";

interface BookingStepperProps {
  current: number;
}

const STEPS = [
  { label: "Schedule",  Icon: Calendar       },
  { label: "Review",    Icon: ClipboardList  },
  { label: "Confirmed", Icon: CheckCircle    },
] as const;

export function BookingStepper({ current }: BookingStepperProps) {
  return (
    <div className="flex items-center justify-center w-full">
      {STEPS.map((step, i) => {
        const num         = i + 1;
        const isCurrent   = num === current;
        const isCompleted = num < current;

        return (
          <Fragment key={num}>
            <div
              className={`
                flex items-center gap-1.5 shrink-0
                text-[14px] font-medium leading-normal whitespace-nowrap
                transition-colors duration-200
                ${isCurrent   ? "text-text-main" : ""}
                ${isCompleted ? "text-success"   : ""}
                ${!isCurrent && !isCompleted ? "text-text-sub opacity-40" : ""}
              `}
            >
              {isCompleted ? (
                <Check size={14} className="text-success shrink-0" strokeWidth={1.75} />
              ) : (
                <step.Icon
                  size={14}
                  className={`shrink-0 ${isCurrent ? "text-text-main" : "text-text-sub"}`}
                  strokeWidth={1.75}
                />
              )}
              {step.label}
            </div>
            {i < STEPS.length - 1 && (
              <ChevronRight size={14} className="text-text-sub shrink-0 mx-2.5 opacity-40" />
            )}
          </Fragment>
        );
      })}
    </div>
  );
}
