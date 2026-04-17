import "server-only";

import { cookies, headers } from "next/headers";
import {
  LOCALE_COOKIE,
  resolveLocaleOrder,
  isAppLocale,
  normalizeLocale,
  type AppLocale,
} from "@henryco/i18n/server";

export async function getHubPublicLocale(): Promise<AppLocale> {
  const [cookieStore, headerList] = await Promise.all([cookies(), headers()]);
  return resolveLocaleOrder({
    cookieLocale: cookieStore.get(LOCALE_COOKIE)?.value,
    acceptLanguage: headerList.get("accept-language"),
    country: headerList.get("x-vercel-ip-country"),
  });
}

/**
 * Returns the locale that Accept-Language / CDN country hints suggest,
 * or null if the user already has a saved cookie preference or the
 * detected locale would just be the default English.
 *
 * Used to power the non-blocking LocaleSuggestion chip.
 */
export async function getHubLocaleSuggestion(): Promise<AppLocale | null> {
  const [cookieStore, headerList] = await Promise.all([cookies(), headers()]);
  const cookieLocale = cookieStore.get(LOCALE_COOKIE)?.value;
  // If the visitor already chose a language, respect it — no suggestion
  if (cookieLocale && isAppLocale(normalizeLocale(cookieLocale))) return null;
  const detected = resolveLocaleOrder({
    acceptLanguage: headerList.get("accept-language"),
    country: headerList.get("x-vercel-ip-country"),
  });
  return detected !== "en" ? detected : null;
}
