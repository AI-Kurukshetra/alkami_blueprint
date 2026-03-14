import { quoteTransfer } from "@banking/database";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const payload = await request.json();
  const data = await quoteTransfer(payload);
  return NextResponse.json({ data });
}

