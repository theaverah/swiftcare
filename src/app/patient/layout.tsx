import { PatientSidebar } from "@/components/layouts/PatientSidebar";
import { DashboardHeader } from "@/components/layouts/DashboardHeader";

export const metadata = {
  title: { default: "Patient Dashboard", template: "%s | SwiftCare" },
};

export default function PatientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-bg-sub">
      <PatientSidebar />
      <div className="flex-1 flex flex-col overflow-hidden relative">

        {/* ── Ambient gradient — upper right ───────────────────────── */}
        <div
          className="pointer-events-none absolute inset-0 z-0"
          style={{
            background: "radial-gradient(ellipse 70% 50% at 100% 0%, rgba(0,135,134,0.12) 0%, rgba(245,64,98,0.06) 55%, transparent 80%)",
          }}
        />

        <div className="shrink-0 relative z-20 bg-transparent">
          <DashboardHeader />
        </div>
        <main className="flex-1 overflow-y-auto overscroll-none flex flex-col px-8 pt-8 pb-6 bg-bg-sub">
          {children}
        </main>
      </div>
    </div>
  );
}
