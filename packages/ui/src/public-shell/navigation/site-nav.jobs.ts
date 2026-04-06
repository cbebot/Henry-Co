import { getDivisionConfig } from "@henryco/config";
import type { SiteNavigationConfig } from "./types";

const jobs = getDivisionConfig("jobs");

export const siteNavJobs: SiteNavigationConfig = {
  siteId: "jobs",
  primaryNav: jobs.publicNav,
  defaultCtas: {},
  heroOffset: { mainClassNameDefault: "pt-0" },
  featureSlots: { account: true },
  headerZ: "site",
};
