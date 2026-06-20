/**
 * V3-70 Employer Hiring Suite — pure logic (framework-free, unit-testable).
 *
 * No `server-only`, no Supabase, no React: every function here is a pure
 * transformation so `node:test` (via tsx) can exercise the hiring-suite
 * invariants without a live database. The server data layer
 * (`hiring-suite.ts`) and the API routes compose these.
 */

export type BusinessRole = "owner" | "admin" | "member";

export type ActingScopeInput =
  | { kind: "personal" }
  | { kind: "business"; businessId: string; role?: BusinessRole };

/**
 * The row-scope predicate a surface must apply. A business context binds reads to
 * its own `businessId`; a personal context resolves to the sentinel `__none__`
 * which matches no business — so a personal viewer sees zero hiring rows. This is
 * the in-code mirror of the `is_hiring_team_member` RLS predicate and the unit
 * under the cross-business isolation test.
 */
export function buildHiringScope(ctx: ActingScopeInput): { businessId: string } {
  if (ctx.kind === "business" && ctx.businessId) return { businessId: ctx.businessId };
  return { businessId: "__none__" };
}

/** The four default scoring rubrics (labels are i18n keys, resolved in the UI). */
export const HIRING_RUBRIC_KEYS = ["technical", "communication", "culture", "experience"] as const;
export type HiringRubricKey = (typeof HIRING_RUBRIC_KEYS)[number];

export function isValidScore(score: number): boolean {
  return Number.isInteger(score) && score >= 1 && score <= 5;
}

export type RawScore = {
  scorerUserId: string;
  rubricKey: string;
  score: number;
};

export type ScoreSummary = {
  scorerCount: number;
  scoreCount: number;
  overallMean: number | null;
  rubricMeans: Record<string, { mean: number; count: number }>;
  /** Reserved for the V3-41 predictive quality model — null until that ships. */
  predictiveScore: number | null;
};

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Aggregate a candidate's team scores — the in-code mirror of the SQL view
 * `jobs_application_score_summary` (per-rubric mean + overall mean + distinct
 * scorer count). Kept in sync so the unit test pins both shapes to one contract.
 */
export function aggregateScores(scores: RawScore[]): ScoreSummary {
  const valid = scores.filter((s) => isValidScore(s.score));
  if (valid.length === 0) {
    return { scorerCount: 0, scoreCount: 0, overallMean: null, rubricMeans: {}, predictiveScore: null };
  }
  const byRubric = new Map<string, number[]>();
  const scorers = new Set<string>();
  let total = 0;
  for (const s of valid) {
    scorers.add(s.scorerUserId);
    total += s.score;
    const arr = byRubric.get(s.rubricKey) ?? [];
    arr.push(s.score);
    byRubric.set(s.rubricKey, arr);
  }
  const rubricMeans: ScoreSummary["rubricMeans"] = {};
  for (const [key, arr] of byRubric) {
    rubricMeans[key] = {
      mean: round2(arr.reduce((a, b) => a + b, 0) / arr.length),
      count: arr.length,
    };
  }
  return {
    scorerCount: scorers.size,
    scoreCount: valid.length,
    overallMean: round2(total / valid.length),
    rubricMeans,
    predictiveScore: null,
  };
}

/**
 * Resolve @mention targets: keep only ids that are members of the owning business
 * (a mention of a non-member is dropped server-side, never delivered), de-duped,
 * and excluding the author (you can't mention yourself into a notification).
 */
export function resolveMentions(
  memberUserIds: string[],
  requestedUserIds: string[],
  authorUserId?: string,
): string[] {
  const members = new Set(memberUserIds);
  const out: string[] = [];
  const seen = new Set<string>();
  for (const id of requestedUserIds) {
    if (!id || seen.has(id)) continue;
    if (!members.has(id)) continue;
    if (authorUserId && id === authorUserId) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

export type DecisionType = "offer" | "rejection" | "hire";

export type DecisionTransition = {
  /** Target pipeline stage (validated against the pipeline's stages in the RPC). */
  stage: string;
  /** New application status. */
  status: string;
  /** Telemetry event key in HenryEventNames. */
  eventKey: "HIRING_OFFER_SENT" | "HIRING_APPLICATION_STAGED" | "HIRING_CANDIDATE_HIRED";
  /** Which branded document to render, if any. */
  document: "offer" | "rejection" | null;
};

/** Map a recruiter decision to its stage/status transition + telemetry + document. */
export function decisionToTransition(type: DecisionType): DecisionTransition {
  switch (type) {
    case "offer":
      return { stage: "offer", status: "active", eventKey: "HIRING_OFFER_SENT", document: "offer" };
    case "rejection":
      return { stage: "rejected", status: "rejected", eventKey: "HIRING_APPLICATION_STAGED", document: "rejection" };
    case "hire":
      return { stage: "hired", status: "hired", eventKey: "HIRING_CANDIDATE_HIRED", document: null };
  }
}

export type BulkMoveValidation = { ok: true } | { ok: false; error: string };

/**
 * Pure pre-flight for a bulk stage move — the in-code mirror of the
 * `move_applications_to_stage` RPC guards. The route runs this for a fast,
 * typed rejection before the DB round-trip; the RPC re-validates authoritatively.
 *
 * @param appBusinessIds  map of applicationId -> owning business_id (null if unbound)
 * @param toStage         the requested target stage
 * @param pipelineStages  the union of valid stage names across the batch's pipelines,
 *                        keyed by applicationId
 * @param actingBusinessId the acting business; every app must belong to it
 */
export function validateBulkMove(args: {
  applicationIds: string[];
  appBusinessIds: Record<string, string | null>;
  toStage: string;
  stagesByApplication: Record<string, string[]>;
  actingBusinessId: string;
}): BulkMoveValidation {
  const { applicationIds, appBusinessIds, toStage, stagesByApplication, actingBusinessId } = args;
  const unique = Array.from(new Set(applicationIds.filter(Boolean)));
  if (unique.length === 0) return { ok: false, error: "no_applications" };
  if (!toStage || !toStage.trim()) return { ok: false, error: "no_stage" };
  for (const id of unique) {
    const biz = appBusinessIds[id];
    if (biz == null) return { ok: false, error: "unbound_pipeline" };
    if (biz !== actingBusinessId) return { ok: false, error: "cross_business" };
    const stages = stagesByApplication[id] ?? [];
    if (!stages.includes(toStage)) return { ok: false, error: "invalid_stage" };
  }
  return { ok: true };
}
