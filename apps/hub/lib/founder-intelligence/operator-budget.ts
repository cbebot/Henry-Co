/**
 * SA-4 — PURE operator internal-spend policy (MONEY-MODEL §5). No server
 * imports, so the invariant tests assert this directly.
 *
 * The Owner-AI operator's model turns are NON-BILLABLE company spend, capped at
 * ₦5,000/day by default (the shipped free-budget order of magnitude), enforced
 * OUTSIDE the model at the tick:
 *
 *   - the durable counter is public.internal_ai_spend_ledger under budget_key
 *     'operator' (V3-43 — the ONE consolidated internal-spend ledger; the
 *     customer free-spend counter is a SEPARATE key on the same table, never
 *     co-mingled);
 *   - the tick is single-flight (workflow_locks key 'hub.operator.tick'), so the
 *     start-of-tick spend read is always fresh relative to peer crons (the SA-3
 *     lesson: two concurrent ticks must not each spend a full ceiling);
 *   - WITHIN a tick, every model call reserves its UPPER-BOUND estimate into
 *     `committedKobo` BEFORE the call (reserve-then-run — never the free-chat
 *     route's post-pay shape, which is only safe for single-turn fan-out-free
 *     requests);
 *   - a broken ledger degrades CLOSED (no AI calls), the deliberate inversion
 *     of the customer free-budget's degrade-OPEN — the operator is unattended.
 */

/** Default daily operator AI spend ceiling in kobo (₦5,000/day — SA-D2). */
export const OPERATOR_AI_DAILY_BUDGET_KOBO_DEFAULT = 500_000;

/** Single-flight lock TTL. MUST exceed the operator route's maxDuration (60s)
 *  so the platform kills an overrunning tick BEFORE its lock expires. */
export const OPERATOR_TICK_LOCK_TTL_SECONDS = 90;

/** Read the configured ceiling from env; garbage/absent never disables the cap. */
export function resolveOperatorBudgetKobo(env: Record<string, string | undefined> = {}): number {
  const raw = Number(env.OPERATOR_AI_DAILY_BUDGET_KOBO);
  return Number.isFinite(raw) && raw > 0 ? Math.round(raw) : OPERATOR_AI_DAILY_BUDGET_KOBO_DEFAULT;
}

export type OperatorBudgetDecision = "allow" | "exhausted";

/**
 * May ONE MORE model call (of `nextEstimateKobo` upper-bound cost) run, given
 * today's durable spend + what THIS tick has already reserved? At/over the
 * ceiling ⇒ exhausted. A null `spentTodayKobo` means the ledger read failed —
 * degrade CLOSED.
 */
export function evaluateOperatorBudget(input: {
  spentTodayKobo: number | null;
  committedKobo: number;
  nextEstimateKobo: number;
  budgetKobo: number;
}): OperatorBudgetDecision {
  if (input.spentTodayKobo === null) return "exhausted"; // ledger broken → closed
  const budget = input.budgetKobo > 0 ? input.budgetKobo : OPERATOR_AI_DAILY_BUDGET_KOBO_DEFAULT;
  const projected =
    Math.max(0, input.spentTodayKobo) + Math.max(0, input.committedKobo) + Math.max(0, input.nextEstimateKobo);
  return projected > budget ? "exhausted" : "allow";
}
