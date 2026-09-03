/**
 * SEARCH-01 — Per-collection multi_search parameter tuning.
 *
 * Typesense's multi_search accepts a body per search object; most
 * tuning knobs (`num_typos`, `prefix`, `min_len_*typo`,
 * `prioritize_token_position`, `drop_tokens_threshold`,
 * `query_by_weights`) are per-collection. The defaults are sensible
 * for English long-form text but miss for Nigerian English / short
 * IDs / location codes. This file is the single source-of-truth so
 * `query.ts` stays declarative.
 *
 * Field weights are stored as a CSV string mirroring the `query_by`
 * shape ("title,summary,tags,badge" → "4,2,1,1"). Title outweighs
 * summary 2x; tags + badge get the floor weight.
 *
 * Add per-collection overrides as zero-result observability surfaces
 * tuning needs.
 */

import type { CollectionDefinition } from "./collections";

export interface CollectionTuning {
  /** CSV passed to Typesense as `query_by_weights`. Length must match `query_by`. */
  query_by_weights: string;
  /** Per-collection typo budget. 1 is the safe default for content. */
  num_typos: string | number;
  /** Min chars before 1-typo is allowed (avoid "qa" matching "ja"). */
  min_len_1typo: number;
  /** Min chars before 2-typo is allowed. */
  min_len_2typo: number;
  /** Boost early-token matches — title-leading wins ties. */
  prioritize_token_position: boolean;
  /** Drop trailing tokens that have no matches, so long queries still hit. */
  drop_tokens_threshold: number;
  /** Use prefix matching for typeahead queries. */
  prefix: boolean;
}

/**
 * Default tuning for content-heavy collections (titles + summaries).
 * One typo allowed once the query is at least 4 chars; two typos
 * unlocked at 8+ chars so "developr" → "developer" works but "dev"
 * doesn't suddenly start matching "den".
 */
export const DEFAULT_TUNING: CollectionTuning = {
  query_by_weights: "4,2,1,1",
  num_typos: 1,
  min_len_1typo: 4,
  min_len_2typo: 8,
  prioritize_token_position: true,
  drop_tokens_threshold: 1,
  prefix: true,
};

/**
 * Per-collection overrides. Anything absent falls through to
 * DEFAULT_TUNING. Keep this list small — overrides are only for
 * cases where DEFAULT produces measurable harm.
 */
const COLLECTION_TUNING_OVERRIDES: Record<string, Partial<CollectionTuning>> = {
  // Workflows are short, deeply-personalised verb phrases. Typo
  // tolerance is less important than tight prefix matching.
  hc_workflows: {
    num_typos: 0,
    min_len_1typo: 100, // effectively disabled
    min_len_2typo: 100,
    query_by_weights: "5,2,1,1",
  },
  // Property areas are short proper nouns ("Lekki", "Ikoyi") — 1 typo
  // tolerance over 5 chars is enough; 2 typos would noise.
  hc_property_areas: {
    num_typos: 1,
    min_len_1typo: 5,
    min_len_2typo: 100,
  },
  // Certificates have very few human-typed queries — exact match wins.
  hc_learn_certificates: {
    num_typos: 0,
    min_len_1typo: 100,
    min_len_2typo: 100,
  },
  // Notifications often contain timestamps / order numbers — drop
  // unmatched tokens aggressively so "order #1234" still surfaces.
  hc_notifications: {
    drop_tokens_threshold: 2,
  },
};

export function getCollectionTuning(collection: CollectionDefinition): CollectionTuning {
  const overrides = COLLECTION_TUNING_OVERRIDES[collection.name] ?? {};
  return { ...DEFAULT_TUNING, ...overrides };
}
