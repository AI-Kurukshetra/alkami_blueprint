"use server";

import { scheduleBillPayment, submitBillPayment } from "@banking/database";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "../../../lib/supabase/server";

function messageUrl(message: string) {
  return encodeURIComponent(message);
}

export async function scheduleBillAction(formData: FormData) {
  const supabase = await createSupabaseServerClient();

  try {
    await scheduleBillPayment(
      {
        payeeName: String(formData.get("payeeName") ?? ""),
        payeeCategory: String(formData.get("payeeCategory") ?? ""),
        amount: Number(formData.get("amount") ?? 0),
        dueDate: String(formData.get("dueDate") ?? ""),
        autopay: formData.get("autopay") === "on"
      },
      supabase
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to schedule bill.";
    redirect(`/bills?error=${messageUrl(message)}`);
  }

  revalidatePath("/bills");
  revalidatePath("/dashboard");
  redirect("/bills?message=Bill%20scheduled");
}

export async function payBillAction(formData: FormData) {
  const supabase = await createSupabaseServerClient();

  try {
    await submitBillPayment(
      {
        billId: String(formData.get("billId") ?? ""),
        sourceAccountId: String(formData.get("sourceAccountId") ?? "")
      },
      supabase
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to submit bill payment.";
    redirect(`/bills?error=${messageUrl(message)}`);
  }

  revalidatePath("/bills");
  revalidatePath("/accounts");
  revalidatePath("/dashboard");
  revalidatePath("/transactions");
  redirect("/bills?message=Bill%20payment%20submitted");
}
