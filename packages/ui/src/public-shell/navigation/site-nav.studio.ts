import type { PublicNavItem } from "../public-header";
import type { SiteNavigationConfig } from "./types";

/** Studio marketing IA (routes match `apps/studio` public pages) */
const studioPublicNav: PublicNavItem[] = [
  { href: "/pick", label: "Project types" },
  { href: "/services", label: "Services" },
  { href: "/pricing", label: "Packages" },
  { href: "/work", label: "Case Studies" },
  { href: "/teams", label: "Teams" },
  { href: "/process", label: "Process" },
  { href: "/trust", label: "Trust" },
  { href: "/contact", label: "Contact" },
];

export const siteNavStudio: SiteNavigationConfig = {
  siteId: "studio",
  primaryNav: studioPublicNav,
  defaultCtas: {
    aux: { href: "/contact", label: "Speak to Studio" },
    primary: { href: "/request", label: "Start a project" },
  },
  heroOffset: { mainClassNameDefault: "pt-0" },
  featureSlots: { account: true },
  headerZ: "site",
};
