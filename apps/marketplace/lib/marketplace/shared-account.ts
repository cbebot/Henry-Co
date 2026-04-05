import { getAccountUrl, getDivisionUrl } from "@henryco/config";

function normalizePath(path: string) {
  if (!path) return "/";
  if (/^https?:\/\//i.test(path)) return path;
  return path.startsWith("/") ? path : `/${path}`;
}

function normalizeBaseUrl(origin?: string | null) {
  const value = String(origin || "").trim();
  if (!value) {
    return getDivisionUrl("marketplace").replace(/\/$/, "");
  }

  if (/^https?:\/\//i.test(value)) {
    return value.replace(/\/$/, "");
  }

  return `https://${value.replace(/\/$/, "")}`;
}

export function buildMarketplaceReturnUrl(nextPath = "/", origin?: string | null) {
  const normalizedPath = normalizePath(nextPath);
  if (/^https?:\/\//i.test(normalizedPath)) return normalizedPath;
  return new URL(normalizedPath, `${normalizeBaseUrl(origin)}/`).toString();
}

export function buildSharedAccountUrl(
  accountPath: "/login" | "/signup" | "/forgot-password" | "/reset-password",
  nextPath = "/",
  origin?: string | null
) {
  const next = buildMarketplaceReturnUrl(nextPath, origin);
  return getAccountUrl(`${accountPath}?next=${encodeURIComponent(next)}`);
}

export function buildSharedAccountLoginUrl(nextPath = "/", origin?: string | null) {
  return buildSharedAccountUrl("/login", nextPath, origin);
}

export function buildSharedAccountSignupUrl(nextPath = "/", origin?: string | null) {
  return buildSharedAccountUrl("/signup", nextPath, origin);
}
