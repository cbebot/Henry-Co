import "server-only";

import { createAdminSupabase } from "@/lib/supabase";

/**
 * V3-OWNER-CONTROL-01 — the platform moderation queue resolver.
 *
 * `platform_moderation_queue` exists on prod and had ZERO writers anywhere in
 * the repo: a table that could only ever be read. Reported content therefore
 * had no path to a verdict. This gives it one.
 *
 * TWO VERDICTS, and the distinction is deliberate:
 *   - `actioned`  — the report is upheld. Removal-class, so the rail demands a
 *                   password step-up and a written reason.
 *   - `dismissed` — the report is rejected. Still requires a reason, because a
 *                   dismissal is a decision someone may later need to justify.
 *
 * WHAT THIS DOES NOT DO: it records the verdict, it does not reach into the
 * reported entity and delete it. The queue row carries `division` +
 * `entity_type` + `entity_id` spanning every division, and a generic deleter
 * over that surface would be an arbitrary cross-division delete primitive
 * driven by a client-supplied id — a far larger blast radius than the problem
 * warrants. The verdict is the durable, auditable decision; enacting it against
 * a specific division's content belongs behind that division's own guarded
 * write path.
 *
 * CAS on the prior status makes the resolve idempotent: a replay finds zero
 * rows updated and reports `changed: false` rather than overwriting a verdict
 * (and its reviewer attribution) that has already landed.
 */

export type ModerationVerdict = "actioned" | "dismissed";

export type ModerationQueueItemState = {
  itemId: string;
  division: string;
  entityType: string;
  entityId: string | null;
  reason: string | null;
  severity: string | null;
  status: string;
  contentSnapshot: string | null;
  createdAt: string | null;
};

export async function readModerationQueueItem(
  itemId: string,
): Promise<ModerationQueueItemState | null> {
  const admin = createAdminSupabase();
  const { data, error } = await admin
    .from("platform_moderation_queue")
    .select("id, division, entity_type, entity_id, reason, severity, status, content_snapshot, created_at")
    .eq("id", itemId)
    .maybeSingle();
  if (error || !data) return null;

  const row = data as Record<string, unknown>;
  return {
    itemId,
    division: String(row.division || "hub"),
    entityType: String(row.entity_type || "unknown"),
    entityId: row.entity_id ? String(row.entity_id) : null,
    reason: row.reason ? String(row.reason) : null,
    severity: row.severity ? String(row.severity) : null,
    status: String(row.status || "pending"),
    contentSnapshot: row.content_snapshot ? String(row.content_snapshot) : null,
    createdAt: row.created_at ? String(row.created_at) : null,
  };
}

export async function applyModerationVerdict(input: {
  itemId: string;
  verdict: ModerationVerdict;
  note: string;
  actorId: string;
  actorRole: string;
  /** Prior status the decision was made against — the CAS anchor. */
  expectedStatus: string;
}): Promise<{ ok: true; executionRef: string; changed: boolean } | { ok: false; error: string }> {
  const { itemId, verdict, note, actorId, actorRole, expectedStatus } = input;

  if (verdict !== "actioned" && verdict !== "dismissed") {
    return { ok: false, error: "Choose a valid moderation verdict." };
  }
  if (!note.trim()) {
    return { ok: false, error: "Add a note explaining the moderation decision." };
  }

  const admin = createAdminSupabase();
  const now = new Date().toISOString();

  // Audit-first: no trail, no action.
  const { error: auditError } = await admin.from("staff_audit_logs").insert({
    actor_id: actorId,
    actor_role: actorRole || "owner",
    action: `moderation.item.${verdict}`,
    entity: "platform_moderation_queue",
    entity_id: itemId,
    meta: { verdict, prior_status: expectedStatus, reviewer_note_present: true, via: "owner_control" },
  } as never);
  if (auditError) {
    console.error("[moderation-resolve-write] staff audit insert failed", auditError.message);
    return { ok: false, error: "Audit logging failed; the report was not changed." };
  }

  const { data: updated, error: updateError } = await admin
    .from("platform_moderation_queue")
    .update({
      status: verdict,
      review_action: verdict,
      review_notes: note.trim(),
      reviewed_by: actorId,
      resolved_at: now,
    } as never)
    .eq("id", itemId)
    .eq("status", expectedStatus)
    .select("id");
  if (updateError) {
    console.error("[moderation-resolve-write] verdict update failed", updateError.message);
    return { ok: false, error: "That report could not be updated." };
  }

  return {
    ok: true,
    executionRef: `moderation:${itemId}:${verdict}`,
    changed: Array.isArray(updated) && updated.length === 1,
  };
}
