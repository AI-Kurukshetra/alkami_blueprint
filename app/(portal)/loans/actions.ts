"use server";

import { makeLoanPayment } from "@banking/database";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "../../../lib/supabase/server";

function messageUrl(message: string) {
  return encodeURIComponent(message);
}

export async function submitLoanPaymentAction(formData: FormData) {
  const supabase = await createSupabaseServerClient();

  try {
    await makeLoanPayment(
      {
        loanId: String(formData.get("loanId") ?? ""),
        sourceAccountId: String(formData.get("sourceAccountId") ?? ""),
        amount: Number(formData.get("amount") ?? 0)
      },
      supabase
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to post loan payment.";
    redirect(`/loans?error=${messageUrl(message)}`);
  }

  revalidatePath("/loans");
  revalidatePath("/accounts");
  revalidatePath("/dashboard");
  revalidatePath("/transactions");
  redirect("/loans?message=Loan%20payment%20completed");
}
