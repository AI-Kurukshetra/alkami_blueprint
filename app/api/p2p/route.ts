import {
  createP2PContact,
  createP2PTransfer,
  listP2PContacts,
  listP2PTransfers
} from "@banking/database";
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "../../../lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });
  }

  const [contacts, transfers] = await Promise.all([
    listP2PContacts(supabase),
    listP2PTransfers(supabase)
  ]);

  return NextResponse.json({ data: { contacts, transfers } });
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });
  }

  try {
    const payload = await request.json();

    if ("displayName" in payload) {
      const data = await createP2PContact(payload, supabase);
      return NextResponse.json({ data, status: "contact_created" });
    }

    const data = await createP2PTransfer(payload, supabase);
    return NextResponse.json({ data, status: "transfer_created" });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to process the peer payment request." },
      { status: 400 }
    );
  }
}
