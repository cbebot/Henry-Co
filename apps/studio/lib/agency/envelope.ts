/**
 * SA-2 — the per-job cost envelope (MONEY-MODEL §3). PURE integer-kobo math.
 *
 * Mode A (the default, SA-2's only mode): the client pays a fixed package
 * price; the job's INTERNAL provider-cost ceiling is a fraction of it. The
 * envelope is the company's discipline, never the client's bill — a job that
 * threatens it STOPS and escalates; the client price never moves.
 *
 * Every figure is BIGINT kobo per the Prime Directive. The 20% fraction and
 * the floor/ceiling are seeded here to match the governed
 * `studio-build-rate-card-v1` rule-book row; the row is the live-tunable
 * truth, this module is the in-code mirror kept in lockstep (the same
 * discipline `defaultAiUsageRules()` documents).
 */

/** Package price → envelope fraction. */
export const DEFAULT_ENVELOPE_FRACTION = 0.2;
/** ₦10,000 floor — no job is starved below a usable budget. */
export const ENVELOPE_FLOOR_KOBO = 1_000_000;
/** ₦100,000 ceiling — no single job can run away, whatever the package price. */
export const ENVELOPE_CEILING_KOBO = 10_000_000;

export type EnvelopeRuleBook = {
  fraction: number;
  floorKobo: number;
  ceilingKobo: number;
};

export const DEFAULT_ENVELOPE_RULES: EnvelopeRuleBook = {
  fraction: DEFAULT_ENVELOPE_FRACTION,
  floorKobo: ENVELOPE_FLOOR_KOBO,
  ceilingKobo: ENVELOPE_CEILING_KOBO,
};

function toInt(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}

/**
 * Size a job's `budget_kobo` from the package price (major-unit naira, the
 * studio table convention). Clamped to [floor, ceiling]. A non-positive or
 * unusable price falls back to the floor — a job is never sized at zero (which
 * would make the harness kill instantly).
 */
export function computeJobEnvelopeKobo(
  packagePriceMajorNaira: number,
  rules: EnvelopeRuleBook = DEFAULT_ENVELOPE_RULES,
): number {
  const floor = Math.max(0, toInt(rules.floorKobo, ENVELOPE_FLOOR_KOBO));
  const ceiling = Math.max(floor, toInt(rules.ceilingKobo, ENVELOPE_CEILING_KOBO));
  const price = Number(packagePriceMajorNaira);
  if (!Number.isFinite(price) || price <= 0) return floor;
  const priceKobo = Math.round(price * 100);
  const raw = Math.round(priceKobo * (Number.isFinite(rules.fraction) ? rules.fraction : DEFAULT_ENVELOPE_FRACTION));
  return Math.min(ceiling, Math.max(floor, raw));
}

export type EnvelopeState = {
  budgetKobo: number;
  costKobo: number;
};

/**
 * Has the job spent up to (or past) its envelope? The tick treats `true` as a
 * stall trigger — belt and braces BEHIND the harness kill, so a breach that
 * the in-sandbox harness somehow missed still cannot silently overspend. This
 * enforcement lives OUTSIDE the model by construction: it reads accrued cost,
 * it does not trust the agent.
 */
export function isEnvelopeBreached(state: EnvelopeState): boolean {
  return toInt(state.costKobo) >= toInt(state.budgetKobo);
}

/** Kobo of headroom remaining (never negative) — what a retry re-arms under. */
export function remainingEnvelopeKobo(state: EnvelopeState): number {
  return Math.max(0, toInt(state.budgetKobo) - toInt(state.costKobo));
}

/**
 * Accrue a heartbeat/report cost delta onto the running total, and report
 * whether that push crossed the ceiling. Deltas below zero are ignored (a
 * replayed or corrupt heartbeat can never REDUCE accrued spend).
 */
export function accrueCost(
  state: EnvelopeState,
  addKobo: number,
): { costKobo: number; breached: boolean } {
  const delta = Math.max(0, toInt(addKobo));
  const costKobo = toInt(state.costKobo) + delta;
  return { costKobo, breached: costKobo >= toInt(state.budgetKobo) };
}

/**
 * Translate the envelope into the harness caps carried in the spec. Wall-clock
 * and call ceilings are conservative defaults; the kobo cap is the real
 * governor. All enforced by the harness OUTSIDE the model.
 */
export function harnessCapsForEnvelope(budgetKobo: number): {
  maxProviderCostKobo: number;
  maxWallClockMinutes: number;
  maxModelCalls: number;
} {
  return {
    maxProviderCostKobo: Math.max(0, toInt(budgetKobo)),
    maxWallClockMinutes: 45,
    maxModelCalls: 200,
  };
}
