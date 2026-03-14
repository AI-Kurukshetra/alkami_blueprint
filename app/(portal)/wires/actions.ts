"use server";

import { createWireTransfer } from "@banking/database";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "../../../lib/supabase/server";

function messageUrl(message: string) {
  return encodeURIComponent(message);
}

export async function createWireTransferAction(formData: FormData) {
  const supabase = await createSupabaseServerClient();

  try {
    await createWireTransfer(
      {
        fromAccountId: String(formData.get("fromAccountId") ?? ""),
        beneficiaryName: String(formData.get("beneficiaryName") ?? ""),
        beneficiaryBank: String(formData.get("beneficiaryBank") ?? ""),
        routingNumber: String(formData.get("routingNumber") ?? ""),
        accountNumber: String(formData.get("accountNumber") ?? ""),
        amount: Number(formData.get("amount") ?? 0),
        purpose: String(formData.get("purpose") ?? "")
      },
      supabase
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to initiate the wire transfer.";
    redirect(`/wires?error=${messageUrl(message)}`);
  }

  revalidatePath("/wires");
  revalidatePath("/accounts");
  revalidatePath("/transactions");
  redirect("/wires?message=Wire%20transfer%20submitted");
}
