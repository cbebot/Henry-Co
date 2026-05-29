import type { PaymentProviderKey, PaymentMethod } from "../types";
import { PAYMENT_METHODS } from "../types";

/**
 * Which payment methods each provider can serve. This is the second gate in
 * routing: a provider is only eligible for a request if it appears in the
 * country preference AND supports the requested method (A10 — wallet methods
 * are distinct, so e.g. Paystack is ineligible for an apple_pay request).
 *
 * `mock` supports every method so it can stand in for any provider in tests.
 */
export const CAPABILITY_MATRIX: Record<PaymentProviderKey, readonly PaymentMethod[]> = {
  stripe: ["card", "apple_pay", "google_pay"],
  paystack: ["card", "bank_transfer", "ussd"],
  flutterwave: ["card", "bank_transfer", "mobile_money", "ussd"],
  mock: PAYMENT_METHODS,
};

export function providerSupportsMethod(
  provider: PaymentProviderKey,
  method: PaymentMethod,
): boolean {
  return CAPABILITY_MATRIX[provider].includes(method);
}
