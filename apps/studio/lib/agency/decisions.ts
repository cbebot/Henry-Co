import "server-only";

/**
 * SA-3 — the durable, server-initiated Owner-AI decision inbox (ARCHITECTURE
 * §4.2). The orchestrator PREPARES and QUEUES one-tap decisions here (deploy
 * approval, budget increase, a stall, an aging review); the owner returns to a
 * triaged, count-badged inbox instead of a chat scrollback and ONE-TAPS.
 *
 * This is deliberately studio-scoped: it does NOT fork the flag-dark hub
 * `founder_action_proposals` spine (SA-4). The safety property is identical and
 * unchanged: a decision row carries NO authority — acting on it routes to the
 * SAME reauth-gated action route, which re-reads true state and re-authorizes.
 * A long-lived row is safe precisely because nothing trusts its freshness.
 *
 * Queueing is idempotent: at most ONE pending row per (job, kind) (the partial
 * unique index is the wall; the tick is single-worker-per-job so the read-then-
 * write here never races itself, and a unique violation is swallowed as
 * "already queued").
 */

import { createAdminSupabase, hasAdminSupabaseEnv } from "@/lib/supabase";
import { writeAuditLog } from "@henryco/observability/audit-log";
import { emitEvent } from "@henryco/observability/events";
import { appendBuildEvent } from "@/lib/agency/store";

export type AgencyDecisionKind =
  | "deploy_approval"
  | "budget_increase"
  | "job_stalled"
  | "review_stalled"
  | "qa_failed"
  | "build_failed"
  | "deploy_check_failed";

export type AgencyDecisionStatus = "pending" | "acted" | "superseded" | "dismissed";

export type AgencyDecision = {
  id: string;
  jobId: string;
  projectId: string;
  kind: AgencyDecisionKind;
  status: AgencyDecisionStatus;
  title: string;
  body: string;
  actionKey: string | null;
  payload: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  actedBy: string | null;
  actedAt: string | null;
};

const DECISION_COLUMNS =
  "id, job_id, project_id, kind, status, title, body, action_key, payload, created_at, updated_at, acted_by, acted_at";

function mapDecision(row: Record<string, unknown>): AgencyDecision {
  return {
    id: String(row.id),
    jobId: String(row.job_id),
    projectId: String(row.project_id),
    kind: String(row.kind) as AgencyDecisionKind,
    status: String(row.status) as AgencyDecisionStatus,
    title: String(row.title ?? ""),
    body: String(row.body ?? ""),
    actionKey: (row.action_key as string) ?? null,
    payload: (row.payload as Record<string, unknown>) ?? {},
    createdAt: String(row.created_at ?? ""),
    updatedAt: String(row.updated_at ?? ""),
    actedBy: (row.acted_by as string) ?? null,
    actedAt: (row.acted_at as string) ?? null,
  };
}

/**
 * Queue (or refresh) a pending decision for a job. Idempotent by (job_id, kind):
 * a re-detected condition updates the existing pending row rather than flooding
 * the inbox. Returns the decision id, or null when unavailable/failed.
 */
export async function queueDecision(input: {
  jobId: string;
  projectId: string;
  kind: AgencyDecisionKind;
  title: string;
  body?: string;
  actionKey?: string | null;
  payload?: Record<string, unknown>;
}): Promise<string | null> {
  if (!hasAdminSupabaseEnv()) return null;
  const admin = createAdminSupabase();

  // Already pending? Refresh its copy (idempotent — do not duplicate the row).
  const { data: existing } = await admin
    .from("studio_agency_decisions")
    .select("id")
    .eq("job_id", input.jobId)
    .eq("kind", input.kind)
    .eq("status", "pending")
    .maybeSingle();

  if (existing && (existing as { id: string }).id) {
    const id = (existing as { id: string }).id;
    await admin
      .from("studio_agency_decisions")
      .update({
        title: input.title,
        body: input.body ?? "",
        action_key: input.actionKey ?? null,
        payload: input.payload ?? {},
        updated_at: new Date().toISOString(),
      } as never)
      .eq("id", id);
    return id;
  }

  const { data, error } = await admin
    .from("studio_agency_decisions")
    .insert({
      job_id: input.jobId,
      project_id: input.projectId,
      kind: input.kind,
      status: "pending",
      title: input.title,
      body: input.body ?? "",
      action_key: input.actionKey ?? null,
      payload: input.payload ?? {},
    } as never)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    // A concurrent insert lost the partial-unique race → the decision is already
    // queued, which is exactly the idempotent outcome we want.
    return null;
  }
  const id = (data as { id: string }).id;

  await appendBuildEvent(input.jobId, "decision_queued", { kind: input.kind, decision_id: id });
  emitEvent({
    name: "henry.studio.build.decision_queued",
    classification: "system_state",
    outcome: "completed",
    payload: { job_id: input.jobId, project_id: input.projectId, kind: input.kind },
  });
  await writeAuditLog(admin as never, {
    action: "studio.build.decision.queued",
    entityType: "studio_agency_decision",
    entityId: id,
    newValues: { kind: input.kind, job_id: input.jobId },
    division: "studio",
    correlationId: input.jobId,
  });
  return id;
}

/** List pending decisions (the owner's inbox), newest first. */
export async function listPendingDecisions(limit = 50): Promise<AgencyDecision[]> {
  if (!hasAdminSupabaseEnv()) return [];
  const admin = createAdminSupabase();
  const { data, error } = await admin
    .from("studio_agency_decisions")
    .select(DECISION_COLUMNS)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(mapDecision);
}

export async function countPendingDecisions(): Promise<number> {
  if (!hasAdminSupabaseEnv()) return 0;
  const admin = createAdminSupabase();
  const { count } = await admin
    .from("studio_agency_decisions")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");
  return count ?? 0;
}

/**
 * Resolve a decision (acted/dismissed). CAS on status='pending' so a
 * double-tap or a concurrent supersede cannot double-resolve. Attribution is
 * the acting owner's id (never client-supplied). Returns whether this call won.
 */
export async function resolveDecision(input: {
  decisionId: string;
  status: "acted" | "dismissed";
  actor: string;
}): Promise<boolean> {
  if (!hasAdminSupabaseEnv()) return false;
  const admin = createAdminSupabase();
  const { data } = await admin
    .from("studio_agency_decisions")
    .update({
      status: input.status,
      acted_by: input.actor,
      acted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as never)
    .eq("id", input.decisionId)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();
  return Boolean(data);
}

/**
 * Supersede any pending decisions of the given kinds for a job — used when the
 * underlying condition resolves (e.g. the job left owner_review, so a pending
 * deploy_approval is stale). Never trusted for auth; purely inbox hygiene.
 */
export async function supersedeDecisions(jobId: string, kinds: AgencyDecisionKind[]): Promise<void> {
  if (!hasAdminSupabaseEnv() || kinds.length === 0) return;
  const admin = createAdminSupabase();
  await admin
    .from("studio_agency_decisions")
    .update({ status: "superseded", updated_at: new Date().toISOString() } as never)
    .eq("job_id", jobId)
    .in("kind", kinds)
    .eq("status", "pending");
}

export async function getDecision(decisionId: string): Promise<AgencyDecision | null> {
  if (!hasAdminSupabaseEnv()) return null;
  const admin = createAdminSupabase();
  const { data } = await admin
    .from("studio_agency_decisions")
    .select(DECISION_COLUMNS)
    .eq("id", decisionId)
    .maybeSingle();
  return data ? mapDecision(data as Record<string, unknown>) : null;
}
