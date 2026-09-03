// Pure money math for the studio card rail — unit-tested, no server imports.
//
// `studio_payments.amount` is MAJOR naira (the same units the pay page feeds
// buildPaymentRecordView); the payment intent takes MINOR kobo. This is the ONE
// place that conversion happens for the card rail, bounded for sanity:
// ₦100 floor (mirrors the marketplace rail) and a ₦5,000,000 ceiling sized for
// big-ticket studio deposits (marketplace's ₦500k order cap is too small here).

export const STUDIO_CARD_MIN_KOBO = 10_000; // ₦100
export const STUDIO_CARD_MAX_KOBO = 500_000_000; // ₦5,000,000

/** Major NGN → kobo, or null when the amount is not safely chargeable. */
export function studioChargeMinor(amountMajor: number, currency: string): number | null {
  if ((currency || "NGN").toUpperCase() !== "NGN") return null;
  if (!Number.isFinite(amountMajor) || amountMajor <= 0) return null;
  const minor = Math.round(amountMajor * 100);
  if (!Number.isSafeInteger(minor)) return null;
  if (minor < STUDIO_CARD_MIN_KOBO || minor > STUDIO_CARD_MAX_KOBO) return null;
  return minor;
}
