"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Eye, EyeOff, Check } from "lucide-react";
import { signOut } from "next-auth/react";
import { toast } from "sonner";
import type { ProfileData } from "./ProfileModal";

// ── Password conditions (same as registration) ────────────────────────────────

const PASSWORD_CONDITIONS = [
  { label: "At least 8 characters",         test: (pw: string) => pw.length >= 8 },
  { label: "1 uppercase letter",            test: (pw: string) => /[A-Z]/.test(pw) },
  { label: "1 lowercase letter",            test: (pw: string) => /[a-z]/.test(pw) },
  { label: "1 number",                      test: (pw: string) => /[0-9]/.test(pw) },
  { label: "1 special character (!@#$...)", test: (pw: string) => /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pw) },
] as const;

// ── Types ─────────────────────────────────────────────────────────────────────

interface Props {
  data:          ProfileData;
  onDirtyChange: (dirty: boolean) => void;
  onClose:       () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

const label = "text-[14px] font-medium text-text-sub";

export function AccountSection({ data, onDirtyChange, onClose }: Props) {
  const [showCurrent,    setShowCurrent]    = useState(false);
  const [showNew,        setShowNew]        = useState(false);
  const [showConfirm,    setShowConfirm]    = useState(false);
  const [current,        setCurrent]        = useState("");
  const [newPwd,         setNewPwd]         = useState("");
  const [confirm,        setConfirm]        = useState("");
  const [newPwdFocused,  setNewPwdFocused]  = useState(false);
  const [saving,         setSaving]         = useState(false);
  const [confirming,     setConfirming]     = useState(false);
  const [deleting,       setDeleting]       = useState(false);
  const [mounted,        setMounted]        = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const conditionResults = PASSWORD_CONDITIONS.map(c => c.test(newPwd));
  const allConditionsMet = conditionResults.every(Boolean);
  const showConditions   = (newPwdFocused || newPwd.length > 0) && !allConditionsMet;

  const passwordsMatch = newPwd && confirm && newPwd === confirm;
  const canSubmit      = current && allConditionsMet && passwordsMatch;

  function handleChange(setter: (v: string) => void) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      setter(e.target.value);
      onDirtyChange(true);
    };
  }

  function newPwdBorder() {
    if (allConditionsMet) return "border-success";
    if (newPwdFocused)    return "border-text-main";
    return "border-elements";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSaving(true);
    try {
      const res  = await fetch("/api/patient/account/password", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ currentPassword: current, newPassword: newPwd }),
      });
      const body = await res.json() as { error?: string };
      if (!res.ok) { toast.error(body.error ?? "Failed to update password."); return; }
      setCurrent(""); setNewPwd(""); setConfirm("");
      onDirtyChange(false);
      toast.success("Password updated successfully.");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch("/api/patient/account/delete", { method: "DELETE" });
      if (!res.ok) throw new Error();
      onClose();
      await signOut({ callbackUrl: "/login" });
    } catch {
      toast.error("Failed to delete account. Please try again.");
      setDeleting(false);
      setConfirming(false);
    }
  }

  const dialog = confirming && mounted && createPortal(
    <div
      className="fixed inset-0 z-200 flex items-center justify-center p-4 bg-black/50"
      onClick={() => !deleting && setConfirming(false)}
    >
      <div
        className="w-full max-w-md bg-bg-main rounded-xl border border-elements p-8
          shadow-[0_8px_32px_rgba(0,0,0,0.18)] animate-fadeInDown"
        style={{ animationDuration: "150ms" }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex flex-col items-center text-center mb-4">
          <img src="/illustrations/thinking.svg" alt="" className="w-66 max-w-full mb-3" />
          <p className="text-[18px] font-medium text-text-main">Delete your account?</p>
        </div>

        <p className="text-[16px] text-text-sub text-center mb-7">
          This permanently removes your profile, consultations, and health records. It cannot be undone.
        </p>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setConfirming(false)}
            disabled={deleting}
            className="flex-1 h-11 rounded-lg bg-success text-white text-[16px] font-medium
              hover:opacity-90 transition-opacity duration-150 disabled:opacity-50"
          >
            Keep my account
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="flex-1 h-11 rounded-lg bg-error text-white text-[16px] font-medium
              hover:opacity-90 transition-colors duration-150 disabled:opacity-50"
          >
            {deleting ? "Deleting…" : "Yes, delete"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );

  return (
    <div className="flex flex-col gap-6">

      {/* Email */}
      <div className="flex flex-col gap-1.5">
        <p className={label}>Email Address</p>
        <div className="h-11 px-3 rounded-lg border border-elements bg-bg-sub flex items-center">
          <p className="text-[16px] text-text-sub">{data.email}</p>
        </div>
        <p className="text-[14px] text-text-sub">Email address cannot be changed.</p>
      </div>

      <div className="h-px bg-elements/50" />

      {/* Change password */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-0.5">
          <p className="text-[18px] font-medium text-text-main">Update your password</p>
          <p className="text-[16px] text-text-sub">Enter your current password and a new password below.</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">

          {/* Current password */}
          <div className="flex flex-col gap-1.5">
            <label className={label}>Current password</label>
            <div className="relative">
              <input
                type={showCurrent ? "text" : "password"}
                value={current}
                onChange={handleChange(setCurrent)}
                placeholder="Enter current password"
                className="w-full h-11 pl-3 pr-10 rounded-lg border border-elements text-[16px]
                  text-text-main outline-none transition-colors duration-200 bg-bg-main
                  focus:border-text-main"
              />
              <button type="button" onClick={() => setShowCurrent(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-sub hover:text-text-main transition-colors">
                {showCurrent ? <EyeOff size={16} strokeWidth={1.75} /> : <Eye size={16} strokeWidth={1.75} />}
              </button>
            </div>
          </div>

          {/* New password with conditions */}
          <div className="flex flex-col gap-1.5">
            <label className={label}>New password</label>
            <div className="relative">
              <input
                type={showNew ? "text" : "password"}
                value={newPwd}
                onChange={handleChange(setNewPwd)}
                onFocus={() => setNewPwdFocused(true)}
                onBlur={() => setNewPwdFocused(false)}
                placeholder="At least 8 characters"
                className={`w-full h-11 pl-3 pr-10 rounded-lg border text-[16px]
                  text-text-main outline-none transition-colors duration-200 bg-bg-main
                  ${newPwdBorder()}`}
              />
              {allConditionsMet && !newPwdFocused ? (
                <Check size={16} strokeWidth={1.75}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-success pointer-events-none" />
              ) : (
                <button type="button" onClick={() => setShowNew(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-sub hover:text-text-main transition-colors">
                  {showNew ? <EyeOff size={16} strokeWidth={1.75} /> : <Eye size={16} strokeWidth={1.75} />}
                </button>
              )}
            </div>

            {/* Conditions panel */}
            <div className={`overflow-hidden transition-all duration-500 ease-in-out
              ${showConditions ? "max-h-40 opacity-100" : "max-h-0 opacity-0"}`}>
              <div className="flex flex-col gap-1 px-1 pt-1">
                {PASSWORD_CONDITIONS.map((cond, i) => (
                  <div key={cond.label} className="flex gap-2 items-center">
                    <div className={`w-3.5 h-3.5 rounded-full border shrink-0 flex items-center justify-center
                      transition-all duration-300
                      ${conditionResults[i] ? "border-success bg-success" : "border-elements"}`}>
                      {conditionResults[i] && <Check size={8} className="text-white" strokeWidth={1.75} />}
                    </div>
                    <span className={`text-[14px] leading-snug transition-colors duration-300
                      ${conditionResults[i] ? "text-success" : "text-text-sub"}`}>
                      {cond.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Confirm password */}
          <div className="flex flex-col gap-1.5">
            <label className={label}>Confirm password</label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                value={confirm}
                onChange={handleChange(setConfirm)}
                placeholder="Repeat new password"
                className={`w-full h-11 pl-3 pr-10 rounded-lg border text-[16px]
                  text-text-main outline-none transition-colors duration-200 bg-bg-main
                  ${confirm && passwordsMatch ? "border-success" : confirm && !passwordsMatch ? "border-error" : "border-elements focus:border-text-main"}`}
              />
              <button type="button" onClick={() => setShowConfirm(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-sub hover:text-text-main transition-colors">
                {showConfirm ? <EyeOff size={16} strokeWidth={1.75} /> : <Eye size={16} strokeWidth={1.75} />}
              </button>
            </div>
            {confirm && !passwordsMatch && (
              <p className="text-[14px] text-error">Passwords do not match</p>
            )}
          </div>

          <button
            type="submit"
            disabled={!canSubmit || saving}
            className="h-11 rounded-lg bg-text-main text-brand-sub text-[16px] font-medium
              hover:opacity-90 transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed
              flex items-center justify-center gap-2 mt-1"
          >
            {saving ? "Saving…" : "Update password"}
          </button>
        </form>
      </div>

      <div className="h-px bg-elements/50" />

      {/* Delete account */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-0.5">
          <p className="text-[16px] font-medium text-text-main">Delete account</p>
          <p className="text-[16px] text-text-sub">Permanently delete your account and all associated data.</p>
        </div>
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="shrink-0 ml-6 h-10 px-4 rounded-lg border border-error text-error text-[16px] font-medium
            hover:bg-error/5 active:scale-[0.99] transition-all duration-150"
        >
          Delete account
        </button>
      </div>

      {dialog}
    </div>
  );
}
