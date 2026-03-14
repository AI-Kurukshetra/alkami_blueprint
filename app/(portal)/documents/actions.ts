"use server";

import { uploadAuthenticatedDocument } from "@banking/database";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "../../../lib/supabase/server";

function messageUrl(message: string) {
  return encodeURIComponent(message);
}

export async function uploadDocumentAction(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    redirect("/documents?error=Please%20choose%20a%20document%20to%20upload");
  }

  try {
    await uploadAuthenticatedDocument(
      {
        fileName: file.name,
        contentType: file.type || "application/octet-stream",
        bytes: new Uint8Array(await file.arrayBuffer()),
        documentType:
          String(formData.get("documentType") ?? "uploaded-document") || "uploaded-document"
      },
      supabase
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to ingest the uploaded document.";
    redirect(`/documents?error=${messageUrl(message)}`);
  }

  revalidatePath("/documents");
  redirect("/documents?message=Document%20uploaded%20successfully");
}
