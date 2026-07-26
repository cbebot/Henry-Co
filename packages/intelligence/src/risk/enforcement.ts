// V3-40 — enforcement, under the NO-AUTO-PUNISHMENT absolute.
//
// A prediction NEVER auto-blocks, auto-suspends, or auto-charges a real user. The system
// actor's entire vocabulary is `flag`: a score can only raise an entity into the staff
// review queue. `hold` and `freeze` — the only user-affecting states — exist exclusively
// as one-tap STAFF actions, and `release`/`staff_override` likewise. This is enforced
// three times over: (1) the type system (`SystemEnforcementAction` is the singleton
// "flag"), (2) the runtime guard here (throws `AutoPunishmentError`), and (3) a CHECK
// constraint on `risk_enforcement_log` (`action = 'flag' OR actor <> 'system'`).
//
// Shadow doctrine: while the model row is not `live`, even the flag is shadow-marked and
// the sensitive-action gate ignores everything — scores accumulate for the validation
// report, nothing else. And regardless of status, the gate consults ONLY staff-applied
// states: a score by itself never gates an action.

import type { RiskScoreResult, RiskTier } from "./types";

export type EnforcementAction = "flag" | "hold" | "freeze" | "release" | "staff_override";

/** Everything the system actor is allowed to do. This union growing would be a design bug. */
export type SystemEnforcementAction = "flag";

export type EnforcementActor =
  | { kind: "system" }
  | { kind: "staff"; staffUserId: string };

/** The staff-applied states a sensitive-action gate may consult. */
export type ActiveEnforcementState = "none" | "hold" | "freeze";

export interface ActiveEnforcement {
  state: ActiveEnforcementState;
  /** Who applied it — the gate must ignore anything not staff-applied. */
  appliedByStaff: boolean;
  /** Status of the model version the underlying score was produced by. */
  modelStatus: "shadow" | "live" | "rolled_back" | "retired";
}

export class AutoPunishmentError extends Error {
  constructor(action: EnforcementAction) {
    super(
      `enforcement action "${action}" requires a staff actor — the system may only flag for human review`,
    );
    this.name = "AutoPunishmentError";
  }
}

/** Tiers that put an entity in front of a human. */
const FLAGGABLE_TIERS: readonly RiskTier[] = ["monitor", "review", "freeze"] as const;

export interface SystemEnforcementPlan {
  action: SystemEnforcementAction | "none";
  /** True while the model is not live — the flag is telemetry for the shadow report only. */
  shadow: boolean;
}

/**
 * What the batch scorer may do with a score: flag it for humans, or nothing.
 * Deliberately incapable of expressing hold/freeze.
 */
export function planSystemEnforcement(result: RiskScoreResult): SystemEnforcementPlan {
  if (!FLAGGABLE_TIERS.includes(result.tier)) return { action: "none", shadow: result.shadow };
  return { action: "flag", shadow: result.shadow };
}

/**
 * The single choke point every enforcement write goes through. Throws before anything is
 * persisted when a non-staff actor attempts a user-affecting action, and when a staff
 * override/release arrives without a reason (auditability is not optional).
 */
export function assertEnforcementAllowed(action: EnforcementAction, actor: EnforcementActor, reason?: string): void {
  if (actor.kind !== "staff") {
    if (action !== "flag") throw new AutoPunishmentError(action);
    return;
  }
  if (!actor.staffUserId || !actor.staffUserId.trim()) {
    throw new Error("staff enforcement actions require the acting staff user id");
  }
  if ((action === "staff_override" || action === "release") && !(reason && reason.trim())) {
    throw new Error(`enforcement action "${action}" requires a reason`);
  }
}

/**
 * Should a sensitive action be gated for this entity? True ONLY when a STAFF-APPLIED
 * hold/freeze exists under a LIVE model. Shadow scores, system flags, and rolled-back
 * models gate nothing. Fail direction: absent/undefined enforcement → false (a missing
 * risk system must never lock a customer out).
 */
export function isSensitiveActionGated(active: ActiveEnforcement | null | undefined): boolean {
  if (!active) return false;
  if (!active.appliedByStaff) return false;
  if (active.modelStatus !== "live") return false;
  return active.state === "hold" || active.state === "freeze";
}
