import { downloadAuthenticatedDocument } from "@banking/database";
import { createSupabaseServerClient } from "../../../../lib/supabase/server";

export const dynamic = "force-dynamic";

function contentDispositionName(storagePath: string) {
  const fileName = storagePath.split("/").pop() ?? "document";
  return fileName.replace(/[^A-Za-z0-9._-]/g, "-");
}

export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return Response.json({ error: "Supabase is not configured." }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const documentId = searchParams.get("documentId");

  if (!documentId) {
    return Response.json({ error: "Document id is required." }, { status: 400 });
  }

  try {
    const { file, storagePath } = await downloadAuthenticatedDocument(documentId, supabase);
    const arrayBuffer = await file.arrayBuffer();

    return new Response(arrayBuffer, {
      headers: {
        "Content-Type": file.type || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${contentDispositionName(storagePath)}"`,
        "Cache-Control": "no-store"
      }
    });
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : "Unable to download document."
      },
      { status: 400 }
    );
  }
}
