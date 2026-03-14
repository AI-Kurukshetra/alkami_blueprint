import { customerNavigation } from "@banking/config";
import { AppShell } from "@banking/ui";
import type { ReactNode } from "react";
import { signoutAction } from "../(auth)/actions";
import { requireUser } from "../../lib/auth";

export const dynamic = "force-dynamic";

export default async function PortalLayout({
  children
}: {
  children: ReactNode;
}) {
  await requireUser();

  return (
    <AppShell navigation={customerNavigation} title="NextGen Bank">
      <div className="flex justify-end">
        <form action={signoutAction}>
          <button
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700"
            type="submit"
          >
            Sign out
          </button>
        </form>
      </div>
      {children}
    </AppShell>
  );
}
