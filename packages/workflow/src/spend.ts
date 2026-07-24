/**
 * The ONE internal-AI-spend primitive (V3-43 consolidation). Generalizes the
 * two shipped durable counters — the customer free-AI `ai_free_spend_ledger`
 * (applied) and SA-4's `ai_operator_spend_ledger` (migration UNAPPLIED) — into
 * one keyed table `internal_ai_spend_ledger (budget_key, window_day, spent_kobo)`.
 * (Studio's `dailyAgencySpendKobo` is a DERIVED sum over studio_build_jobs, not
 * a durable counter — it stays derived; only the two durable ledgers collapse.)
 *
 * Enforces, OUTSIDE the model, the three properties the platform-invoked AI
 * money rules require (MONEY-MODEL §5 / SA-4 precedent):
 *   - RESERVE-BEFORE-RUN: a caller reserves its upper-bound estimate into
 *     `committedKobo` BEFORE dispatch, so N calls in one tick can't each read a
 *     stale baseline; `evaluateBudget` projects spent+committed+next.
 *   - DEGRADE-CLOSED: a null `spentTodayKobo` (ledger unreadable) ⇒ exhausted
 *     (the deliberate inversion of the customer free-budget's degrade-OPEN).
 *   - SINGLE-FLIGHT: correctness holds ACROSS ticks only under the workflow
 *     lock (spend.ts is only sound when the caller holds acquireWorkflowLock).
 *
 * NON-BILLABLE by construction — this counter is company COGS, never a customer
 * wallet; nothing here touches payments_private or the money RPCs.
 */

/** The durable keyed-ledger seam. `spentToday` returns null when the read FAILS
 *  (so the caller degrades CLOSED); 0 means "no spend today". */
export interface SpendStore {
  spentToday(input: { budgetKey: string; now: Date }): Promise<number | null>;
  /** Atomic increment (clamped ≥0); returns the new running total, or null on failure. */
  add(input: { budgetKey: string; addKobo: number; now: Date }): Promise<number | null>;
}

export type SpendDecision = "allow" | "exhausted";

/** Canonical budget keys — one per internal-spend consumer. */
export const BUDGET_KEYS = {
  freeAi: "free_ai", // the customer free-support brain (reserved; today ai_free_spend_ledger)
  operator: "operator", // the Owner-AI operator (SA-4)
  automation: "automation", // Phase F workflow steps (V3-44 triage, V3-46 narrative)
} as const;

export const DEFAULT_DAILY_CEILING_KOBO = 500_000; // ₦5,000/day (the shipped free-budget default)

export function resolveCeilingKobo(raw: string | undefined, fallback = DEFAULT_DAILY_CEILING_KOBO): number {
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : fallback;
}

/**
 * May one more model call (upper-bound `nextEstimateKobo`) run, given today's
 * durable spend + what THIS tick already reserved? At/over the ceiling, or a
 * broken ledger read (null), ⇒ exhausted. Pure.
 */
export function evaluateBudget(input: {
  spentTodayKobo: number | null;
  committedKobo: number;
  nextEstimateKobo: number;
  ceilingKobo: number;
}): SpendDecision {
  if (input.spentTodayKobo === null) return "exhausted"; // degrade CLOSED
  const ceiling = input.ceilingKobo > 0 ? input.ceilingKobo : DEFAULT_DAILY_CEILING_KOBO;
  const projected =
    Math.max(0, input.spentTodayKobo) + Math.max(0, input.committedKobo) + Math.max(0, input.nextEstimateKobo);
  return projected > ceiling ? "exhausted" : "allow";
}

/** In-memory keyed ledger — same atomic-increment/clamp semantics as the RPCs. */
export class InMemorySpendStore implements SpendStore {
  private rows = new Map<string, number>();
  private failReads = false;

  breakReads(on = true): void {
    this.failReads = on;
  }

  private dayKey(budgetKey: string, now: Date): string {
    return `${budgetKey}:${now.toISOString().slice(0, 10)}`;
  }

  async spentToday(input: { budgetKey: string; now: Date }): Promise<number | null> {
    if (this.failReads) return null;
    return this.rows.get(this.dayKey(input.budgetKey, input.now)) ?? 0;
  }

  async add(input: { budgetKey: string; addKobo: number; now: Date }): Promise<number | null> {
    const key = this.dayKey(input.budgetKey, input.now);
    const next = (this.rows.get(key) ?? 0) + Math.max(0, Math.floor(input.addKobo));
    this.rows.set(key, next);
    return next;
  }
}
