"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  ArrowUp, ImagePlus, Paperclip, Mic, X, RotateCcw, Stethoscope,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface AttachedFile {
  name:       string;
  type:       string;
  base64:     string;
  previewUrl: string;
}

interface SwiftFilters {
  specialty?:       string;
  maxFee?:          number;
  language?:        string;
  timePreference?:  string;
  availability?:    string;
}

interface Message {
  id:          string;
  role:        "user" | "swift";
  content:     string;
  file?:       AttachedFile;
  filters?:    SwiftFilters | null;
  isStreaming?: boolean;
}

interface SwiftChatProps {
  initialMessage: string;
  initialFile?:   File | null;
  onClear:        () => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

async function readFileAsBase64(file: File): Promise<AttachedFile> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1];
      resolve({
        name:       file.name,
        type:       file.type,
        base64,
        previewUrl: URL.createObjectURL(file),
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Strip markdown bold/italic and filter block from visible text
function cleanText(raw: string): string {
  const idx = raw.indexOf("[SWIFT_FILTERS]");
  const clipped = idx !== -1 ? raw.slice(0, idx) : raw;
  return clipped.replace(/\*\*([^*]+)\*\*/g, "$1").replace(/\*([^*]+)\*/g, "$1").trim();
}

// Strip the filter block from visible text during streaming
function displayText(raw: string): string {
  return cleanText(raw);
}

// Parse the filter block from a complete response
function parseFilters(raw: string): { cleanText: string; filters: SwiftFilters | null } {
  const match = raw.match(/\[SWIFT_FILTERS\]([\s\S]*?)\[\/SWIFT_FILTERS\]/);
  const stripped = raw.replace(/\[SWIFT_FILTERS\][\s\S]*?\[\/SWIFT_FILTERS\]/, "");
  const text = cleanText(stripped);
  if (!match) return { cleanText: text, filters: null };
  try {
    const jsonStr = match[1].trim().replace(/'/g, '"');
    const filters = JSON.parse(jsonStr) as SwiftFilters;
    return { cleanText: text, filters };
  } catch {
    return { cleanText: text, filters: null };
  }
}

function buildDoctorUrl(f: SwiftFilters): string {
  const p = new URLSearchParams();
  if (f.specialty)      p.set("specialties",  f.specialty);
  if (f.maxFee)         p.set("maxFee",        String(f.maxFee));
  if (f.language)       p.set("languages",     f.language);
  if (f.timePreference) p.set("timePref",      f.timePreference);
  return `/patient/doctors?${p.toString()}`;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SwiftAvatar() {
  return (
    <div className="w-8 h-8 rounded-full bg-brand flex items-center justify-center shrink-0 mt-0.5">
      <span className="text-[13px] font-semibold text-white select-none">S</span>
    </div>
  );
}

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1 h-4 ml-1">
      {[0, 1, 2].map(i => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-text-sub animate-bounce"
          style={{ animationDelay: `${i * 120}ms`, animationDuration: "800ms" }}
        />
      ))}
    </span>
  );
}

function FilePreviewBubble({ file }: { file: AttachedFile }) {
  const isImage = file.type.startsWith("image/");
  return isImage ? (
    <img
      src={file.previewUrl}
      alt={file.name}
      className="max-w-55 rounded-xl object-cover border border-elements/40"
    />
  ) : (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/60 border border-elements text-[14px] text-text-sub">
      <Paperclip size={13} strokeWidth={1.75} className="text-brand shrink-0" />
      <span className="truncate max-w-45">{file.name}</span>
    </div>
  );
}

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end gap-2 animate-fadeInDown">
        <div className="flex flex-col items-end gap-1.5 max-w-[72%]">
          {msg.file && <FilePreviewBubble file={msg.file} />}
          {msg.content && (
            <div className="bg-brand-sub text-text-main text-[16px] leading-relaxed px-4 py-2.5 rounded-2xl rounded-tr-sm border border-brand/30">
              {msg.content}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Swift message
  const text    = msg.isStreaming ? displayText(msg.content) : msg.content;
  const isEmpty = !text && msg.isStreaming;

  return (
    <div className="flex items-start gap-3 animate-fadeInDown">
      <SwiftAvatar />
      <div className="flex flex-col gap-3 max-w-[72%]">
        <div className="bg-bg-main border border-elements text-text-main text-[16px] leading-relaxed px-4 py-2.5 rounded-2xl rounded-tl-sm">
          {isEmpty ? (
            <TypingDots />
          ) : (
            <span>
              {text}
              {msg.isStreaming && <span className="inline-block w-0.5 h-4 bg-brand ml-0.5 animate-pulse align-middle" />}
            </span>
          )}
        </div>

        {/* Find a doctor button — shown when filters are present and streaming is done */}
        {!msg.isStreaming && msg.filters && (
          <Link
            href={buildDoctorUrl(msg.filters)}
            className="self-start flex items-center gap-2 h-9 px-4 rounded-lg bg-brand text-white
              text-[14px] font-medium hover:opacity-90 active:scale-[0.99] transition-all duration-200"
          >
            <Stethoscope size={14} strokeWidth={1.75} />
            Find a doctor
          </Link>
        )}
      </div>
    </div>
  );
}

// ── Input bar (mirrors HeroSearch card) ───────────────────────────────────────

interface InputBarProps {
  onSend:    (text: string, file?: File | null) => void;
  disabled?: boolean;
}

function InputBar({ onSend, disabled }: InputBarProps) {
  const [query,       setQuery]       = useState("");
  const [file,        setFile]        = useState<File | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [hasMic,      setHasMic]      = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const photoRef    = useRef<HTMLInputElement>(null);
  const fileRef     = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setHasMic(!!(
      (window as Window & { SpeechRecognition?: unknown }).SpeechRecognition ||
      (window as Window & { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition
    ));
  }, []);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  }, [query]);

  function submit() {
    const text = query.trim();
    if (!text && !file) return;
    onSend(text, file);
    setQuery("");
    setFile(null);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); }
  }

  function handleMic() {
    type AnyRecognition = {
      continuous: boolean; interimResults: boolean;
      onstart: (() => void) | null; onend: (() => void) | null;
      onresult: ((e: { results: { [i: number]: { [i: number]: { transcript: string } } } }) => void) | null;
      start: () => void;
    };
    type RecognitionCtor = new () => AnyRecognition;
    const API: RecognitionCtor | undefined =
      (window as unknown as Record<string, RecognitionCtor>).SpeechRecognition ??
      (window as unknown as Record<string, RecognitionCtor>).webkitSpeechRecognition;
    if (!API) return;
    const rec = new API();
    rec.continuous = false; rec.interimResults = false;
    rec.onstart  = () => setIsListening(true);
    rec.onend    = () => setIsListening(false);
    rec.onresult = (e) => { setQuery(e.results[0][0].transcript); textareaRef.current?.focus(); };
    rec.start();
  }

  const canSend = (query.trim().length > 0 || !!file) && !disabled;

  return (
    <div
      className="relative bg-white rounded-2xl overflow-hidden border border-elements shrink-0"
      style={{ animation: "glow-trace-ccw 14s linear infinite" }}
    >
      {/* File preview */}
      {file && (
        <div className="px-5 pt-4">
          <div className="inline-flex items-center gap-2 bg-bg-sub rounded-lg px-3 py-2 text-[14px] text-text-sub">
            <Paperclip size={13} strokeWidth={2} className="text-brand shrink-0" />
            <span className="truncate max-w-48">{file.name}</span>
            <button type="button" onClick={() => setFile(null)} className="ml-0.5 hover:text-error transition-colors duration-150">
              <X size={13} strokeWidth={2} />
            </button>
          </div>
        </div>
      )}

      {/* Textarea */}
      <div className="px-5 pt-4 pb-3">
        <textarea
          ref={textareaRef}
          value={query}
          rows={1}
          placeholder="Ask a follow-up…"
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className="w-full resize-none bg-transparent outline-none text-[16px] text-text-main leading-6 overflow-y-auto placeholder:text-text-sub/50 disabled:opacity-50"
          style={{ minHeight: "40px", maxHeight: "160px" }}
        />
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => photoRef.current?.click()}
            disabled={disabled}
            className="h-8 px-3 flex items-center gap-1.5 rounded-lg border border-elements text-[14px] text-text-main hover:bg-bg-sub hover:border-text-sub transition-all duration-150 disabled:opacity-40"
          >
            <ImagePlus size={14} strokeWidth={1.75} />
            Add a photo
          </button>
          <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={e => setFile(e.target.files?.[0] ?? null)} />

          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={disabled}
            className="h-8 px-3 flex items-center gap-1.5 rounded-lg border border-elements text-[14px] text-text-main hover:bg-bg-sub hover:border-text-sub transition-all duration-150 disabled:opacity-40"
          >
            <Paperclip size={14} strokeWidth={1.75} />
            Attach prescription
          </button>
          <input ref={fileRef} type="file" accept="image/*,.pdf" className="hidden" onChange={e => setFile(e.target.files?.[0] ?? null)} />
        </div>

        <div className="flex items-center gap-2">
          {hasMic && (
            <button
              type="button"
              onClick={handleMic}
              disabled={disabled}
              className={`w-9 h-9 flex items-center justify-center rounded-xl transition-colors duration-150 disabled:opacity-40 ${isListening ? "text-error bg-error/10" : "text-text-main hover:bg-bg-sub"}`}
            >
              <Mic size={18} strokeWidth={2} />
            </button>
          )}
          <button
            type="button"
            onClick={submit}
            disabled={!canSend}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-brand text-white hover:opacity-90 active:scale-95 transition-all duration-150 disabled:opacity-40"
          >
            <ArrowUp size={18} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function SwiftChat({ initialMessage, initialFile, onClear }: SwiftChatProps) {
  const [messages,    setMessages]    = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const sentRef   = useRef(false);

  const streamReply = useCallback(async (
    allMessages: Message[],
    replyId: string,
    imageBase64?: string,
    imageMimeType?: string,
  ) => {
    setIsStreaming(true);

    // Build API payload (user + assistant turns, text only for history)
    const apiMessages = allMessages
      .filter(m => m.role === "user" || (m.role === "swift" && m.id !== replyId && !m.isStreaming))
      .map(m => ({ role: m.role === "user" ? "user" : "assistant" as const, content: m.content }));

    // Append the last user message
    const lastUser = allMessages.filter(m => m.role === "user").at(-1);
    if (!lastUser) return;
    if (!apiMessages.find(m => m.role === "user" && m.content === lastUser.content)) {
      apiMessages.push({ role: "user", content: lastUser.content });
    }

    try {
      const res = await fetch("/api/ai/swift", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages, imageBase64, imageMimeType }),
      });

      if (res.status === 429) throw new Error("BUSY");
      if (!res.ok) throw new Error("API error");

      const reader  = res.body!.getReader();
      const decoder = new TextDecoder();
      let   accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setMessages(prev => prev.map(m =>
          m.id === replyId ? { ...m, content: accumulated } : m
        ));
      }

      // Done streaming — parse filters, clean text
      const { cleanText, filters } = parseFilters(accumulated);
      setMessages(prev => prev.map(m =>
        m.id === replyId
          ? { ...m, content: cleanText, filters: filters ?? null, isStreaming: false }
          : m
      ));

    } catch (err) {
      const isBusy = String(err).includes("BUSY");
      setMessages(prev => prev.map(m =>
        m.id === replyId
          ? {
              ...m,
              content: isBusy
                ? "Swift is a little busy right now. Please try again in a moment!"
                : "I'm having a bit of trouble right now. Please try again in a moment!",
              isStreaming: false,
            }
          : m
      ));
    } finally {
      setIsStreaming(false);
    }
  }, []);

  // Send initial message on mount
  useEffect(() => {
    if (sentRef.current || !initialMessage) return;
    sentRef.current = true;

    async function init() {
      let attachedFile: AttachedFile | undefined;
      if (initialFile) {
        attachedFile = await readFileAsBase64(initialFile);
      }

      const userMsg: Message = {
        id:      uid(),
        role:    "user",
        content: initialMessage,
        file:    attachedFile,
      };
      const replyId  = uid();
      const replyMsg: Message = { id: replyId, role: "swift", content: "", isStreaming: true };

      setMessages([userMsg, replyMsg]);
      await streamReply(
        [userMsg, replyMsg],
        replyId,
        attachedFile?.base64,
        attachedFile?.type,
      );
    }

    init();
  }, [initialMessage, initialFile, streamReply]);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(text: string, file?: File | null) {
    if (isStreaming) return;

    let attachedFile: AttachedFile | undefined;
    if (file) attachedFile = await readFileAsBase64(file);

    const userMsg: Message = { id: uid(), role: "user", content: text, file: attachedFile };
    const replyId  = uid();
    const replyMsg: Message = { id: replyId, role: "swift", content: "", isStreaming: true };

    const next = [...messages, userMsg, replyMsg];
    setMessages(next);
    await streamReply(next, replyId, attachedFile?.base64, attachedFile?.type);
  }

  return (
    <div className="flex flex-col h-full min-h-0">

      {/* Header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-brand flex items-center justify-center">
            <span className="text-[11px] font-semibold text-white select-none">S</span>
          </div>
          <span className="text-[16px] font-medium text-text-main">Swift</span>
          <span className="text-[14px] text-text-sub">· Health assistant</span>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="flex items-center gap-1.5 text-[14px] text-text-sub hover:text-text-main transition-colors duration-150"
        >
          <RotateCcw size={13} strokeWidth={1.75} />
          Clear conversation
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto min-h-0 flex flex-col gap-4 pr-1 pb-4 scrollbar-hide">
        {messages.map(msg => (
          <MessageBubble key={msg.id} msg={msg} />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 mt-4">
        <InputBar onSend={handleSend} disabled={isStreaming} />
      </div>

    </div>
  );
}
