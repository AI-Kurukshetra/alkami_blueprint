import {
  listAuthenticatedAccounts,
  listAuthenticatedFraudEvents,
  listWireTransfers
} from "@banking/database";
import { Badge, Card, CardDescription, CardTitle, PageHeader } from "@banking/ui";
import { formatCurrency, formatDate } from "@banking/utils";
import { FlashBanner } from "../../../components/flash-banner";
import { FormSubmitButton } from "../../../components/form-submit-button";
import { createSupabaseServerClient } from "../../../lib/supabase/server";
import { createWireTransferAction } from "./actions";

export default async function WiresPage({
  searchParams
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const supabase = await createSupabaseServerClient();
  const [accounts, wires, fraudEvents] = await Promise.all([
    listAuthenticatedAccounts(supabase),
    listWireTransfers(supabase),
    listAuthenticatedFraudEvents(supabase)
  ]);
  const message =
    typeof searchParams?.message === "string" ? searchParams.message : undefined;
  const error =
    typeof searchParams?.error === "string" ? searchParams.error : undefined;
  const sourceAccounts = accounts.filter((account) => account.accountType === "checking");
  const blockingEvent = fraudEvents.find(
    (event) => event.status !== "closed" && ["high", "critical"].includes(event.severity)
  );

  return (
    <div className="space-y-6">
      <PageHeader
        actionLabel="New wire"
        actionHref="/wires#wire-form"
        description="Domestic wire initiation with review status, approval timeline, and compliance screening hooks."
        eyebrow="Wires"
        title="Wire transfers"
      />
      <FlashBanner message={message} tone="success" />
      <FlashBanner message={error} tone="error" />
      {blockingEvent ? (
        <FlashBanner
          message="Step-up verification is active on your profile. New wires are blocked until fraud review is resolved."
          tone="info"
        />
      ) : null}
      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="space-y-4" id="wire-form">
          <div>
            <CardTitle>Initiate domestic wire</CardTitle>
            <CardDescription>
              Larger or sensitive transfers automatically route through manual review.
            </CardDescription>
          </div>
          <form action={createWireTransferAction} className="grid gap-3">
            <select className="h-11 rounded-2xl border border-slate-200 px-4" defaultValue={sourceAccounts[0]?.id} name="fromAccountId" required>
              {sourceAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.nickname} | {formatCurrency(account.availableBalance)}
                </option>
              ))}
            </select>
            <input className="h-11 rounded-2xl border border-slate-200 px-4" name="beneficiaryName" placeholder="Beneficiary name" required type="text" />
            <input className="h-11 rounded-2xl border border-slate-200 px-4" name="beneficiaryBank" placeholder="Beneficiary bank" required type="text" />
            <input className="h-11 rounded-2xl border border-slate-200 px-4" inputMode="numeric" name="routingNumber" placeholder="9-digit routing number" required type="text" />
            <input className="h-11 rounded-2xl border border-slate-200 px-4" inputMode="numeric" name="accountNumber" placeholder="Beneficiary account number" required type="text" />
            <input className="h-11 rounded-2xl border border-slate-200 px-4" min="1" name="amount" placeholder="Amount" required step="0.01" type="number" />
            <input className="h-11 rounded-2xl border border-slate-200 px-4" name="purpose" placeholder="Purpose" required type="text" />
            <FormSubmitButton
              disabled={Boolean(blockingEvent)}
              pendingLabel="Submitting wire..."
              type="submit"
            >
              Submit wire
            </FormSubmitButton>
          </form>
        </Card>
        <Card className="space-y-4">
          <div>
            <CardTitle>Status timeline</CardTitle>
            <CardDescription>Track customer submission, manual review, and release posture.</CardDescription>
          </div>
          <div className="space-y-3">
            {wires.map((wire) => (
              <div className="space-y-3 rounded-2xl bg-slate-50 px-4 py-4" key={wire.id}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-slate-950">
                      {wire.beneficiaryName} | {formatCurrency(wire.amount)}
                    </p>
                    <p className="text-sm text-slate-500">
                      {wire.beneficiaryBank} | Created {formatDate(wire.createdAt)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Badge tone={wire.status === "completed" ? "success" : wire.status === "failed" ? "danger" : "warning"}>
                      {wire.status}
                    </Badge>
                    <Badge>{wire.reviewStatus.replace("_", " ")}</Badge>
                  </div>
                </div>
                <div className="grid gap-2 text-sm text-slate-600">
                  <p>Routing {wire.routingNumberMasked}</p>
                  <p>Account ending {wire.accountNumberLast4}</p>
                  <p>Purpose {wire.purpose}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
