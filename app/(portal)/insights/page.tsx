import { runInsightsAnalysis } from "@banking/database";
import { Badge, Button, Card, CardDescription, CardTitle, PageHeader } from "@banking/ui";
import { FlashBanner } from "../../../components/flash-banner";
import { createSupabaseServerClient } from "../../../lib/supabase/server";
import { refreshInsightsAction } from "./actions";

export default async function InsightsPage({
  searchParams
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const supabase = await createSupabaseServerClient();
  const insights = await runInsightsAnalysis(supabase);
  const message =
    typeof searchParams?.message === "string" ? searchParams.message : undefined;

  return (
    <div className="space-y-6">
      <PageHeader
        actionLabel="Run analysis"
        actionHref="/insights#analysis"
        description="Rule-based insights now, with AI enrichment and explainability hooks staged next."
        eyebrow="Insights"
        title="Financial insights"
      />
      <FlashBanner message={message} tone="success" />
      <Card className="space-y-4" id="analysis">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Refresh analysis</CardTitle>
            <CardDescription>Re-run server-side insights using your latest account activity.</CardDescription>
          </div>
          <form action={refreshInsightsAction}>
            <Button type="submit">Refresh insights</Button>
          </form>
        </div>
      </Card>
      <div className="grid gap-4 xl:grid-cols-3">
        {insights.map((insight) => (
          <Card className="space-y-3" key={insight.title}>
            <Badge tone={insight.tone}>{insight.tone === "default" ? "Insight" : insight.tone === "warning" ? "Opportunity" : "Momentum"}</Badge>
            <CardTitle>{insight.title}</CardTitle>
            <CardDescription>{insight.body}</CardDescription>
          </Card>
        ))}
      </div>
    </div>
  );
}
