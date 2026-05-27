"use client";

import { useSession } from "next-auth/react";
import { Bell, Search } from "lucide-react";

interface DashboardHeaderProps {
  title?: string;
}

export function DashboardHeader({ title }: DashboardHeaderProps) {
  const { data: session } = useSession();

  const initials = session?.user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="h-16 shrink-0 flex items-center justify-between px-8 bg-bg-main border-b border-elements">
      <div className="flex items-center gap-4">
        {title && (
          <h1 className="text-[18px] font-bold text-text-main">{title}</h1>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Search trigger — wired up per page */}
        <button className="flex items-center gap-2 px-3 py-2 rounded-lg border border-elements text-text-sub hover:border-brand hover:text-brand transition-colors duration-base text-[13px]">
          <Search size={16} />
          <span className="hidden sm:inline">Search</span>
        </button>

        {/* Notifications */}
        <button className="relative w-9 h-9 flex items-center justify-center rounded-lg hover:bg-bg-sub transition-colors duration-base">
          <Bell size={18} className="text-text-sub" />
          {/* Unread dot — replace with real count later */}
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand" />
        </button>

        {/* Avatar */}
        <div className="w-9 h-9 rounded-full bg-brand-sub flex items-center justify-center text-brand text-[13px] font-medium select-none cursor-pointer">
          {initials ?? "?"}
        </div>
      </div>
    </header>
  );
}
