import "server-only";

/**
 * SA-4 — hub-side READ model over the SA-2/SA-3 studio-agency tables.
 *
 * Service-role reads (the tables are deny-RLS; safety = the owner gate on
 * every calling surface, exactly like lookup-catalog.ts / owner-data.ts).
 * Every reader degrades to empty/null on a missing table or column so a hub
 * deploy ahead of the studio migrations fails SAFE and QUIET (the safeSelect
 * doctrine) — and everything is dark anyway until STUDIO_AGENCY_LIVE=1.
 */

import { createAdminSupabase } from "@/lib/supabase";
import {
  isAgencyActiveStage,
  OPERATOR_HOLD_SENTINEL,
  type StudioBuildStage,
} from "@/lib/founder-intelligence/studio-agency-model";

/** Mirror of the studio app's flag.ts semantics — dark unless explicitly on. */
export function isStudioAgencyLiveHub(env: Record<string, string | undefined> = process.env): boolean {
  const v = String(env.STUDIO_AGENCY_LIVE ?? "").trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes" || v === "on";
}

export type AgencyJobRead = {
  id: string;
  projectId: string;
  briefId: string;
  stage: StudioBuildStage;
  attempt: number;
  budgetKobo: number;
  costKobo: number;
  claimedBy: string | null;
  lastHeartbeatAt: string | null;
  artifactHash: string | null;
  approvedArtifactHash: string | null;
  briefClass: "template" | "agency" | null;
  isInternal: boolean;
  createdAt: string;
  updatedAt: string;
};

const JOB_READ_COLUMNS =
  "id, project_id, brief_id, stage, attempt, budget_kobo, cost_kobo, claimed_by, last_heartbeat_at, artifact_hash, approved_artifact_hash, brief_class, is_internal, created_at, updated_at";

function mapJob(row: Record<string, unknown>): AgencyJobRead {
  return {
    id: String(row.id),
    projectId: String(row.project_id),
    briefId: String(row.brief_id),
    stage: String(row.stage) as StudioBuildStage,
    attempt: Number(row.attempt ?? 0),
    budgetKobo: Number(row.budget_kobo ?? 0),
    costKobo: Number(row.cost_kobo ?? 0),
    claimedBy: (row.claimed_by as string) ?? null,
    lastHeartbeatAt: (row.last_heartbeat_at as string) ?? null,
    artifactHash: (row.artifact_hash as string) ?? null,
    approvedArtifactHash: (row.approved_artifact_hash as string) ?? null,
    briefClass: (row.brief_class as "template" | "agency" | null) ?? null,
    isInternal: Boolean(row.is_internal),
    createdAt: String(row.created_at ?? ""),
    updatedAt: String(row.updated_at ?? ""),
  };
}

export async function getAgencyJob(jobId: string): Promise<AgencyJobRead | null> {
  try {
    const admin = createAdminSupabase();
    const { data, error } = await admin
      .from("studio_build_jobs")
      .select(JOB_READ_COLUMNS)
      .eq("id", jobId)
      .maybeSingle();
    if (error || !data) return null;
    return mapJob(data as Record<string, unknown>);
  } catch {
    return null;
  }
}

export async function listAgencyJobs(opts?: {
  stages?: StudioBuildStage[];
  limit?: number;
}): Promise<AgencyJobRead[]> {
  try {
    const admin = createAdminSupabase();
    let query = admin
      .from("studio_build_jobs")
      .select(JOB_READ_COLUMNS)
      .order("updated_at", { ascending: false })
      .limit(opts?.limit ?? 50);
    if (opts?.stages && opts.stages.length > 0) query = query.in("stage", opts.stages);
    const { data, error } = await query;
    if (error || !data) return [];
    return (data as Record<string, unknown>[]).map(mapJob);
  } catch {
    return [];
  }
}

export async function listActiveAgencyJobs(limit = 50): Promise<AgencyJobRead[]> {
  const rows = await listAgencyJobs({ limit: Math.min(200, limit * 3) });
  return rows.filter((j) => isAgencyActiveStage(j.stage)).slice(0, limit);
}

export function isOperatorHeld(job: AgencyJobRead): boolean {
  return job.claimedBy === OPERATOR_HOLD_SENTINEL;
}

export type AgencyProposalRead = {
  id: string;
  leadId: string;
  status: string;
  title: string;
};

/** Proposals held at the SA-D5 review gate — the "pending agency briefs".
 *  (The in_review hold lives on studio_proposals, NOT on studio_briefs.) */
export async function listProposalsInReview(limit = 12): Promise<AgencyProposalRead[]> {
  try {
    const admin = createAdminSupabase();
    const { data, error } = await admin
      .from("studio_proposals")
      .select("id, lead_id, status, title")
      .eq("status", "in_review")
      .order("updated_at", { ascending: false })
      .limit(limit);
    if (error || !data) return [];
    return (data as Record<string, unknown>[]).map((row) => ({
      id: String(row.id),
      leadId: String(row.lead_id ?? ""),
      status: String(row.status ?? ""),
      title: String(row.title ?? "Proposal"),
    }));
  } catch {
    return [];
  }
}

export type AgencyBriefRead = {
  id: string;
  leadId: string;
  briefClass: "template" | "agency" | null;
  goals: string;
  businessType: string;
  budgetBand: string;
  urgency: string;
  timeline: string;
  packageIntent: string;
  createdAt: string;
};

export async function getStudioBrief(briefId: string): Promise<AgencyBriefRead | null> {
  try {
    const admin = createAdminSupabase();
    const { data, error } = await admin
      .from("studio_briefs")
      .select("id, lead_id, brief_class, goals, business_type, budget_band, urgency, timeline, package_intent, created_at")
      .eq("id", briefId)
      .maybeSingle();
    if (error || !data) return null;
    const row = data as Record<string, unknown>;
    return {
      id: String(row.id),
      leadId: String(row.lead_id ?? ""),
      briefClass: (row.brief_class as "template" | "agency" | null) ?? null,
      goals: String(row.goals ?? ""),
      businessType: String(row.business_type ?? ""),
      budgetBand: String(row.budget_band ?? ""),
      urgency: String(row.urgency ?? ""),
      timeline: String(row.timeline ?? ""),
      packageIntent: String(row.package_intent ?? ""),
      createdAt: String(row.created_at ?? ""),
    };
  } catch {
    return null;
  }
}

export type AgencyProjectRead = {
  id: string;
  title: string;
  status: string;
};

export async function getStudioProject(projectId: string): Promise<AgencyProjectRead | null> {
  try {
    const admin = createAdminSupabase();
    const { data, error } = await admin
      .from("studio_projects")
      .select("id, title, status")
      .eq("id", projectId)
      .maybeSingle();
    if (error || !data) return null;
    const row = data as Record<string, unknown>;
    return {
      id: String(row.id),
      title: String(row.title ?? "Studio project"),
      status: String(row.status ?? ""),
    };
  } catch {
    return null;
  }
}

/** Pending rows in the SA-3 studio decisions inbox (owner/ops read). */
export async function countPendingStudioDecisions(): Promise<number> {
  try {
    const admin = createAdminSupabase();
    const { count, error } = await admin
      .from("studio_agency_decisions")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending");
    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}

export type AgencyBriefSnapshot = {
  activeJobs: number;
  awaitingOwner: number;
  stalled: number;
  proposalsInReview: number;
  studioDecisionsPending: number;
  accruedTodayKobo: number;
};

/** The morning-brief / facts-pack agency snapshot — counts only, one pass. */
export async function getAgencyBriefSnapshot(now = new Date()): Promise<AgencyBriefSnapshot> {
  const empty: AgencyBriefSnapshot = {
    activeJobs: 0,
    awaitingOwner: 0,
    stalled: 0,
    proposalsInReview: 0,
    studioDecisionsPending: 0,
    accruedTodayKobo: 0,
  };
  try {
    const [jobs, proposals, decisions] = await Promise.all([
      listAgencyJobs({ limit: 200 }),
      listProposalsInReview(50),
      countPendingStudioDecisions(),
    ]);
    const dayStart = `${now.toISOString().slice(0, 10)}T00:00:00.000Z`;
    let activeJobs = 0;
    let awaitingOwner = 0;
    let stalled = 0;
    let accruedTodayKobo = 0;
    for (const job of jobs) {
      if (isAgencyActiveStage(job.stage)) activeJobs += 1;
      if (job.stage === "owner_review" || job.stage === "approved_for_deploy") awaitingOwner += 1;
      if (job.stage === "stalled") stalled += 1;
      if (job.createdAt >= dayStart) accruedTodayKobo += Math.max(0, job.costKobo);
    }
    return {
      activeJobs,
      awaitingOwner,
      stalled,
      proposalsInReview: proposals.length,
      studioDecisionsPending: decisions,
      accruedTodayKobo,
    };
  } catch {
    return empty;
  }
}
