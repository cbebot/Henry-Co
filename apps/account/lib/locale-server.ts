import "server-only";

import { cookies, headers } from "next/headers";
import { LOCALE_COOKIE, resolveLocaleOrder, type AppLocale } from "@henryco/i18n/server";
import { getProfile } from "@/lib/account-data";
import { getAccountUser } from "@/lib/auth";

export async function getAccountAppLocale(): Promise<AppLocale> {
  const [cookieStore, headerList, user] = await Promise.all([cookies(), headers(), getAccountUser()]);

  let savedLanguage: string | null = null;
  if (user) {
    const profile = await getProfile(user.id);
    const lang = profile && typeof (profile as { language?: unknown }).language === "string"
      ? (profile as { language: string }).language
      : null;
    savedLanguage = lang;
  }

  return resolveLocaleOrder({
    savedLanguage,
    cookieLocale: cookieStore.get(LOCALE_COOKIE)?.value,
    acceptLanguage: headerList.get("accept-language"),
    country: headerList.get("x-vercel-ip-country"),
  });
}

export { LOCALE_COOKIE };
