"use server";

import { setDeviceTrust } from "@banking/database";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "../../../lib/supabase/server";

function messageUrl(message: string) {
  return encodeURIComponent(message);
}

export async function updateDeviceTrustAction(formData: FormData) {
  const supabase = await createSupabaseServerClient();

  try {
    await setDeviceTrust(
      {
        deviceSessionId: String(formData.get("deviceSessionId") ?? ""),
        trusted: formData.get("trusted") === "true"
      },
      supabase
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update device trust.";
    redirect(`/settings?error=${messageUrl(message)}`);
  }

  revalidatePath("/settings");
  redirect("/settings?message=Device%20trust%20updated");
}
