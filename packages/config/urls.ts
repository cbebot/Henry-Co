import { COMPANY } from "./company";

function isLocalHost(hostname: string) {
  return (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname === "127.0.0.1" ||
    hostname === "::1"
  );
}

function isTrustedHenryCoHost(hostname: string) {
  const normalizedHost = String(hostname || "").trim().toLowerCase();
  const baseDomain = String(COMPANY.group.baseDomain || "").trim().toLowerCase();

  if (!normalizedHost) return false;
  if (isLocalHost(normalizedHost)) return true;
  if (!baseDomain) return false;

  return normalizedHost === baseDomain || normalizedHost.endsWith(`.${baseDomain}`);
}

export function isAbsoluteHttpUrl(value?: string | null) {
  return /^https?:\/\//i.test(String(value || "").trim());
}

export function normalizeTrustedRedirect(next?: string | null) {
  const value = String(next || "").trim();
  if (!value) return "/";

  /** Legacy / mistaken callers passed bare `staffhq` instead of an absolute staff URL. */
  const token = value.toLowerCase();
  if (token === "staffhq" || token === "staff") {
    const base = String(COMPANY.group.baseDomain || "").trim().toLowerCase();
    return base ? `https://staffhq.${base}/` : "/";
  }

  if (value.startsWith("/")) {
    return value.startsWith("//") ? "/" : value;
  }

  if (!isAbsoluteHttpUrl(value)) {
    return "/";
  }

  try {
    const url = new URL(value);
    if (!["http:", "https:"].includes(url.protocol)) {
      return "/";
    }

    if (!isTrustedHenryCoHost(url.hostname)) {
      return "/";
    }

    return `${url.origin}${url.pathname}${url.search}${url.hash}`;
  } catch {
    return "/";
  }
}

export function resolveTrustedRedirect(origin: string, next?: string | null) {
  const normalized = normalizeTrustedRedirect(next);
  return normalized.startsWith("/") ? new URL(normalized, origin).toString() : normalized;
}
