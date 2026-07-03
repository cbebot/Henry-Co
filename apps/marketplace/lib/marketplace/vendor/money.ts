import type { AppLocale } from "@henryco/i18n/server";

/**
 * The ONLY money formatter vendor pages use. Settlement is NGN today; when per-user
 * display currency ships, the conversion + symbol decision lands HERE and every vendor
 * surface follows without another rebuild.
 */
export function formatVendorMoney(kobo: number, locale: AppLocale): string {
  const naira = (Number.isFinite(kobo) ? kobo : 0) / 100;
  return new Intl.NumberFormat(locale === "en" ? "en-NG" : locale, {
    style: "currency",
    currency: "NGN",
    currencyDisplay: "narrowSymbol",
  }).format(naira);
}
