/**
 * V3-36 — cross-division recommendations (ARCHITECTURE §4.1). The governed-AI
 * enhancement layer over a deterministic floor: consent-gated, opaque-scored,
 * injected-reader (no table access), AI-may-only-reorder-the-floor.
 */
export {
  generateRecommendations,
  type CandidateReader,
  type GenerateRecommendationsInput,
  type GenerateRecommendationsResult,
  type RecommendationCandidate,
  type RecommendationRerank,
} from "./engine";
