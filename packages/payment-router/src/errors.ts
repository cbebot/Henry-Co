import type { PaymentProviderKey, PaymentIntentStatus } from "./types";

/**
 * Normalised provider failure. `retryable` drives router failover: a retryable
 * error means "try the next eligible provider", a fatal one means "stop".
 * `providerKey` is for server-side audit/telemetry only — it never reaches the
 * client (ANTI-CLONE Principle 9).
 */
export interface ProviderError {
  code: string;
  message: string;
  retryable: boolean;
  providerKey: PaymentProviderKey;
}

/**
 * No registered provider can serve a (country, currency, method) request.
 * The route layer maps this to the A5 manual-fallback path — the client gets a
 * generic actionable message, never a provider name.
 */
export class NoSuitableProviderError extends Error {
  readonly country: string;
  readonly currency: string;
  readonly method: string;
  constructor(country: string, currency: string, method: string) {
    super(
      `no suitable payment provider for country=${country} currency=${currency} method=${method}`,
    );
    this.name = "NoSuitableProviderError";
    this.country = country;
    this.currency = currency;
    this.method = method;
  }
}

/**
 * An attempted payment-intent status change that the state machine forbids
 * (A2). Thrown by `assertTransition`; the SQL trigger raises the equivalent.
 */
export class IllegalTransitionError extends Error {
  readonly from: PaymentIntentStatus;
  readonly to: PaymentIntentStatus;
  constructor(from: PaymentIntentStatus, to: PaymentIntentStatus) {
    super(`illegal payment intent transition: ${from} -> ${to}`);
    this.name = "IllegalTransitionError";
    this.from = from;
    this.to = to;
  }
}
