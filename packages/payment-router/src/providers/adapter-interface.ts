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
}
