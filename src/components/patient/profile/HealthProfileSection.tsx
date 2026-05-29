"use client";

import { useState } from "react";
import { Pencil, Check, X, Plus } from "lucide-react";
import { toast } from "sonner";
import type { ProfileData } from "./ProfileModal";

interface Props {
  data:          ProfileData;
  onUpdate:      (patch: Partial<ProfileData>) => void;
  onDirtyChange: (dirty: boolean) => void;
}

type Field = "weight" | "height" | "allergies" | "medications" | "conditions";

export function HealthProfileSection({ data, onUpdate, onDirtyChange }: Props) {
  const [editing, setEditing]   = useState<Field | null>(null);
  const [draft,   setDraft]     = useState<string>("");
  const [listDraft, setListDraft] = useState<string[]>([]);
  const [newItem, setNewItem]   = useState("");
  const [saving,  setSaving]    = useState(false);

  function startEdit(field: Field) {
    if (field === "weight") setDraft(data.weight != null ? String(data.weight) : "");
    else if (field === "height") setDraft(data.height != null ? String(data.height) : "");
    else if (field === "conditions") setDraft(data.medicalHistory ?? "");
    else if (field === "allergies") { setListDraft([...data.allergies]); setNewItem(""); }
    else if (field === "medications") { setListDraft([...data.currentMedications]); setNewItem(""); }
    setEditing(field);
    onDirtyChange(true);
  }

  function cancelEdit() {
    setEditing(null);
    setDraft("");
    setListDraft([]);
    setNewItem("");
    onDirtyChange(false);
  }

  async function saveField(field: Field) {
    setSaving(true);
    try {
      const body: Record<string, unknown> = {};
      if (field === "weight")      body.weight      = draft ? Number(draft) : undefined;
      if (field === "height")      body.height      = draft ? Number(draft) : undefined;
      if (field === "conditions")  body.medicalHistory = draft;
      if (field === "allergies")   body.allergies   = listDraft;
      if (field === "medications") body.currentMedications = listDraft;

      const res = await fetch("/api/patient/profile", {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(body),
      });
      if (!res.ok) throw new Error();

      if (field === "weight")      onUpdate({ weight: body.weight as number | undefined ?? null });
      if (field === "height")      onUpdate({ height: body.height as number | undefined ?? null });
      if (field === "conditions")  onUpdate({ medicalHistory: draft });
      if (field === "allergies")   onUpdate({ allergies: listDraft });
      if (field === "medications") onUpdate({ currentMedications: listDraft });

      setEditing(null); setDraft(""); setListDraft([]); setNewItem("");
      onDirtyChange(false);
      toast.success("Changes saved.");
    } catch {
      toast.error("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  function addItem() {
    const v = newItem.trim();
    if (!v || listDraft.includes(v)) return;
    setListDraft(prev => [...prev, v]);
    setNewItem("");
  }

  function removeItem(idx: number) {
    setListDraft(prev => prev.filter((_, i) => i !== idx));
  }

  const SaveCancel = ({ field }: { field: Field }) => (
    <div className="flex gap-2 mt-2">
      <button type="button" onClick={() => saveField(field)} disabled={saving}
        className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-text-main text-brand-sub text-[14px] font-medium hover:opacity-90 transition-opacity duration-150 disabled:opacity-50">
        <Check size={13} strokeWidth={2} />{saving ? "Saving…" : "Save"}
      </button>
      <button type="button" onClick={cancelEdit}
        className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-elements text-[14px] font-medium text-text-main hover:border-text-sub/60 transition-colors duration-150">
        <X size={13} strokeWidth={2} />Cancel
      </button>
    </div>
  );

  return (
    <div className="flex flex-col gap-6">

      {/* Weight + Height */}
      <div className="grid grid-cols-2 gap-4">
        {([["weight", "Weight (kg)", data.weight != null ? `${data.weight} kg` : "—"],
           ["height", "Height (cm)", data.height != null ? `${data.height} cm` : "—"]] as [Field, string, string][]).map(([key, label, display]) => (
          <div key={key} className="flex flex-col gap-1.5">
            <p className="text-[16px] font-medium text-text-sub">{label}</p>
            {editing === key ? (
              <div>
                <input type="number" value={draft} onChange={e => setDraft(e.target.value)} autoFocus
                  className="h-11 w-full px-3 rounded-lg border border-elements text-[16px] text-text-main outline-none focus:border-text-main transition-colors duration-200 bg-bg-main" />
                <SaveCancel field={key} />
              </div>
            ) : (
              <div className="flex items-center justify-between group">
                <p className="text-[16px] text-text-main">{display}</p>
                <button type="button" onClick={() => startEdit(key)}
                  className="p-1.5 rounded-md text-text-sub hover:text-text-main hover:bg-bg-sub transition-all duration-150">
                  <Pencil size={16} strokeWidth={1.75} className="text-text-main" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="h-px bg-elements/50" />

      {/* Allergies */}
      {(["allergies", "medications"] as Field[]).map(key => {
        const label   = key === "allergies" ? "Allergies" : "Current Medications";
        const items   = key === "allergies" ? data.allergies : data.currentMedications;
        return (
          <div key={key} className="flex flex-col gap-2">
            <p className="text-[16px] font-medium text-text-sub">{label}</p>
            {editing === key ? (
              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap gap-1.5">
                  {listDraft.map((item, i) => (
                    <span key={i} className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-bg-sub text-[13px] text-text-main border border-elements">
                      {item}
                      <button type="button" onClick={() => removeItem(i)} className="text-text-sub hover:text-error transition-colors"><X size={11} strokeWidth={2} /></button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input value={newItem} onChange={e => setNewItem(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addItem(); }}}
                    placeholder={`Add ${key === "allergies" ? "allergy" : "medication"}…`}
                    className="flex-1 h-9 px-3 rounded-lg border border-elements text-[16px] text-text-main outline-none focus:border-text-main transition-colors bg-bg-main" />
                  <button type="button" onClick={addItem}
                    className="h-9 px-3 rounded-lg border border-elements text-text-sub hover:text-text-main hover:border-text-sub/60 transition-colors">
                    <Plus size={14} strokeWidth={1.75} />
                  </button>
                </div>
                <SaveCancel field={key} />
              </div>
            ) : (
              <div className="flex items-start justify-between group">
                <div className="flex flex-wrap gap-1.5">
                  {items.length > 0 ? items.map((item, i) => (
                    <span key={i} className="px-2.5 py-1 rounded-full bg-bg-sub text-[13px] text-text-main border border-elements">{item}</span>
                  )) : <p className="text-[16px] text-text-sub">None recorded</p>}
                </div>
                <button type="button" onClick={() => startEdit(key)}
                  className="p-1.5 rounded-md text-text-sub hover:text-text-main hover:bg-bg-sub transition-all duration-150 shrink-0 ml-2">
                  <Pencil size={16} strokeWidth={1.75} className="text-text-main" />
                </button>
              </div>
            )}
          </div>
        );
      })}

      <div className="h-px bg-elements/50" />

      {/* Conditions */}
      <div className="flex flex-col gap-1.5">
        <p className="text-[16px] font-medium text-text-sub">Existing Conditions</p>
        {editing === "conditions" ? (
          <div>
            <textarea rows={3} value={draft} onChange={e => setDraft(e.target.value)} autoFocus
              placeholder="e.g. hypertension, diabetes…"
              className="w-full px-3 py-2.5 rounded-lg border border-elements text-[16px] text-text-main outline-none focus:border-text-main transition-colors bg-bg-main resize-none" />
            <SaveCancel field="conditions" />
          </div>
        ) : (
          <div className="flex items-start justify-between group">
            <p className="text-[16px] text-text-main leading-relaxed">{data.medicalHistory || "None recorded"}</p>
            <button type="button" onClick={() => startEdit("conditions")}
              className="p-1.5 rounded-md text-text-sub hover:text-text-main hover:bg-bg-sub transition-all duration-150 shrink-0 ml-2">
              <Pencil size={16} strokeWidth={1.75} className="text-text-main" />
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
