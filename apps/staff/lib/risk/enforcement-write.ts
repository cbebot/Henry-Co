import "server-only";

/**
 * V3-40 — the staff one-tap enforcement writer.
 *
 * The ONLY write path for user-affecting enforcement (hold/freeze/release/
 * override). Every write:
 *   1. carries the acting STAFF user as actor (requireSecurityStaffActor ran
 *      first) and passes assertEnforcementAllowed — the same choke point the
 *      batch uses, where a system actor would throw AutoPunishmentError;
 *   2. anchors tier_at_action + the model FK to the entity's LATEST score (an
 *      entity that was never scored cannot be enforced — no score, no action);
 *   3. lands on the service-role client (authenticated has no INSERT grant; the
 *      DB CHECK re-verifies the actor/action pairing as the last line);
 *   4. emits the paired telemetry event with counts + ids only.
 */

import {
  assertEnforcementAllowed,
  type EnforcementAction,
  type RiskEntityType,
  RISK_ENTITY_TYPES,
} from "@henryco/intelligence";
import { emitEvent, persistEvent } from "@henryco/observability";
import { createStaffAdminSupabase } from "@/lib/supabase/admin";
import type { SecurityStaffActor } from "./actor";

const ACTION_BY_ID: Record<string, EnforcementAction> = {
  "apply-hold": "hold",
  "apply-freeze": "freeze",
  release: "release",
  override: "staff_override",
};

const EVENT_BY_ACTION: Record<EnforcementAction, "henry.risk.enforcement.held" | "henry.risk.enforcement.frozen" | "henry.risk.enforcement.released" | "henry.risk.staff.overrode" | "henry.risk.entity.scored"> = {
  hold: "henry.risk.enforcement.held",
  freeze: "henry.risk.enforcement.frozen",
  release: "henry.risk.enforcement.released",
  staff_override: "henry.risk.staff.overrode",
  flag: "henry.risk.entity.scored", // unreachable from this writer (staff ids never map to flag)
};

export interface EnforcementWriteResult {
  written: number;
  skippedUnscored: string[];
}

export async function applyRiskEnforcementAction(input: {
  actionId: string;
  selectedIds: string[];
  reason: string | null;
  actor: SecurityStaffActor;
}): Promise<EnforcementWriteResult> {
  const action = ACTION_BY_ID[input.actionId];
  if (!action) throw new Error(`Unknown risk action: ${input.actionId}`);

  // The doctrine choke point — staff actor required, reason required for
  // release/override. Throws before anything is written.
  assertEnforcementAllowed(action, { kind: "staff", staffUserId: input.actor.userId }, input.reason ?? undefined);

  const targets = input.selectedIds
    .map((id) => {
      const [entityType, entityId] = id.split("|");
      return { entityType, entityId };
    })
    .filter(
      (t): t is { entityType: RiskEntityType; entityId: string } =>
        Boolean(t.entityId) && (RISK_ENTITY_TYPES as readonly string[]).includes(t.entityType),
    );
  if (targets.length === 0) throw new Error("No valid entities selected.");

  const admin = createStaffAdminSupabase();

  // Anchor each action to the entity's latest score (tier + model FK).
  const { data: scoreRows, error: scoreError } = await admin
    .from("risk_scores")
    .select("entity_type, entity_id, tier, model_kind, model_version, shadow, scored_at")
    .in(
      "entity_id",
      targets.map((t) => t.entityId),
    )
    .order("scored_at", { ascending: false })
    .limit(1000);
  if (scoreError) throw new Error(`Could not read scores: ${scoreError.message}`);
  const latest = new Map<string, { tier: string; model_kind: string; model_version: string; shadow: boolean }>();
  for (const row of (scoreRows ?? []) as Array<{
    entity_type: string;
    entity_id: string;
    tier: string;
    model_kind: string;
    model_version: string;
    shadow: boolean;
  }>) {
    const key = `${row.entity_type}|${row.entity_id}`;
    if (!latest.has(key)) latest.set(key, row);
  }

  const skippedUnscored: string[] = [];
  const rows = targets.flatMap((t) => {
    const score = latest.get(`${t.entityType}|${t.entityId}`);
    if (!score) {
      skippedUnscored.push(`${t.entityType}|${t.entityId}`);
      return [];
    }
    return [
      {
        entity_type: t.entityType,
        entity_id: t.entityId,
        action,
        tier_at_action: score.tier,
        model_kind: score.model_kind,
        model_version: score.model_version,
        shadow: score.shadow,
        actor: input.actor.userId,
        reason: input.reason,
      },
    ];
  });
  if (rows.length === 0) throw new Error("Selected entities have no risk score to act on.");

  const { error: insertError } = await admin.from("risk_enforcement_log").insert(rows);
  if (insertError) throw new Error(`Enforcement write failed: ${insertError.message}`);

  const eventName = EVENT_BY_ACTION[action];
  emitEvent({
    name: eventName,
    classification: "user_action",
    outcome: "completed",
    actorId: input.actor.userId,
    payload: { count: rows.length, entities: rows.map((r) => `${r.entity_type}:${r.entity_id}`) },
  });
  void persistEvent({
    supabase: admin,
    name: eventName,
    actorId: input.actor.userId,
    payload: { count: rows.length, entities: rows.map((r) => `${r.entity_type}:${r.entity_id}`) },
  });

  return { written: rows.length, skippedUnscored };
}
