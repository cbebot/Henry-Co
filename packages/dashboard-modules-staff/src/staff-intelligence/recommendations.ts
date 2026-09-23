/**
 * V3-42 S3 — the recommendation binding.
 *
 * The DERIVATION itself is pure and lives in
 * `packages/intelligence/src/predictive/recommendations.ts`, where the package
 * test runner can reach it (this package ships no runner). This file is the
 * thin seam that turns a loaded `LensSnapshot` into engine input, applies the
 * persisted accept/dismiss/snooze state, and hands cards to the surface.
 *
 * It contains no policy of its own: nothing here decides WHETHER to raise a
 * card, only which already-derived cards are still visible.
 */

import {
  deriveRecommendations,
  recommendationsForScope,
  type AnomalyResult,
  type QueueKey,
  type RecommendationCard,
  type StaffingRecommendation,
} from "@henryco/intelligence";
import type { LensKey } from "./lenses";
import { visibleRecommendationKeys, type LensSnapshot, type RecommendationStateRow } from "./data";

export type { RecommendationCard };

function countsOf(bands: Record<string, number> | undefined, keys: string[]): number {
  if (!bands) return 0;
  return keys.reduce((sum, key) => sum + (Number(bands[key]) || 0), 0);
}

/**
 * Build the visible recommendation rail for one lens.
 *
 * Only the CURRENT lens's inputs are passed to the engine. A finance operator's
 * snapshot contains no risk counts (RLS returned none), so no risk card can be
 * derived for them even in principle — the cross-lens guarantee holds at the
 * data layer, not just at the filter.
 */
export function buildRecommendationRail(input: {
  lens: LensKey;
  snapshot: LensSnapshot;
  anomalies: ReadonlyArray<AnomalyResult>;
  state: ReadonlyArray<RecommendationStateRow>;
  now?: Date;
}): RecommendationCard[] {
  const now = input.now ?? new Date();
  const bands = input.snapshot.bands ?? {};

  const cards = deriveRecommendations({
    asOf: now.toISOString(),
    anomalies: input.anomalies,
    forecasts: input.snapshot.forecasts.map((f) => ({
      queue: f.queue as QueueKey,
      basis: f.basis,
      staffing: f.staffing as ReadonlyArray<StaffingRecommendation>,
      currentAgents: null,
    })),
    atRisk:
      input.lens === "support"
        ? { high: countsOf(bands.quality, ["high"]), elevated: countsOf(bands.quality, ["elevated"]) }
        : null,
    disputeWatch:
      input.lens === "finance"
        ? { high: countsOf(bands.dispute, ["high"]), watch: countsOf(bands.dispute, ["watch"]) }
        : null,
    riskBacklog:
      input.lens === "trust"
        ? { review: countsOf(bands.risk, ["review"]), freeze: countsOf(bands.risk, ["freeze"]) }
        : null,
  });

  const forLens = recommendationsForScope(cards, input.lens);
  const visible = new Set(
    visibleRecommendationKeys(
      forLens.map((card) => card.key),
      input.state,
      now,
    ),
  );
  return forLens.filter((card) => visible.has(card.key));
}
