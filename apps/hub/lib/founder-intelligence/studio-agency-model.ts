/**
 * SA-4 — PURE studio-agency model shared by the hub's operator readers,
 * writers, lookups, and tests. No server imports (mirrors the studio app's
 * state-machine.ts so the two walls stay in lock-step; the DB transition
 * trigger is the authoritative third wall).
 *
 * All money figures are kobo integers. The model NEVER computes a money amount
 * from AI input — `computeBudgetIncreaseKobo` takes a bounded preset step and
 * the server-read current envelope only.
 */

/** The studio build-job stage vocabulary (must mirror apps/studio state-machine.ts + DB CHECK). */
export type StudioBuildStage =
  | "queued"
  | "dispatching"
  | "building"
  | "qa"
  | "client_review"
  | "owner_review"
  | "approved_for_deploy"
  | "deploying"
  | "live"
  | "aftercare"
  | "build_failed"
  | "qa_failed"
  | "changes_requested"
  | "stalled"
  | "cancelled";

/** Non-terminal stages the orchestrator still owns (the tick's claim set). */
export const AGENCY_ACTIVE_STAGES: readonly StudioBuildStage[] = [
  "queued",
  "dispatching",
  "building",
  "qa",
  "client_review",
  "owner_review",
  "approved_for_deploy",
  "deploying",
  "changes_requested",
];

/**
 * Stages from which `cancelled` is a LEGAL edge in the studio state machine
 * (state-machine.ts LEGAL_TRANSITIONS + the DB trigger). `deploying` is
 * deliberately absent — a mid-deploy job can only complete or stall; cancel
 * would abandon a half-flipped site.
 */
export const AGENCY_CANCELLABLE_STAGES: readonly StudioBuildStage[] = [
  "queued",
  "dispatching",
  "building",
  "qa",
  "client_review",
  "owner_review",
  "approved_for_deploy",
  "changes_requested",
  "build_failed",
  "qa_failed",
  "stalled",
];

/**
 * Stages where an operator PAUSE (claim-hold) is meaningful. Pause is NOT a
 * state-machine stage — it parks the tick's CAS claim (`claimed_by`) on a
 * sentinel so the orchestrator cannot claim the job; the stage is untouched
 * and resume simply releases the hold. `deploying` is excluded (a crashed
 * deploy must stay resumable) and terminal stages have nothing to hold.
 */
export const AGENCY_PAUSABLE_STAGES: readonly StudioBuildStage[] = [
  "queued",
  "dispatching",
  "building",
  "qa",
  "client_review",
  "owner_review",
  "approved_for_deploy",
  "changes_requested",
];

/** The claim-hold sentinel the pause action parks on studio_build_jobs.claimed_by. */
export const OPERATOR_HOLD_SENTINEL = "operator:paused";

export function isAgencyActiveStage(stage: string): boolean {
  return (AGENCY_ACTIVE_STAGES as readonly string[]).includes(stage);
}

export function isAgencyCancellable(stage: string): boolean {
  return (AGENCY_CANCELLABLE_STAGES as readonly string[]).includes(stage);
}

export function isAgencyPausable(stage: string): boolean {
  return (AGENCY_PAUSABLE_STAGES as readonly string[]).includes(stage);
}

/**
 * The new envelope after a preset percentage step. Server-computed from the
 * server-read current envelope — the model only ever names the bounded step.
 * Integer kobo, rounded down; a non-positive/garbage base yields 0 (the
 * applier rejects that upstream).
 */
export function computeBudgetIncreaseKobo(currentBudgetKobo: number, step: "10" | "25" | "50"): number {
  const base = Number.isFinite(currentBudgetKobo) ? Math.max(0, Math.floor(currentBudgetKobo)) : 0;
  const pct = Number(step);
  return base + Math.floor((base * pct) / 100);
}

/** Milliseconds since the job's last heartbeat (falls back to updatedAt). */
export function heartbeatAgeMs(input: { lastHeartbeatAt: string | null; updatedAt: string }, nowMs: number): number | null {
  const anchor = input.lastHeartbeatAt ?? input.updatedAt;
  const ts = Date.parse(anchor);
  if (!Number.isFinite(ts)) return null;
  return Math.max(0, nowMs - ts);
}

/** Owner-facing naira rendering for kobo integers (owner surfaces only). */
export function formatNairaFromKobo(kobo: number): string {
  const naira = Math.floor(Math.max(0, Number(kobo) || 0) / 100);
  return `₦${naira.toLocaleString("en-NG")}`;
}
