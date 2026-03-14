import Link from "next/link";
import { searchAuthenticatedTransactions } from "@banking/database";
import { Badge, Button, Card, CardDescription, CardTitle, PageHeader } from "@banking/ui";
import { formatCurrency, formatDate } from "@banking/utils";
import { FormSubmitButton } from "../../../components/form-submit-button";
import { createSupabaseServerClient } from "../../../lib/supabase/server";

export default async function TransactionsPage({
  searchParams
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const q = typeof searchParams?.q === "string" ? searchParams.q : undefined;
  const direction =
    typeof searchParams?.direction === "string" ? searchParams.direction : undefined;
  const category =
    typeof searchParams?.category === "string" ? searchParams.category : undefined;

  const supabase = await createSupabaseServerClient();
  const transactions = await searchAuthenticatedTransactions(
    { q, direction, category, limit: 100 },
    supabase
  );
  const exportParams = new URLSearchParams();

  if (q) exportParams.set("q", q);
  if (direction) exportParams.set("direction", direction);
  if (category) exportParams.set("category", category);

  return (
    <div className="space-y-6">
      <PageHeader
        actionLabel="Search activity"
        actionHref="/transactions#search"
        description="Transaction history across purchases, credits, transfers, and scheduled activity."
        eyebrow="Transactions"
        title="Transaction history"
      />
      <Card className="space-y-4">
        <div>
          <CardTitle>Recent activity</CardTitle>
          <CardDescription>Search, filter, and export are available from the same page.</CardDescription>
        </div>
        <form className="grid gap-3 md:grid-cols-[1.2fr_0.8fr_0.8fr_auto_auto]" id="search">
          <input className="h-11 rounded-2xl border border-slate-200 px-4" defaultValue={q} name="q" placeholder="Search merchant or description" />
          <select className="h-11 rounded-2xl border border-slate-200 px-4" defaultValue={direction ?? ""} name="direction">
            <option value="">All directions</option>
            <option value="debit">Debit</option>
            <option value="credit">Credit</option>
          </select>
          <input className="h-11 rounded-2xl border border-slate-200 px-4" defaultValue={category} name="category" placeholder="Category" />
          <FormSubmitButton pendingLabel="Applying..." type="submit">
            Apply
          </FormSubmitButton>
          <div className="flex gap-2">
            <Button asChild type="button" variant="secondary">
              <Link href={`/api/transactions/export?${exportParams.toString()}${exportParams.size ? "&" : ""}format=csv`}>CSV</Link>
            </Button>
            <Button asChild type="button" variant="secondary">
              <Link href={`/api/transactions/export?${exportParams.toString()}${exportParams.size ? "&" : ""}format=pdf`}>PDF</Link>
            </Button>
          </div>
        </form>
        <div className="space-y-3">
          {transactions.map((transaction) => (
            <div
              className="flex flex-col gap-3 rounded-[24px] bg-slate-50 px-4 py-4 md:flex-row md:items-center md:justify-between"
              key={transaction.id}
            >
              <div>
                <p className="font-medium text-slate-950">{transaction.description}</p>
                <p className="text-sm text-slate-500">
                  {transaction.merchantName ?? transaction.category} • {formatDate(transaction.postedAt)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge tone={transaction.direction === "credit" ? "success" : "default"}>
                  {transaction.type}
                </Badge>
                <p className="text-sm font-semibold text-slate-950">
                  {transaction.direction === "debit" ? "-" : "+"}
                  {formatCurrency(transaction.amount)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
