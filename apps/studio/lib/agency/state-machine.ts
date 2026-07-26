/**
 * SA-2 — the build-job state machine. PURE + the SINGLE choke point for every
 * transition (the `enforce_payment_intent_transition` doctrine applied to
 * jobs). The legal-transition table lives here AND is mirrored by the DB
 * trigger (migration) so neither app-layer bugs nor a direct DB write can move
 * a job through an illegal edge — belt and braces, like payment_intents.
 *
 * SAFETY-MODEL §6 is the load-bearing invariant encoded here: there is NO edge
 * from `qa`/`client_review` to `deploying`. The only door to `deploying` is
 * `approved_for_deploy`, which is only reachable from `owner_review` and only
 * via the human one-tap+reauth confirm route. No code path deploys without it.
 *
 * See docs/v3/studio-agency/ARCHITECTURE.md §3.1–3.2.
 */

export const BUILD_STAGES = [
  "queued",
  "dispatching",
  "building",
  "qa",
  "client_review",
  "owner_review",
  "approved_for_deploy",
  "deploying",
  "live",
  "aftercare",
  "build_failed",
  "qa_failed",
  "changes_requested",
  "stalled",
  "cancelled",
] as const;
export type BuildStage = (typeof BUILD_STAGES)[number];

/** Stages a job can still move OUT of (a tick claims only these). */
export const ACTIVE_STAGES: readonly BuildStage[] = [
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

/** Terminal-ish stages: closed, or waiting on an out-of-band human decision. */
export const TERMINAL_STAGES: readonly BuildStage[] = [
  "live",
  "aftercare",
  "build_failed",
  "qa_failed",
  "stalled",
  "cancelled",
];

/**
 * The legal transition table (ARCHITECTURE §3.2). Each key lists the ONLY
 * stages reachable from it. Empty = terminal. This is the whole grammar; the
 * DB trigger encodes the same pairs.
 */
export const LEGAL_TRANSITIONS: Record<BuildStage, readonly BuildStage[]> = {
  queued: ["dispatching", "cancelled", "stalled"],
  dispatching: ["building", "build_failed", "stalled", "cancelled"],
  building: ["qa", "build_failed", "stalled", "cancelled"],
  qa: ["client_review", "qa_failed", "stalled", "cancelled"],
  client_review: ["owner_review", "changes_requested", "stalled", "cancelled"],
  // owner_review → approved_for_deploy is the HARD GATE (human confirm only).
  owner_review: ["approved_for_deploy", "changes_requested", "stalled", "cancelled"],
  approved_for_deploy: ["deploying", "cancelled", "stalled"],
  deploying: ["live", "stalled"],
  changes_requested: ["queued", "cancelled"],
  // build_failed/qa_failed re-arm a retry by returning to queued (attempt++).
  build_failed: ["queued", "stalled", "cancelled"],
  qa_failed: ["queued", "stalled", "cancelled"],
  live: ["aftercare"],
  aftercare: [],
  stalled: ["queued", "cancelled"],
  cancelled: [],
};

export type TransitionCheck =
  | { ok: true }
  | { ok: false; reason: "same_stage" | "illegal_transition"; from: BuildStage; to: BuildStage };

/**
 * The choke point. Same-stage is an idempotent no-op (the DB trigger treats it
 * the same way — a re-delivered callback must not error). Any pair not in the
 * table is rejected.
 */
export function checkTransition(from: BuildStage, to: BuildStage): TransitionCheck {
  if (from === to) return { ok: false, reason: "same_stage", from, to };
  if (LEGAL_TRANSITIONS[from]?.includes(to)) return { ok: true };
  return { ok: false, reason: "illegal_transition", from, to };
}

export function isLegalTransition(from: BuildStage, to: BuildStage): boolean {
  return checkTransition(from, to).ok;
}

export function isActiveStage(stage: BuildStage): boolean {
  return ACTIVE_STAGES.includes(stage);
}

/**
 * The one stage that means "a human approved the exact reviewed artifact for
 * production." Deploy code asserts the job is HERE before it will run — never
 * `owner_review`, never `client_review`.
 */
export const DEPLOY_APPROVED_STAGE: BuildStage = "approved_for_deploy";

/** Whether `deploying` may legally begin — only from the approved stage. */
export function canBeginDeploy(stage: BuildStage): boolean {
  return stage === DEPLOY_APPROVED_STAGE;
}

/** Client-visible stage projection — the honest label, never internal detail. */
export function clientStageLabel(stage: BuildStage): string {
  switch (stage) {
    case "queued":
    case "dispatching":
      return "queued";
    case "building":
      return "building";
    case "qa":
      return "checking";
    case "client_review":
      return "ready_for_your_review";
    case "owner_review":
    case "approved_for_deploy":
    case "deploying":
      return "finalizing";
    case "live":
    case "aftercare":
      return "live";
    case "changes_requested":
      return "revising";
    case "build_failed":
    case "qa_failed":
    case "stalled":
      return "another_pass";
    case "cancelled":
      return "cancelled";
    default:
      return "in_progress";
  }
}
