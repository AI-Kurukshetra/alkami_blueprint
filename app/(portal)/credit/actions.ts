"use server";

import { refreshCreditProfile } from "@banking/database";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "../../../lib/supabase/server";

function messageUrl(message: string) {
  return encodeURIComponent(message);
}

export async function refreshCreditProfileAction() {
  const supabase = await createSupabaseServerClient();

  try {
    const result = await refreshCreditProfile(supabase);
    revalidatePath("/credit");
    revalidatePath("/dashboard");
    redirect(
      `/credit?message=${messageUrl(
        `Credit profile refreshed to ${result.score} (${result.delta >= 0 ? "+" : ""}${result.delta}).`
      )}`
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to refresh the credit profile.";
    redirect(`/credit?error=${messageUrl(message)}`);
  }
}
