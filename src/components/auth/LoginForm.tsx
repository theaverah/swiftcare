"use client";

import { useState } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function LoginForm() {
  const router = useRouter();
  const [email,        setEmail]        = useState("");
  const [password,     setPassword]     = useState("");
  const [emailFocused, setEmailFocused] = useState(false);
  const [pwFocused,    setPwFocused]    = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [attempted,    setAttempted]    = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [authError,    setAuthError]    = useState(false);

  const emailValid = isValidEmail(email);

  function emailBorderClass() {
    if (attempted && (!email || !emailValid)) return "border-error";
    if (emailFocused) return "border-text-main";
    return "border-elements";
  }

  function pwBorderClass() {
    if (attempted && !password) return "border-error";
    if (pwFocused) return "border-text-main";
    return "border-elements";
  }

  async function handleLogin() {
    setAuthError(false);
    if (!email || !emailValid || !password) {
      setAttempted(true);
      return;
    }

    setLoading(true);
    const result = await signIn("credentials", { redirect: false, email, password });
    setLoading(false);

    if (!result?.ok) {
      setAuthError(true);
      return;
    }

    const session = await getSession();
    router.push(session?.user?.role === "doctor" ? "/doctor/dashboard" : "/patient/dashboard");
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6 py-16">
      <div className="flex flex-col gap-4 w-full max-w-lg">

        {/* -- Logo ------------------------------------------------------ */}
        <div
          className="flex justify-center mb-1 animate-fadeInDown"
          style={{ animationDelay: "0ms" }}
        >
          <img src="/logo.png" alt="SwiftCare" className="w-12 h-12 object-contain" />
        </div>

        {/* -- Heading --------------------------------------------------- */}
        <div
          className="flex flex-col gap-0.5 items-center text-center mb-2 animate-fadeInDown"
          style={{ animationDelay: "60ms" }}
        >
          <h1 className="text-[24px] font-medium text-text-main leading-normal">
            Good to have you back.
          </h1>
          <p className="text-[14px] text-text-sub leading-normal">
            Your next appointment is just a login away.
          </p>
        </div>

        {/* -- Auth error ------------------------------------------------ */}
        {authError && (
          <div
            className="rounded-lg border border-error/30 bg-error/5 px-4 py-3 animate-fadeInDown"
            style={{ animationDuration: "200ms" }}
          >
            <p className="text-[14px] text-error leading-normal">
              We couldn&apos;t find an account with those details. Please check and try again.
            </p>
          </div>
        )}

        {/* -- Email ----------------------------------------------------- */}
        <div
          className="flex flex-col gap-1.5 animate-fadeInDown"
          style={{ animationDelay: "180ms" }}
        >
          <label
            htmlFor="email"
            className="text-[14px] font-medium text-text-main leading-normal"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            autoComplete="email"
            onChange={(e) => { setEmail(e.target.value); setAuthError(false); }}
            onFocus={() => setEmailFocused(true)}
            onBlur={() => setEmailFocused(false)}
            className={`w-full h-10 rounded-lg border px-4 text-[14px] text-text-main bg-white outline-none transition-colors duration-200 placeholder:text-text-sub ${emailBorderClass()}`}
          />
          {attempted && !email && (
            <p className="text-[14px] text-error leading-normal animate-fadeInDown" style={{ animationDuration: "200ms" }}>
              Please enter your email
            </p>
          )}
          {attempted && email && !emailValid && (
            <p className="text-[14px] text-error leading-normal animate-fadeInDown" style={{ animationDuration: "200ms" }}>
              Please enter a valid email address
            </p>
          )}
        </div>

        {/* -- Password -------------------------------------------------- */}
        <div
          className="flex flex-col gap-1.5 animate-fadeInDown"
          style={{ animationDelay: "240ms" }}
        >
          <label
            htmlFor="password"
            className="text-[14px] font-medium text-text-main leading-normal"
          >
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              autoComplete="current-password"
              onChange={(e) => { setPassword(e.target.value); setAuthError(false); }}
              onFocus={() => setPwFocused(true)}
              onBlur={() => setPwFocused(false)}
              className={`w-full h-10 rounded-lg border px-4 pr-10 text-[14px] text-text-main bg-white outline-none transition-colors duration-200 placeholder:text-text-sub ${pwBorderClass()}`}
            />
            <button
              type="button"
              tabIndex={-1}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-sub hover:text-text-main transition-colors duration-150"
            >
              {showPassword
                ? <Eye size={18} strokeWidth={1.75} />
                : <EyeOff size={18} strokeWidth={1.75} />
              }
            </button>
          </div>
          {attempted && !password && (
            <p className="text-[14px] text-error leading-normal animate-fadeInDown" style={{ animationDuration: "200ms" }}>
              Please enter your password
            </p>
          )}
          <div className="flex justify-end mt-0.5">
            <span className="text-[14px] font-medium text-brand hover:underline transition-colors duration-150 cursor-pointer">
              Forgot password?
            </span>
          </div>
        </div>

        {/* -- Button + footer -------------------------------------------- */}
        <div
          className="flex flex-col gap-3.5 items-center w-full mt-4 animate-fadeInDown"
          style={{ animationDelay: "300ms" }}
        >
          <button
            type="button"
            onClick={handleLogin}
            disabled={loading}
            className="w-full h-10 rounded-lg text-[14px] font-medium text-brand-sub bg-text-main hover:opacity-90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? "Logging in…" : "Log in"}
          </button>

          <p className="text-[14px] text-center leading-normal w-full">
            <span className="text-text-sub">Don&apos;t have an account?</span>
            {" "}
            <Link href="/register" className="font-medium text-brand hover:underline">
              Sign up
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}
