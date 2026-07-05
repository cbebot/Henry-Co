// The Free-AI Economic Guardrail — the free surfaces are a customer-acquisition cost, and that
// cost must never exceed what the AI earns. This is the policy: a daily free-AI SPEND budget (the
// owner sets it no higher than AI earnings), with graceful degradation as spend rises so the
// company both keeps attracting AND caps its loss.
//
//   allow     — under budget: serve normally.
//   conserve  — spend has crossed the conserve line: keep serving SIGNED-IN people (the funnel
//               and retention that convert), but nudge anonymous prospects to sign in or try the
//               paid deep-work. Anonymous is the biggest cost and the least-converted, so it is
//               throttled first.
//   exhausted — spend hit the ceiling: everyone is pointed warmly to the paid rail or a human, so
//               the day's free-AI loss can never exceed the budget.
//
// Pure + client-safe. The spend itself is measured server-side in provider-cost terms (see
// estimateFreeTurnCostKobo in server/quote.ts) and accumulated in a durable daily ledger.

/** Default daily free-AI spend ceiling in kobo (owner-tunable via FREE_AI_DAILY_BUDGET_KOBO). */
export const FREE_AI_DAILY_BUDGET_KOBO_DEFAULT = 500_000; // ₦5,000/day
/** Anonymous visitors start being conserved once spend crosses this share of the budget. */
export const FREE_BUDGET_CONSERVE_AT = 0.8;

export type FreeBudgetDecision = "allow" | "conserve" | "exhausted";

export interface FreeBudgetOutcome {
  decision: FreeBudgetDecision;
  /** Fraction of the budget already spent today (0..1+), for telemetry. */
  usedFraction: number;
}

/**
 * Decide whether a free turn may proceed given today's spend, the budget, and who is asking.
 * The budget is the hard loss cap: at or above it, no one gets a fresh free model call (they are
 * nudged to paid/human), so the company never loses more on free AI in a day than the budget.
 */
export function evaluateFreeBudget(input: {
  spentTodayKobo: number;
  budgetKobo: number;
  isAnonymous: boolean;
}): FreeBudgetOutcome {
  const budget = input.budgetKobo > 0 ? input.budgetKobo : FREE_AI_DAILY_BUDGET_KOBO_DEFAULT;
  const spent = Math.max(0, input.spentTodayKobo);
  const usedFraction = spent / budget;

  if (spent >= budget) return { decision: "exhausted", usedFraction };
  if (input.isAnonymous && usedFraction >= FREE_BUDGET_CONSERVE_AT) return { decision: "conserve", usedFraction };
  return { decision: "allow", usedFraction };
}

/** Read the configured daily budget from env, falling back to the default. Never returns <= 0. */
export function resolveFreeBudgetKobo(env: Record<string, string | undefined> = {}): number {
  const raw = Number(env.FREE_AI_DAILY_BUDGET_KOBO);
  return Number.isFinite(raw) && raw > 0 ? Math.round(raw) : FREE_AI_DAILY_BUDGET_KOBO_DEFAULT;
}
