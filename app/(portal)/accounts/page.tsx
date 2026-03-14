import Link from "next/link";
import { listAccounts, listDocuments } from "@banking/database";
import { Badge, Button, Card, CardDescription, CardTitle, PageHeader } from "@banking/ui";
import { formatCurrency, maskAccount } from "@banking/utils";
import { createSupabaseServerClient } from "../../../lib/supabase/server";

function getStatementLabel(storagePath: string) {
  const fileName = storagePath.split("/").pop() ?? "statement";
  const normalized = fileName.replace(/\.pdf$/i, "").replaceAll("-", " ");
  return normalized.replace(/\b\w/g, (value) => value.toUpperCase());
}

export default async function AccountsPage() {
  const supabase = await createSupabaseServerClient();
  const [accounts, statements] = await Promise.all([
    listAccounts(supabase),
    listDocuments(supabase)
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        description="Deposit account portfolio, current balances, and account health."
        eyebrow="Accounts"
        title="Accounts overview"
      />
      <div className="grid gap-4 xl:grid-cols-2">
        {accounts.map((account) => (
          <Card className="space-y-4" key={account.id}>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>{account.nickname}</CardTitle>
                <CardDescription>{maskAccount(account.accountNumber)}</CardDescription>
              </div>
              <Badge tone={account.status === "active" ? "success" : "warning"}>
                {account.status}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-slate-500">Current balance</p>
              <p className="text-3xl font-semibold text-slate-950">
                {formatCurrency(account.balance, account.currency)}
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
              Available balance: {formatCurrency(account.availableBalance, account.currency)}
            </div>
          </Card>
        ))}
      </div>
      <Card className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Documents</CardTitle>
            <CardDescription>Download customer-ready PDFs for statements, summaries, and onboarding disclosures.</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="secondary">
              <Link href="/api/accounts/statements?kind=statement">Latest statement PDF</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/api/accounts/statements?kind=account-summary">Account summary PDF</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/api/accounts/statements?kind=initial-disclosure">Initial disclosure PDF</Link>
            </Button>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {statements.map((statement) => (
            <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3" key={statement.id}>
              <div>
                <p className="font-medium text-slate-950">{getStatementLabel(statement.storagePath)}</p>
                <p className="text-sm text-slate-500">Statement PDF</p>
              </div>
              <Button asChild type="button" variant="secondary">
                <Link href={`/api/accounts/statements?kind=statement&statementId=${statement.id}`}>Download PDF</Link>
              </Button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
