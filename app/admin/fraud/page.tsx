import { listFraudEvents } from "@banking/database";
import { Badge, Card, CardDescription, CardTitle, PageHeader } from "@banking/ui";
import { formatDate } from "@banking/utils";
import { createSupabaseServerClient } from "../../../lib/supabase/server";

export default async function AdminFraudPage() {
  const supabase = await createSupabaseServerClient();
  const events = await listFraudEvents(supabase);

  return (
    <div className="space-y-6">
      <PageHeader
        description="Suspicious activity hooks, triage status, and model escalation points."
        eyebrow="Admin"
        title="Fraud monitoring"
      />
      <Card className="space-y-4">
        <CardTitle>Open fraud events</CardTitle>
        <CardDescription>Fraud review is available in the same deployment as customer banking.</CardDescription>
        <div className="space-y-3">
          {events.map((event) => (
            <div className="flex flex-col gap-3 rounded-2xl bg-slate-50 px-4 py-4 md:flex-row md:items-center md:justify-between" key={event.id}>
              <div>
                <p className="font-medium text-slate-950">{event.ruleName}</p>
                <p className="text-sm text-slate-500">{formatDate(event.detectedAt)}</p>
              </div>
              <div className="flex items-center gap-3">
                <Badge tone={event.severity === "critical" || event.severity === "high" ? "danger" : "warning"}>
                  {event.severity}
                </Badge>
                <Badge>{event.status}</Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

