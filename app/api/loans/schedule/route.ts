import { getAuthenticatedLoanDetails } from "@banking/database";
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "../../../../lib/supabase/server";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const data = await getAuthenticatedLoanDetails(supabase);
  return NextResponse.json({ data });
}
