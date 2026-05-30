"use client";

import { useState, useRef, useEffect, useCallback } from "react";

// --- Types --------------------------------------------------------------------

interface RegisterStep2Props {
  email: string;
  onVerified?: () => void;
}

// --- Component ----------------------------------------------------------------

export function RegisterStep2({ email, onVerified }: RegisterStep2Props) {
  const [code, setCode]           = useState<string[]>(Array(6).fill(""));
  const [countdown, setCountdown] = useState(60);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const codeStr      = code.join("");
  const codeComplete = code.every((d) => d !== "");
  const canResend    = countdown === 0;
  const mins         = Math.floor(countdown / 60);
  const secs         = String(countdown % 60).padStart(2, "0");

  // Countdown tick
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  // Focus first box on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleVerify = useCallback(
    async (value = codeStr) => {
      if (value.length !== 6 || isVerifying) return;
      setIsVerifying(true);
      setError(null);
      try {
        const res = await fetch("/api/auth/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, code: value }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Invalid code");
        onVerified?.();
      } catch (err) {
        setError(err instanceof Error ? err.message : "That code didn't work. Please try again.");
        setCode(Array(6).fill(""));
        setTimeout(() => inputRefs.current[0]?.focus(), 0);
      } finally {
        setIsVerifying(false);
      }
    },
    [codeStr, email, isVerifying, onVerified]
  );

  // Auto-submit when all 6 digits filled
  useEffect(() => {
    if (codeComplete) handleVerify(codeStr);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [codeComplete, codeStr]);

  const handleChange = useCallback((index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    setCode((prev) => {
      const next = [...prev];
      next[index] = digit;
      return next;
    });
    setError(null);
    if (digit && index < 5) inputRefs.current[index + 1]?.focus();
  }, []);

  const handleKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Backspace") {
        e.preventDefault();
        if (code[index]) {
          setCode((prev) => { const n = [...prev]; n[index] = ""; return n; });
        } else if (index > 0) {
          setCode((prev) => { const n = [...prev]; n[index - 1] = ""; return n; });
          inputRefs.current[index - 1]?.focus();
        }
      } else if (e.key === "ArrowLeft" && index > 0) {
        inputRefs.current[index - 1]?.focus();
      } else if (e.key === "ArrowRight" && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    },
    [code]
  );

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const next = Array(6).fill("").map((_, i) => pasted[i] ?? "");
    setCode(next);
    setError(null);
    const focusIdx = Math.min(pasted.length, 5);
    inputRefs.current[focusIdx]?.focus();
  }, []);

  const handleResend = useCallback(() => {
    if (!canResend) return;
    setCountdown(60);
    setCode(Array(6).fill(""));
    setError(null);
    inputRefs.current[0]?.focus();
    // TODO: POST /api/auth/resend-verification  { email }
  }, [canResend, email]);

  // Border color per box
  function boxBorderClass(digit: string) {
    if (error) return "border-error";
    if (digit) return "border-text-main";
    return "border-elements";
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6 py-16">
      <div className="flex flex-col gap-4 w-full max-w-lg">

        {/* -- Heading --------------------------------------------------- */}
        <div
          className="flex flex-col gap-2.5 items-center text-center w-full animate-fadeInDown"
          style={{ animationDelay: "0ms" }}
        >
          <h1 className="text-[24px] font-medium text-text-main tracking-[-0.264px] leading-normal w-full">
            Check your email
          </h1>
          <p className="text-[14px] text-text-sub leading-normal w-full">
            Enter the 6-digit code we sent to{" "}
            <span className="text-text-main">{email}</span>
            <br />
            to continue setting up your account.
          </p>
        </div>

        {/* -- Code input ------------------------------------------------ */}
        <div
          className="flex flex-col gap-1.5 w-full animate-fadeInDown mt-2"
          style={{ animationDelay: "120ms" }}
        >
          <div className="grid grid-cols-6 gap-2.5 w-full" onPaste={handlePaste}>
            {code.map((digit, i) => (
              <input
                key={i}
                ref={(el) => { inputRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                autoComplete={i === 0 ? "one-time-code" : "off"}
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                onFocus={(e) => e.target.select()}
                disabled={isVerifying}
                className={`
                  w-full aspect-square rounded-lg border text-center
                  text-[20px] font-medium text-text-main bg-white outline-none
                  transition-colors duration-200
                  focus:border-text-main
                  disabled:opacity-50 disabled:cursor-not-allowed
                  ${boxBorderClass(digit)}
                `}
              />
            ))}
          </div>

          {error && (
            <p className="text-[14px] text-error leading-normal animate-fadeInDown">
              {error}
            </p>
          )}

          <p className="text-[14px] text-text-sub leading-normal mt-1">
            Didn&apos;t get it?{" "}
            {canResend ? (
              <button
                type="button"
                onClick={handleResend}
                className="text-brand font-medium hover:underline transition-colors duration-150"
              >
                Resend code
              </button>
            ) : (
              <span>Resend in {mins}:{secs}</span>
            )}
          </p>
        </div>

        {/* -- Verify button ---------------------------------------------- */}
        <div
          className="flex flex-col gap-2 items-center w-full mt-4 animate-fadeInDown"
          style={{ animationDelay: "240ms" }}
        >
          <button
            type="button"
            onClick={() => handleVerify()}
            disabled={!codeComplete || isVerifying}
            className={`
              w-full h-10 rounded-lg
              text-[14px] font-medium tracking-[-0.176px] text-brand-sub
              transition-all duration-200
              ${codeComplete && !isVerifying
                ? "bg-text-main hover:opacity-90 cursor-pointer"
                : "bg-text-main/40 cursor-not-allowed"
              }
            `}
          >
            {isVerifying ? "Verifying…" : "Verify"}
          </button>

        </div>

      </div>
    </div>
  );
}
