import { getDivisionConfig } from "@henryco/config";
import type { PublicNavItem } from "../public-header";
import type { SiteNavigationConfig } from "./types";

/** Corporate marketing / inner-site navigation (henrycogroup.com).
 *
 * Audit (docs/v3/public-nav-intelligence-2026-05-23.md):
 *  - "Home" removed — the brand logo links to `/`.
 *  - "Privacy" + "Terms" removed from the primary nav. Legal links belong
 *    in the footer (where they already render via
 *    `apps/hub/app/components/PublicSiteShell.tsx`), not in the primary
 *    IA where they crowded out higher-intent destinations.
 *  - "Directory" added (anchor jump back to `/#divisions`) — every inner
 *    page now has a one-click return to the divisions grid that drives
 *    discovery across the group.
 *  - "Search" added — there's a real `/search` route on the hub that was
 *    only reachable via the `HenryCoSearchBreadcrumb` chip (hidden below
 *    `xl`). A primary-nav entry exposes it in the mobile drawer too.
 */
const hubInnerNav: PublicNavItem[] = [
  { label: "Directory", href: "/#directory" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
  { label: "Search", href: "/search" },
];

export const siteNavHub: SiteNavigationConfig = {
  siteId: "hub",
  primaryNav: hubInnerNav,
  anchorNav: getDivisionConfig("hub").publicNav,
  headerVariant: "default",
  defaultCtas: {
    aux: { label: "Contact", href: "/contact" },
    primary: { label: "Explore divisions", href: "/#divisions" },
  },
  heroOffset: {
    mainClassNameWhenHeroUnderHeader: "pt-0",
    mainClassNameDefault: "pt-0",
  },
  featureSlots: { account: true },
  headerZ: "site",
};
