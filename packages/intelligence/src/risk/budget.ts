// V3-40 — the platform-invoked AI spend guard: reserve-before-run, degrade-CLOSED.
//
// Predictive scoring is PLATFORM-invoked — the customer never asked, so there is nothing
// to bill them for (E-D1). Its provider cost is company COGS, bounded by V3-43's ONE unified
// `internal_ai_spend_ledger` under a DEDICATED `risk_predictive` budget_key (a per-day
// counter ROW on the one primitive, its own ceiling — isolated from the customer free-chat
// `free_ai` key). This module is the injected-ledger DISCIPLINE, agnostic to which key the
// caller (apps/hub/lib/risk/assist.ts) wires in; no new counter table is created:
//
//   * RESERVE BEFORE RUN — the estimate is added to the ledger BEFORE the provider call.
//     The atomic post-increment total is the decision input, so two concurrent runs can
//     never each conclude "there was room": whichever increment lands second sees the
//     first one included. At worst the counter overcounts (a refused run's reservation
//     stays burned) — the fail-safe direction; it resets at midnight.
//   * DEGRADE CLOSED — a ledger error, a missing table, a zero ceiling: every abnormal
//     path refuses the AI call. Nothing is lost: the deterministic floor never needed the
//     model. (Contrast the customer-facing free-chat guard, which degrades OPEN — help
//     the human — by design. Platform work earns no such grace.)

export interface PlatformSpendLedger {
  /** Atomically add kobo to today's internal AI spend and return the NEW total. */
  add(kobo: number): Promise<number>;
}

export type PlatformSpendRefusal = "disabled" | "ceiling" | "ledger_unavailable";

export type PlatformSpendReservation =
  | { allowed: true; totalAfterKobo: number }
  | { allowed: false; reason: PlatformSpendRefusal };

export interface ReservePlatformAiSpendInput {
  ledger: PlatformSpendLedger;
  /** Upper-bound provider cost of the single call about to run (kobo). */
  estimateKobo: number;
  /** Today's hard ceiling for platform-invoked AI spend (kobo). <= 0 disables. */
  ceilingKobo: number;
}

export async function reservePlatformAiSpend(
  input: ReservePlatformAiSpendInput,
): Promise<PlatformSpendReservation> {
  const estimate = Math.ceil(input.estimateKobo);
  const ceiling = Math.floor(input.ceilingKobo);
  if (!Number.isFinite(estimate) || estimate <= 0 || !Number.isFinite(ceiling) || ceiling <= 0) {
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
    // The reservation stays counted — conservative by design. Do not run the call.
    return { allowed: false, reason: "ceiling" };
  }
  return { allowed: true, totalAfterKobo };
}
// No settle/refund path on purpose: the reserved ESTIMATE is the durable record (the
// SA-4 operator precedent) — the ledger RPC clamps negative deltas, so a refund is
// impossible by construction and under-counting is the one direction this guard must
// never move in.
