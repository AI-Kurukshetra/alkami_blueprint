import {
  listFraudEvents,
  runFraudAutomation,
  updateFraudEventStatus,
  updateWireTransferReview
} from "@banking/database";
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

  const data = await listFraudEvents(supabase);
  return NextResponse.json({ data });
}

export async function POST() {
  const { supabase, user, profile } = await getApiAuthState();

  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  try {
    const data = await runFraudAutomation(supabase);
    return NextResponse.json({ data, status: "executed" });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to run fraud automation." },
      { status: 400 }
    );
  }
}

export async function PATCH(request: Request) {
  const { supabase, user, profile } = await getApiAuthState();

  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  try {
    const payload = await request.json();
    const data =
      "wireId" in payload
        ? await updateWireTransferReview(payload, supabase)
        : await updateFraudEventStatus(payload, supabase);
    return NextResponse.json({ data, status: "updated" });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to update fraud controls." },
      { status: 400 }
    );
  }
}
