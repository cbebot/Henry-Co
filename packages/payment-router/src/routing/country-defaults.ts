import type { PaymentProviderKey, ISO3166Alpha2 } from "../types";

/**
 * EU/EEA alpha-2 codes that default to Stripe. Kept as a set so membership is
 * O(1) and the explicit-defaults table below stays small.
 */
const EU_ALPHA2 = new Set([
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU",
  "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE",
]);

/**
 * Ordered provider preference per country. Order is the failover order: the
 * router tries the first eligible provider, then the next. African markets lead
 * with local acquirers (better auth rates, local methods); US/UK/CA/EU lead with
 * Stripe.
 */
const EXPLICIT_DEFAULTS: Record<string, PaymentProviderKey[]> = {
  NG: ["paystack", "flutterwave"],
  GH: ["paystack", "flutterwave"],
  KE: ["flutterwave", "paystack"],
  US: ["stripe"],
  GB: ["stripe"],
  CA: ["stripe"],
};

/**
 * Ordered provider preference for a country. Returns a FRESH array each call so
 * callers can filter/mutate without corrupting the table. Unknown countries
 * return `[]`, which the router turns into the A5 no-suitable-provider path.
 */
export function providerPreferenceForCountry(
  country: ISO3166Alpha2,
): PaymentProviderKey[] {
  const code = country.toUpperCase();
  if (EXPLICIT_DEFAULTS[code]) return [...EXPLICIT_DEFAULTS[code]];
  if (EU_ALPHA2.has(code)) return ["stripe"];
  return [];
}
