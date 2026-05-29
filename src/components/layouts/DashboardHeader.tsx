"use client";

import { useState } from "react";
import { Bell } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import { NotificationsDropdown } from "@/components/patient/notifications/NotificationsDropdown";

export function DashboardHeader() {
  const [notifOpen, setNotifOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  return (
    <header className="h-16 shrink-0 flex items-center justify-end px-8 bg-transparent">
      <div className="flex items-center gap-3">

        {/* Notification bell */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setNotifOpen((v) => !v)}
            className="relative w-9 h-9 flex items-center justify-center rounded-lg text-text-main hover:bg-bg-sub transition-colors duration-200"
            aria-label="Notifications"
          >
            <Bell size={20} strokeWidth={1.75} />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-error text-white text-[10px] font-medium flex items-center justify-center leading-none">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          <NotificationsDropdown
            notifications={notifications}
            isOpen={notifOpen}
            onClose={() => setNotifOpen(false)}
            onMarkAsRead={markAsRead}
            onMarkAllAsRead={markAllAsRead}
          />
        </div>


      </div>
    </header>
  );
}
