import type { PublicNavItem } from "../public-header";

export type PublicNavigationSiteId =
  | "hub"
  | "care"
  | "studio"
  | "marketplace"
  | "jobs"
  | "learn"
  | "logistics"
  | "property"
  | "building";

/** CTA pair used by the shared header engine */
export type PublicCTAConfig = {
  primary?: PublicNavItem;
  secondary?: PublicNavItem;
  aux?: PublicNavItem;
};

/** Hero / main content offset relative to sticky public header */
export type PublicHeroOffsetRules = {
  /** Applied to `<main>` when the first section is full-bleed under the header */
  mainClassNameWhenHeroUnderHeader?: string;
  /** Default top padding for inner pages */
  mainClassNameDefault?: string;
};

export type SiteNavigationConfig = {
  siteId: PublicNavigationSiteId;
  /** Desktop + mobile primary links */
  primaryNav: readonly PublicNavItem[];
  /** Homepage anchor links (e.g. hub `#directory`) — optional second tier */
  anchorNav?: readonly PublicNavItem[];
  defaultCtas?: PublicCTAConfig;
  heroOffset?: PublicHeroOffsetRules;
  /** Feature flags for shell slots (marketplace composes its own rich header) */
  featureSlots?: {
    search?: boolean;
    cart?: boolean;
    notifications?: boolean;
    account?: boolean;
  };
  /** Sticky header stacking hint */
  headerZ?: "site" | "overlay";
  /**
   * PublicHeader presentation: `floating` = elevated rounded bar (default for most divisions);
   * `default` = full-bleed sticky bar (e.g. hub marketing / noir shells).
   */
  headerVariant?: "default" | "floating";
};
