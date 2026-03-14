import { listAuthenticatedDeviceSessions, setDeviceTrust } from "@banking/database";
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "../../../../lib/supabase/server";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const data = await listAuthenticatedDeviceSessions(supabase);
  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const payload = await request.json();
  const supabase = await createSupabaseServerClient();
  const data = await setDeviceTrust(payload, supabase);
  return NextResponse.json({ data, status: "updated" });
}
