export function accountNav(active: string) {
  return [
    { href: "/account", label: "Overview", active: active === "/account" },
    { href: "/account/orders", label: "Orders", active: active === "/account/orders" },
    { href: "/account/payments", label: "Payments", active: active === "/account/payments" },
    { href: "/account/disputes", label: "Disputes", active: active === "/account/disputes" },
    { href: "/account/addresses", label: "Addresses", active: active === "/account/addresses" },
    { href: "/account/wishlist", label: "Wishlist", active: active === "/account/wishlist" },
    { href: "/account/following", label: "Following", active: active === "/account/following" },
    { href: "/account/notifications", label: "Notifications", active: active === "/account/notifications" },
    { href: "/account/reviews", label: "Reviews", active: active === "/account/reviews" },
    {
      href: "/account/seller-application",
      label: "Seller application",
      active: active === "/account/seller-application",
    },
  ];
}

export function vendorNav(active: string) {
  return [
    { href: "/vendor", label: "Overview", active: active === "/vendor" },
    { href: "/vendor/products", label: "Products", active: active === "/vendor/products" },
    { href: "/vendor/orders", label: "Orders", active: active === "/vendor/orders" },
    { href: "/vendor/disputes", label: "Disputes", active: active === "/vendor/disputes" },
    { href: "/vendor/payouts", label: "Payouts", active: active === "/vendor/payouts" },
    { href: "/vendor/analytics", label: "Analytics", active: active === "/vendor/analytics" },
    { href: "/vendor/store", label: "Store", active: active === "/vendor/store" },
    { href: "/vendor/settings", label: "Settings", active: active === "/vendor/settings" },
  ];
}

export function staffNav(active: string, root: string) {
  const resourceMap: Record<string, Array<{ href: string; label: string }>> = {
    "/owner": [
      { href: "/owner", label: "Overview" },
      { href: "/owner/alerts", label: "Alerts" },
      { href: "/owner/digest", label: "Digest" },
      { href: "/owner/settings", label: "Settings" },
      { href: "/owner/audit", label: "Audit" },
    ],
    "/admin": [
      { href: "/admin", label: "Overview" },
      { href: "/admin/seller-applications", label: "Seller applications" },
      { href: "/admin/products", label: "Products" },
      { href: "/admin/categories", label: "Categories" },
      { href: "/admin/campaigns", label: "Campaigns" },
      { href: "/admin/notifications", label: "Notifications" },
    ],
    "/moderation": [
      { href: "/moderation", label: "Overview" },
      { href: "/moderation/product-approvals", label: "Product approvals" },
      { href: "/moderation/risk", label: "Risk signals" },
      { href: "/moderation/disputes", label: "Disputes" },
      { href: "/moderation/audit", label: "Audit" },
    ],
    "/support": [
      { href: "/support", label: "Overview" },
      { href: "/support/disputes", label: "Disputes" },
      { href: "/support/returns", label: "Returns" },
      { href: "/support/threads", label: "Support threads" },
      { href: "/support/notifications", label: "Notification health" },
    ],
    "/finance": [
      { href: "/finance", label: "Overview" },
      { href: "/finance/payments", label: "Payments" },
      { href: "/finance/payment-verification", label: "Verification" },
      { href: "/finance/payouts", label: "Payouts" },
      { href: "/finance/audit", label: "Audit" },
    ],
    "/operations": [
      { href: "/operations", label: "Overview" },
      { href: "/operations/orders", label: "Orders" },
      { href: "/operations/low-stock", label: "Low stock" },
      { href: "/operations/automation-health", label: "Automation health" },
      { href: "/operations/delays", label: "Delays" },
    ],
  };

  return (resourceMap[root] ?? [{ href: root, label: "Overview" }]).map((item) => ({
    ...item,
    active: active === item.href,
  }));
}
