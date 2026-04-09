import { getDivisionUrl, type DivisionKey } from "@henryco/config";

const DIVISION_KEYS = new Set<DivisionKey>([
  "hub",
  "care",
  "building",
  "hotel",
  "marketplace",
  "property",
  "logistics",
  "studio",
  "jobs",
  "learn",
]);

function normalizePath(path = "/") {
  return path.startsWith("/") ? path : `/${path}`;
}

export function isExternalHref(value?: string | null) {
  return Boolean(value && /^https?:\/\//i.test(value));
}

export function asDivisionKey(value?: string | null): DivisionKey | null {
  const key = String(value || "").trim().toLowerCase() as DivisionKey;
  return DIVISION_KEYS.has(key) ? key : null;
}

export function getDivisionWorkspaceHref(division?: string | null, path = "/") {
  const key = asDivisionKey(division);
  if (!key) {
    return null;
  }

  const normalizedPath = normalizePath(path);
  return `${getDivisionUrl(key)}${normalizedPath === "/" ? "" : normalizedPath}`;
}

export function getCareBookingHref(bookingId: string) {
  return `/care/bookings/${encodeURIComponent(bookingId)}`;
}

export function getInvoiceWorkspaceHref(division?: string | null) {
  const key = asDivisionKey(division);
  if (!key) {
    return null;
  }

  switch (key) {
    case "learn":
      return getDivisionWorkspaceHref(key, "/learner/payments");
    case "marketplace":
      return getDivisionWorkspaceHref(key, "/account/payments");
    default:
      return getDivisionWorkspaceHref(key);
  }
}

export function getSubscriptionWorkspaceHref(division?: string | null) {
  const key = asDivisionKey(division);
  if (!key) {
    return null;
  }

  switch (key) {
    case "learn":
      return getDivisionWorkspaceHref(key, "/learner/payments");
    case "marketplace":
      return getDivisionWorkspaceHref(key, "/account/payments");
    default:
      return getDivisionWorkspaceHref(key);
  }
}
