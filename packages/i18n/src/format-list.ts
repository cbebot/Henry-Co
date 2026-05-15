// ---------------------------------------------------------------------------
// @henryco/i18n -- Intl.ListFormat wrapper.
//
// Replaces `.join(", ")` / `.join(" and ")` patterns with a locale-aware
// list assembler. The locale → BCP-47 tag mapping mirrors
// `format-number.ts`, `format-date.ts`, and `plurals.ts`.
// ---------------------------------------------------------------------------

import type { AppLocale } from "./locales";

const LOCALE_MAP: Record<AppLocale, string> = {
  en: "en-NG",
  fr: "fr-FR",
  es: "es-ES",
  ar: "ar-EG",
  pt: "pt-BR",
  de: "de-DE",
  it: "it-IT",
  zh: "zh-CN",
  hi: "hi-IN",
  ig: "en-NG",
  yo: "en-NG",
  ha: "en-NG",
};

function resolveIntlLocale(locale?: AppLocale | null): string {
  return LOCALE_MAP[locale || "en"];
}

export interface FormatListOptions {
  /** Long uses "and"/"or"; short shortens connectors; narrow omits them. */
  style?: "long" | "short" | "narrow";
  /** "conjunction" → "a, b, and c"; "disjunction" → "a, b, or c". */
  type?: "conjunction" | "disjunction" | "unit";
}

/**
 * Locale-aware list assembly. Returns "" for an empty list.
 *
 * @example
 *   formatList("en", ["apple", "banana", "pear"])
 *     === "apple, banana, and pear"
 *   formatList("en", ["weekdays", "weekends"], { type: "disjunction" })
 *     === "weekdays or weekends"
 */
export function formatList(
  locale: AppLocale | null | undefined,
  items: ReadonlyArray<string>,
  options: FormatListOptions = {},
): string {
  if (!items.length) return "";
  try {
    return new Intl.ListFormat(resolveIntlLocale(locale ?? null), {
      style: options.style ?? "long",
      type: options.type ?? "conjunction",
    }).format(items as string[]);
  } catch {
    return items.join(", ");
  }
}
