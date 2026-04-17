import "server-only";

import { cookies, headers } from "next/headers";
import { LOCALE_COOKIE, resolveLocaleOrder, type AppLocale } from "@henryco/i18n/server";

export async function getPropertyPublicLocale(): Promise<AppLocale> {
  const [cookieStore, headerList] = await Promise.all([cookies(), headers()]);
  return resolveLocaleOrder({
    cookieLocale: cookieStore.get(LOCALE_COOKIE)?.value,
    acceptLanguage: headerList.get("accept-language"),
    country: headerList.get("x-vercel-ip-country"),
  });
}
