import { listBusinessMemberships, listBusinessProfiles, listUsers } from "@banking/database";
import { Badge, Card, CardDescription, CardTitle, PageHeader } from "@banking/ui";
import { formatDate } from "@banking/utils";
import { FlashBanner } from "../../../components/flash-banner";
import { FormSubmitButton } from "../../../components/form-submit-button";
import { createSupabaseServerClient } from "../../../lib/supabase/server";
import { addBusinessMembershipAction, createBusinessProfileAction } from "./actions";

export default async function BusinessPage({
  searchParams
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const supabase = await createSupabaseServerClient();
  const [profiles, memberships, users] = await Promise.all([
    listBusinessProfiles(supabase),
    listBusinessMemberships(undefined, supabase),
    listUsers(supabase)
  ]);
  const message =
    typeof searchParams?.message === "string" ? searchParams.message : undefined;
  const error =
    typeof searchParams?.error === "string" ? searchParams.error : undefined;

  return (
    <div className="space-y-6">
      <PageHeader
        actionLabel="Open business profile"
        actionHref="/business#onboarding-form"
        description="Business onboarding, delegated access, and operator role controls in the unified banking app."
        eyebrow="Business"
        title="Business accounts"
      />
      <FlashBanner message={message} tone="success" />
      <FlashBanner message={error} tone="error" />
      <div className="grid gap-4 xl:grid-cols-2">
        {profiles.map((profile) => {
          const profileMemberships = memberships.filter(
            (membership) => membership.businessProfileId === profile.id
          );

          return (
            <Card className="space-y-4" key={profile.id}>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>{profile.businessName}</CardTitle>
                  <CardDescription>
                    {profile.legalName} | {profile.industry}
                  </CardDescription>
                </div>
                <Badge tone={profile.status === "active" ? "success" : "warning"}>
                  {profile.status.replace("_", " ")}
                </Badge>
              </div>
              <p className="text-sm text-slate-500">
                Tax ID {profile.taxIdMasked} | Created {formatDate(profile.createdAt)}
              </p>
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-700">Delegated operators</p>
                {profileMemberships.map((membership) => {
                  const user = users.find((item) => item.id === membership.userId);

                  return (
                    <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3" key={membership.id}>
                      <div>
                        <p className="font-medium text-slate-950">{user?.email ?? membership.userId}</p>
                        <p className="text-sm text-slate-500">{membership.membershipRole}</p>
                      </div>
                      <Badge>{membership.status}</Badge>
                    </div>
                  );
                })}
                <form action={addBusinessMembershipAction} className="grid gap-3 pt-2">
                  <input name="businessProfileId" type="hidden" value={profile.id} />
                  <input className="h-11 rounded-2xl border border-slate-200 px-4" name="email" placeholder="Existing customer email" required type="email" />
                  <select className="h-11 rounded-2xl border border-slate-200 px-4" defaultValue="viewer" name="membershipRole">
                    <option value="viewer">Viewer</option>
                    <option value="operator">Operator</option>
                    <option value="owner">Owner</option>
                  </select>
                  <FormSubmitButton pendingLabel="Adding..." type="submit" variant="secondary">
                    Add member
                  </FormSubmitButton>
                </form>
              </div>
            </Card>
          );
        })}
      </div>
      <Card className="space-y-4" id="onboarding-form">
        <div>
          <CardTitle>Business onboarding</CardTitle>
          <CardDescription>
            Submit a business profile and establish the first owner membership.
          </CardDescription>
        </div>
        <form action={createBusinessProfileAction} className="grid gap-3 md:grid-cols-2">
          <input className="h-11 rounded-2xl border border-slate-200 px-4" name="businessName" placeholder="Business name" required type="text" />
          <input className="h-11 rounded-2xl border border-slate-200 px-4" name="legalName" placeholder="Legal entity name" required type="text" />
          <input className="h-11 rounded-2xl border border-slate-200 px-4" name="industry" placeholder="Industry" required type="text" />
          <input className="h-11 rounded-2xl border border-slate-200 px-4" name="taxId" placeholder="Tax ID / EIN" required type="text" />
          <div className="md:col-span-2">
            <FormSubmitButton pendingLabel="Submitting..." type="submit">
              Create business profile
            </FormSubmitButton>
          </div>
        </form>
      </Card>
    </div>
  );
}
