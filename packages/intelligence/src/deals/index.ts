/**
 * V3-35 — deals & campaigns (ARCHITECTURE §4.2). A deterministic, DB-less
 * selection engine over injected viewer-scoped readers: consent-gated
 * targeting, opaque scoring, a diversity guard, and the impression-fairness
 * audit. No AI slice in this pass — the floor IS the feature.
 */
export type {
  DealCandidate,
  DealOffer,
  DealReasonCode,
  DealStatus,
  DealSurfaceKind,
  DealTerms,
  DealVisibility,
} from "./types";
export {
  applyDiversityGuard,
  selectDeals,
  toPublicOffer,
  type DealCandidateReader,
  type SelectDealsInput,
  type SelectDealsResult,
} from "./engine";
export {
  auditImpressionFairness,
  computeCreatorShares,
  type CreatorShare,
  type FairnessAlert,
  type FairnessConfig,
  type FairnessImpression,
} from "./fairness";
export {
  buildImpressionBatch,
  MAX_IMPRESSION_ROWS_PER_BATCH,
  type DealImpressionEntry,
} from "./impressions";
