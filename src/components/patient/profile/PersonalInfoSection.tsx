"use client";

import { useState } from "react";
import { Pencil, Check, X } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import type { ProfileData } from "./ProfileModal";

interface Props {
  data:            ProfileData;
  onUpdate:        (patch: Partial<ProfileData>) => void;
  onDirtyChange:   (dirty: boolean) => void;
}

type Field = "name" | "dateOfBirth" | "phone";

export function PersonalInfoSection({ data, onUpdate, onDirtyChange }: Props) {
  const [editing, setEditing] = useState<Field | null>(null);
  const [draft,   setDraft]   = useState("");
  const [saving,  setSaving]  = useState(false);

  const initials = data.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  function startEdit(field: Field) {
    const current =
      field === "name"        ? data.name :
      field === "dateOfBirth" ? (data.dateOfBirth ? data.dateOfBirth.slice(0, 10) : "") :
      field === "phone"       ? (data.phone.replace("+63", "")) : "";
    setDraft(current);
    setEditing(field);
    onDirtyChange(true);
  }

  function cancelEdit() {
    setEditing(null);
    setDraft("");
    onDirtyChange(false);
  }

  async function saveField(field: Field) {
    setSaving(true);
    try {
      const body: Record<string, unknown> = {};
      if (field === "name")        body.name        = draft.trim();
      if (field === "dateOfBirth") body.dateOfBirth  = draft;
      if (field === "phone")       body.phone        = draft ? `+63${draft.replace(/^0+/, "")}` : "";

      const res = await fetch("/api/patient/profile", {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed");

      if (field === "name")        onUpdate({ name: body.name as string });
      if (field === "dateOfBirth") onUpdate({ dateOfBirth: draft || null });
      if (field === "phone")       onUpdate({ phone: body.phone as string });

      setEditing(null);
      setDraft("");
      onDirtyChange(false);
      toast.success("Changes saved.");
    } catch {
      toast.error("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const fields: { key: Field; label: string; display: string }[] = [
    {
      key:     "name",
      label:   "Full Name",
      display: data.name || "—",
    },
    {
      key:     "dateOfBirth",
      label:   "Date of Birth",
      display: data.dateOfBirth
        ? format(new Date(data.dateOfBirth), "MMMM d, yyyy")
        : "—",
    },
    {
      key:     "phone",
      label:   "Contact Number",
      display: data.phone || "—",
    },
  ];

  return (
    <div className="flex flex-col gap-6">

      {/* Avatar */}
      <div className="flex flex-col items-center gap-3 pb-2">
        <div className="w-20 h-20 rounded-full bg-brand-sub flex items-center justify-center shrink-0">
          <span className="text-[20px] font-medium text-brand select-none">{initials}</span>
        </div>
        <div className="text-center">
          <p className="text-[16px] font-medium text-text-main">{data.name || "—"}</p>
          <p className="text-[16px] text-text-sub">{data.email}</p>
        </div>
      </div>

      {/* Fields */}
      <div className="flex flex-col gap-6">
        {fields.map(({ key, label, display }) => (
          <div key={key} className="flex flex-col gap-1.5">
            <p className="text-[16px] font-medium text-text-sub">{label}</p>

            {editing === key ? (
              <div className="flex flex-col gap-2">
                <input
                  type={key === "dateOfBirth" ? "date" : key === "phone" ? "tel" : "text"}
                  value={draft}
                  onChange={e => setDraft(e.target.value)}
                  autoFocus
                  className="h-11 px-3 rounded-lg border border-elements text-[16px] text-text-main
                    outline-none focus:border-text-main transition-colors duration-200 bg-bg-main"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => saveField(key)}
                    disabled={saving}
                    className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-text-main text-brand-sub
                      text-[14px] font-medium hover:opacity-90 transition-opacity duration-150
                      disabled:opacity-50"
                  >
                    <Check size={13} strokeWidth={2} />
                    {saving ? "Saving…" : "Save"}
                  </button>
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-elements
                      text-[14px] font-medium text-text-main hover:border-text-sub/60 transition-colors duration-150"
                  >
                    <X size={13} strokeWidth={2} />
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between group">
                <p className="text-[16px] text-text-main">{display}</p>
                <button
                  type="button"
                  onClick={() => startEdit(key)}
                  className="p-1.5 rounded-md text-text-sub
                    hover:text-text-main hover:bg-bg-sub transition-all duration-150"
                  aria-label={`Edit ${label}`}
                >
                  <Pencil size={16} strokeWidth={1.75} className="text-text-main" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
