"use server";

import { updateCardControl } from "@banking/database";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "../../../lib/supabase/server";

function messageUrl(message: string) {
  return encodeURIComponent(message);
}

export async function toggleCardStatusAction(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const currentStatus = String(formData.get("currentStatus") ?? "active");

  try {
    await updateCardControl(
      {
        cardId: String(formData.get("cardId") ?? ""),
        action: currentStatus === "active" ? "freeze" : "unfreeze"
      },
      supabase
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Card update failed.";
    redirect(`/cards?error=${messageUrl(message)}`);
  }

  revalidatePath("/cards");
  redirect("/cards?message=Card%20status%20updated");
}

export async function updateCardLimitAction(formData: FormData) {
  const supabase = await createSupabaseServerClient();

  try {
    await updateCardControl(
      {
        cardId: String(formData.get("cardId") ?? ""),
        action: "set_limit",
        spendLimit: Number(formData.get("spendLimit") ?? 0)
      },
      supabase
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Spend limit update failed.";
    redirect(`/cards?error=${messageUrl(message)}`);
  }

  revalidatePath("/cards");
  redirect("/cards?message=Card%20limit%20updated");
}
