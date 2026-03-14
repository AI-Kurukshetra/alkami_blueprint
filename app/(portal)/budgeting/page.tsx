import { getBudgetInsights, listBudgetTargets } from "@banking/database";
import { Badge, Card, CardDescription, CardTitle, PageHeader } from "@banking/ui";
import { formatCurrency } from "@banking/utils";
import { FlashBanner } from "../../../components/flash-banner";
import { FormSubmitButton } from "../../../components/form-submit-button";
import { PortalActionButton } from "../../../components/portal-action-button";
import { createSupabaseServerClient } from "../../../lib/supabase/server";
import { saveBudgetTargetAction } from "./actions";

export default async function BudgetingPage({
  searchParams
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const supabase = await createSupabaseServerClient();
  const [targets, insights] = await Promise.all([
    listBudgetTargets(supabase),
    getBudgetInsights(supabase)
  ]);
  const message =
    typeof searchParams?.message === "string" ? searchParams.message : undefined;
  const error =
    typeof searchParams?.error === "string" ? searchParams.error : undefined;

  return (
    <div className="space-y-6">
      <PageHeader
        actionLabel="Add budget"
        actionHref="/budgeting#target-form"
        description="Category-based spending controls with watch thresholds and utilization tracking."
        eyebrow="Budgeting"
        title="Budgeting tools"
      />
      <FlashBanner message={message} tone="success" />
      <FlashBanner message={error} tone="error" />
      <div className="grid gap-4 xl:grid-cols-3">
        {insights.map((insight) => (
          <Card className="space-y-3" key={insight.category}>
            <div className="flex items-center justify-between">
              <CardTitle>{insight.category}</CardTitle>
              <Badge
                tone={
                  insight.status === "on_track"
                    ? "success"
                    : insight.status === "watch"
                      ? "warning"
                      : "default"
                }
              >
                {insight.status.replace("_", " ")}
              </Badge>
            </div>
            <CardDescription>
              {formatCurrency(insight.spentAmount)} of {formatCurrency(insight.limitAmount)} used
            </CardDescription>
            <div className="h-3 overflow-hidden rounded-full bg-slate-100">
              <div
                className={
                  insight.status === "on_track"
                    ? "h-full bg-emerald-500"
                    : insight.status === "watch"
                      ? "h-full bg-amber-500"
                      : "h-full bg-rose-500"
                }
                style={{ width: `${Math.min(insight.utilization * 100, 100)}%` }}
              />
            </div>
            <p className="text-sm text-slate-500">
              Remaining {formatCurrency(Math.max(insight.remainingAmount, 0))}
            </p>
          </Card>
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <Card className="space-y-4">
          <div>
            <CardTitle>Budget targets</CardTitle>
            <CardDescription>Targets are monthly and update against your categorized transaction activity.</CardDescription>
          </div>
          <div className="space-y-3">
            {targets.map((target) => (
              <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3" key={target.id}>
                <div>
                  <p className="font-medium text-slate-950">{target.category}</p>
                  <p className="text-sm text-slate-500">
                    Alert at {Math.round(target.alertThreshold * 100)}% utilization
                  </p>
                </div>
                <p className="font-semibold text-slate-950">{formatCurrency(target.limitAmount)}</p>
              </div>
            ))}
          </div>
        </Card>
        <Card className="space-y-4" id="target-form">
          <div>
            <CardTitle>Set or update a budget</CardTitle>
            <CardDescription>Create a new category target or overwrite the current monthly target.</CardDescription>
          </div>
          <form action={saveBudgetTargetAction} className="grid gap-3">
            <input className="h-11 rounded-2xl border border-slate-200 px-4" name="category" placeholder="Category" required type="text" />
            <input className="h-11 rounded-2xl border border-slate-200 px-4" min="1" name="limitAmount" placeholder="Monthly limit" required step="0.01" type="number" />
            <select className="h-11 rounded-2xl border border-slate-200 px-4" defaultValue="0.8" name="alertThreshold">
              <option value="0.7">Alert at 70%</option>
              <option value="0.8">Alert at 80%</option>
              <option value="0.9">Alert at 90%</option>
            </select>
            <FormSubmitButton pendingLabel="Saving budget..." type="submit">
              Save budget target
            </FormSubmitButton>
          </form>
          <PortalActionButton
            body={{ action: "month_close" }}
            endpoint="/api/budgets"
            errorMessage="Unable to run budget month close."
            errorPath="/budgeting"
            pendingLabel="Closing month..."
            successMessage="Month close completed."
            successPath="/budgeting"
            variant="secondary"
          >
            Run month close
          </PortalActionButton>
        </Card>
      </div>
    </div>
  );
}
