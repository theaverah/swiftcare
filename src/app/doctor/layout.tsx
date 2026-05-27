import { DoctorSidebar } from "@/components/layouts/DoctorSidebar";
import { DashboardHeader } from "@/components/layouts/DashboardHeader";

export const metadata = {
  title: { default: "Doctor Dashboard", template: "%s | SwiftCare" },
};

export default function DoctorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-bg-main">
      <DoctorSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto px-8 py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
