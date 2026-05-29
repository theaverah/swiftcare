"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Calendar,
  Clock,
  Users,
  FileText,
  Bell,
  User,
  LogOut,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Dashboard",    href: "/doctor/dashboard",     icon: LayoutDashboard },
  { label: "Schedule",     href: "/doctor/schedule",      icon: Clock },
  { label: "Appointments", href: "/doctor/appointments",  icon: Calendar },
  { label: "Patients",     href: "/doctor/patients",      icon: Users },
  { label: "Records",      href: "/doctor/records",       icon: FileText },
  { label: "Notifications",href: "/doctor/notifications", icon: Bell },
  { label: "Profile",      href: "/doctor/profile",       icon: User },
];

export function DoctorSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 shrink-0 flex flex-col bg-bg-sub border-r border-elements h-full">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-elements">
        <span className="text-[17px] font-bold tracking-tight text-text-main">
          Swift<span className="text-brand">Care</span>
        </span>
        <span className="ml-2 text-[10px] font-medium text-brand bg-brand-sub px-1.5 py-0.5 rounded">
          Doctor
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto">
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-lg text-[14px] font-medium
                transition-colors duration-base
                ${isActive
                  ? "bg-brand-sub text-brand"
                  : "text-text-sub hover:bg-elements hover:text-text-main"
                }
              `}
            >
              <Icon
                size={18}
                className={isActive ? "text-brand" : "text-text-sub"}
              />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Sign out */}
      <div className="px-3 py-4 border-t border-elements">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="
            w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
            text-[14px] font-medium text-text-sub
            hover:bg-elements hover:text-text-main
            transition-colors duration-base
          "
        >
          <LogOut size={18} className="text-text-sub" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
