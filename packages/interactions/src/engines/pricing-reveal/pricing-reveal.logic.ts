/**
 * Pricing Reveal Engine — pure money math (doctrine Engine 8 / Principle 14).
 *
 * "Show the number. Show the value. Let the user decide." This core computes
 * the honest breakdown the components render: the platform fee itemized out
 * of the total, and annual-vs-monthly savings expressed in the user's
 * currency — never in % alone.
 *
 * Money invariants (absolute):
 *  - integer MINOR units in and out (kobo / cents), never floats;
 *  - fee rounding is half-even (banker's), computed on the exact rational
 *    total×bps/10000 with integer arithmetic only;
 *  - net + fee === total, always — no lost kobo;
 *  - this module RENDERS money; it never moves it.
 */

export interface PriceBreakdown {
  totalMinor: number;
  feeMinor: number;
  netMinor: number;
}

function assertNonNegativeInt(value: number, name: string): void {
  if (!Number.isInteger(value) || value < 0) {
    throw new RangeError(`${name} must be a non-negative integer (got ${value})`);
  }
}

/** Half-even rounding of the exact rational n/d using integer math only. */
function divideHalfEven(n: number, d: number): number {
  const q = Math.floor(n / d);
  const r = n - q * d;
  const twice = r * 2;
  if (twice > d) return q + 1;
  if (twice < d) return q;
  return q % 2 === 0 ? q : q + 1;
}

/**
 * Break a total into platform fee + net at `feeRateBps` basis points
 * (750 = 7.5%). The fee is what the checkout itemizes and names.
 */
export function breakdownPrice(totalMinor: number, feeRateBps: number): PriceBreakdown {
  assertNonNegativeInt(totalMinor, "totalMinor");
  assertNonNegativeInt(feeRateBps, "feeRateBps");
  const feeMinor = divideHalfEven(totalMinor * feeRateBps, 10_000);
  return { totalMinor, feeMinor, netMinor: totalMinor - feeMinor };
}

/**
 * The annual saving versus paying monthly, in minor units. Clamped at 0 —
 * if annual doesn't actually save, we say "no saving", we don't invent one.
 */
export function annualSavingMinor(monthlyMinor: number, annualMinor: number): number {
  assertNonNegativeInt(monthlyMinor, "monthlyMinor");
  assertNonNegativeInt(annualMinor, "annualMinor");
  return Math.max(0, monthlyMinor * 12 - annualMinor);
}

/** FX disclosure rendered next to a converted price (source + rate + when). */
export interface FxDisclosure {
  sourceCurrency: string;
  sourceMinor: number;
  /** Display-formatted rate, e.g. "1 USD = ₦1,540.20". Formatted upstream. */
  rateLabel: string;
  /** ISO timestamp of the rate. */
  asOf: string;
}
