import {
  addBusinessMembership,
  createBusinessProfile,
  listBusinessMemberships,
  listBusinessProfiles
} from "@banking/database";
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "../../../lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const businessProfileId = searchParams.get("businessProfileId") ?? undefined;
  const [profiles, memberships] = await Promise.all([
    listBusinessProfiles(supabase),
    listBusinessMemberships(businessProfileId, supabase)
  ]);

  return NextResponse.json({ data: { profiles, memberships } });
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });
  }

  try {
    const payload = await request.json();

    if ("businessName" in payload) {
      const data = await createBusinessProfile(payload, supabase);
      return NextResponse.json({ data, status: "profile_created" });
    }

    const data = await addBusinessMembership(payload, supabase);
    return NextResponse.json({ data, status: "membership_created" });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to process the business request." },
      { status: 400 }
    );
  }
}
