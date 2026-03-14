import { listBills } from "@banking/database";
import { NextResponse } from "next/server";

export async function GET() {
  const bills = await listBills();
  const data = bills.map((bill) => ({
    id: bill.id,
    payeeName: bill.payeeName,
    reminder: `Reminder scheduled 48 hours before ${bill.dueDate}`,
    escalation: "Escalate to notification center if unpaid on due date."
  }));

  return NextResponse.json({ data });
}

