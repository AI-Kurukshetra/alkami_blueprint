import { getCreditProfile, listCreditScoreSnapshots } from "@banking/database";
import { Badge, Card, CardDescription, CardTitle, PageHeader } from "@banking/ui";
import { formatDate } from "@banking/utils";
import { FlashBanner } from "../../../components/flash-banner";
import { PortalActionButton } from "../../../components/portal-action-button";
import { createSupabaseServerClient } from "../../../lib/supabase/server";

export default async function CreditPage({
  searchParams
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const supabase = await createSupabaseServerClient();
  const [profile, snapshots] = await Promise.all([
    getCreditProfile(supabase),
    listCreditScoreSnapshots(supabase)
  ]);
  const message =
    typeof searchParams?.message === "string" ? searchParams.message : undefined;
  const error =
    typeof searchParams?.error === "string" ? searchParams.error : undefined;
  const latest = snapshots.at(-1);
  const previous = snapshots.length > 1 ? snapshots.at(-2) : null;
  const delta = latest && previous ? latest.score - previous.score : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        actionLabel="Refresh score"
        actionHref="/credit#refresh"
        description="Monitor score posture, history, and contributing factors with customer-visible change alerts."
        eyebrow="Credit"
        title="Credit score monitoring"
      />
      <FlashBanner message={message} tone="success" />
      <FlashBanner message={error} tone="error" />
      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="space-y-3">
          <CardTitle>Current score</CardTitle>
          <p className="text-4xl font-semibold text-slate-950">{profile?.score ?? "--"}</p>
          <Badge tone={profile?.scoreBand === "excellent" || profile?.scoreBand === "good" ? "success" : "warning"}>
            {profile?.scoreBand ?? "unavailable"}
          </Badge>
        </Card>
        <Card className="space-y-3">
          <CardTitle>Provider</CardTitle>
          <CardDescription>{profile?.provider ?? "No bureau configured"}</CardDescription>
          <p className="text-sm text-slate-500">Updated {profile ? formatDate(profile.updatedAt) : "N/A"}</p>
        </Card>
        <Card className="space-y-3" id="refresh">
          <CardTitle>Score movement</CardTitle>
          <CardDescription>
            {previous ? `${delta >= 0 ? "+" : ""}${delta} since last snapshot` : "No prior snapshot yet"}
          </CardDescription>
          <PortalActionButton
            endpoint="/api/credit-score"
            errorMessage="Unable to refresh the credit profile."
            errorPath="/credit"
            pendingLabel="Refreshing..."
            successMessage="Credit profile refreshed."
            successPath="/credit"
          >
            Refresh score
          </PortalActionButton>
        </Card>
      </div>
      <Card className="space-y-4">
        <div>
          <CardTitle>Score history and factors</CardTitle>
          <CardDescription>Each refresh records a new bureau-style score snapshot and explanatory factors.</CardDescription>
        </div>
        <div className="space-y-3">
          {snapshots.map((snapshot) => (
            <div className="rounded-2xl bg-slate-50 px-4 py-4" key={snapshot.id}>
              <div className="flex items-center justify-between">
                <p className="font-medium text-slate-950">Score {snapshot.score}</p>
                <p className="text-sm text-slate-500">{formatDate(snapshot.recordedAt)}</p>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {snapshot.reasonCodes.map((code) => (
                  <Badge key={code}>{code}</Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
