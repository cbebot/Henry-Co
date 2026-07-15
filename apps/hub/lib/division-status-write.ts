import "server-only";

import { createAdminSupabase } from "@/lib/supabase";

/**
 * Division status core — pause / resume a division from the owner console or
 * a confirmed founder action (F3 owner.division.status.set).
 *
 * Writes the SAME company_divisions.status column the owner divisions API
 * upserts, so a pause from the AI is indistinguishable from a pause from the
 * settings page — and the public surfaces (live-divisions filter) react to
 * either within a minute.
 *
 * CALLERS MUST AUTHORIZE FIRST (requireOwner at the confirm route) and pass
 * the resolved actor — this module does not gate or resolve identity itself.
 * Discipline: validate → re-fetch → AUDIT-FIRST-ABORT → the state write.
 */

export type DivisionStatusState = {
  id: string;
  slug: string;
  name: string;
  status: string;
  isPublished: boolean;
};

export async function readDivisionStatus(slugInput: string): Promise<DivisionStatusState | null> {
  const slug = String(slugInput ?? "").trim().toLowerCase();
  if (!slug) return null;
  const admin = createAdminSupabase();
  const { data } = await admin
    .from("company_divisions")
    .select("id, slug, name, status, is_published")
    .eq("slug", slug)
    .maybeSingle();
  const row = data as
    | { id: string; slug: string | null; name: string | null; status: string | null; is_published: boolean | null }
    | null;
  if (!row) return null;
  return {
    id: row.id,
    slug: String(row.slug ?? slug),
    name: String(row.name ?? slug),
    status: String(row.status ?? "active"),
    isPublished: Boolean(row.is_published ?? true),
  };
}

export async function applyDivisionStatus(input: {
  slug: string;
  intent: "pause" | "resume";
  actorId: string;
  actorRole: string;
}): Promise<{ ok: true; executionRef: string } | { ok: false; error: string }> {
  if (input.intent !== "pause" && input.intent !== "resume") {
    return { ok: false, error: "That change isn't recognised." };
  }

  const current = await readDivisionStatus(input.slug);
  if (!current) {
    return { ok: false, error: "That division isn't in the registry." };
  }
  const targetStatus = input.intent === "pause" ? "paused" : "active";
  if (current.status === targetStatus) {
    return { ok: false, error: `The division is already ${targetStatus}.` };
  }

  const admin = createAdminSupabase();

  // AUDIT-FIRST-ABORT: if the trail can't be written, the division stays as it is.
  const { error: auditError } = await admin.from("staff_audit_logs").insert({
    actor_id: input.actorId,
    actor_role: input.actorRole || "owner",
    action: `division.${input.intent}`,
    entity: "company_division",
    entity_id: current.id,
    meta: {
      via: "founder_action",
      slug: current.slug,
      from_status: current.status,
      to_status: targetStatus,
    },
  } as never);
  if (auditError) {
    console.error("[division-status-write] audit insert failed", auditError.message);
    return { ok: false, error: "Audit logging failed; the division was not changed." };
  }

  const { error: writeError } = await admin
    .from("company_divisions")
    .update({ status: targetStatus, updated_at: new Date().toISOString() } as never)
    .eq("id", current.id);
  if (writeError) {
    return { ok: false, error: "The status change could not be saved." };
  }

  return { ok: true, executionRef: `division:${current.slug}:${input.intent}` };
}
