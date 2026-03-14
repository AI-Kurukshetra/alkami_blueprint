import { searchTransactions } from "@banking/database";
import { createSupabaseServerClient } from "../../../../lib/supabase/server";

function toCsv(
  rows: Array<{
    description: string;
    merchantName: string | null;
    category: string;
    amount: number;
    direction: string;
    postedAt: string;
  }>
) {
  const header = ["description", "merchant", "category", "amount", "direction", "postedAt"];
  const body = rows.map((row) =>
    [
      row.description,
      row.merchantName ?? "",
      row.category,
      row.amount.toFixed(2),
      row.direction,
      row.postedAt
    ]
      .map((value) => `"${String(value).replaceAll('"', '""')}"`)
      .join(",")
  );

  return [header.join(","), ...body].join("\n");
}

function toPdf(
  rows: Array<{
    description: string;
    amount: number;
    direction: string;
    postedAt: string;
  }>
) {
  const lines = [
    "BT",
    "/F1 12 Tf",
    "50 780 Td",
    "(Transaction Export) Tj"
  ];

  rows.slice(0, 20).forEach((row, index) => {
    const safeLine = `${row.postedAt} ${row.description} ${row.direction} ${row.amount.toFixed(2)}`
      .replaceAll("\\", "\\\\")
      .replaceAll("(", "\\(")
      .replaceAll(")", "\\)");

    lines.push(`0 -${20 + index * 16} Td`);
    lines.push(`(${safeLine}) Tj`);
  });

  lines.push("ET");

  const contentStream = `${lines.join("\n")}\n`;
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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") ?? "csv";
  const supabase = await createSupabaseServerClient();
  const rows = await searchTransactions(
    Object.fromEntries(searchParams.entries()),
    supabase
  );

  if (format === "pdf") {
    return new Response(toPdf(rows), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="transactions.pdf"'
      }
    });
  }

  return new Response(toCsv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="transactions.csv"'
    }
  });
}
