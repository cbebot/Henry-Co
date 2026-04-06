import { getDivisionConfig } from "@henryco/config";
import type { PublicNavItem } from "../public-header";
import type { SiteNavigationConfig } from "./types";

/** Corporate marketing / inner-site navigation (henrycogroup.com) */
const hubInnerNav: PublicNavItem[] = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
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
