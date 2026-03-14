import { getDashboardSnapshot } from "@banking/database";
import { Card, CardDescription, CardTitle, PageHeader } from "@banking/ui";
import { formatCurrency, formatDate, maskAccount } from "@banking/utils";
import { createSupabaseServerClient } from "../../../lib/supabase/server";
import { ListCard } from "../../../components/list-card";
import { MetricCard } from "../../../components/metric-card";

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const snapshot = await getDashboardSnapshot(supabase);

  return (
    <div className="space-y-6">
      <PageHeader
        actionLabel="Latest statement PDF"
        actionHref="/api/accounts/statements?kind=statement"
        description="A consolidated banking workspace for balances, cash flow, goals, and risk-aware notifications."
        eyebrow="Retail Banking"
        title="Customer financial command center"
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard detail="Across deposit and credit products" label="Net worth" value={formatCurrency(snapshot.netWorth)} />
        <MetricCard detail="Cards, ACH, and bill pay this month" label="Spend MTD" value={formatCurrency(snapshot.monthToDateSpend)} />
        <MetricCard detail="Scheduled over the next 10 days" label="Upcoming bills" value={formatCurrency(snapshot.upcomingBills)} />
        <MetricCard detail="Positive vs prior cycle" label="Cash flow" value={formatCurrency(snapshot.cashFlow)} />
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="space-y-4">
          <div>
            <CardTitle>Accounts</CardTitle>
            <CardDescription>Available balance and product posture at a glance.</CardDescription>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {snapshot.accounts.map((account) => (
              <div className="rounded-[24px] bg-slate-50 p-5" key={account.id}>
                <p className="text-sm text-slate-500">{account.nickname}</p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">
                  {formatCurrency(account.balance, account.currency)}
                </p>
                <p className="mt-1 text-sm text-slate-500">{maskAccount(account.accountNumber)}</p>
              </div>
            ))}
          </div>
        </Card>
        <ListCard
          description="System alerts, security posture, and payments that need attention."
          items={snapshot.notifications.map((item) => ({
            title: item.message,
            value: formatDate(item.createdAt),
            badge: { label: item.read ? "Read" : "New", tone: item.read ? "default" : "warning" }
          }))}
          title="Notifications"
        />
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <ListCard
          description="Posted activity across your active deposit products."
          items={snapshot.recentTransactions.map((item) => ({
            title: item.description,
            value: `${item.merchantName ?? item.category} • ${formatCurrency(item.amount)}`,
            badge: { label: item.direction, tone: item.direction === "credit" ? "success" : "default" }
          }))}
          title="Recent transactions"
        />
        <ListCard
          description="Progress against near-term savings milestones."
          items={snapshot.financialGoals.map((item) => ({
            title: item.name,
            value: `${formatCurrency(item.currentAmount)} of ${formatCurrency(item.targetAmount)} by ${formatDate(item.targetDate)}`,
            badge: { label: "On track", tone: "success" }
          }))}
          title="Financial goals"
        />
      </div>
    </div>
  );
}
