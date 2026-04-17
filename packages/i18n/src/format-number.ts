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
  zh: "zh-CN",
  hi: "hi-IN",
  // Nigerian regional
  ig: "en-NG",
  yo: "en-NG",
  ha: "en-NG",
};

export interface FormatNumberOptions extends Intl.NumberFormatOptions {
  locale?: AppLocale | null;
}

function resolveIntlLocale(locale?: AppLocale | null): string {
  return LOCALE_MAP[locale || "en"];
}

export function formatNumber(value: number, options?: FormatNumberOptions): string {
  if (!Number.isFinite(value)) return "";

  const { locale, ...formatOptions } = options || {};
  return new Intl.NumberFormat(resolveIntlLocale(locale), {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    ...formatOptions,
  }).format(value);
}

export function formatPercent(
  value: number,
  options?: Omit<FormatNumberOptions, "style">,
): string {
  if (!Number.isFinite(value)) return "";

  const { locale, ...formatOptions } = options || {};
  return new Intl.NumberFormat(resolveIntlLocale(locale), {
    style: "percent",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    ...formatOptions,
  }).format(value);
}

export function formatCompact(
  value: number,
  options?: Omit<FormatNumberOptions, "notation">,
): string {
  if (!Number.isFinite(value)) return "";

  const { locale, ...formatOptions } = options || {};
  try {
    return new Intl.NumberFormat(resolveIntlLocale(locale), {
      notation: "compact",
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
      ...formatOptions,
    }).format(value);
  } catch {
    return formatNumber(value, { locale, ...formatOptions });
  }
}
