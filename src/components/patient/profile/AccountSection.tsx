"use client";

import { useState } from "react";
import { Eye, EyeOff, Check } from "lucide-react";
import { toast } from "sonner";
import type { ProfileData } from "./ProfileModal";

interface Props {
  data:          ProfileData;
  onDirtyChange: (dirty: boolean) => void;
}

export function AccountSection({ data, onDirtyChange }: Props) {
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew,     setShowNew]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [current,  setCurrent]  = useState("");
  const [newPwd,   setNewPwd]   = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [saving,   setSaving]   = useState(false);

  function handleChange(setter: (v: string) => void) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      setter(e.target.value);
      onDirtyChange(true);
    };
  }

  const passwordsMatch = newPwd && confirm && newPwd === confirm;
  const canSubmit = current && newPwd.length >= 8 && passwordsMatch;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSaving(true);
    try {
      const res = await fetch("/api/patient/account/password", {
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

  return (
    <div className="flex flex-col gap-6">

      {/* Email */}
      <div className="flex flex-col gap-1.5">
        <p className="text-[12px] font-medium text-text-sub uppercase tracking-wide">Email address</p>
        <div className="h-10 px-3 rounded-lg border border-elements bg-bg-sub flex items-center">
          <p className="text-[14px] text-text-sub">{data.email}</p>
        </div>
        <p className="text-[12px] text-text-sub">Email cannot be changed.</p>
      </div>

      <div className="h-px bg-elements/50" />

      {/* Change password */}
      <div className="flex flex-col gap-4">
        <p className="text-[14px] font-medium text-text-main">Change password</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {/* Current password */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-text-main">Current password</label>
            <div className="relative">
              <input
                type={showCurrent ? "text" : "password"}
                value={current}
                onChange={handleChange(setCurrent)}
                placeholder="Enter current password"
                className="w-full h-10 pl-3 pr-10 rounded-lg border border-elements text-[14px] text-text-main
                  outline-none focus:border-text-main transition-colors duration-200 bg-bg-main"
              />
              <button type="button" onClick={() => setShowCurrent(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-sub hover:text-text-main transition-colors">
                {showCurrent ? <EyeOff size={15} strokeWidth={1.75} /> : <Eye size={15} strokeWidth={1.75} />}
              </button>
            </div>
          </div>

          {/* New password */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-text-main">New password</label>
            <div className="relative">
              <input
                type={showNew ? "text" : "password"}
                value={newPwd}
                onChange={handleChange(setNewPwd)}
                placeholder="At least 8 characters"
                className={`w-full h-10 pl-3 pr-10 rounded-lg border text-[14px] text-text-main
                  outline-none transition-colors duration-200 bg-bg-main
                  ${newPwd.length >= 8 ? "border-success" : "border-elements focus:border-text-main"}`}
              />
              <button type="button" onClick={() => setShowNew(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-sub hover:text-text-main transition-colors">
                {showNew ? <EyeOff size={15} strokeWidth={1.75} /> : <Eye size={15} strokeWidth={1.75} />}
              </button>
            </div>
          </div>

          {/* Confirm password */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-text-main">Confirm new password</label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                value={confirm}
                onChange={handleChange(setConfirm)}
                placeholder="Repeat new password"
                className={`w-full h-10 pl-3 pr-10 rounded-lg border text-[14px] text-text-main
                  outline-none transition-colors duration-200 bg-bg-main
                  ${confirm && passwordsMatch ? "border-success" : confirm && !passwordsMatch ? "border-error" : "border-elements focus:border-text-main"}`}
              />
              <button type="button" onClick={() => setShowConfirm(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-sub hover:text-text-main transition-colors">
                {showConfirm ? <EyeOff size={15} strokeWidth={1.75} /> : <Eye size={15} strokeWidth={1.75} />}
              </button>
            </div>
            {confirm && !passwordsMatch && (
              <p className="text-[12px] text-error">Passwords do not match</p>
            )}
          </div>

          <button
            type="submit"
            disabled={!canSubmit || saving}
            className="h-10 rounded-lg bg-text-main text-brand-sub text-[14px] font-medium
              hover:opacity-90 transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed
              flex items-center justify-center gap-2 mt-1"
          >
            {saving ? "Saving…" : (
              <><Check size={14} strokeWidth={2} />Update password</>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
