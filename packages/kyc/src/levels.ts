/**
 * @henryco/kyc — verification level ladder (L0–L4).
 *
 * Aligned with the V3-24 spec so the vendor pass slots its router/adapters on
 * top without redefining levels:
 *   L0 unverified (default) · L1 email-verified · L2 phone-verified
 *   L3 document-verified · L4 biometric-verified (selfie ↔ document match)
 *
 * Pure + client-safe (no secrets, no node:crypto) so it can be exported from
 * the package's client-safe entry and read by gating code anywhere.
 */
export const VERIFICATION_LEVELS = ["L0", "L1", "L2", "L3", "L4"] as const;
export type VerificationLevel = (typeof VERIFICATION_LEVELS)[number];

function rank(level: VerificationLevel): number {
  return VERIFICATION_LEVELS.indexOf(level);
}

export function isVerificationLevel(value: unknown): value is VerificationLevel {
  return typeof value === "string" && (VERIFICATION_LEVELS as readonly string[]).includes(value);
}

/** True when `actual` is at least `required` on the total order L0 < … < L4. */
export function meetsLevel(actual: VerificationLevel, required: VerificationLevel): boolean {
  return rank(actual) >= rank(required);
}

/** The higher of two levels. */
export function maxLevel(a: VerificationLevel, b: VerificationLevel): VerificationLevel {
  return rank(a) >= rank(b) ? a : b;
}
