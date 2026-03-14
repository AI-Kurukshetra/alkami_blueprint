import Link from "next/link";
import { listFraudEvents, listOperationalWireTransfers } from "@banking/database";
import { Badge, Card, CardDescription, CardTitle, PageHeader } from "@banking/ui";
import { formatCurrency, formatDate } from "@banking/utils";
import { AdminFraudAutomationButton } from "../../../components/admin-fraud-automation-button";
import { FlashBanner } from "../../../components/flash-banner";
import { FormSubmitButton } from "../../../components/form-submit-button";
import { createSupabaseServerClient } from "../../../lib/supabase/server";
import {
  updateFraudEventStatusAction,
  updateWireReviewAction
} from "./actions";

export default async function AdminFraudPage({
  searchParams
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const supabase = await createSupabaseServerClient();
  const [events, wires] = await Promise.all([
    listFraudEvents(supabase),
    listOperationalWireTransfers(supabase)
  ]);
  const message =
    typeof searchParams?.message === "string" ? searchParams.message : undefined;
  const error =
    typeof searchParams?.error === "string" ? searchParams.error : undefined;
  const tab =
    typeof searchParams?.tab === "string" ? searchParams.tab : "open";
  const filter =
    typeof searchParams?.filter === "string" ? searchParams.filter : "all";
  const wireEvents = events.filter((event) => event.ruleName === "wire_review_hold");
  const fraudOnlyEvents = events.filter((event) => event.ruleName !== "wire_review_hold");
  const tabEvents =
    tab === "reviewing"
      ? events.filter((event) => event.status === "reviewing")
      : tab === "closed"
        ? events.filter((event) => event.status === "closed")
        : events.filter((event) => event.status === "open");
  const visibleEvents =
    filter === "wire"
      ? tabEvents.filter((event) => event.ruleName === "wire_review_hold")
      : filter === "fraud"
        ? tabEvents.filter((event) => event.ruleName !== "wire_review_hold")
        : tabEvents;

  return (
    <div className="space-y-6">
      <PageHeader
        description="Suspicious activity hooks, triage status, and model escalation points."
        eyebrow="Admin"
        title="Fraud monitoring"
      />
      <FlashBanner message={message} tone="success" />
      <FlashBanner message={error} tone="error" />
      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="space-y-2">
          <CardTitle>Open events</CardTitle>
          <p className="text-3xl font-semibold text-slate-950">
            {events.filter((event) => event.status === "open").length}
          </p>
        </Card>
        <Card className="space-y-2">
          <CardTitle>Wire review cases</CardTitle>
          <p className="text-3xl font-semibold text-slate-950">{wireEvents.length}</p>
        </Card>
        <Card className="space-y-3">
          <CardTitle>Automation pipeline</CardTitle>
          <CardDescription>Run the rule pack across recent wires and transactions.</CardDescription>
          <AdminFraudAutomationButton filter={filter} tab={tab} />
        </Card>
      </div>
      <Card className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Fraud event queue</CardTitle>
            <CardDescription>Move events through open, reviewing, and closed states.</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { key: "open", label: `Open (${events.filter((event) => event.status === "open").length})` },
              { key: "reviewing", label: `Reviewing (${events.filter((event) => event.status === "reviewing").length})` },
              { key: "closed", label: `Closed (${events.filter((event) => event.status === "closed").length})` }
            ].map((item) => (
              <Link
                className={`rounded-full px-4 py-2 text-sm font-medium ${
                  tab === item.key
                    ? "bg-slate-950 text-white"
                    : "border border-slate-200 bg-white text-slate-700"
                }`}
                href={`/admin/fraud?tab=${item.key}&filter=${filter}`}
                key={item.key}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            { key: "all", label: `All (${events.length})` },
            { key: "fraud", label: `Fraud (${fraudOnlyEvents.length})` },
            { key: "wire", label: `Wire (${wireEvents.length})` }
          ].map((item) => (
            <Link
              className={`rounded-full px-4 py-2 text-sm font-medium ${
                filter === item.key
                  ? "bg-sky-700 text-white"
                  : "border border-slate-200 bg-white text-slate-700"
              }`}
              href={`/admin/fraud?tab=${tab}&filter=${item.key}`}
              key={item.key}
            >
              {item.label}
            </Link>
          ))}
        </div>
        <CardDescription>Fraud review is available in the same deployment as customer banking.</CardDescription>
        <div className="space-y-3">
          {visibleEvents.map((event) => {
            const wireId =
              typeof event.payload?.wireId === "string" ? event.payload.wireId : undefined;
            const linkedWire = wireId ? wires.find((wire) => wire.id === wireId) : undefined;

            return (
            <div className="flex flex-col gap-3 rounded-2xl bg-slate-50 px-4 py-4" key={event.id}>
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-medium text-slate-950">{event.ruleName}</p>
                  <p className="text-sm text-slate-500">
                    {formatDate(event.detectedAt)}
                    {linkedWire
                      ? ` | ${linkedWire.beneficiaryName} | ${formatCurrency(linkedWire.amount)}`
                      : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge>{event.ruleName === "wire_review_hold" ? "wire" : "fraud"}</Badge>
                  <Badge tone={event.severity === "critical" || event.severity === "high" ? "danger" : "warning"}>
                    {event.severity}
                  </Badge>
                  <Badge>{event.status}</Badge>
                </div>
              </div>
              <div className="flex gap-2">
                {tab === "open" ? (
                  <>
                    <form action={updateFraudEventStatusAction}>
                      <input name="fraudEventId" type="hidden" value={event.id} />
                      <input name="status" type="hidden" value="reviewing" />
                      <input name="filter" type="hidden" value={filter} />
                      <FormSubmitButton pendingLabel="Moving..." type="submit" variant="secondary">
                        Mark reviewing
                      </FormSubmitButton>
                    </form>
                    <form action={updateFraudEventStatusAction}>
                      <input name="fraudEventId" type="hidden" value={event.id} />
                      <input name="status" type="hidden" value="closed" />
                      <input name="filter" type="hidden" value={filter} />
                      <FormSubmitButton pendingLabel="Closing..." type="submit">
                        Close event
                      </FormSubmitButton>
                    </form>
                  </>
                ) : null}
                {tab === "reviewing" ? (
                  <>
                    <form action={updateFraudEventStatusAction}>
                      <input name="fraudEventId" type="hidden" value={event.id} />
                      <input name="status" type="hidden" value="open" />
                      <input name="filter" type="hidden" value={filter} />
                      <FormSubmitButton pendingLabel="Reopening..." type="submit" variant="secondary">
                        Mark open
                      </FormSubmitButton>
                    </form>
                    <form action={updateFraudEventStatusAction}>
                      <input name="fraudEventId" type="hidden" value={event.id} />
                      <input name="status" type="hidden" value="closed" />
                      <input name="filter" type="hidden" value={filter} />
                      <FormSubmitButton pendingLabel="Closing..." type="submit">
                        Close event
                      </FormSubmitButton>
                    </form>
                  </>
                ) : null}
                {tab === "closed" ? (
                  <form action={updateFraudEventStatusAction}>
                    <input name="fraudEventId" type="hidden" value={event.id} />
                    <input name="status" type="hidden" value="open" />
                    <input name="filter" type="hidden" value={filter} />
                    <FormSubmitButton pendingLabel="Reopening..." type="submit">
                      Reopen
                    </FormSubmitButton>
                  </form>
                ) : null}
                {linkedWire && linkedWire.reviewStatus !== "approved" ? (
                  <>
                    <form action={updateWireReviewAction}>
                      <input name="wireId" type="hidden" value={linkedWire.id} />
                      <input name="reviewStatus" type="hidden" value="approved" />
                      <input name="filter" type="hidden" value={filter} />
                      <FormSubmitButton pendingLabel="Approving..." type="submit" variant="secondary">
                        Approve wire
                      </FormSubmitButton>
                    </form>
                    <form action={updateWireReviewAction}>
                      <input name="wireId" type="hidden" value={linkedWire.id} />
                      <input name="reviewStatus" type="hidden" value="flagged" />
                      <input name="filter" type="hidden" value={filter} />
                      <FormSubmitButton pendingLabel="Flagging..." type="submit" variant="secondary">
                        Flag wire
                      </FormSubmitButton>
                    </form>
                  </>
                ) : null}
              </div>
            </div>
          );
        })}
            {visibleEvents.length === 0 ? (
              <div className="rounded-2xl bg-slate-50 px-4 py-6 text-sm text-slate-500">
                No {filter === "all" ? "" : `${filter} `}events are in the {tab} queue right now.
              </div>
            ) : null}
          </div>
      </Card>
    </div>
  );
}
