import Link from "next/link";
import { Button } from "./button";

export function PageHeader({
  eyebrow,
  title,
  description,
  actionLabel,
  actionHref
}: {
  eyebrow: string;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="max-w-2xl space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">
          {eyebrow}
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
          {title}
        </h1>
        <p className="text-sm leading-6 text-slate-600 md:text-base">
          {description}
        </p>
      </div>
      {actionLabel && actionHref ? (
        <Button asChild variant="secondary">
          <Link href={actionHref}>{actionLabel}</Link>
        </Button>
      ) : null}
    </div>
  );
}
