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

// ---------------------------------------------------------------------------
// V3-MONEY-MC · M0 — payer currency resolution
// ---------------------------------------------------------------------------
// The last mile of the multi-currency program: decide which currency THIS payer
// is charged/quoted in, and whether it is chargeable today. Resolution and
// chargeability are separate facts — a surface may DISPLAY a local currency it
// cannot yet CHARGE (labelled approximate), which is exactly today's behaviour
// made honest. A currency becomes chargeable per division only when it is in the
// CHARGE_CURRENCIES allowlist AND the division's settlement status permits it.
// The allowlist is the interlock the owner flips per currency after a live test.

/** Where a resolved payer currency came from, most specific first. */
export type PayerCurrencySource = 'user' | 'locality' | 'default';

export interface PayerCurrencyResolution {
  /** ISO 4217 — the currency to quote/charge this payer in. */
  currency: string;
  /** How it was chosen: explicit preference, locality, or the NGN fallback. */
  source: PayerCurrencySource;
  /**
   * True only when a real charge can settle in `currency` for this division today
   * (in the allowlist AND the division settles live/ngn-permitting). When false,
   * the surface shows the currency as an approximate display and charges NGN.
   */
  chargeable: boolean;
}

/**
 * The currencies the platform may CHARGE in, per environment. NGN is always
 * present (the live base). Extend via the `CHARGE_CURRENCIES` env var
 * (comma-separated ISO 4217, e.g. "NGN,USD") — the owner's per-currency interlock,
 * flipped only after a real settle test in that currency. Parsing is defensive:
 * unknown/blank tokens are ignored and NGN can never be removed.
 */
export function parseChargeCurrencies(raw: string | null | undefined): string[] {
  const set = new Set<string>([SYSTEM_BASE_CURRENCY]);
  for (const token of String(raw ?? '').split(',')) {
    const code = token.trim().toUpperCase();
    if (/^[A-Z]{3}$/.test(code)) set.add(code);
  }
  return [...set];
}

/**
 * Resolve the payer's currency and whether it is chargeable today.
 *
 * Priority: the person's explicit currency/region preference → their locality
 * currency (from the country code) → NGN. `chargeable` is true only when the
 * resolved currency is in the allowlist AND the division's settlement status is
 * live or ngn-permitting; otherwise the caller displays it as approximate and
 * charges NGN. Never throws — an unknown input degrades to the NGN default.
 */
export function resolvePayerCurrency(input: {
  /** The person's explicit ISO-4217 preference, if they set one. */
  userPreference?: string | null;
  /** The person's country (ISO-3166-1 alpha-2), for the locality fallback. */
  countryCode?: string | null;
  division: string;
  /** The charge allowlist (from parseChargeCurrencies). Defaults to NGN-only. */
  chargeCurrencies?: string[];
}): PayerCurrencyResolution {
  const allow = new Set(
    (input.chargeCurrencies && input.chargeCurrencies.length > 0 ? input.chargeCurrencies : [SYSTEM_BASE_CURRENCY]).map((c) =>
      c.toUpperCase(),
    ),
  );
  allow.add(SYSTEM_BASE_CURRENCY);

  const preference = normalizeIso4217(input.userPreference);

  // Locality is a REAL signal only when the country actually mapped. An unknown country
  // resolves to NGN via the fallback — that is the default, not a discovered locality, so
  // we do not mislabel its source. (NG legitimately maps to NGN.)
  const countryUpper = String(input.countryCode ?? '').trim().toUpperCase();
  const localityRaw = countryUpper ? resolveDisplayCurrencyForCountry(countryUpper) : null;
  const localityIsReal = !!localityRaw && (localityRaw !== SYSTEM_BASE_CURRENCY || countryUpper === 'NG');
  const locality = localityIsReal ? normalizeIso4217(localityRaw) : null;

  let currency: string;
  let source: PayerCurrencySource;
  if (preference) {
    currency = preference;
    source = 'user';
  } else if (locality) {
    currency = locality;
    source = 'locality';
  } else {
    currency = SYSTEM_BASE_CURRENCY;
    source = 'default';
  }

  const { status } = resolveSettlementCurrencyForDivision(input.division);
  const divisionSettles = status === 'live' || status === 'ngn_only';
  const chargeable = currency === SYSTEM_BASE_CURRENCY || (allow.has(currency) && divisionSettles);

  return { currency, source, chargeable };
}

/** Normalise an ISO-4217 code to upper-case, or null when it is not a 3-letter code. */
function normalizeIso4217(code: string | null | undefined): string | null {
  const upper = String(code ?? '').trim().toUpperCase();
  return /^[A-Z]{3}$/.test(upper) ? upper : null;
}

// ---------------------------------------------------------------------------
// V3-MONEY-MC · M1 — the payer-currency charge amount
// ---------------------------------------------------------------------------

/** The amount to charge, in the payer's currency and its minor units. */
export interface PayerChargeAmount {
  /** ISO 4217 the charge is created in. */
  currency: string;
  /** The amount in that currency's MINOR units (e.g. kobo for NGN, cents for USD). */
  minorAmount: number;
  /** True when this is not the NGN base (a frozen FX rate was applied). */
  converted: boolean;
}

/**
 * Compute the exact amount to charge a payer in THEIR currency, from a price quoted in the
 * pricing currency. This is the single seam every card rail should call so no rail scatters its
 * own currency math. Returns null (the rail then charges NGN as today) when the payer currency
 * is not chargeable: not in the allowlist, or the price/rate/exponent is not usable.
 *
 * The minor amount is scaled by the payer currency's OWN exponent (passed in — NGN=2, XOF=0),
 * never a blanket x100, so a zero-decimal currency is not mis-scaled 100x. The rate is applied
 * from a FROZEN snapshot at charge time; reconcile must match this exact figure, never re-derive
 * it from a fresh rate. NGN (base) always uses rate 1 and needs no allowlist entry.
 */
export function computePayerChargeMinor(input: {
  /** The price in `pricingCurrency` major units (e.g. 1500 means ₦1,500 when pricing is NGN). */
  amountMajor: number;
  pricingCurrency: string;
  payerCurrency: string;
  /** The allowlist of chargeable currencies (from parseChargeCurrencies). NGN is always allowed. */
  chargeCurrencies: string[];
  /** pricingCurrency -> payerCurrency rate (1 when the same). Must be > 0. */
  rate: number;
  /** The payer currency's minor-unit exponent (NGN=2, USD=2, XOF=0). Must be >= 0. */
  payerMinorExponent: number;
}): PayerChargeAmount | null {
  const pricing = normalizeIso4217(input.pricingCurrency);
  const payer = normalizeIso4217(input.payerCurrency);
  if (!pricing || !payer) return null;
  if (!(input.amountMajor > 0) || !(input.rate > 0) || !(input.payerMinorExponent >= 0)) return null;

  // Chargeable only for the NGN base or an allowlisted currency; otherwise the rail charges NGN.
  const allow = new Set((input.chargeCurrencies ?? []).map((c) => c.toUpperCase()));
  allow.add(SYSTEM_BASE_CURRENCY);
  if (!allow.has(payer)) return null;

  const rate = payer === pricing ? 1 : input.rate;
  const payerMajor = input.amountMajor * rate;
  const minorAmount = Math.round(payerMajor * Math.pow(10, input.payerMinorExponent));
  if (!(minorAmount > 0)) return null;

  return { currency: payer, minorAmount, converted: payer !== SYSTEM_BASE_CURRENCY };
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
