import { NextResponse } from "next/server";
import { requireOwner } from "@/app/lib/owner-auth";
import { ownerAuthDeniedResponse } from "@/lib/owner-api-auth";
import { createAdminSupabase } from "@/app/lib/supabase-admin";
import {
  INTERNAL_COMMS_UNAVAILABLE,
  isInternalCommsStorageError,
  logInternalCommsError,
} from "@/app/lib/internal-comms-errors";

export const runtime = "nodejs";

async function isPeerAllowed(admin: ReturnType<typeof createAdminSupabase>, peerUserId: string) {
  const { data: staff } = await admin
    .from("workspace_staff_memberships")
    .select("id")
    .eq("user_id", peerUserId)
    .eq("is_active", true)
    .maybeSingle();
  if (staff) return true;

  const { data: owner } = await admin
    .from("owner_profiles")
    .select("user_id")
    .eq("user_id", peerUserId)
    .eq("is_active", true)
    .maybeSingle();
  return Boolean(owner);
}

export async function POST(request: Request) {
  const auth = await requireOwner();
  if (!auth.ok) {
    return ownerAuthDeniedResponse(auth);
  }

  let body: { peerUserId?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const peerUserId = String(body.peerUserId || "").trim();
  if (!peerUserId || peerUserId === auth.user.id) {
    return NextResponse.json({ error: "A valid peer user is required." }, { status: 400 });
  }

  const admin = createAdminSupabase();
  const allowed = await isPeerAllowed(admin, peerUserId);
  if (!allowed) {
    return NextResponse.json(
      { error: "That person is not in your authorized internal directory yet." },
      { status: 403 }
    );
  }

  const ids = [auth.user.id, peerUserId].sort();
  const slug = `dm-${ids[0]}-${ids[1]}`.slice(0, 72);

  let peerLabel = "Team member";
  const { data: peerAuth } = await admin.auth.admin.getUserById(peerUserId);
  if (peerAuth?.user?.email) {
    peerLabel = peerAuth.user.email.split("@")[0] || peerLabel;
  }
  const meta = (peerAuth?.user?.user_metadata || {}) as Record<string, unknown>;
  const metaName = String(meta.full_name || meta.name || meta.display_name || "").trim();
  if (metaName) peerLabel = metaName;

  const title = `Direct · ${peerLabel}`.slice(0, 160);

  const { data: existing, error: existingError } = await admin
    .from("hq_internal_comm_threads")
    .select("id, slug, kind, title, division, visibility, created_at, updated_at")
    .eq("slug", slug)
    .maybeSingle();

  if (existingError) {
    logInternalCommsError("dm/select", existingError);
    if (isInternalCommsStorageError(existingError)) {
      return NextResponse.json({ error: INTERNAL_COMMS_UNAVAILABLE }, { status: 503 });
    }
    return NextResponse.json({ error: "Could not open direct chat." }, { status: 400 });
  }

  if (existing) {
    await admin.from("hq_internal_comm_thread_members").upsert(
      [
        {
          thread_id: existing.id,
          user_id: auth.user.id,
          role: "owner",
          last_read_at: new Date().toISOString(),
        },
        {
          thread_id: existing.id,
          user_id: peerUserId,
          role: "member",
        },
      ],
      { onConflict: "thread_id,user_id" }
    );
    return NextResponse.json({ thread: existing, existing: true }, { status: 200 });
  }

  const { data: inserted, error: insertError } = await admin
    .from("hq_internal_comm_threads")
    .insert({
      slug,
      kind: "dm",
      title,
      division: null,
      visibility: "members_only",
    })
    .select("id, slug, kind, title, division, visibility, created_at, updated_at")
    .maybeSingle();

  if (insertError || !inserted) {
    logInternalCommsError("dm/insert-thread", insertError);
    if (insertError && isInternalCommsStorageError(insertError)) {
      return NextResponse.json({ error: INTERNAL_COMMS_UNAVAILABLE }, { status: 503 });
    }
    return NextResponse.json({ error: "Could not create direct chat." }, { status: 400 });
  }

  const now = new Date().toISOString();
  const { error: memberError } = await admin.from("hq_internal_comm_thread_members").upsert(
    [
      { thread_id: inserted.id, user_id: auth.user.id, role: "owner", last_read_at: now },
      { thread_id: inserted.id, user_id: peerUserId, role: "member" },
    ],
    { onConflict: "thread_id,user_id" }
  );

  if (memberError) {
    logInternalCommsError("dm/members", memberError);
    if (isInternalCommsStorageError(memberError)) {
      return NextResponse.json({ error: INTERNAL_COMMS_UNAVAILABLE }, { status: 503 });
    }
  }

  await admin.from("hq_internal_comm_messages").insert({
    thread_id: inserted.id,
    author_id: auth.user.id,
    author_label: auth.user.email?.trim() || "Owner",
    body: `Direct channel opened with ${peerLabel}. Messages here are visible to both participants.`,
  });

  return NextResponse.json({ thread: inserted, existing: false }, { status: 201 });
}
