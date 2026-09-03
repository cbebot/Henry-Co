/**
 * V3-41 — the internal spend guard for PLATFORM-INVOKED predictive AI.
 *
 * V3-41's core is statistical and costs nothing. The only path that can reach a
 * provider is the OPTIONAL staff-narrative slice, and this is its gate.
 *
 * Three absolutes, enforced here rather than trusted to a caller:
 *
 *   1. RESERVE BEFORE RUN. The estimate is added to the durable daily counter
 *      FIRST; only the returned post-increment total decides whether the call may
 *      proceed. The V3-43 `internal_ai_spend_add` RPC is an atomic upsert that
 *      serializes concurrent adds on the row lock, so two racing runs read two
 *      DIFFERENT totals and at most one can conclude there was room. A
 *      check-then-act guard (read total, compare, then run) cannot make that
 *      claim — both runs would see the same pre-spend total and both would run.
 *   2. DEGRADE CLOSED. An unreachable/unmigrated ledger REFUSES the call. The
 *      deterministic forecast is the product, so losing the narrative costs
 *      nothing; losing the ceiling could burn unbounded provider spend.
 *   3. NEVER A WALLET. This counter is company COGS on the ONE unified ledger
 *      (`internal_ai_spend_ledger`, V3-43 / PR #527) under its own budget_key.
 *      No new counter, and no contact with the isolated money schema, its guarded
 *      RPCs, or any customer balance.
 *
 * Naming note: V3-40 ships a sibling guard at `src/risk/budget.ts`. These names
 * are deliberately distinct so both barrels can export into `@henryco/intelligence`
 * without collision if PR #533 lands. Converging them onto one shared helper is a
 * follow-up once both are on main (see the pass report).
 */

/** The injected ledger port. The engine performs no I/O of its own. */
export interface PredictiveSpendLedger {
  /** Atomically add kobo to today's internal AI spend and return the NEW total. */
  add(kobo: number): Promise<number>;
}

export type PredictiveSpendRefusal = "disabled" | "ceiling" | "ledger_unavailable";

export type PredictiveSpendReservation =
  | { allowed: true; totalAfterKobo: number }
  | { allowed: false; reason: PredictiveSpendRefusal };

export interface ReservePredictiveAiSpendInput {
  ledger: PredictiveSpendLedger;
  /** Upper-bound provider cost of the single call about to run (kobo). */
  estimateKobo: number;
  /** Today's hard ceiling for platform-invoked predictive spend (kobo). <= 0 disables. */
  ceilingKobo: number;
}

/** The `internal_ai_spend_ledger` budget_key V3-41 spends under. Distinct from
 *  V3-40's `risk_predictive` so the two ceilings are independently tunable. */
export const PREDICTIVE_SPEND_BUDGET_KEY = "predictive_ops";

/** E-D1-A default: NGN 1,000/day, owner-tunable via PREDICTIVE_AI_DAILY_BUDGET_KOBO. */
export const PREDICTIVE_AI_DAILY_BUDGET_KOBO_DEFAULT = 100_000;

export function resolvePredictiveBudgetKobo(env: Record<string, string | undefined> = {}): number {
  const raw = Number(env.PREDICTIVE_AI_DAILY_BUDGET_KOBO);
  return Number.isFinite(raw) && raw > 0
    ? Math.round(raw)
    : PREDICTIVE_AI_DAILY_BUDGET_KOBO_DEFAULT;
}

/**
 * Reserve headroom for exactly one platform-invoked call.
 *
 * There is no settle/refund path ON PURPOSE: the reserved ESTIMATE is the
 * durable record. The ledger RPC clamps negative deltas, so a refund is
 * impossible by construction — and over-counting is the only direction a
 * spend ceiling may ever err in.
 */
export async function reservePredictiveAiSpend(
  input: ReservePredictiveAiSpendInput,
): Promise<PredictiveSpendReservation> {
  const estimate = Math.ceil(input.estimateKobo);
  const ceiling = Math.floor(input.ceilingKobo);

  if (!Number.isFinite(estimate) || estimate <= 0 || !Number.isFinite(ceiling) || ceiling <= 0) {
    // Nothing to reserve, or spending is switched off — never touch the ledger.
    return { allowed: false, reason: "disabled" };
  }

  let totalAfterKobo: number;
  try {
    totalAfterKobo = await input.ledger.add(estimate);
  } catch {
    return { allowed: false, reason: "ledger_unavailable" };
  }
  if (!Number.isFinite(totalAfterKobo)) {
    return { allowed: false, reason: "ledger_unavailable" };
  }
  if (totalAfterKobo > ceiling) {
    // The reservation stays counted — conservative by design. Do NOT run the call.
    return { allowed: false, reason: "ceiling" };
  }
  return { allowed: true, totalAfterKobo };
}
