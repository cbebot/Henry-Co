import type { MeteredUsage } from "@henryco/pricing";
import type { AiSurfacePolicy } from "./surfaces";

/**
 * A conservative token estimate from text length. Real metering uses the provider's
 * reported usage; this only sizes the PRE-FLIGHT reservation, so it rounds UP (~4 chars
 * per token plus a small overhead) — never an undercount.
 */
export function estimateInputTokens(text: string): number {
  if (!text) return 24;
  // A CONSERVATIVE HEURISTIC (not a guaranteed cross-script upper bound): ~2.5 chars/token
  // stays well above Latin's ~4 and covers most punctuation/markup-dense content, plus a
  // fixed scaffold overhead. Dense CJK/Arabic (~1 char/token) CAN still exceed it — and
  // that is fine, because money-safety does NOT rest on this estimate: the settle is
  // hard-capped at the reservation (see the orchestrator), so the customer is never charged
  // above the quote and the wallet can never go negative. A persistent under-estimate only
  // erodes company margin on the affected calls, surfaced via the `cappedToReserve` signal
  // for rate/estimator tuning (and largely masked by the always-reserved output-token cap).
  return Math.ceil(text.length / 2.5) + 24;
}

/**
 * Build a CONSERVATIVE reservation usage. Given a correct `promptTokens` count it is a
 * provable upper bound on cost (every prompt token counted at the full input rate AND
 * again as a worst-case cache write — slack that holds for any rate-card ordering; output
 * at the hard `maxOutputTokens` cap; cache reads 0; scaled by `maxCalls`). It is therefore
 * only as tight as the `promptTokens` estimate that feeds it (see `estimateInputTokens`,
 * a char-based heuristic that can under-count dense CJK/Arabic).
 *
 * Money-safety does NOT depend on the estimate being exact: the settle is HARD-CAPPED at
 * the reservation in both the orchestrator and the SQL, so a metered call can never be
 * settled above its reservation and the wallet can never be driven negative — the customer
 * is never charged above the quote regardless of estimator accuracy. The over-estimate is
 * released back to available; a rare under-estimate is absorbed as company margin (and
 * surfaced via `cappedToReserve`), never passed to the customer.
 */
export function estimateUsageUpperBound(input: { promptTokens: number; policy: AiSurfacePolicy }): MeteredUsage {
  const calls = Math.max(1, Math.floor(input.policy.maxCalls));
  const prompt = Math.max(0, Math.ceil(input.promptTokens));
  const maxOut = Math.max(0, Math.floor(input.policy.maxOutputTokens));
  return {
    inputTokens: prompt * calls,
    outputTokens: maxOut * calls,
    cacheReadTokens: 0,
    cacheWriteTokens: prompt * calls,
    calls,
  };
}
