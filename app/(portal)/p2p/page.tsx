import {
  listAuthenticatedAccounts,
  listAuthenticatedFraudEvents,
  listP2PContacts,
  listP2PTransfers
} from "@banking/database";
import { Badge, Card, CardDescription, CardTitle, PageHeader } from "@banking/ui";
import { formatCurrency, formatDate } from "@banking/utils";
import { FlashBanner } from "../../../components/flash-banner";
import { P2PContactForm, P2PPaymentForm } from "../../../components/p2p-forms";
import { createSupabaseServerClient } from "../../../lib/supabase/server";

export default async function P2PPage({
  searchParams
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const supabase = await createSupabaseServerClient();
  const [accounts, contacts, transfers, fraudEvents] = await Promise.all([
    listAuthenticatedAccounts(supabase),
    listP2PContacts(supabase),
    listP2PTransfers(supabase),
    listAuthenticatedFraudEvents(supabase)
  ]);
  const message =
    typeof searchParams?.message === "string" ? searchParams.message : undefined;
  const error =
    typeof searchParams?.error === "string" ? searchParams.error : undefined;
  const checkingAccounts = accounts.filter((account) => account.accountType === "checking");
  const blockingEvent = fraudEvents.find(
    (event) => event.status !== "closed" && ["high", "critical"].includes(event.severity)
  );

  return (
    <div className="space-y-6">
      <PageHeader
        actionLabel="Add contact"
        actionHref="/p2p#contact-form"
        description="Peer payments with contact management, send/request flows, and user-scoped activity."
        eyebrow="P2P"
        title="Peer payments"
      />
      <FlashBanner message={message} tone="success" />
      <FlashBanner message={error} tone="error" />
      {blockingEvent ? (
        <FlashBanner
          message="Step-up verification is active because recent fraud monitoring detected unusual outbound activity."
          tone="info"
        />
      ) : null}
      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="space-y-4" id="contact-form">
          <div>
            <CardTitle>Trusted contacts</CardTitle>
            <CardDescription>Add the payees and handles you use for instant peer payments.</CardDescription>
          </div>
          <div className="space-y-3">
            {contacts.map((contact) => (
              <div className="rounded-2xl bg-slate-50 px-4 py-3" key={contact.id}>
                <div className="flex items-center justify-between">
                  <p className="font-medium text-slate-950">{contact.displayName}</p>
                  <Badge tone="success">{contact.status}</Badge>
                </div>
                <p className="text-sm text-slate-500">
                  {contact.handle} | {contact.destinationReference}
                </p>
              </div>
            ))}
          </div>
          <P2PContactForm />
        </Card>
        <Card className="space-y-4">
          <div>
            <CardTitle>Send or request money</CardTitle>
            <CardDescription>Outbound sent payments post immediately when no step-up hold is active.</CardDescription>
          </div>
          <P2PPaymentForm
            blockingMessage={
              blockingEvent
                ? "Step-up verification is active. You can still submit, but outbound peer payments may be declined until review is resolved."
                : undefined
            }
            checkingAccounts={checkingAccounts.map((account) => ({
              id: account.id,
              nickname: account.nickname,
              availableBalance: account.availableBalance
            }))}
            contacts={contacts.map((contact) => ({
              id: contact.id,
              displayName: contact.displayName,
              handle: contact.handle
            }))}
          />
          <div className="space-y-3">
            {transfers.map((transfer) => {
              const contact = contacts.find((item) => item.id === transfer.contactId);

              return (
                <div className="rounded-2xl bg-slate-50 px-4 py-3" key={transfer.id}>
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-slate-950">
                      {transfer.direction === "sent" ? "Sent" : "Requested"} {formatCurrency(transfer.amount)} {contact ? `to ${contact.displayName}` : ""}
                    </p>
                    <Badge tone={transfer.status === "completed" ? "success" : "warning"}>
                      {transfer.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-500">
                    {transfer.note || "No note"} | {formatDate(transfer.createdAt)}
                  </p>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
