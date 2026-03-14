"use server";

import { runBudgetMonthClose, upsertBudgetTarget } from "@banking/database";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "../../../lib/supabase/server";

function messageUrl(message: string) {
  return encodeURIComponent(message);
}

export async function saveBudgetTargetAction(formData: FormData) {
  const supabase = await createSupabaseServerClient();

  try {
    await upsertBudgetTarget(
      {
        category: String(formData.get("category") ?? ""),
        limitAmount: Number(formData.get("limitAmount") ?? 0),
        alertThreshold: Number(formData.get("alertThreshold") ?? 0.8)
      },
      supabase
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save budget target.";
    redirect(`/budgeting?error=${messageUrl(message)}`);
  }

  revalidatePath("/budgeting");
  revalidatePath("/dashboard");
  revalidatePath("/insights");
  redirect("/budgeting?message=Budget%20target%20saved");
}

export async function runBudgetMonthCloseAction() {
  const supabase = await createSupabaseServerClient();

  try {
    const result = await runBudgetMonthClose(supabase);
    revalidatePath("/budgeting");
    revalidatePath("/dashboard");
    revalidatePath("/notifications");
    redirect(
      `/budgeting?message=${messageUrl(
        `Month close completed with ${result.alerts} alert${result.alerts === 1 ? "" : "s"}.`
      )}`
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to run budget month close.";
    redirect(`/budgeting?error=${messageUrl(message)}`);
  }
}
