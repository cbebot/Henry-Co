// ---------------------------------------------------------------------------
// V3-DIVISION-CHECKOUT-01 — the division SALE reconciler (pure contract).
//
// The proven payment rail confirms a `payment_intents` row to `succeeded` via the
// guarded `apply_payment_webhook` money function — and stops there. It deliberately
// posts ONLY the charge settlement (DR cash / CR payments_clearing) and has ZERO
// knowledge of what the money was FOR (a wallet top-up vs an order sale). The gross
// sits unallocated in the clearing account until a SECOND guarded edge moves it to
// its economic home:
//
//   - a wallet top-up  → `credit_wallet_topup`  (DR clearing / CR wallet-liability)
//   - a DIVISION ORDER → `post_sale_revenue`     (DR clearing / CR revenue + output VAT)
//
// This module is the order-sale sibling of `apps/account/lib/wallet-topup.ts`: a
// self-healing, single-winner, idempotent projection of that money truth onto the
// division's order. It mints NO money function and writes NO `payment_intents`
// status — it only READS the confirmed intent and calls the EXISTING guarded
// `post_sale_revenue` (+ ledger-tied receipt) at the settlement seam.
//
// Pure orchestration over an injected {@link DivisionSaleReconcilePort} (no
// `server-only`, no Supabase/pg imports) so every race is unit-testable. Each
// division supplies its own Supabase-backed port (marketplace first; care/studio
// adopt the SAME contract next) — the money-invariant logic lives here, ONCE.
//
// Amounts are kobo (NGN minor units) as whole integers — never float, never ×100.
// ---------------------------------------------------------------------------

/**
 * Normalised lifecycle phase of a card-sale payment attempt. Each division's port
 * maps its own domain status vocabulary onto these two phases so the pure layer
 * stays division-agnostic:
 *   - `pending`  — created, awaiting a confirmed charge (the claimable initial state)
 *   - `settling` — claimed by the single settlement winner (transient "in progress")
 * The terminal "settled" state is the port's own (it is never claimable again).
 */
export type SaleAttemptPhase = "pending" | "settling";

/** A card-sale payment attempt, projected to the fields the reconciler needs. */
export interface DivisionSaleAttempt {
  /** Stable id of the attempt row (e.g. a marketplace_payment_records.id). */
  id: string;
  /** Equals the linked payment_intent's idempotency_key (the reconcile join anchor). */
  reference: string;
  /** The order gross in minor units (kobo) — what the customer is charged. */
  grossMinor: number;
  /** Output VAT within the gross (kobo); 0 when the breakdown carries no tax line. */
  outputVatMinor: number;
  /** ISO currency of the order — must be the NGN system base to settle. */
  currency: string;
  /** Normalised phase (the port maps its domain status onto this). */
  phase: SaleAttemptPhase;
}

/** The linked payment intent, projected to the fields the reconciler needs. */
export interface DivisionSaleIntent {
  id: string;
  status: string;
  amountMinor: number;
  currency: string;
}

export type SaleDecision =
  | { action: "skip"; reason: "no_intent" | "intent_not_succeeded" }
  | { action: "settle" }
  | { action: "flag"; reason: "amount_mismatch" | "currency_mismatch" };

function normalizeCurrency(code: string): string {
  return code.trim().toUpperCase();
}

/**
 * Pure money decision: given a sale attempt and its linked intent, should we
 * settle, skip, or flag for finance? Settles ONLY when the charge is genuinely
 * confirmed (`succeeded`) AND the intent amount + currency match the order
 * exactly. Any mismatch is flagged (never silently settled) — a sale must post
 * exactly the gross the ledger recorded as received, so the receipt ties.
 */
export function decideSaleReconcile(
  attempt: DivisionSaleAttempt,
  intent: DivisionSaleIntent | null,
): SaleDecision {
  if (!intent) return { action: "skip", reason: "no_intent" };
  if (intent.status !== "succeeded") return { action: "skip", reason: "intent_not_succeeded" };
  if (intent.amountMinor !== attempt.grossMinor) return { action: "flag", reason: "amount_mismatch" };
  if (normalizeCurrency(intent.currency) !== normalizeCurrency(attempt.currency)) {
    return { action: "flag", reason: "currency_mismatch" };
  }
  return { action: "settle" };
}

/**
 * DB I/O port for the sale reconciler. The Supabase implementation lives per
 * division (marketplace: `apps/marketplace/lib/checkout/sale-reconcile-port.ts`);
 * tests inject an in-memory fake. Every status mutation is a compare-and-swap so
 * the implementation is safe under concurrency, mirroring the wallet-top-up port.
 *
 * The port writes ONLY the division's own order/payment rows. It NEVER writes
 * `payment_intents.status` (D3) and never touches the payments money functions —
 * it only READS the confirmed intent and invokes the EXISTING guarded
 * `post_sale_revenue` (+ `record_customer_receipt`) at {@link applySaleSettlement}.
 */
export interface DivisionSaleReconcilePort {
  /** Card-sale attempts for this order in the `pending` OR `settling` phase. */
  listClaimable(): Promise<DivisionSaleAttempt[]>;
  /** The payment intent whose idempotency_key equals the attempt's reference. */
  findIntentByReference(reference: string): Promise<DivisionSaleIntent | null>;
  /** CAS `pending` → `settling`. Returns true iff THIS caller won the single-winner election. */
  claim(attemptId: string): Promise<boolean>;
  /** CAS `settling` → `pending` (release a claim that could not settle, for a clean retry). */
  revertClaim(attemptId: string): Promise<void>;
  /**
   * Does the sale-revenue ledger entry already exist for this intent? Backed by
   * the guarded ledger's idempotency on (source='sale_revenue', intent id). The
   * recovery guard: a `settling` attempt whose entry exists was already settled.
   */
  saleEntryExists(intentId: string): Promise<boolean>;
  /**
   * The money edge: post the balanced sale-revenue allocation
   * (DR payments_clearing / CR platform_revenue + CR vat_output_payable) via the
   * EXISTING guarded `payments_private.post_sale_revenue`, AND mint the ledger-tied
   * receipt — both idempotent by the intent. Returns whether THIS call performed a
   * fresh settlement (`false` = it was already settled). A DB error throws so the
   * reconciler releases the claim and retries cleanly (no partial state — the
   * allocation is idempotent and balanced-by-construction in the DB).
   */
  applySaleSettlement(input: {
    attempt: DivisionSaleAttempt;
    intentId: string;
  }): Promise<{ settled: boolean }>;
  /** Mark the order + attempt paid (escrow/verified) and record the linked intent id. */
  finalizeSettled(input: { attempt: DivisionSaleAttempt; intentId: string }): Promise<void>;
  /** Optional side effects on a fresh settlement (activity feed + notification). Never blocks correctness. */
  onSettled?(input: { attempt: DivisionSaleAttempt; intentId: string }): Promise<void>;
}

export interface SaleReconcileOutcome {
  settled: Array<{ attemptId: string; intentId: string; grossMinor: number }>;
  flagged: Array<{ attemptId: string; reason: string }>;
  skipped: number;
}

/**
 * Reconcile every claimable card-sale attempt for an order. Idempotent and safe to
 * call on every order-status load (reconcile-on-read): a confirmed charge settles
 * exactly once; an unconfirmed one is left to self-heal on a later pass. The money
 * truth was already recorded by the webhook → the order completes whenever it is
 * next viewed, so a buyer who closes the tab is never stranded.
 */
export async function reconcileDivisionSale(
  port: DivisionSaleReconcilePort,
): Promise<SaleReconcileOutcome> {
  const outcome: SaleReconcileOutcome = { settled: [], flagged: [], skipped: 0 };

  const claimable = await port.listClaimable();
  for (const attempt of claimable) {
    const intent = await port.findIntentByReference(attempt.reference);

    // Recovery: a prior winner claimed this attempt but did not finish. Because the
    // settlement (sale-revenue post + receipt) is idempotent in the DB, it can never
    // have half-posted — so finalize when the sale-revenue entry is present,
    // otherwise release the claim for a clean retry. Never double-settles.
    if (attempt.phase === "settling") {
      if (intent && (await port.saleEntryExists(intent.id))) {
        await port.finalizeSettled({ attempt, intentId: intent.id });
      } else {
        await port.revertClaim(attempt.id);
      }
      continue;
    }

    const decision = decideSaleReconcile(attempt, intent);
    if (decision.action === "skip") {
      outcome.skipped += 1;
      continue;
    }
    if (decision.action === "flag") {
      outcome.flagged.push({ attemptId: attempt.id, reason: decision.reason });
      continue;
    }

    // decision.action === "settle" — intent is guaranteed succeeded + matching here.
    const confirmedIntent = intent as DivisionSaleIntent;

    // Single-winner election. The loser of the CAS does nothing.
    const won = await port.claim(attempt.id);
    if (!won) continue;

    // Defensive: if the sale-revenue entry somehow already exists, finalize without re-posting.
    if (await port.saleEntryExists(confirmedIntent.id)) {
      await port.finalizeSettled({ attempt, intentId: confirmedIntent.id });
      continue;
    }

    // The money edge: clearing→revenue allocation + ledger-tied receipt, idempotent
    // by the intent. A failure leaves NO partial state — release the claim so a later
    // pass retries cleanly as a fresh single winner.
    let result: { settled: boolean };
    try {
      result = await port.applySaleSettlement({ attempt, intentId: confirmedIntent.id });
    } catch {
      await port.revertClaim(attempt.id);
      continue;
    }

    await port.finalizeSettled({ attempt, intentId: confirmedIntent.id });

    // Only a FRESH settlement (not an idempotent no-op) fires side effects + is reported.
    if (result.settled) {
      if (port.onSettled) {
        await port.onSettled({ attempt, intentId: confirmedIntent.id });
      }
      outcome.settled.push({
        attemptId: attempt.id,
        intentId: confirmedIntent.id,
        grossMinor: attempt.grossMinor,
      });
    }
  }

  return outcome;
}
