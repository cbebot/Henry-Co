import "server-only";

import { publishNotification } from "@henryco/notifications";
import { createAdminSupabase } from "@/lib/supabase";

/**
 * Support reply core — post a reply into an Onyx Line support thread as the
 * team, from a confirmed founder action (F3 owner.support.reply).
 *
 * Writes the SAME support_messages spine the staff console uses (sender_type
 * "agent"), so the customer sees a normal team reply in their existing
 * support inbox. The AI composes; the OWNER confirms; this core sends.
 *
 * CALLERS MUST AUTHORIZE FIRST (requireOwner at the confirm route) and pass
 * the resolved actor — this module does not gate or resolve identity itself.
 * Discipline: validate → re-fetch → AUDIT-FIRST-ABORT → state writes →
 * best-effort customer-notification tail (never flips the result).
 */

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

export type SupportThreadState = {
  id: string;
  userId: string | null;
  subject: string;
  division: string;
  status: string;
};

export async function readSupportThread(threadIdInput: string): Promise<SupportThreadState | null> {
  const threadId = String(threadIdInput ?? "").trim();
  if (!threadId) return null;
  const admin = createAdminSupabase();
  const { data } = await admin
    .from("support_threads")
    .select("id, user_id, subject, division, status")
    .eq("id", threadId)
    .maybeSingle();
  const row = data as
    | { id: string; user_id: string | null; subject: string | null; division: string | null; status: string | null }
    | null;
  if (!row) return null;
  // A closed thread is not replyable from the AI rail — the console can reopen it.
  const status = String(row.status ?? "open");
  if (status === "closed" || status === "resolved") return null;
  return {
    id: row.id,
    userId: row.user_id,
    subject: String(row.subject ?? "Support request"),
    division: String(row.division ?? "account"),
    status,
  };
}

export async function applySupportReply(input: {
  threadId: string;
  body: string;
  actorId: string;
  actorRole: string;
}): Promise<{ ok: true; executionRef: string } | { ok: false; error: string }> {
  const message = String(input.body ?? "").trim();
  if (!message) {
    return { ok: false, error: "Write the reply first." };
  }
  if (message.length > 2000) {
    return { ok: false, error: "Keep the reply under 2,000 characters." };
  }

  const thread = await readSupportThread(input.threadId);
  if (!thread) {
    return { ok: false, error: "That thread is gone or already closed." };
  }

  const admin = createAdminSupabase();

  // AUDIT-FIRST-ABORT: if the trail can't be written, nothing is sent.
  const { error: auditError } = await admin.from("staff_audit_logs").insert({
    actor_id: input.actorId,
    actor_role: input.actorRole || "owner",
    action: "support.reply",
    entity: "support_thread",
    entity_id: thread.id,
    meta: { via: "founder_action", division: thread.division },
  } as never);
  if (auditError) {
    console.error("[support-reply-write] audit insert failed", auditError.message);
    return { ok: false, error: "Audit logging failed; the reply was not sent." };
  }

  const { error: messageError } = await admin.from("support_messages").insert({
    thread_id: thread.id,
    sender_id: input.actorId,
    sender_type: "agent",
    body: message,
  } as never);
  if (messageError) {
    return { ok: false, error: "The reply could not be saved." };
  }

  await admin
    .from("support_threads")
    .update({ status: "in_progress", updated_at: new Date().toISOString() } as never)
    .eq("id", thread.id);

  // Best-effort: the customer's bell — the reply already exists either way.
  if (thread.userId) {
    try {
      await publishNotification({
        userId: thread.userId,
        division: (DIVISIONS.has(thread.division) ? thread.division : "account") as never,
        eventType: "support.reply.received",
        severity: "info",
        title: "The team replied",
        body: thread.subject ? `Re: ${thread.subject}` : "You have a new reply from Henry Onyx.",
        deepLink: `/support/${thread.id}`,
        relatedType: "support_thread",
        relatedId: thread.id,
        publisher: "bridge:apps/hub/lib/support-reply-write",
      });
    } catch {
      /* notification is a relay, not a gate */
    }
  }

  return { ok: true, executionRef: `support:${thread.id}:reply` };
}
