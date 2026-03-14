import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    data: [
      {
        id: "doc-01",
        type: "statement",
        status: "available"
      }
    ]
  });
}

