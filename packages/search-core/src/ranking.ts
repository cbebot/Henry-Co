/**
 * Ranking formula — applied AFTER Typesense returns base text-relevance
 * hits. We boost/penalize each hit using server-known facts (does the
 * user own this? is it in their primary division? is it stale?) and
 * then merge with the in-memory catalog results from
 * `@henryco/intelligence`.
 *
 * Formula (documented in report.md):
 *
 *   final_score = base_relevance
 *               + 0.5  if owner/assignee
 *               + 0.3  if active workflow for user
 *               + 0.2  if primary division
 *               + 0.1  recency (last 30d, decayed)
 *               - 0.5  archived/closed/deleted
 *               - 0.3  unverified for consumer viewer
 *
 * Base relevance is the Typesense text_match score normalized to [0..1].
 * Catalog results carry their intelligence priority (mapped to [0..1]).
 */

import type { CrossDivisionSearchResult } from "@henryco/intelligence";
import {
  scoreSearchResult as scoreCatalogResult,
} from "@henryco/intelligence";

import type { RoleResolution } from "./role";
import type { SearchDivision, SearchDocument, UnifiedSearchResult } from "./types";

export interface IndexedHitInput {
  document: SearchDocument;
  /** Typesense text_match score (raw int64). */
  text_match: number;
  /** Typesense's own normalized rank in the response (0 = top). */
  rank: number;
}

const RECENT_WINDOW_SECONDS = 30 * 24 * 60 * 60;

function normalizeTextMatch(text_match: number): number {
  // Typesense text_match is an int64 in the billions for very strong
  // matches. We compress to [0..1] via log scaling.
  if (text_match <= 0) return 0;
  const scaled = Math.log10(text_match + 1) / 12;
  return Math.min(1, Math.max(0, scaled));
}

function recencyBoost(updated_at: number): number {
  const ageSeconds = Math.max(0, Math.floor(Date.now() / 1000) - updated_at);
  if (ageSeconds <= 0) return 0.1;
  if (ageSeconds >= RECENT_WINDOW_SECONDS) return 0;
  // Linear decay — simple and easy to reason about.
  return 0.1 * (1 - ageSeconds / RECENT_WINDOW_SECONDS);
}

export function scoreIndexedHit(input: {
  hit: IndexedHitInput;
  resolution: RoleResolution;
  primary_division?: SearchDivision;
  active_workflow_keys: ReadonlySet<string>;
}): number {
  const { hit, resolution, primary_division, active_workflow_keys } = input;
  const doc = hit.document;
  let score = normalizeTextMatch(hit.text_match);

  if (resolution.user_id && doc.owner_user_id && doc.owner_user_id === resolution.user_id) {
    score += 0.5;
  }
  if (
    doc.tags?.some((tag) => active_workflow_keys.has(tag)) ||
    (doc.type === "workflow" && doc.owner_user_id === resolution.user_id)
  ) {
    score += 0.3;
  }
  if (primary_division && doc.division === primary_division) {
    score += 0.2;
  }
  score += recencyBoost(doc.updated_at);

  if (
    doc.trust_state === "archived" ||
    doc.trust_state === "closed" ||
    doc.trust_state === "deleted"
  ) {
    score -= 0.5;
  }
  if (
    doc.trust_state === "unverified" &&
    !resolution.is_staff &&
    !resolution.is_platform_owner
  ) {
    score -= 0.3;
  }

  // Workflow urgency layer — only meaningful on hc_workflows.
  const urgency = doc.ranking_signals?.workflow_urgency;
  if (urgency) score += urgency * 0.4;

  // Subsystem-controlled promotion (e.g. seasonal collections).
  const promo = doc.ranking_signals?.promotion;
  if (promo) score += promo * 0.2;

  return score;
}

export function scoreCatalog(
  catalog: CrossDivisionSearchResult,
  query: string,
): number {
  // The catalog scorer in @henryco/intelligence returns large positive
  // integers for matches. Compress to [0..1.5] so it competes fairly
  // with indexed text-match.
  const raw = scoreCatalogResult(catalog, query);
  if (raw < 0) return -1;
  // 0..2000 → 0..1.5 cap.
  return Math.min(1.5, raw / 1500);
}

export function toUnifiedFromIndexed(input: {
  document: SearchDocument;
  score: number;
}): UnifiedSearchResult {
  const { document, score } = input;
  return {
    id: document.id,
    division: document.division,
    type: document.type,
    title: document.title,
    subtitle: undefined,
    description: document.summary,
    url: document.deep_link,
    authRequirement:
      document.role_visibility.includes("public") ? "none" : "account",
    visibility: document.role_visibility.includes("public")
      ? "public"
      : document.role_visibility.includes("staff")
        ? "staff"
        : "authenticated",
    badge: document.badge,
    icon: (document.icon ?? "search") as UnifiedSearchResult["icon"],
    priority: Math.max(0, Math.min(100, Math.round(score * 100))),
    source: document.type === "workflow" ? "account_catalog" : "shared_catalog",
    tags: document.tags ?? [],
    metadata: undefined,
    resolution: document.type === "workflow" ? "workflow" : "indexed",
    score,
  };
}

export function toUnifiedFromCatalog(input: {
  catalog: CrossDivisionSearchResult;
  score: number;
}): UnifiedSearchResult {
  return {
    ...input.catalog,
    resolution: "catalog",
    score: input.score,
  };
}

export function dedupeAndRank(hits: UnifiedSearchResult[]): UnifiedSearchResult[] {
  const byKey = new Map<string, UnifiedSearchResult>();
  for (const hit of hits) {
    if (hit.score < 0) continue;
    const key = `${hit.url}::${hit.authRequirement}`;
    const existing = byKey.get(key);
    if (!existing || hit.score > existing.score) {
      byKey.set(key, hit);
    }
  }
  return Array.from(byKey.values()).sort(
    (left, right) => right.score - left.score || right.priority - left.priority,
  );
}
