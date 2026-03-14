import { listAuditLogs, listDeviceSessions } from "@banking/database";
import { Badge, Button, Card, CardDescription, CardTitle, PageHeader } from "@banking/ui";
import { formatDate } from "@banking/utils";
import { FlashBanner } from "../../../components/flash-banner";
import { MfaManager } from "../../../components/mfa-manager";
import { createSupabaseServerClient } from "../../../lib/supabase/server";
import { updateDeviceTrustAction } from "./actions";

export default async function SettingsPage({
  searchParams
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const supabase = await createSupabaseServerClient();
  const [auditLogs, devices] = await Promise.all([
    listAuditLogs(supabase),
    listDeviceSessions(supabase)
  ]);
  const message =
    typeof searchParams?.message === "string" ? searchParams.message : undefined;
  const error =
    typeof searchParams?.error === "string" ? searchParams.error : undefined;
  const shouldAutoStartMfa =
    typeof searchParams?.mfa === "string" && searchParams.mfa === "setup";

  return (
    <div className="space-y-6">
      <PageHeader
        actionLabel="Manage MFA"
        actionHref="/settings#mfa"
        description="Security posture, trusted devices, alert preferences, and audit visibility."
        eyebrow="Settings"
        title="Security and preferences"
      />
      <FlashBanner message={message} tone="success" />
      <FlashBanner message={error} tone="error" />
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="space-y-4">
          <CardTitle>Security controls</CardTitle>
          <CardDescription>MFA enrollment and trusted-device management are available through the unified auth APIs.</CardDescription>
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
              <p className="text-sm font-medium text-slate-900">Trusted devices</p>
              <Badge>{devices.filter((device) => device.trusted).length} trusted</Badge>
            </div>
          </div>
          <div className="space-y-3">
            {devices.map((device) => (
              <div className="flex flex-col gap-3 rounded-2xl bg-slate-50 px-4 py-3 md:flex-row md:items-center md:justify-between" key={device.id}>
                <div>
                  <p className="text-sm font-medium text-slate-900">{device.userAgent}</p>
                  <p className="text-xs text-slate-500">Last seen {formatDate(device.lastSeenAt)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge tone={device.trusted ? "success" : "warning"}>{device.trusted ? "Trusted" : "Review"}</Badge>
                  <form action={updateDeviceTrustAction}>
                    <input name="deviceSessionId" type="hidden" value={device.id} />
                    <input name="trusted" type="hidden" value={device.trusted ? "false" : "true"} />
                    <Button type="submit" variant="secondary">
                      {device.trusted ? "Remove trust" : "Trust device"}
                    </Button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </Card>
        <Card className="space-y-4">
          <CardTitle>Audit trail</CardTitle>
          <CardDescription>Key customer-visible events captured for traceability.</CardDescription>
          <div className="space-y-3">
            {auditLogs.map((log) => (
              <div className="rounded-2xl bg-slate-50 px-4 py-3" key={log.id}>
                <p className="font-medium text-slate-950">{log.action}</p>
                <p className="text-sm text-slate-500">
                  {log.entity} | {formatDate(log.timestamp)}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>
      <MfaManager autoStart={shouldAutoStartMfa} />
    </div>
  );
}
