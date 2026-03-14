import {
  createSavingsRule,
  executeSavingsRules,
  listSavingsRules,
  updateSavingsRuleStatus
} from "@banking/database";
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "../../../lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });
  }

  const data = await listSavingsRules(supabase);
  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });
  }

  try {
    const payload = await request.json();

    if (payload?.action === "execute") {
      const data = await executeSavingsRules(supabase);
      return NextResponse.json({ data, status: "executed" });
    }

    const data = await createSavingsRule(payload, supabase);
    return NextResponse.json({ data, status: "created" });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to create savings rule." },
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
    const data = await updateSavingsRuleStatus(payload, supabase);
    return NextResponse.json({ data, status: "updated" });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to update savings rule." },
      { status: 400 }
    );
  }
}
