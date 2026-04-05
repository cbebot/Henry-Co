import { getAccountUrl, getDivisionUrl } from "@henryco/config";

function normalizePath(path: string) {
  if (!path) return "/";
  if (/^https?:\/\//i.test(path)) return path;
  return path.startsWith("/") ? path : `/${path}`;
}

export function buildLogisticsReturnUrl(nextPath = "/") {
  const path = normalizePath(nextPath);
  if (/^https?:\/\//i.test(path)) return path;
  const base = getDivisionUrl("logistics").replace(/\/+$/, "");
  return new URL(path, `${base}/`).toString();
}

export function getLogisticsSharedLoginUrl(nextPath = "/") {
  const next = buildLogisticsReturnUrl(nextPath);
  return getAccountUrl(`/login?next=${encodeURIComponent(next)}`);
}

export function getLogisticsSharedSignupUrl(nextPath = "/") {
  const next = buildLogisticsReturnUrl(nextPath);
  return getAccountUrl(`/signup?next=${encodeURIComponent(next)}`);
}
