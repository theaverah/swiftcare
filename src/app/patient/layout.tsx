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
    <div className="flex h-screen overflow-hidden bg-bg-main">
      <PatientSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto px-8 py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
