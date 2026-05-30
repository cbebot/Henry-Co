import { isSupportedCurrency, getCurrencyMinorUnit } from "@henryco/i18n/currency";

/**
 * Discriminated-union result idiom used across the router. Callers branch on
 * `ok` before touching `value`/`error`, so failures are never silently
 * coerced into success.
 */
export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

/** ISO-3166-1 alpha-2 country code (e.g. "NG", "US"). Upper-cased by callers. */
export type ISO3166Alpha2 = string;

/** ISO-4217 currency code (e.g. "NGN", "USD"). Validated via {@link normalizeCurrency}. */
export type ISO4217 = string;

/**
 * Payment methods the router can route. Wallet methods `apple_pay` and
 * `google_pay` are distinct first-class values (addendum A10) — they are NOT
 * folded into `card`, because provider capability and platform-compliance
 * rules differ per wallet.
 */
export type PaymentMethod =
  | "card"
  | "bank_transfer"
  | "ussd"
  | "mobile_money"
  | "apple_pay"
  | "google_pay";

export const PAYMENT_METHODS: readonly PaymentMethod[] = [
  "card",
  "bank_transfer",
  "ussd",
  "mobile_money",
  "apple_pay",
  "google_pay",
] as const;

/** Providers the router knows about. `mock` is the only adapter built in V3-13. */
export type PaymentProviderKey = "stripe" | "paystack" | "flutterwave" | "mock";

/**
 * Payment-intent lifecycle. Legal transitions are enforced by
 * `./state-machine` (and mirrored by the SQL trigger).
 */
export type PaymentIntentStatus =
  | "pending"
  | "processing"
  | "succeeded"
  | "failed"
  | "refund_processing"
  | "refunded"
  | "cancelled";

export interface PaymentIntentInput {
  amountMinor: number;
  currency: ISO4217;
  country: ISO3166Alpha2;
  method: PaymentMethod;
  userId: string;
  idempotencyKey: string;
  division?: string | null;
  metadata?: Record<string, unknown>;
}

/**
 * Validate a minor-unit amount. Money must be a positive safe integer — never
 * a float (rounding drift) and never zero/negative. Returns a Result so the
 * caller decides how to surface the rejection.
 */
export function validateAmountMinor(x: number): Result<number, string> {
  if (!Number.isSafeInteger(x) || x <= 0) {
    return { ok: false, error: `amountMinor must be a positive safe integer, got ${x}` };
  }
  return { ok: true, value: x };
}

/**
 * Normalise + validate a currency code (A4). Upper-cases the input and
 * REJECTS unsupported codes. This must be called before any minor-unit math:
 * `parseCurrencyConfig` in @henryco/i18n silently falls back to NGN for
 * unknown codes, so assuming ×100 without this guard would mis-scale money in
 * a zero-decimal or unsupported currency.
 */
export function normalizeCurrency(code: string): Result<ISO4217, string> {
  const upper = code.toUpperCase();
  if (!isSupportedCurrency(upper)) {
    return { ok: false, error: `unsupported currency: ${code}` };
  }
  return { ok: true, value: upper };
}

/** ISO-4217 minor-unit exponent (NGN=2, XOF=0, USD=2). Assumes a supported code. */
export function minorUnitExponent(currency: ISO4217): number {
  return getCurrencyMinorUnit(currency);
}
