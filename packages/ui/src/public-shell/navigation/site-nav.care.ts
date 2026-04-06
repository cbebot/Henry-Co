import { getDivisionConfig } from "@henryco/config";
import type { SiteNavigationConfig } from "./types";

const care = getDivisionConfig("care");

export const siteNavCare: SiteNavigationConfig = {
  siteId: "care",
  primaryNav: care.publicNav,
  defaultCtas: {
    secondary: { label: "Track", href: "/track" },
    primary: { label: "Book now", href: "/book" },
  },
  heroOffset: {
    mainClassNameDefault: "pt-0",
  },
  featureSlots: { account: true },
  headerZ: "site",
};
