// V3-40 — risk predictive AI spend configuration (pure, testable; no server-only).
//
// Risk rides its OWN budget_key on V3-43's unified internal_ai_spend_ledger — isolated
// from the customer free-chat 'free_ai' key so a busy chat day can never starve fraud
// scoring and vice versa. This is the unified primitive (one table, per-consumer key),
// NOT a new counter (E-D1-A: a dedicated per-day counter + ceiling on the one ledger).

export const RISK_SPEND_BUDGET_KEY = "risk_predictive";

/** E-D1-A default: start at ₦2,000/day (owner-tunable via RISK_AI_DAILY_BUDGET_KOBO). */
export const RISK_AI_DAILY_BUDGET_KOBO_DEFAULT = 200_000;

/**
 * Resolve the daily risk-AI ceiling from env. Garbage/negative/zero/absent/Infinity all
 * fall back to the default — the cap can only be RAISED by an explicit finite positive
 * number, never disabled to unbounded and never zeroed (which would silently stop scoring).
 */
export function resolveRiskBudgetKobo(env: Record<string, string | undefined> = {}): number {
  const raw = Number(env.RISK_AI_DAILY_BUDGET_KOBO);
  return Number.isFinite(raw) && raw > 0 ? Math.round(raw) : RISK_AI_DAILY_BUDGET_KOBO_DEFAULT;
}
