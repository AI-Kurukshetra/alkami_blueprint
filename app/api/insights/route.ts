import { getDashboardSnapshot } from "@banking/database";
import { NextResponse } from "next/server";

export async function GET() {
  const snapshot = await getDashboardSnapshot();
  return NextResponse.json({
    data: [
      {
        id: "insight-01",
        headline: "Cash flow remains positive",
        detail: `Month-to-date net cash flow is ${snapshot.cashFlow.toFixed(2)}.`
      }
    ]
  });
}

