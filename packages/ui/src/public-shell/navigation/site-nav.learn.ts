import { getDivisionConfig } from "@henryco/config";
import type { SiteNavigationConfig } from "./types";

const learn = getDivisionConfig("learn");

export const siteNavLearn: SiteNavigationConfig = {
  siteId: "learn",
  primaryNav: learn.publicNav,
  defaultCtas: {
    primary: { label: "Explore courses", href: "/courses" },
  },
  heroOffset: { mainClassNameDefault: "pt-0" },
  featureSlots: { account: true },
  headerZ: "site",
};
