"use client";

import { useState, useRef, useEffect } from "react";
import { HeroSearch }              from "./HeroSearch";
import { UpcomingAppointmentCard } from "./UpcomingAppointmentCard";
import { SwiftChat }               from "./SwiftChat";

const ANIM = { animationDuration: "400ms" };

export function DashboardHome() {
  const [chatMode,        setChatMode]        = useState(false);
  const [homeVisible,     setHomeVisible]     = useState(true);
  const [initialMessage,  setInitialMessage]  = useState("");
  const [initialFile,     setInitialFile]     = useState<File | null>(null);
  const chatReadyRef = useRef(false);

  function handleFirstMessage(text: string, file?: File | null) {
    if (!text.trim()) return;
    setInitialMessage(text);
    setInitialFile(file ?? null);

    // Fade out home content
    setHomeVisible(false);

    // Switch layout after fade completes
    setTimeout(() => {
      chatReadyRef.current = true;
      setChatMode(true);
    }, 380);
  }

  useEffect(() => {
    function onHome() { handleClear(); }
    window.addEventListener("swiftcare:home", onHome);
    return () => window.removeEventListener("swiftcare:home", onHome);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleClear() {
    setChatMode(false);
    chatReadyRef.current = false;
    setInitialMessage("");
    setInitialFile(null);
    // Delay restoring visibility so SwiftChat fades out first
    setTimeout(() => setHomeVisible(true), 50);
  }

  // ── Chat mode ───────────────────────────────────────────────────────────────
  if (chatMode) {
    return (
      <div
        className="flex flex-col w-full flex-1 min-h-0 animate-fadeInDown"
        style={{ animationDuration: "350ms" }}
      >
        <SwiftChat
          initialMessage={initialMessage}
          initialFile={initialFile}
          onClear={handleClear}
        />
      </div>
    );
  }

  // ── Home mode ───────────────────────────────────────────────────────────────
  return (
    <div
      className="flex flex-col gap-10 w-full flex-1 transition-opacity duration-350"
      style={{ opacity: homeVisible ? 1 : 0, pointerEvents: homeVisible ? "auto" : "none" }}
    >
      {/* ── Hero Search ──────────────────────────────────────────────── */}
      <div
        className="animate-fadeInDown"
        style={{ animationDelay: "100ms", ...ANIM }}
      >
        <HeroSearch onSubmit={handleFirstMessage} />
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
