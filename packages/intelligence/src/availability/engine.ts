/**
 * V3-38 — the local-availability resolver (Phase E, Wave E.2).
 *
 * A deterministic, DB-less engine over INJECTED coverage rows — structurally
 * the V3-36 pattern applied to geography. Four load-bearing properties:
 *
 *   1. DETERMINISTIC FLOOR. The engine only ever narrows what the caller's
 *      injected coverage reader returned. No AI, no scoring model, no
 *      profiling signal — the same inputs always resolve the same way.
 *   2. FAILS SAFE TO "UNKNOWN". A failed coverage read (null), a missing
 *      location, or an entirely unseeded division all resolve to `unknown`,
 *      and `unknown` renders NOTHING — never a false "not available here"
 *      (the BUILD-PLAN soak note: a flood of unavailable means missing rows,
 *      not a broken resolver — so no-data must be distinguishable from
 *      data-says-no).
 *   3. OPAQUE AT THE BOUNDARY (ANTI-CLONE Principle 1 / PRIVACY-NDPR §5.4).
 *      `provider_count` is used internally to admit a match and derive the
 *      `limited` tier; the public `OfferingAvailability` carries only status
 *      + matched-scope CODES — never a numeric count, never a coverage row.
 *   4. NO TABLE ACCESS / LOCATION-KEYED, NEVER USER-KEYED (PRIVACY-NDPR §1).
 *      The engine reads nothing itself; coverage rows and the viewer's coarse
 *      location are injected by the caller. There is no per-user input beyond
 *      the location, so there is no cross-user row to leak by construction.
 */

/** How specific the winning coverage row was. A CODE, not a score. */
export type AvailabilityScope = "city" | "region" | "country" | "none";

/**
 * The public availability tier. `unknown` means "we cannot say" (no coverage
 * data / no resolvable location) and MUST render nothing — only `unavailable`
 * may render a "not here yet" state, because only it is backed by real
 * coverage rows that exclude the viewer's area.
 */
export type AvailabilityStatus = "available" | "limited" | "unavailable" | "unknown";

export type AvailabilityLocationSource = "saved_address" | "ip_approximate";

/**
 * The viewer's coarse resolved location. City is only ever present when it
 * came from the viewer's OWN saved address (never from IP inference — the
 * PRIVACY-NDPR §1 coarse/advisory rule).
 */
export interface AvailabilityLocation {
  /** ISO-3166-1 alpha-2, uppercase. */
  country: string;
  region?: string | null;
  city?: string | null;
  source: AvailabilityLocationSource;
}

/** A `service_area_coverage` row as the injected reader returns it. */
export interface ServiceAreaCoverageRow {
  division: string;
  offeringKey: string;
  /** ISO-3166-1 alpha-2, uppercase. */
  country: string;
  /** null = the row covers the whole country. */
  region: string | null;
  /** null = the row covers the whole region. */
  city: string | null;
  /** Server-only. Admits a match (> 0) and derives `limited`. Never public. */
  providerCount: number;
  isActive: boolean;
}

/** The client-safe, opaque per-offering result. No numbers, no rows. */
export interface OfferingAvailability {
  offeringKey: string;
  status: AvailabilityStatus;
  matchedScope: AvailabilityScope;
}

export interface AvailabilityBatchResult {
  results: Record<string, OfferingAvailability>;
  /** Aggregate counts for telemetry — never per-offering internals. */
  summary: {
    requested: number;
    available: number;
    limited: number;
    unavailable: number;
    unknown: number;
  };
}

export interface ResolveAvailabilityBatchInput {
  division: string;
  offeringKeys: string[];
  /** null = no resolvable viewer location — everything resolves `unknown`. */
  location: AvailabilityLocation | null;
  /**
   * Injected coverage rows for the division. `null` signals the read FAILED
   * (table absent on prod, transient error) — everything resolves `unknown`.
   * An empty array with zero active division rows also resolves `unknown`
   * (unseeded division, honesty rule 2 above).
   */
  coverage: ServiceAreaCoverageRow[] | null;
  /**
   * `limited` tier cut-off: a match whose summed provider count is BELOW this
   * resolves `limited` instead of `available`. Default 0 = disabled (today's
   * honest seed is company-operated single-provider coverage; V3-50's
   * per-provider rows give this option real meaning).
   */
  limitedBelowProviderCount?: number;
}

/** Normalize an area name for matching: case/whitespace-insensitive, and a
 *  trailing " state" (the common Nigerian form) never breaks a match. */
export function normalizeAreaName(value: string | null | undefined): string | null {
  if (typeof value !== "string") return null;
  const collapsed = value.trim().toLowerCase().replace(/\s+/g, " ");
  if (!collapsed) return null;
  return collapsed.replace(/ state$/u, "");
}

function areaEquals(a: string | null | undefined, b: string | null | undefined): boolean {
  const left = normalizeAreaName(a);
  const right = normalizeAreaName(b);
  return left !== null && right !== null && left === right;
}

function toUnknown(offeringKey: string): OfferingAvailability {
  return { offeringKey, status: "unknown", matchedScope: "none" };
}

/**
 * Resolve one offering against the division's active coverage rows,
 * most-specific-first: exact city row → region row (city null) → country row
 * (region + city null) → none. A match requires `is_active` and
 * `provider_count > 0` (enforced by the candidate filter).
 */
function resolveOffering(
  offeringKey: string,
  rows: ServiceAreaCoverageRow[],
  location: AvailabilityLocation,
  limitedBelow: number,
): OfferingAvailability {
  const candidates = rows.filter(
    (row) =>
      row.offeringKey === offeringKey &&
      typeof row.country === "string" &&
      row.country.toUpperCase() === location.country,
  );
  if (candidates.length === 0) {
    return { offeringKey, status: "unavailable", matchedScope: "none" };
  }

  // Most-specific-first. City rows may carry their region; when both sides
  // have a region it must agree (a "Enugu city" row in another state never
  // matches), but a null on either side does not block the city match.
  const cityRows = location.city
    ? candidates.filter(
        (row) =>
          row.city !== null &&
          areaEquals(row.city, location.city) &&
          (row.region === null || !location.region || areaEquals(row.region, location.region)),
      )
    : [];
  const regionRows =
    location.region && cityRows.length === 0
      ? candidates.filter(
          (row) => row.city === null && row.region !== null && areaEquals(row.region, location.region),
        )
      : [];
  const countryRows =
    cityRows.length === 0 && regionRows.length === 0
      ? candidates.filter((row) => row.city === null && row.region === null)
      : [];

  const matched = cityRows.length > 0 ? cityRows : regionRows.length > 0 ? regionRows : countryRows;
  const matchedScope: AvailabilityScope =
    cityRows.length > 0 ? "city" : regionRows.length > 0 ? "region" : countryRows.length > 0 ? "country" : "none";

  if (matched.length === 0) {
    return { offeringKey, status: "unavailable", matchedScope: "none" };
  }

  const providerCount = matched.reduce((sum, row) => sum + Math.max(0, row.providerCount), 0);
  const status: AvailabilityStatus =
    limitedBelow > 0 && providerCount < limitedBelow ? "limited" : "available";
  // The numeric providerCount stops HERE — only the status tier leaves.
  return { offeringKey, status, matchedScope };
}

/**
 * Resolve a batch of offerings for one division + one coarse viewer location.
 * Pure and total: never throws, never returns a numeric provider count.
 */
export function resolveAvailabilityBatch(
  input: ResolveAvailabilityBatchInput,
): AvailabilityBatchResult {
  const offeringKeys = [...new Set(input.offeringKeys)];
  const results: Record<string, OfferingAvailability> = {};

  // Candidate floor: active rows with real providers, for THIS division only.
  const activeRows = (input.coverage ?? []).filter(
    (row) => row.division === input.division && row.isActive && row.providerCount > 0,
  );

  const unknownAll =
    input.coverage === null || input.location === null || activeRows.length === 0;

  for (const offeringKey of offeringKeys) {
    results[offeringKey] = unknownAll
      ? toUnknown(offeringKey)
      : resolveOffering(
          offeringKey,
          activeRows,
          input.location as AvailabilityLocation,
          input.limitedBelowProviderCount ?? 0,
        );
  }

  const summary = {
    requested: offeringKeys.length,
    available: 0,
    limited: 0,
    unavailable: 0,
    unknown: 0,
  };
  for (const key of offeringKeys) {
    summary[results[key].status] += 1;
  }

  return { results, summary };
}
