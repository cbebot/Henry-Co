import { getDivisionConfig } from "@henryco/config";
import type { PublicNavItem } from "../public-header";
import type { SiteNavigationConfig } from "./types";

const marketplaceDivision = getDivisionConfig("marketplace");

/** Single source of truth: `packages/config` division `publicNav` (desktop + mobile toolbar). */
export const marketplaceToolbarNav: PublicNavItem[] = marketplaceDivision.publicNav.map((item) => ({
  label: item.label,
  href: item.href,
  ...("external" in item && item.external ? { external: true as const } : {}),
}));

export const siteNavMarketplace: SiteNavigationConfig = {
  siteId: "marketplace",
  primaryNav: marketplaceToolbarNav,
  defaultCtas: {},
  heroOffset: {
    mainClassNameWhenHeroUnderHeader: "pt-0",
    mainClassNameDefault: "pt-0",
  },
  featureSlots: {
    search: true,
    cart: true,
    notifications: true,
    account: true,
  },
  headerZ: "overlay",
};
