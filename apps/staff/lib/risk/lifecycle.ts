import "server-only";

/**
 * V3-40 — governed model lifecycle (owner-approved, shadow-first).
 *
 * Promotion (shadow → live):
 *   * OWNER access required (security-staff alone cannot arm enforcement);
 *   * refuses before ≥30 DISTINCT shadow-scored days exist for the version —
 *     the mandatory validation window is enforced in code, not convention;
 *   * demote-first ordering: the currently-live version is retired BEFORE the
 *     target goes live, so a mid-sequence failure leaves NO live model (gates
 *     off — the fail-safe direction) rather than two.
 *
 * Rollback (live → rolled_back):
 *   * restores the most recently retired previously-live version (if any);
 *   * RELEASES every open staff hold/freeze taken under the rolled-back
 *     version (a release row per entity, actor = the rolling-back owner) —
 *     an enforcement may never outlive the model that justified it.
 */

import { emitEvent, persistEvent } from "@henryco/observability";
import { createStaffAdminSupabase } from "@/lib/supabase/admin";
import type { SecurityStaffActor } from "./actor";

export const RISK_SHADOW_WINDOW_DAYS = 30;

export interface LifecycleResult {
  ok: boolean;
  message: string;
}

export async function promoteRiskModel(
  version: string,
  actor: SecurityStaffActor,
  modelKind = "fraud_risk",
): Promise<LifecycleResult> {
  if (!actor.hasOwnerAccess) return { ok: false, message: "Owner approval required." };
  const admin = createStaffAdminSupabase();

  const { data: target } = await admin
    .from("model_versions")
    .select("id, status")
    .eq("model_kind", modelKind)
    .eq("version", version)
    .maybeSingle();
  if (!target) return { ok: false, message: "Unknown model version." };
  if ((target as { status: string }).status !== "shadow") {
    return { ok: false, message: "Only a shadow version can be promoted." };
  }

  // The mandatory ≥30-day shadow window, counted as DISTINCT scored days.
  const { data: days } = await admin
    .from("risk_scores")
    .select("scored_on")
    .eq("model_kind", modelKind)
    .eq("model_version", version)
    .limit(5000);
  const distinctDays = new Set(((days ?? []) as { scored_on: string }[]).map((d) => d.scored_on)).size;
  if (distinctDays < RISK_SHADOW_WINDOW_DAYS) {
    return {
      ok: false,
      message: `Shadow window not met: ${distinctDays}/${RISK_SHADOW_WINDOW_DAYS} scored days.`,
    };
  }

  // Demote-first: a failure between the two steps leaves no live model (safe).
  const { error: demoteError } = await admin
    .from("model_versions")
    .update({ status: "retired" })
    .eq("model_kind", modelKind)
    .eq("status", "live");
  if (demoteError) return { ok: false, message: `Demote failed: ${demoteError.message}` };

  const { error: promoteError } = await admin
    .from("model_versions")
    .update({ status: "live", approved_by: actor.userId, approved_at: new Date().toISOString() })
    .eq("model_kind", modelKind)
    .eq("version", version)
    .eq("status", "shadow");
  if (promoteError) return { ok: false, message: `Promotion failed: ${promoteError.message}` };

  const payload = { modelKind, version, shadowDays: distinctDays };
  emitEvent({ name: "henry.risk.model.promoted", classification: "user_action", outcome: "approved", actorId: actor.userId, payload });
  void persistEvent({ supabase: admin, name: "henry.risk.model.promoted", actorId: actor.userId, payload });
  return { ok: true, message: `Version ${version} is live.` };
}

export async function rollbackRiskModel(
  version: string,
  reason: string,
  actor: SecurityStaffActor,
  modelKind = "fraud_risk",
): Promise<LifecycleResult> {
  if (!actor.hasOwnerAccess) return { ok: false, message: "Owner approval required." };
  if (!reason.trim()) return { ok: false, message: "A reason is required." };
  const admin = createStaffAdminSupabase();

  const { error: rollbackError, data: rolled } = await admin
    .from("model_versions")
    .update({ status: "rolled_back" })
    .eq("model_kind", modelKind)
    .eq("version", version)
    .eq("status", "live")
    .select("version");
  if (rollbackError) return { ok: false, message: `Rollback failed: ${rollbackError.message}` };
  if (!rolled || rolled.length === 0) return { ok: false, message: "That version is not live." };

  // Restore the most recently retired previously-live version, if one exists.
  const { data: prior } = await admin
    .from("model_versions")
    .select("version, approved_at")
    .eq("model_kind", modelKind)
    .eq("status", "retired")
    .not("approved_at", "is", null)
    .order("approved_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (prior) {
    await admin
      .from("model_versions")
      .update({ status: "live" })
      .eq("model_kind", modelKind)
      .eq("version", (prior as { version: string }).version)
      .eq("status", "retired");
  }

  // Release every open staff hold/freeze taken under the rolled-back version.
  let released = 0;
  const { data: actions } = await admin
    .from("risk_enforcement_log")
    .select("entity_type, entity_id, action, tier_at_action, model_kind, model_version, created_at")
    .in("action", ["hold", "freeze", "release", "staff_override"])
    .order("created_at", { ascending: false })
    .limit(2000);
  const latest = new Map<string, { action: string; tier: string; modelVersion: string }>();
  for (const row of (actions ?? []) as Array<{
    entity_type: string;
    entity_id: string;
    action: string;
    tier_at_action: string;
    model_version: string;
  }>) {
    const key = `${row.entity_type}|${row.entity_id}`;
    if (!latest.has(key)) {
      latest.set(key, { action: row.action, tier: row.tier_at_action, modelVersion: row.model_version });
    }
  }
  const releases = Array.from(latest.entries())
    .filter(
      ([, s]) => (s.action === "hold" || s.action === "freeze") && s.modelVersion === version,
    )
    .map(([key, s]) => {
      const [entityType, entityId] = key.split("|");
      return {
        entity_type: entityType,
        entity_id: entityId,
        action: "release",
        tier_at_action: s.tier,
        model_kind: modelKind,
        model_version: version,
        shadow: false,
        actor: actor.userId,
        reason: `model rolled back: ${reason.trim()}`,
      };
    });
  if (releases.length > 0) {
    const { error: releaseError } = await admin.from("risk_enforcement_log").insert(releases);
    if (!releaseError) released = releases.length;
  }

  const payload = { modelKind, version, released, restored: prior ? (prior as { version: string }).version : null };
  emitEvent({ name: "henry.risk.model.rolled_back", classification: "user_action", outcome: "completed", actorId: actor.userId, payload });
  void persistEvent({ supabase: admin, name: "henry.risk.model.rolled_back", actorId: actor.userId, payload });
  return { ok: true, message: `Version ${version} rolled back; ${released} enforcement(s) released.` };
}
