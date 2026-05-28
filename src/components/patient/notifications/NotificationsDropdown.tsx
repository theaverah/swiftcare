"use client";

import { useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarCheck,
  Clock,
  CalendarClock,
  CalendarX,
  BellOff,
} from "lucide-react";
import type { Notification, NotificationType } from "@/types/notification";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const TYPE_ICON: Record<NotificationType, React.ElementType> = {
  appointment_booked: CalendarCheck,
  upcoming_reminder:  Clock,
  rescheduled:        CalendarClock,
  cancelled:          CalendarX,
};

function relativeTime(date: Date): string {
  const diff = Date.now() - date.getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);
  if (mins  < 1)  return "Just now";
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  if (days  === 1) return "Yesterday";
  return `${days} days ago`;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface NotificationsDropdownProps {
  notifications: Notification[];
  isOpen: boolean;
  onClose: () => void;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function NotificationsDropdown({
  notifications,
  isOpen,
  onClose,
  onMarkAsRead,
  onMarkAllAsRead,
}: NotificationsDropdownProps) {
  const router     = useRef(useRouter());
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    function handleMouseDown(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [isOpen, onClose]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const hasUnread = notifications.some((n) => !n.read);

  function handleItemClick(n: Notification) {
    onMarkAsRead(n.id);
    onClose();
    router.current.push(n.href);
  }

  return (
    <div
      ref={dropdownRef}
      className={`
        absolute right-0 top-full mt-2 z-50
        w-95 rounded-lg border border-elements bg-white
        shadow-[0_4px_16px_rgba(0,0,0,0.10)]
        flex flex-col overflow-hidden
        transition-all duration-200 ease-out origin-top-right
        ${isOpen
          ? "opacity-100 translate-y-0 pointer-events-auto"
          : "opacity-0 -translate-y-2 pointer-events-none"
        }
      `}
      aria-hidden={!isOpen}
    >
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-elements shrink-0">
        <span className="text-[16px] font-medium text-text-main text-left">Notifications</span>
        {hasUnread && (
          <button
            type="button"
            onClick={onMarkAllAsRead}
            className="text-[16px] font-medium text-brand hover:underline transition-colors duration-150"
          >
            Mark all as read
          </button>
        )}
      </div>

      {/* ── List ───────────────────────────────────────────────────── */}
      <div className="overflow-y-auto" style={{ maxHeight: "420px" }}>
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-12 px-6">
            <BellOff size={28} strokeWidth={1.75} className="text-elements" />
            <p className="text-[16px] text-text-sub text-center">You&apos;re all caught up.</p>
          </div>
        ) : (
          <ul>
            {notifications.map((n, i) => {
              const Icon = TYPE_ICON[n.type];
              return (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => handleItemClick(n)}
                    className={`
                      w-full text-left flex items-start gap-3 px-5 py-3.75
                      transition-colors duration-150
                      hover:bg-bg-sub
                      ${!n.read ? "bg-brand-sub/40" : ""}
                    `}
                  >
                    {/* Type icon with unread dot */}
                    <div className="relative shrink-0 self-start">
                      <Icon size={18} strokeWidth={1.75} className="text-text-main" />
                      {!n.read && (
                        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-brand border border-white" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                      <p className="text-[16px] text-text-main leading-snug text-left">
                        {n.message}
                      </p>
                      <p className="text-[14px] text-text-sub">
                        {relativeTime(n.timestamp)}
                      </p>
                    </div>
                  </button>

                  {i < notifications.length - 1 && (
                    <div className="h-px bg-elements/50 mx-5" />
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
