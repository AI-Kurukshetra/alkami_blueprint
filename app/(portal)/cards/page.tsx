import { listCards } from "@banking/database";
import { Badge, Button, Card, CardDescription, CardTitle, PageHeader } from "@banking/ui";
import { FlashBanner } from "../../../components/flash-banner";
import { createSupabaseServerClient } from "../../../lib/supabase/server";
import { toggleCardStatusAction, updateCardLimitAction } from "./actions";

export default async function CardsPage({
  searchParams
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const supabase = await createSupabaseServerClient();
  const cards = await listCards(supabase);
  const message =
    typeof searchParams?.message === "string" ? searchParams.message : undefined;
  const error =
    typeof searchParams?.error === "string" ? searchParams.error : undefined;

  return (
    <div className="space-y-6">
      <PageHeader
        actionLabel="Manage controls"
        actionHref="/cards#controls"
        description="Card posture, spend limits, and fraud-aware operational controls."
        eyebrow="Cards"
        title="Card controls"
      />
      <FlashBanner message={message} tone="success" />
      <FlashBanner message={error} tone="error" />
      <div className="grid gap-4 xl:grid-cols-2" id="controls">
        {cards.map((card) => (
          <Card className="space-y-4 bg-slate-950 text-white" key={card.id}>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white">{card.network} {card.cardType}</CardTitle>
                <CardDescription className="text-slate-300">Ending in {card.last4}</CardDescription>
              </div>
              <Badge tone={card.status === "active" ? "success" : "warning"}>{card.status}</Badge>
            </div>
            <div className="rounded-2xl bg-white/10 p-4 text-sm text-slate-200">
              Spend limit: {card.spendLimit ? `$${card.spendLimit.toLocaleString()}` : "Managed by bank"}
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <form action={toggleCardStatusAction}>
                <input name="cardId" type="hidden" value={card.id} />
                <input name="currentStatus" type="hidden" value={card.status} />
                <Button type="submit" variant="secondary">
                  {card.status === "active" ? "Freeze card" : "Unfreeze card"}
                </Button>
              </form>
              <form action={updateCardLimitAction} className="space-y-2 rounded-2xl bg-white p-3 text-slate-950">
                <input name="cardId" type="hidden" value={card.id} />
                <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Set spend limit
                </label>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    className="h-10 min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-950 placeholder:text-slate-400"
                    defaultValue={card.spendLimit ?? ""}
                    inputMode="decimal"
                    min="1"
                    name="spendLimit"
                    placeholder="Enter new limit"
                    step="0.01"
                    type="number"
                  />
                  <Button className="sm:self-stretch" type="submit" variant="primary">Save limit</Button>
                </div>
              </form>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
