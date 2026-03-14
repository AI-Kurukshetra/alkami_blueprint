import { createTransfer } from "@banking/database";
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "../../../lib/supabase/server";

export async function POST(request: Request) {
  const payload = await request.json();
  const supabase = await createSupabaseServerClient();

  try {
    const data = await createTransfer(payload, supabase);
    return NextResponse.json({ data, status: "accepted" });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Transfer failed." },
      { status: 400 }
    );
  }
}
