"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { Camera, Check, User, X } from "lucide-react";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";
import type { DoctorProfileData } from "./DoctorProfileFlow";
import { useUploadThing } from "@/lib/uploadthing-client";

interface Props {
  data: DoctorProfileData;
  onChange: (patch: Partial<DoctorProfileData>) => void;
  onContinue: () => void;
  triggerValidation: number;
}

function sanitizeName(str: string) {
  return str.replace(/[^a-zA-ZÀ-ÿ\s'.\-]/g, "");
}

function toTitleCase(str: string) {
  return str.replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatPhone(digits: string): string {
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
  return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
}

function isValidPhone(n: string) {
  return n.length === 10 && n.startsWith("9");
}

function isAtLeast18(birthday: string): boolean {
  if (!birthday) return false;
  const today = new Date();
  const birth = new Date(birthday + "T00:00:00");
  const age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  return (m < 0 || (m === 0 && today.getDate() < birth.getDate())) ? age - 1 >= 18 : age >= 18;
}

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

export function DoctorStep1Profile({ data, onChange, onContinue, triggerValidation }: Props) {
  const [phoneFocused,     setPhoneFocused]     = useState(false);
  const [phoneTouched,     setPhoneTouched]     = useState(false);
  const [birthdayTouched,  setBirthdayTouched]  = useState(false);
  const [firstNameTouched, setFirstNameTouched] = useState(false);
  const [lastNameTouched,  setLastNameTouched]  = useState(false);

  const [preview,          setPreview]          = useState(data.profileImage || "");
  const [uploading,        setUploading]        = useState(false);
  const [uploadProgress,   setUploadProgress]   = useState(0);

  // Crop state
  const [cropSrc,              setCropSrc]              = useState("");
  const [crop,                 setCrop]                 = useState({ x: 0, y: 0 });
  const [zoom,                 setZoom]                 = useState(1);
  const [croppedAreaPixels,    setCroppedAreaPixels]    = useState<Area | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const { startUpload } = useUploadThing("profileImage", {
    onUploadProgress: (p) => setUploadProgress(p),
    onClientUploadComplete: (res) => {
      const url = res[0]?.ufsUrl ?? res[0]?.url ?? "";
      onChange({ profileImage: url });
      setUploading(false);
      setUploadProgress(0);
    },
    onUploadError: () => {
      setUploading(false);
      setUploadProgress(0);
    },
  });

  useEffect(() => {
    if (triggerValidation > 0) {
      setPhoneTouched(true);
      setBirthdayTouched(true);
      setFirstNameTouched(true);
      setLastNameTouched(true);
    }
  }, [triggerValidation]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    setCropSrc(objectUrl);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    e.target.value = "";
  }

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  async function handleCropConfirm() {
    if (!croppedAreaPixels) return;
    const croppedFile = await getCroppedFile(cropSrc, croppedAreaPixels);
    const localUrl = URL.createObjectURL(croppedFile);
    setPreview(localUrl);
    setCropSrc("");
    setUploading(true);
    await startUpload([croppedFile]);
  }

  function handlePhoneChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw       = e.target.value.replace(/\D/g, "");
    const noCountry = raw.startsWith("63") ? raw.slice(2) : raw;
    const stripped  = noCountry.startsWith("0") ? noCountry.slice(1) : noCountry;
    onChange({ contactNumber: stripped.slice(0, 10) });
  }

  const firstNameValid = !!data.firstName.trim();
  const lastNameValid  = !!data.lastName.trim();
  const birthdayValid  = !!data.birthday && isAtLeast18(data.birthday);
  const phoneValid     = isValidPhone(data.contactNumber);

  const firstNameError = firstNameTouched && !firstNameValid;
  const lastNameError  = lastNameTouched  && !lastNameValid;
  const birthdayError  = birthdayTouched  && !birthdayValid;
  const phoneError     = phoneTouched && !phoneFocused && !phoneValid;

  function phoneBorderClass() {
    if (phoneError)   return "border-error";
    if (phoneValid)   return "border-success";
    if (phoneFocused) return "border-text-main";
    return "border-elements";
  }

  const canContinue = firstNameValid && lastNameValid && birthdayValid && phoneValid;

  return (
    <>
      {/* -- Crop modal ------------------------------------------------ */}
      {cropSrc && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-6"
          onClick={() => setCropSrc("")}
        >
          <div
            className="flex flex-col w-full max-w-sm bg-white rounded-2xl overflow-hidden shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-3 flex items-center justify-between border-b border-elements">
              <span className="text-[14px] font-medium text-text-main">Crop image</span>
              <button
                type="button"
                onClick={() => setCropSrc("")}
                className="w-7 h-7 rounded-full flex items-center justify-center text-text-sub hover:text-text-main hover:bg-background-sub transition-colors duration-150"
              >
                <X size={14} strokeWidth={2.5} />
              </button>
            </div>
            <div className="relative w-full" style={{ height: 280 }}>
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
            <div className="px-4 py-4 flex items-center gap-3 border-t border-elements">
              <input
                type="range"
                min={1}
                max={3}
                step={0.01}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="flex-1 accent-text-main"
              />
              <button
                type="button"
                onClick={() => setCropSrc("")}
                className="h-9 px-4 rounded-lg border border-elements text-[13px] text-text-main hover:border-text-sub transition-colors duration-150 shrink-0"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCropConfirm}
                className="h-9 px-4 rounded-lg bg-text-main text-[13px] font-medium text-brand-sub hover:opacity-90 transition-all duration-200 shrink-0"
              >
                Use photo
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      <div className="flex flex-col gap-4">

        {/* -- Heading --------------------------------------------------- */}
        <div className="flex flex-col gap-0.5 animate-fadeInDown" style={{ animationDelay: "0ms" }}>
          <h1 className="text-[24px] font-medium text-text-main tracking-[-0.264px] leading-normal">
            Set up your profile
          </h1>
          <p className="text-[14px] text-text-sub leading-normal">
            This is how patients will see and recognize you.
          </p>
        </div>

        {/* -- Profile photo --------------------------------------------- */}
        <div className="flex flex-col gap-1.5 mt-3 animate-fadeInDown" style={{ animationDelay: "60ms" }}>
          <div className="flex flex-col gap-0.5">
            <label className="text-[14px] font-medium text-text-main">Profile photo</label>
            <p className="text-[14px] text-text-sub leading-normal">
              A professional photo in your white coat or scrubs against a plain background works best.
            </p>
          </div>
          <div className="flex flex-col items-center gap-3 mt-1">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="relative w-20 h-20 rounded-full shrink-0 group focus:outline-none"
            >
              {preview ? (
                <img src={preview} alt="Profile" className="w-full h-full rounded-full object-cover" />
              ) : (
                <div className="w-full h-full rounded-full bg-background-sub border border-elements flex items-center justify-center">
                  <User size={28} strokeWidth={1.75} className="text-text-sub" />
                </div>
              )}
              <div className="absolute inset-0 rounded-full bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <Camera size={16} strokeWidth={1.75} className="text-white" />
              </div>
              {uploading && (
                <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
                  <span className="text-white text-[12px] font-medium">{uploadProgress}%</span>
                </div>
              )}
            </button>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="h-8 px-3 rounded-lg border border-elements text-[13px] text-text-main hover:border-text-sub transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? "Uploading…" : data.profileImage ? "Change photo" : "Upload photo"}
              </button>
              {data.profileImage && !uploading && (
                <button
                  type="button"
                  onClick={() => { onChange({ profileImage: "" }); setPreview(""); }}
                  className="text-[13px] text-text-sub hover:text-error transition-colors duration-150"
                >
                  Remove
                </button>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        </div>

        {/* -- First name ------------------------------------------------ */}
        <div className="flex flex-col gap-1.5 animate-fadeInDown" style={{ animationDelay: "120ms" }}>
          <label className="text-[14px] font-medium text-text-main">First name</label>
          <div className="relative">
            <input
              type="text"
              autoComplete="off"
              value={data.firstName}
              onChange={(e) => onChange({ firstName: toTitleCase(sanitizeName(e.target.value)) })}
              onBlur={() => setFirstNameTouched(true)}
              placeholder="e.g. Maria"
              className={`w-full h-10 rounded-lg border px-4 ${firstNameValid ? "pr-10" : ""} text-[14px] text-text-main bg-white outline-none transition-colors duration-200 placeholder:text-text-sub focus:border-text-main ${firstNameError ? "border-error" : firstNameValid ? "border-success" : "border-elements"}`}
            />
            {firstNameValid && firstNameTouched && (
              <Check size={14} strokeWidth={2.5} className="absolute right-3 top-1/2 -translate-y-1/2 text-success pointer-events-none" />
            )}
          </div>
          {firstNameError && (
            <p className="text-[14px] text-error leading-normal animate-fadeInDown" style={{ animationDuration: "200ms" }}>
              Please enter your first name
            </p>
          )}
        </div>

        {/* -- Last name ------------------------------------------------- */}
        <div className="flex flex-col gap-1.5 animate-fadeInDown" style={{ animationDelay: "180ms" }}>
          <label className="text-[14px] font-medium text-text-main">Last name</label>
          <div className="relative">
            <input
              type="text"
              autoComplete="off"
              value={data.lastName}
              onChange={(e) => onChange({ lastName: toTitleCase(sanitizeName(e.target.value)) })}
              onBlur={() => setLastNameTouched(true)}
              placeholder="e.g. Santos"
              className={`w-full h-10 rounded-lg border px-4 ${lastNameValid ? "pr-10" : ""} text-[14px] text-text-main bg-white outline-none transition-colors duration-200 placeholder:text-text-sub focus:border-text-main ${lastNameError ? "border-error" : lastNameValid ? "border-success" : "border-elements"}`}
            />
            {lastNameValid && lastNameTouched && (
              <Check size={14} strokeWidth={2.5} className="absolute right-3 top-1/2 -translate-y-1/2 text-success pointer-events-none" />
            )}
          </div>
          {lastNameError && (
            <p className="text-[14px] text-error leading-normal animate-fadeInDown" style={{ animationDuration: "200ms" }}>
              Please enter your last name
            </p>
          )}
        </div>

        {/* -- Birthday -------------------------------------------------- */}
        <div className="flex flex-col gap-1.5 animate-fadeInDown" style={{ animationDelay: "240ms" }}>
          <label className="text-[14px] font-medium text-text-main">Birthday</label>
          <input
            type="date"
            autoComplete="off"
            value={data.birthday}
            onChange={(e) => onChange({ birthday: e.target.value })}
            onBlur={() => setBirthdayTouched(true)}
            className={`w-full h-10 rounded-lg border px-4 text-[14px] text-text-main bg-white outline-none transition-colors duration-200 focus:border-text-main ${
              birthdayError ? "border-error" : birthdayValid ? "border-success" : "border-elements"
            }`}
          />
          {birthdayError && (
            <p className="text-[14px] text-error leading-normal animate-fadeInDown" style={{ animationDuration: "200ms" }}>
              {!data.birthday ? "Please enter your birthday" : "You must be at least 18 years old"}
            </p>
          )}
        </div>

        {/* -- Contact number -------------------------------------------- */}
        <div className="flex flex-col gap-1.5 animate-fadeInDown" style={{ animationDelay: "300ms" }}>
          <label className="text-[14px] font-medium text-text-main">Contact number</label>
          <div className={`flex items-center h-10 rounded-lg border overflow-hidden transition-colors duration-200 ${phoneBorderClass()}`}>
            <div className="flex items-center gap-1.5 px-3 h-full border-r border-elements shrink-0">
              <span className="text-base leading-none select-none">🇵🇭</span>
              <span className="text-[14px] text-text-sub select-none">+63</span>
            </div>
            <input
              type="tel"
              value={formatPhone(data.contactNumber)}
              onChange={handlePhoneChange}
              onFocus={() => setPhoneFocused(true)}
              onBlur={() => { setPhoneFocused(false); setPhoneTouched(true); }}
              placeholder="9XX XXX XXXX"
              className={`flex-1 h-full px-3 ${phoneValid ? "pr-9" : ""} text-[14px] text-text-main bg-white outline-none placeholder:text-text-sub`}
            />
            {phoneValid && (
              <Check size={14} strokeWidth={2.5} className="text-success shrink-0 mr-3" />
            )}
          </div>
          {phoneError && (
            <p className="text-[14px] text-error leading-normal animate-fadeInDown" style={{ animationDuration: "200ms" }}>
              {data.contactNumber.length === 0 ? "Please enter your contact number" : "Enter a valid 10-digit mobile number (e.g. 917 123 4567)"}
            </p>
          )}
        </div>

        {/* -- Button ---------------------------------------------------- */}
        <div className="flex flex-col mt-4 animate-fadeInDown" style={{ animationDelay: "360ms" }}>
          <button
            type="button"
            onClick={onContinue}
            disabled={!canContinue}
            className={`w-full h-10 rounded-lg text-[14px] font-medium tracking-[-0.176px] text-brand-sub transition-all duration-200 ${canContinue ? "bg-text-main hover:opacity-90 cursor-pointer" : "bg-text-main/40 cursor-not-allowed"}`}
          >
            Continue
          </button>
        </div>

      </div>
    </>
  );
}
