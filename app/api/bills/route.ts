import { createBillPayment, listAuthenticatedBills } from "@banking/database";
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "../../../lib/supabase/server";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const data = await listAuthenticatedBills(supabase);
  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const payload = await request.json();
  const data = await createBillPayment(payload);
  return NextResponse.json({ data, status: "scheduled" });
}
