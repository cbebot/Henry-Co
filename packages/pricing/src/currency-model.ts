// ---------------------------------------------------------------------------
// @henryco/pricing  --  Canonical multi-currency model
//
// Separates: user country / UI language / display currency / pricing currency /
// original transaction currency / settlement currency / ledger currency /
// wallet currency / invoice currency / reward currency / exchange-rate source.
//
// HenryCo truth: settlement currently runs in NGN. Display amounts in other
// currencies are approximate and clearly labelled. This module enforces that
// separation so no surface can accidentally lie about payability.
// ---------------------------------------------------------------------------

/** Settlement rail availability for a given currency/division pair. */
export type SettlementAvailabilityStatus =
  | 'live'           // Real settlement is available
  | 'test_only'      // Stripe/provider in test mode only
  | 'ngn_only'       // Settles in NGN regardless of display currency
  | 'deferred'       // Planned but not yet implemented
  | 'unavailable';   // Not supported

/**
 * The full multi-currency layer snapshot attached to a transaction, order,
 * invoice, wallet entry, or pricing quote.
 *
 * Store this as a JSONB column (currency_snapshot) on key tables.
 * Never reconstruct settlement facts client-side.
 */
export type CurrencyLayerSnapshot = {
  /** ISO 4217. The HenryCo-wide accounting base (currently always "NGN"). */
  systemBaseCurrency: string;

  /** ISO 4217. What the user sees amounts displayed in. May differ from settlement. */
  userDisplayCurrency: string;

  /** ISO 4217. Currency the price was computed/quoted in. */
  pricingCurrency: string;

  /** ISO 4217. Currency the original transaction occurred in. */
  originalTransactionCurrency: string;

  /** ISO 4217. Currency funds actually settle in (provider/bank ledger). */
  settlementCurrency: string;

  /** ISO 4217. Currency of the platform's internal accounting ledger. */
  ledgerCurrency: string;

  /** ISO 4217. Currency of the user's wallet balance. */
  walletCurrency: string;

  /** ISO 4217. Currency used for reward and referral credits. */
  rewardCurrency: string;

  /** ISO 4217. Currency on the invoice/receipt document. */
  invoiceCurrency: string;

  /** Amount in the original transaction currency, in minor units. */
  originalAmount: number;

  /** Amount in the settlement currency, in minor units. */
  settlementAmount: number;

  /** Amount displayed to the user in userDisplayCurrency, in minor units. */
  convertedDisplayAmount: number;

  /**
   * True when convertedDisplayAmount is an FX approximation —
   * the user cannot actually pay this exact amount in userDisplayCurrency today.
   */
  isApproximateDisplay: boolean;

  /** Settlement capability for the division/currency pair at this moment. */
  settlementAvailabilityStatus: SettlementAvailabilityStatus;

  /** Provider name or "none" when no live rate is used. */
  exchangeRateSource: string;

  /** ISO 8601 timestamp of when the rate was fetched. Null when no rate used. */
  exchangeRateTimestamp: string | null;

  /** Rate used to convert from originalTransactionCurrency to userDisplayCurrency. 1.0 when same. */
  exchangeRate: number;

  /** HenryCo platform division this snapshot belongs to. */
  division: string;

  /** ISO 8601 timestamp when this snapshot was built. */
  snapshotAt: string;
};

export type ExchangeRateSnapshot = {
  baseCurrency: string;
  targetCurrency: string;
  rate: number;
  source: string;
  fetchedAt: string;
  isStale: boolean;
  isFallback: boolean;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * The current system base currency. All settlement that is not explicitly
 * live on another rail falls back to NGN.
 */
export const SYSTEM_BASE_CURRENCY = 'NGN' as const;

/**
 * Divisions and their settlement availability as of this release.
 * Update this map when a division gains live settlement capability.
 */
const DIVISION_SETTLEMENT_STATUS: Record<string, SettlementAvailabilityStatus> = {
  marketplace: 'ngn_only',
  property:    'ngn_only',
  care:        'ngn_only',
  studio:      'ngn_only',
  learn:       'ngn_only',
  logistics:   'ngn_only',
  jobs:        'deferred',
  hotel:       'deferred',
  building:    'deferred',
  wallet:      'ngn_only',
  account:     'ngn_only',
};

/** Map from country code to display currency (ISO 4217). */
const COUNTRY_DISPLAY_CURRENCY: Record<string, string> = {
  NG: 'NGN',
  BJ: 'XOF',
  GH: 'GHS',
  TG: 'XOF',
  CI: 'XOF',
  SN: 'XOF',
  KE: 'KES',
  ZA: 'ZAR',
  GB: 'GBP',
  US: 'USD',
  CA: 'CAD',
  FR: 'EUR',
  DE: 'EUR',
  IT: 'EUR',
  ES: 'EUR',
  PT: 'EUR',
  MA: 'MAD',
  EG: 'EGP',
  AE: 'AED',
  SA: 'SAR',
  IN: 'INR',
  CN: 'CNY',
};

/**
 * Given a country code, return the canonical display currency for that country.
 * Falls back to NGN when country is unknown.
 */
export function resolveDisplayCurrencyForCountry(countryCode: string): string {
  const upper = String(countryCode || '').toUpperCase().trim();
  return COUNTRY_DISPLAY_CURRENCY[upper] ?? SYSTEM_BASE_CURRENCY;
}

/**
 * Return the settlement availability status for a given division.
 * Unknown divisions are treated as deferred.
 */
export function resolveSettlementCurrencyForDivision(division: string): {
  settlementCurrency: string;
  status: SettlementAvailabilityStatus;
} {
  const status = DIVISION_SETTLEMENT_STATUS[division.toLowerCase()] ?? 'deferred';
  return { settlementCurrency: SYSTEM_BASE_CURRENCY, status };
}

/**
 * Return a plain-English settlement truth string suitable for display near
 * money amounts. Professional and honest — not spam.
 */
export function describeSettlementTruth(
  displayCurrency: string,
  division: string,
): string {
  const { status } = resolveSettlementCurrencyForDivision(division);
  if (displayCurrency === SYSTEM_BASE_CURRENCY) {
    return 'Settlement in NGN.';
  }
  switch (status) {
    case 'live':
      return `Settlement available in ${displayCurrency}.`;
    case 'test_only':
      return `Test mode only. Settlement runs in NGN.`;
    case 'ngn_only':
      return `Display currency: ${displayCurrency}. Charged in NGN.`;
    case 'deferred':
      return `${displayCurrency} settlement coming. Charged in NGN today.`;
    default:
      return 'Settlement in NGN.';
  }
}

/**
 * Build a full currency snapshot for a transaction.
 *
 * Pass null for exchangeRateSnapshot when display and original currencies match
 * (no conversion needed).
 */
export function buildCurrencySnapshot(input: {
  division: string;
  originalAmount: number;
  originalCurrency: string;
  displayCurrency: string;
  exchangeRateSnapshot: ExchangeRateSnapshot | null;
}): CurrencyLayerSnapshot {
  const { settlementCurrency, status } = resolveSettlementCurrencyForDivision(input.division);
  const rate = input.exchangeRateSnapshot?.rate ?? 1;
  const sameAsDisplay = input.originalCurrency === input.displayCurrency;
  const convertedDisplayAmount = sameAsDisplay
    ? input.originalAmount
    : Math.round(input.originalAmount * rate);

  return {
    systemBaseCurrency: SYSTEM_BASE_CURRENCY,
    userDisplayCurrency: input.displayCurrency,
    pricingCurrency: input.originalCurrency,
    originalTransactionCurrency: input.originalCurrency,
    settlementCurrency,
    ledgerCurrency: SYSTEM_BASE_CURRENCY,
    walletCurrency: SYSTEM_BASE_CURRENCY,
    rewardCurrency: SYSTEM_BASE_CURRENCY,
    invoiceCurrency: input.originalCurrency,
    originalAmount: input.originalAmount,
    settlementAmount: input.originalAmount,
    convertedDisplayAmount,
    isApproximateDisplay: !sameAsDisplay,
    settlementAvailabilityStatus: status,
    exchangeRateSource: input.exchangeRateSnapshot?.source ?? 'none',
    exchangeRateTimestamp: input.exchangeRateSnapshot?.fetchedAt ?? null,
    exchangeRate: rate,
    division: input.division,
    snapshotAt: new Date().toISOString(),
  };
}

/**
 * Build a no-op exchange rate snapshot (same currency, no conversion).
 */
export function buildExchangeRateSnapshot(
  baseCurrency: string,
  targetCurrency: string,
  rate: number,
  source: string,
  fetchedAt: string,
  isStale = false,
): ExchangeRateSnapshot {
  return {
    baseCurrency,
    targetCurrency,
    rate,
    source,
    fetchedAt,
    isStale,
    isFallback: false,
  };
}

/**
 * Build a fallback snapshot used when the exchange rate provider is unavailable.
 * Using this snapshot means convertedDisplayAmount == originalAmount (identity rate).
 */
export function buildFallbackExchangeRateSnapshot(
  baseCurrency: string,
  targetCurrency: string,
): ExchangeRateSnapshot {
  return {
    baseCurrency,
    targetCurrency,
    rate: 1,
    source: 'fallback',
    fetchedAt: new Date().toISOString(),
    isStale: true,
    isFallback: true,
  };
}

/**
 * Throw a descriptive error when a money amount is missing its currency context.
 * Call at system boundaries (API handlers, DB writes) to prevent ambiguous records.
 */
export function assertNoAmbiguousCurrency(
  amount: number | null | undefined,
  currency: string | null | undefined,
  context: string,
): asserts currency is string {
  if (amount != null && !currency) {
    throw new Error(
      `[assertNoAmbiguousCurrency] ${context}: amount ${amount} has no currency. Every monetary value must carry its ISO 4217 currency code.`,
    );
  }
}
