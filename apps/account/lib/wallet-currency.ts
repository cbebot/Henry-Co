import "server-only";

import {
  formatMoney,
  isSupportedCurrency,
  toMajorUnits,
  toMinorUnits,
} from "@henryco/i18n";
import { getExchangeRateSnapshot } from "@henryco/pricing";

/**
 * Wallet display-currency overlay (V3-WALLET — "Onyx Ledger").
 *
 * MONEY INVARIANT: the wallet ledger truth is NGN, stored in kobo. This module
 * produces a clearly-labelled, APPROXIMATE view of an NGN-kobo amount in the
 * user's currency for DISPLAY only. It never mutates, persists, or substitutes
 * the authoritative NGN figure, and it never fabricates a rate — when no live
 * rate is available it returns `null` and the surface shows NGN alone.
 *
 * Decimal-correct for every supported currency (incl. 0-decimal ones like XOF):
 * we convert in MAJOR units via the cross-rate, then re-scale to the target's
 * own minor units. A naive `kobo * rate` is only correct when source and target
 * share a decimal count, so we do not do that.
 *
 * Server-only: `getExchangeRateSnapshot` reads server env + fetches rates.
 */
export type WalletCurrencyDisplay = {
  /** Target ISO 4217 code (uppercased), e.g. "USD". */
  code: string;
  /** Pre-formatted approximate amount, e.g. "$12.40" (symbol + locale aware). */
  formatted: string;
  /** True when the underlying rate is older than the freshness threshold. */
  isStale: boolean;
};

/**
 * Convert one NGN-kobo amount into an approximate display string in `code`.
 * Returns `null` (→ show NGN only) when:
 *   - the target is NGN or unsupported,
 *   - no live rate is available (provider down / env unset → fallback),
 *   - or anything throws (conversion must never break a render).
 */
export async function convertWalletDisplay(
  amountKobo: number,
  code: string,
): Promise<WalletCurrencyDisplay | null> {
  const target = String(code || "NGN").toUpperCase();
  if (target === "NGN" || !isSupportedCurrency(target)) return null;
  if (!Number.isFinite(amountKobo)) return null;

  try {
    const snapshot = await getExchangeRateSnapshot("NGN", target);
    // isFallback === true means "no real rate" — never show a guessed figure.
    if (snapshot.isFallback || !Number.isFinite(snapshot.rate) || snapshot.rate <= 0) {
      return null;
    }
    const targetMajor = toMajorUnits(amountKobo, "NGN") * snapshot.rate;
    const targetMinor = toMinorUnits(targetMajor, target);
    return {
      code: target,
      formatted: formatMoney(targetMinor, target),
      isStale: Boolean(snapshot.isStale),
    };
  } catch {
    // Conversion failure must never block a payment or a page render.
    return null;
  }
}

/**
 * Convenience overlay for the two figures the wallet header shows together
 * (available + total). One rate lookup is shared across both via the snapshot
 * cache. Either field is `null` when conversion is unavailable.
 */
export async function buildWalletCurrencyOverlay(input: {
  availableKobo: number;
  balanceKobo: number;
  code: string;
}): Promise<{
  available: WalletCurrencyDisplay | null;
  balance: WalletCurrencyDisplay | null;
}> {
  const [available, balance] = await Promise.all([
    convertWalletDisplay(input.availableKobo, input.code),
    convertWalletDisplay(input.balanceKobo, input.code),
  ]);
  return { available, balance };
}
