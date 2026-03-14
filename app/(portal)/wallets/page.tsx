import { listAuthenticatedCards, listWalletTokens } from "@banking/database";
import { Badge, Card, CardDescription, CardTitle, PageHeader } from "@banking/ui";
import { formatDate } from "@banking/utils";
import { FlashBanner } from "../../../components/flash-banner";
import { FormSubmitButton } from "../../../components/form-submit-button";
import { createSupabaseServerClient } from "../../../lib/supabase/server";
import {
  createWalletTokenAction,
  updateWalletTokenStatusAction
} from "./actions";

export default async function WalletsPage({
  searchParams
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const supabase = await createSupabaseServerClient();
  const [cards, walletTokens] = await Promise.all([
    listAuthenticatedCards(supabase),
    listWalletTokens(supabase)
  ]);
  const message =
    typeof searchParams?.message === "string" ? searchParams.message : undefined;
  const error =
    typeof searchParams?.error === "string" ? searchParams.error : undefined;

  return (
    <div className="space-y-6">
      <PageHeader
        actionLabel="Enroll device"
        actionHref="/wallets#enroll-form"
        description="Wallet provisioning hooks and suspension controls for Apple Pay and Google Pay."
        eyebrow="Wallets"
        title="Digital wallets"
      />
      <FlashBanner message={message} tone="success" />
      <FlashBanner message={error} tone="error" />
      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="space-y-4" id="enroll-form">
          <div>
            <CardTitle>Provision a wallet</CardTitle>
            <CardDescription>Submit a new device enrollment against an eligible active card.</CardDescription>
          </div>
          <form action={createWalletTokenAction} className="grid gap-3">
            <select className="h-11 rounded-2xl border border-slate-200 px-4" defaultValue={cards[0]?.id} name="cardId" required>
              {cards.map((card) => (
                <option key={card.id} value={card.id}>
                  {card.network} {card.cardType} ending {card.last4}
                </option>
              ))}
            </select>
            <select className="h-11 rounded-2xl border border-slate-200 px-4" defaultValue="apple_pay" name="provider">
              <option value="apple_pay">Apple Pay</option>
              <option value="google_pay">Google Pay</option>
            </select>
            <input className="h-11 rounded-2xl border border-slate-200 px-4" name="deviceLabel" placeholder="Device label" required type="text" />
            <FormSubmitButton pendingLabel="Submitting..." type="submit">
              Start enrollment
            </FormSubmitButton>
          </form>
        </Card>
        <Card className="space-y-4">
          <div>
            <CardTitle>Provisioned devices</CardTitle>
            <CardDescription>Resume or suspend customer wallet tokens from the banking app.</CardDescription>
          </div>
          <div className="space-y-3">
            {walletTokens.map((token) => {
              const card = cards.find((item) => item.id === token.cardId);

              return (
                <div className="space-y-3 rounded-2xl bg-slate-50 px-4 py-4" key={token.id}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-950">{token.deviceLabel}</p>
                      <p className="text-sm text-slate-500">
                        {token.provider === "apple_pay" ? "Apple Pay" : "Google Pay"} | Card ending {card?.last4 ?? "----"}
                      </p>
                    </div>
                    <Badge tone={token.status === "active" ? "success" : "warning"}>
                      {token.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-500">Created {formatDate(token.createdAt)}</p>
                  <form action={updateWalletTokenStatusAction}>
                    <input name="walletTokenId" type="hidden" value={token.id} />
                    <input name="status" type="hidden" value={token.status === "suspended" ? "active" : "suspended"} />
                    <FormSubmitButton pendingLabel="Updating..." type="submit" variant="secondary">
                      {token.status === "suspended" ? "Reactivate token" : "Suspend token"}
                    </FormSubmitButton>
                  </form>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
