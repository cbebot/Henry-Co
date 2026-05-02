/**
 * The single-call search API used by every shell and the /search page.
 *
 * Two corpora are queried in parallel:
 *
 *   1. Typesense `multi_search` over permitted collections.
 *   2. The in-memory `@henryco/intelligence` catalog.
 *
 * Both are scored, merged, and deduplicated. The result is a single
 * ranked list shaped as `UnifiedSearchResult[]` so the existing
 * `CrossDivisionSearchExperience` component can consume it.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getAccountSearchCatalog,
  getAuthenticatedSearchCatalog,
  getHubSearchCatalog,
  getPublicSearchCatalog,
  type CrossDivisionSearchContext,
} from "@henryco/intelligence";

import { COLLECTIONS_BY_NAME, listPermittedCollections } from "./collections";
import { getAdminClient, readTypesenseEnv, type TypesenseEnv } from "./client";
import { checkSearchRateLimit } from "./rate-limit";
import { buildFilterClauses, resolveUserRoles, type RoleResolution } from "./role";
import { searchInputSchema } from "./schema";
import {
  dedupeAndRank,
  scoreCatalog,
  scoreIndexedHit,
  toUnifiedFromCatalog,
  toUnifiedFromIndexed,
} from "./ranking";
import type {
  SearchDocument,
  SearchInput,
  SearchOutput,
  UnifiedSearchResult,
} from "./types";

export interface SearchAcrossDivisionsDeps {
  /** Service-role Supabase client used for role resolution. */
  supabase: SupabaseClient | null;
  typesenseEnv?: TypesenseEnv;
  rateLimitIdentityKey?: string;
  /** Pre-fetched active workflow keys for boost lookup. */
  active_workflow_keys?: ReadonlySet<string>;
  /** Used to drive the catalog selection. Defaults to "public". */
  context?: CrossDivisionSearchContext;
}

const EMPTY_FACETS: Record<string, number> = {};
const EMPTY_OUTPUT_BASE = {
  next_cursor: null as string | null,
  total: 0,
  facets: EMPTY_FACETS,
};

interface MultiSearchResponse {
  results: Array<{
    found: number;
    hits?: Array<{
      document: SearchDocument;
      text_match?: number;
    }>;
    facet_counts?: Array<{ field_name: string; counts: Array<{ value: string; count: number }> }>;
    error?: string;
  }>;
}

export async function searchAcrossDivisions(
  rawInput: SearchInput,
  deps: SearchAcrossDivisionsDeps,
): Promise<SearchOutput> {
  const startedAt = Date.now();
  const parsed = searchInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      query: String(rawInput.query ?? ""),
      hits: [],
      took_ms: Date.now() - startedAt,
      ...EMPTY_OUTPUT_BASE,
    };
  }
  const input = parsed.data;

  // 1. Rate limit
  const identityKey = deps.rateLimitIdentityKey ?? input.user_id ?? "anonymous";
  const rate = await checkSearchRateLimit({ identityKey });
  if (!rate.allowed) {
    return {
      query: input.query,
      hits: [],
      took_ms: Date.now() - startedAt,
      ...EMPTY_OUTPUT_BASE,
      facets: { rate_limited: 1 },
    };
  }

  // 2. Resolve role bundle
  const resolution: RoleResolution =
    rawInput.role_visibility !== undefined
      ? {
          user_id: input.user_id ?? null,
          role_visibility: rawInput.role_visibility,
          is_staff: rawInput.role_visibility.includes("staff") ||
            rawInput.role_visibility.includes("staff_owner") ||
            rawInput.role_visibility.includes("platform_owner"),
          is_platform_owner: rawInput.role_visibility.includes("platform_owner"),
        }
      : await resolveUserRoles(deps.supabase, input.user_id);

  // 3. Pick permitted collections
  let permitted = listPermittedCollections({
    role_visibility: resolution.role_visibility,
    divisions_filter: input.divisions_filter,
  });
  if (input.collections && input.collections.length > 0) {
    const allowedSet = new Set(input.collections);
    permitted = permitted.filter((c) => allowedSet.has(c.name));
  }

  // 4. Build multi_search body
  const indexedHitsPromise = (async () => {
    if (permitted.length === 0) return { hits: [] as UnifiedSearchResult[], facets: {} };

    const env = deps.typesenseEnv ?? readTypesenseEnv();
    if (!env.host || !env.adminApiKey) {
      // No Typesense configured (dev / preview) — degrade to catalog-only.
      return { hits: [] as UnifiedSearchResult[], facets: {} };
    }
    const client = getAdminClient(env);

    const searches = permitted.map((collection) => ({
      collection: collection.name,
      q: input.query || "*",
      query_by: "title,summary,tags,badge",
      filter_by: buildFilterClauses({ collection, resolution }),
      per_page: input.limit,
      facet_by: "type,division",
      sort_by: "_text_match:desc,updated_at:desc",
      // Workflow target boost is applied client-side via scoreIndexedHit.
    }));

    let response: MultiSearchResponse;
    try {
      response = (await client.multiSearch({ searches })) as MultiSearchResponse;
    } catch (error) {
      // Index-side failure must never crash the request — UI degrades to
      // catalog-only and we surface a console warning for ops.
      // eslint-disable-next-line no-console
      console.warn("[search-core] multi_search failed:", error);
      return { hits: [] as UnifiedSearchResult[], facets: {} };
    }

    const hits: UnifiedSearchResult[] = [];
    const facets: Record<string, number> = {};
    response.results.forEach((result, index) => {
      const collection = permitted[index];
      if (!collection) return;
      if (result.error) {
        // eslint-disable-next-line no-console
        console.warn("[search-core] collection error", collection.name, result.error);
        return;
      }
      facets[collection.name] = result.found ?? 0;
      for (const item of result.hits ?? []) {
        const score = scoreIndexedHit({
          hit: { document: item.document, text_match: item.text_match ?? 0, rank: 0 },
          resolution,
          primary_division: input.primary_division,
          active_workflow_keys: deps.active_workflow_keys ?? new Set<string>(),
        });
        hits.push(toUnifiedFromIndexed({ document: item.document, score }));
      }
    });

    return { hits, facets };
  })();

  // 5. Catalog corpus (in parallel)
  const catalogHitsPromise = (async () => {
    const context = deps.context ?? "public";
    const catalog =
      context === "staff"
        ? getAccountSearchCatalog()
        : context === "account"
          ? getAccountSearchCatalog()
          : input.user_id
            ? getHubSearchCatalog({ signedIn: true })
            : getPublicSearchCatalog();

    const filtered = input.divisions_filter
      ? catalog.filter((c) => input.divisions_filter!.includes(c.division))
      : catalog;

    const hits: UnifiedSearchResult[] = [];
    for (const item of filtered) {
      const score = scoreCatalog(item, input.query);
      if (score < 0) continue;
      hits.push(toUnifiedFromCatalog({ catalog: item, score }));
    }
    return hits;
  })();

  const [{ hits: indexedHits, facets }, catalogHits] = await Promise.all([
    indexedHitsPromise,
    catalogHitsPromise,
  ]);

  // 6. Combine, dedupe, rank, paginate
  const ranked = dedupeAndRank([...indexedHits, ...catalogHits]);
  const offset = decodeCursor(input.cursor);
  const slice = ranked.slice(offset, offset + input.limit);
  const next_cursor =
    offset + input.limit < ranked.length ? encodeCursor(offset + input.limit) : null;

  return {
    query: input.query,
    hits: slice,
    next_cursor,
    total: ranked.length,
    facets,
    took_ms: Date.now() - startedAt,
  };
}

function encodeCursor(offset: number): string {
  return Buffer.from(`offset:${offset}`, "utf8").toString("base64url");
}

function decodeCursor(cursor: string | undefined): number {
  if (!cursor) return 0;
  try {
    const decoded = Buffer.from(cursor, "base64url").toString("utf8");
    if (!decoded.startsWith("offset:")) return 0;
    const value = Number(decoded.slice("offset:".length));
    return Number.isFinite(value) && value >= 0 ? Math.floor(value) : 0;
  } catch {
    return 0;
  }
}

/** Unused export retained for future facet expansion. */
export const COLLECTION_FACET_REGISTRY = COLLECTIONS_BY_NAME;
