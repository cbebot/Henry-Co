export * from "./types";
export * from "./schema";
export * from "./collections";
export {
  getAdminClient,
  issueScopedSearchKey,
  readTypesenseEnv,
  type TypesenseAdminClient,
  type TypesenseEnv,
} from "./client";
export {
  drainOutbox,
  ensureCollectionsExist,
  type DrainOutboxResult,
  type IndexingFailureClass,
  type IndexingFailureReport,
  type IndexingFailureEmitter,
} from "./outbox";
export {
  buildFilterClauses,
  resolveUserRoles,
  type RoleResolution,
} from "./role";
export {
  scoreCatalog,
  scoreIndexedHit,
  toUnifiedFromCatalog,
  toUnifiedFromIndexed,
  dedupeAndRank,
  applyDiversityCap,
} from "./ranking";
export {
  DEFAULT_TUNING,
  getCollectionTuning,
  type CollectionTuning,
} from "./collection-tuning";
export {
  SYNONYMS_BY_DIVISION,
  buildTypesenseSynonyms,
  flattenSynonymsForDivision,
  type SynonymGroup,
  type TypesenseSynonymPayload,
} from "./synonyms";
export { searchAcrossDivisions, type SearchAcrossDivisionsDeps } from "./query";
export {
  checkSearchRateLimit,
  InMemoryRateLimitStore,
  type RateLimitDecision,
  type RateLimitStore,
} from "./rate-limit";
export {
  buildPaletteSuggestions,
  toSuggestionsWire,
  type BuildSuggestionsOptions,
  type PaletteSuggestion,
  type SuggestionsWirePayload,
} from "./suggestions";
export {
  rankPaletteRows,
  type RankablePaletteRow,
  type RankableStoredRecent,
  type RankerInput,
  type RankerOutput,
} from "./palette-ranker";
