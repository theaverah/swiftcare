"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { Trash2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface Props {
  onClose: () => void;
}

export function DangerZoneSection({ onClose }: Props) {
  const [confirming, setConfirming] = useState(false);
  const [deleting,   setDeleting]   = useState(false);

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

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start gap-3 p-4 rounded-lg border border-error/30 bg-error/5">
        <AlertTriangle size={18} className="text-error shrink-0 mt-0.5" strokeWidth={1.75} />
        <div>
          <p className="text-[14px] font-medium text-text-main mb-1">Danger Zone</p>
          <p className="text-[14px] text-text-sub leading-relaxed">
            Actions in this section are permanent and cannot be undone. Please proceed with caution.
          </p>
        </div>
      </div>

      {/* Delete account */}
      <div className="flex items-center justify-between py-4 border-b border-elements/50">
        <div>
          <p className="text-[14px] font-medium text-text-main">Delete account</p>
          <p className="text-[13px] text-text-sub">
            Permanently delete your account and all associated data.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="shrink-0 ml-4 h-9 px-4 rounded-lg border border-error text-error text-[13px] font-medium
            hover:bg-error/5 transition-colors duration-150"
        >
          Delete account
        </button>
      </div>

      {/* Confirmation dialog */}
      {confirming && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/40"
          onClick={() => !deleting && setConfirming(false)}
        >
          <div
            className="w-full max-w-sm bg-bg-main rounded-xl border border-elements p-6 shadow-[0_8px_32px_rgba(0,0,0,0.18)] animate-fadeInDown"
            style={{ animationDuration: "150ms" }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-error/10 flex items-center justify-center shrink-0">
                <Trash2 size={18} className="text-error" strokeWidth={1.75} />
              </div>
              <div>
                <p className="text-[15px] font-medium text-text-main">Are you sure?</p>
                <p className="text-[13px] text-text-sub">This cannot be undone.</p>
              </div>
            </div>

            <p className="text-[14px] text-text-sub leading-relaxed mb-5">
              This will permanently delete your account and all your data — appointments, health profile, and saved doctors. There is no way to recover this.
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setConfirming(false)}
                disabled={deleting}
                className="flex-1 h-10 rounded-lg border border-elements text-[14px] font-medium text-text-main
                  hover:border-text-sub/60 transition-colors duration-150 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 h-10 rounded-lg bg-error text-white text-[14px] font-medium
                  hover:opacity-90 transition-opacity duration-150 disabled:opacity-50"
              >
                {deleting ? "Deleting…" : "Yes, delete my account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
