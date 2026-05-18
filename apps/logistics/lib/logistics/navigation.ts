import { translateSurfaceLabel, type AppLocale } from "@henryco/i18n";

export function getPublicNav(locale: AppLocale) {
  const t = (text: string) => translateSurfaceLabel(locale, text);
  return [
    { label: t("Services"), href: "/services" },
    { label: t("Pricing"), href: "/pricing" },
    { label: t("Business"), href: "/business" },
    { label: t("Quote"), href: "/quote" },
    { label: t("Book"), href: "/book" },
    { label: t("Track"), href: "/track" },
    { label: t("Support"), href: "/support" },
  ] as const;
}

export function getCustomerNav(locale: AppLocale) {
  const t = (text: string) => translateSurfaceLabel(locale, text);
  return [
    { label: t("Overview"), href: "/customer" },
    { label: t("Shipments"), href: "/customer/shipments" },
    { label: t("Support"), href: "/support" },
  ] as const;
}

export function getDispatchNav(locale: AppLocale) {
  const t = (text: string) => translateSurfaceLabel(locale, text);
  return [
    { label: t("Dispatch"), href: "/dispatch" },
    { label: t("Queues"), href: "/dispatch/queues" },
    { label: t("Issues"), href: "/dispatch/issues" },
    { label: t("Riders"), href: "/dispatch/riders" },
    { label: t("Pricing"), href: "/dispatch/pricing" },
  ] as const;
}

export function getRiderNav(locale: AppLocale) {
  const t = (text: string) => translateSurfaceLabel(locale, text);
  return [
    { label: t("Overview"), href: "/rider" },
    { label: t("Pickups"), href: "/rider/pickups" },
    { label: t("Deliveries"), href: "/rider/deliveries" },
    { label: t("History"), href: "/rider/history" },
    { label: t("Expenses"), href: "/rider/expenses" },
  ] as const;
}

export function getSupportNav(locale: AppLocale) {
  const t = (text: string) => translateSurfaceLabel(locale, text);
  return [
    { label: t("Support"), href: "/support" },
    { label: t("Escalations"), href: "/support/escalations" },
  ] as const;
}

export function getOwnerNav(locale: AppLocale) {
  const t = (text: string) => translateSurfaceLabel(locale, text);
  return [
    { label: t("Owner"), href: "/owner" },
    { label: t("Dispatch"), href: "/dispatch" },
    { label: t("Finance"), href: "/finance" },
    { label: t("Support"), href: "/support" },
  ] as const;
}
