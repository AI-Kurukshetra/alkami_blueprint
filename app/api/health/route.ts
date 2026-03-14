import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "nextgen-digital-banking",
    timestamp: new Date().toISOString()
  });
}

