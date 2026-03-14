"use server";

import { createP2PContact, createP2PTransfer } from "@banking/database";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "../../../lib/supabase/server";

function messageUrl(message: string) {
  return encodeURIComponent(message);
}

export async function createP2PContactAction(formData: FormData) {
  const supabase = await createSupabaseServerClient();

  try {
    await createP2PContact(
      {
        displayName: String(formData.get("displayName") ?? ""),
        handle: String(formData.get("handle") ?? ""),
        destinationReference: String(formData.get("destinationReference") ?? "")
      },
      supabase
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to add the P2P contact.";
    redirect(`/p2p?error=${messageUrl(message)}`);
  }

  revalidatePath("/p2p");
  redirect("/p2p?message=Peer%20contact%20added");
}

export async function createP2PTransferAction(formData: FormData) {
  const supabase = await createSupabaseServerClient();

  try {
    await createP2PTransfer(
      {
        contactId: String(formData.get("contactId") ?? ""),
        fromAccountId: String(formData.get("fromAccountId") ?? ""),
        amount: Number(formData.get("amount") ?? 0),
        direction: String(formData.get("direction") ?? "sent"),
        note: String(formData.get("note") ?? "")
      },
      supabase
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to create the peer payment.";
    redirect(`/p2p?error=${messageUrl(message)}`);
  }

  revalidatePath("/p2p");
  revalidatePath("/accounts");
  revalidatePath("/transactions");
  redirect("/p2p?message=Peer%20payment%20submitted");
}
