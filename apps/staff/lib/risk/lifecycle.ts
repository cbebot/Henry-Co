import "server-only";

/**
 * V3-40 — governed model lifecycle (owner-approved, shadow-first).
 *
 * The state transitions run inside TRANSACTIONAL guarded RPCs
 * (`promote_risk_model` / `rollback_risk_model`, migration 20260725120000) so the
 * demote+promote and the rollback+restore+release are each ALL-OR-NOTHING and
 * serialized per model_kind by a row lock — the app can never leave a half-applied
 * lifecycle (zero-live-but-reported-ok, or a two-live window). This TS layer only:
 *   1. gates on OWNER access (security-staff alone cannot arm enforcement);
 *   2. requires a reason for rollback;
 *   3. calls the RPC and translates its verdict into a LifecycleResult + telemetry.
 *
 * Promotion refuses before ≥30 DISTINCT shadow-scored days exist (enforced INSIDE
 * the RPC, so it cannot be raced). Rollback releases EVERY open hold/freeze taken
 * under the rolled-back version (set-based in SQL, no row cap) — an enforcement can
 * never outlive the model that justified it.
 */

import { emitEvent, persistEvent } from "@henryco/observability";
import { createStaffAdminSupabase } from "@/lib/supabase/admin";
import type { SecurityStaffActor } from "./actor";

export const RISK_SHADOW_WINDOW_DAYS = 30;

export interface LifecycleResult {
  ok: boolean;
  message: string;
}

const PROMOTE_REASON_COPY: Record<string, string> = {
  unknown_version: "Unknown model version.",
  not_shadow: "Only a shadow version can be promoted (it may have been promoted already).",
  shadow_window: "Shadow window not met.",
};

export async function promoteRiskModel(
  version: string,
  actor: SecurityStaffActor,
  modelKind = "fraud_risk",
): Promise<LifecycleResult> {
  if (!actor.hasOwnerAccess) return { ok: false, message: "Owner approval required." };
  const admin = createStaffAdminSupabase();

  const { data, error } = await admin.rpc("promote_risk_model", {
    p_model_kind: modelKind,
    p_version: version,
    p_approver: actor.userId,
    p_min_shadow_days: RISK_SHADOW_WINDOW_DAYS,
  });
  if (error) return { ok: false, message: `Promotion failed: ${error.message}` };

  const result = (data ?? {}) as { ok?: boolean; reason?: string; days?: number; shadow_days?: number };
  if (!result.ok) {
    if (result.reason === "shadow_window") {
      return {
        ok: false,
        message: `Shadow window not met: ${result.days ?? 0}/${RISK_SHADOW_WINDOW_DAYS} scored days.`,
      };
    }
    return { ok: false, message: PROMOTE_REASON_COPY[result.reason ?? ""] ?? "Promotion failed." };
  }

  const payload = { modelKind, version, shadowDays: result.shadow_days ?? 0 };
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

  const { data, error } = await admin.rpc("rollback_risk_model", {
    p_model_kind: modelKind,
    p_version: version,
    p_reason: reason.trim(),
    p_actor: actor.userId,
  });
  if (error) return { ok: false, message: `Rollback failed: ${error.message}` };

  const result = (data ?? {}) as { ok?: boolean; reason?: string; restored?: string | null; released?: number };
  if (!result.ok) {
    return { ok: false, message: result.reason === "not_live" ? "That version is not live." : "Rollback failed." };
  }

  const released = result.released ?? 0;
  const payload = { modelKind, version, released, restored: result.restored ?? null };
  emitEvent({ name: "henry.risk.model.rolled_back", classification: "user_action", outcome: "completed", actorId: actor.userId, payload });
  void persistEvent({ supabase: admin, name: "henry.risk.model.rolled_back", actorId: actor.userId, payload });
  return { ok: true, message: `Version ${version} rolled back; ${released} enforcement(s) released.` };
}
