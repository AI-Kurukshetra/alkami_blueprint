import Link from "next/link";
import { redirect } from "next/navigation";
import { Button, Card, CardDescription, CardTitle } from "@banking/ui";
import { hasSupabaseEnv } from "@banking/database";
import { getAuthState } from "../../../lib/auth";
import { FlashBanner } from "../../../components/flash-banner";
import { signupAction } from "../actions";

export default async function SignupPage({
  searchParams
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const message =
    typeof searchParams?.message === "string" ? searchParams.message : undefined;
  const { user } = await getAuthState();

  if (hasSupabaseEnv() && user) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <Card className="w-full max-w-md space-y-6">
        <div className="space-y-2">
          <CardTitle className="text-2xl">Create account</CardTitle>
          <CardDescription>
            New customers are created in Supabase Auth and then provisioned into the banking schema with optional MFA setup.
          </CardDescription>
        </div>
        <FlashBanner message={message} tone="info" />
        <form action={signupAction} className="space-y-4">
          <input className="h-11 w-full rounded-2xl border border-slate-200 px-4" name="name" placeholder="Full name" required type="text" />
          <input className="h-11 w-full rounded-2xl border border-slate-200 px-4" name="email" placeholder="Email" required type="email" />
          <input className="h-11 w-full rounded-2xl border border-slate-200 px-4" minLength={8} name="password" placeholder="Password" required type="password" />
          <label className="flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-600">
            <input name="setupMfa" type="checkbox" />
            Set up optional TOTP MFA right after account creation
          </label>
          <Button className="w-full" type="submit">
            Open profile
          </Button>
        </form>
        <p className="text-sm text-slate-500">
          Already have an account?{" "}
          <Link className="font-medium text-slate-950" href="/login">
            Sign in
          </Link>
        </p>
      </Card>
    </main>
  );
}
