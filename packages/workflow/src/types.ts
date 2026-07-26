/**
 * @henryco/workflow — the durable-job rail (V3-43). ONE engine, promoted from
 * the shipped `search_index_outbox` + `drainOutbox()` idiom (packages/search-core)
 * generalized: a Postgres job table drained by a `CRON_SECRET`-gated cron, with
 * at-least-once delivery, bounded retry, dead-letter, idempotency, single-flight,
 * and resumability. Division sagas (studio build orchestration, the operator)
 * register HANDLERS on this rail — they never fork a second drain loop and their
 * domain state tables (studio_build_jobs, …) are NOT flattened into workflow_jobs.
 *
 * This module is PURE (no DB, no clock beyond an injected `now`), so every
 * durability property is unit-provable against an in-memory store.
 */

/** The generic durable-job lifecycle. Distinct from any DOMAIN stage machine
 *  (studio_build_jobs has its own 15 stages — this rail never encodes them). */
export type WorkflowJobState =
  | "pending" // enqueued, awaiting a claim
  | "claimed" // a worker holds it (visibility timeout running)
  | "succeeded" // handler completed
  | "failed" // handler failed but attempts remain — re-queued
  | "dead_letter"; // exhausted retries — parked for an operator

export type WorkflowJob = {
  id: string;
  /** The handler key this job dispatches to (a registered WorkflowHandler). */
  workflowKey: string;
  /** Opaque handler payload — the rail never inspects it. */
  payload: Record<string, unknown>;
  /** Caller-supplied dedup key: (workflowKey, idempotencyKey) is unique among
   *  live rows, so a re-enqueue of the same logical work is a no-op. */
  idempotencyKey: string | null;
  state: WorkflowJobState;
  attempts: number;
  maxAttempts: number;
  /** Not eligible for claim until this time (backoff / scheduled). */
  runAfter: string;
  /** Set while claimed; a claim past its visibility timeout is reclaimable. */
  claimedBy: string | null;
  claimedAt: string | null;
  visibleAfter: string | null;
  lastError: string | null;
  createdAt: string;
  updatedAt: string;
};

/** An append-only run-attempt log row (mirrors studio_build_events shape). */
export type WorkflowRun = {
  jobId: string;
  attempt: number;
  kind: "claimed" | "succeeded" | "failed" | "dead_letter" | "note";
  payload: Record<string, unknown>;
  createdAt: string;
};

export type RetryPolicy = {
  maxAttempts: number;
  /** Base backoff in ms; the nth failure waits baseMs * 2^(attempt-1), capped. */
  baseMs: number;
  maxMs: number;
  /** Deterministic jitter fraction in [0,1) applied per attempt (0 = none). */
  jitter: number;
};

export const DEFAULT_RETRY_POLICY: RetryPolicy = {
  maxAttempts: 8, // parity with search_index_outbox MAX_ATTEMPTS
  baseMs: 30_000,
  maxMs: 60 * 60_000,
  jitter: 0.2,
};

/** A handler's outcome. `retryable:false` dead-letters immediately (a poison
 *  payload should not burn the full retry budget). */
export type HandlerResult =
  | { ok: true; note?: string }
  | { ok: false; error: string; retryable?: boolean };

export type WorkflowContext = {
  job: WorkflowJob;
  now: Date;
  /** Per-job upper bound on platform-invoked AI spend this run (kobo). A handler
   *  that would exceed it must NOT proceed — the runaway-loop guard. */
  aiBudgetKoboRemaining: number;
};

export type WorkflowHandler = (ctx: WorkflowContext) => Promise<HandlerResult>;

export type WorkflowRegistry = Map<string, WorkflowHandler>;
