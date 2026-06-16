"use client";

import Link from "next/link";

export default function PatientWelcomePage() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 text-center">

      <img
        src="/illustrations/welcome.svg"
        alt=""
        aria-hidden
        className="w-full max-w-sm select-none animate-fadeInDown"
        style={{ animationDelay: "0ms", animationDuration: "500ms" }}
      />

      <div
        className="mt-8 flex flex-col items-center gap-6 animate-fadeInDown"
        style={{ animationDelay: "150ms", animationDuration: "500ms" }}
      >
        <div className="flex flex-col items-center gap-2">
          <h1 className="text-[32px] font-bold text-text-main leading-tight">
            You&apos;re all set!
          </h1>
          <p className="text-[16px] text-text-sub max-w-lg">
            Your SwiftCare account is ready. Let&apos;s find you the right doctor.
          </p>
        </div>
        <Link
          href="/patient/dashboard"
          className="inline-flex items-center justify-center h-11 px-8 rounded-lg bg-text-main text-brand-sub text-[14px] font-medium hover:opacity-90 transition-all duration-200"
        >
          Get started
        </Link>
      </div>

    </div>
  );
}
