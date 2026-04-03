import { getAccountUrl, getDivisionUrl } from "@henryco/config";

export function getStudioAbsoluteUrl(path = "/") {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getDivisionUrl("studio")}${normalizedPath}`;
}

export function getStudioAccountUrl() {
  return getAccountUrl("/studio");
}

export function getStudioLoginUrl(nextPath?: string | null) {
  const next =
    nextPath && /^https?:\/\//i.test(nextPath)
      ? nextPath
      : getStudioAbsoluteUrl(nextPath || "/");
  return getAccountUrl(`/login?next=${encodeURIComponent(next)}`);
}
