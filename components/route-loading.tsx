export function RouteLoading({
  eyebrow = "Loading",
  title = "Preparing your workspace"
}: {
  eyebrow?: string;
  title?: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/6 px-4 backdrop-blur-[1px]">
      <div className="w-full max-w-xs rounded-[24px] border border-slate-200/90 bg-white/92 px-5 py-5 text-center shadow-[0_18px_60px_rgba(15,23,42,0.12)]">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-sky-50/80">
          <span className="h-7 w-7 animate-spin rounded-full border-[3px] border-sky-600 border-r-sky-100" />
        </div>
        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">
          {eyebrow}
        </p>
        <p className="mt-2 text-lg font-semibold text-slate-950">{title}</p>
        <p className="mt-1 text-sm text-slate-500">
          Loading the next view.
        </p>
      </div>
    </div>
  );
}
