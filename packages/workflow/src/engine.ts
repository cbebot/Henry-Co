import { disposeFailure } from "./retry";
import type { JobStore } from "./store";
import {
  DEFAULT_RETRY_POLICY,
  type HandlerResult,
  type RetryPolicy,
  type WorkflowRegistry,
} from "./types";

/**
 * The generic at-least-once drain — the outbox `drainOutbox()` idiom
 * generalized. Claims due jobs ONE at a time (atomic CAS in the store, so two
 * drain workers never double-process), runs the registered handler, and
 * dispositions the result (succeed / requeue-with-backoff / dead-letter). It
 * holds NO single-flight lock itself — that is the TICK handlers' concern
 * (they serialize on the shared workflow lock); the drain is safe to run
 * concurrently because every claim is atomic.
 */

export type DrainSummary = {
  claimed: number;
  succeeded: number;
  requeued: number;
  deadLettered: number;
  unknownHandler: number;
};

export const DEFAULT_VISIBILITY_MS = 90_000; // > any single tick route's maxDuration

export async function runDrain(input: {
  registry: WorkflowRegistry;
  store: JobStore;
  worker: string;
  now: Date;
  maxJobs?: number;
  visibilityMs?: number;
  policy?: RetryPolicy;
  /** Per-job platform-invoked AI budget (kobo). The handler must respect it. */
  aiBudgetKoboPerJob?: number;
}): Promise<DrainSummary> {
  const policy = input.policy ?? DEFAULT_RETRY_POLICY;
  const visibilityMs = input.visibilityMs ?? DEFAULT_VISIBILITY_MS;
  const maxJobs = input.maxJobs ?? 100;
  const summary: DrainSummary = { claimed: 0, succeeded: 0, requeued: 0, deadLettered: 0, unknownHandler: 0 };

  for (let i = 0; i < maxJobs; i += 1) {
    const job = await input.store.claimOne({ worker: input.worker, now: input.now, visibilityMs });
    if (!job) break;
    summary.claimed += 1;

    const handler = input.registry.get(job.workflowKey);
    if (!handler) {
      // An unknown handler is a permanent config error → dead-letter, never spin.
      await input.store.deadLetter({ jobId: job.id, error: `no handler for "${job.workflowKey}"`, now: input.now });
      summary.deadLettered += 1;
      summary.unknownHandler += 1;
      continue;
    }

    let result: HandlerResult;
    try {
      result = await handler({ job, now: input.now, aiBudgetKoboRemaining: input.aiBudgetKoboPerJob ?? 0 });
    } catch (error) {
      result = { ok: false, error: error instanceof Error ? error.message : "handler threw", retryable: true };
    }

    if (result.ok) {
      await input.store.succeed({ jobId: job.id, note: result.note ?? null, now: input.now });
      summary.succeeded += 1;
      continue;
    }

    const disposition = disposeFailure({ job, policy, retryable: result.retryable !== false, now: input.now });
    if (disposition.state === "dead_letter") {
      await input.store.deadLetter({ jobId: job.id, error: result.error, now: input.now });
      summary.deadLettered += 1;
    } else {
      await input.store.requeue({ jobId: job.id, runAfter: disposition.runAfterIso, error: result.error, now: input.now });
      summary.requeued += 1;
    }
  }

  return summary;
}
