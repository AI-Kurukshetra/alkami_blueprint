import Link from "next/link";
import { listAuthenticatedDocuments } from "@banking/database";
import { Badge, Button, Card, CardDescription, CardTitle, PageHeader } from "@banking/ui";
import { formatDate } from "@banking/utils";
import { FlashBanner } from "../../../components/flash-banner";
import { FormSubmitButton } from "../../../components/form-submit-button";
import { createSupabaseServerClient } from "../../../lib/supabase/server";
import { uploadDocumentAction } from "./actions";

const typeLabels: Record<string, { label: string; href: string }> = {
  statement: { label: "Statement PDF", href: "/api/accounts/statements?kind=statement" },
  "account-summary": {
    label: "Account summary PDF",
    href: "/api/accounts/statements?kind=account-summary"
  },
  "initial-disclosure": {
    label: "Initial disclosure PDF",
    href: "/api/accounts/statements?kind=initial-disclosure"
  },
  "uploaded-document": {
    label: "Uploaded document",
    href: "/api/documents/download"
  }
};

export default async function DocumentsPage({
  searchParams
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const supabase = await createSupabaseServerClient();
  const documents = await listAuthenticatedDocuments(supabase);
  const message =
    typeof searchParams?.message === "string" ? searchParams.message : undefined;
  const error =
    typeof searchParams?.error === "string" ? searchParams.error : undefined;

  return (
    <div className="space-y-6">
      <PageHeader
        actionLabel="Latest statement"
        actionHref="/api/accounts/statements?kind=statement"
        description="Secure customer document access for statements, summaries, and onboarding disclosures."
        eyebrow="Documents"
        title="Document portal"
      />
      <FlashBanner message={message} tone="success" />
      <FlashBanner message={error} tone="error" />
      <div className="grid gap-4 xl:grid-cols-3">
        {[
          {
            title: "Statements",
            description: "Monthly deposit and lending statements ready for download."
          },
          {
            title: "Summaries",
            description: "Generated account summary packets for servicing and review."
          },
          {
            title: "Disclosures",
            description: "Initial customer agreement and onboarding documents."
          }
        ].map((item) => (
          <Card className="space-y-2" key={item.title}>
            <CardTitle>{item.title}</CardTitle>
            <CardDescription>{item.description}</CardDescription>
          </Card>
        ))}
      </div>
      <Card className="space-y-4">
        <div>
          <CardTitle>Secure ingestion</CardTitle>
          <CardDescription>
            Upload user-scoped documents into private Supabase Storage for later retrieval.
          </CardDescription>
        </div>
        <form action={uploadDocumentAction} className="grid gap-3 md:grid-cols-[1fr_220px_auto]">
          <select className="h-11 rounded-2xl border border-slate-200 px-4" defaultValue="uploaded-document" name="documentType">
            <option value="uploaded-document">Uploaded document</option>
          </select>
          <input
            accept=".pdf,.png,.jpg,.jpeg,.csv,.txt"
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
            name="file"
            required
            type="file"
          />
          <FormSubmitButton pendingLabel="Uploading..." type="submit">
            Upload document
          </FormSubmitButton>
        </form>
      </Card>
      <Card className="space-y-4">
        <div>
          <CardTitle>Available documents</CardTitle>
          <CardDescription>Each document remains user-scoped and downloadable from the portal.</CardDescription>
        </div>
        <div className="space-y-3">
          {documents.map((document) => {
            const descriptor = typeLabels[document.documentType] ?? {
              label: document.documentType,
              href: "/api/documents/download"
            };
            const statementIdQuery =
              document.documentType === "statement" ? `&statementId=${document.id}` : "";
            const href =
              document.documentType === "uploaded-document"
                ? `${descriptor.href}?documentId=${document.id}`
                : `${descriptor.href}${statementIdQuery}`;

            return (
              <div
                className="flex flex-col gap-3 rounded-2xl bg-slate-50 px-4 py-4 md:flex-row md:items-center md:justify-between"
                key={document.id}
              >
                <div>
                  <div className="flex items-center gap-3">
                    <p className="font-medium text-slate-950">{descriptor.label}</p>
                    <Badge tone="success">{document.status}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">
                    {document.storagePath.split("/").pop()} | Generated {formatDate(document.createdAt)}
                  </p>
                </div>
                <Button asChild variant="secondary">
                  <Link href={href}>
                    {document.documentType === "uploaded-document" ? "Download file" : "Download PDF"}
                  </Link>
                </Button>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
