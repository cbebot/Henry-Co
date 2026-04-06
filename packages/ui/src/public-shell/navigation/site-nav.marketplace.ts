import type { PublicNavItem } from "../public-header";
import type { SiteNavigationConfig } from "./types";

/** Secondary toolbar row on marketplace (glass panel header) */
export const marketplaceToolbarNav: PublicNavItem[] = [
  { href: "/search", label: "Search" },
  { href: "/deals", label: "Deals" },
  { href: "/collections/founder-desk", label: "Collections" },
  { href: "/trust", label: "Trust" },
  { href: "/sell", label: "Sell" },
  { href: "/help", label: "Support" },
];

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
