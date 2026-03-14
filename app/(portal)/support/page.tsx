import { listSupportTickets, streamSupportChat } from "@banking/database";
import { Badge, Button, Card, CardDescription, CardTitle, PageHeader } from "@banking/ui";
import { formatDate } from "@banking/utils";
import { FlashBanner } from "../../../components/flash-banner";
import { createSupabaseServerClient } from "../../../lib/supabase/server";
import { createSupportTicketAction } from "./actions";

export default async function SupportPage({
  searchParams
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const supabase = await createSupabaseServerClient();
  const [tickets, chat] = await Promise.all([
    listSupportTickets(supabase),
    streamSupportChat()
  ]);
  const message =
    typeof searchParams?.message === "string" ? searchParams.message : undefined;
  const error =
    typeof searchParams?.error === "string" ? searchParams.error : undefined;

  return (
    <div className="space-y-6">
      <PageHeader
        actionLabel="Open ticket"
        actionHref="/support#open-ticket"
        description="Support ticketing with live secure chat and nearby service discovery."
        eyebrow="Support"
        title="Support center"
      />
      <FlashBanner message={message} tone="success" />
      <FlashBanner message={error} tone="error" />
      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="space-y-4">
          <CardTitle>Open tickets</CardTitle>
          <CardDescription>Case posture and latest service updates.</CardDescription>
          <div className="space-y-3">
            {tickets.map((ticket) => (
              <div className="rounded-2xl bg-slate-50 p-4" key={ticket.id}>
                <div className="flex items-center justify-between">
                  <p className="font-medium text-slate-950">{ticket.subject}</p>
                  <Badge tone={ticket.status === "resolved" ? "success" : "warning"}>{ticket.status}</Badge>
                </div>
                <p className="mt-2 text-sm text-slate-500">{ticket.latestMessage}</p>
                <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-400">
                  {formatDate(ticket.createdAt)}
                </p>
              </div>
            ))}
          </div>
        </Card>
        <Card className="space-y-4">
          <CardTitle>ATM and branch support</CardTitle>
          <CardDescription>Nearby assistance discovery and secure streaming support in one view.</CardDescription>
          <div className="rounded-[24px] bg-slate-950 p-5 text-slate-200">
            <p className="text-sm uppercase tracking-[0.18em] text-sky-300">Nearest ATM</p>
            <p className="mt-2 text-2xl font-semibold text-white">MG Road Financial Center</p>
            <p className="mt-2 text-sm">1.2 km away • Cash deposit • 24/7 vestibule access</p>
          </div>
          <div className="space-y-3 rounded-[24px] bg-slate-50 p-4">
            <p className="text-sm font-medium text-slate-900">Secure chat</p>
            {chat.map((message) => (
              <div className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-600" key={message.id}>
                <strong className="mr-2 capitalize text-slate-900">{message.author}</strong>
                {message.body}
              </div>
            ))}
          </div>
        </Card>
      </div>
      <Card className="space-y-4" id="open-ticket">
        <div>
          <CardTitle>Create a support ticket</CardTitle>
          <CardDescription>Open a secure case directly from the customer portal.</CardDescription>
        </div>
        <form action={createSupportTicketAction} className="grid gap-3 md:grid-cols-2">
          <input className="h-11 rounded-2xl border border-slate-200 px-4 md:col-span-2" name="subject" placeholder="Subject" required type="text" />
          <select className="h-11 rounded-2xl border border-slate-200 px-4" defaultValue="medium" name="priority">
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          <div className="hidden md:block" />
          <textarea className="min-h-32 rounded-2xl border border-slate-200 px-4 py-3 md:col-span-2" name="message" placeholder="Describe the issue or request" required />
          <Button className="md:col-span-2" type="submit">Open support ticket</Button>
        </form>
      </Card>
    </div>
  );
}
