import type { LucideIcon } from "lucide-react";

/**
 * Standard icon wrapper for SwiftCare.
 *
 * Defaults:  size=16, strokeWidth=1.75, color=text-text-main (black)
 * Override color via className: "text-text-sub", "text-brand", "text-error", etc.
 *
 * Usage:
 *   import { Icon } from "@/components/shared/Icon";
 *   import { Pencil, Calendar } from "lucide-react";
 *
 *   <Icon icon={Pencil} />                          // 16px black
 *   <Icon icon={Calendar} size={14} />              // 14px black
 *   <Icon icon={Bell} className="text-text-sub" />  // 16px gray
 *   <Icon icon={Bookmark} className="text-brand" /> // 16px brand
 */

interface IconProps {
  icon:       LucideIcon;
  size?:      number;
  className?: string;
}

export function Icon({ icon: LucideIcon, size = 16, className = "" }: IconProps) {
  return (
    <LucideIcon
      size={size}
      strokeWidth={1.75}
      className={className || "text-text-main"}
    />
  );
}
