/**
 * Cross-division search type system.
 *
 * Two layers:
 *
 *   1. Indexed-entity layer (Typesense). Collections defined in `./collections`.
 *      Each entity in HenryCo (a marketplace product, a property listing, a job
 *      posting, a workflow target...) writes a `SearchDocument` to Typesense.
 *
 *   2. Catalog layer (in-memory). The existing `@henryco/intelligence`
 *      `CrossDivisionSearchResult` static catalog still drives navigation /
 *      help-route results. Search-core merges both into a single ranked
 *      result list at query time. We do NOT migrate the catalog into
 *      Typesense — it changes with deploys, not with business state, so
 *      keeping it in code keeps the index small and migrations boring.
 *
 * The `division` and `type` enums extend the intelligence types so that
 * downstream code (ranking, UI badges, deep-link routing) does not need to
 * know which layer a result came from.
 */

import type {
  CrossDivisionSearchDivision,
  CrossDivisionSearchIcon,
  CrossDivisionSearchResult,
  CrossDivisionSearchType,
} from "@henryco/intelligence";

export type SearchDivision = CrossDivisionSearchDivision;
export type SearchType = CrossDivisionSearchType;
export type SearchIcon = CrossDivisionSearchIcon;

export type TrustState =
  | "unknown"
  | "unverified"
  | "pending_review"
  | "verified"
  | "premium_verified"
  | "restricted"
  | "frozen"
  | "archived"
  | "closed"
  | "deleted";

/**
 * The role bucket used for filtering. We deliberately do NOT mirror the
 * full HenryCo role taxonomy here — the index only needs to know who is
 * allowed to retrieve a document. Role resolution at query time happens
 * in `./role`.
 */
export type SearchRoleVisibility =
  | "public" // anyone, signed-in or not
  | "authenticated" // any signed-in user
  | "owner" // the user who owns the entity (filter by owner_user_id)
  | "staff" // any staff in the entity's division
  | "staff_owner" // staff with owner-tier access
  | "platform_owner"; // HenryCo HQ

export type SearchUrgency = "none" | "low" | "normal" | "high" | "critical";

export interface RankingSignals {
  /** Non-recency popularity. Implementation-defined per collection. 0-1. */
  popularity?: number;
  /** Negative=archived/closed, positive=highlighted. -1..+1. */
  promotion?: number;
  /** Workflow staleness; only set on hc_workflows. 0-1, higher=more urgent. */
  workflow_urgency?: number;
}

/**
 * Canonical shape for a Typesense document.
 *
 * Indexers must produce this shape. Indexed FIELDS are also defined in
 * `./collections` so that the Typesense API receives the matching schema.
 */
export interface SearchDocument {
  /** `${division}:${type}:${entity_id}` — globally unique across collections. */
  id: string;
  type: SearchType;
  division: SearchDivision;
  title: string;
  summary: string;
  /** Absolute deep-link URL. Always resolved through @henryco/config helpers. */
  deep_link: string;
  /**
   * Roles permitted to retrieve this document. Multi-valued so the same
   * entity can be visible to e.g. ["public", "staff"]. Filter logic in
   * `./role` evaluates against the requesting user's resolved roles.
   */
  role_visibility: SearchRoleVisibility[];
  trust_state: TrustState;
  /** When this row was created in source-of-truth, unix seconds. */
  created_at: number;
  /** Last update unix seconds. */
  updated_at: number;
  /** Numeric ranking signals — see `RankingSignals`. Stored on the document. */
  ranking_signals: RankingSignals;
  /** Tags for tag-equality boosts. */
  tags: string[];
  /** Optional badge label for the result card. */
  badge?: string;
  /** Optional icon hint, mirrors intelligence icons. */
  icon?: SearchIcon;
  /**
   * Owner user_id, if the document represents user-scoped content
   * (carts, support threads, notifications, workflow targets). Filtered
   * server-side; never exposed in client hits unless the requester IS
   * the owner.
   */
  owner_user_id?: string;
  /** For staff-only collections, the division/role bucket the staff scope is keyed by. */
  staff_scope?: string;
}

/**
 * Workflow document — synthetic action target. NOT a representation of an
 * entity, but of "user X has Y to do at Z URL". Updated by sub-systems as
 * state warrants. The differentiator that turns search into a nervous system.
 */
export interface WorkflowDocument extends SearchDocument {
  type: "workflow";
  /** REQUIRED. Workflow targets are always per-user. */
  owner_user_id: string;
  /** Free-form short verb-phrase, e.g. "Resume cart", "Confirm care booking". */
  cta_label: string;
  /** Optional ISO date string the workflow becomes overdue. */
  due_at?: string;
}

/**
 * The unified result returned by `searchAcrossDivisions()` to UI callers.
 *
 * It mirrors `CrossDivisionSearchResult` so the existing
 * `CrossDivisionSearchExperience` component can render it without changes.
 */
export interface UnifiedSearchResult extends CrossDivisionSearchResult {
  /** Where this result came from — index, catalog, or workflow synthetic. */
  resolution: "indexed" | "catalog" | "workflow";
  /** Final ranking score after all boosts; useful for telemetry. */
  score: number;
}

export interface SearchInput {
  query: string;
  user_id?: string;
  /** Resolved role bundle. If absent, treat as anonymous public. */
  role_visibility?: SearchRoleVisibility[];
  /** User's primary division for ranking boost. */
  primary_division?: SearchDivision;
  /** Restrict to these collections. */
  collections?: string[];
  /** Restrict to these divisions. */
  divisions_filter?: SearchDivision[];
  limit?: number;
  cursor?: string;
}

export interface SearchOutput {
  query: string;
  hits: UnifiedSearchResult[];
  /** Cursor for next page; null when no more. */
  next_cursor: string | null;
  /** Total candidate count before limit. -1 if unknown (catalog-only). */
  total: number;
  /** Per-collection counts for filter sidebar. */
  facets: Record<string, number>;
  /** Time taken in ms (server-side). */
  took_ms: number;
}
