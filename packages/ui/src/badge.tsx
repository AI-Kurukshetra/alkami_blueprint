import type { ReactNode } from "react";
import { cn } from "@banking/utils";

export function Badge({
  tone = "default",
  className,
  children
}: {
  tone?: "default" | "success" | "warning" | "danger";
  className?: string;
  children: ReactNode;
}) {
  const toneClass =
    tone === "success"
      ? "bg-emerald-100 text-emerald-700"
      : tone === "warning"
        ? "bg-amber-100 text-amber-700"
        : tone === "danger"
          ? "bg-rose-100 text-rose-700"
          : "bg-slate-100 text-slate-600";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium",
        toneClass,
        className
      )}
    >
      {children}
    </span>
  );
}
