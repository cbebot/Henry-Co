import "@henryco/dashboard-shell/surfaces.css";

/**
 * V3-INNER-L — the seller (vendor) console runs on Register L: the shared,
 * light-primary, theme-aware Henry Onyx dashboard system (apps/account is the
 * reference). A marketplace seller is a division *business* participant, not
 * platform staff — so this console stays in the division app, on the same
 * register as the buyer account area (see docs/v3/inner-surfaces-map.md §2.1).
 *
 * The `.market-workspace-light` scope (apps/marketplace/app/globals.css, added
 * with the /account flip in #225) re-grounds the marketplace tokens on the
 * canonical --acct-* / --hc-* register, mounts the dashboard-shell surface
 * primitives, and re-tones the shared WorkspaceShell + .market-* utilities to
 * light surfaces — so /vendor reads as a sibling of the account dashboard.
 * Dark is the device-preference flip, not the default: the forced-dark
 * seller-console defect is gone here.
 */
export default function VendorWorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="market-workspace-light">{children}</div>;
}
