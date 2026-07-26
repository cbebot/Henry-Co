/**
 * V3-40 — per-candidate scoring with the ABSOLUTE floor guarantee, extracted so it is
 * directly unit-testable (batch.ts is Supabase-bound; this is not). Pure given its
 * inputs — no server dependency of its own (the advisory is injected), so it carries no
 * `server-only` marker; its only caller, the batch, is the server boundary.
 *
 * The deterministic floor is computed FIRST and outside the advisory try. The advisory
 * step (an injected async fn — real one is requestRiskAdvisory) runs in its own try; a
 * throw, a null outcome, or a re-score throw ALL fall back to the floor. A candidate's
 * deterministic score is therefore NEVER dropped by anything the advisory does.
 *
 * `scoreEntity` is pure and non-mutating, and the advisory re-score is passed a fresh
 * feature spread, so the advisory can never corrupt the floor even on the success path.
 */

import { scoreEntity, type RiskModelConfig, type RiskScoreResult } from "@henryco/intelligence";
import type { RiskAssistOutcome } from "./assist";
import type { RiskEntityCandidate } from "./readers";

export interface CandidateScoreOutcome {
  /** The score to persist — the advisory-adjusted result when applied, else the floor. */
  result: RiskScoreResult;
  advisoryApplied: boolean;
  /** null when no advisory was requested; otherwise the skip reason (incl. 'advisory_error'). */
  advisorySkipped: string | null;
}

export async function scoreCandidateWithAdvisory(input: {
  candidate: RiskEntityCandidate;
  model: RiskModelConfig;
  /** Cap gate (pre-decided by the batch): is there advisory headroom this run? */
  wantsAdvisory: boolean;
  /** Tier gate (decided after the floor exists): only review/freeze entities qualify. */
  isEligible?: (floor: RiskScoreResult) => boolean;
  requestAdvisory: (floor: RiskScoreResult) => Promise<RiskAssistOutcome>;
}): Promise<CandidateScoreOutcome> {
  // May throw — the CALLER decides how to handle a floor failure (batch skips the entity).
  const floor = scoreEntity({
    entityType: input.candidate.entityType,
    entityId: input.candidate.entityId,
    features: input.candidate.features,
    model: input.model,
  });

  // Not eligible (no headroom or wrong tier) → the floor stands, no skip is recorded
  // (a pass/monitor entity was never a candidate for advisory in the first place).
  if (!input.wantsAdvisory || (input.isEligible && !input.isEligible(floor))) {
    return { result: floor, advisoryApplied: false, advisorySkipped: null };
  }

  try {
    const outcome = await input.requestAdvisory(floor);
    if (outcome.advisory) {
      const result = scoreEntity({
        entityType: input.candidate.entityType,
        entityId: input.candidate.entityId,
        features: { ...input.candidate.features, advisory: outcome.advisory },
        model: input.model,
      });
      return { result, advisoryApplied: true, advisorySkipped: null };
    }
    return { result: floor, advisoryApplied: false, advisorySkipped: outcome.skipped };
  } catch {
    // Advisory failed (the request threw, or the re-score threw) — keep the floor.
    return { result: floor, advisoryApplied: false, advisorySkipped: "advisory_error" };
  }
}
