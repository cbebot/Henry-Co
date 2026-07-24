/**
 * DB adapters — the real `workflow_jobs` / `workflow_locks` /
 * `internal_ai_spend_ledger` backing for the rail's three seams (JobStore,
 * LockStore, SpendStore). Structurally typed against the supabase-js client (no
 * hard `@supabase/supabase-js` dep, so the package stays light and every app
 * passes its own service-role admin client).
 *
 * All writes are service-role only; every table is RLS default-deny and the
 * spend/enqueue/claim RPCs are `SECURITY DEFINER`, EXECUTE granted to
 * service_role only (the V3-43 migration). Nothing here touches payments_private
 * or a customer wallet.
 */

import type { JobStore } from "./store";
import type { LockStore } from "./lock";
import type { SpendStore } from "./spend";
import type { WorkflowJob, WorkflowRun } from "./types";

/** A minimal, self-returning query-builder shape (the supabase-js filter chain). */
export interface QueryBuilderLike {
  insert(values: Record<string, unknown> | Record<string, unknown>[]): PromiseLike<{ data: unknown; error: unknown }>;
  update(values: Record<string, unknown>): QueryBuilderLike;
  eq(col: string, val: unknown): QueryBuilderLike;
  lt(col: string, val: unknown): QueryBuilderLike;
  select(cols: string): QueryBuilderLike;
  maybeSingle(): Promise<{ data: unknown; error: unknown }>;
}

/** The minimal supabase-js surface the adapters use. */
export interface SupabaseLike {
  from(table: string): QueryBuilderLike;
  rpc(fn: string, args: Record<string, unknown>): Promise<{ data: unknown; error: unknown }>;
}

// ── JobStore (workflow_jobs) ────────────────────────────────────────────────

function mapJobRow(row: Record<string, unknown>): WorkflowJob {
  return {
    id: String(row.id),
    workflowKey: String(row.workflow_key),
    payload: (row.payload as Record<string, unknown>) ?? {},
    idempotencyKey: (row.idempotency_key as string) ?? null,
    state: String(row.state) as WorkflowJob["state"],
    attempts: Number(row.attempts ?? 0),
    maxAttempts: Number(row.max_attempts ?? 8),
    runAfter: String(row.run_after ?? ""),
    claimedBy: (row.claimed_by as string) ?? null,
    claimedAt: (row.claimed_at as string) ?? null,
    visibleAfter: (row.visible_after as string) ?? null,
    lastError: (row.last_error as string) ?? null,
    createdAt: String(row.created_at ?? ""),
    updatedAt: String(row.updated_at ?? ""),
  };
}

/**
 * The ONE durable-job rail backed by workflow_jobs + the two atomic RPCs. enqueue
 * and claim go through SECURITY DEFINER RPCs (idempotent insert; `for update skip
 * locked` claim) so two workers never double-enqueue or double-claim. The
 * disposition writes are plain service-role updates guarded by `state='claimed'`
 * so a replayed disposition is a no-op (no double side-effect on the runs log).
 */
export function workflowJobStore(client: SupabaseLike): JobStore {
  async function disposition(
    jobId: string,
    patch: Record<string, unknown>,
    run: { outcome: "succeeded" | "requeued" | "dead_letter"; note?: string | null; error?: string | null },
    nowIso: string,
  ): Promise<void> {
    // Guard state='claimed' so only the FIRST disposition of a claimed job takes
    // effect — a duplicate call finds no row and appends no run (replay-safe).
    const { data } = await client
      .from("workflow_jobs")
      .update({ ...patch, updated_at: nowIso })
      .eq("id", jobId)
      .eq("state", "claimed")
      .select("id, workflow_key")
      .maybeSingle();
    const row = data as { id?: string; workflow_key?: string } | null;
    if (!row?.id) return;
    await client.from("workflow_runs").insert({
      job_id: row.id,
      workflow_key: row.workflow_key ?? "",
      outcome: run.outcome,
      note: run.note ?? null,
      error: run.error ?? null,
      at: nowIso,
    });
  }

  return {
    async enqueue(input) {
      const { data, error } = await client.rpc("workflow_enqueue", {
        p_workflow_key: input.workflowKey,
        p_payload: input.payload ?? {},
        p_idempotency_key: input.idempotencyKey,
        p_max_attempts: input.maxAttempts,
        p_run_after: input.runAfter,
      });
      if (error) return { enqueued: false, jobId: input.id };
      const rows = (data as Record<string, unknown>[] | null) ?? [];
      const row = rows[0];
      if (!row) return { enqueued: false, jobId: input.id };
      // A returned row created "just now" (attempts 0, state pending) is a fresh
      // enqueue; an older/claimed row means the idempotency key deduped.
      const job = mapJobRow(row);
      const enqueued = job.state === "pending" && job.attempts === 0;
      return { enqueued, jobId: job.id };
    },

    async claimOne(input) {
      const { data, error } = await client.rpc("workflow_claim_job", {
        p_worker: input.worker,
        p_visibility_seconds: Math.max(1, Math.ceil(input.visibilityMs / 1000)),
      });
      if (error) return null;
      const rows = (data as Record<string, unknown>[] | null) ?? [];
      return rows[0] ? mapJobRow(rows[0]) : null;
    },

    async succeed(input) {
      await disposition(
        input.jobId,
        { state: "succeeded", claimed_by: null, visible_after: null, last_error: null },
        { outcome: "succeeded", note: input.note },
        input.now.toISOString(),
      );
    },

    async requeue(input) {
      await disposition(
        input.jobId,
        { state: "failed", run_after: input.runAfter, claimed_by: null, visible_after: null, last_error: input.error.slice(0, 1024) },
        { outcome: "requeued", error: input.error.slice(0, 1024) },
        input.now.toISOString(),
      );
    },

    async deadLetter(input) {
      await disposition(
        input.jobId,
        { state: "dead_letter", claimed_by: null, visible_after: null, last_error: input.error.slice(0, 1024) },
        { outcome: "dead_letter", error: input.error.slice(0, 1024) },
        input.now.toISOString(),
      );
    },

    async appendRun(run: WorkflowRun) {
      // The runs table is a DISPOSITION log; claim/note kinds live on the job row.
      if (run.kind !== "succeeded" && run.kind !== "failed" && run.kind !== "dead_letter") return;
      const outcome = run.kind === "failed" ? "requeued" : run.kind;
      await client.from("workflow_runs").insert({
        job_id: run.jobId,
        workflow_key: String(run.payload.workflowKey ?? ""),
        outcome,
        error: run.payload.error ? String(run.payload.error) : null,
        at: run.createdAt,
      });
    },
  };
}

// ── LockStore (workflow_locks) ──────────────────────────────────────────────

/** The ONE lock table CAS — win iff `locked_until < now` for `lock_key`. */
export function workflowLockStore(client: SupabaseLike): LockStore {
  return {
    async tryAcquire(input) {
      const { data } = await client
        .from("workflow_locks")
        .update({ locked_until: input.untilIso, holder: input.worker, updated_at: input.nowIso })
        .eq("lock_key", input.key)
        .lt("locked_until", input.nowIso)
        .select("lock_key")
        .maybeSingle();
      return Boolean(data);
    },
    async release(input) {
      await client
        .from("workflow_locks")
        .update({ locked_until: input.nowIso, updated_at: input.nowIso })
        .eq("lock_key", input.key)
        .eq("holder", input.worker)
        .select("lock_key")
        .maybeSingle();
    },
  };
}

// ── SpendStore (internal_ai_spend_ledger) ───────────────────────────────────

/** The ONE keyed internal-spend ledger, via the SECURITY DEFINER RPCs. */
export function internalSpendStore(client: SupabaseLike): SpendStore {
  return {
    async spentToday(input) {
      const { data, error } = await client.rpc("internal_ai_spend_today", { p_budget_key: input.budgetKey });
      if (error) return null; // read failure ⇒ caller degrades CLOSED
      return Number(data) || 0;
    },
    async add(input) {
      if (!(input.addKobo > 0)) return null;
      const { data, error } = await client.rpc("internal_ai_spend_add", {
        p_budget_key: input.budgetKey,
        p_add_kobo: Math.round(input.addKobo),
      });
      if (error) return null;
      return Number(data) || 0;
    },
  };
}
