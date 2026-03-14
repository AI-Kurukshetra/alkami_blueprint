import { customerNavigation } from "@banking/config";
import { AppShell } from "@banking/ui";
import type { ReactNode } from "react";
import { FormSubmitButton } from "../../components/form-submit-button";
import { signoutAction } from "../(auth)/actions";
import { requireUser } from "../../lib/auth";

export const dynamic = "force-dynamic";

export default async function PortalLayout({
  children
}: {
  children: ReactNode;
}) {
  const authState = await requireUser();
  const navigation =
    authState.profile?.role === "admin"
      ? [...customerNavigation, { href: "/admin", label: "Admin" }]
      : customerNavigation;

  return (
    <AppShell navigation={navigation} title="NextGen Bank">
      <div className="flex justify-end">
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
