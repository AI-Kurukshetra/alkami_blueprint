"use server";

import { addBusinessMembership, createBusinessProfile } from "@banking/database";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "../../../lib/supabase/server";

function messageUrl(message: string) {
  return encodeURIComponent(message);
}

export async function createBusinessProfileAction(formData: FormData) {
  const supabase = await createSupabaseServerClient();

  try {
    await createBusinessProfile(
      {
        businessName: String(formData.get("businessName") ?? ""),
        legalName: String(formData.get("legalName") ?? ""),
        industry: String(formData.get("industry") ?? ""),
        taxId: String(formData.get("taxId") ?? "")
      },
      supabase
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to create the business profile.";
    redirect(`/business?error=${messageUrl(message)}`);
  }

  revalidatePath("/business");
  redirect("/business?message=Business%20profile%20submitted");
}

export async function addBusinessMembershipAction(formData: FormData) {
  const supabase = await createSupabaseServerClient();

  try {
    await addBusinessMembership(
      {
        businessProfileId: String(formData.get("businessProfileId") ?? ""),
        email: String(formData.get("email") ?? ""),
        membershipRole: String(formData.get("membershipRole") ?? "viewer")
      },
      supabase
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to add the business member.";
    redirect(`/business?error=${messageUrl(message)}`);
  }

  revalidatePath("/business");
  redirect("/business?message=Business%20member%20added");
}
