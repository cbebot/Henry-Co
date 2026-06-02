/**
 * Hub /search — shared pure logic (no React, no "use client").
 *
 * Imported by BOTH the server page (SSR seed / no-JS fallback) and the client
 * instrument, so the curated browse set, scope filtering, sorting, and ranking
 * are identical on the server's first paint and the client's hydration. Keeping
 * this free of hooks and DOM lets the server render real results before any
 * JavaScript runs, then the client upgrades the same arrangement to live search.
 */

import {
  searchCrossDivisionResults,
  type CrossDivisionSearchResult,
  type CrossDivisionSearchDivision,
} from "@henryco/intelligence";

/**
 * A result that may originate from the live Typesense index (UnifiedSearchResult,
 * which adds `resolution` + `score`) or the in-memory catalog. We render against
 * the common shape and treat the two extra fields as optional.
 */
export type SearchHit = CrossDivisionSearchResult & {
  resolution?: "indexed" | "catalog" | "workflow";
  score?: number;
};

/** Wire shape of GET /api/search (apps/hub/app/api/search/route.ts → SearchOutput). */
export type SearchApiResponse = {
  query: string;
  hits: SearchHit[];
  next_cursor: string | null;
  total: number;
  facets: Record<string, number>;
  took_ms: number;
};

export type Scope = CrossDivisionSearchDivision | "all";
export type SortMode = "relevance" | "recent" | "urgency";

/** Display order — operating, customer-facing divisions lead; account/staff tail. */
export const DIVISION_ORDER: ReadonlyArray<CrossDivisionSearchDivision> = [
  "hub",
  "marketplace",
  "property",
  "jobs",
  "learn",
  "care",
  "logistics",
  "studio",
  "account",
  "staff",
];

export const VALID_DIVISIONS = new Set<string>(DIVISION_ORDER);

export type DivisionMeta = {
  label: string;
  /** Decorative accent (dot / pill tint). Static config ramp `accent`. */
  accent: string;
  /** AA-safe text sibling of the accent (config ramp `accentText`). */
  accentText: string;
  /** Icon token resolved to a lucide component in the client. */
  icon: IconToken;
};

/**
 * Per-division identity. The hit `division` union is broader than the config
 * `DivisionKey` (it includes `account` + `staff`), so this map — not
 * `getDivisionConfig` — is the single source for tinting + labels here.
 * Accent values mirror the canonical static ramp in packages/config/company.ts.
 */
export const DIVISION_META: Record<CrossDivisionSearchDivision, DivisionMeta> = {
  hub: { label: "Hub", accent: "#C9A227", accentText: "#E8C24F", icon: "compass" },
  account: { label: "Account", accent: "#C9A227", accentText: "#E8C24F", icon: "wallet" },
  care: { label: "Fabric Care", accent: "#6B7CFF", accentText: "#9AA6FF", icon: "life-buoy" },
  marketplace: { label: "Marketplace", accent: "#B2863B", accentText: "#D7B36B", icon: "shopping-bag" },
  property: { label: "Property", accent: "#B06C3E", accentText: "#D79B72", icon: "building" },
  logistics: { label: "Logistics", accent: "#D06F32", accentText: "#E8A271", icon: "truck" },
  studio: { label: "Studio", accent: "#4AC1C5", accentText: "#7FDADD", icon: "palette" },
  jobs: { label: "Jobs", accent: "#2BB7C2", accentText: "#5FD6DE", icon: "briefcase" },
  learn: { label: "Learn", accent: "#3C8C7A", accentText: "#6FBFA9", icon: "graduation-cap" },
  staff: { label: "Staff HQ", accent: "#9CA3AF", accentText: "#C5CBD3", icon: "users" },
};

/** The 22-member icon union + division tokens we resolve to lucide on the client. */
export type IconToken =
  | "compass"
  | "building"
  | "sparkles"
  | "shopping-bag"
  | "briefcase"
  | "graduation-cap"
  | "truck"
  | "palette"
  | "wallet"
  | "bell"
  | "receipt"
  | "life-buoy"
  | "shield"
  | "settings"
  | "message-square"
  | "map-pin"
  | "package"
  | "search"
  | "layout-dashboard"
  | "file-text"
  | "users"
  | "headphones";

export function divisionMeta(division: string): DivisionMeta {
  return (
    DIVISION_META[division as CrossDivisionSearchDivision] ?? {
      label: division ? division.charAt(0).toUpperCase() + division.slice(1) : "Henry & Co.",
      accent: "#C9A227",
      accentText: "#E8C24F",
      icon: "search",
    }
  );
}

export function scopeFilter(hits: SearchHit[], scope: Scope): SearchHit[] {
  if (scope === "all") return hits;
  return hits.filter((hit) => hit.division === scope);
}

/**
 * Browse mode (no query): a curated cross-division "start here" set. Top routes
 * per division by authored priority, capped so no single division dominates.
 */
export function curatedBrowse(
  catalog: SearchHit[],
  scope: Scope,
  perDivisionCap = 6,
): SearchHit[] {
  const pool = scopeFilter(catalog, scope);
  const byPriority = [...pool].sort((a, b) => b.priority - a.priority);
  const out: SearchHit[] = [];
  const seen = new Set<string>();
  for (const division of DIVISION_ORDER) {
    let taken = 0;
    for (const hit of byPriority) {
      if (taken >= perDivisionCap) break;
      if (hit.division !== division) continue;
      out.push(hit);
      seen.add(hit.id);
      taken += 1;
    }
  }
  // Any divisions outside DIVISION_ORDER fall through here.
  for (const hit of byPriority) {
    if (!seen.has(hit.id)) out.push(hit);
  }
  return out;
}

/** Client-side fallback ranking when the live index is empty/unavailable. */
export function rankCatalog(
  catalog: SearchHit[],
  scope: Scope,
  query: string,
  limit = 40,
): SearchHit[] {
  const pool = scopeFilter(catalog, scope);
  return searchCrossDivisionResults(pool, query, { limit }).map((entry) => entry.result);
}

function updatedAtValue(hit: SearchHit): number {
  const raw = hit.metadata?.updated_at;
  if (typeof raw === "number") return raw;
  if (typeof raw === "string") {
    const parsed = Date.parse(raw);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

/** Stable sort that preserves the engine's relevance order as the tiebreak. */
export function sortHits(hits: SearchHit[], sort: SortMode): SearchHit[] {
  if (sort === "relevance") return hits;
  const decorated = hits.map((hit, index) => ({ hit, index }));
  decorated.sort((a, b) => {
    if (sort === "recent") {
      const delta = updatedAtValue(b.hit) - updatedAtValue(a.hit);
      if (delta !== 0) return delta;
    } else if (sort === "urgency") {
      const delta = b.hit.priority - a.hit.priority;
      if (delta !== 0) return delta;
    }
    return a.index - b.index;
  });
  return decorated.map((entry) => entry.hit);
}

export type ResultSection = {
  division: CrossDivisionSearchDivision | null;
  label: string;
  items: SearchHit[];
};

/**
 * Arrange results for display. Query mode → one ranked feed. Browse mode →
 * grouped by division in DIVISION_ORDER. Returns both the sections (for render)
 * and a flat list in visual order (for keyboard navigation), so the two never
 * drift out of sync.
 */
export function arrangeResults(
  hits: SearchHit[],
  options: { queryActive: boolean; sort: SortMode; perDivisionCap?: number },
): { sections: ResultSection[]; flat: SearchHit[] } {
  const sorted = sortHits(hits, options.sort);

  if (options.queryActive) {
    return {
      sections: [{ division: null, label: "Top matches", items: sorted }],
      flat: sorted,
    };
  }

  const grouped = new Map<CrossDivisionSearchDivision, SearchHit[]>();
  for (const hit of sorted) {
    const list = grouped.get(hit.division) ?? [];
    list.push(hit);
    grouped.set(hit.division, list);
  }

  const cap = options.perDivisionCap ?? Infinity;
  const sections: ResultSection[] = [];
  const flat: SearchHit[] = [];
  const ordered = [...grouped.keys()].sort((a, b) => {
    const ai = DIVISION_ORDER.indexOf(a);
    const bi = DIVISION_ORDER.indexOf(b);
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  });
  for (const division of ordered) {
    const items = (grouped.get(division) ?? []).slice(0, cap);
    if (!items.length) continue;
    sections.push({ division, label: divisionMeta(division).label, items });
    flat.push(...items);
  }
  return { sections, flat };
}

/** Divisions present in a result set, in canonical order (for scope chips). */
export function presentDivisions(hits: SearchHit[]): CrossDivisionSearchDivision[] {
  const counts = new Map<CrossDivisionSearchDivision, number>();
  for (const hit of hits) counts.set(hit.division, (counts.get(hit.division) ?? 0) + 1);
  return [...counts.keys()].sort((a, b) => {
    const ai = DIVISION_ORDER.indexOf(a);
    const bi = DIVISION_ORDER.indexOf(b);
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  });
}

export function divisionCounts(hits: SearchHit[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const hit of hits) counts[hit.division] = (counts[hit.division] ?? 0) + 1;
  return counts;
}

/** Strip protocol for the mono destination line, keep host + short path. */
export function displayHost(url: string): string {
  return url.replace(/^https?:\/\//i, "").replace(/\/$/, "");
}

/**
 * Verb-first, ≤60-char error copy. Never leaks status codes. The live route
 * almost always returns 200-empty, so this mainly covers network/abort/parse
 * and the rate-limit facet — but we keep the full map for resilience.
 */
export function humaniseError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("429") || m.includes("rate")) return "Too many searches — slow down a moment.";
  if (m.includes("401") || m.includes("403")) return "Your session expired. Refresh the page.";
  if (m.includes("5") && (m.includes("http_5") || m.includes("500") || m.includes("502") || m.includes("503")))
    return "Our search service is reconnecting.";
  if (m.includes("network") || m.includes("fetch") || m.includes("failed")) return "Check your connection, then retry.";
  return "Something interrupted the search. Try again.";
}

/** Example prompts surfaced on the empty state to teach the system. */
export const EXAMPLE_PROMPTS: ReadonlyArray<string> = [
  "marketplace orders",
  "track a delivery",
  "book a care pickup",
  "wallet withdrawal",
  "property viewings",
  "interview prep",
  "verify a certificate",
  "studio project",
];

/** Cycling placeholder hints (rotated client-side) so the field teaches itself. */
export const PLACEHOLDER_HINTS: ReadonlyArray<string> = [
  "Search Henry & Co. — divisions, orders, tracking, help…",
  "Try “marketplace orders” or “track a delivery”",
  "Try “book a care pickup” or “wallet withdrawal”",
  "Try “property viewings” or “verify a certificate”",
];
