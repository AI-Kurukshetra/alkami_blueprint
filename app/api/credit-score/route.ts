import {
  getCreditProfile,
  listCreditScoreSnapshots,
  refreshCreditProfile
} from "@banking/database";
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "../../../lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });
  }

  const [profile, snapshots] = await Promise.all([
    getCreditProfile(supabase),
    listCreditScoreSnapshots(supabase)
  ]);

  return NextResponse.json({ data: { profile, snapshots } });
}

export async function POST() {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });
  }

  try {
    const data = await refreshCreditProfile(supabase);
    return NextResponse.json({ data, status: "refreshed" });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to refresh the credit profile." },
      { status: 400 }
    );
  }
}
