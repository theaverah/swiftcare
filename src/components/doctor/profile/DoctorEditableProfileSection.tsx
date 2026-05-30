"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { Camera, Check, ChevronDown, Plus, User, X } from "lucide-react";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";
import { toast } from "sonner";
import { useUploadThing } from "@/lib/uploadthing-client";

// -- Types ---------------------------------------------------------------------

export interface BreakSlot {
  startTime: string;
  endTime: string;
}

export interface ScheduleDay {
  enabled: boolean;
  startTime: string;
  endTime: string;
  breaks: BreakSlot[];
}

export interface DoctorFormState {
  name:             string;
  contactNumber:    string;
  profileImage:     string | null;
  specializations:  string[];
  prcLicense:       string;
  yearsOfExperience:string;
  bio:              string;
  languages:        string[];
  education:        { medicalSchool: string; residency: string };
  certifications:   string[];
  affiliations:     string[];
  consultationFee:  string;
  schedule:         Record<string, ScheduleDay>;
}

interface Props {
  form:          DoctorFormState;
  saved:         DoctorFormState;
  onChange:      (patch: Partial<DoctorFormState>) => void;
  onSave:        () => Promise<void>;
  onReset:       () => void;
  isDirty:       boolean;
  saving:        boolean;
  warnKey?:      number;
}

// -- Constants -----------------------------------------------------------------

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const BIO_MAX = 300;

const SPECIALIZATIONS = [
  "General Practice", "Internal Medicine", "Cardiology", "Dermatology",
  "Obstetrics & Gynecology", "Pediatrics", "Neurology", "Orthopedic Surgery",
  "Psychiatry", "Ophthalmology", "ENT (Ear, Nose & Throat)", "Pulmonology",
  "Endocrinology", "Gastroenterology", "Nephrology", "Oncology", "Urology",
  "Rheumatology", "Infectious Disease", "Emergency Medicine", "Family Medicine",
  "Geriatrics", "Rehabilitation Medicine", "Pathology", "Radiology", "Anesthesiology",
];

const LANGUAGES = [
  "English", "Filipino (Tagalog)", "Cebuano (Bisaya)", "Ilocano",
  "Hiligaynon (Ilonggo)", "Waray", "Bikol", "Kapampangan", "Maranao", "Chavacano",
];

// -- Time helpers --------------------------------------------------------------

function generateTimeSlots(): string[] {
  const slots: string[] = [];
  for (let h = 6; h <= 22; h++) {
    for (const m of [0, 30]) {
      if (h === 22 && m === 30) break;
      const hour = h > 12 ? h - 12 : h === 0 ? 12 : h;
      const ampm = h < 12 ? "AM" : "PM";
      slots.push(`${hour}:${m === 0 ? "00" : "30"} ${ampm}`);
    }
  }
  return slots;
}
const TIME_SLOTS = generateTimeSlots();

function timeToMinutes(t: string): number {
  const [time, ampm] = t.split(" ");
  let [h, m] = time.split(":").map(Number);
  if (ampm === "PM" && h !== 12) h += 12;
  if (ampm === "AM" && h === 12) h = 0;
  return h * 60 + m;
}

// -- Photo crop helpers --------------------------------------------------------

async function getCroppedFile(imageSrc: string, pixelCrop: Area): Promise<File> {
  const image = new Image();
  image.src = imageSrc;
  await new Promise<void>((resolve) => { image.onload = () => resolve(); });
  const canvas = document.createElement("canvas");
  canvas.width  = pixelCrop.width;
  canvas.height = pixelCrop.height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, pixelCrop.width, pixelCrop.height);
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(new File([blob!], "profile.jpg", { type: "image/jpeg" }));
    }, "image/jpeg", 0.92);
  });
}

// -- Sub-components ------------------------------------------------------------

function TimeSelect({ value, onChange, borderClass, height = "h-9" }: {
  value: string;
  onChange: (v: string) => void;
  borderClass: string;
  height?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  return (
    <div ref={ref} className="relative flex-1">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`w-full ${height} rounded-lg border pl-3 pr-3 text-[14px] text-text-main bg-bg-main
          flex items-center justify-between gap-2 transition-colors duration-200 ${borderClass}`}
      >
        <span className="truncate">{value}</span>
        <ChevronDown size={14} strokeWidth={1.75}
          className={`text-text-sub shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute z-50 top-full mt-1 w-full bg-bg-main border border-elements
          rounded-xl shadow-lg overflow-hidden">
          <div className="max-h-48 overflow-y-auto">
            {TIME_SLOTS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => { onChange(t); setOpen(false); }}
                className={`w-full px-4 py-2.5 text-left text-[14px] flex items-center justify-between
                  hover:bg-bg-sub transition-colors duration-150
                  ${t === value ? "text-brand font-medium" : "text-text-main"}`}
              >
                {t}
                {t === value && <Check size={13} strokeWidth={1.75} className="text-brand shrink-0" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TagInput({ tags, onChange, placeholder }: {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder: string;
}) {
  const [input, setInput] = useState("");

  function toTitleCase(str: string) {
    return str.replace(/\b\w/g, (c) => c.toUpperCase());
  }
  function addTag(raw: string) {
    const t = toTitleCase(raw.trim().replace(/,+$/, "").trim());
    if (t && !tags.includes(t)) onChange([...tags, t]);
    setInput("");
  }
  function removeTag(idx: number) { onChange(tags.filter((_, i) => i !== idx)); }
  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if ((e.key === "Enter" || e.key === ",") && input.trim()) { e.preventDefault(); addTag(input); }
    else if (e.key === "Backspace" && input === "" && tags.length > 0) removeTag(tags.length - 1);
  }
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    if (val.endsWith(",")) addTag(val.slice(0, -1));
    else setInput(val);
  }

  return (
    <div className="flex flex-wrap gap-1.5 items-center min-h-11 rounded-lg border border-elements
      px-3 py-2 bg-bg-main focus-within:border-text-main transition-colors duration-200 cursor-text">
      {tags.map((tag, i) => (
        <span key={i} className="flex items-center gap-1 px-2.5 py-0.5 bg-bg-sub rounded-md
          text-[14px] text-text-main border border-elements shrink-0">
          {tag}
          <button type="button" onClick={() => removeTag(i)}
            className="text-text-sub hover:text-error transition-colors leading-none ml-0.5">
            <X size={11} strokeWidth={2} />
          </button>
        </span>
      ))}
      <input
        type="text"
        value={input}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={tags.length === 0 ? placeholder : ""}
        className="flex-1 min-w-36 text-[16px] text-text-main bg-transparent outline-none
          placeholder:text-text-sub"
      />
    </div>
  );
}

function SearchableMultiSelect({ selected, options, onChange, placeholder }: {
  selected: string[];
  options: string[];
  onChange: (v: string[]) => void;
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) { setOpen(false); setSearch(""); }
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  const filtered = options.filter((o) => o.toLowerCase().includes(search.toLowerCase()));

  function toggle(opt: string) {
    onChange(selected.includes(opt) ? selected.filter((s) => s !== opt) : [...selected, opt]);
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full min-h-11 rounded-lg border border-elements px-3 py-2 text-[16px]
          text-text-main bg-bg-main flex items-start justify-between gap-2
          focus:border-text-main transition-colors duration-200"
      >
        <div className="flex flex-wrap gap-1.5 flex-1">
          {selected.length === 0 ? (
            <span className="text-text-sub self-center">{placeholder}</span>
          ) : (
            selected.map((s) => (
              <span key={s} className="flex items-center gap-1 px-2.5 py-0.5 bg-bg-sub rounded-md
                text-[14px] text-text-main border border-elements shrink-0">
                {s}
                <span
                  role="button"
                  onClick={(e) => { e.stopPropagation(); toggle(s); }}
                  className="text-text-sub hover:text-error transition-colors leading-none ml-0.5 cursor-pointer"
                >
                  <X size={11} strokeWidth={2} />
                </span>
              </span>
            ))
          )}
        </div>
        <ChevronDown size={16} strokeWidth={1.75}
          className={`text-text-sub shrink-0 mt-0.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute z-50 top-full mt-1 w-full bg-bg-main border border-elements
          rounded-xl shadow-lg overflow-hidden">
          <div className="p-2 border-b border-elements">
            <input
              autoFocus
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search…"
              className="w-full h-8 px-3 text-[14px] text-text-main bg-bg-sub rounded-lg outline-none
                placeholder:text-text-sub"
            />
          </div>
          <div className="max-h-52 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="px-4 py-3 text-[14px] text-text-sub">No results</p>
            ) : filtered.map((opt) => {
              const checked = selected.includes(opt);
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => toggle(opt)}
                  className="w-full px-4 py-2.5 text-left text-[14px] flex items-center justify-between
                    hover:bg-bg-sub transition-colors duration-150"
                >
                  <span className={checked ? "text-brand font-medium" : "text-text-main"}>{opt}</span>
                  {checked && <Check size={13} strokeWidth={1.75} className="text-brand shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// -- Main component ------------------------------------------------------------

export function DoctorEditableProfileSection({
  form, saved, onChange, onSave, onReset, isDirty, saving, warnKey,
}: Props) {
  const [bannerWarn,  setBannerWarn]  = useState(false);
  const [shakeCount,  setShakeCount]  = useState(0);
  const [mounted,     setMounted]     = useState(false);

  // Photo upload state
  const [preview,       setPreview]       = useState(form.profileImage ?? "");
  const [uploading,     setUploading]     = useState(false);
  const [cropSrc,       setCropSrc]       = useState("");
  const [crop,          setCrop]          = useState({ x: 0, y: 0 });
  const [zoom,          setZoom]          = useState(1);
  const [croppedPixels, setCroppedPixels] = useState<Area | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!warnKey) return;
    setBannerWarn(true);
    setShakeCount((c) => c + 1);
    const t = setTimeout(() => setBannerWarn(false), 1500);
    return () => clearTimeout(t);
  }, [warnKey]);

  const { startUpload } = useUploadThing("profileImage", {
    onClientUploadComplete: (res) => {
      const url = res?.[0]?.url ?? res?.[0]?.ufsUrl ?? "";
      if (url) { onChange({ profileImage: url }); setPreview(url); }
      setUploading(false);
      setCropSrc("");
    },
    onUploadError: () => { toast.error("Upload failed. Please try again."); setUploading(false); },
  });

  const onCropComplete = useCallback((_: Area, pixels: Area) => { setCroppedPixels(pixels); }, []);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setCropSrc(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  async function handleCropConfirm() {
    if (!cropSrc || !croppedPixels) return;
    setUploading(true);
    try {
      const file = await getCroppedFile(cropSrc, croppedPixels);
      await startUpload([file]);
    } catch {
      toast.error("Upload failed."); setUploading(false);
    }
  }

  // Schedule helpers
  function updateDay(day: string, patch: Partial<ScheduleDay>) {
    onChange({ schedule: { ...form.schedule, [day]: { ...form.schedule[day], ...patch } } });
  }
  function toggleDay(day: string) {
    updateDay(day, { enabled: !form.schedule[day].enabled });
  }
  function addBreak(day: string) {
    const breaks = [...(form.schedule[day].breaks ?? []), { startTime: "12:00 PM", endTime: "12:30 PM" }];
    updateDay(day, { breaks });
  }
  function updateBreak(day: string, idx: number, patch: Partial<BreakSlot>) {
    const breaks = (form.schedule[day].breaks ?? []).map((b, i) => i === idx ? { ...b, ...patch } : b);
    updateDay(day, { breaks });
  }
  function removeBreak(day: string, idx: number) {
    const breaks = (form.schedule[day].breaks ?? []).filter((_, i) => i !== idx);
    updateDay(day, { breaks });
  }
  function breakError(day: string, brk: BreakSlot, idx: number): string {
    const { startTime: dayStart, endTime: dayEnd, breaks } = form.schedule[day];
    const brkStart = timeToMinutes(brk.startTime);
    const brkEnd   = timeToMinutes(brk.endTime);
    if (brkStart >= brkEnd) return "Break end time must be after start time";
    if (brkStart < timeToMinutes(dayStart) || brkEnd > timeToMinutes(dayEnd)) return "Break must be within your working hours";
    for (let i = 0; i < breaks.length; i++) {
      if (i === idx) continue;
      const o = breaks[i];
      if (timeToMinutes(o.startTime) < brkEnd && timeToMinutes(o.endTime) > brkStart) return "Overlaps with another break";
    }
    return "";
  }

  const enabledDays    = DAYS.filter((d) => form.schedule[d]?.enabled);
  const initials       = (form.name ?? "").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  const bioCharsLeft   = BIO_MAX - (form.bio?.length ?? 0);
  const bioOverLimit   = bioCharsLeft < 0;

  const label = "block text-[14px] font-medium text-text-sub mb-1.5";
  const input = `w-full h-11 px-3 rounded-lg border border-elements text-[16px] text-text-main
    outline-none focus:border-text-main transition-colors duration-200 bg-bg-main`;

  const cropOverlay = cropSrc && mounted && createPortal(
    <div className="fixed inset-0 z-[300] bg-black/80 flex flex-col items-center justify-center p-6">
      <div className="relative w-full max-w-sm aspect-square rounded-xl overflow-hidden bg-black">
        <Cropper
          image={cropSrc}
          crop={crop}
          zoom={zoom}
          aspect={1}
          cropShape="round"
          showGrid={false}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
        />
      </div>
      <div className="mt-4 flex gap-3">
        <button type="button" onClick={() => { setCropSrc(""); setUploading(false); }}
          className="h-11 px-6 rounded-lg border border-white/30 text-white text-[15px] font-medium
            hover:bg-white/10 transition-colors">
          Cancel
        </button>
        <button type="button" onClick={handleCropConfirm} disabled={uploading}
          className="h-11 px-6 rounded-lg bg-brand text-white text-[15px] font-medium
            hover:opacity-90 transition-opacity disabled:opacity-60">
          {uploading ? "Uploading…" : "Crop & upload"}
        </button>
      </div>
    </div>,
    document.body
  );

  return (
    <div className="flex flex-col">
      {cropOverlay}

      {/* -- Profile photo -------------------------------------------------- */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-0.5">
          <p className="text-[18px] font-medium text-text-main">Profile Photo</p>
          <p className="text-[16px] text-text-sub">Visible to patients when browsing doctors.</p>
        </div>

        <div className="flex items-center gap-5">
          <div className="relative w-20 h-20 shrink-0">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-brand-sub flex items-center justify-center border border-elements">
              {(preview || form.profileImage) ? (
                <img src={preview || form.profileImage!} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-[18px] font-medium text-brand select-none">{initials || <User size={24} className="text-brand" />}</span>
              )}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-bg-main border border-elements
                flex items-center justify-center hover:bg-bg-sub transition-colors shadow-sm"
            >
              <Camera size={13} strokeWidth={1.75} className="text-text-main" />
            </button>
          </div>
          <div className="flex flex-col gap-1.5">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="h-9 px-4 rounded-lg border border-elements text-[14px] font-medium text-text-main
                hover:bg-bg-sub transition-colors disabled:opacity-50"
            >
              {uploading ? "Uploading…" : "Change photo"}
            </button>
            <p className="text-[13px] text-text-sub">JPG or PNG, max 4MB</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      </div>

      <div className="h-px bg-elements/50 my-8" />

      {/* -- Basic info ----------------------------------------------------- */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-0.5">
          <p className="text-[18px] font-medium text-text-main">Basic Information</p>
          <p className="text-[16px] text-text-sub">Your name and contact details patients will see.</p>
        </div>

        <div>
          <label className={label}>Full Name</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => onChange({ name: e.target.value })}
            className={input}
            placeholder="Dr. First Last"
          />
        </div>

        <div>
          <label className={label}>Contact Number</label>
          <div className="flex items-center h-11 rounded-lg border border-elements bg-bg-main
            focus-within:border-text-main transition-colors duration-200">
            <span className="px-3 text-[16px] text-text-sub border-r border-elements h-full
              flex items-center shrink-0">+63</span>
            <input
              type="tel"
              value={form.contactNumber.replace(/^\+63/, "")}
              onChange={(e) => onChange({ contactNumber: e.target.value.replace(/\D/g, "") })}
              className="flex-1 h-full px-3 text-[16px] text-text-main outline-none bg-transparent"
              placeholder="917 123 4567"
            />
          </div>
        </div>
      </div>

      <div className="h-px bg-elements/50 my-8" />

      {/* -- Professional details ------------------------------------------- */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-0.5">
          <p className="text-[18px] font-medium text-text-main">Professional Details</p>
          <p className="text-[16px] text-text-sub">Your credentials and expertise.</p>
        </div>

        <div>
          <label className={label}>Specializations</label>
          <SearchableMultiSelect
            selected={form.specializations}
            options={SPECIALIZATIONS}
            onChange={(v) => onChange({ specializations: v })}
            placeholder="Select your specializations"
          />
        </div>

        <div>
          <label className={label}>PRC License Number</label>
          <input
            type="text"
            value={form.prcLicense}
            onChange={(e) => onChange({ prcLicense: e.target.value.replace(/\D/g, "").slice(0, 7) })}
            className={input}
            placeholder="7-digit PRC number"
            maxLength={7}
          />
        </div>

        <div>
          <label className={label}>Years of Experience</label>
          <input
            type="number"
            value={form.yearsOfExperience}
            onChange={(e) => onChange({ yearsOfExperience: e.target.value })}
            onKeyDown={(e) => ["e", "E", "+", "-"].includes(e.key) && e.preventDefault()}
            min={0}
            max={60}
            className={`${input} [appearance:textfield] [&::-webkit-outer-spin-button]:hidden [&::-webkit-inner-spin-button]:hidden`}
            placeholder="e.g. 5"
          />
        </div>

        <div>
          <div className="flex items-end justify-between mb-1.5">
            <label className={label} style={{ marginBottom: 0 }}>Bio</label>
            <span className={`text-[13px] ${bioOverLimit ? "text-error" : "text-text-sub"}`}>
              {bioCharsLeft} / {BIO_MAX}
            </span>
          </div>
          <textarea
            value={form.bio}
            onChange={(e) => onChange({ bio: e.target.value.slice(0, BIO_MAX) })}
            rows={4}
            className="w-full px-3 py-2.5 rounded-lg border border-elements text-[16px] text-text-main
              outline-none focus:border-text-main transition-colors duration-200 bg-bg-main
              resize-none leading-relaxed"
            placeholder="Tell patients about yourself, your approach, and expertise…"
          />
        </div>

        <div>
          <label className={label}>Languages Spoken</label>
          <SearchableMultiSelect
            selected={form.languages}
            options={LANGUAGES}
            onChange={(v) => onChange({ languages: v })}
            placeholder="Select languages"
          />
        </div>
      </div>

      <div className="h-px bg-elements/50 my-8" />

      {/* -- Education ------------------------------------------------------ */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-0.5">
          <p className="text-[18px] font-medium text-text-main">Education</p>
          <p className="text-[16px] text-text-sub">Your medical school and residency training.</p>
        </div>

        <div>
          <label className={label}>Medical School</label>
          <input
            type="text"
            value={form.education.medicalSchool}
            onChange={(e) => onChange({ education: { ...form.education, medicalSchool: e.target.value } })}
            className={input}
            placeholder="e.g. University of the Philippines College of Medicine"
          />
        </div>

        <div>
          <label className={label}>Residency</label>
          <input
            type="text"
            value={form.education.residency}
            onChange={(e) => onChange({ education: { ...form.education, residency: e.target.value } })}
            className={input}
            placeholder="e.g. Philippine General Hospital"
          />
        </div>
      </div>

      <div className="h-px bg-elements/50 my-8" />

      {/* -- Certifications & Affiliations ---------------------------------- */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-0.5">
          <p className="text-[18px] font-medium text-text-main">Certifications & Affiliations</p>
          <p className="text-[16px] text-text-sub">Board certifications and hospital/organization affiliations.</p>
        </div>

        <div>
          <label className={label}>Certifications</label>
          <TagInput
            tags={form.certifications}
            onChange={(v) => onChange({ certifications: v })}
            placeholder="e.g. Board Certified Cardiologist, then press ↵ Enter"
          />
        </div>

        <div>
          <label className={label}>Affiliations</label>
          <TagInput
            tags={form.affiliations}
            onChange={(v) => onChange({ affiliations: v })}
            placeholder="e.g. Philippine Heart Center, then press ↵ Enter"
          />
        </div>
      </div>

      <div className="h-px bg-elements/50 my-8" />

      {/* -- Availability --------------------------------------------------- */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-0.5">
          <p className="text-[18px] font-medium text-text-main">Consultation Fee & Schedule</p>
          <p className="text-[16px] text-text-sub">100% goes to you. SwiftCare charges no platform fees.</p>
        </div>

        {/* Consultation fee */}
        <div>
          <label className={label}>Consultation Fee</label>
          <div className="flex items-center h-11 rounded-lg border border-elements overflow-hidden
            focus-within:border-text-main transition-colors duration-200 bg-bg-main">
            <div className="flex items-center px-3 h-full border-r border-elements shrink-0">
              <span className="text-[16px] text-text-sub select-none">PHP</span>
            </div>
            <input
              type="number"
              value={form.consultationFee}
              onChange={(e) => onChange({ consultationFee: e.target.value })}
              onKeyDown={(e) => ["e", "E", "+", "-"].includes(e.key) && e.preventDefault()}
              placeholder="0"
              min={0}
              className="flex-1 h-full px-3 text-[16px] text-text-main bg-transparent outline-none
                [appearance:textfield] [&::-webkit-outer-spin-button]:hidden [&::-webkit-inner-spin-button]:hidden"
            />
          </div>
          <p className="text-[13px] text-text-sub mt-1.5">Enter a value between ₱100 and ₱5,000</p>
        </div>

        {/* Day toggles */}
        <div className="flex flex-col gap-3">
          <label className={label} style={{ marginBottom: 0 }}>Weekly Schedule</label>
          <div className="flex gap-2">
            {DAYS.map((day) => {
              const enabled = form.schedule[day]?.enabled;
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={`flex-1 h-8 rounded-lg text-[13px] font-medium transition-all duration-200
                    ${enabled
                      ? "bg-text-main text-brand-sub"
                      : "bg-bg-sub border border-elements text-text-sub hover:text-text-main hover:border-text-sub"
                    }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {enabledDays.length > 0 && (
            <div className="flex flex-col pt-1 divide-y divide-elements">
              {enabledDays.map((day) => {
                const { startTime, endTime, breaks = [] } = form.schedule[day];
                const timeInvalid = startTime && endTime && timeToMinutes(startTime) >= timeToMinutes(endTime);

                return (
                  <div key={day} className="flex flex-col gap-2 pt-4 pb-4 first:pt-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <span className="text-[14px] text-text-sub w-8 shrink-0">{day}</span>
                      <TimeSelect
                        value={startTime}
                        onChange={(v) => updateDay(day, { startTime: v })}
                        borderClass={timeInvalid ? "border-error" : "border-elements focus:border-text-main"}
                      />
                      <span className="text-[14px] text-text-sub shrink-0">to</span>
                      <TimeSelect
                        value={endTime}
                        onChange={(v) => updateDay(day, { endTime: v })}
                        borderClass={timeInvalid ? "border-error" : "border-elements focus:border-text-main"}
                      />
                    </div>

                    <div className="pl-11">
                      <button
                        type="button"
                        onClick={() => addBreak(day)}
                        className="flex items-center gap-1.5 h-7 px-2.5 rounded-md border border-elements
                          text-[13px] text-text-sub hover:border-text-sub hover:text-text-main transition-colors duration-150"
                      >
                        <Plus size={12} strokeWidth={1.75} />
                        Add break
                      </button>
                    </div>

                    {breaks.map((brk, idx) => {
                      const err = breakError(day, brk, idx);
                      return (
                        <div key={idx} className="flex flex-col gap-1 pl-11">
                          <div className="flex items-center gap-3">
                            <TimeSelect
                              value={brk.startTime}
                              onChange={(v) => updateBreak(day, idx, { startTime: v })}
                              borderClass={err ? "border-error" : "border-elements focus:border-text-main"}
                              height="h-8"
                            />
                            <span className="text-[14px] text-text-sub shrink-0">to</span>
                            <TimeSelect
                              value={brk.endTime}
                              onChange={(v) => updateBreak(day, idx, { endTime: v })}
                              borderClass={err ? "border-error" : "border-elements focus:border-text-main"}
                              height="h-8"
                            />
                            <button type="button" onClick={() => removeBreak(day, idx)}
                              className="shrink-0 text-text-sub hover:text-text-main transition-colors">
                              <X size={14} strokeWidth={1.75} />
                            </button>
                          </div>
                          {err && (
                            <p className="text-[13px] text-error leading-normal animate-fadeInDown"
                              style={{ animationDuration: "200ms" }}>
                              {err}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* -- Unsaved changes banner ----------------------------------------- */}
      <div
        className="sticky bottom-6 mt-8"
        style={{
          opacity:       isDirty ? 1 : 0,
          transform:     isDirty ? "translateY(0)" : "translateY(14px)",
          pointerEvents: isDirty ? "auto" : "none",
          transition:    "opacity 220ms ease, transform 220ms ease",
        }}
      >
        <div key={shakeCount} className={shakeCount > 0 ? "animate-shake" : ""}>
          <div
            className="rounded-xl flex items-center justify-between px-5 py-3.5"
            style={{
              backgroundColor: bannerWarn ? "rgb(254 242 242)"            : "var(--brand-sub)",
              border:          bannerWarn ? "1px solid rgba(226,79,98,0.4)" : "1px solid rgba(0,135,134,0.3)",
              boxShadow:       bannerWarn ? "0 4px 16px rgba(226,79,98,0.14)" : "0 4px 16px rgba(0,135,134,0.12)",
              transition:      "background-color 300ms ease, border-color 300ms ease, box-shadow 300ms ease",
            }}
          >
            <p className="text-[14px] font-medium text-text-main">You have unsaved changes.</p>
            <div className="flex items-center gap-4">
              <button type="button" onClick={onReset}
                className="text-[14px] font-medium text-text-main hover:text-text-sub transition-colors">
                Reset
              </button>
              <button type="button" onClick={onSave} disabled={saving}
                className="h-9 px-4 rounded-lg bg-success text-white text-[14px] font-medium
                  hover:opacity-90 transition-opacity duration-150 disabled:opacity-50">
                {saving ? "Saving…" : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
