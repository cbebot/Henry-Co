import { getDivisionConfig } from "@henryco/config";
import type { SiteNavigationConfig } from "./types";

const logistics = getDivisionConfig("logistics");

export const siteNavLogistics: SiteNavigationConfig = {
  siteId: "logistics",
  primaryNav: logistics.publicNav,
  defaultCtas: {},
  heroOffset: { mainClassNameDefault: "pt-0" },
  featureSlots: { account: true },
  headerZ: "site",
};
