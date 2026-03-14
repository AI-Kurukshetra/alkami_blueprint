import {
  getBudgetInsights,
  listBudgetTargets,
  runBudgetMonthClose,
  upsertBudgetTarget
} from "@banking/database";
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "../../../lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });
  }

  const [targets, insights] = await Promise.all([
    listBudgetTargets(supabase),
    getBudgetInsights(supabase)
  ]);

  return NextResponse.json({ data: { targets, insights } });
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });
  }

  try {
    const payload = await request.json();

    if (payload?.action === "month_close") {
      const data = await runBudgetMonthClose(supabase);
      return NextResponse.json({ data, status: "completed" });
    }

    const data = await upsertBudgetTarget(payload, supabase);
    return NextResponse.json({ data, status: "saved" });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to save budget target." },
      { status: 400 }
    );
  }
}
