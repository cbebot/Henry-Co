import { getDivisionConfig } from "@henryco/config";
import type { SiteNavigationConfig } from "./types";

const building = getDivisionConfig("building");

/** Reserved for building.henrycogroup.com when the public app ships */
export const siteNavBuilding: SiteNavigationConfig = {
  siteId: "building",
  primaryNav: building.publicNav,
  defaultCtas: {},
  heroOffset: { mainClassNameDefault: "pt-0" },
  featureSlots: { account: true },
  headerZ: "site",
};
