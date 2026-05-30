"use client";

import { useRef, useEffect } from "react";
import { signOut } from "next-auth/react";
import { User, LogOut } from "lucide-react";

interface ProfilePopoverProps {
  name:          string;
  email:         string;
  initials:      string;
  isOpen:        boolean;
  onClose:       () => void;
  onViewProfile: () => void;
}

export function ProfilePopover({ name, email, initials, isOpen, onClose, onViewProfile }: ProfilePopoverProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    function handleMouseDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <div
      ref={ref}
      className={`
        absolute bottom-full left-3 mb-2 z-50
        w-60 rounded-lg border border-elements bg-white
        shadow-[0_4px_16px_rgba(0,0,0,0.10)]
        flex flex-col overflow-hidden
        transition-all duration-200 ease-out origin-bottom-left
        ${isOpen
          ? "opacity-100 translate-y-0 pointer-events-auto"
          : "opacity-0 translate-y-2 pointer-events-none"
        }
      `}
      aria-hidden={!isOpen}
    >
      {/* -- Identity ------------------------------------------------ */}
      <div className="flex items-center gap-3 px-4 py-3.5">
        <div className="w-9 h-9 rounded-full bg-brand-sub flex items-center justify-center text-brand text-[13px] font-medium shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[16px] font-medium text-text-main truncate leading-tight">{name}</p>
          <p className="text-[14px] text-text-sub truncate leading-tight">{email}</p>
        </div>
      </div>

      <div className="h-px bg-elements/50" />

      {/* -- Menu items ---------------------------------------------- */}
      <div className="py-1">
        <button
          type="button"
          onClick={() => { onClose(); onViewProfile(); }}
          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[16px] text-text-main hover:bg-bg-sub transition-colors duration-150"
        >
          <User size={15} strokeWidth={1.75} className="text-text-sub shrink-0" />
          View profile
        </button>
      </div>

      <div className="h-px bg-elements/50" />

      {/* -- Sign out ------------------------------------------------ */}
      <div className="py-1">
        <button
          type="button"
          onClick={() => { onClose(); signOut({ callbackUrl: "/login" }); }}
          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[16px] text-error hover:bg-bg-sub transition-colors duration-150"
        >
          <LogOut size={15} strokeWidth={1.75} className="text-error shrink-0" />
          Log out
        </button>
      </div>
    </div>
  );
}
