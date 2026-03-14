import { listAuthenticatedAccounts, listAuthenticatedBills } from "@banking/database";
import { Badge, Button, Card, CardDescription, CardTitle, PageHeader } from "@banking/ui";
import { formatCurrency, formatDate } from "@banking/utils";
import { FlashBanner } from "../../../components/flash-banner";
import { createSupabaseServerClient } from "../../../lib/supabase/server";
import { payBillAction, scheduleBillAction } from "./actions";

export default async function BillsPage({
  searchParams
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const supabase = await createSupabaseServerClient();
  const [bills, accounts] = await Promise.all([
    listAuthenticatedBills(supabase),
    listAuthenticatedAccounts(supabase)
  ]);
  const checkingAccounts = accounts.filter((account) => account.accountType === "checking");
  const message =
    typeof searchParams?.message === "string" ? searchParams.message : undefined;
  const error =
    typeof searchParams?.error === "string" ? searchParams.error : undefined;

  return (
    <div className="space-y-6">
      <PageHeader
        actionLabel="Add payee"
        actionHref="/bills#schedule"
        description="Recurring and one-time payments with autopay and reminder hooks."
        eyebrow="Bill Pay"
        title="Scheduled bills"
      />
      <FlashBanner message={message} tone="success" />
      <FlashBanner message={error} tone="error" />
      <div className="grid gap-4">
        {bills.map((bill) => (
          <Card className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between" key={bill.id}>
            <div>
              <CardTitle>{bill.payeeName}</CardTitle>
              <CardDescription>Due {formatDate(bill.dueDate)} | {bill.frequency}</CardDescription>
            </div>
            <div className="flex flex-col gap-3 md:items-end">
              <div className="flex items-center gap-3">
                <Badge>Autopay ready</Badge>
                <Badge tone={bill.status === "paid" ? "success" : "warning"}>{bill.status}</Badge>
                <p className="text-lg font-semibold text-slate-950">{formatCurrency(bill.amount)}</p>
              </div>
              {bill.status !== "paid" && checkingAccounts.length > 0 ? (
                <form action={payBillAction} className="flex w-full flex-col gap-2 md:w-auto md:flex-row">
                  <input name="billId" type="hidden" value={bill.id} />
                  <select
                    className="h-10 min-w-[220px] rounded-2xl border border-slate-200 px-3 text-sm"
                    defaultValue={checkingAccounts[0]?.id}
                    name="sourceAccountId"
                    required
                  >
                    {checkingAccounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        Pay from {account.nickname}
                      </option>
                    ))}
                  </select>
                  <Button type="submit" variant="secondary">Pay now</Button>
                </form>
              ) : null}
            </div>
          </Card>
        ))}
      </div>
      <Card className="space-y-4" id="schedule">
        <div>
          <CardTitle>Schedule a new bill</CardTitle>
          <CardDescription>Create a payee and schedule a recurring or one-time payment.</CardDescription>
        </div>
        <form action={scheduleBillAction} className="grid gap-3 md:grid-cols-2">
          <input className="h-11 rounded-2xl border border-slate-200 px-4" name="payeeName" placeholder="Payee name" required type="text" />
          <select className="h-11 rounded-2xl border border-slate-200 px-4" defaultValue="Utilities" name="payeeCategory">
            <option value="Housing">Housing</option>
            <option value="Utilities">Utilities</option>
            <option value="Phone">Phone</option>
            <option value="Insurance">Insurance</option>
            <option value="Credit Card">Credit Card</option>
            <option value="Other">Other</option>
          </select>
          <input className="h-11 rounded-2xl border border-slate-200 px-4" min="0.01" name="amount" placeholder="Amount" required step="0.01" type="number" />
          <input className="h-11 rounded-2xl border border-slate-200 px-4" name="dueDate" required type="date" />
          <label className="flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-600 md:col-span-2">
            <input name="autopay" type="checkbox" />
            Enable autopay for this bill
          </label>
          <Button className="md:col-span-2" type="submit">Schedule bill</Button>
        </form>
      </Card>
      <Card className="space-y-3">
        <CardTitle>Reminder policy</CardTitle>
        <CardDescription>Reminders trigger 48 hours before due date and escalate to notifications if bills remain unpaid.</CardDescription>
      </Card>
    </div>
  );
}
