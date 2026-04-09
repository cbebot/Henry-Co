// ---------------------------------------------------------------------------
// @henryco/i18n  --  Global-readiness foundation
//
// Re-exports every public API from the package sub-modules so consumers can
// do:  import { formatMoney, getCountry, formatPhone } from '@henryco/i18n';
// ---------------------------------------------------------------------------

export * from "./src/index.js";

export {
  formatMoney,
  parseCurrencyConfig,
  type CurrencyConfig,
} from './currency.js';

export {
  COUNTRIES,
  DEFAULT_COUNTRY,
  getCountry,
  getActiveCountries,
  type Country,
} from './countries.js';

export {
  DEFAULT_TIMEZONE,
  formatDateTime,
  formatDate,
  formatTime,
  getTimezoneOffset,
} from './timezone.js';

export {
  formatPhone,
  normalizePhone,
  getPhonePrefix,
} from './phone.js';
