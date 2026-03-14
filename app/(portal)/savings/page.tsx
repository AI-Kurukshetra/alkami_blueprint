import { listAuthenticatedAccounts, listSavingsRules } from "@banking/database";
import { Badge, Card, CardDescription, CardTitle, PageHeader } from "@banking/ui";
import { formatCurrency, formatDate } from "@banking/utils";
import { FlashBanner } from "../../../components/flash-banner";
import { FormSubmitButton } from "../../../components/form-submit-button";
import { PortalActionButton } from "../../../components/portal-action-button";
import { createSupabaseServerClient } from "../../../lib/supabase/server";
import {
  createSavingsRuleAction,
  toggleSavingsRuleAction
} from "./actions";

export default async function SavingsPage({
  searchParams
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const supabase = await createSupabaseServerClient();
  const [accounts, rules] = await Promise.all([
    listAuthenticatedAccounts(supabase),
    listSavingsRules(supabase)
  ]);
  const sourceAccounts = accounts.filter((account) => account.accountType === "checking");
  const destinationAccounts = accounts.filter((account) => account.accountType === "savings");
  const message =
    typeof searchParams?.message === "string" ? searchParams.message : undefined;
  const error =
    typeof searchParams?.error === "string" ? searchParams.error : undefined;

  return (
    <div className="space-y-6">
      <PageHeader
        actionLabel="New automation"
        actionHref="/savings#automation-form"
        description="Configure recurring, roundup, and percentage-based savings automation rules."
        eyebrow="Savings"
        title="Savings automation"
      />
      <FlashBanner message={message} tone="success" />
      <FlashBanner message={error} tone="error" />
      <div className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
        <Card className="space-y-4">
          <div>
            <CardTitle>Active rules</CardTitle>
            <CardDescription>Savings automations stay user-scoped and can be paused without deleting the rule.</CardDescription>
          </div>
          <div className="space-y-3">
            {rules.map((rule) => {
              const source = accounts.find((account) => account.id === rule.sourceAccountId);
              const destination = accounts.find((account) => account.id === rule.destinationAccountId);

              return (
                <div className="space-y-3 rounded-2xl bg-slate-50 px-4 py-4" key={rule.id}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-950">
                        {rule.ruleType} transfer to {destination?.nickname ?? "Savings"}
                      </p>
                      <p className="text-sm text-slate-500">
                        From {source?.nickname ?? "Source account"} | {rule.cadence}
                      </p>
                    </div>
                    <Badge tone={rule.active ? "success" : "warning"}>
                      {rule.active ? "active" : "paused"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm text-slate-600">
                    <span>Amount {formatCurrency(rule.amount)}</span>
                    <span>
                      Next run {rule.nextRunAt ? formatDate(rule.nextRunAt) : "On each eligible transaction"}
                    </span>
                  </div>
                  <form action={toggleSavingsRuleAction}>
                    <input name="ruleId" type="hidden" value={rule.id} />
                    <input name="nextState" type="hidden" value={rule.active ? "false" : "true"} />
                    <FormSubmitButton pendingLabel="Updating..." type="submit" variant="secondary">
                      {rule.active ? "Pause rule" : "Resume rule"}
                    </FormSubmitButton>
                  </form>
                </div>
              );
            })}
          </div>
        </Card>
        <Card className="space-y-4" id="automation-form">
          <div>
            <CardTitle>Create savings automation</CardTitle>
            <CardDescription>Start with simple recurring moves, then expand into roundups or paycheck percentages.</CardDescription>
          </div>
          <form action={createSavingsRuleAction} className="grid gap-3">
            <select className="h-11 rounded-2xl border border-slate-200 px-4" defaultValue={sourceAccounts[0]?.id} name="sourceAccountId" required>
              {sourceAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  Source: {account.nickname}
                </option>
              ))}
            </select>
            <select className="h-11 rounded-2xl border border-slate-200 px-4" defaultValue={destinationAccounts[0]?.id} name="destinationAccountId" required>
              {destinationAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  Destination: {account.nickname}
                </option>
              ))}
            </select>
            <select className="h-11 rounded-2xl border border-slate-200 px-4" defaultValue="recurring" name="ruleType">
              <option value="recurring">Recurring transfer</option>
              <option value="roundup">Round up purchases</option>
              <option value="percentage">Percentage transfer</option>
            </select>
            <select className="h-11 rounded-2xl border border-slate-200 px-4" defaultValue="monthly" name="cadence">
              <option value="weekly">Weekly</option>
              <option value="biweekly">Biweekly</option>
              <option value="monthly">Monthly</option>
              <option value="per_transaction">Per transaction</option>
            </select>
            <input className="h-11 rounded-2xl border border-slate-200 px-4" min="0.01" name="amount" placeholder="Amount" required step="0.01" type="number" />
            <label className="flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-600">
              <input defaultChecked name="active" type="checkbox" />
              Enable this rule immediately
            </label>
            <FormSubmitButton pendingLabel="Creating rule..." type="submit">
              Create savings rule
            </FormSubmitButton>
          </form>
          <PortalActionButton
            body={{ action: "execute" }}
            endpoint="/api/savings-rules"
            errorMessage="Unable to execute savings automation."
            errorPath="/savings"
            pendingLabel="Running engine..."
            successMessage="Automation engine processed eligible rules."
            successPath="/savings"
            variant="secondary"
          >
            Run automation engine
          </PortalActionButton>
        </Card>
      </div>
    </div>
  );
}
