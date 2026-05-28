export function DoctorCardSkeleton() {
  return (
    <div className="bg-bg-main border border-elements rounded-lg p-4 flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-full skeleton shrink-0" />
        <div className="flex-1 flex flex-col gap-2 pt-1">
          <div className="h-4 w-36 rounded-md skeleton" />
          <div className="h-3 w-24 rounded-md skeleton" />
        </div>
        <div className="w-7 h-7 rounded-full skeleton shrink-0" />
      </div>

      <div className="h-px bg-elements/50" />

      <div className="flex flex-col gap-2">
        <div className="h-4 w-28 rounded-md skeleton" />
        <div className="h-3 w-32 rounded-md skeleton" />
        <div className="h-3 w-40 rounded-md skeleton" />
      </div>

      <div className="h-9 w-full rounded-lg skeleton mt-auto" />
    </div>
  );
}
