import { getAuthenticatedLoanDetails, listAuthenticatedAccounts } from "@banking/database";
import { Badge, Card, CardDescription, CardTitle, PageHeader } from "@banking/ui";
import { formatCurrency, formatDate } from "@banking/utils";
import { FlashBanner } from "../../../components/flash-banner";
import { FormSubmitButton } from "../../../components/form-submit-button";
import { createSupabaseServerClient } from "../../../lib/supabase/server";
import { submitLoanPaymentAction } from "./actions";

export default async function LoansPage({
  searchParams
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const supabase = await createSupabaseServerClient();
  const [loans, accounts] = await Promise.all([
    getAuthenticatedLoanDetails(supabase),
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
        actionLabel="Make payment"
        actionHref="/loans#loan-payments"
        description="Loan balances, rates, scheduled payments, and amortization details."
        eyebrow="Loans"
        title="Loan portfolio"
      />
      <FlashBanner message={message} tone="success" />
      <FlashBanner message={error} tone="error" />
      <div className="grid gap-4 xl:grid-cols-2">
        {loans.map((loan, index) => (
          <Card className="space-y-4" key={loan.id}>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="capitalize">{loan.loanType} loan</CardTitle>
                <CardDescription>Next payment {formatDate(loan.nextPaymentDate)}</CardDescription>
              </div>
              <Badge tone="success">{loan.status}</Badge>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Outstanding balance</p>
                <p className="text-xl font-semibold text-slate-950">{formatCurrency(loan.balance)}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Interest rate</p>
                <p className="text-xl font-semibold text-slate-950">{loan.interestRate}% APR</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Scheduled payment</p>
                <p className="text-xl font-semibold text-slate-950">{formatCurrency(loan.monthlyPayment)}</p>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-900">Amortization preview</p>
              {loan.amortization.map((item) => (
                <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-sm" key={item.installment}>
                  <span>{formatDate(item.paymentDate)}</span>
                  <span>Principal {formatCurrency(item.principal)}</span>
                  <span>Interest {formatCurrency(item.interest)}</span>
                </div>
              ))}
            </div>
            <form
              action={submitLoanPaymentAction}
              className="grid gap-3 md:grid-cols-[1fr_160px_auto]"
              id={index === 0 ? "loan-payments" : undefined}
            >
              <input name="loanId" type="hidden" value={loan.id} />
              <select className="h-11 rounded-2xl border border-slate-200 px-4" defaultValue={checkingAccounts[0]?.id} name="sourceAccountId" required>
                {checkingAccounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.nickname}
                  </option>
                ))}
              </select>
              <input
                className="h-11 rounded-2xl border border-slate-200 px-4"
                defaultValue={loan.monthlyPayment.toFixed(2)}
                min="0.01"
                name="amount"
                required
                step="0.01"
                type="number"
              />
              <FormSubmitButton pendingLabel="Processing..." type="submit">
                Pay now
              </FormSubmitButton>
            </form>
          </Card>
        ))}
      </div>
    </div>
  );
}
