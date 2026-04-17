import type { AppLocale } from "./locales";

const LOCALE_MAP: Record<AppLocale, string> = {
  en: "en-NG",
  fr: "fr-FR",
  ig: "en-NG",
  yo: "en-NG",
  ha: "en-NG",
  ar: "ar-EG",
  es: "es-ES",
  pt: "pt-BR",
};

export interface FormatDateOptions extends Intl.DateTimeFormatOptions {
  locale?: AppLocale | null;
}

export interface FormatTimeOptions extends Intl.DateTimeFormatOptions {
  locale?: AppLocale | null;
}

export interface FormatRelativeTimeOptions {
  locale?: AppLocale | null;
  numeric?: "always" | "auto";
}

function resolveIntlLocale(locale?: AppLocale | null): string {
  return LOCALE_MAP[locale || "en"];
}

function toDate(input: Date | string | number): Date | null {
  const date = input instanceof Date ? input : new Date(input);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDate(input: Date | string | number, options?: FormatDateOptions): string {
  const date = toDate(input);
  if (!date) return "";

  const { locale, ...formatOptions } = options || {};
  return new Intl.DateTimeFormat(resolveIntlLocale(locale), {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    ...formatOptions,
  }).format(date);
}

export function formatDateLong(input: Date | string | number, options?: FormatDateOptions): string {
  const date = toDate(input);
  if (!date) return "";

  const { locale, ...formatOptions } = options || {};
  return new Intl.DateTimeFormat(resolveIntlLocale(locale), {
    year: "numeric",
    month: "long",
    day: "numeric",
    ...formatOptions,
  }).format(date);
}

export function formatTime(input: Date | string | number, options?: FormatTimeOptions): string {
  const date = toDate(input);
  if (!date) return "";

  const { locale, ...formatOptions } = options || {};
  return new Intl.DateTimeFormat(resolveIntlLocale(locale), {
    hour: "2-digit",
    minute: "2-digit",
    ...formatOptions,
  }).format(date);
}

export function formatDateTime(input: Date | string | number, options?: FormatDateOptions): string {
  const date = toDate(input);
  if (!date) return "";

  const { locale, ...formatOptions } = options || {};
  return new Intl.DateTimeFormat(resolveIntlLocale(locale), {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    ...formatOptions,
  }).format(date);
}

export function formatRelativeTime(
  input: Date | string | number,
  options?: FormatRelativeTimeOptions,
): string {
  const date = toDate(input);
  if (!date) return "";

  if (typeof Intl.RelativeTimeFormat !== "function") {
    return formatDate(date, { locale: options?.locale });
  }

  const diffSeconds = Math.round((date.getTime() - Date.now()) / 1000);
  const absDiff = Math.abs(diffSeconds);

  const ranges: Array<{ unit: Intl.RelativeTimeFormatUnit; seconds: number }> = [
    { unit: "year", seconds: 31557600 },
    { unit: "month", seconds: 2629800 },
    { unit: "week", seconds: 604800 },
    { unit: "day", seconds: 86400 },
    { unit: "hour", seconds: 3600 },
    { unit: "minute", seconds: 60 },
  ];

  let unit: Intl.RelativeTimeFormatUnit = "second";
  let value = diffSeconds;

  for (const range of ranges) {
    if (absDiff >= range.seconds) {
      unit = range.unit;
      value = Math.round(diffSeconds / range.seconds);
      break;
    }
  }

  return new Intl.RelativeTimeFormat(resolveIntlLocale(options?.locale), {
    numeric: options?.numeric || "auto",
  }).format(value, unit);
}
