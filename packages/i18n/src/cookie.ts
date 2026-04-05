import { getSharedCookieDomain } from "@henryco/config";
import type { AppLocale } from "./locales";
import { LOCALE_COOKIE } from "./locales";

export function localeCookieName() {
  return LOCALE_COOKIE;
}

export function buildLocaleCookieOptions(
  locale: AppLocale,
  hostHeader: string | null | undefined
): { name: string; value: string; path: string; maxAge: number; sameSite: "lax"; domain?: string } {
  const host = hostHeader?.split(",")[0]?.trim().split(":")[0] || "";
  const domain = getSharedCookieDomain(host);

  return {
    name: LOCALE_COOKIE,
    value: locale,
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
    ...(domain ? { domain } : {}),
  };
}
