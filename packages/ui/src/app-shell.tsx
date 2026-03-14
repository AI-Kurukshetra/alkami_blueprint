import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@banking/utils";

export function AppShell({
  title,
  navigation,
  children
}: {
  title: string;
  navigation: ReadonlyArray<{ href: string; label: string }>;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(125,211,252,0.35),_transparent_28%),linear-gradient(180deg,_#f8fafc_0%,_#e2e8f0_100%)]">
      <div className="mx-auto grid min-h-screen max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[240px_1fr] lg:px-6">
        <aside className="rounded-[32px] border border-white/60 bg-slate-950 px-5 py-6 text-white shadow-[0_32px_100px_-50px_rgba(15,23,42,1)]">
          <div className="mb-8">
            <p className="text-xs uppercase tracking-[0.24em] text-sky-300">Platform</p>
            <h2 className="mt-2 text-xl font-semibold">{title}</h2>
          </div>
          <nav className="space-y-1">
            {navigation.map((item) => (
              <Link
                className={cn(
                  "block rounded-2xl px-4 py-3 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white"
                )}
                href={item.href}
                key={item.href}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>
        <main className="space-y-6 pb-10">{children}</main>
      </div>
    </div>
  );
}
