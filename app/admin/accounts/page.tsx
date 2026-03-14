import { listAccounts } from "@banking/database";
import { Badge, Card, CardDescription, CardTitle, PageHeader } from "@banking/ui";
import { formatCurrency, maskAccount } from "@banking/utils";
import { createSupabaseServerClient } from "../../../lib/supabase/server";

export default async function AdminAccountsPage() {
  const supabase = await createSupabaseServerClient();
  const accounts = await listAccounts(supabase);

  return (
    <div className="space-y-6">
      <PageHeader
        description="Operational account inventory and current status posture."
        eyebrow="Admin"
        title="Account operations"
      />
      <div className="grid gap-4 xl:grid-cols-2">
        {accounts.map((account) => (
          <Card key={account.id}>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>{account.nickname}</CardTitle>
                <CardDescription>{maskAccount(account.accountNumber)}</CardDescription>
              </div>
              <Badge tone={account.status === "active" ? "success" : "warning"}>{account.status}</Badge>
            </div>
            <p className="mt-4 text-2xl font-semibold text-slate-950">{formatCurrency(account.balance)}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}

