"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Mic, Paperclip, ArrowUp, X, ImagePlus, Stethoscope, UserCheck, ClipboardList, GitCompare, MapPin } from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────

const PLACEHOLDERS = [
  "I'm feeling a bit under the weather...",
  "I need to see a dermatologist...",
  "My back has been bothering me...",
  "I'd like to get a general checkup...",
  "I've been feeling tired lately...",
  "I need help with a prescription...",
  "I've been having headaches...",
  "I haven't been sleeping well...",
];

const CHIPS = [
  { icon: Stethoscope,    label: "Find a doctor" },
  { icon: UserCheck,      label: "Recommend a specialist" },
  { icon: ClipboardList,  label: "Prepare for my consultation" },
  { icon: GitCompare,     label: "Compare doctors" },
  { icon: MapPin,         label: "Find nearby doctors" },
];

// ─── Component ────────────────────────────────────────────────────────────────

interface HeroSearchProps {
  onSubmit?: (text: string, file?: File | null) => void;
}

export function HeroSearch({ onSubmit }: HeroSearchProps = {}) {
  const router = useRouter();

  const [query,            setQuery]            = useState("");
  const [focused,          setFocused]          = useState(true);
  const [file,             setFile]             = useState<File | null>(null);
  const [isListening,      setIsListening]      = useState(false);
  const [hasMic,           setHasMic]           = useState(false);
  const [placeholderIdx,   setPlaceholderIdx]   = useState(0);
  const [placeholderFaded, setPlaceholderFaded] = useState(false);
  const [isAnimating,      setIsAnimating]      = useState(false);
  const [isSending,        setIsSending]        = useState(false);

  const textareaRef      = useRef<HTMLTextAreaElement>(null);
  const fileRef          = useRef<HTMLInputElement>(null);
  const photoRef         = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setHasMic(!!(
      (window as Window & { SpeechRecognition?: unknown }).SpeechRecognition ||
      (window as Window & { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition
    ));
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setPlaceholderFaded(true);
      setTimeout(() => {
        setPlaceholderIdx((i) => (i + 1) % PLACEHOLDERS.length);
        setPlaceholderFaded(false);
      }, 300);
    }, 3500);
    return () => clearInterval(id);
  }, []);

  // Sync textarea height whenever query changes (including programmatic updates)
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 200) + "px";
  }, [query]);

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setQuery(e.target.value);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  function handleSubmit(q?: string) {
    const text = (q ?? query).trim();
    if (!text && !file) return;
    if (onSubmit) {
      onSubmit(text, file);
    } else {
      router.push(
        text
          ? `/patient/ai-recommend?q=${encodeURIComponent(text)}`
          : "/patient/ai-recommend"
      );
    }
  }

  function handleChip(chip: string) {
    if (isAnimating) return;
    setIsAnimating(true);
    setQuery("");
    textareaRef.current?.focus();

    let i = 0;
    function typeNext() {
      i++;
      setQuery(chip.slice(0, i));
      if (i < chip.length) {
        setTimeout(typeNext, 16 + Math.random() * 10);
      } else {
        setTimeout(() => {
          setIsSending(true);
          setTimeout(() => {
            if (onSubmit) {
              onSubmit(chip, file);
            } else {
              router.push(`/patient/ai-recommend?q=${encodeURIComponent(chip)}`);
            }
          }, 260);
        }, 80);
      }
    }
    setTimeout(typeNext, 30);
  }

  function handleMic() {
    type AnyRecognition = {
      continuous: boolean; interimResults: boolean;
      onstart: (() => void) | null; onend: (() => void) | null;
      onresult: ((e: { results: { [i: number]: { [i: number]: { transcript: string } } } }) => void) | null;
      start: () => void;
    };
    type RecognitionCtor = new () => AnyRecognition;
    const SpeechRecognitionAPI: RecognitionCtor | undefined =
      (window as unknown as Record<string, RecognitionCtor>).SpeechRecognition ??
      (window as unknown as Record<string, RecognitionCtor>).webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) return;
    const rec = new SpeechRecognitionAPI();
    rec.continuous     = false;
    rec.interimResults = false;
    rec.onstart  = () => setIsListening(true);
    rec.onend    = () => setIsListening(false);
    rec.onresult = (e) => { setQuery(e.results[0][0].transcript); textareaRef.current?.focus(); };
    rec.start();
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto">

      {/* ── Heading ──────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-2 text-center">
        <h2 className="text-[32px] font-medium text-text-main tracking-[-0.03em] leading-tight">
          Good to see you. How are you feeling today?
        </h2>
        <p className="text-[16px] text-text-main">
          Find a doctor or describe what you&apos;re feeling.
        </p>
      </div>

      {/* ── Card ─────────────────────────────────────────────────────── */}
      <div className="relative">

      <div
        className="relative bg-white rounded-2xl overflow-hidden border border-elements"
        style={{ animation: "glow-trace-ccw 14s linear infinite" }}
      >
        {/* File preview */}
        {file && (
          <div className="px-5 pt-4">
            <div className="inline-flex items-center gap-2 bg-bg-sub rounded-lg px-3 py-2 text-[16px] text-text-sub">
              <Paperclip size={13} strokeWidth={2} className="text-brand shrink-0" />
              <span className="truncate max-w-48">{file.name}</span>
              <button
                type="button"
                onClick={() => setFile(null)}
                className="ml-0.5 hover:text-error transition-colors duration-150"
              >
                <X size={13} strokeWidth={2} />
              </button>
            </div>
          </div>
        )}

        {/* Textarea */}
        <div className="relative px-5 pt-5 pb-3">
          {!query && (
            <span
              aria-hidden
              className={`
                absolute inset-x-5 top-5
                text-[16px] text-text-sub pointer-events-none select-none leading-6
                transition-opacity duration-300
                ${placeholderFaded ? "opacity-0" : "opacity-50"}
              `}
            >
              {PLACEHOLDERS[placeholderIdx]}
            </span>
          )}
          <textarea
            ref={textareaRef}
            value={query}
            autoFocus
            rows={1}
            placeholder=""
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            className="
              w-full resize-none bg-transparent outline-none
              text-[16px] text-text-main leading-6 overflow-y-auto
            "
            style={{ minHeight: "64px", maxHeight: "200px" }}
          />
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => photoRef.current?.click()}
              className="h-8 px-3 flex items-center gap-1.5 rounded-lg border border-elements text-[13px] text-text-main hover:bg-bg-sub hover:border-text-sub transition-all duration-150"
            >
              <ImagePlus size={14} strokeWidth={1.75} />
              Add a photo
            </button>
            <input
              ref={photoRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />

            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="h-8 px-3 flex items-center gap-1.5 rounded-lg border border-elements text-[13px] text-text-main hover:bg-bg-sub hover:border-text-sub transition-all duration-150"
            >
              <Paperclip size={14} strokeWidth={1.75} />
              Attach prescription
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*,.pdf"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </div>

          <div className="flex items-center gap-2">
            {hasMic && (
              <button
                type="button"
                onClick={handleMic}
                title="Voice input"
                className={`
                  w-9 h-9 flex items-center justify-center rounded-xl
                  transition-colors duration-150
                  ${isListening ? "text-error bg-error/10" : "text-text-main hover:bg-bg-sub"}
                `}
              >
                <Mic size={18} strokeWidth={2} />
              </button>
            )}
            <button
              type="button"
              onClick={() => handleSubmit()}
              title="Send"
              className={`
                w-9 h-9 flex items-center justify-center rounded-xl
                bg-brand text-white
                hover:opacity-90 active:scale-95
                transition-all duration-150
                ${isSending ? "scale-110 brightness-110 shadow-[0_0_12px_rgba(0,135,134,0.5)]" : ""}
              `}
            >
              <ArrowUp
                size={18}
                strokeWidth={2.5}
                className={`transition-transform duration-200 ${isSending ? "-translate-y-0.5" : ""}`}
              />
            </button>
          </div>
        </div>

      </div>
      </div>

      {/* ── Suggestions ──────────────────────────────────────────────── */}
      <div className="px-1">
<div className="flex flex-wrap gap-2 justify-center">
          {CHIPS.map(({ icon: Icon, label }) => (
            <button
              key={label}
              type="button"
              onClick={() => handleChip(label)}
              disabled={isAnimating}
              className="
                px-4 py-2 rounded-lg flex items-center gap-2
                text-[14px] text-text-main
                bg-white/64 border border-elements
                hover:border-brand hover:bg-brand-sub
                transition-all duration-150 leading-none
                disabled:opacity-50 disabled:cursor-not-allowed
              "
            >
              <Icon size={14} strokeWidth={1.75} />
              {label}
            </button>
          ))}
        </div>
      </div>


    </div>
  );
}
