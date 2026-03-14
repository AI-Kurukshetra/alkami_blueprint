import Link from "next/link";
import { adminNavigation } from "@banking/config";
import { AppShell } from "@banking/ui";
import type { ReactNode } from "react";
import { FormSubmitButton } from "../../components/form-submit-button";
import { signoutAction } from "../(auth)/actions";
import { requireAdmin } from "../../lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children
}: {
  children: ReactNode;
}) {
  await requireAdmin();

  return (
    <AppShell navigation={adminNavigation} title="Ops Control">
      <div className="flex justify-end gap-3">
        <Link
          className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700"
          href="/dashboard"
        >
          Customer portal
        </Link>
        <form action={signoutAction}>
          <FormSubmitButton pendingLabel="Signing out..." type="submit" variant="secondary">
            Sign out
          </FormSubmitButton>
        </form>
      </div>
      {children}
    </AppShell>
  );
}
