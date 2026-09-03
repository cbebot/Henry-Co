import type {
  Result,
  PaymentProviderKey,
  PaymentMethod,
  ISO3166Alpha2,
  ISO4217,
} from "../types";
import type { ProviderError } from "../errors";

export interface InitiatePaymentParams {
  intentId: string;
  amountMinor: number;
  currency: ISO4217;
  country: ISO3166Alpha2;
  method: PaymentMethod;
  idempotencyKey: string;
  /**
   * Authenticated buyer's email. Real providers (Paystack `transaction/initialize`)
   * require a customer identifier; the route threads it from the session. Adapters
   * that don't need it (the mock) ignore it. Never returned to the client.
   */
  customerEmail?: string;
}

export interface InitiatePaymentResult {
  /** Provider-side handle for this charge. Persisted server-side; never sent to the client raw. */
  providerReference: string;
  /**
   * What the client must do next to complete the charge. Opaque and
   * provider-agnostic by construction — a redirect URL or an SDK token, or
   * `none` when no client step is needed. Carries NO provider identity.
   */
  clientAction:
    | { type: "redirect"; url: string }
    | { type: "sdk"; token: string }
    | { type: "none" };
}

export interface RefundParams {
  providerReference: string;
  amountMinor: number;
  reason?: string | null;
}

export interface RefundResult {
  refundReference: string;
}

/** V3-19 — list a transaction's refunds at the provider (adopt-don't-redrive). */
export interface ListRefundsParams {
  providerReference: string;
}

export interface ProviderRefundSummary {
  /** The provider's refund id (matches {@link RefundResult.refundReference}). */
  refundReference: string;
  /** Refunded amount in minor units, when the provider reports it. */
  amountMinor: number | null;
  /** Provider-side refund status, verbatim (e.g. pending/processing/processed/failed). */
  status: string;
}

export interface VerifyWebhookParams {
  rawBody: string;
  signature: string | null;
  secret: string;
}

export interface VerifiedWebhook {
  providerEventId: string;
  eventType: string;
  providerReference: string;
  /** The terminal status this event implies, or null for informational events. */
  impliedStatus: "succeeded" | "failed" | "refunded" | null;
  /**
   * V3-VAT-01 — the REAL total processor fee deducted at settlement (kobo,
   * VAT-inclusive), when the provider reports it. Often absent on the async
   * charge.success webhook (Paystack frequently sends `fees: null` there) — the
   * authoritative source is {@link FinalizeResult.feeMinor} from the verify call.
   * Never assumed: undefined means "not reported", and the settlement degrades to
   * gross-to-cash rather than fabricate a fee.
   */
  feeMinor?: number;
  /**
   * The VAT portion within {@link feeMinor}, when the provider breaks it out
   * (e.g. a `fees_breakdown` VAT line). Usually undefined — the ledger then derives
   * it by statutory decomposition of the VAT-inclusive fee.
   */
  feeVatMinor?: number;
  /**
   * V3-19 — set for provider refund OUTCOME events (refund.processed /
   * refund.failed). Refund money truth flows through `apply_refund_webhook`
   * (which resolves the intent's single in-flight refund row), NOT through
   * {@link impliedStatus}: the provider's refund webhooks carry no refund id, and
   * a PARTIAL refund's terminal intent status (succeeded vs refunded) depends on
   * cumulative amounts only the DB knows. When set, impliedStatus is null.
   */
  refundEvent?: {
    outcome: "processed" | "failed";
    /**
     * Refunded amount in minor units when the payload reports it (Paystack sends
     * a STRING here — parsed strictly; malformed → null, the DB then matches by
     * the in-flight row alone).
     */
    amountMinor: number | null;
    /** The provider's settlement-side refund reference, when present. */
    refundReference: string | null;
  };
  /**
   * V3-MONEY-PAYOUT — set for OUTBOUND transfer (payout) OUTCOME events
   * (transfer.completed / transfer.failed). Payout money truth flows through the withdrawal RPCs
   * keyed on OUR `reference` (the withdrawal request id), NOT through {@link impliedStatus} (which
   * is charge-only). The webhook is a NOTICE — the caller re-verifies the transfer before settling.
   * When set, impliedStatus is null.
   */
  transferEvent?: {
    /** Our reference echoed back — the withdrawal request id we sent as the transfer reference. */
    reference: string;
    /** The provider-side transfer id — used to authoritatively re-verify before settling. */
    providerReference: string;
    outcome: "completed" | "failed";
    /** The real transfer fee (minor units) the provider charged, when the payload reports it. */
    feeMinor?: number;
  };
}

/**
 * Synchronous confirmation of a charge (D1). The finalize route calls this on
 * the provider's return/callback to read authoritative charge state straight
 * from the provider (e.g. Paystack `transaction/verify`) rather than trusting
 * the client. {@link FinalizeResult.providerEventId} MUST equal the webhook's
 * dedup key for the same charge (the transaction reference) so a finalize and a
 * later `charge.success` webhook can never double-apply (G2).
 */
export interface FinalizeParams {
  providerReference: string;
}

export interface FinalizeResult {
  providerEventId: string;
  /** Authoritative status, or null if the charge is still pending at the provider. */
  impliedStatus: "succeeded" | "failed" | "refunded" | null;
  amountMinor: number;
  currency: ISO4217;
  /**
   * V3-VAT-01 — the REAL total processor fee (kobo, VAT-inclusive) read straight from
   * the provider's verify payload (Paystack `data.fees`). This is the RELIABLE fee
   * source (the verify call carries it even when the webhook does not). Undefined when
   * the provider does not report it; never assumed.
   */
  feeMinor?: number;
  /** The VAT portion within {@link feeMinor} when the provider breaks it out; else undefined. */
  feeVatMinor?: number;
}

/** Provider balance read for reconciliation (D1/G4). */
export interface BalanceParams {
  currency: ISO4217;
}

export interface BalanceResult {
  currency: ISO4217;
  availableMinor: number;
  /** ISO-8601 timestamp the provider reported this balance. */
  asOf: string;
}

// ── V3-MONEY-PAYOUT — outbound transfers (automatic withdrawal payouts to a user's bank) ──

/** Resolve a bank account to its holder name — checked BEFORE a payout so the money can't be
 *  sent to a mistyped/mismatched account. */
export interface ResolveBankAccountParams {
  accountNumber: string;
  /** Provider bank code (Flutterwave NIP code / Paystack bank code). */
  bankCode: string;
}
export interface ResolvedBankAccount {
  /** The account holder's name exactly as the bank reports it. */
  accountName: string;
}

export interface CreateTransferParams {
  /**
   * OUR idempotency reference for this payout — the withdrawal request id. The provider dedups on
   * it (Flutterwave `reference` is unique per transfer), and it is the key we re-verify + match the
   * webhook on, so a redelivery or retry can never pay out twice.
   */
  reference: string;
  amountMinor: number;
  currency: ISO4217;
  accountNumber: string;
  bankCode: string;
  /** Statement narration for the recipient. */
  narration?: string;
}
export interface CreateTransferResult {
  /** Provider-side transfer id/handle. Persisted; verify + webhook key on it or on our reference. */
  providerReference: string;
  /** The provider's transfer status verbatim (e.g. NEW / PENDING / SUCCESSFUL / FAILED). A create
   *  is NEVER treated as "paid" — only a verified `completed` outcome settles. */
  status: string;
}

export interface VerifyTransferParams {
  /** The provider-side transfer id (from {@link CreateTransferResult.providerReference} or the
   *  webhook) — the provider verifies a transfer by its own id. The result echoes OUR reference
   *  back so the caller matches it to the withdrawal. */
  providerReference: string;
}
export interface VerifiedTransfer {
  reference: string;
  providerReference: string;
  /** The terminal outcome, or null while the transfer is still pending (never assume). */
  outcome: "completed" | "failed" | null;
  /** The real transfer fee (minor units) the provider charged, when it reports it. */
  feeMinor?: number;
}

/**
 * The vendor-agnostic contract every payment provider implements. V3-13 ships
 * only {@link MockProvider}; Stripe/Paystack/Flutterwave adapters land in
 * V3-14/15/16 against this same interface. Every method returns a `Result`
 * carrying a normalised {@link ProviderError} on failure — adapters never throw
 * for expected provider-side failures.
 */
export interface PaymentProviderAdapter {
  readonly key: PaymentProviderKey;
  initiate(
    params: InitiatePaymentParams,
  ): Promise<Result<InitiatePaymentResult, ProviderError>>;
  refund(params: RefundParams): Promise<Result<RefundResult, ProviderError>>;
  verifyWebhook(
    params: VerifyWebhookParams,
  ): Promise<Result<VerifiedWebhook, ProviderError>>;
  /**
   * Synchronously confirm a charge from the provider (D1). Optional: adapters
   * whose flow is webhook-only may omit it. Deduped against the webhook by
   * {@link FinalizeResult.providerEventId} (G2).
   */
  finalize?(
    params: FinalizeParams,
  ): Promise<Result<FinalizeResult, ProviderError>>;
  /** Read provider balance for reconciliation (D1/G4). Optional. */
  getBalance?(
    params: BalanceParams,
  ): Promise<Result<BalanceResult, ProviderError>>;
  /**
   * V3-19 — list a transaction's refunds at the provider. The refund route uses
   * this to ADOPT an already-queued refund after a crash between recording the
   * attempt and the provider call (the provider's create-refund is NOT
   * idempotent, so blindly re-creating could double-refund real money).
   * Optional: without it, a stuck attempt requires provider-dashboard review.
   */
  listRefunds?(
    params: ListRefundsParams,
  ): Promise<Result<ProviderRefundSummary[], ProviderError>>;
  /**
   * V3-MONEY-PAYOUT — resolve a bank account to its holder name, so a payout is never sent to a
   * mistyped account. Optional; the payout rail requires it before creating a transfer.
   */
  resolveBankAccount?(
    params: ResolveBankAccountParams,
  ): Promise<Result<ResolvedBankAccount, ProviderError>>;
  /**
   * V3-MONEY-PAYOUT — create an OUTBOUND transfer (payout) to a bank account. Idempotent on OUR
   * `reference` (the withdrawal request id). A successful create only means "accepted/queued" —
   * money truth waits for a verified `completed` outcome. Optional.
   */
  createTransfer?(
    params: CreateTransferParams,
  ): Promise<Result<CreateTransferResult, ProviderError>>;
  /**
   * V3-MONEY-PAYOUT — authoritatively re-verify a transfer's outcome by our reference (the payout
   * D1 confirm, mirroring the charge verify). The webhook is only a notice; the caller settles the
   * ledger on THIS result, never on the webhook alone. Optional.
   */
  verifyTransfer?(
    params: VerifyTransferParams,
  ): Promise<Result<VerifiedTransfer, ProviderError>>;
}
