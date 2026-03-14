import { listAuditLogs } from "@banking/database";
import { Card, CardDescription, CardTitle, PageHeader } from "@banking/ui";
import { formatDate } from "@banking/utils";
import { createSupabaseServerClient } from "../../../lib/supabase/server";

export default async function AdminCompliancePage() {
  const supabase = await createSupabaseServerClient();
  const auditLogs = await listAuditLogs(supabase);

  return (
    <div className="space-y-6">
      <PageHeader
        description="Audit visibility for operator workflows and customer-facing events."
        eyebrow="Admin"
        title="Compliance logging"
      />
      <Card className="space-y-4">
        <CardTitle>Audit events</CardTitle>
        <CardDescription>Structured logs are modeled in Postgres and ready for downstream SIEM shipping.</CardDescription>
        <div className="space-y-3">
          {auditLogs.map((log) => (
            <div className="rounded-2xl bg-slate-50 px-4 py-4" key={log.id}>
              <p className="font-medium text-slate-950">{log.action}</p>
              <p className="text-sm text-slate-500">
                {log.entity} • {formatDate(log.timestamp)}
              </p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
