import type { RetryPolicy, WorkflowJob } from "./types";

/**
 * Pure retry math — no clock, no store. `attempt` is the number of the failure
 * that JUST happened (1-based). Deterministic jitter (seeded by jobId+attempt)
 * so a test can assert exact timings and two workers never diverge.
 */

function seededFraction(seed: string): number {
  // A small, dependency-free string hash → [0,1). Deterministic per seed.
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  // >>> 0 → unsigned; divide by 2^32.
  return (h >>> 0) / 4294967296;
}

/** Backoff (ms) before the next attempt after `attempt` failures. Capped, with
 *  deterministic per-(job,attempt) jitter so retries de-correlate without RNG. */
export function backoffMs(policy: RetryPolicy, jobId: string, attempt: number): number {
  const exp = Math.min(policy.baseMs * 2 ** Math.max(0, attempt - 1), policy.maxMs);
  if (policy.jitter <= 0) return Math.floor(exp);
  const frac = seededFraction(`${jobId}:${attempt}`);
  // Jitter in [-jitter, +jitter] * exp, clamped to [0, maxMs].
  const delta = exp * policy.jitter * (frac * 2 - 1);
  return Math.min(policy.maxMs, Math.max(0, Math.floor(exp + delta)));
}

export type FailureDisposition =
  | { state: "dead_letter" }
  | { state: "failed"; runAfterIso: string };

/**
 * Given a job that just failed at `attempt`, decide whether it dead-letters or
 * re-queues with a backoff. `retryable:false` OR attempts>=maxAttempts ⇒
 * dead_letter (the search-outbox MAX_ATTEMPTS rule, generalized).
 */
export function disposeFailure(input: {
  job: WorkflowJob;
  policy: RetryPolicy;
  retryable: boolean;
  now: Date;
}): FailureDisposition {
  const attempt = input.job.attempts; // already incremented by the engine
  if (!input.retryable || attempt >= input.policy.maxAttempts) {
    return { state: "dead_letter" };
  }
  const wait = backoffMs(input.policy, input.job.id, attempt);
  return { state: "failed", runAfterIso: new Date(input.now.getTime() + wait).toISOString() };
}
