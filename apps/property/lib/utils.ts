import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { parseCurrencyConfig } from "@henryco/i18n";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(
  amount: number,
  currency: string = "NGN",
  locale?: string
) {
  const config = parseCurrencyConfig(currency);
  const normalizedAmount = Number.isFinite(amount) ? amount : 0;
  const minimumFractionDigits =
    config.decimals === 0 ? 0 : normalizedAmount % 1 === 0 ? 0 : Math.min(2, config.decimals);

  return new Intl.NumberFormat(locale || config.locale, {
    style: "currency",
    currency: config.code,
    minimumFractionDigits,
    maximumFractionDigits: config.decimals,
  }).format(normalizedAmount);
}

export function formatDate(value?: string | null, locale: string = "en-NG") {
  if (!value) return "Pending";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Pending";
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function formatCompactNumber(value: number, locale: string = "en-NG") {
  return new Intl.NumberFormat(locale, {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
