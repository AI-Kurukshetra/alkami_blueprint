"use server";

import { createWalletToken, updateWalletTokenStatus } from "@banking/database";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "../../../lib/supabase/server";

function messageUrl(message: string) {
  return encodeURIComponent(message);
}

export async function createWalletTokenAction(formData: FormData) {
  const supabase = await createSupabaseServerClient();

  try {
    await createWalletToken(
      {
        cardId: String(formData.get("cardId") ?? ""),
        provider: String(formData.get("provider") ?? "apple_pay"),
        deviceLabel: String(formData.get("deviceLabel") ?? "")
      },
      supabase
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to enroll the wallet token.";
    redirect(`/wallets?error=${messageUrl(message)}`);
  }

  revalidatePath("/wallets");
  redirect("/wallets?message=Wallet%20enrollment%20submitted");
}

export async function updateWalletTokenStatusAction(formData: FormData) {
  const supabase = await createSupabaseServerClient();

  try {
    await updateWalletTokenStatus(
      {
        walletTokenId: String(formData.get("walletTokenId") ?? ""),
        status: String(formData.get("status") ?? "suspended")
      },
      supabase
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to update the wallet token.";
    redirect(`/wallets?error=${messageUrl(message)}`);
  }

  revalidatePath("/wallets");
  redirect("/wallets?message=Wallet%20status%20updated");
}
