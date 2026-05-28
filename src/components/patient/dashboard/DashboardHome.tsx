"use client";

import { HeroSearch } from "./HeroSearch";
import { UpcomingAppointmentCard } from "./UpcomingAppointmentCard";

const ANIM = { animationDuration: "400ms" };

export function DashboardHome() {

  return (
    <div className="flex flex-col gap-10 w-full flex-1">

      {/* ── Hero Search ──────────────────────────────────────────────── */}
      <div
        className="animate-fadeInDown"
        style={{ animationDelay: "100ms", ...ANIM }}
      >
        <HeroSearch />
      </div>

      {/* ── Consultations ────────────────────────────────────────────── */}
      <div
        className="flex flex-col gap-3 animate-fadeInDown mt-10"
        style={{ animationDelay: "150ms", ...ANIM }}
      >
        <p className="text-[16px] font-medium text-text-main">Your consultations</p>
        <UpcomingAppointmentCard />
      </div>

      {/* ── Attribution ──────────────────────────────────────────────── */}
      <p className="mt-auto text-[12px] text-text-sub text-center animate-fadeInDown" style={{ animationDelay: "200ms", ...ANIM }}>
        © 2026 SwiftCare by{" "}
        <a
          href="https://theaverah.vercel.app"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline"
        >
          Thea
        </a>
        . All rights reserved.
      </p>

    </div>
  );
}
