import { NextResponse } from "next/server";
import { requireOwner } from "@/app/lib/owner-auth";
import { ownerAuthDeniedResponse } from "@/lib/owner-api-auth";
import { createAdminSupabase } from "@/app/lib/supabase-admin";
import { assertThreadReadable, upsertThreadMemberActivity } from "@/app/lib/internal-comms-access";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const auth = await requireOwner();
  if (!auth.ok) {
    return ownerAuthDeniedResponse(auth);
  }

  let body: { threadId?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const threadId = String(body.threadId || "").trim();
  if (!threadId) {
    return NextResponse.json({ error: "threadId is required." }, { status: 400 });
  }

  const admin = createAdminSupabase();
  const gate = await assertThreadReadable(admin, auth.user.id, threadId);
  if (!gate.ok) {
    return NextResponse.json({ error: gate.message }, { status: gate.status });
  }

  const now = new Date().toISOString();

  const error = await upsertThreadMemberActivity(admin, {
    threadId,
    userId: auth.user.id,
    defaultRole: gate.thread.kind === "dm" ? "member" : "owner",
    lastReadAt: now,
  });

  if (error) {
    return NextResponse.json({ error: "Could not update read state." }, { status: 400 });
  }

  return NextResponse.json({ ok: true, lastReadAt: now });
}
