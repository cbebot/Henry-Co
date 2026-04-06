import type { PublicNavigationSiteId, SiteNavigationConfig } from "./types";
import { siteNavBuilding } from "./site-nav.building";
import { siteNavCare } from "./site-nav.care";
import { siteNavHub } from "./site-nav.hub";
import { siteNavJobs } from "./site-nav.jobs";
import { siteNavLearn } from "./site-nav.learn";
import { siteNavLogistics } from "./site-nav.logistics";
import { siteNavMarketplace } from "./site-nav.marketplace";
import { siteNavProperty } from "./site-nav.property";
import { siteNavStudio } from "./site-nav.studio";

export const PublicNavigationRegistry: Record<PublicNavigationSiteId, SiteNavigationConfig> = {
  hub: siteNavHub,
  care: siteNavCare,
  studio: siteNavStudio,
  marketplace: siteNavMarketplace,
  jobs: siteNavJobs,
  learn: siteNavLearn,
  logistics: siteNavLogistics,
  property: siteNavProperty,
  building: siteNavBuilding,
};

export function getSiteNavigationConfig(siteId: PublicNavigationSiteId): SiteNavigationConfig {
  return PublicNavigationRegistry[siteId];
}
