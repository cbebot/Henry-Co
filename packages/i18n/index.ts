// ---------------------------------------------------------------------------
// @henryco/i18n -- Global-readiness foundation
//
// Re-export every public package surface from a single root barrel so
// consumers can import from "@henryco/i18n" without reaching into subpaths.
// ---------------------------------------------------------------------------

export * from "./src/index";

export {
  formatMoney,
  formatMoneyMajor,
  normalizeCurrencyCode,
  parseCurrencyConfig,
  resolveCurrencyLocale,
  type CurrencyConfig,
  type MoneyFormatOptions,
} from "./currency";

export {
  DEFAULT_BASE_CURRENCY,
  DEFAULT_SETTLEMENT_CURRENCY,
  LIVE_SETTLEMENT_CURRENCIES,
  buildInvoiceLineItemsPayload,
  extractCurrencyContext,
  isLiveSettlementCurrency,
  resolveHenryCoRailCapability,
  resolveCurrencyTruth,
  serializeCurrencyContext,
  withCurrencyContext,
  type HenryCoCommerceDivision,
  type HenryCoPaymentMethod,
  type HenryCoRailCapability,
  type HenryCoRailCapabilityInput,
  type CurrencyTruthContext,
  type CurrencyTruthInput,
} from "./commerce";

export {
  COUNTRIES,
  DEFAULT_COUNTRY,
  getCountry,
  getActiveCountries,
  type Country,
} from "./countries";

export {
  DEFAULT_TIMEZONE,
  formatDateTime,
  formatDate,
  formatTime,
  getTimezoneOffset,
} from "./timezone";

export {
  formatPhone,
  normalizePhone,
  getPhonePrefix,
} from "./phone";
