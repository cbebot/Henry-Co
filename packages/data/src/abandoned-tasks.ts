import "server-only";

/**
 * @henryco/data/abandoned-tasks — server-only read/write surface for the V3-37
 * recovery table `public.abandoned_tasks`.
 *
 * Two client postures:
 *   - SERVICE-ROLE (createDataAdminClient): capture, cadence reads, reminder
 *     bumps, expiry, and the anon→authed claim reconciler. These run from
 *     detectors / public capture actions / cron / the login callback.
 *   - RLS-SCOPED (caller passes its own client): the owner reads/dismisses/
 *     recovers their OWN tasks. RLS (`user_id = auth.uid()`) is the guard, so
 *     the dashboard passes its session-scoped account client.
 *
 * `state` is always passed through `stripSecretsFromState` on write — a careless
 * caller can never leak a secret into the table.
 */
import { createDataAdminClient, type TypedSupabaseClient } from "./client";
import {
  stripSecretsFromState,
  type AbandonedTask,
  type AbandonedTaskState,
  type AbandonedTaskStatus,
  type AbandonedTaskType,
} from "./abandoned-tasks-core";

export {
  ABANDONED_TASK_TYPES,
  ABANDONED_TASK_STATUSES,
  stripSecretsFromState,
  stateHasForbiddenKey,
  isAbandonedTaskType,
  isAbandonedTaskStatus,
  type AbandonedTask,
  type AbandonedTaskState,
  type AbandonedTaskStatus,
  type AbandonedTaskType,
} from "./abandoned-tasks-core";

type AbandonedTaskRow = {
  id: string;
  user_id: string | null;
  task_type: string;
  task_ref: string;
  division: string | null;
  continue_url: string;
  state: unknown;
  last_progress_at: string;
  reminder_count: number;
  last_reminder_at: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

const ROW_COLUMNS =
  "id, user_id, task_type, task_ref, division, continue_url, state, last_progress_at, reminder_count, last_reminder_at, status, created_at, updated_at";

function mapRow(row: AbandonedTaskRow): AbandonedTask {
  return {
    id: row.id,
    userId: row.user_id,
    taskType: row.task_type as AbandonedTaskType,
    taskRef: row.task_ref,
    division: row.division,
    continueUrl: row.continue_url,
    state: (row.state && typeof row.state === "object"
      ? (row.state as AbandonedTaskState)
      : {}) as AbandonedTaskState,
    lastProgressAt: row.last_progress_at,
    reminderCount: row.reminder_count,
    lastReminderAt: row.last_reminder_at,
    status: row.status as AbandonedTaskStatus,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function nowIso(): string {
  return new Date().toISOString();
}

// ─── Capture (service-role) ──────────────────────────────────────────────────

export type CaptureAbandonedTaskInput = {
  /** Set when the visitor is signed in (identified upsert path). */
  userId?: string | null;
  taskType: AbandonedTaskType;
  /** Stable ref to the underlying record/draft (idempotency key). */
  taskRef: string;
  division?: string | null;
  /** Deep link to the exact next step (built via @henryco/config helpers). */
  continueUrl: string;
  /** Restorable snapshot — secrets are stripped on write. */
  state?: unknown;
  /** When the user last made progress (defaults to now). */
  lastProgressAt?: string;
  /** Anonymous capture: a stable per-journey token the client owns + threads through login. */
  claimToken?: string | null;
  claimEmail?: string | null;
  claimPhone?: string | null;
};

/**
 * Idempotently capture (or refresh) an abandoned task. Re-progress re-opens the
 * task to `pending` and resets the reminder counters. Returns the row id, or
 * null on failure (capture must never throw into the host flow).
 *
 *   - identified (userId set): upsert on (user_id, task_type, task_ref).
 *   - anonymous (claimToken set): dedupe by claim_token.
 */
export async function captureAbandonedTask(
  input: CaptureAbandonedTaskInput,
): Promise<{ id: string } | null> {
  const admin = createDataAdminClient();
  const state = stripSecretsFromState(input.state ?? {});
  const last_progress_at = input.lastProgressAt ?? nowIso();

  try {
    if (input.userId) {
      const { data, error } = await admin
        .from("abandoned_tasks")
        .upsert(
          {
            user_id: input.userId,
            task_type: input.taskType,
            task_ref: input.taskRef,
            division: input.division ?? null,
            continue_url: input.continueUrl,
            state,
            last_progress_at,
            status: "pending",
            reminder_count: 0,
            last_reminder_at: null,
          },
          { onConflict: "user_id,task_type,task_ref" },
        )
        .select("id")
        .single();
      if (error || !data) return null;
      return { id: data.id };
    }

    // Anonymous: dedupe on the claim token (partial-unique). Manual
    // find-then-write so we don't depend on PostgREST partial-index upsert.
    const token = input.claimToken;
    if (!token) return null;

    const existing = await admin
      .from("abandoned_tasks")
      .select("id")
      .eq("claim_token", token)
      .maybeSingle();

    if (existing.data) {
      const { error } = await admin
        .from("abandoned_tasks")
        .update({
          task_type: input.taskType,
          task_ref: input.taskRef,
          division: input.division ?? null,
          continue_url: input.continueUrl,
          state,
          last_progress_at,
          status: "pending",
          reminder_count: 0,
          last_reminder_at: null,
          claim_email: input.claimEmail ?? null,
          claim_phone: input.claimPhone ?? null,
        })
        .eq("id", existing.data.id);
      if (error) return null;
      return { id: existing.data.id };
    }

    const { data, error } = await admin
      .from("abandoned_tasks")
      .insert({
        user_id: null,
        task_type: input.taskType,
        task_ref: input.taskRef,
        division: input.division ?? null,
        continue_url: input.continueUrl,
        state,
        last_progress_at,
        status: "pending",
        claim_token: token,
        claim_email: input.claimEmail ?? null,
        claim_phone: input.claimPhone ?? null,
      })
      .select("id")
      .single();
    if (error || !data) return null;
    return { id: data.id };
  } catch {
    return null;
  }
}

// ─── Cadence (service-role) ──────────────────────────────────────────────────

/** Pending tasks idle for at least `idleMs`, oldest progress first (cadence worker). */
export async function listPendingAbandonedTasks(opts: {
  idleMs?: number;
  limit?: number;
} = {}): Promise<AbandonedTask[]> {
  const admin = createDataAdminClient();
  const limit = Math.min(Math.max(opts.limit ?? 200, 1), 1000);
  let query = admin
    .from("abandoned_tasks")
    .select(ROW_COLUMNS)
    .eq("status", "pending")
    .not("user_id", "is", null)
    .order("last_progress_at", { ascending: true })
    .limit(limit);
  if (opts.idleMs && opts.idleMs > 0) {
    const cutoff = new Date(Date.now() - opts.idleMs).toISOString();
    query = query.lte("last_progress_at", cutoff);
  }
  const { data } = await query;
  return ((data ?? []) as AbandonedTaskRow[]).map(mapRow);
}

/** Record that a reminder was sent (increments reminder_count, stamps last_reminder_at). */
export async function bumpAbandonedTaskReminder(
  id: string,
  current: number,
): Promise<void> {
  const admin = createDataAdminClient();
  await admin
    .from("abandoned_tasks")
    .update({ reminder_count: current + 1, last_reminder_at: nowIso() })
    .eq("id", id)
    .eq("status", "pending");
}

/** Expire pending tasks that have been idle past the window. Returns count expired. */
export async function expireStaleAbandonedTasks(idleMs: number): Promise<number> {
  const admin = createDataAdminClient();
  const cutoff = new Date(Date.now() - idleMs).toISOString();
  const { data } = await admin
    .from("abandoned_tasks")
    .update({ status: "expired" })
    .eq("status", "pending")
    .lte("last_progress_at", cutoff)
    .select("id");
  return (data ?? []).length;
}

// ─── Claim reconciler (service-role) — anon→authed bridge ────────────────────

export type ClaimAbandonedTasksInput = {
  userId: string;
  /** Already-expanded, normalised candidate emails (caller builds variants). */
  emails?: string[];
  /** Already-expanded, normalised candidate phones (caller builds variants). */
  phones?: string[];
  /** A specific claim token threaded through login (most precise match). */
  token?: string | null;
};

/**
 * Claim anonymous (user_id NULL) tasks for a now-authed user, matching by claim
 * token and/or contact. Resolves the UNIQUE(user_id, task_type, task_ref)
 * collision by keeping the row with the newer last_progress_at. Returns the
 * number of tasks the user now owns as a result. Safe to call on every login
 * (idempotent — no unclaimed match ⇒ 0).
 */
export async function claimAbandonedTasksForUser(
  input: ClaimAbandonedTasksInput,
): Promise<number> {
  const admin = createDataAdminClient();
  const emails = uniq((input.emails ?? []).map((e) => e.trim().toLowerCase()).filter(Boolean));
  const phones = uniq((input.phones ?? []).map((p) => p.trim()).filter(Boolean));

  const candidates = new Map<string, AbandonedTaskRow>();
  const pushAll = (rows: AbandonedTaskRow[] | null) => {
    for (const r of rows ?? []) candidates.set(r.id, r);
  };

  if (input.token) {
    const { data } = await admin
      .from("abandoned_tasks")
      .select(ROW_COLUMNS + ", claim_token")
      .is("user_id", null)
      .eq("claim_token", input.token);
    pushAll(data as AbandonedTaskRow[] | null);
  }
  if (emails.length) {
    const { data } = await admin
      .from("abandoned_tasks")
      .select(ROW_COLUMNS)
      .is("user_id", null)
      .in("claim_email", emails);
    pushAll(data as AbandonedTaskRow[] | null);
  }
  if (phones.length) {
    const { data } = await admin
      .from("abandoned_tasks")
      .select(ROW_COLUMNS)
      .is("user_id", null)
      .in("claim_phone", phones);
    pushAll(data as AbandonedTaskRow[] | null);
  }
  if (candidates.size === 0) return 0;

  const { data: existingRows } = await admin
    .from("abandoned_tasks")
    .select("id, task_type, task_ref, last_progress_at")
    .eq("user_id", input.userId);
  const existingByKey = new Map<
    string,
    { id: string; last_progress_at: string }
  >();
  for (const r of (existingRows ?? []) as Pick<
    AbandonedTaskRow,
    "id" | "task_type" | "task_ref" | "last_progress_at"
  >[]) {
    existingByKey.set(`${r.task_type}::${r.task_ref}`, {
      id: r.id,
      last_progress_at: r.last_progress_at,
    });
  }

  let claimed = 0;
  for (const c of candidates.values()) {
    const key = `${c.task_type}::${c.task_ref}`;
    const dup = existingByKey.get(key);
    if (!dup) {
      const { error } = await admin
        .from("abandoned_tasks")
        .update({
          user_id: input.userId,
          claim_token: null,
          claim_email: null,
          claim_phone: null,
        })
        .eq("id", c.id)
        .is("user_id", null);
      if (!error) {
        claimed++;
        existingByKey.set(key, { id: c.id, last_progress_at: c.last_progress_at });
      }
      continue;
    }
    // The user already has this (type, ref): keep the newer, drop the other.
    if (new Date(c.last_progress_at).getTime() > new Date(dup.last_progress_at).getTime()) {
      await admin
        .from("abandoned_tasks")
        .update({
          continue_url: c.continue_url,
          state: (c.state as AbandonedTaskState) ?? {},
          division: c.division,
          last_progress_at: c.last_progress_at,
          status: "pending",
          reminder_count: 0,
          last_reminder_at: null,
        })
        .eq("id", dup.id);
      await admin.from("abandoned_tasks").delete().eq("id", c.id);
      existingByKey.set(key, { id: dup.id, last_progress_at: c.last_progress_at });
      claimed++;
    } else {
      await admin.from("abandoned_tasks").delete().eq("id", c.id);
    }
  }
  return claimed;
}

// ─── Owner reads/writes (RLS-scoped client passed in) ────────────────────────

/** The signed-in user's own tasks (RLS-enforced). Defaults to live (pending/recovered). */
export async function listUserAbandonedTasks(
  client: TypedSupabaseClient,
  userId: string,
  opts: { statuses?: AbandonedTaskStatus[]; limit?: number } = {},
): Promise<AbandonedTask[]> {
  const statuses = opts.statuses ?? ["pending"];
  const limit = Math.min(Math.max(opts.limit ?? 50, 1), 200);
  const { data } = await client
    .from("abandoned_tasks")
    .select(ROW_COLUMNS)
    .eq("user_id", userId)
    .in("status", statuses)
    .order("last_progress_at", { ascending: false })
    .limit(limit);
  return ((data ?? []) as AbandonedTaskRow[]).map(mapRow);
}

/** Dismiss a task (no more nudges). RLS ensures the caller owns it. */
export async function dismissAbandonedTask(
  client: TypedSupabaseClient,
  id: string,
): Promise<boolean> {
  const { error } = await client
    .from("abandoned_tasks")
    .update({ status: "dismissed" })
    .eq("id", id);
  return !error;
}

/** Mark a task recovered (the user returned and completed it). */
export async function markAbandonedTaskRecovered(
  client: TypedSupabaseClient,
  id: string,
): Promise<boolean> {
  const { error } = await client
    .from("abandoned_tasks")
    .update({ status: "recovered" })
    .eq("id", id);
  return !error;
}

function uniq<T>(items: T[]): T[] {
  return Array.from(new Set(items));
}
