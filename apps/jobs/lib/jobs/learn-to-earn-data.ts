import "server-only";

import { createAdminSupabase } from "@/lib/supabase";
import {
  evaluateCourseGate,
  selectInvitableCandidates,
  type CourseGate,
} from "@/lib/jobs/learn-to-earn";

/**
 * V3-56 Learn-to-Earn — impure data access for the Jobs side.
 *
 * All reads/writes use the service-role admin client (RLS-bypassing), with
 * employer/consent scoping enforced IN the query — the same admin-read pattern
 * jobs already uses for jobs_skill_verifications. The learner consent ledger
 * (learn_candidate_optins) is re-checked at invite time so an opt-out is always
 * honored, even if the pool was rendered earlier.
 */

type JobsAdminClient = ReturnType<typeof createAdminSupabase>;

const LEARN_SOURCE = "learn_completion";

export type CourseGateRow = CourseGate & {
  id: string;
  job_slug: string;
  employer_slug: string;
};

export type LearnVerifiedSkill = {
  id: string;
  courseId: string | null;
  label: string;
  verificationCode: string | null;
  verifyUrl: string | null;
};

export type PoolCandidate = {
  userId: string;
  courseIds: string[];
  courseLabels: string[];
};

function asRows(data: unknown): Array<Record<string, unknown>> {
  return Array.isArray(data) ? (data as Array<Record<string, unknown>>) : [];
}

export type GatableCourse = { id: string; slug: string | null; title: string };

/**
 * Published Learn courses an employer can gate a posting on (cross-division read
 * over the shared DB). Title is the raw course name; the UI may localize it.
 */
export async function listGatableLearnCourses(admin: JobsAdminClient): Promise<GatableCourse[]> {
  const { data, error } = await admin
    .from("learn_courses")
    .select("id, slug, title, status, visibility")
    .eq("visibility", "public")
    .neq("status", "draft")
    .order("title", { ascending: true })
    .limit(200);
  if (error) return [];
  return asRows(data).map((row) => ({
    id: String(row.id),
    slug: (row.slug as string | null) ?? null,
    title: String(row.title ?? "Course"),
  }));
}

/** Course gates on a single job posting (by slug). */
export async function getCourseGatesForJob(
  admin: JobsAdminClient,
  jobSlug: string,
): Promise<CourseGateRow[]> {
  if (!jobSlug) return [];
  const { data, error } = await admin
    .from("jobs_course_gates")
    .select("id, job_slug, employer_slug, course_id, course_slug, course_label, required")
    .eq("job_slug", jobSlug);
  if (error) return [];
  return asRows(data).map((row) => ({
    id: String(row.id),
    job_slug: String(row.job_slug ?? jobSlug),
    employer_slug: String(row.employer_slug ?? ""),
    course_id: String(row.course_id),
    course_slug: (row.course_slug as string | null) ?? null,
    course_label: (row.course_label as string | null) ?? null,
    required: Boolean(row.required),
  }));
}

/** Course ids the candidate has a verified Learn completion for. */
export async function getVerifiedLearnCourseIds(
  admin: JobsAdminClient,
  candidateUserId: string,
): Promise<Set<string>> {
  if (!candidateUserId) return new Set();
  const { data, error } = await admin
    .from("jobs_skill_verifications")
    .select("course_id")
    .eq("candidate_user_id", candidateUserId)
    .eq("source", LEARN_SOURCE)
    .eq("status", "verified");
  if (error) return new Set();
  const ids = new Set<string>();
  for (const row of asRows(data)) {
    if (row.course_id) ids.add(String(row.course_id));
  }
  return ids;
}

/** Learn-verified skill rows for badge rendering on a candidate. */
export async function getLearnVerifiedSkills(
  admin: JobsAdminClient,
  candidateUserId: string,
): Promise<LearnVerifiedSkill[]> {
  if (!candidateUserId) return [];
  const { data, error } = await admin
    .from("jobs_skill_verifications")
    .select("id, skill_label, course_id, evidence_url, evidence_payload")
    .eq("candidate_user_id", candidateUserId)
    .eq("source", LEARN_SOURCE)
    .eq("status", "verified");
  if (error) return [];
  return asRows(data).map((row) => {
    const payload = (row.evidence_payload as Record<string, unknown> | null) ?? {};
    return {
      id: String(row.id),
      courseId: (row.course_id as string | null) ?? null,
      label: String(row.skill_label ?? ""),
      verificationCode: (payload.verification_code as string | null) ?? null,
      verifyUrl: (row.evidence_url as string | null) ?? null,
    };
  });
}

/**
 * Hard backstop for the apply path: throw if a required course gate is unmet.
 * Returns whether the candidate satisfied any preferred (soft) gate.
 */
export async function assertCourseGatePassed(
  admin: JobsAdminClient,
  input: { jobSlug: string; candidateUserId: string },
): Promise<{ preferred: boolean; blockingGate: CourseGate | null }> {
  const gates = await getCourseGatesForJob(admin, input.jobSlug);
  if (gates.length === 0) return { preferred: false, blockingGate: null };
  const verifiedCourseIds = await getVerifiedLearnCourseIds(admin, input.candidateUserId);
  const verdict = evaluateCourseGate({ gates, verifiedCourseIds });
  return { preferred: verdict.preferred, blockingGate: verdict.blockingGate };
}

/** Create or update a course gate on a job posting (creator-owned). */
export async function upsertCourseGate(
  admin: JobsAdminClient,
  input: {
    jobSlug: string;
    employerSlug: string;
    createdByUserId: string;
    courseId: string;
    courseSlug?: string | null;
    courseLabel?: string | null;
    required: boolean;
  },
): Promise<{ ok: boolean; id?: string }> {
  const { data, error } = await admin
    .from("jobs_course_gates")
    .upsert(
      {
        job_slug: input.jobSlug,
        employer_slug: input.employerSlug,
        created_by_user_id: input.createdByUserId,
        course_id: input.courseId,
        course_slug: input.courseSlug ?? null,
        course_label: input.courseLabel ?? null,
        required: input.required,
        updated_at: new Date().toISOString(),
      } as never,
      { onConflict: "job_slug,course_id" },
    )
    .select("id")
    .single();
  if (error || !data) return { ok: false };
  return { ok: true, id: String((data as Record<string, unknown>).id) };
}

/** Remove a course gate the caller owns. */
export async function removeCourseGate(
  admin: JobsAdminClient,
  input: { id: string; createdByUserId: string },
): Promise<{ ok: boolean }> {
  const { error } = await admin
    .from("jobs_course_gates")
    .delete()
    .eq("id", input.id)
    .eq("created_by_user_id", input.createdByUserId);
  return { ok: !error };
}

/** Course ids the employer gates on (their "relevant" course set). */
export async function getEmployerGatedCourseIds(
  admin: JobsAdminClient,
  employerSlug: string,
): Promise<string[]> {
  if (!employerSlug) return [];
  const { data, error } = await admin
    .from("jobs_course_gates")
    .select("course_id")
    .eq("employer_slug", employerSlug);
  if (error) return [];
  return [...new Set(asRows(data).map((row) => String(row.course_id)))];
}

/** Active employer-visible opt-ins for a set of courses. */
async function getActiveOptins(
  admin: JobsAdminClient,
  courseIds: string[],
): Promise<Array<{ userId: string; courseId: string }>> {
  if (courseIds.length === 0) return [];
  const { data, error } = await admin
    .from("learn_candidate_optins")
    .select("user_id, course_id, visibility, revoked_at")
    .in("course_id", courseIds)
    .is("revoked_at", null)
    .eq("visibility", "employers");
  if (error) return [];
  return asRows(data).map((row) => ({
    userId: String(row.user_id),
    courseId: String(row.course_id),
  }));
}

/**
 * The employer's verified-candidate pool: opted-in completers of a course the
 * employer gates, intersected with verified Learn completions. Scoped to the
 * employer's gated courses (and optionally one course).
 */
export async function getEmployerVerifiedCandidatePool(
  admin: JobsAdminClient,
  input: { employerSlug: string; courseId?: string | null },
): Promise<{ candidates: PoolCandidate[]; courses: CourseGateRow[] }> {
  // Courses the employer gates on (the "relevant" set).
  const { data: gateData, error: gateError } = await admin
    .from("jobs_course_gates")
    .select("id, job_slug, employer_slug, course_id, course_slug, course_label, required")
    .eq("employer_slug", input.employerSlug);
  if (gateError) return { candidates: [], courses: [] };

  const courses: CourseGateRow[] = asRows(gateData).map((row) => ({
    id: String(row.id),
    job_slug: String(row.job_slug ?? ""),
    employer_slug: String(row.employer_slug ?? input.employerSlug),
    course_id: String(row.course_id),
    course_slug: (row.course_slug as string | null) ?? null,
    course_label: (row.course_label as string | null) ?? null,
    required: Boolean(row.required),
  }));

  const allCourseIds = [...new Set(courses.map((c) => c.course_id))];
  const courseIds = input.courseId ? allCourseIds.filter((id) => id === input.courseId) : allCourseIds;
  if (courseIds.length === 0) return { candidates: [], courses };

  const labelByCourse = new Map(courses.map((c) => [c.course_id, c.course_label ?? c.course_slug ?? ""]));

  const optins = await getActiveOptins(admin, courseIds);
  if (optins.length === 0) return { candidates: [], courses };
  const optinKey = new Set(optins.map((o) => `${o.userId}:${o.courseId}`));
  const optinUserIds = [...new Set(optins.map((o) => o.userId))];

  // Verified Learn completions for the candidate set + course set.
  const { data: verData, error: verError } = await admin
    .from("jobs_skill_verifications")
    .select("candidate_user_id, course_id")
    .eq("source", LEARN_SOURCE)
    .eq("status", "verified")
    .in("course_id", courseIds)
    .in("candidate_user_id", optinUserIds);
  if (verError) return { candidates: [], courses };

  const byUser = new Map<string, PoolCandidate>();
  for (const row of asRows(verData)) {
    const userId = String(row.candidate_user_id);
    const courseId = String(row.course_id);
    // Must have an active opt-in for THIS course (consent-first).
    if (!optinKey.has(`${userId}:${courseId}`)) continue;
    const entry = byUser.get(userId) ?? { userId, courseIds: [], courseLabels: [] };
    if (!entry.courseIds.includes(courseId)) {
      entry.courseIds.push(courseId);
      const label = labelByCourse.get(courseId);
      if (label) entry.courseLabels.push(label);
    }
    byUser.set(userId, entry);
  }

  return { candidates: [...byUser.values()], courses };
}

/** Candidate ids already invited to a job (idempotency source). */
export async function getInvitedCandidateIds(
  admin: JobsAdminClient,
  jobSlug: string,
): Promise<Set<string>> {
  const { data, error } = await admin
    .from("jobs_candidate_invites")
    .select("candidate_user_id")
    .eq("job_slug", jobSlug);
  if (error) return new Set();
  return new Set(asRows(data).map((row) => String(row.candidate_user_id)));
}

export type BulkInviteResult = {
  invited: string[];
  skippedInvited: string[];
  skippedNoConsent: string[];
  skippedNoCompletion: string[];
};

/** User ids (from the candidate set) with a verified Learn completion of a relevant course. */
async function getVerifiedCompleterUserIds(
  admin: JobsAdminClient,
  courseIds: string[],
  candidateUserIds: string[],
): Promise<Set<string>> {
  if (courseIds.length === 0 || candidateUserIds.length === 0) return new Set();
  const { data, error } = await admin
    .from("jobs_skill_verifications")
    .select("candidate_user_id")
    .eq("source", LEARN_SOURCE)
    .eq("status", "verified")
    .in("course_id", courseIds)
    .in("candidate_user_id", candidateUserIds);
  if (error) return new Set();
  return new Set(asRows(data).map((row) => String(row.candidate_user_id)));
}

/**
 * Bulk-invite verified completers to a job. Idempotent per (job, candidate),
 * never invites past an active opt-out (consent re-checked here), and returns
 * who was invited vs skipped so the caller can notify + audit precisely.
 */
export async function bulkInviteCandidates(
  admin: JobsAdminClient,
  input: {
    jobSlug: string;
    employerSlug: string | null;
    createdByUserId: string;
    candidateUserIds: string[];
    courseId?: string | null;
    message?: string | null;
    relevantCourseIds: string[];
  },
): Promise<BulkInviteResult> {
  const activeOptins = await getActiveOptins(admin, input.relevantCourseIds);
  const activeOptinUserIds = new Set(activeOptins.map((o) => o.userId));
  const alreadyInvited = await getInvitedCandidateIds(admin, input.jobSlug);

  // Re-check verified completion at invite time: only people with a verified Learn
  // completion of a course the employer gates may be invited — the invite surface
  // never diverges from the verified-completer pool the UI shows.
  const verifiedUserIds = await getVerifiedCompleterUserIds(
    admin,
    input.relevantCourseIds,
    input.candidateUserIds,
  );
  const verifiedRequested: string[] = [];
  const skippedNoCompletion: string[] = [];
  const seenForCompletion = new Set<string>();
  for (const userId of input.candidateUserIds) {
    if (seenForCompletion.has(userId)) continue;
    seenForCompletion.add(userId);
    if (verifiedUserIds.has(userId)) verifiedRequested.push(userId);
    else skippedNoCompletion.push(userId);
  }

  const selection = selectInvitableCandidates({
    candidateUserIds: verifiedRequested,
    alreadyInvited,
    activeOptinUserIds,
  });

  if (selection.invite.length > 0) {
    const rows = selection.invite.map((candidateUserId) => ({
      job_slug: input.jobSlug,
      employer_slug: input.employerSlug,
      created_by_user_id: input.createdByUserId,
      candidate_user_id: candidateUserId,
      course_id: input.courseId ?? null,
      source: "learn_verified",
      status: "invited",
      message: input.message ?? null,
    }));
    // Idempotent: unique(job_slug, candidate_user_id) makes re-runs no-ops.
    await admin
      .from("jobs_candidate_invites")
      .upsert(rows as never, { onConflict: "job_slug,candidate_user_id", ignoreDuplicates: true });
  }

  return {
    invited: selection.invite,
    skippedInvited: selection.skippedInvited,
    skippedNoConsent: selection.skippedNoConsent,
    skippedNoCompletion,
  };
}
