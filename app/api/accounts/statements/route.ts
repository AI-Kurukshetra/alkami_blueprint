import { listAccounts, listDocuments, listTransactions } from "@banking/database";
import { createSupabaseServerClient } from "../../../../lib/supabase/server";

type DocumentKind = "statement" | "account-summary" | "initial-disclosure";

function escapePdfText(value: string) {
  return value
    .replaceAll("\\", "\\\\")
    .replaceAll("(", "\\(")
    .replaceAll(")", "\\)");
}

function buildPdf(title: string, lines: string[]) {
  const pageLines = lines.slice(0, 32);
  const contentLines = [
    "BT",
    "/F1 11 Tf",
    `1 0 0 1 50 780 Tm (${escapePdfText(title)}) Tj`
  ];

  pageLines.forEach((line, index) => {
    const y = 750 - index * 20;
    contentLines.push(`1 0 0 1 50 ${y} Tm (${escapePdfText(line)}) Tj`);
  });

  contentLines.push("ET");

  const contentStream = `${contentLines.join("\n")}\n`;
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Count 1 /Kids [3 0 R] >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${contentStream.length} >>\nstream\n${contentStream}endstream`
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";

  offsets.slice(1).forEach((offset) => {
    pdf += `${offset.toString().padStart(10, "0")} 00000 n \n`;
  });

  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return new TextEncoder().encode(pdf);
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function formatIsoDate(value: string) {
  return value.slice(0, 10);
}

function buildFilename(kind: DocumentKind, descriptor: string, generatedAt: string) {
  const safeDescriptor = slugify(descriptor) || "customer";
  const datePart = formatIsoDate(generatedAt);
  return `nextgen-bank-${kind}-${safeDescriptor}-${datePart}.pdf`;
}

function getDocumentLabel(kind: DocumentKind, descriptor: string) {
  if (kind === "statement") {
    return `Statement PDF - ${descriptor}`;
  }

  if (kind === "account-summary") {
    return `Account Summary PDF - ${descriptor}`;
  }

  return `Initial Disclosure PDF - ${descriptor}`;
}

export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return Response.json({ error: "Supabase is not configured." }, { status: 500 });
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Authentication required." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const kind = (searchParams.get("kind") ?? "statement") as DocumentKind;
  const statementId = searchParams.get("statementId");
  const generatedAt = new Date().toISOString();
  const [documents, accounts, transactions] = await Promise.all([
    listDocuments(supabase),
    listAccounts(supabase),
    listTransactions(supabase)
  ]);

  const primaryAccount = accounts[0] ?? null;
  const selectedDocument =
    documents.find((document) => document.id === statementId) ?? documents[0] ?? null;

  let descriptor = primaryAccount?.nickname ?? "customer";
  let title = "NextGen Bank Document";
  let lines: string[] = [];

  if (kind === "statement") {
    descriptor =
      selectedDocument?.storagePath.split("/").pop()?.replace(/\.pdf$/i, "") ??
      primaryAccount?.nickname ??
      "latest-statement";
    title = "NextGen Bank Statement";
    lines = [
      `Document: ${getDocumentLabel("statement", descriptor)}`,
      `Generated: ${generatedAt}`,
      "",
      "Accounts",
      ...accounts.slice(0, 6).map(
        (account) =>
          `${account.nickname} | ${account.accountNumber} | Balance ${account.balance.toFixed(2)} ${account.currency} | Available ${account.availableBalance.toFixed(2)}`
      ),
      "",
      "Recent Transactions",
      ...transactions.slice(0, 12).map(
        (transaction) =>
          `${formatIsoDate(transaction.postedAt)} | ${transaction.description} | ${transaction.direction} | ${transaction.amount.toFixed(2)}`
      )
    ];
  } else if (kind === "account-summary") {
    descriptor = primaryAccount?.nickname ?? "portfolio";
    title = "NextGen Bank Account Summary";
    lines = [
      `Document: ${getDocumentLabel("account-summary", descriptor)}`,
      `Generated: ${generatedAt}`,
      "",
      ...accounts.slice(0, 8).map(
        (account) =>
          `${account.nickname} | ${account.accountType} | Status ${account.status} | Balance ${account.balance.toFixed(2)} ${account.currency}`
      ),
      "",
      `Total accounts: ${accounts.length}`,
      `Recent transactions captured: ${transactions.length}`
    ];
  } else {
    descriptor = user.email?.split("@")[0] ?? "customer";
    title = "NextGen Bank Initial Disclosure";
    lines = [
      `Document: ${getDocumentLabel("initial-disclosure", descriptor)}`,
      `Generated: ${generatedAt}`,
      "",
      "Welcome to NextGen Bank.",
      "This packet summarizes customer responsibilities, security expectations, and digital banking support channels.",
      "Protect your credentials, review trusted devices regularly, and enable optional MFA for stronger account security.",
      "Contact support from the in-app Support Center for account servicing, card controls, and transaction questions.",
      "Your deposit and lending products remain subject to your institution's account agreement and disclosures."
    ];
  }

  const filename = buildFilename(kind, descriptor, generatedAt);

  return new Response(buildPdf(title, lines), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store"
    }
  });
}
