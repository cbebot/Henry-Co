export { resolveLocaleOrder } from "./resolve-locale";
export { buildLocaleCookieOptions, localeCookieName } from "./cookie";
export { getHubHomeCopy, getFaqFallbackForLocale, type HubHomeCopy } from "./hub-home-copy";
export { getConsentCopy, type EcosystemConsentCopy } from "./consent-copy";
export {
  DEFAULT_LOCALE,
  ALL_LOCALES,
  PRIMARY_LOCALES,
  RTL_LOCALES,
  normalizeLocale,
  isAppLocale,
  isRtlLocale,
  localeFromAcceptLanguage,
  LOCALE_COOKIE,
  LOCALE_LABELS,
  type AppLocale,
} from "./locales";
