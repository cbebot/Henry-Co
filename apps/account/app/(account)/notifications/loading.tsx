import { cookies, headers } from "next/headers";
import { LOCALE_COOKIE, resolveLocaleOrder, translateSurfaceLabel } from "@henryco/i18n/server";
import AccountRouteLoading from "@/components/layout/AccountRouteLoading";

export default async function NotificationsLoading() {
  const [cookieStore, headerList] = await Promise.all([cookies(), headers()]);
  const locale = resolveLocaleOrder({
    cookieLocale: cookieStore.get(LOCALE_COOKIE)?.value,
    acceptLanguage: headerList.get("accept-language"),
    country: headerList.get("x-vercel-ip-country"),
  });
  const t = (text: string) => translateSurfaceLabel(locale, text);

  return (
    <AccountRouteLoading
      title={t("Loading notifications")}
      description={t("Grouping recent alerts, unread movement, and source-branded context.")}
    />
  );
}
