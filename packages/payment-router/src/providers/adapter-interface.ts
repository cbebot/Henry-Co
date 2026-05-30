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
}
