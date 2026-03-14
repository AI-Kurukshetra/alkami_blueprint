"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function refreshInsightsAction() {
  revalidatePath("/insights");
  redirect(`/insights?message=${encodeURIComponent("Insights refreshed from latest account activity.")}`);
}
