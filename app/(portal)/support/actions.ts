"use server";

import { createSupportTicket } from "@banking/database";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "../../../lib/supabase/server";

function messageUrl(message: string) {
  return encodeURIComponent(message);
}

export async function createSupportTicketAction(formData: FormData) {
  const supabase = await createSupabaseServerClient();

  try {
    await createSupportTicket(
      {
        subject: String(formData.get("subject") ?? ""),
        priority: String(formData.get("priority") ?? "medium"),
        message: String(formData.get("message") ?? "")
      },
      supabase
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to open support ticket.";
    redirect(`/support?error=${messageUrl(message)}`);
  }

  revalidatePath("/support");
  redirect("/support?message=Support%20ticket%20created");
}
