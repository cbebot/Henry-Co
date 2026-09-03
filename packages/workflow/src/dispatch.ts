import { runDrain, type DrainSummary } from "./engine";
import type { JobStore } from "./store";
import type { WorkflowHandler, WorkflowRegistry } from "./types";

/**
 * Retire a periodic SWEEP (a cron tick) onto the durable rail. Enqueues ONE
 * idempotency-keyed job for this trigger, then immediately drains it through the
 * registered handler:
 *
 *   - the idempotency key (a coarse time bucket) dedupes back-to-back / overlapping
 *     cron fires to a single LIVE job, so the sweep runs at most once per bucket —
 *     belt to the handler's OWN workflow-lock single-flight;
 *   - `maxAttempts: 1` means a failed sweep dead-letters (audit) rather than
 *     retry-storming — the next cron fire is a fresh bucket, exactly the pre-rail
 *     "each cron is independent" behavior;
 *   - `maxJobs: 1` claims only this sweep's job; if a peer cron already claimed it,
 *     the drain no-ops (the loser-no-ops single-flight rule, on the rail).
 *
 * Behavior-preserving: the registered handler IS the shipped sweep, so what the
 * tick DOES is identical to the direct call — the rail only adds durable
 * enqueue/claim/disposition bookkeeping around it.
 */
export async function dispatchSweepThroughRail(input: {
  store: JobStore;
  key: string;
  handler: WorkflowHandler;
  worker: string;
  now: Date;
  idempotencyKey: string;
  newJobId: string;
  visibilityMs?: number;
  aiBudgetKoboPerJob?: number;
}): Promise<DrainSummary> {
  const registry: WorkflowRegistry = new Map([[input.key, input.handler]]);
  await input.store.enqueue({
    id: input.newJobId,
    workflowKey: input.key,
    payload: {},
    idempotencyKey: input.idempotencyKey,
    maxAttempts: 1,
    runAfter: input.now.toISOString(),
    now: input.now,
  });
  return runDrain({
    registry,
    store: input.store,
    worker: input.worker,
    now: input.now,
    maxJobs: 1,
    visibilityMs: input.visibilityMs,
    aiBudgetKoboPerJob: input.aiBudgetKoboPerJob,
  });
}
