/**
 * V3-15-JOB-B — wallet top-up credit reconciler.
 *
 * The proven payment rail (apps/account/app/api/payments/*) confirms a
 * `payment_intents` row to `succeeded` via the guarded `apply_payment_webhook`
 * money function — and stops there. It deliberately does NOT credit any wallet
 * (it is generic across every division), and this pass must not touch those
 * money functions, migrations, grants, the HMAC verify, or the state machine.
 *
 * So the wallet credit is a SEPARATE, self-healing projection of that money
 * truth, anchored on the existing `customer_wallet_funding_requests` primitive
 * (the same table the bank-transfer-proof fallback uses):
 *
 *   - One client UUID is BOTH the payment_intent `idempotency_key`
 *     (A1: UNIQUE(user_id, idempotency_key)) AND the funding request's
 *     `payment_reference` (globally UNIQUE). A double-submit therefore yields
 *     exactly one intent AND one funding request.
 *   - This reconciler joins them (`payment_intents.idempotency_key =
 *     customer_wallet_funding_requests.payment_reference`); when the intent is
 *     `succeeded`, a compare-and-swap on the funding-request status
 *     (`pending_verification` → `processing_credit`) elects a SINGLE winner that
 *     performs the credit. The credit is therefore impossible to apply twice.
 *
 * Crash safety (no new DB constraint needed):
 *   - The credit happens ONLY inside the claim winner. A row stuck in
 *     `processing_credit` is recovered without ever re-crediting — it is
 *     finalized (if the ledger row exists) or reverted to `pending_verification`
 *     (if it does not), so a fresh single winner can retry.
 *
 * This module is pure orchestration over an injected {@link WalletTopupReconcilePort}
 * (no `server-only`, no Supabase imports) so every race is unit-testable. The
 * Supabase-backed port lives in `./wallet-topup-port` (server-only).
 */

export const RAIL_TOPUP_METHODS = ["card", "bank_transfer", "ussd"] as const;
export type RailTopupMethod = (typeof RAIL_TOPUP_METHODS)[number];

/**
 * The single shared wallet-funding floor (kobo). Both the instant card/bank/USSD
 * rail (`/api/wallet/topup/init`) and the legacy bank-transfer flow
 * (`/api/wallet/fund`) validate against THIS one value, so the minimum can never
 * drift between surfaces. NGN 100 = 10,000 kobo.
 */
export const WALLET_FUNDING_MIN_KOBO = 10_000;

/** The funding floor in major units (naira), derived from the kobo floor — for copy. */
export const WALLET_FUNDING_MIN_NAIRA = WALLET_FUNDING_MIN_KOBO / 100;

/**
 * There is NO fixed maximum top-up amount (owner decision, 2026-06). The
 * guardrails against an absurd charge are the sensitive-action reauth (R1,
 * enforced by the payment rail before any money moves) plus the payment
 * provider's own per-transaction limits — deliberately NOT a hardcoded ceiling.
 * Amount validation therefore keeps only: a positive, safe integer at or above
 * the {@link WALLET_FUNDING_MIN_KOBO} floor.
 */
export type FundingAmountError = "not_integer" | "below_min";

export function validateFundingAmountKobo(amountKobo: number): FundingAmountError | null {
  if (!Number.isSafeInteger(amountKobo) || amountKobo <= 0) return "not_integer";
  if (amountKobo < WALLET_FUNDING_MIN_KOBO) return "below_min";
  return null; // no upper bound — see the note above
}

/** Funding-request status lifecycle for a rail top-up. */
export const TOPUP_FUNDING_STATUS = {
  /** Created, awaiting a confirmed charge (shared initial state with the manual flow). */
  pending: "pending_verification",
  /** Claimed by the single credit winner — transient, means "crediting in progress". */
  crediting: "processing_credit",
  /** Credited: wallet balance moved and the ledger row written. */
  verified: "verified",
} as const;

/** Ledger `reference_type` for a rail top-up credit (idempotency anchor in the ledger). */
export const TOPUP_LEDGER_REFERENCE_TYPE = "wallet_topup";

/** A rail top-up funding request, projected to the fields the reconciler needs. */
export interface TopupRequest {
  id: string;
  amountKobo: number;
  currency: string;
  /** Equals the linked payment_intent's idempotency_key. */
  paymentReference: string;
  status: string;
  /** True only for the instant card/bank/USSD rail — never the manual proof flow. */
  railTopup: boolean;
}

/** The linked payment intent, projected to the fields the reconciler needs. */
export interface IntentRow {
  id: string;
  status: string;
  amountMinor: number;
  currency: string;
}

export type TopupDecision =
  | {
      action: "skip";
      reason: "not_rail" | "no_intent" | "intent_not_succeeded";
    }
  | { action: "credit" }
  | { action: "flag"; reason: "amount_mismatch" | "currency_mismatch" };

function normalizeCurrency(code: string): string {
  return code.trim().toUpperCase();
}

/**
 * Pure money decision: given a funding request and its linked intent, should we
 * credit, skip, or flag for finance? Credits ONLY when the charge is genuinely
 * confirmed (`succeeded`) AND the amount + currency match the request exactly.
 * Any mismatch is flagged (never silently credited) — money invariants are absolute.
 */
export function decideTopupReconcile(request: TopupRequest, intent: IntentRow | null): TopupDecision {
  if (!request.railTopup) return { action: "skip", reason: "not_rail" };
  if (!intent) return { action: "skip", reason: "no_intent" };
  if (intent.status !== "succeeded") return { action: "skip", reason: "intent_not_succeeded" };
  if (intent.amountMinor !== request.amountKobo) return { action: "flag", reason: "amount_mismatch" };
  if (normalizeCurrency(intent.currency) !== normalizeCurrency(request.currency)) {
    return { action: "flag", reason: "currency_mismatch" };
  }
  return { action: "credit" };
}

/**
 * DB I/O port for the reconciler. The Supabase admin-client implementation lives
 * in `./wallet-topup-port`; tests inject an in-memory fake. Every status mutation
 * is a compare-and-swap so the implementation can be safe under concurrency.
 */
export interface WalletTopupReconcilePort {
  /** Rail top-up requests in `pending_verification` OR `processing_credit` for this user. */
  listClaimable(userId: string): Promise<TopupRequest[]>;
  /** The payment intent whose idempotency_key equals the funding request's payment_reference. */
  findIntentByReference(userId: string, paymentReference: string): Promise<IntentRow | null>;
  /** CAS `pending_verification` → `processing_credit`. Returns true iff THIS caller won. */
  claim(requestId: string): Promise<boolean>;
  /** CAS `processing_credit` → `pending_verification` (release a claim that could not credit). */
  revertClaim(requestId: string): Promise<void>;
  /** Does a credit (wallet_transactions) row already exist for this request? (idempotency guard) */
  ledgerExists(requestId: string): Promise<boolean>;
  /**
   * Atomically credit the wallet balance, write the wallet-transactions log row,
   * AND post the balanced double-entry journal — all in ONE database transaction,
   * idempotent by the funding request (V3-17: backed by
   * `payments_private.credit_wallet_topup`). Returns the new balance and whether
   * THIS call performed the credit (`false` = it was already credited). Because
   * the balance move and the ledger row are one transaction, the wallet balance
   * reconciles to the ledger by construction and there is no crash window in which
   * the balance moves without its ledger record.
   */
  applyTopupCredit(input: {
    userId: string;
    requestId: string;
    intentId: string;
    amountKobo: number;
    currency: string;
  }): Promise<{ credited: boolean; balanceAfterKobo: number }>;
  /** Mark the request `verified` (credited) and record the linked intent id. */
  finalizeVerified(requestId: string, intentId: string | null): Promise<void>;
  /** Optional side effects on a fresh credit (activity feed + notification). Never blocks correctness. */
  onCredited?(input: { request: TopupRequest; intentId: string; balanceAfterKobo: number }): Promise<void>;
}

export interface ReconcileOutcome {
  credited: Array<{ requestId: string; intentId: string; amountKobo: number; balanceAfterKobo: number }>;
  flagged: Array<{ requestId: string; reason: string }>;
  skipped: number;
}

/**
 * Reconcile every claimable rail top-up for a user. Idempotent and safe to call
 * on every wallet load: a confirmed charge is credited exactly once; an
 * unconfirmed one is left to self-heal on a later pass.
 */
export async function reconcileWalletTopups(
  userId: string,
  port: WalletTopupReconcilePort,
): Promise<ReconcileOutcome> {
  const outcome: ReconcileOutcome = { credited: [], flagged: [], skipped: 0 };

  const claimable = await port.listClaimable(userId);
  for (const request of claimable) {
    const intent = await port.findIntentByReference(userId, request.paymentReference);

    // Recovery: a prior winner claimed this row but did not finish. Because the
    // credit is atomic (balance + ledger together) it can never have moved the
    // balance without its ledger row — so finalize when the ledger row is present,
    // otherwise release the claim for a clean retry. Never re-credits.
    if (request.status === TOPUP_FUNDING_STATUS.crediting) {
      if (await port.ledgerExists(request.id)) {
        await port.finalizeVerified(request.id, intent?.id ?? null);
      } else {
        await port.revertClaim(request.id);
      }
      continue;
    }

    const decision = decideTopupReconcile(request, intent);
    if (decision.action === "skip") {
      outcome.skipped += 1;
      continue;
    }
    if (decision.action === "flag") {
      outcome.flagged.push({ requestId: request.id, reason: decision.reason });
      continue;
    }

    // decision.action === "credit" — intent is guaranteed succeeded + matching here.
    const confirmedIntent = intent as IntentRow;

    // Single-winner election. The loser of the CAS does nothing.
    const won = await port.claim(request.id);
    if (!won) continue;

    // Defensive: if a credit row somehow already exists, finalize without re-crediting.
    if (await port.ledgerExists(request.id)) {
      await port.finalizeVerified(request.id, confirmedIntent.id);
      continue;
    }

    // The money edge: balance + wallet log + double-entry journal in ONE atomic,
    // idempotent transaction. A failure leaves NO partial state — release the claim
    // so a later pass retries cleanly as a fresh single winner.
    let result: { credited: boolean; balanceAfterKobo: number };
    try {
      result = await port.applyTopupCredit({
        userId,
        requestId: request.id,
        intentId: confirmedIntent.id,
        amountKobo: request.amountKobo,
        currency: request.currency,
      });
    } catch {
      await port.revertClaim(request.id);
      continue;
    }

    await port.finalizeVerified(request.id, confirmedIntent.id);

    // Only a FRESH credit (not an idempotent no-op) fires side effects + is reported.
    if (result.credited) {
      if (port.onCredited) {
        await port.onCredited({ request, intentId: confirmedIntent.id, balanceAfterKobo: result.balanceAfterKobo });
      }
      outcome.credited.push({
        requestId: request.id,
        intentId: confirmedIntent.id,
        amountKobo: request.amountKobo,
        balanceAfterKobo: result.balanceAfterKobo,
      });
    }
  }

  return outcome;
}
