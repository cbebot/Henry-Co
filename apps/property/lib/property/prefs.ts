/** Client-only localStorage key for Property search area / category preferences (same-origin, UX only). */
export const PROPERTY_SEARCH_PREFS_KEY = "henryco-property-search-prefs";

export type PropertySearchPrefsPayload = {
  areaSlug: string;
  areaName: string;
  kind?: string;
  q?: string;
  updatedAt: string;
};
