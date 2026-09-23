import "server-only";

/**
 * V3-42 — the ONLY write path for recommendation state.
 *
 * What this function does: records that a HUMAN agreed with, dismissed or
 * snoozed a suggestion, and audits it.
 *
 * What it cannot do, by construction: apply anything. There is no branch here
 * that staffs a queue, creates a rule, holds a transaction or touches a
 * customer. "Accept" writes `status = 'accepted'` and an actor id — the
 * operator then follows the card's link and does the work themselves.
 *
 * The layers that keep that true — each must be edited to break it:
 *   0. the dark-launch flag: while `predictive_dashboards` is off the page is a
 *      404, and a direct POST is refused here too;
 *   1. `assertActorMayActOnLens` — the caller's role must cover the lens;
 *   2. `recommendationScopeForKey` — the KEY must belong to that lens (stops a
 *      trust-shaped key being written under another lens to skew soak metrics);
 *      ...and the card must be LIVE: the engine, re-run through the caller's
 *      own RLS-scoped session, must be showing that lens this exact key now;
 *   3. `assertHumanActor` — no state change away from 'open' without an actor;
 *   4. the `staff_recommendation_human_actor` CHECK refuses the row at the DB;
 *   5. every action is written to the audit log with actor + role + key.
 */

import {
  assertHumanActor,
  isRecommendationKeyCurrent,
  isFlagEnabled,
  parseHenryFeatureFlags,
  recommendationScopeForKey,
  type RecommendationRoleScope,
} from "@henryco/intelligence";
import { liveRecommendationKeys, type IntelligenceSupabaseClient } from "@henryco/dashboard-modules-staff";
import { writeAuditLog } from "@henryco/observability/audit-log";
import { emitEvent } from "@henryco/observability/events";
import { createStaffAdminSupabase } from "@/lib/supabase/admin";
import { createStaffSupabaseServer } from "@/lib/supabase/server";
import { assertActorMayActOnLens, type IntelligenceStaffActor } from "./actor";

export type RecommendationAction = "accept" | "dismiss" | "snooze";

/**
 * The card the operator clicked is no longer one the engine shows (midnight,
 * the nightly batch or the week rolled over since the page rendered). Distinct
 * from a failure: retrying can never succeed, so the action refreshes the page
 * instead of inviting a retry (adversarial round 3).
 */
export class RecommendationNotLiveError extends Error {
  constructor() {
    super("That recommendation is no longer current.");
    this.name = "RecommendationNotLiveError";
  }
}

const STATUS_BY_ACTION: Readonly<Record<RecommendationAction, "accepted" | "dismissed" | "snoozed">> = {
  accept: "accepted",
  dismiss: "dismissed",
  snooze: "snoozed",
};

/** A snoozed card returns in three days — long enough to stop nagging, short
 *  enough that a real problem resurfaces while it still matters. */
export const SNOOZE_DAYS = 3;

export interface RecordRecommendationInput {
  actor: IntelligenceStaffActor;
  recommendationKey: string;
  lens: RecommendationRoleScope;
  action: RecommendationAction;
  now?: Date;
  env?: Record<string, string | undefined>;
  /** Test seam: the live card keys for a lens. Defaults to re-deriving the rail. */
  liveKeys?: (lens: RecommendationRoleScope, now: Date) => Promise<ReadonlySet<string>>;
}

export async function recordRecommendationAction(
  input: RecordRecommendationInput,
): Promise<{ status: string }> {
  // Layer 0 — dark launch. The page 404s while off; a hand-rolled POST must too.
  const env = input.env ?? (process.env as Record<string, string | undefined>);
  if (!isFlagEnabled(parseHenryFeatureFlags(env), "predictive_dashboards")) {
    throw new Error("This dashboard is not enabled.");
  }

  // Layer 1 — the caller's role must cover this lens.
  assertActorMayActOnLens(input.actor, input.lens);

  // Layer 2 — the key must be one the engine emits, FOR this lens.
  const key = typeof input.recommendationKey === "string" ? input.recommendationKey : "";
  const keyScope = recommendationScopeForKey(key);
  if (!keyScope) throw new Error("Unknown recommendation.");
  if (keyScope !== input.lens) throw new Error("That recommendation does not belong to this dashboard.");
  // ...and it must be CURRENT: the engine only emits this week's backlog cards
  // and anomalies inside the chart window. Refusing future/stale keys stops a
  // lens member pre-dismissing next month's cards for the whole team.
  const now = input.now ?? new Date();
  if (!isRecommendationKeyCurrent(key, now)) throw new RecommendationNotLiveError();

  // ...and it must be a card the engine is showing THIS lens right now
  // (adversarial round 2). Grammar and date checks cannot tell "this week's
  // card" from "this week's card before it exists": dismissing
  // `dispute.watchlist.<week>` at Monday 00:01 hid it from the whole team.
  // Re-deriving through the caller's RLS-scoped session closes that exactly.
  const session = await createStaffSupabaseServer();
  const live = input.liveKeys
    ? await input.liveKeys(input.lens, now)
    : await liveRecommendationKeys(session as unknown as IntelligenceSupabaseClient, input.lens, now);
  if (!live.has(key)) throw new RecommendationNotLiveError();

  const status = Object.prototype.hasOwnProperty.call(STATUS_BY_ACTION, input.action)
    ? STATUS_BY_ACTION[input.action]
    : undefined;
  if (!status) throw new Error("Unknown recommendation action.");

  // Layer 3 — a state change away from 'open' REQUIRES a human actor.
  assertHumanActor(status, input.actor.userId);

  const snoozeUntil =
    status === "snoozed" ? new Date(now.getTime() + SNOOZE_DAYS * 86_400_000).toISOString() : null;

  const admin = createStaffAdminSupabase();
  // Layer 4 — the DB CHECK. Upsert on (recommendation_key, role_scope) so
  // re-deciding the same card updates it rather than accumulating duplicates a
  // later dismissal would miss. `id` is deliberately NOT sent: on insert the
  // column default mints it, and on conflict the existing row keeps its key.
  const { error } = await admin.from("staff_recommendation_state").upsert(
    {
      recommendation_key: key,
      role_scope: input.lens,
      status,
      actor: input.actor.userId,
      acted_at: now.toISOString(),
      snooze_until: snoozeUntil,
      updated_at: now.toISOString(),
    } as never,
    { onConflict: "recommendation_key,role_scope" } as never,
  );
  if (error) throw new Error("Recommendation state could not be saved.");

  // Layer 5 — audit, through the CALLER'S OWN SESSION (the bulk-actions.ts
  // precedent). `add_audit_log_v2` takes the actor from auth.uid() and refuses
  // non-staff callers; under the service role auth.uid() is NULL, so an admin-
  // client audit raised on every call and was silently swallowed (round 1).
  // `entity_id` is a uuid column, so the key travels in new_values instead.
  const auditId = await writeAuditLog(session as never, {
    action: `staff.intelligence.recommendation.${status}`,
    entityType: "staff_recommendation",
    entityId: null,
    newValues: { recommendation_key: key, status, role_scope: input.lens, snooze_until: snoozeUntil },
    division: null,
    reason: "operator_decision",
  });
  if (!auditId) {
    // The decision itself is saved (and carries its actor), but an unaudited
    // decision is surfaced loudly rather than swallowed.
    console.error("[staff-intelligence] recommendation decision saved but audit write failed", { key, status });
  }

  // A snooze is tracked as "not now" for adoption metrics, with the real status
  // in the payload so the 14-day soak can tell the two apart.
  emitEvent({
    name:
      status === "accepted"
        ? "henry.staff_dashboard.recommendation.accepted"
        : "henry.staff_dashboard.recommendation.dismissed",
    classification: "user_action",
    outcome: "completed",
    actorId: input.actor.userId,
    payload: { recommendation_key: key, role_scope: input.lens, status },
  });

  return { status };
}
