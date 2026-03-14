"use server";

import { createTransfer } from "@banking/database";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "../../../lib/supabase/server";

function messageUrl(message: string) {
  return encodeURIComponent(message);
}

export async function submitTransferAction(formData: FormData) {
  const supabase = await createSupabaseServerClient();

  try {
    await createTransfer(
      {
        fromAccountId: String(formData.get("fromAccountId") ?? ""),
        toAccountId: String(formData.get("toAccountId") ?? ""),
        externalDestination: String(formData.get("externalDestination") ?? ""),
        amount: Number(formData.get("amount") ?? 0),
        memo: String(formData.get("memo") ?? ""),
        rail: String(formData.get("rail") ?? "internal")
      },
      supabase
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Transfer failed.";
    redirect(`/transfers?error=${messageUrl(message)}`);
  }

  revalidatePath("/dashboard");
  revalidatePath("/accounts");
  revalidatePath("/transactions");
  revalidatePath("/transfers");

  redirect("/transfers?message=Transfer%20completed");
}
