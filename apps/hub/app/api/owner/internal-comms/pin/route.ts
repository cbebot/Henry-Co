import { NextResponse } from "next/server";
import { requireOwner } from "@/app/lib/owner-auth";
import { ownerAuthDeniedResponse } from "@/lib/owner-api-auth";
import { createAdminSupabase } from "@/app/lib/supabase-admin";
import {
  INTERNAL_COMMS_UNAVAILABLE,
  isInternalCommsStorageError,
  logInternalCommsError,
} from "@/app/lib/internal-comms-errors";
import { assertThreadReadable } from "@/app/lib/internal-comms-access";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const auth = await requireOwner();
  if (!auth.ok) {
    return ownerAuthDeniedResponse(auth);
  }

  let body: { threadId?: string; pinned?: boolean };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const threadId = String(body.threadId || "").trim();
  if (!threadId) {
    return NextResponse.json({ error: "threadId is required." }, { status: 400 });
  }

  const pinned = Boolean(body.pinned);

  const admin = createAdminSupabase();
  const gate = await assertThreadReadable(admin, auth.user.id, threadId);
  if (!gate.ok) {
    return NextResponse.json({ error: gate.message }, { status: gate.status });
  }

  const { error } = await admin.from("hq_internal_comm_thread_members").upsert(
    {
      thread_id: threadId,
      user_id: auth.user.id,
      pinned,
      role: "owner",
    },
    { onConflict: "thread_id,user_id" }
  );

  if (error) {
    logInternalCommsError("pin", error);
    if (isInternalCommsStorageError(error)) {
      return NextResponse.json({ error: INTERNAL_COMMS_UNAVAILABLE }, { status: 503 });
    }
    return NextResponse.json({ error: "Could not update pin." }, { status: 400 });
  }

  return NextResponse.json({ ok: true, pinned });
}
