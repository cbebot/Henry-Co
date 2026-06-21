import "server-only";

import { createAdminSupabase } from "@/lib/supabase";
import { resolveMentions, type DecisionType, decisionToTransition } from "@/lib/jobs/hiring-suite-logic";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type HiringMember = {
  userId: string;
  role: string;
  name: string | null;
  email: string | null;
  avatarUrl: string | null;
};

export type HiringApplicationContext = {
  applicationId: string;
  pipelineId: string;
  businessId: string | null;
  currentStage: string;
  status: string;
  stages: string[];
  candidateId: string | null;
  candidateName: string | null;
  jobTitle: string | null;
};

export type TeamNote = {
  id: string;
  applicationId: string;
  parentNoteId: string | null;
  authorUserId: string;
  authorName: string | null;
  body: string;
  mentions: string[];
  createdAt: string;
};

export type ScoreRow = {
  id: string;
  applicationId: string;
  stage: string;
  scorerUserId: string;
  scorerName: string | null;
  rubricKey: string;
  score: number;
  comment: string | null;
  updatedAt: string;
};

export type ScoreSummary = {
  applicationId: string;
  scorerCount: number;
  scoreCount: number;
  overallMean: number | null;
  rubricMeans: Record<string, { mean: number; count: number }>;
  predictiveScore: number | null;
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const asString = (v: unknown, fallback = "") => (typeof v === "string" ? v : fallback);

async function fetchProfileMap(userIds: string[]): Promise<Map<string, { name: string | null; email: string | null; avatarUrl: string | null }>> {
  const map = new Map<string, { name: string | null; email: string | null; avatarUrl: string | null }>();
  const ids = Array.from(new Set(userIds.filter(Boolean)));
  if (ids.length === 0) return map;
  const admin = createAdminSupabase();
  const { data } = await admin
    .from("customer_profiles")
    .select("id, full_name, email, avatar_url")
    .in("id", ids);
  for (const row of (data ?? []) as Record<string, unknown>[]) {
    map.set(asString(row.id), {
      name: row.full_name ? asString(row.full_name) : null,
      email: row.email ? asString(row.email) : null,
      avatarUrl: row.avatar_url ? asString(row.avatar_url) : null,
    });
  }
  return map;
}

/* ------------------------------------------------------------------ */
/*  Pipeline / application context                                     */
/* ------------------------------------------------------------------ */

export async function getBusinessName(businessId: string): Promise<string | null> {
  if (!businessId) return null;
  const admin = createAdminSupabase();
  const { data } = await admin
    .from("businesses")
    .select("trading_name, legal_name")
    .eq("id", businessId)
    .maybeSingle();
  if (!data) return null;
  const b = data as Record<string, unknown>;
  return (b.trading_name ? asString(b.trading_name) : null) || (b.legal_name ? asString(b.legal_name) : null);
}

export async function getPipelineBusinessId(pipelineId: string): Promise<string | null> {
  const admin = createAdminSupabase();
  const { data } = await admin
    .from("jobs_hiring_pipelines")
    .select("business_id")
    .eq("id", pipelineId)
    .maybeSingle();
  const biz = (data as { business_id?: string | null } | null)?.business_id;
  return biz ?? null;
}

export async function getApplicationContext(applicationId: string): Promise<HiringApplicationContext | null> {
  const admin = createAdminSupabase();
  const { data: app } = await admin
    .from("jobs_applications")
    .select("id, pipeline_id, current_stage, status, candidate_id, candidate_name")
    .eq("id", applicationId)
    .maybeSingle();
  if (!app) return null;
  const a = app as Record<string, unknown>;
  const pipelineId = asString(a.pipeline_id);
  let businessId: string | null = null;
  let stages: string[] = [];
  let jobTitle: string | null = null;
  if (pipelineId) {
    const { data: pipe } = await admin
      .from("jobs_hiring_pipelines")
      .select("business_id, stages, job_title")
      .eq("id", pipelineId)
      .maybeSingle();
    const p = (pipe ?? {}) as Record<string, unknown>;
    businessId = p.business_id ? asString(p.business_id) : null;
    stages = Array.isArray(p.stages) ? (p.stages as unknown[]).map((s) => asString(s)).filter(Boolean) : [];
    jobTitle = p.job_title ? asString(p.job_title) : null;
  }
  return {
    applicationId: asString(a.id),
    pipelineId,
    businessId,
    currentStage: asString(a.current_stage, "applied"),
    status: asString(a.status, "active"),
    stages,
    candidateId: a.candidate_id ? asString(a.candidate_id) : null,
    candidateName: a.candidate_name ? asString(a.candidate_name) : null,
    jobTitle,
  };
}

/* ------------------------------------------------------------------ */
/*  Business members (mention typeahead + interview attendees)         */
/* ------------------------------------------------------------------ */

export async function getBusinessMembers(businessId: string): Promise<HiringMember[]> {
  if (!businessId) return [];
  const admin = createAdminSupabase();
  const { data } = await admin
    .from("business_members")
    .select("user_id, role")
    .eq("business_id", businessId);
  const rows = (data ?? []) as Record<string, unknown>[];
  const profiles = await fetchProfileMap(rows.map((r) => asString(r.user_id)));
  return rows.map((r) => {
    const userId = asString(r.user_id);
    const p = profiles.get(userId);
    return {
      userId,
      role: asString(r.role, "member"),
      name: p?.name ?? null,
      email: p?.email ?? null,
      avatarUrl: p?.avatarUrl ?? null,
    };
  });
}

/* ------------------------------------------------------------------ */
/*  S2 — bulk stage move (all-or-nothing via the guarded RPC)          */
/* ------------------------------------------------------------------ */

export async function bulkMoveStage(args: {
  applicationIds: string[];
  toStage: string;
  actorUserId: string;
  businessId: string;
}): Promise<{ ok: true; moved: number } | { ok: false; error: string }> {
  const admin = createAdminSupabase();
  const { data, error } = await admin.rpc("move_applications_to_stage", {
    p_application_ids: args.applicationIds,
    p_to_stage: args.toStage,
    p_actor: args.actorUserId,
    p_business: args.businessId,
  });
  if (error) {
    console.error("[hiring-suite] bulkMoveStage error:", error.message);
    return { ok: false, error: error.message };
  }
  return { ok: true, moved: typeof data === "number" ? data : 0 };
}

/* ------------------------------------------------------------------ */
/*  S3 — scoring                                                       */
/* ------------------------------------------------------------------ */

export async function upsertScore(args: {
  applicationId: string;
  stage: string;
  scorerUserId: string;
  rubricKey: string;
  score: number;
  comment?: string | null;
}): Promise<{ ok: boolean; error?: string }> {
  const admin = createAdminSupabase();
  const { error } = await admin
    .from("jobs_application_scores")
    .upsert(
      {
        application_id: args.applicationId,
        stage: args.stage,
        scorer_user_id: args.scorerUserId,
        rubric_key: args.rubricKey,
        score: args.score,
        comment: args.comment ?? null,
        updated_at: new Date().toISOString(),
      } as never,
      { onConflict: "application_id,stage,scorer_user_id,rubric_key" },
    );
  if (error) {
    console.error("[hiring-suite] upsertScore error:", error.message);
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

export async function getScores(applicationId: string): Promise<ScoreRow[]> {
  const admin = createAdminSupabase();
  const { data } = await admin
    .from("jobs_application_scores")
    .select("*")
    .eq("application_id", applicationId)
    .order("updated_at", { ascending: false });
  const rows = (data ?? []) as Record<string, unknown>[];
  const profiles = await fetchProfileMap(rows.map((r) => asString(r.scorer_user_id)));
  return rows.map((r) => ({
    id: asString(r.id),
    applicationId: asString(r.application_id),
    stage: asString(r.stage),
    scorerUserId: asString(r.scorer_user_id),
    scorerName: profiles.get(asString(r.scorer_user_id))?.name ?? null,
    rubricKey: asString(r.rubric_key),
    score: typeof r.score === "number" ? r.score : Number(r.score) || 0,
    comment: r.comment ? asString(r.comment) : null,
    updatedAt: asString(r.updated_at),
  }));
}

export async function getScoreSummary(applicationId: string): Promise<ScoreSummary | null> {
  const admin = createAdminSupabase();
  const { data } = await admin
    .from("jobs_application_score_summary")
    .select("*")
    .eq("application_id", applicationId)
    .maybeSingle();
  if (!data) return null;
  const r = data as Record<string, unknown>;
  return {
    applicationId: asString(r.application_id),
    scorerCount: Number(r.scorer_count) || 0,
    scoreCount: Number(r.score_count) || 0,
    overallMean: r.overall_mean == null ? null : Number(r.overall_mean),
    rubricMeans: (r.rubric_means as ScoreSummary["rubricMeans"]) ?? {},
    predictiveScore: r.predictive_score == null ? null : Number(r.predictive_score),
  };
}

/* ------------------------------------------------------------------ */
/*  S4 — team notes (threaded) + mention resolution                    */
/* ------------------------------------------------------------------ */

export async function addTeamNote(args: {
  applicationId: string;
  authorUserId: string;
  businessId: string;
  body: string;
  parentNoteId?: string | null;
  requestedMentions?: string[];
}): Promise<{ ok: true; note: TeamNote; deliveredMentions: string[] } | { ok: false; error: string }> {
  const body = args.body?.trim();
  if (!body) return { ok: false, error: "empty_body" };

  // Resolve @mentions against the owning business's members only — a mention of a
  // non-member is dropped server-side, never stored, never delivered.
  const members = await getBusinessMembers(args.businessId);
  const memberIds = members.map((m) => m.userId);
  const mentions = resolveMentions(memberIds, args.requestedMentions ?? [], args.authorUserId);

  const admin = createAdminSupabase();
  const { data, error } = await admin
    .from("jobs_application_team_notes")
    .insert({
      application_id: args.applicationId,
      parent_note_id: args.parentNoteId ?? null,
      author_user_id: args.authorUserId,
      body,
      mentions,
    } as never)
    .select("*")
    .single();
  if (error || !data) {
    console.error("[hiring-suite] addTeamNote error:", error?.message);
    return { ok: false, error: error?.message ?? "insert_failed" };
  }
  const r = data as Record<string, unknown>;
  const note: TeamNote = {
    id: asString(r.id),
    applicationId: asString(r.application_id),
    parentNoteId: r.parent_note_id ? asString(r.parent_note_id) : null,
    authorUserId: asString(r.author_user_id),
    authorName: null,
    body: asString(r.body),
    mentions,
    createdAt: asString(r.created_at),
  };
  return { ok: true, note, deliveredMentions: mentions };
}

export async function getTeamNotes(applicationId: string): Promise<TeamNote[]> {
  const admin = createAdminSupabase();
  const { data } = await admin
    .from("jobs_application_team_notes")
    .select("*")
    .eq("application_id", applicationId)
    .order("created_at", { ascending: true });
  const rows = (data ?? []) as Record<string, unknown>[];
  const profiles = await fetchProfileMap(rows.map((r) => asString(r.author_user_id)));
  return rows.map((r) => ({
    id: asString(r.id),
    applicationId: asString(r.application_id),
    parentNoteId: r.parent_note_id ? asString(r.parent_note_id) : null,
    authorUserId: asString(r.author_user_id),
    authorName: profiles.get(asString(r.author_user_id))?.name ?? null,
    body: asString(r.body),
    mentions: Array.isArray(r.mentions) ? (r.mentions as unknown[]).map((m) => asString(m)) : [],
    createdAt: asString(r.created_at),
  }));
}

/* ------------------------------------------------------------------ */
/*  S5 — interview scheduling (prod-actual jobs_interviews)            */
/* ------------------------------------------------------------------ */
// NOTE: this writes the LIVE jobs_interviews table (the path the candidate-detail
// page already reads). The richer @henryco/rooms engine + jobs_interview_rooms
// live-video MECHANICS are V3-54's concern and are NOT applied in the jobs DB —
// this pass only schedules + links + emits telemetry, per the V3-70 out-of-scope.

export async function scheduleHiringInterview(args: {
  applicationId: string;
  pipelineId: string;
  interviewerUserId: string;
  candidateUserId: string | null;
  title: string;
  description?: string | null;
  scheduledAt: string;
  durationMinutes: number;
  timezone: string;
  interviewType: string;
  location?: string | null;
  meetingUrl?: string | null;
}): Promise<{ ok: true; interviewId: string } | { ok: false; error: string }> {
  const admin = createAdminSupabase();
  const { data, error } = await admin
    .from("jobs_interviews")
    .insert({
      application_id: args.applicationId,
      pipeline_id: args.pipelineId,
      interviewer_id: args.interviewerUserId,
      candidate_id: args.candidateUserId,
      interview_type: args.interviewType,
      title: args.title,
      description: args.description ?? null,
      scheduled_at: args.scheduledAt,
      duration_minutes: args.durationMinutes,
      timezone: args.timezone,
      location: args.location ?? null,
      meeting_url: args.meetingUrl ?? null,
      status: "scheduled",
    } as never)
    .select("id")
    .single();
  if (error || !data) {
    console.error("[hiring-suite] scheduleHiringInterview error:", error?.message);
    return { ok: false, error: error?.message ?? "insert_failed" };
  }
  return { ok: true, interviewId: asString((data as Record<string, unknown>).id) };
}

/* ------------------------------------------------------------------ */
/*  S6 — offer / rejection / hire decision (stage + status + metadata) */
/* ------------------------------------------------------------------ */

export async function applyDecision(args: {
  applicationId: string;
  type: DecisionType;
  actorUserId: string;
  businessId: string;
  pipelineStages: string[];
  templateKey?: string | null;
  tone?: string | null;
}): Promise<{ ok: true; stage: string; status: string } | { ok: false; error: string }> {
  const transition = decisionToTransition(args.type);
  const admin = createAdminSupabase();

  // Move the stage through the guarded RPC (audited + membership-checked). When the
  // pipeline HAS the target stage, the move MUST succeed — otherwise we abort and
  // never write status, to avoid an inconsistent status-vs-current_stage state with
  // no audit row. Only when the pipeline genuinely lacks the stage (a non-standard
  // pipeline) do we fall through to a deliberate status-only decision.
  const stageInPipeline = args.pipelineStages.includes(transition.stage);
  let stageMoved = false;
  if (stageInPipeline) {
    const moved = await bulkMoveStage({
      applicationIds: [args.applicationId],
      toStage: transition.stage,
      actorUserId: args.actorUserId,
      businessId: args.businessId,
    });
    if (!moved.ok) {
      return { ok: false, error: moved.error };
    }
    stageMoved = true;
  }

  // Read-modify-write the decision into metadata + set status.
  const { data: appRow } = await admin
    .from("jobs_applications")
    .select("metadata")
    .eq("id", args.applicationId)
    .maybeSingle();
  const metadata = ((appRow as { metadata?: Record<string, unknown> } | null)?.metadata ?? {}) as Record<string, unknown>;
  metadata.decision = {
    type: args.type,
    templateKey: args.templateKey ?? null,
    tone: args.tone ?? null,
    sentBy: args.actorUserId,
    sentAt: new Date().toISOString(),
  };

  const { error } = await admin
    .from("jobs_applications")
    .update({ status: transition.status, metadata, updated_at: new Date().toISOString() } as never)
    .eq("id", args.applicationId);
  if (error) {
    console.error("[hiring-suite] applyDecision error:", error.message);
    return { ok: false, error: error.message };
  }
  return { ok: true, stage: stageMoved ? transition.stage : "unchanged", status: transition.status };
}
