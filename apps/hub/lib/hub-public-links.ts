import { getAccountUrl, getHubUrl } from "@henryco/config";

function normalizePath(path: string) {
  if (!path) return "/";
  if (/^https?:\/\//i.test(path)) return path;
  return path.startsWith("/") ? path : `/${path}`;
}

export function buildHubAbsoluteReturnUrl(nextPath = "/") {
  const path = normalizePath(nextPath);
  if (/^https?:\/\//i.test(path)) return path;
  return new URL(path, `${getHubUrl().replace(/\/+$/, "")}/`).toString();
}

export function getHubSharedLoginUrl(nextPath = "/") {
  const next = buildHubAbsoluteReturnUrl(nextPath);
  return getAccountUrl(`/login?next=${encodeURIComponent(next)}`);
}

export function getHubSharedSignupUrl(nextPath = "/") {
  const next = buildHubAbsoluteReturnUrl(nextPath);
  return getAccountUrl(`/signup?next=${encodeURIComponent(next)}`);
}
