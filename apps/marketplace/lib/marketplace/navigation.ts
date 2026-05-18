import type { AppLocale } from "@henryco/i18n/server";
import { translateSurfaceLabel } from "@henryco/i18n";

type NavItem = { href: string; label: string; active: boolean };

export function accountNav(active: string, locale: AppLocale): NavItem[] {
  const t = (s: string) => translateSurfaceLabel(locale, s);
  return [
    { href: "/account", label: t("Overview"), active: active === "/account" },
    { href: "/account/orders", label: t("Orders"), active: active === "/account/orders" },
    { href: "/account/wallet", label: t("Wallet"), active: active === "/account/wallet" },
    { href: "/account/payments", label: t("Payments"), active: active === "/account/payments" },
    { href: "/account/disputes", label: t("Disputes"), active: active === "/account/disputes" },
    { href: "/account/addresses", label: t("Addresses"), active: active === "/account/addresses" },
    { href: "/account/wishlist", label: t("Wishlist"), active: active === "/account/wishlist" },
    { href: "/account/saved", label: t("Saved"), active: active === "/account/saved" },
    { href: "/account/following", label: t("Following"), active: active === "/account/following" },
    { href: "/account/notifications", label: t("Notifications"), active: active === "/account/notifications" },
    { href: "/account/reviews", label: t("Reviews"), active: active === "/account/reviews" },
    { href: "/account/support", label: t("Support"), active: active === "/account/support" },
    {
      href: "/account/seller-application",
      label: t("Seller application"),
      active: active === "/account/seller-application",
    },
  ];
}

/**
 * One-call helper used by every marketplace /account/* page. Returns
 * the flat `nav` and the mobile-friendly `groups` together so each page
 * can do `<WorkspaceShell {...accountWorkspaceNav("/account/orders", locale)} />`.
 */
export function accountWorkspaceNav(active: string, locale: AppLocale) {
  return {
    nav: accountNav(active, locale),
    navGroups: accountNavGroups(active, locale),
  };
}

/**
 * Same routes as `accountNav` but bucketed into mobile-friendly groups.
 * Used by `WorkspaceShell`'s mobile drawer so the workspace doesn't render
 * as a 10-item flat pill list on small screens.
 */
export function accountNavGroups(active: string, locale: AppLocale) {
  const t = (s: string) => translateSurfaceLabel(locale, s);
  const flat = accountNav(active, locale);
  const byHref = (href: string) => flat.find((item) => item.href === href)!;
  return [
    {
      label: t("Activity"),
      items: [byHref("/account"), byHref("/account/orders"), byHref("/account/notifications")],
    },
    {
      label: t("Commerce"),
      items: [
        byHref("/account/wallet"),
        byHref("/account/payments"),
        byHref("/account/disputes"),
        byHref("/account/addresses"),
      ],
    },
    {
      label: t("Help"),
      items: [byHref("/account/support")],
    },
    {
      label: t("Saved"),
      items: [
        byHref("/account/wishlist"),
        byHref("/account/saved"),
        byHref("/account/following"),
        byHref("/account/reviews"),
      ],
    },
    {
      label: t("Selling"),
      items: [byHref("/account/seller-application")],
    },
  ];
}

export function vendorNav(active: string, locale: AppLocale) {
  const t = (s: string) => translateSurfaceLabel(locale, s);
  return [
    { href: "/vendor", label: t("Overview"), active: active === "/vendor" },
    { href: "/vendor/products", label: t("Products"), active: active === "/vendor/products" },
    { href: "/vendor/orders", label: t("Orders"), active: active === "/vendor/orders" },
    { href: "/vendor/disputes", label: t("Disputes"), active: active === "/vendor/disputes" },
    { href: "/vendor/payouts", label: t("Payouts"), active: active === "/vendor/payouts" },
    { href: "/vendor/analytics", label: t("Analytics"), active: active === "/vendor/analytics" },
    { href: "/vendor/store", label: t("Store"), active: active === "/vendor/store" },
    { href: "/vendor/settings", label: t("Settings"), active: active === "/vendor/settings" },
  ];
}

export function staffNav(active: string, root: string, locale: AppLocale) {
  const t = (s: string) => translateSurfaceLabel(locale, s);
  const resourceMap: Record<string, Array<{ href: string; label: string }>> = {
    "/owner": [
      { href: "/owner", label: t("Overview") },
      { href: "/owner/alerts", label: t("Alerts") },
      { href: "/owner/digest", label: t("Digest") },
      { href: "/owner/automation-health", label: t("Automation health") },
      { href: "/owner/settings", label: t("Settings") },
      { href: "/owner/audit", label: t("Audit") },
    ],
    "/admin": [
      { href: "/admin", label: t("Overview") },
      { href: "/admin/sellers", label: t("Sellers") },
      { href: "/admin/seller-applications", label: t("Seller applications") },
      { href: "/admin/products", label: t("Products") },
      { href: "/admin/brands", label: t("Brands") },
      { href: "/admin/categories", label: t("Categories") },
      { href: "/admin/collections", label: t("Collections") },
      { href: "/admin/campaigns", label: t("Campaigns") },
      { href: "/admin/notifications", label: t("Notifications") },
      { href: "/admin/email-logs", label: t("Email logs") },
      { href: "/admin/whatsapp-logs", label: t("WhatsApp logs") },
      { href: "/admin/settings", label: t("Settings") },
    ],
    "/moderation": [
      { href: "/moderation", label: t("Overview") },
      { href: "/moderation/product-approvals", label: t("Product approvals") },
      { href: "/moderation/risk", label: t("Risk signals") },
      { href: "/moderation/reviews", label: t("Reviews") },
      { href: "/moderation/disputes", label: t("Disputes") },
      { href: "/moderation/audit", label: t("Audit") },
    ],
    "/support": [
      { href: "/support", label: t("Overview") },
      { href: "/support/disputes", label: t("Disputes") },
      { href: "/support/returns", label: t("Returns") },
      { href: "/support/threads", label: t("Support threads") },
      { href: "/support/notifications", label: t("Notification health") },
      { href: "/support/email-logs", label: t("Email logs") },
      { href: "/support/whatsapp-logs", label: t("WhatsApp logs") },
    ],
    "/finance": [
      { href: "/finance", label: t("Overview") },
      { href: "/finance/payments", label: t("Payments") },
      { href: "/finance/payment-verification", label: t("Verification") },
      { href: "/finance/payouts", label: t("Payouts") },
      { href: "/finance/refunds", label: t("Refunds") },
      { href: "/finance/audit", label: t("Audit") },
    ],
    "/operations": [
      { href: "/operations", label: t("Overview") },
      { href: "/operations/orders", label: t("Orders") },
      { href: "/operations/low-stock", label: t("Low stock") },
      { href: "/operations/automation-health", label: t("Automation health") },
      { href: "/operations/delays", label: t("Delays") },
      { href: "/operations/notifications", label: t("Notification queue") },
    ],
  };

  return (resourceMap[root] ?? [{ href: root, label: t("Overview") }]).map((item) => ({
    ...item,
    active: active === item.href,
  }));
}
