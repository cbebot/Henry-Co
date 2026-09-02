import "server-only";

import { cookies, headers } from "next/headers";
import { LOCALE_COOKIE, resolveLocaleOrder, type AppLocale } from "@henryco/i18n/server";

/**
 * The operator locale for the staff workspace. `apps/staff` had no resolver
 * before V3-41 — every operator surface rendered English regardless of the
 * language the person had chosen elsewhere in the ecosystem. This mirrors the
 * per-app resolver every other division already ships (see
 * `apps/hub/lib/locale-server.ts`) so staff copy honours the same cookie.
 */
export async function getStaffLocale(): Promise<AppLocale> {
  const [cookieStore, headerList] = await Promise.all([cookies(), headers()]);
  return resolveLocaleOrder({
    cookieLocale: cookieStore.get(LOCALE_COOKIE)?.value,
    acceptLanguage: headerList.get("accept-language"),
    country: headerList.get("x-vercel-ip-country"),
  });
}
