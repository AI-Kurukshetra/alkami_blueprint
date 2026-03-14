export function RouteLoading({
  eyebrow = "Loading",
  title = "Preparing your workspace"
}: {
  eyebrow?: string;
  title?: string;
}) {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="h-3 w-24 animate-pulse rounded-full bg-sky-200" />
        <div className="h-10 w-72 animate-pulse rounded-3xl bg-slate-200" />
        <div className="h-4 w-full max-w-2xl animate-pulse rounded-full bg-slate-100" />
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            className="space-y-4 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm"
            key={index}
          >
            <div className="h-4 w-28 animate-pulse rounded-full bg-slate-200" />
            <div className="h-8 w-32 animate-pulse rounded-full bg-slate-300" />
            <div className="h-3 w-full animate-pulse rounded-full bg-slate-100" />
            <div className="h-3 w-4/5 animate-pulse rounded-full bg-slate-100" />
          </div>
        ))}
      </div>
      <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-3 w-3 animate-ping rounded-full bg-sky-500" />
          <p className="text-sm font-medium text-slate-600">{eyebrow}</p>
        </div>
        <p className="mt-3 text-2xl font-semibold text-slate-950">{title}</p>
      </div>
    </div>
  );
}
