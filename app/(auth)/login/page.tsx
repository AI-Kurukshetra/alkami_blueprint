import Link from "next/link";
import { redirect } from "next/navigation";
import { Card, CardDescription, CardTitle } from "@banking/ui";
import { hasSupabaseEnv } from "@banking/database";
import { getAuthState } from "../../../lib/auth";
import { FlashBanner } from "../../../components/flash-banner";
import { FormSubmitButton } from "../../../components/form-submit-button";
import { loginAction } from "../actions";

export default async function LoginPage({
  searchParams
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const message =
    typeof searchParams?.message === "string" ? searchParams.message : undefined;
  const nextPath =
    typeof searchParams?.next === "string" ? searchParams.next : undefined;
  const { user } = await getAuthState();

  if (hasSupabaseEnv() && user) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <Card className="w-full max-w-md space-y-6">
        <div className="space-y-2">
          <CardTitle className="text-2xl">Sign in</CardTitle>
          <CardDescription>
            Sign in with Supabase Auth. TOTP MFA is optional and only needed if you enrolled it.
          </CardDescription>
        </div>
        <FlashBanner message={message} tone="info" />
        <form action={loginAction} className="space-y-4">
          <input name="next" type="hidden" value={nextPath ?? ""} />
          <input className="h-11 w-full rounded-2xl border border-slate-200 px-4" name="email" placeholder="Email" required type="email" />
          <input className="h-11 w-full rounded-2xl border border-slate-200 px-4" name="password" placeholder="Password" required type="password" />
          <input className="h-11 w-full rounded-2xl border border-slate-200 px-4" maxLength={6} name="mfaCode" placeholder="MFA code (optional)" type="text" />
          <label className="flex items-center gap-2 text-sm text-slate-500">
            <input name="trustDevice" type="checkbox" />
            Trust this device after MFA verification
          </label>
          <FormSubmitButton className="w-full" pendingLabel="Signing in..." type="submit">
            Continue
          </FormSubmitButton>
        </form>
        <p className="text-sm text-slate-500">
          Need an account?{" "}
          <Link className="font-medium text-slate-950" href="/signup">
            Sign up
          </Link>
        </p>
      </Card>
    </main>
  );
}
