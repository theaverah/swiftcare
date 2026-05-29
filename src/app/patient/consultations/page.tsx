export const metadata = { title: "Consultations" };

export default function ConsultationsPage() {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-[32px] font-medium text-text-main tracking-tighter leading-tight">
        Consultations
      </h1>
      <p className="text-[16px] text-text-sub">Your upcoming and past consultations will appear here.</p>
    </div>
  );
}
