import { NextResponse, type NextRequest } from "next/server";

import { publishNotification } from "@henryco/notifications";
import { requireOwner } from "@/app/lib/owner-auth";
import { createAdminSupabase } from "@/lib/supabase";

export const runtime = "nodejs";

const DIVISIONS = new Set([
  "marketplace",
  "care",
  "jobs",
  "learn",
  "logistics",
  "property",
  "studio",
  "account",
  "hub",
]);

/**
 * POST /api/owner/support/reply — the owner answers a support thread himself.
 *
 * The founder wanted to be able to step into any customer conversation
 * directly ("I should be able to write to them myself"). This posts into the
 * SAME support_messages spine the staff console uses (sender_type "agent" —
 * the customer's thread view renders it as the team, exactly like a staff
 * reply), so nothing about the customer experience is bespoke.
 *
 * Discipline (house pattern): requireOwner → validate → AUDIT-FIRST-ABORT →
 * state writes → best-effort customer notification tail.
 */
export async function POST(request: NextRequest) {
  const auth = await requireOwner();
  if (!auth.ok) {
    return NextResponse.json({ error: "Not available." }, { status: 404 });
  }

  const body = (await request.json().catch(() => null)) as
    | { threadId?: unknown; body?: unknown }
    | null;
  const threadId = typeof body?.threadId === "string" ? body.threadId.trim() : "";
  const message = typeof body?.body === "string" ? body.body.trim() : "";
  if (!threadId || !message) {
    return NextResponse.json({ error: "Write a reply first." }, { status: 400 });
  }
  if (message.length > 4000) {
    return NextResponse.json({ error: "Keep the reply under 4,000 characters." }, { status: 400 });
  }

  const admin = createAdminSupabase();

  const { data: threadRow } = await admin
    .from("support_threads")
    .select("id, user_id, subject, division, status")
    .eq("id", threadId)
    .maybeSingle();
  const thread = threadRow as
    | { id: string; user_id: string | null; subject: string | null; division: string | null; status: string | null }
    | null;
  if (!thread) {
    return NextResponse.json({ error: "That thread no longer exists." }, { status: 404 });
  }

  // AUDIT-FIRST-ABORT: if the trail can't be written, the reply doesn't happen.
  const { error: auditError } = await admin.from("staff_audit_logs").insert({
    actor_id: auth.user.id,
    actor_role: "owner",
    action: "owner.support.reply",
    entity: "support_thread",
    entity_id: thread.id,
    meta: { via: "owner_support_command", division: thread.division },
  } as never);
  if (auditError) {
    return NextResponse.json(
      { error: "Audit logging failed; the reply was not sent." },
      { status: 502 },
    );
  }

  const { error: messageError } = await admin.from("support_messages").insert({
    thread_id: thread.id,
    sender_id: auth.user.id,
    sender_type: "agent",
    body: message,
  } as never);
  if (messageError) {
    return NextResponse.json({ error: "The reply could not be saved." }, { status: 502 });
  }

  await admin
    .from("support_threads")
    .update({ status: "in_progress", updated_at: new Date().toISOString() } as never)
    .eq("id", thread.id);

  // Best-effort: tell the customer the team replied (their bell + inbox).
  if (thread.user_id) {
    try {
      await publishNotification({
        userId: thread.user_id,
        division: (DIVISIONS.has(String(thread.division)) ? thread.division : "account") as never,
        eventType: "support.reply.received",
        severity: "info",
        title: "The team replied",
        body: thread.subject ? `Re: ${thread.subject}` : "You have a new reply from Henry Onyx.",
        deepLink: `/support/${thread.id}`,
        relatedType: "support_thread",
        relatedId: thread.id,
        publisher: "bridge:apps/hub/api/owner/support/reply",
      });
    } catch {
      /* the reply already exists; the notification is a relay, not a gate */
    }
  }

  return NextResponse.json({ ok: true, threadId: thread.id });
}
