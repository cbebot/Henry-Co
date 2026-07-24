import type { WorkflowJob, WorkflowRun } from "./types";

/**
 * The durable-job store seam. The rail engine talks ONLY to this interface, so
 * the DB-backed store (workflow_jobs / claim_workflow_jobs RPC) and the
 * in-memory test double are interchangeable, and every durability property is
 * proven against the in-memory one.
 *
 * `claimOne` is the atomic CAS: it returns a job ONLY if it moved it
 * pending→claimed in one step (the `WHERE claimed_by IS NULL`/expired idiom the
 * search-outbox + SA-3 tick already use). Two concurrent workers can never both
 * receive the same job.
 */
export interface JobStore {
  enqueue(input: {
    id: string;
    workflowKey: string;
    payload: Record<string, unknown>;
    idempotencyKey: string | null;
    maxAttempts: number;
    runAfter: string;
    now: Date;
  }): Promise<{ enqueued: boolean; jobId: string }>;

  /** Atomically claim ONE due job (pending or claim-expired) for `worker`,
   *  moving it to `claimed` with a fresh visibility timeout. Null when none. */
  claimOne(input: { worker: string; now: Date; visibilityMs: number }): Promise<WorkflowJob | null>;

  /** Terminal success. */
  succeed(input: { jobId: string; note: string | null; now: Date }): Promise<void>;

  /** Re-queue after a retryable failure (backoff via runAfter). */
  requeue(input: { jobId: string; runAfter: string; error: string; now: Date }): Promise<void>;

  /** Park after exhausting retries / a non-retryable failure. */
  deadLetter(input: { jobId: string; error: string; now: Date }): Promise<void>;

  appendRun(run: WorkflowRun): Promise<void>;
}

/** An in-memory JobStore with the SAME atomic-claim + idempotency semantics as
 *  the DB store — the substrate for every durability proof. */
export class InMemoryJobStore implements JobStore {
  private jobs = new Map<string, WorkflowJob>();
  readonly runs: WorkflowRun[] = [];

  snapshot(): WorkflowJob[] {
    return [...this.jobs.values()].map((j) => ({ ...j }));
  }
  get(jobId: string): WorkflowJob | undefined {
    const j = this.jobs.get(jobId);
    return j ? { ...j } : undefined;
  }

  async enqueue(input: {
    id: string;
    workflowKey: string;
    payload: Record<string, unknown>;
    idempotencyKey: string | null;
    maxAttempts: number;
    runAfter: string;
    now: Date;
  }): Promise<{ enqueued: boolean; jobId: string }> {
    // Idempotency: a LIVE (non-terminal) row with the same (workflowKey,
    // idempotencyKey) means the work is already queued — no-op re-enqueue.
    if (input.idempotencyKey) {
      for (const j of this.jobs.values()) {
        if (
          j.workflowKey === input.workflowKey &&
          j.idempotencyKey === input.idempotencyKey &&
          (j.state === "pending" || j.state === "claimed" || j.state === "failed")
        ) {
          return { enqueued: false, jobId: j.id };
        }
      }
    }
    const iso = input.now.toISOString();
    this.jobs.set(input.id, {
      id: input.id,
      workflowKey: input.workflowKey,
      payload: input.payload,
      idempotencyKey: input.idempotencyKey,
      state: "pending",
      attempts: 0,
      maxAttempts: input.maxAttempts,
      runAfter: input.runAfter,
      claimedBy: null,
      claimedAt: null,
      visibleAfter: null,
      lastError: null,
      createdAt: iso,
      updatedAt: iso,
    });
    return { enqueued: true, jobId: input.id };
  }

  async claimOne(input: { worker: string; now: Date; visibilityMs: number }): Promise<WorkflowJob | null> {
    const nowMs = input.now.getTime();
    // FIFO by createdAt, like the outbox's enqueued_at ordering.
    const ordered = [...this.jobs.values()].sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));
    for (const j of ordered) {
      const due = Date.parse(j.runAfter) <= nowMs;
      const claimable =
        j.state === "pending" ||
        (j.state === "failed" && due) ||
        (j.state === "claimed" && j.visibleAfter !== null && Date.parse(j.visibleAfter) <= nowMs);
      if (!claimable || !due) continue;
      // Atomic in JS (single-threaded): flip to claimed + bump attempts.
      const iso = input.now.toISOString();
      j.state = "claimed";
      j.attempts += 1;
      j.claimedBy = input.worker;
      j.claimedAt = iso;
      j.visibleAfter = new Date(nowMs + input.visibilityMs).toISOString();
      j.updatedAt = iso;
      this.runs.push({ jobId: j.id, attempt: j.attempts, kind: "claimed", payload: { worker: input.worker }, createdAt: iso });
      return { ...j };
    }
    return null;
  }

  async succeed(input: { jobId: string; note: string | null; now: Date }): Promise<void> {
    const j = this.jobs.get(input.jobId);
    if (!j || j.state !== "claimed") return;
    const iso = input.now.toISOString();
    j.state = "succeeded";
    j.claimedBy = null;
    j.visibleAfter = null;
    j.lastError = null;
    j.updatedAt = iso;
    this.runs.push({ jobId: j.id, attempt: j.attempts, kind: "succeeded", payload: input.note ? { note: input.note } : {}, createdAt: iso });
  }

  async requeue(input: { jobId: string; runAfter: string; error: string; now: Date }): Promise<void> {
    const j = this.jobs.get(input.jobId);
    if (!j || j.state !== "claimed") return;
    const iso = input.now.toISOString();
    j.state = "failed";
    j.runAfter = input.runAfter;
    j.claimedBy = null;
    j.visibleAfter = null;
    j.lastError = input.error.slice(0, 1024);
    j.updatedAt = iso;
    this.runs.push({ jobId: j.id, attempt: j.attempts, kind: "failed", payload: { error: j.lastError }, createdAt: iso });
  }

  async deadLetter(input: { jobId: string; error: string; now: Date }): Promise<void> {
    const j = this.jobs.get(input.jobId);
    if (!j || j.state !== "claimed") return;
    const iso = input.now.toISOString();
    j.state = "dead_letter";
    j.claimedBy = null;
    j.visibleAfter = null;
    j.lastError = input.error.slice(0, 1024);
    j.updatedAt = iso;
    this.runs.push({ jobId: j.id, attempt: j.attempts, kind: "dead_letter", payload: { error: j.lastError }, createdAt: iso });
  }

  async appendRun(run: WorkflowRun): Promise<void> {
    this.runs.push(run);
  }
}
