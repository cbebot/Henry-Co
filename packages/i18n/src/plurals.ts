// ---------------------------------------------------------------------------
// @henryco/i18n -- ICU plural form selection.
//
// Replaces ad-hoc `n === 1 ? "item" : "items"` ternaries with a locale-aware
// Intl.PluralRules helper so right-rule languages (Arabic, etc.) render
// correctly. The locale → BCP-47 tag mapping mirrors `format-number.ts` and
// `format-date.ts` so the three families stay in lockstep.
//
// Plural categories used across our locale list:
//   - English/French/Spanish/Portuguese/German/Italian/Hindi: one + other.
//   - Arabic: zero, one, two, few, many, other.
//   - Chinese: other only (no morphological plural).
//   - Igbo/Yoruba/Hausa: we route through en-NG (one + other).
// ---------------------------------------------------------------------------

import type { AppLocale } from "./locales";

const LOCALE_MAP: Record<AppLocale, string> = {
  // Tier A
  en: "en-NG",
  fr: "fr-FR",
  es: "es-ES",
  ar: "ar-EG",
  pt: "pt-BR",
  // Tier B
  de: "de-DE",
  it: "it-IT",
  zh: "zh-CN",
  hi: "hi-IN",
  // Nigerian regional — surface in en-NG so plurals stay in the user's
  // English fallback while the language UI label is the local language.
  ig: "en-NG",
  yo: "en-NG",
  ha: "en-NG",
};

function resolveIntlLocale(locale?: AppLocale | null): string {
  return LOCALE_MAP[locale || "en"];
}

/**
 * Plural-form record keyed by Intl.PluralRules category names. `other` is
 * mandatory; the helper falls back to it whenever a rule selects a category
 * that's not provided. The remaining keys are optional so authors can supply
 * only the categories used in their target locales.
 */
export type PluralForms = {
  other: string;
  one?: string;
  zero?: string;
  two?: string;
  few?: string;
  many?: string;
};

export interface PluralOptions {
  /** Override the BCP-47 cardinal/ordinal type. Defaults to "cardinal". */
  type?: "cardinal" | "ordinal";
}

/**
 * Selects the right plural-form string for `count` in `locale` without
 * substituting any token. The caller is responsible for any interpolation.
 *
 * @example
 *   pluralForm("en", 1, { one: "1 message", other: "{count} messages" })
 *     === "1 message"
 *   pluralForm("ar", 2, { one: "...", two: "...", other: "..." })
 *     // matches "two" for ar.
 */
export function pluralForm(
  locale: AppLocale | null | undefined,
  count: number,
  forms: PluralForms,
  options: PluralOptions = {},
): string {
  const tag = resolveIntlLocale(locale ?? null);
  let rule: Intl.LDMLPluralRule;
  try {
    rule = new Intl.PluralRules(tag, { type: options.type ?? "cardinal" }).select(count);
  } catch {
    rule = count === 1 ? "one" : "other";
  }
  const indexable = forms as Record<string, string | undefined>;
  return indexable[rule] ?? forms.other;
}

/**
 * Selects the right plural form and substitutes `replaceToken` (default
 * `{count}`) with the count value. The token may appear multiple times.
 *
 * @example
 *   pluralize("en", 3, { one: "{count} item", other: "{count} items" })
 *     === "3 items"
 *   pluralize("fr", 0, { one: "{count} résultat", other: "{count} résultats" })
 *     === "0 résultat"
 */
export function pluralize(
  locale: AppLocale | null | undefined,
  count: number,
  forms: PluralForms,
  replaceToken: string = "{count}",
): string {
  const form = pluralForm(locale, count, forms);
  if (!replaceToken) return form;
  return form.split(replaceToken).join(String(count));
}
