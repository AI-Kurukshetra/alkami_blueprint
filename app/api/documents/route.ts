import { listAuthenticatedDocuments } from "@banking/database";
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "../../../lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const documents = await listAuthenticatedDocuments(supabase);
  const data = type
    ? documents.filter((document) => document.documentType === type)
    : documents;

  return NextResponse.json({ data });
}
