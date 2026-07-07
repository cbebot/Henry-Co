/**
 * @henryco/interactions — currency formatting edge.
 *
 * Currency rendering is INJECTED from @henryco/pricing at the app edge; the
 * engines never format money themselves (doctrine Engine 8). This module
 * defines the injected type and an Intl-based fallback for dev / tests.
 *
 * Money is always integer MINOR units (kobo / cents). The fallback assumes
 * 2 minor-unit decimals; the real injected formatter handles per-currency
 * exponents (e.g. 0 for a zero-decimal currency).
 */

export type CurrencyFormatter = (minorUnits: number, currency: string) => string;

export const defaultCurrencyFormatter: CurrencyFormatter = (minorUnits, currency) => {
  const major = minorUnits / 100;
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(major);
  } catch {
    return `${currency} ${major.toFixed(2)}`;
  }
};
