// ---------------------------------------------------------------------------
// pipeline.ts — the decision core: deterministic → (optional) AI → decision
//
// Pure and deterministic (no I/O) so the whole decision is unit-testable. The
// server-side moderate() (src/server.ts) layers persistence + telemetry on top.
//
// Invariants enforced here:
//   • An unambiguous deterministic reject short-circuits — AI is ignored.
//   • The AI can only raise the decision to `hold`, never to `reject`
//     (its reject was already downgraded in normalizeAiResult) — human-gated.
//   • Decisions are monotonic: approve < hold < reject; final = the strongest.
// ---------------------------------------------------------------------------

import type {
  AiScanResult,
  DetectorVerdict,
  ModerationDecision,
  ModerationEvaluation,
  ModerationInput,
  ModerationReason,
} from "./types";
import { runDeterministic, type DeterministicOptions } from "./deterministic/index";

const DECISION_RANK: Record<ModerationDecision, number> = {
  approve: 0,
  hold: 1,
  reject: 2,
};

function strongest(a: ModerationDecision, b: ModerationDecision): ModerationDecision {
  return DECISION_RANK[a] >= DECISION_RANK[b] ? a : b;
}

/**
 * Combine a deterministic verdict with an optional AI result into the final
 * publish-gate evaluation. Pure.
 */
export function combineVerdicts(
  deterministic: DetectorVerdict,
  aiResult: AiScanResult | null,
): ModerationEvaluation {
  // Unambiguous deterministic reject wins outright — the AI was never run.
  if (deterministic.decision === "reject" && deterministic.unambiguous) {
    return {
      decision: "reject",
      reasons: dedupe(deterministic.reasons),
      scanner: "deterministic_rule",
      severity: deterministic.severity,
      shortCircuited: true,
    };
  }

  let decision: ModerationDecision = deterministic.decision;
  const reasons: ModerationReason[] = [...deterministic.reasons];

  if (aiResult) {
    // AI reject is already downgraded to hold upstream; here it can only lift
    // approve → hold. It cannot reject. It cannot lower a hold to approve.
    if (aiResult.recommendation === "hold") {
      decision = strongest(decision, "hold");
    }
    reasons.push(...aiResult.reasons);
  }

  return {
    decision,
    reasons: dedupe(reasons),
    scanner: aiResult ? "ai_check" : "deterministic_rule",
    severity: deterministic.severity,
    shortCircuited: false,
  };
}

/**
 * Evaluate content end-to-end (deterministic + a pre-computed AI result).
 * Pure: the AI call itself is performed by the caller (server.ts) and its
 * result passed in here, so this function never does I/O.
 */
export function evaluate(
  input: ModerationInput,
  opts: { deterministic?: DeterministicOptions; aiResult?: AiScanResult | null } = {},
): ModerationEvaluation {
  const verdict = runDeterministic(input, opts.deterministic);
  // Honor the short-circuit: don't let an AI result override an unambiguous reject.
  const aiResult = verdict.decision === "reject" && verdict.unambiguous ? null : opts.aiResult ?? null;
  return combineVerdicts(verdict, aiResult);
}

function dedupe(reasons: ModerationReason[]): ModerationReason[] {
  return [...new Set(reasons)];
}

export { DECISION_RANK };
