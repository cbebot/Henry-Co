import type { PropertyListing } from "@/lib/property/types";

export const PROPERTY_SEARCH_SORTS = [
  "recommended",
  "latest",
  "price_asc",
  "price_desc",
  "trust_desc",
] as const;

export type PropertySearchSort = (typeof PROPERTY_SEARCH_SORTS)[number];

export type PropertySearchState = {
  q: string;
  kind: string;
  area: string;
  managed: boolean;
  furnished: boolean;
  sort: PropertySearchSort;
};

export const DEFAULT_PROPERTY_SEARCH_STATE: PropertySearchState = {
  q: "",
  kind: "",
  area: "",
  managed: false,
  furnished: false,
  sort: "recommended",
};

function readValue(
  input: URLSearchParams | Record<string, string | string[] | undefined>,
  key: string
) {
  if (input instanceof URLSearchParams) {
    return input.get(key) || "";
  }

  const raw = input[key];
  return Array.isArray(raw) ? raw[0] || "" : raw || "";
}

function normalizeSort(value: string): PropertySearchSort {
  return PROPERTY_SEARCH_SORTS.includes(value as PropertySearchSort)
    ? (value as PropertySearchSort)
    : DEFAULT_PROPERTY_SEARCH_STATE.sort;
}

export function parsePropertySearchState(
  input: URLSearchParams | Record<string, string | string[] | undefined>
): PropertySearchState {
  return {
    q: String(readValue(input, "q")).trim(),
    kind: String(readValue(input, "kind")).trim().toLowerCase(),
    area: String(readValue(input, "area")).trim().toLowerCase(),
    managed: String(readValue(input, "managed")).trim() === "1",
    furnished: String(readValue(input, "furnished")).trim() === "1",
    sort: normalizeSort(String(readValue(input, "sort")).trim().toLowerCase()),
  };
}

export function buildPropertySearchHref(
  state: Partial<PropertySearchState> | PropertySearchState
) {
  const next = new URLSearchParams();
  const resolved = {
    ...DEFAULT_PROPERTY_SEARCH_STATE,
    ...state,
  };

  if (resolved.q.trim()) next.set("q", resolved.q.trim());
  if (resolved.kind.trim()) next.set("kind", resolved.kind.trim());
  if (resolved.area.trim()) next.set("area", resolved.area.trim());
  if (resolved.managed) next.set("managed", "1");
  if (resolved.furnished) next.set("furnished", "1");
  if (resolved.sort !== DEFAULT_PROPERTY_SEARCH_STATE.sort) {
    next.set("sort", resolved.sort);
  }

  const query = next.toString();
  return query ? `/search?${query}` : "/search";
}

function listingSearchHaystack(listing: PropertyListing) {
  return [
    listing.title,
    listing.summary,
    listing.description,
    listing.locationLabel,
    listing.district,
    listing.addressLine,
    ...listing.amenities,
    ...listing.trustBadges,
    ...listing.verificationNotes,
  ]
    .join(" ")
    .toLowerCase();
}

function recommendedScore(listing: PropertyListing) {
  let score = 0;
  if (listing.managedByHenryCo) score += 18;
  if (listing.featured) score += 10;
  if (listing.promoted) score += 8;
  if (listing.furnished) score += 2;
  if (listing.availableNow) score += 4;
  score += Math.max(0, 100 - Number(listing.riskScore || 0)) / 10;
  score += Number(new Date(listing.listedAt || listing.updatedAt || 0).getTime()) / 1_000_000_000_000;
  return score;
}

function trustScore(listing: PropertyListing) {
  let score = 0;
  if (listing.managedByHenryCo) score += 20;
  score += Math.max(0, 100 - Number(listing.riskScore || 0));
  score += listing.trustBadges.length * 4;
  score += listing.verificationNotes.length * 2;
  if (listing.featured) score += 6;
  if (listing.promoted) score += 4;
  return score;
}

function sortListings(listings: PropertyListing[], sort: PropertySearchSort) {
  switch (sort) {
    case "latest":
      return listings.toSorted(
        (left, right) =>
          new Date(right.listedAt || right.updatedAt || 0).getTime() -
          new Date(left.listedAt || left.updatedAt || 0).getTime()
      );
    case "price_asc":
      return listings.toSorted((left, right) => left.price - right.price);
    case "price_desc":
      return listings.toSorted((left, right) => right.price - left.price);
    case "trust_desc":
      return listings.toSorted((left, right) => trustScore(right) - trustScore(left));
    case "recommended":
    default:
      return listings.toSorted((left, right) => recommendedScore(right) - recommendedScore(left));
  }
}

export function runPropertySearch(
  listings: PropertyListing[],
  input: Partial<PropertySearchState> | PropertySearchState
) {
  const state = {
    ...DEFAULT_PROPERTY_SEARCH_STATE,
    ...input,
  };
  const search = state.q.trim().toLowerCase();

  return sortListings(
    listings.filter((listing) => {
      if (!["published", "approved"].includes(listing.status)) return false;
      if (state.kind && listing.kind !== state.kind) return false;
      if (state.area && listing.locationSlug !== state.area) return false;
      if (state.managed && !listing.managedByHenryCo) return false;
      if (state.furnished && !listing.furnished) return false;
      if (!search) return true;
      return listingSearchHaystack(listing).includes(search);
    }),
    state.sort
  );
}
