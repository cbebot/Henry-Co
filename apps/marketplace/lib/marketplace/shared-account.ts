import { getDivisionUrl } from "@henryco/config";
import { cleanEnv } from "@/lib/env";

const DEFAULT_ACCOUNT_SUBDOMAIN = "account";
const DEFAULT_MARKETPLACE_PATH = "/";

export function getMarketplaceOrigin() {
  return getDivisionUrl("marketplace").replace(/\/+$/, "");
}

export function getSharedAccountOrigin() {
  const explicit = cleanEnv(process.env.NEXT_PUBLIC_ACCOUNT_ORIGIN);
  if (explicit) {
    return explicit.replace(/\/+$/, "");
  }

  const baseDomain = cleanEnv(process.env.NEXT_PUBLIC_BASE_DOMAIN) || "henrycogroup.com";
  return `https://${DEFAULT_ACCOUNT_SUBDOMAIN}.${baseDomain}`;
}

export function normalizeMarketplacePath(pathname?: string | null, fallback = DEFAULT_MARKETPLACE_PATH) {
  const next = cleanEnv(pathname);
  if (!next.startsWith("/")) {
    return fallback;
  }

  return next;
}

export function toMarketplaceAbsoluteUrl(pathname?: string | null, fallback = DEFAULT_MARKETPLACE_PATH) {
  const next = cleanEnv(pathname);
  if (/^https?:\/\//i.test(next)) {
    return next;
  }

  return `${getMarketplaceOrigin()}${normalizeMarketplacePath(next, fallback)}`;
}

export function buildSharedAccountUrl(pathname = "/", next?: string | null) {
  const url = new URL(pathname, `${getSharedAccountOrigin()}/`);
  if (next) {
    url.searchParams.set("next", toMarketplaceAbsoluteUrl(next));
  }
  return url.toString();
}

export function buildSharedAccountLoginUrl(next?: string | null, _currentOrigin?: string | null) {
  void _currentOrigin;
  return buildSharedAccountUrl("/login", next);
}
