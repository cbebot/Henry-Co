// Pure money math for the care card rail — unit-tested, no server imports.
// Care amounts are MAJOR naira (the same units the pay page feeds buildPaymentRecordView);
// the payment intent takes MINOR kobo. ₦100 floor (rail standard), ₦5,000,000 ceiling.

export const CARE_CARD_MIN_KOBO = 10_000; // ₦100
export const CARE_CARD_MAX_KOBO = 500_000_000; // ₦5,000,000

/** Major NGN → kobo, or null when the amount is not safely chargeable. */
export function careChargeMinor(amountMajor: number, currency: string): number | null {
  if ((currency || "NGN").toUpperCase() !== "NGN") return null;
  if (!Number.isFinite(amountMajor) || amountMajor <= 0) return null;
  const minor = Math.round(amountMajor * 100);
  if (!Number.isSafeInteger(minor)) return null;
  if (minor < CARE_CARD_MIN_KOBO || minor > CARE_CARD_MAX_KOBO) return null;
  return minor;
}
