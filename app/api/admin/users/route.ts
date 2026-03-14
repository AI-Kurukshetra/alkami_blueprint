import { listUsers } from "@banking/database";
import { NextResponse } from "next/server";
import { getApiAuthState } from "../../../../lib/api-auth";

export async function GET() {
  const { supabase, user, profile } = await getApiAuthState();

  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const data = await listUsers(supabase);
  return NextResponse.json({ data });
}
