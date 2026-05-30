"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ChevronDown } from "lucide-react";

export function LandingPage() {
  return (
    <div className="bg-white flex flex-col">

      {/* -- Sticky nav -------------------------------------------------------- */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-elements/60">
        <div className="w-full px-10 h-19 flex items-center justify-between">

          {/* Left: logo + nav links */}
          <div className="flex items-center gap-8">
            <Link href="/" className="shrink-0">
              <Image
                src="/horizontal logo.png"
                alt="SwiftCare"
                width={200}
                height={60}
                style={{ height: "60px", width: "auto" }}
                priority
              />
            </Link>
            <nav className="hidden md:flex items-center gap-7">
              {["For Patients", "For Doctors", "Features"].map((label) => {
                const hasDropdown = label === "For Patients" || label === "For Doctors";
                return (
                  <span
                    key={label}
                    className="group flex items-center gap-2 text-[16px] text-text-main
                      hover:text-text-sub cursor-pointer transition-colors duration-200"
                  >
                    {label}
                    {hasDropdown && (
                      <ChevronDown
                        size={14}
                        strokeWidth={1.75}
                        className="opacity-60 mt-px transition-transform duration-300 group-hover:rotate-180"
                      />
                    )}
                  </span>
                );
              })}
            </nav>
          </div>

          {/* Right: Log in (hover fill) + Get started (black outline + sliding arrow) */}
          <div className="flex items-center gap-6 shrink-0">
            <Link
              href="/login"
              className="hidden sm:inline-flex h-9 px-3 items-center rounded-lg
                text-[16px] font-medium text-text-main
                hover:bg-bg-sub transition-colors duration-200"
            >
              Log in
            </Link>
            <Link
              href="/register"
              className="group inline-flex h-9 px-4 items-center gap-1.5 rounded-lg
                border border-text-main bg-white text-text-main
                text-[14px] font-medium hover:bg-bg-sub active:scale-[0.98]
                transition-all duration-200"
            >
              Get started
              <ArrowRight
                size={13}
                strokeWidth={2.25}
                className="group-hover:animate-arrow-slide"
              />
            </Link>
          </div>
        </div>
      </header>

      {/* -- Hero + screenshot -------------------------------------------------- */}
      <main className="flex flex-col items-center overflow-hidden">

        {/* Hero text */}
        <section className="w-full flex flex-col items-center text-center px-6 pt-20 pb-12 md:pt-28 md:pb-14">
          <h1
            className="text-[42px] sm:text-[54px] lg:text-[68px] font-medium text-text-main
              tracking-[-0.04em] leading-tight text-wrap animate-fadeInDown"
            style={{ animationDelay: "0ms", animationDuration: "600ms" }}
          >
            Healthcare that comes to you.
          </h1>

          <p
            className="mt-3 text-[17px] md:text-[18px] text-text-sub leading-relaxed
              max-w-2xl animate-fadeInDown"
            style={{ animationDelay: "100ms", animationDuration: "600ms" }}
          >
            SwiftCare connects you with licensed Filipino doctors online. Describe
            what you&apos;re feeling, and we&apos;ll find the right doctor for you.
          </p>

          <div
            className="mt-9 flex items-center gap-3 animate-fadeInDown"
            style={{ animationDelay: "200ms", animationDuration: "600ms" }}
          >
            <Link
              href="/login"
              className="inline-flex h-11 px-6 items-center rounded-lg border border-text-main
                text-[15px] font-medium text-text-main hover:bg-bg-sub
                transition-colors duration-200"
            >
              Log in
            </Link>
            <Link
              href="/register"
              className="group inline-flex h-11 px-6 items-center gap-2 rounded-lg bg-brand text-white
                text-[15px] font-medium hover:opacity-90 active:scale-[0.98]
                transition-all duration-200"
            >
              Get started
              <ArrowRight
                size={15}
                strokeWidth={2}
                className="group-hover:animate-arrow-slide"
              />
            </Link>
          </div>
        </section>

        {/* Dashboard screenshot — gradient is the SECTION BACKGROUND, full width */}
        <section
          className="w-full px-6 md:px-10 animate-fadeInUp"
          style={{
            animationDelay: "350ms",
            animationDuration: "800ms",
            background:
              "radial-gradient(ellipse 90% 80% at 10% 85%, rgba(0,135,134,0.28) 0%, transparent 60%)," +
              "radial-gradient(ellipse 80% 70% at 90% 85%, rgba(245,64,98,0.20) 0%, transparent 60%)",
          }}
        >
          <div className="relative w-full max-w-6xl mx-auto">
            <div
              className="rounded-t-2xl overflow-hidden border border-elements/50 border-b-0
                shadow-[0_12px_60px_rgba(0,0,0,0.10)]"
            >
              <Image
                src="/dashboard.png"
                alt="SwiftCare patient dashboard"
                width={2912}
                height={1648}
                quality={90}
                sizes="(max-width: 1280px) 100vw, 1152px"
                className="w-full h-auto block"
                priority
              />
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}
