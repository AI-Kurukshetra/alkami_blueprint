import { listAuthenticatedAccounts, quoteTransfer } from "@banking/database";
import { Badge, Card, CardDescription, CardTitle, PageHeader } from "@banking/ui";
import { formatCurrency } from "@banking/utils";
import { FlashBanner } from "../../../components/flash-banner";
import { FormSubmitButton } from "../../../components/form-submit-button";
import { createSupabaseServerClient } from "../../../lib/supabase/server";
import { submitTransferAction } from "./actions";

export default async function TransfersPage({
  searchParams
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const supabase = await createSupabaseServerClient();
  const accounts = await listAuthenticatedAccounts(supabase);
  const message =
    typeof searchParams?.message === "string" ? searchParams.message : undefined;
  const error =
    typeof searchParams?.error === "string" ? searchParams.error : undefined;
  const preview = await quoteTransfer({
    fromAccountId: accounts[0]?.id,
    toAccountId: accounts[1]?.id,
    amount: 1750,
    memo: "Monthly reserve",
    rail: "internal"
  });

  return (
    <div className="space-y-6">
      <PageHeader
        actionLabel="Review limits"
        actionHref="/cards#controls"
        description="Internal transfer orchestration with live external ACH submission and fraud review signals."
        eyebrow="Transfers"
        title="Move money"
      />
      <FlashBanner message={message} tone="success" />
      <FlashBanner message={error} tone="error" />
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="space-y-4">
          <CardTitle>Available accounts</CardTitle>
          <CardDescription>Source and destination products eligible for transfers.</CardDescription>
          <div className="space-y-3">
            {accounts.map((account) => (
              <div className="rounded-2xl bg-slate-50 px-4 py-3" key={account.id}>
                <p className="font-medium text-slate-950">{account.nickname}</p>
                <p className="text-sm text-slate-500">{formatCurrency(account.availableBalance)}</p>
              </div>
            ))}
          </div>
        </Card>
        <Card className="space-y-4">
          <CardTitle>Create transfer</CardTitle>
          <CardDescription>Internal transfers update balances immediately. ACH debits the selected account and records the external destination.</CardDescription>
          <form action={submitTransferAction} className="grid gap-4 md:grid-cols-2">
            <select
              className="h-11 rounded-2xl border border-slate-200 px-4"
              defaultValue={accounts[0]?.id}
              name="fromAccountId"
              required
            >
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>{account.nickname}</option>
              ))}
            </select>
            <select
              className="h-11 rounded-2xl border border-slate-200 px-4"
              defaultValue=""
              name="toAccountId"
            >
              <option value="">Choose owned destination for internal transfers</option>
              {accounts.map((account) => (
                <option key={`${account.id}-destination`} value={account.id}>{account.nickname}</option>
              ))}
            </select>
            <select className="h-11 rounded-2xl border border-slate-200 px-4 md:col-span-2" name="rail">
              <option value="internal">Internal transfer</option>
              <option value="ach">External ACH</option>
            </select>
            <input
              className="h-11 rounded-2xl border border-slate-200 px-4 md:col-span-2"
              name="externalDestination"
              placeholder="External destination label for ACH"
              type="text"
            />
            <input className="h-11 rounded-2xl border border-slate-200 px-4 md:col-span-2" min="0.01" name="amount" placeholder="Amount" required step="0.01" type="number" />
            <input className="h-11 rounded-2xl border border-slate-200 px-4 md:col-span-2" name="memo" placeholder="Memo" type="text" />
            <FormSubmitButton className="md:col-span-2" pendingLabel="Submitting..." type="submit">
              Submit transfer
            </FormSubmitButton>
          </form>
          <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
            Preview: {preview.estimatedDelivery} delivery | risk posture{" "}
            <Badge tone={preview.risk === "approved" ? "success" : "warning"}>{preview.risk}</Badge>
          </div>
          <p className="text-sm text-slate-500">
            Use one of your own destination accounts for internal transfers. For ACH, leave the owned destination blank and enter the external destination label.
          </p>
        </Card>
      </div>
    </div>
  );
}
