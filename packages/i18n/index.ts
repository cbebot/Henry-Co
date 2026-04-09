// ---------------------------------------------------------------------------
// @henryco/i18n -- Global-readiness foundation
//
// Re-export every public package surface from a single root barrel so
// consumers can import from "@henryco/i18n" without reaching into subpaths.
// ---------------------------------------------------------------------------

export * from "./src/index";

export {
  formatMoney,
  parseCurrencyConfig,
  type CurrencyConfig,
} from "./currency";

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
