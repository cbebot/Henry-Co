/**
 * Trust Reveal Engine — pure stage resolver (doctrine Engine 3 / Principle 11).
 *
 * "Trust reveals, not trust dumps." Proof surfaces progressively at the
 * moment the user approaches the next risky step — never all at once on
 * the hero:
 *
 *   browse   → outcome evidence only (real photo, real result, real number)
 *   consider → one capability quote inline (name + city + verified mark)
 *   commit   → the safety net near the commit button (money-back, dispute
 *              window, response-time SLO)
 *   pay      → trust marks ONLY here (provider logos, encryption mark,
 *              the guarantee)
 *
 * The resolver combines what the user has EARNED (scroll + interactions)
 * with what is on screen (sectionVisible), and never lets visibility skip
 * the ladder: seeing the pay section with zero engagement does not make a
 * cold visitor "pay-stage". A page may budget fewer stages; the result is
 * clamped to the budget.
 */

export const TRUST_STAGES = ["browse", "consider", "commit", "pay"] as const;
export type TrustStage = (typeof TRUST_STAGES)[number];

export function stageIndex(stage: TrustStage): number {
  return TRUST_STAGES.indexOf(stage);
}

export interface TrustPosition {
  /** 0–100 page scroll depth. */
  scrollDepth: number;
  /** Count of meaningful interactions on the flow (saves, selections, field input). */
  interactions: number;
  /** The stage-owning section currently in view, if any. */
  sectionVisible: TrustStage | null;
}

/**
 * The stage the user has EARNED through behavior, independent of what is
 * on screen: consider at 40% scroll; commit after any interaction.
 */
function earnedStage(pos: TrustPosition): TrustStage {
  if (pos.interactions >= 1) return "commit";
  if (pos.scrollDepth >= 40) return "consider";
  return "browse";
}

export function resolveVisibleStage(pos: TrustPosition, budget: TrustStage[]): TrustStage {
  const earned = earnedStage(pos);

  // Visibility may advance the user AT MOST one stage past what they earned,
  // and "pay" additionally requires the pay section to actually be in view.
  let resolved = earned;
  if (pos.sectionVisible) {
    const visIdx = stageIndex(pos.sectionVisible);
    const earnedIdx = stageIndex(earned);
    resolved = TRUST_STAGES[Math.min(visIdx, earnedIdx + 1)];
  }
  if (resolved === "pay" && pos.sectionVisible !== "pay") {
    resolved = "commit";
  }

  // Clamp to the page's declared budget (ordered subset of TRUST_STAGES).
  const inBudget = budget.filter((s) => TRUST_STAGES.includes(s));
  if (inBudget.length === 0) return "browse";
  const maxBudget = inBudget[inBudget.length - 1];
  return stageIndex(resolved) > stageIndex(maxBudget) ? maxBudget : resolved;
}
