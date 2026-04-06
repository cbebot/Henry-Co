import { getDivisionConfig } from "@henryco/config";
import type { SiteNavigationConfig } from "./types";

const property = getDivisionConfig("property");

export const siteNavProperty: SiteNavigationConfig = {
  siteId: "property",
  primaryNav: property.publicNav,
  defaultCtas: {},
  heroOffset: { mainClassNameDefault: "pt-0" },
  featureSlots: { account: true },
  headerZ: "site",
};
