"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { House, Stethoscope, Calendar, FileText } from "lucide-react";
import { ProfilePopover } from "@/components/patient/sidebar/ProfilePopover";
import { ProfileModal }   from "@/components/patient/profile/ProfileModal";

const NAV_ITEMS = [
  { label: "Home",            href: "/patient/dashboard",     icon: House       },
  { label: "Find a doctor",   href: "/patient/doctors",        icon: Stethoscope },
  { label: "Consultations",   href: "/patient/consultations",  icon: Calendar    },
  { label: "Health Records",  href: "/patient/records",        icon: FileText    },
];

export function PatientSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const name     = session?.user?.name ?? "Patient";
  const email    = session?.user?.email ?? "";
  const initials = name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <>
    <aside className="w-66 shrink-0 flex flex-col bg-bg-main border-r border-elements h-full animate-fadeInDown" style={{ animationDelay: "0ms", animationDuration: "400ms" }}>

      {/* Logo */}
      <div className="h-16 flex items-center px-6 shrink-0 gap-2.5 mt-6">
        <Link href="/patient/dashboard">
          <img src="/horizontal%20logo.png" alt="SwiftCare" className="h-15 w-auto object-contain" />
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              onClick={() => {
                if (href === "/patient/dashboard") {
                  window.dispatchEvent(new CustomEvent("swiftcare:home"));
                }
              }}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[16px] font-medium transition-colors duration-200 ${
                isActive
                  ? "bg-bg-sub text-text-main"
                  : "text-text-main hover:bg-bg-sub"
              }`}
            >
              <Icon size={18} className="text-text-main" strokeWidth={isActive ? 2 : 1.75} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Patient profile trigger */}
      <div className="px-3 py-1.5 border-t border-elements shrink-0 relative">
        <ProfilePopover
          name={name}
          email={email}
          initials={initials}
          isOpen={popoverOpen}
          onClose={() => setPopoverOpen(false)}
          onViewProfile={() => setProfileOpen(true)}
        />
        <button
          type="button"
          onClick={() => setPopoverOpen((v) => !v)}
          className="group w-full flex items-center gap-4 px-3 py-2.5 rounded-lg hover:bg-bg-sub transition-colors duration-200 text-left"
        >
          <div className="w-10 h-10 rounded-full bg-brand-sub flex items-center justify-center text-brand text-[13px] font-medium shrink-0 transition-transform duration-200 ease-out group-hover:scale-110">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[16px] font-medium text-text-main truncate leading-tight">{name}</p>
            <p className="text-[14px] text-text-sub leading-tight">Profile</p>
          </div>
        </button>
      </div>

    </aside>

    <ProfileModal isOpen={profileOpen} onClose={() => setProfileOpen(false)} />
    </>
  );
}
