import "@henryco/dashboard-shell/surfaces.css";

/**
 * V3-INNER-L — the buyer account area runs on Register L: the shared,
 * light-primary, theme-aware Henry Onyx dashboard system (apps/account is
 * the reference). It is NOT the public noir storefront stage.
 *
 * The `.market-workspace-light` scope (apps/marketplace/app/globals.css)
 * re-grounds the marketplace tokens on the canonical --acct-* / --hc-*
 * register, mounts the dashboard-shell surface primitives, and re-tones the
 * .market-* utilities to light surfaces — so this subtree reads as a sibling
 * of the account dashboard. Dark is the device-preference flip, not the
 * default: the forced-dark customer-storefront defect is gone here.
 */
export default function AccountWorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="market-workspace-light">{children}</div>;
}
