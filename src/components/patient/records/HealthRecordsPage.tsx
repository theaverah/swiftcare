"use client";

import { useState, useEffect, useRef, useLayoutEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useSession } from "next-auth/react";
import { Search, Download, Eye, X } from "lucide-react";
import { toast } from "sonner";

// -- Types ---------------------------------------------------------------------

type RecordType = "prescription" | "consultation_note" | "lab_request" | "medical_certificate" | "referral";

interface Medication { name: string; dosage: string; frequency: string; duration: string; }
interface LabTest    { name: string; }

interface HealthRecord {
  id:       string;
  type:     RecordType;
  issuedAt: string;
  doctor: {
    name:            string;
    specializations: string[];
    profileImage:    string | null;
  };
  consultation: {
    id:          string;
    scheduledAt: string | null;
  };
  medications?:    Medication[];
  notes?:          string;
  tests?:          LabTest[];
  purpose?:        string;
  referredTo?:     string;
  referralReason?: string;
}

// -- Tab config ----------------------------------------------------------------

type Tab = RecordType;

const TABS: { key: Tab; label: string }[] = [
  { key: "prescription",        label: "Prescriptions"        },
  { key: "consultation_note",   label: "Consultation Notes"   },
  { key: "lab_request",         label: "Lab Requests"         },
  { key: "medical_certificate", label: "Medical Certificates" },
  { key: "referral",            label: "Referrals"            },
];

// -- Badge config --------------------------------------------------------------

const BADGE: Record<Tab, { label: string; bg: string; text: string }> = {
  prescription:        { label: "Prescription",        bg: "bg-[#E6F4EF]",  text: "text-[#008786]" },
  consultation_note:   { label: "Consultation Note",   bg: "bg-blue-50",    text: "text-blue-600"  },
  lab_request:         { label: "Lab Request",         bg: "bg-amber-50",   text: "text-amber-600" },
  medical_certificate: { label: "Medical Certificate", bg: "bg-emerald-50", text: "text-emerald-600"},
  referral:            { label: "Referral",            bg: "bg-violet-50",  text: "text-violet-600"},
};

// -- Empty messages ------------------------------------------------------------

const EMPTY: Record<Tab, { main: string; sub: string }> = {
  prescription:        { main: "No prescriptions yet.",        sub: "They'll appear here after your consultation."               },
  consultation_note:   { main: "No notes yet.",                sub: "Your doctor's notes will show up here after each session." },
  lab_request:         { main: "No lab requests yet.",         sub: "Lab orders from your doctor will appear here."              },
  medical_certificate: { main: "No certificates yet.",         sub: "Medical certificates issued to you will appear here."      },
  referral:            { main: "No referrals yet.",            sub: "Referrals from your doctor will appear here."               },
};

// -- Helpers -------------------------------------------------------------------

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-PH", {
    year: "numeric", month: "long", day: "numeric",
  });
}

function contentPreview(r: HealthRecord): string {
  if (r.type === "prescription" && r.medications?.length) {
    const m = r.medications[0];
    return `${m.name} ${m.dosage} · ${m.frequency}`;
  }
  if (r.type === "consultation_note" && r.notes) {
    const first = r.notes.split(/[.!?]/)[0].trim();
    return first.length > 120 ? first.slice(0, 120) + "…" : first + ".";
  }
  if (r.type === "lab_request" && r.tests?.length) {
    return r.tests[0].name;
  }
  if (r.type === "medical_certificate" && r.purpose) {
    const first = r.purpose.split("—")[0].trim();
    return first.length > 120 ? first.slice(0, 120) + "…" : first;
  }
  if (r.type === "referral" && r.referredTo) {
    return `Referred to ${r.referredTo}`;
  }
  return "";
}

function matchesSearch(r: HealthRecord, q: string): boolean {
  if (!q) return true;
  const lower = q.toLowerCase();
  const date  = formatDate(r.issuedAt).toLowerCase();
  return (
    r.doctor.name.toLowerCase().includes(lower)           ||
    date.includes(lower)                                  ||
    BADGE[r.type].label.toLowerCase().includes(lower)    ||
    contentPreview(r).toLowerCase().includes(lower)
  );
}

// -- Skeleton ------------------------------------------------------------------

function RecordCardSkeleton() {
  return (
    <div className="bg-bg-main rounded-xl border border-elements p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-2 flex-1">
          <div className="h-5 w-28 rounded skeleton" />
          <div className="h-4 w-48 rounded skeleton" />
          <div className="h-4 w-32 rounded skeleton" />
        </div>
        <div className="h-4 w-24 rounded skeleton shrink-0" />
      </div>
      <div className="h-px bg-elements/50" />
      <div className="h-4 w-3/4 rounded skeleton" />
      <div className="flex gap-2 mt-1">
        <div className="h-9 w-24 rounded-lg skeleton" />
        <div className="h-9 w-24 rounded-lg skeleton" />
      </div>
    </div>
  );
}

// -- PDF generator -------------------------------------------------------------

async function downloadPdf(record: HealthRecord, patientName: string) {
  const { jsPDF } = await import("jspdf");
  const doc        = new jsPDF({ unit: "mm", format: "a4" });
  const pageW      = doc.internal.pageSize.getWidth();
  const margin     = 20;
  const contentW   = pageW - margin * 2;
  let   y          = margin;

  // Header band
  doc.setFillColor(0, 135, 134);
  doc.rect(0, 0, pageW, 28, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("SwiftCare", margin, 17);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Telehealth Platform", margin, 23);

  const badge = BADGE[record.type];
  doc.setFontSize(9);
  doc.text(badge.label.toUpperCase(), pageW - margin, 17, { align: "right" });

  y = 38;

  // Title
  doc.setTextColor(17, 17, 17);
  doc.setFontSize(15);
  doc.setFont("helvetica", "bold");
  doc.text(badge.label, margin, y);
  y += 8;

  // Meta line
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(111, 111, 111);
  doc.text(`Issued: ${formatDate(record.issuedAt)}`, margin, y);
  y += 12;

  // Divider
  doc.setDrawColor(234, 234, 234);
  doc.line(margin, y, pageW - margin, y);
  y += 8;

  // Info grid
  const half = contentW / 2;

  doc.setFontSize(8);
  doc.setTextColor(111, 111, 111);
  doc.text("PATIENT", margin, y);
  doc.text("DOCTOR", margin + half, y);
  y += 5;

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(17, 17, 17);
  doc.text(patientName, margin, y);
  doc.text(`Dr. ${record.doctor.name}`, margin + half, y);
  y += 5;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(111, 111, 111);
  doc.text("Patient", margin, y);
  doc.text(record.doctor.specializations[0] ?? "Doctor", margin + half, y);
  y += 10;

  if (record.consultation.scheduledAt) {
    doc.setFontSize(9);
    doc.text(`Consultation date: ${formatDate(record.consultation.scheduledAt)}`, margin, y);
    y += 10;
  }

  doc.setDrawColor(234, 234, 234);
  doc.line(margin, y, pageW - margin, y);
  y += 10;

  // Content
  doc.setFontSize(10);
  doc.setTextColor(17, 17, 17);

  if (record.type === "prescription" && record.medications?.length) {
    doc.setFont("helvetica", "bold");
    doc.text("MEDICATIONS", margin, y);
    y += 7;
    record.medications.forEach((m, i) => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text(`${i + 1}. ${m.name} ${m.dosage}`, margin, y);
      y += 5;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(111, 111, 111);
      doc.text(`   ${m.frequency} · ${m.duration}`, margin, y);
      doc.setTextColor(17, 17, 17);
      y += 7;
    });
  }

  if (record.type === "consultation_note" && record.notes) {
    doc.setFont("helvetica", "bold");
    doc.text("DOCTOR'S NOTES", margin, y);
    y += 7;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    const lines = doc.splitTextToSize(record.notes, contentW);
    doc.text(lines, margin, y);
    y += lines.length * 5 + 5;
  }

  if (record.type === "lab_request" && record.tests?.length) {
    doc.setFont("helvetica", "bold");
    doc.text("TESTS ORDERED", margin, y);
    y += 7;
    record.tests.forEach((t, i) => {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(`${i + 1}. ${t.name}`, margin, y);
      y += 6;
    });
  }

  if (record.type === "medical_certificate" && record.purpose) {
    doc.setFont("helvetica", "bold");
    doc.text("CERTIFICATE PURPOSE", margin, y);
    y += 7;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    const lines = doc.splitTextToSize(record.purpose, contentW);
    doc.text(lines, margin, y);
    y += lines.length * 5 + 5;
  }

  if (record.type === "referral") {
    doc.setFont("helvetica", "bold");
    doc.text(`REFERRED TO: ${record.referredTo ?? ""}`, margin, y);
    y += 7;
    if (record.referralReason) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      const lines = doc.splitTextToSize(record.referralReason, contentW);
      doc.text(lines, margin, y);
    }
  }

  // Footer
  const pageH = doc.internal.pageSize.getHeight();
  doc.setFillColor(248, 248, 248);
  doc.rect(0, pageH - 14, pageW, 14, "F");
  doc.setFontSize(8);
  doc.setTextColor(111, 111, 111);
  doc.text("This document was generated by SwiftCare · swiftcare.app", pageW / 2, pageH - 5, { align: "center" });

  const filename = `swiftcare-${record.type.replace("_", "-")}-${record.id.slice(-6)}.pdf`;
  doc.save(filename);
}

// -- Preview modal -------------------------------------------------------------

function PreviewModal({ record, patientName, onClose, onDownload }: {
  record:      HealthRecord;
  patientName: string;
  onClose:     () => void;
  onDownload:  () => void;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);
  useEffect(() => {
    function handler(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!mounted) return null;

  const badge = BADGE[record.type];

  return createPortal(
    <>
      <div aria-hidden className="fixed inset-0 z-50 bg-black/40"
        style={{ transition: "opacity 300ms ease" }} onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-6 pointer-events-none">
        <div
          role="dialog" aria-modal
          className="relative w-full max-w-2xl h-[96vh] max-h-[96vh] bg-bg-main rounded-xl
            shadow-[0_16px_60px_rgba(0,0,0,0.20)] flex flex-col overflow-hidden pointer-events-auto
            animate-fadeInDown"
          style={{ animationDuration: "200ms" }}
        >
          {/* Header */}
          <div className="shrink-0 flex items-center justify-between px-7 py-5 border-b border-elements">
            <div className="flex items-center gap-3">
              <span className={`text-[13px] font-medium px-2.5 py-0.5 rounded-full ${badge.bg} ${badge.text}`}>
                {badge.label}
              </span>
              <p className="text-[14px] text-text-sub">{formatDate(record.issuedAt)}</p>
            </div>
            <button type="button" onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-text-sub
                hover:bg-bg-sub hover:text-text-main transition-colors duration-200">
              <X size={16} strokeWidth={1.75} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-7 py-6 flex flex-col gap-5">

            {/* Doctor + patient */}
            <div className="flex gap-8">
              <div className="flex flex-col gap-0.5">
                <p className="text-[12px] font-medium text-text-sub uppercase tracking-wider">Doctor</p>
                <p className="text-[15px] font-medium text-text-main">Dr. {record.doctor.name}</p>
                <p className="text-[13px] text-text-sub">{record.doctor.specializations[0] ?? ""}</p>
              </div>
              <div className="flex flex-col gap-0.5">
                <p className="text-[12px] font-medium text-text-sub uppercase tracking-wider">Patient</p>
                <p className="text-[15px] font-medium text-text-main">{patientName}</p>
                {record.consultation.scheduledAt && (
                  <p className="text-[13px] text-text-sub">{formatDate(record.consultation.scheduledAt)}</p>
                )}
              </div>
            </div>

            <div className="h-px bg-elements/50" />

            {/* Content */}
            {record.type === "prescription" && record.medications?.length ? (
              <div className="flex flex-col gap-3">
                <p className="text-[13px] font-medium text-text-sub uppercase tracking-wider">Medications</p>
                {record.medications.map((m, i) => (
                  <div key={i} className="flex flex-col gap-0.5 bg-bg-sub rounded-lg p-3.5">
                    <p className="text-[15px] font-medium text-text-main">
                      {m.name}{m.dosage ? ` ${m.dosage}` : ""}
                    </p>
                    {(m.frequency || m.duration) && (
                      <p className="text-[13px] text-text-sub">
                        {[m.frequency, m.duration].filter(Boolean).join(" · ")}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : record.type === "consultation_note" && record.notes ? (
              <div className="flex flex-col gap-3">
                <p className="text-[13px] font-medium text-text-sub uppercase tracking-wider">Doctor&rsquo;s Notes</p>
                <p className="text-[15px] text-text-main leading-relaxed whitespace-pre-wrap">{record.notes}</p>
              </div>
            ) : record.type === "lab_request" && record.tests?.length ? (
              <div className="flex flex-col gap-3">
                <p className="text-[13px] font-medium text-text-sub uppercase tracking-wider">Tests Ordered</p>
                {record.tests.map((t, i) => (
                  <div key={i} className="flex items-center gap-2.5 bg-bg-sub rounded-lg p-3.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-text-sub shrink-0" />
                    <p className="text-[15px] text-text-main">{t.name}</p>
                  </div>
                ))}
              </div>
            ) : record.type === "medical_certificate" && record.purpose ? (
              <div className="flex flex-col gap-3">
                <p className="text-[13px] font-medium text-text-sub uppercase tracking-wider">Purpose</p>
                <p className="text-[15px] text-text-main leading-relaxed">{record.purpose}</p>
              </div>
            ) : record.type === "referral" ? (
              <div className="flex flex-col gap-3">
                <p className="text-[13px] font-medium text-text-sub uppercase tracking-wider">Referred To</p>
                <p className="text-[15px] text-text-main">{record.referredTo}</p>
                {record.referralReason && (
                  <p className="text-[14px] text-text-sub leading-relaxed">{record.referralReason}</p>
                )}
              </div>
            ) : null}
          </div>

          {/* Footer */}
          <div className="shrink-0 px-7 py-5 border-t border-elements">
            <button
              type="button"
              onClick={onDownload}
              className="w-full h-11 rounded-xl bg-text-main text-brand-sub text-[15px] font-medium
                flex items-center justify-center gap-2 hover:opacity-90 transition-opacity duration-150"
            >
              <Download size={15} strokeWidth={1.75} />
              Download PDF
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}

// -- Record card ---------------------------------------------------------------

function RecordCard({ record, patientName, index }: { record: HealthRecord; patientName: string; index: number }) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const badge   = BADGE[record.type];
  const preview = contentPreview(record);

  async function handleDownload() {
    try {
      await downloadPdf(record, patientName);
    } catch {
      toast.error("Failed to generate PDF.");
    }
  }

  return (
    <>
      <div
        className="bg-bg-main rounded-xl border border-elements flex flex-col h-full overflow-hidden
          transition-shadow duration-200 hover:shadow-sm animate-fadeInDown"
        style={{ animationDelay: `${index * 60}ms`, animationDuration: "400ms" }}
      >
        {/* Card body */}
        <div className="p-5 flex flex-col gap-4 flex-1">
          {/* Badge + date */}
          <div className="flex items-center justify-between gap-4">
            <span className={`text-[14px] font-medium px-2.5 py-0.5 rounded-full ${badge.bg} ${badge.text}`}>
              {badge.label}
            </span>
            <p className="text-[14px] text-text-sub shrink-0">{formatDate(record.issuedAt)}</p>
          </div>

          {/* Doctor name + specialty */}
          <div className="flex items-baseline mt-2">
            <p className="text-[16px] text-text-main shrink-0">Dr. {record.doctor.name}</p>
            <p className="text-[16px] text-text-sub truncate">, {record.doctor.specializations[0] ?? "Doctor"}</p>
          </div>

          <div className="h-px bg-elements/50" />

          {/* Content preview */}
          {preview && (
            <p className="text-[16px] text-text-sub">{preview}</p>
          )}
        </div>

        {/* Footer — same pattern as ConsultationCard */}
        <div className="flex border-t border-elements">
          <button
            type="button"
            onClick={handleDownload}
            className="flex-1 py-3 flex items-center justify-center gap-2
              text-[14px] font-medium text-text-main hover:bg-bg-sub
              transition-colors duration-200 border-r border-elements"
          >
            <Download size={14} strokeWidth={1.75} />
            Download
          </button>
          <button
            type="button"
            onClick={() => setPreviewOpen(true)}
            className="flex-1 py-3 bg-text-main text-brand-sub flex items-center justify-center gap-2
              text-[14px] font-medium hover:opacity-90 active:opacity-80 transition-all duration-200"
          >
            <Eye size={14} strokeWidth={1.75} />
            Open file
          </button>
        </div>
      </div>

      {previewOpen && (
        <PreviewModal
          record={record}
          patientName={patientName}
          onClose={() => setPreviewOpen(false)}
          onDownload={handleDownload}
        />
      )}
    </>
  );
}

// -- Empty state ---------------------------------------------------------------

function EmptyState({ tab }: { tab: Tab }) {
  const msg = EMPTY[tab];
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <img src="/illustrations/no-data.svg" alt="" aria-hidden className="w-66 max-w-full select-none opacity-90" />
      <div className="flex flex-col gap-0.5">
        <p className="text-[16px] font-medium text-text-main">{msg.main}</p>
        <p className="text-[16px] text-text-sub">{msg.sub}</p>
      </div>
    </div>
  );
}

// -- Main page -----------------------------------------------------------------

export function HealthRecordsPage() {
  const { data: session }              = useSession();
  const patientName                    = session?.user?.name ?? "Patient";

  const [tab,       setTab]       = useState<Tab>("prescription");
  const [records,   setRecords]   = useState<HealthRecord[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState("");
  const [searchFocused, setSearchFocused] = useState(false);

  const tabsRef                    = useRef<HTMLDivElement>(null);
  const [indicator, setIndicator]  = useState({ left: 0, width: 0 });

  useLayoutEffect(() => {
    if (!tabsRef.current) return;
    const btns = tabsRef.current.querySelectorAll<HTMLButtonElement>("button[data-tab]");
    const idx  = TABS.findIndex(t => t.key === tab);
    const btn  = btns[idx];
    if (btn) setIndicator({ left: btn.offsetLeft, width: btn.offsetWidth });
  }, [tab]);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch("/api/patient/records");
      const data = await res.json() as { records: HealthRecord[] };
      setRecords(data.records ?? []);
    } catch {
      toast.error("Failed to load health records.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  const byTab    = records
    .filter(r => r.type === tab)
    .slice()
    .sort((a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime());
  const filtered = byTab.filter(r => matchesSearch(r, search));
  const tabCounts  = Object.fromEntries(
    TABS.map(t => [t.key, records.filter(r => r.type === t.key).length])
  ) as Record<Tab, number>;

  return (
    <div className="flex flex-col gap-8 w-full">

      {/* Header */}
      <div
        className="flex flex-col gap-0.5 animate-fadeInDown"
        style={{ animationDelay: "0ms", animationDuration: "400ms" }}
      >
        <h1 className="text-[32px] font-medium text-text-main tracking-tighter leading-tight">
          Health Records
        </h1>
        <p className="text-[16px] text-text-sub">
          All documents from your consultations, in one place.
        </p>
      </div>

      {/* Search */}
      <div
        className="animate-fadeInDown"
        style={{ animationDelay: "40ms", animationDuration: "400ms" }}
      >
        <div className={`flex items-center gap-3 h-13 px-4 rounded-xl border bg-bg-main
          transition-all duration-200
          ${searchFocused ? "border-text-main shadow-[0_0_0_3px_rgba(0,0,0,0.06)]" : "border-elements"}`}>
          <Search
            size={16} strokeWidth={1.75}
            className={`shrink-0 transition-colors duration-200 ${searchFocused ? "text-text-main" : "text-text-sub"}`}
          />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            placeholder="Search by doctor name, date, or document type..."
            className="flex-1 text-[16px] text-text-main bg-transparent outline-none placeholder:text-text-sub"
          />
        </div>
      </div>

      {/* Tabs */}
      <div
        ref={tabsRef}
        className="relative flex border-b border-elements overflow-x-auto scrollbar-hide animate-fadeInDown"
        style={{ animationDelay: "80ms", animationDuration: "400ms" }}
      >
        <div
          className="absolute bottom-0 h-0.5 bg-brand transition-all duration-200 ease-out"
          style={{ left: indicator.left, width: indicator.width }}
        />
        {TABS.map(({ key, label }) => {
          const count    = tabCounts[key];
          const isActive = tab === key;
          return (
            <button
              key={key}
              data-tab={key}
              type="button"
              onClick={() => setTab(key)}
              className={`px-4 py-2.5 text-[16px] font-medium whitespace-nowrap transition-colors duration-200
                flex items-center gap-2
                ${isActive ? "text-text-main" : "text-text-sub hover:text-text-main"}`}
            >
              {label}
              {!loading && count > 0 && (
                <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded-full
                  ${isActive ? "bg-brand text-white" : "bg-elements text-text-sub"}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {loading ? (
        <div key={tab} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-tabIn">
          {Array.from({ length: 2 }).map((_, i) => <RecordCardSkeleton key={i} />)}
        </div>
      ) : filtered.length === 0 && search ? (
        <div key={tab} className="flex flex-col items-center gap-4 py-16 text-center animate-tabIn">
          <img src="/illustrations/file-searching.svg" alt="" aria-hidden className="w-66 max-w-full select-none opacity-90" />
          <div className="flex flex-col gap-0.5">
            <p className="text-[16px] font-medium text-text-main">No records match your search.</p>
            <p className="text-[16px] text-text-sub">Try a different doctor name, date, or document type.</p>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div key={tab} className="animate-tabIn">
          <EmptyState tab={tab} />
        </div>
      ) : (
        <div key={tab} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-tabIn">
          {filtered.map((r, i) => (
            <RecordCard key={r.id} record={r} patientName={patientName} index={i} />
          ))}
        </div>
      )}

    </div>
  );
}
