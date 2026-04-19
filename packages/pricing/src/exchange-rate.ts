// ---------------------------------------------------------------------------
// @henryco/pricing  --  Exchange rate access (server-only)
//
// Integrates with Open Exchange Rates. Caches rates for 30 minutes.
// NEVER import this module client-side — it reads server env vars.
//
// Fallback behaviour: if the API key is missing or the fetch fails, a stale
// or identity-rate snapshot is returned so no checkout/display flow breaks.
// Conversion failure must never block a payment or page render.
// ---------------------------------------------------------------------------

import type { ExchangeRateSnapshot } from './currency-model';
import { buildExchangeRateSnapshot, buildFallbackExchangeRateSnapshot } from './currency-model';

const OER_BASE_URL = 'https://openexchangerates.org/api';
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes
const STALE_THRESHOLD_MS = 2 * 60 * 60 * 1000; // 2 hours — warn but still serve

type RateCache = {
  rates: Record<string, number>;
  base: string;
  fetchedAt: string;
  fetchedAtMs: number;
};

let _cache: RateCache | null = null;

function getAppId(): string | undefined {
  return (
    (typeof process !== 'undefined' &&
      // Vercel projects use OPENRATE_APP_ID; OPEN_EXCHANGE_RATES_APP_ID is the fallback alias
      (process.env?.OPENRATE_APP_ID || process.env?.OPEN_EXCHANGE_RATES_APP_ID)) ||
    undefined
  );
}

async function fetchRates(base = 'USD'): Promise<RateCache> {
  const appId = getAppId();
  if (!appId) {
    throw new Error('[exchange-rate] OPEN_EXCHANGE_RATES_APP_ID env var is not set.');
  }

  const url = `${OER_BASE_URL}/latest.json?app_id=${appId}&base=${base}`;
  const res = await fetch(url, { next: { revalidate: 1800 } } as RequestInit);

  if (!res.ok) {
    throw new Error(`[exchange-rate] OER request failed: ${res.status} ${res.statusText}`);
  }

  const data = (await res.json()) as { rates?: Record<string, number>; base?: string };
  if (!data.rates) {
    throw new Error('[exchange-rate] OER response missing rates field.');
  }

  const now = new Date().toISOString();
  return {
    rates: data.rates,
    base: data.base ?? base,
    fetchedAt: now,
    fetchedAtMs: Date.now(),
  };
}

async function ensureCacheFresh(base = 'USD'): Promise<RateCache | null> {
  if (_cache && Date.now() - _cache.fetchedAtMs < CACHE_TTL_MS) {
    return _cache;
  }

  try {
    _cache = await fetchRates(base);
    return _cache;
  } catch (err) {
    console.warn('[exchange-rate] fetch failed, serving stale cache:', err);
    if (_cache) return _cache;
    return null;
  }
}

/**
 * Get an exchange rate snapshot for converting from `from` to `to`.
 *
 * OER free plans use USD as base. We cross-rate: from→USD→to.
 * Returns a fallback (identity rate, isStale=true) when the provider is
 * unavailable so callers can still render pages without crashing.
 *
 * This function is safe to call server-side only.
 */
export async function getExchangeRateSnapshot(
  from: string,
  to: string,
): Promise<ExchangeRateSnapshot> {
  if (from === to) {
    return buildExchangeRateSnapshot(from, to, 1, 'identity', new Date().toISOString());
  }

  const cache = await ensureCacheFresh('USD');

  if (!cache) {
    console.warn(`[exchange-rate] No rates available for ${from}→${to}. Using fallback (1:1).`);
    return buildFallbackExchangeRateSnapshot(from, to);
  }

  const isStale = Date.now() - cache.fetchedAtMs > STALE_THRESHOLD_MS;

  const rateFrom = from === 'USD' ? 1 : cache.rates[from];
  const rateTo = to === 'USD' ? 1 : cache.rates[to];

  if (!rateFrom || !rateTo) {
    console.warn(`[exchange-rate] Missing rate for ${from} or ${to}. Using fallback (1:1).`);
    return {
      ...buildFallbackExchangeRateSnapshot(from, to),
      fetchedAt: cache.fetchedAt,
      isStale: true,
    };
  }

  const crossRate = rateTo / rateFrom;

  return buildExchangeRateSnapshot(
    from,
    to,
    crossRate,
    'openexchangerates',
    cache.fetchedAt,
    isStale,
  );
}

/**
 * Convert an amount in minor units from one currency to another.
 * Returns null when rate is unavailable (caller should show original amount).
 *
 * Safe for server use only — never call from client components.
 */
export async function convertMinorUnits(
  amountMinorUnits: number,
  from: string,
  to: string,
): Promise<{ converted: number; snapshot: ExchangeRateSnapshot } | null> {
  if (from === to) {
    return {
      converted: amountMinorUnits,
      snapshot: buildExchangeRateSnapshot(from, to, 1, 'identity', new Date().toISOString()),
    };
  }

  const snapshot = await getExchangeRateSnapshot(from, to);

  if (snapshot.isFallback) return null;

  return {
    converted: Math.round(amountMinorUnits * snapshot.rate),
    snapshot,
  };
}
