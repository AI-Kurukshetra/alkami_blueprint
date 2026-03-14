"use server";

import {
  createSavingsRule,
  executeSavingsRules,
  updateSavingsRuleStatus
} from "@banking/database";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "../../../lib/supabase/server";

function messageUrl(message: string) {
  return encodeURIComponent(message);
}

export async function createSavingsRuleAction(formData: FormData) {
  const supabase = await createSupabaseServerClient();

  try {
    await createSavingsRule(
      {
        sourceAccountId: String(formData.get("sourceAccountId") ?? ""),
        destinationAccountId: String(formData.get("destinationAccountId") ?? ""),
        ruleType: String(formData.get("ruleType") ?? "recurring"),
        amount: Number(formData.get("amount") ?? 0),
        cadence: String(formData.get("cadence") ?? "monthly"),
        active: formData.get("active") === "on"
      },
      supabase
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create savings rule.";
    redirect(`/savings?error=${messageUrl(message)}`);
  }

  revalidatePath("/savings");
  redirect("/savings?message=Savings%20rule%20created");
}

export async function toggleSavingsRuleAction(formData: FormData) {
  const supabase = await createSupabaseServerClient();

  try {
    await updateSavingsRuleStatus(
      {
        ruleId: String(formData.get("ruleId") ?? ""),
        active: formData.get("nextState") === "true"
      },
      supabase
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update savings rule.";
    redirect(`/savings?error=${messageUrl(message)}`);
  }

  revalidatePath("/savings");
  redirect("/savings?message=Savings%20rule%20updated");
}

export async function executeSavingsRulesAction() {
  const supabase = await createSupabaseServerClient();

  try {
    const result = await executeSavingsRules(supabase);
    revalidatePath("/savings");
    revalidatePath("/accounts");
    revalidatePath("/transactions");
    redirect(
      `/savings?message=${messageUrl(
        `Automation engine processed ${result.processed} rule${result.processed === 1 ? "" : "s"}.`
      )}`
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to execute savings automation.";
    redirect(`/savings?error=${messageUrl(message)}`);
  }
}
