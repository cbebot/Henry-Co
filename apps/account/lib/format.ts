import {
  formatSurfaceTemplate,
  normalizeLocale,
  translateSurfaceLabel,
  type AppLocale,
} from "@henryco/i18n";

const INTL_LOCALE_MAP: Record<AppLocale, string> = {
  en: "en-NG",
  fr: "fr-FR",
  es: "es-ES",
  pt: "pt-BR",
  ar: "ar-EG",
  ig: "en-NG",
  yo: "en-NG",
  ha: "en-NG",
  de: "de-DE",
  it: "it-IT",
  zh: "zh-CN",
  hi: "hi-IN",
};

function resolveLocale(
  options?: string | { locale?: string; timezone?: string }
) {
  const raw = typeof options === "string" ? options : options?.locale || "en";
  return INTL_LOCALE_MAP[normalizeLocale(raw)];
}

function resolveAppLocale(
  options?: string | { locale?: string; timezone?: string }
): AppLocale {
  return normalizeLocale(typeof options === "string" ? options : options?.locale);
}

function resolveTimezone(
  options?: string | { locale?: string; timezone?: string }
) {
  return typeof options === "object" ? options?.timezone : undefined;
}

export function formatNaira(
  kobo: number,
  options?: string | { locale?: string }
): string {
  const naira = kobo / 100;
  return new Intl.NumberFormat(resolveLocale(options), {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: naira % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(naira);
}

export function formatCurrencyAmount(
  amount: number,
  currency = "NGN",
  options?: {
    unit?: "naira" | "kobo";
    notation?: Intl.NumberFormatOptions["notation"];
    maximumFractionDigits?: number;
    locale?: string;
  }
): string {
  const unit = options?.unit || "naira";
  const normalized = unit === "kobo" ? amount / 100 : amount;

  return new Intl.NumberFormat(
    options?.locale || (currency === "NGN" ? "en-NG" : "en-US"),
    {
      style: "currency",
      currency,
      notation: options?.notation,
      minimumFractionDigits: normalized % 1 === 0 ? 0 : 2,
      maximumFractionDigits: options?.maximumFractionDigits ?? 2,
    }
  ).format(normalized);
}

function humanizeToken(value: string, fallback = "—") {
  const normalized = String(value || "")
    .trim()
    .replace(/[_-]+/g, " ");

  if (!normalized) return fallback;
  return normalized.replace(/\b\w/g, (char) => char.toUpperCase());
}

export function formatSubscriptionStatus(status: string): string {
  const normalized = String(status || "").trim().toLowerCase();

  switch (normalized) {
    case "past_due":
      return "Past due";
    case "trialing":
      return "Trialing";
    default:
      return humanizeToken(normalized, "Unknown");
  }
}

export function formatBillingInterval(interval: string): string {
  const normalized = String(interval || "").trim().toLowerCase();

  switch (normalized) {
    case "monthly":
      return "Monthly";
    case "yearly":
    case "annual":
      return normalized === "annual" ? "Annual" : "Yearly";
    case "quarterly":
      return "Quarterly";
    case "weekly":
      return "Weekly";
    case "biweekly":
      return "Every 2 weeks";
    case "daily":
      return "Daily";
    case "one_time":
      return "One-time";
    default:
      return humanizeToken(normalized, "Not set");
  }
}

export function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat("en-NG", {
    notation: "compact",
    maximumFractionDigits: value >= 100 ? 0 : 1,
  }).format(value);
}

export function formatPercent(value: number, maximumFractionDigits = 1): string {
  return new Intl.NumberFormat("en-NG", {
    style: "percent",
    maximumFractionDigits,
  }).format(value / 100);
}

export function formatDate(
  dateStr: string,
  options?: string | { locale?: string; timezone?: string }
): string {
  return new Intl.DateTimeFormat(resolveLocale(options), {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...(resolveTimezone(options) ? { timeZone: resolveTimezone(options) } : {}),
  }).format(new Date(dateStr));
}

export function formatDateTime(
  dateStr: string,
  options?: string | { locale?: string; timezone?: string }
): string {
  return new Intl.DateTimeFormat(resolveLocale(options), {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    ...(resolveTimezone(options) ? { timeZone: resolveTimezone(options) } : {}),
  }).format(new Date(dateStr));
}

export function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const locale = "en-NG";

  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  return formatDate(dateStr, locale);
}

export function timeAgoLocalized(
  dateStr: string,
  options?: string | { locale?: string; timezone?: string }
): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const locale = resolveAppLocale(options);

  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) {
    return translateSurfaceLabel(locale, "Just now");
  }
  if (minutes < 60) {
    return formatSurfaceTemplate(translateSurfaceLabel(locale, "{count}m ago"), {
      count: minutes,
    });
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return formatSurfaceTemplate(translateSurfaceLabel(locale, "{count}h ago"), {
      count: hours,
    });
  }

  const days = Math.floor(hours / 24);
  if (days < 7) {
    return formatSurfaceTemplate(translateSurfaceLabel(locale, "{count}d ago"), {
      count: days,
    });
  }

  return formatDate(dateStr, options);
}

export function initials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function divisionLabel(key: string): string {
  const map: Record<string, string> = {
    care: "Care",
    marketplace: "Marketplace",
    studio: "Studio",
    learn: "Academy",
    logistics: "Logistics",
    property: "Property",
    jobs: "Jobs",
    hotel: "Hotel",
    building: "Building",
    account: "Account",
    wallet: "Wallet",
  };
  return map[key] || key.charAt(0).toUpperCase() + key.slice(1);
}

export function divisionColor(key: string): string {
  const map: Record<string, string> = {
    care: "#6B7CFF",
    marketplace: "#B2863B",
    studio: "#E85D75",
    learn: "#22B573",
    logistics: "#F59E0B",
    property: "#8B5CF6",
    jobs: "#06B6D4",
    hotel: "#EC4899",
    building: "#4F46E5",
    account: "#C9A227",
    wallet: "#10B981",
  };
  return map[key] || "#6B7280";
}
