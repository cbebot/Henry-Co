import "server-only";

/**
 * SA-2 — the build-job repository. Service-role reads/writes over the SA-2
 * tables (RLS default-deny; the tick, callback route, and staff console all
 * go through here). Every state move funnels through `transitionJob`, which
 * re-checks legality in the app layer (the DB trigger is the second wall) and
 * writes the audit + event trail FIRST — no trail, no action.
 *
 * All money figures are kobo BIGINT. The agent never writes these tables; the
 * orchestrator does, from HMAC-verified reports.
 */

import { createAdminSupabase, hasAdminSupabaseEnv } from "@/lib/supabase";
import { writeAuditLog } from "@henryco/observability/audit-log";
import {
  checkTransition,
  isActiveStage,
  type BuildStage,
} from "@/lib/agency/state-machine";
import type { BuildJobSpec, QaReport } from "@/lib/agency/contracts";

export type BuildJobRow = {
  id: string;
  projectId: string;
  briefId: string;
  spec: BuildJobSpec | Record<string, unknown>;
  stage: BuildStage;
  attempt: number;
  costMode: "mode_a" | "mode_b";
  track: "bundle" | "codegen";
  budgetKobo: number;
  costKobo: number;
  claimedBy: string | null;
  claimedAt: string | null;
  executorRunRef: string | null;
  lastHeartbeatAt: string | null;
  heartbeatSeq: number;
  artifactRef: string | null;
  artifactHash: string | null;
  previewRef: string | null;
  qa: QaReport | null;
  briefClass: "template" | "agency" | null;
  isInternal: boolean;
  parentJobId: string | null;
  createdAt: string;
  updatedAt: string;
};

function mapJob(row: Record<string, unknown>): BuildJobRow {
  return {
    id: String(row.id),
    projectId: String(row.project_id),
    briefId: String(row.brief_id),
    spec: (row.spec as Record<string, unknown>) ?? {},
    stage: String(row.stage) as BuildStage,
    attempt: Number(row.attempt ?? 0),
    costMode: (row.cost_mode as "mode_a" | "mode_b") ?? "mode_a",
    track: (row.track as "bundle" | "codegen") ?? "bundle",
    budgetKobo: Number(row.budget_kobo ?? 0),
    costKobo: Number(row.cost_kobo ?? 0),
    claimedBy: (row.claimed_by as string) ?? null,
    claimedAt: (row.claimed_at as string) ?? null,
    executorRunRef: (row.executor_run_ref as string) ?? null,
    lastHeartbeatAt: (row.last_heartbeat_at as string) ?? null,
    heartbeatSeq: Number(row.heartbeat_seq ?? 0),
    artifactRef: (row.artifact_ref as string) ?? null,
    artifactHash: (row.artifact_hash as string) ?? null,
    previewRef: (row.preview_ref as string) ?? null,
    qa: (row.qa as QaReport) ?? null,
    briefClass: (row.brief_class as "template" | "agency" | null) ?? null,
    isInternal: Boolean(row.is_internal),
    parentJobId: (row.parent_job_id as string) ?? null,
    createdAt: String(row.created_at ?? ""),
    updatedAt: String(row.updated_at ?? ""),
  };
}

const JOB_COLUMNS =
  "id, project_id, brief_id, spec, stage, attempt, cost_mode, track, budget_kobo, cost_kobo, claimed_by, claimed_at, executor_run_ref, last_heartbeat_at, heartbeat_seq, artifact_ref, artifact_hash, preview_ref, qa, brief_class, is_internal, parent_job_id, created_at, updated_at";

export async function getBuildJob(jobId: string): Promise<BuildJobRow | null> {
  if (!hasAdminSupabaseEnv()) return null;
  const admin = createAdminSupabase();
  const { data, error } = await admin
    .from("studio_build_jobs")
    .select(JOB_COLUMNS)
    .eq("id", jobId)
    .maybeSingle();
  if (error || !data) return null;
  return mapJob(data as Record<string, unknown>);
}

export async function listBuildJobs(opts?: { stages?: BuildStage[]; limit?: number }): Promise<BuildJobRow[]> {
  if (!hasAdminSupabaseEnv()) return [];
  const admin = createAdminSupabase();
  let query = admin
    .from("studio_build_jobs")
    .select(JOB_COLUMNS)
    .order("updated_at", { ascending: false })
    .limit(opts?.limit ?? 100);
  if (opts?.stages && opts.stages.length > 0) {
    query = query.in("stage", opts.stages);
  }
  const { data, error } = await query;
  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(mapJob);
}

/** Append an event row (append-only log). Best-effort; never blocks the caller. */
export async function appendBuildEvent(
  jobId: string,
  kind: string,
  payload: Record<string, unknown> = {},
): Promise<void> {
  if (!hasAdminSupabaseEnv()) return;
  try {
    const admin = createAdminSupabase();
    await admin.from("studio_build_events").insert({ job_id: jobId, kind, payload } as never);
  } catch {
    // append-only telemetry — a lost event is a nuisance, not a failure path.
  }
}

export type TransitionResult =
  | { ok: true; job: BuildJobRow }
  | { ok: false; reason: string };

/**
 * The single app-layer choke point for stage moves. Audit-first-abort:
 * the event + audit rows are written, THEN the stage flips (with the prior
 * stage in the WHERE so a concurrent tick cannot double-move). The DB trigger
 * independently rejects an illegal edge — this is belt and braces.
 *
 * `actor` is the resolved human/staff/system id (never caller-supplied for a
 * client) and is recorded on the audit row via the request-scoped path when
 * available; here we use the service-role client and pass actor into payload
 * for attribution (add_audit_log_v2 resolves actor from auth.uid(), which is
 * NULL for service-role = system action — deliberate for orchestrator moves).
 */
export async function transitionJob(input: {
  jobId: string;
  to: BuildStage;
  reason: string;
  actor?: string | null;
  patch?: Record<string, unknown>;
  eventPayload?: Record<string, unknown>;
}): Promise<TransitionResult> {
  if (!hasAdminSupabaseEnv()) return { ok: false, reason: "no_admin_env" };
  const admin = createAdminSupabase();

  const job = await getBuildJob(input.jobId);
  if (!job) return { ok: false, reason: "job_not_found" };

  const legality = checkTransition(job.stage, input.to);
  if (!legality.ok) {
    await appendBuildEvent(input.jobId, "transition_rejected", {
      from: job.stage,
      to: input.to,
      reason: legality.reason,
    });
    return { ok: false, reason: legality.reason };
  }

  // Audit + event FIRST (no trail, no action).
  await appendBuildEvent(input.jobId, "transition", {
    from: job.stage,
    to: input.to,
    reason: input.reason,
    actor: input.actor ?? "system",
    ...(input.eventPayload ?? {}),
  });
  await writeAuditLog(admin as never, {
    action: `studio.build.job.${input.to}`,
    entityType: "studio_build_job",
    entityId: input.jobId,
    oldValues: { stage: job.stage },
    newValues: { stage: input.to, ...(input.patch ?? {}) },
    reason: input.reason,
    division: "studio",
    correlationId: input.jobId,
  });

  const { data, error } = await admin
    .from("studio_build_jobs")
    .update({
      stage: input.to,
      updated_at: new Date().toISOString(),
      ...(input.patch ?? {}),
    } as never)
    .eq("id", input.jobId)
    .eq("stage", job.stage) // optimistic concurrency — the prior stage must still hold
    .select(JOB_COLUMNS)
    .maybeSingle();

  if (error || !data) {
    await appendBuildEvent(input.jobId, "transition_conflict", { from: job.stage, to: input.to });
    return { ok: false, reason: "conflict_or_db_error" };
  }
  return { ok: true, job: mapJob(data as Record<string, unknown>) };
}

/**
 * CAS claim for the tick — flip claimed_by only when currently unclaimed
 * (single worker per job). Returns true when this worker won the claim.
 */
export async function claimJob(jobId: string, worker: string): Promise<boolean> {
  if (!hasAdminSupabaseEnv()) return false;
  const admin = createAdminSupabase();
  const { data } = await admin
    .from("studio_build_jobs")
    .update({ claimed_by: worker, claimed_at: new Date().toISOString() } as never)
    .eq("id", jobId)
    .is("claimed_by", null)
    .select("id")
    .maybeSingle();
  return Boolean(data);
}

export async function releaseJobClaim(jobId: string): Promise<void> {
  if (!hasAdminSupabaseEnv()) return;
  const admin = createAdminSupabase();
  await admin
    .from("studio_build_jobs")
    .update({ claimed_by: null, claimed_at: null } as never)
    .eq("id", jobId);
}

/** Active jobs (a tick candidate set) — one active job per project is enforced by the index. */
export async function listActiveJobs(): Promise<BuildJobRow[]> {
  const all = await listBuildJobs({ limit: 200 });
  return all.filter((job) => isActiveStage(job.stage));
}
