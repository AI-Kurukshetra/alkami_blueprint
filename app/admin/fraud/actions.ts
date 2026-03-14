"use server";

import { runFraudAutomation, updateFraudEventStatus, updateWireTransferReview } from "@banking/database";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "../../../lib/auth";
import { createSupabaseServerClient } from "../../../lib/supabase/server";

function messageUrl(message: string) {
  return encodeURIComponent(message);
}

export async function runFraudAutomationAction(formData: FormData) {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const tab = String(formData.get("tab") ?? "open");
  const filter = String(formData.get("filter") ?? "all");
  let nextMessage = "";

  try {
    const result = await runFraudAutomation(supabase);
    revalidatePath("/admin/fraud");
    nextMessage = `Fraud automation reviewed ${result.reviewed} signal${result.reviewed === 1 ? "" : "s"} and created ${result.created} new event${result.created === 1 ? "" : "s"}.`;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to run fraud automation.";
    redirect(`/admin/fraud?tab=${messageUrl(tab)}&filter=${messageUrl(filter)}&error=${messageUrl(message)}`);
  }

  redirect(
    `/admin/fraud?tab=${messageUrl(tab)}&filter=${messageUrl(filter)}&message=${messageUrl(nextMessage)}`
  );
}

export async function updateFraudEventStatusAction(formData: FormData) {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const targetStatus = String(formData.get("status") ?? "reviewing");
  const targetTab =
    targetStatus === "closed"
      ? "closed"
      : targetStatus === "open"
        ? "open"
        : "reviewing";
  const filter = String(formData.get("filter") ?? "all");

  try {
    await updateFraudEventStatus(
      {
        fraudEventId: String(formData.get("fraudEventId") ?? ""),
        status: targetStatus
      },
      supabase
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to update fraud event status.";
    redirect(`/admin/fraud?tab=${messageUrl(targetTab)}&filter=${messageUrl(filter)}&error=${messageUrl(message)}`);
  }

  revalidatePath("/admin/fraud");
  redirect(`/admin/fraud?tab=${messageUrl(targetTab)}&filter=${messageUrl(filter)}&message=Fraud%20event%20updated`);
}

export async function updateWireReviewAction(formData: FormData) {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const targetTab =
    String(formData.get("reviewStatus") ?? "approved") === "flagged" ? "reviewing" : "closed";
  const filter = String(formData.get("filter") ?? "all");

  try {
    await updateWireTransferReview(
      {
        wireId: String(formData.get("wireId") ?? ""),
        reviewStatus: String(formData.get("reviewStatus") ?? "approved")
      },
      supabase
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to update wire review.";
    redirect(`/admin/fraud?tab=${messageUrl(targetTab)}&filter=${messageUrl(filter)}&error=${messageUrl(message)}`);
  }

  revalidatePath("/admin/fraud");
  redirect(`/admin/fraud?tab=${messageUrl(targetTab)}&filter=${messageUrl(filter)}&message=Wire%20review%20updated`);
}
