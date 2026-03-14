import {
  createWalletToken,
  listWalletTokens,
  updateWalletTokenStatus
} from "@banking/database";
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "../../../lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });
  }

  const data = await listWalletTokens(supabase);
  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });
  }

  try {
    const payload = await request.json();
    const data = await createWalletToken(payload, supabase);
    return NextResponse.json({ data, status: "submitted" });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to create the wallet token." },
      { status: 400 }
    );
  }
}

export async function PATCH(request: Request) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });
  }

  try {
    const payload = await request.json();
    const data = await updateWalletTokenStatus(payload, supabase);
    return NextResponse.json({ data, status: "updated" });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to update the wallet token." },
      { status: 400 }
    );
  }
}
