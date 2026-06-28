import "server-only";

import type { UnifiedViewer } from "@henryco/auth";
import { createDataAdminClient } from "@henryco/data";
import { getDivisionUrl } from "@henryco/config";

/**
 * Module-local data layer for the property (Henry Onyx Property) home
 * widgets.
 *
 * The account shell renders the property landing in
 * `apps/account/app/(account)/property/page.tsx`, which loads the
 * viewer's saved-listing shortlist with
 * `apps/account/lib/property-module.ts` (`getSavedPropertiesForUser`)
 * and their property activity with
 * `apps/account/lib/division-data.ts` (`getDivisionActivity`), then
 * aggregates both with `propertyStats` / `countByActivity` / `heroState`
 * from `apps/account/components/property/helpers.ts`.
 *
 * Those modules live behind the app's `@/` path alias (and the storage
 * read pulls in `@/lib/supabase`), so a workspace package cannot import
 * them directly — mirroring how the marketplace / wallet / care module
 * packages re-issue their reads through `@henryco/data` rather than
 * reaching into `apps/account`. This file therefore ports the
 * *read-only* slice of that pipeline verbatim:
 *   - the same saved-listing storage join (`loadSavedProperties`,
 *     a 1:1 port of `getSavedPropertiesForUser`),
 *   - the same `customer_activity` read scoped to `division = 'property'`
 *     (limit 20, the page's exact bound), and
 *   - the `countByActivity` / `propertyStats` / `heroState` taxonomy
 *     verbatim from `components/property/helpers.ts`.
 *
 * No writes happen here — home widgets read existing API/DB only. The
 * numbers the widgets render are the real per-viewer aggregates;
 * nothing is fabricated.
 */

/* ------------------------------------------------------------------ *
 * Quick actions (shared by the command palette + deep links)
 * ------------------------------------------------------------------ */

/**
 * The palette groups a quick action may belong to. A strict subset of
 * the shell's `PaletteGroupLabel` so the module can map 1:1 without a
 * lossy cast.
 */
export type QuickActionGroup = "Open" | "Create" | "Search";

/**
 * One deep-linkable action the property module offers. Consumed by the
 * command palette so labels, hrefs, and keywords stay in one place.
 */
export type QuickAction = {
  /** Stable id, namespaced by module slug (e.g. `property.saved`). */
  id: string;
  /** Visible label. */
  label: string;
  /** One-line description. */
  description: string;
  /** Destination — a real, live route in the account shell. */
  href: string;
  /** Which palette group this action sorts into. */
  group: QuickActionGroup;
  /** Fuzzy-match keywords. Label-first by convention. */
  keywords: ReadonlyArray<string>;
};

/** The live top-level surface this module routes to. */
export const PROPERTY_HOME_HREF = "/property";

/** The live saved-shortlist surface in the account shell. */
export const PROPERTY_SAVED_HREF = "/property/saved";

/**
 * The property module's quick actions. `browse` opens the public
 * property catalogue on the property division origin; the others land on
 * the live `/property` + `/property/saved` account surfaces so a clicked
 * action never 404s.
 */
export function getPropertyQuickActions(): ReadonlyArray<QuickAction> {
  return [
    {
      id: "property.browse",
      label: "Browse listings",
      description: "Discover homes and spaces for rent or sale.",
      href: getDivisionUrl("property"),
      group: "Search",
      keywords: ["property", "listings", "homes", "rent", "buy"],
    },
    {
      id: "property.saved",
      label: "Saved properties",
      description: "Revisit the listings you saved.",
      href: PROPERTY_SAVED_HREF,
      group: "Open",
      keywords: ["saved", "favourites", "shortlist", "bookmarks"],
    },
    {
      id: "property.overview",
      label: "Property overview",
      description: "Inquiries, viewings, and your listings in one place.",
      href: PROPERTY_HOME_HREF,
      group: "Open",
      keywords: ["property", "inquiries", "viewings", "listings", "overview"],
    },
  ];
}

/* ------------------------------------------------------------------ *
 * Stat taxonomy — verbatim from components/property/helpers.ts
 * ------------------------------------------------------------------ */

/**
 * Count activity rows whose `activity_type` is in `activityTypes`.
 * Verbatim from `components/property/helpers.ts:countByActivity`.
 */
export function countByActivity(
  activity: ReadonlyArray<Record<string, unknown>>,
  activityTypes: ReadonlyArray<string>,
): number {
  return activity.filter((item) =>
    activityTypes.includes(String(item.activity_type || "")),
  ).length;
}

/** Per-viewer property aggregate. 1:1 with `helpers.ts:PropertyStats`. */
export type PropertyStats = {
  saved: number;
  inquiries: number;
  viewings: number;
  listings: number;
  managed: number;
  total: number;
};

/**
 * Aggregate the saved-listing count and activity counts into the
 * property stat tiles. Verbatim from `helpers.ts:propertyStats`.
 */
export function propertyStats(
  saved: number,
  inquiries: number,
  viewings: number,
  listings: number,
  managed: number,
): PropertyStats {
  return {
    saved,
    inquiries,
    viewings,
    listings,
    managed,
    total: saved + inquiries + viewings + listings,
  };
}

export type HeroState = "empty" | "discover" | "active";

/** Derive the hero mood from the stats. Verbatim from `helpers.ts:heroState`. */
export function heroState(stats: PropertyStats): HeroState {
  if (stats.total === 0) return "empty";
  if (stats.inquiries > 0 || stats.viewings > 0) return "active";
  return "discover";
}

/* ------------------------------------------------------------------ *
 * Saved-listing storage join (read-only port of property-module.ts)
 * ------------------------------------------------------------------ */

type DataClient = ReturnType<typeof createDataAdminClient>;

const PROPERTY_RUNTIME_BUCKET = "property-runtime";

type PropertySavedRecord = {
  id: string;
  userId: string;
  listingId: string;
  createdAt: string;
};

type PropertyListingRecord = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  kind: string;
  status: string;
  locationLabel: string;
  district: string;
  price: number;
  currency: string;
  priceInterval: string;
  heroImage: string;
  managedByHenryCo: boolean;
  featured: boolean;
  promoted: boolean;
  bedrooms: number | null;
  bathrooms: number | null;
  sizeSqm: number | null;
  updatedAt: string;
};

/**
 * The read-only projection of a saved listing the widgets render. A
 * strict subset of `property-module.ts:SavedPropertyCard`.
 */
export type PropertySavedListing = {
  saveId: string;
  savedAt: string;
  listingId: string;
  slug: string;
  title: string;
  location: string;
  district: string;
  kind: string;
  status: string;
  price: number;
  currency: string;
  priceInterval: string;
  managedByHenryCo: boolean;
  detailUrl: string;
};

export type PropertySnapshot = {
  stats: PropertyStats;
  hero: HeroState;
  /** Most recently saved listings (newest first), capped for the widget. */
  saved: ReadonlyArray<PropertySavedListing>;
};

/**
 * List + parse every JSON object in a `property-runtime` folder.
 * Verbatim from `property-module.ts:listJsonCollection`.
 */
async function listJsonCollection<T>(client: DataClient, folder: string): Promise<T[]> {
  const { data: files } = await client.storage.from(PROPERTY_RUNTIME_BUCKET).list(folder, {
    limit: 500,
    sortBy: { column: "name", order: "asc" },
  });

  const jsonFiles = (files ?? []).filter((file) => file.name.endsWith(".json"));
  const results = await Promise.all(
    jsonFiles.map(async (file) => {
      const { data } = await client.storage
        .from(PROPERTY_RUNTIME_BUCKET)
        .download(`${folder}/${file.name}`);
      if (!data) return null;
      try {
        return JSON.parse(await data.text()) as T;
      } catch {
        return null;
      }
    }),
  );

  return results.filter(Boolean) as T[];
}

/**
 * The viewer's saved listings, joined against the listing catalogue.
 * Read-only port of `property-module.ts:getSavedPropertiesForUser`.
 */
async function loadSavedProperties(
  client: DataClient,
  userId: string,
): Promise<PropertySavedListing[]> {
  const [savedRecords, listings] = await Promise.all([
    listJsonCollection<PropertySavedRecord>(client, "saved-listings"),
    listJsonCollection<PropertyListingRecord>(client, "listings"),
  ]);

  const listingMap = new Map(listings.map((listing) => [listing.id, listing]));
  const origin = getDivisionUrl("property");

  return savedRecords
    .filter((record) => record.userId === userId)
    .map((record) => {
      const listing = listingMap.get(record.listingId);
      if (!listing) return null;
      return {
        saveId: record.id,
        savedAt: record.createdAt,
        listingId: listing.id,
        slug: listing.slug,
        title: listing.title,
        location: listing.locationLabel,
        district: listing.district,
        kind: listing.kind,
        status: listing.status,
        price: listing.price,
        currency: listing.currency || "NGN",
        priceInterval: listing.priceInterval,
        managedByHenryCo: listing.managedByHenryCo,
        detailUrl: `${origin}/property/${listing.slug}`,
      } satisfies PropertySavedListing;
    })
    .filter((row): row is PropertySavedListing => row !== null)
    .sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
}

/**
 * The viewer's recent property activity. Mirrors
 * `division-data.ts:getDivisionActivity(userId, 'property', 20)` — the
 * exact division + limit the page reads (the counts below are
 * locale-independent, so no localization pass is needed here).
 */
async function loadPropertyActivity(
  client: DataClient,
  userId: string,
): Promise<Array<Record<string, unknown>>> {
  const { data } = await client
    .from("customer_activity")
    .select("activity_type")
    .eq("user_id", userId)
    .eq("division", "property")
    .order("created_at", { ascending: false })
    .limit(20);
  return (data ?? []) as Array<Record<string, unknown>>;
}

/**
 * Build the property snapshot for the current viewer. Returns null when
 * the viewer is not a customer-context viewer (owner / staff lanes that
 * don't carry a customer property surface). The eligibility gate in
 * `getRoleGate` is broader (any customer-surface viewer) — this null is
 * the data-layer guard, matching the wallet / marketplace / care modules.
 */
export async function loadPropertySnapshot(
  viewer: UnifiedViewer,
): Promise<PropertySnapshot | null> {
  if (viewer.kind !== "customer") return null;

  const client = createDataAdminClient();
  const userId = viewer.user.id;

  const [savedListings, activity] = await Promise.all([
    loadSavedProperties(client, userId),
    loadPropertyActivity(client, userId),
  ]);

  const inquiries = countByActivity(activity, ["property_inquiry"]);
  const viewings = countByActivity(activity, ["property_viewing_requested"]);
  const listings = countByActivity(activity, [
    "property_listing_submitted",
    "property_listing_updated",
    "property_listing_reviewed",
  ]);
  const managed = savedListings.filter((listing) => listing.managedByHenryCo).length;

  const stats = propertyStats(
    savedListings.length,
    inquiries,
    viewings,
    listings,
    managed,
  );

  return {
    stats,
    hero: heroState(stats),
    saved: savedListings.slice(0, 6),
  };
}
