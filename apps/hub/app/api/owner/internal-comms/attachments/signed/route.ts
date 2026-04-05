import { NextResponse } from "next/server";
import { requireOwner } from "@/app/lib/owner-auth";
import { ownerAuthDeniedResponse } from "@/lib/owner-api-auth";
import { createAdminSupabase } from "@/app/lib/supabase-admin";
import { assertThreadReadable } from "@/app/lib/internal-comms-access";
import { HQ_IC_STORAGE_BUCKET } from "@/app/lib/internal-comms-upload-rules";
import { logInternalCommsError } from "@/app/lib/internal-comms-errors";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const auth = await requireOwner();
  if (!auth.ok) {
    return ownerAuthDeniedResponse(auth);
  }

  const url = new URL(request.url);
  const path = String(url.searchParams.get("path") || "").trim();
  if (!path || path.includes("..")) {
    return NextResponse.json({ error: "Invalid path." }, { status: 400 });
  }

  const threadId = path.split("/")[0] || "";
  if (!/^[0-9a-f-]{36}$/i.test(threadId)) {
    return NextResponse.json({ error: "Invalid path." }, { status: 400 });
  }

  const admin = createAdminSupabase();
  const gate = await assertThreadReadable(admin, auth.user.id, threadId);
  if (!gate.ok) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const { data: row } = await admin
    .from("hq_internal_comm_attachments")
    .select("id, storage_path, storage_bucket")
    .eq("storage_path", path)
    .maybeSingle();

  if (!row || row.storage_bucket !== HQ_IC_STORAGE_BUCKET) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const { data, error } = await admin.storage
    .from(HQ_IC_STORAGE_BUCKET)
    .createSignedUrl(path, 120);

  if (error || !data?.signedUrl) {
    logInternalCommsError("attachments/signed", error);
    return NextResponse.json({ error: "Could not create download link." }, { status: 400 });
  }

  return NextResponse.json({ url: data.signedUrl, expiresIn: 120 });
}
