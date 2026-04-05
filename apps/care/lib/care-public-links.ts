import { getAccountUrl, getDivisionUrl } from "@henryco/config";

function normalizePath(path: string) {
  if (!path) return "/";
  if (/^https?:\/\//i.test(path)) return path;
  return path.startsWith("/") ? path : `/${path}`;
}

export function buildCareAbsoluteReturnUrl(nextPath = "/", origin?: string | null) {
  const path = normalizePath(nextPath);
  if (/^https?:\/\//i.test(path)) return path;
  const base =
    String(origin || "").trim() ||
    getDivisionUrl("care").replace(/\/+$/, "");
  return new URL(path, `${base.replace(/\/+$/, "")}/`).toString();
}

export function getCareAccountHomeUrl() {
  return getAccountUrl("/care");
}

export function getCareSharedLoginUrl(nextPath = "/", origin?: string | null) {
  const next = buildCareAbsoluteReturnUrl(nextPath, origin);
  return getAccountUrl(`/login?next=${encodeURIComponent(next)}`);
}

export function getCareSharedSignupUrl(nextPath = "/", origin?: string | null) {
  const next = buildCareAbsoluteReturnUrl(nextPath, origin);
  return getAccountUrl(`/signup?next=${encodeURIComponent(next)}`);
}
