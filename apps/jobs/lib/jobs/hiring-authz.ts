// JOB-1/2/3 — pure authorization + payload-hardening helpers for the hiring
// routes.
//
// This module imports ONLY types (no `server-only`, no Supabase, no auth), so it
// runs under bare `tsx --test` and is the testable seam for the route gates that
// would otherwise require importing server-only handlers. The routes resolve
// their inputs (acting context, application context, conversation rows) and
// delegate the allow/deny + payload-normalization DECISION here.
//
// Ownership is never inferred from slug matching. The trusted owner keys are
// `businesses.id` equality (V3-70 business_id) and, for a pipeline that is not
// bound to a business, a direct identity match on
// jobs_hiring_pipelines.employer_id (see actorOwnsPipeline).
import type { ActingContext } from "@henryco/auth/server/acting-context";

/* ------------------------------------------------------------------ */
/*  Payload hardening (JOB-1)                                          */
/* ------------------------------------------------------------------ */

export const INTERVIEW_TYPES = ["video", "phone", "in-person"] as const;
export type InterviewType = (typeof INTERVIEW_TYPES)[number];

/** Allowlist the interview type; normalize the snake_case alias; default video. */
export function normalizeInterviewType(value: unknown): InterviewType {
  if (value === "in_person") return "in-person";
  return (INTERVIEW_TYPES as readonly string[]).includes(value as string)
    ? (value as InterviewType)
    : "video";
}

/**
 * Return the normalized URL string only when `value` is a syntactically valid
 * https URL — the phishing gate. Anything else (http, javascript:, data:,
 * garbage, non-string) returns null so the caller rejects the request.
 */
export function parseHttpsUrl(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    return null;
  }
  return url.protocol === "https:" ? url.toString() : null;
}

/** Clamp the wire duration into the allowed 5..480 minute range; default 30. */
export function clampDuration(value: unknown, fallback = 30): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(5, Math.min(480, Math.round(n)));
}

export type NormalizedInterviewInput = {
  applicationId: string;
  title: string;
  scheduledAt: string;
  durationMinutes: number;
  timezone: string;
  interviewType: InterviewType;
  location: string | null;
  meetingUrl: string | null;
  notes: string | null;
};

/**
 * Validate + normalize the schedule-interview payload. Rejects missing required
 * fields and an unparseable scheduledAt. A meetingUrl, WHEN PROVIDED, must be a
 * valid https URL (reject otherwise) — this blocks the phishing / scheme-
 * injection vector (http:, javascript:, data:, garbage). It is left optional
 * because phone / in-person interviews legitimately carry no link (the
 * InterviewScheduler UI only collects a meetingUrl for video). On success the
 * interviewType is allowlisted and durationMinutes is clamped.
 */
export function normalizeScheduleInterviewInput(
  payload: Record<string, unknown>,
): { ok: true; value: NormalizedInterviewInput } | { ok: false; error: string } {
  const applicationId =
    typeof payload.applicationId === "string" ? payload.applicationId.trim() : "";
  const title = typeof payload.title === "string" ? payload.title.trim().slice(0, 200) : "";
  const scheduledAt = typeof payload.scheduledAt === "string" ? payload.scheduledAt : "";

  if (!applicationId || !title || !scheduledAt) {
    return { ok: false, error: "missing_fields" };
  }
  if (Number.isNaN(Date.parse(scheduledAt))) {
    return { ok: false, error: "invalid_scheduled_at" };
  }

  // A supplied meetingUrl MUST be https; anything else is rejected. Absent /
  // empty is allowed (phone / in-person).
  const rawMeetingUrl =
    typeof payload.meetingUrl === "string" ? payload.meetingUrl.trim() : "";
  let meetingUrl: string | null = null;
  if (rawMeetingUrl) {
    const parsed = parseHttpsUrl(rawMeetingUrl);
    if (!parsed) {
      return { ok: false, error: "invalid_meeting_url" };
    }
    meetingUrl = parsed;
  }

  return {
    ok: true,
    value: {
      applicationId,
      title,
      scheduledAt,
      durationMinutes: clampDuration(payload.durationMinutes),
      timezone:
        typeof payload.timezone === "string" && payload.timezone ? payload.timezone : "Africa/Lagos",
      interviewType: normalizeInterviewType(payload.interviewType),
      location: typeof payload.location === "string" ? payload.location.slice(0, 300) : null,
      meetingUrl,
      notes: typeof payload.notes === "string" ? payload.notes.slice(0, 2000) : null,
    },
  };
}

/* ------------------------------------------------------------------ */
/*  Ownership gates (JOB-1 / JOB-3)                                    */
/* ------------------------------------------------------------------ */

/**
 * True only when the caller is acting as a business AND the application's
 * resolved owning business id matches that acting business id. Personal
 * contexts, missing applications, and applications with no owning business are
 * all denied.
 */
export function actingBusinessOwnsApplication(
  ctx: ActingContext,
  appCtx: { businessId: string | null } | null,
): boolean {
  return (
    ctx.kind === "business" &&
    appCtx != null &&
    appCtx.businessId != null &&
    appCtx.businessId === ctx.businessId
  );
}

/**
 * Owner keys of a hiring pipeline, read server-side (never from the request).
 * `employerId` is `jobs_hiring_pipelines.employer_id` (FK auth.users — the
 * employer account that owns the pipeline on prod today). `businessId` is the
 * V3-70 `business_id` (null until that migration applies and the pipeline is
 * bound to a business).
 */
export type PipelineOwnerKeys = {
  employerId: string | null;
  businessId: string | null;
};

/**
 * V3-CARE-JOBS-PREAPPLY-FIX-01 — may this session actor act on this pipeline's
 * applications (offer letters, interview-room notes)?
 *   - A pipeline bound to a business (V3-70 business_id) is owned by that
 *     business: only a caller acting as it passes (the same rule as
 *     actingBusinessOwnsApplication). The creator's employer_id no longer
 *     counts, so someone who has left the business loses access.
 *   - A pipeline not bound to a business (every pipeline on prod today, where
 *     business_id does not exist yet) is owned by its employer account: the
 *     session user must BE jobs_hiring_pipelines.employer_id (FK auth.users; a
 *     direct identity match, never slug or membership inference; an
 *     employer_id that is not a user id simply never matches).
 * Everything else — anonymous, another employer, another business, a pipeline
 * that could not be resolved — is denied.
 *
 * Trust boundary: like every jobs ownership check, this trusts the owner keys
 * (jobs_hiring_pipelines.employer_id / business_id, jobs_applications
 * .pipeline_id) as server data. Request roles cannot write those tables
 * because SEC-HARDEN-03 (hub 20260614120000_sec_harden_03_world_writable_lockdown,
 * applied to prod 2026-06-14) dropped their world-writable policy and revoked
 * anon/authenticated writes; the V3-FIRE-JOBS live probe (2026-06-27)
 * confirmed it. CI replays that migration on a representative fixture: its
 * invariant (apps/hub/supabase/tests/sec_harden_03_grant_invariant.sql)
 * asserts jobs_applications, while jobs_hiring_pipelines is locked by the same
 * loop but is not in the fixture. Never re-open request-role writes on them.
 */
export function actorOwnsPipeline(
  ctx: ActingContext,
  owner: PipelineOwnerKeys | null,
): boolean {
  if (!owner || !ctx.userId) return false;
  if (owner.businessId) {
    return ctx.kind === "business" && owner.businessId === ctx.businessId;
  }
  return Boolean(owner.employerId) && owner.employerId === ctx.userId;
}

/* ------------------------------------------------------------------ */
/*  Conversation participant gate (JOB-2)                              */
/* ------------------------------------------------------------------ */

export type HiringConvoRole = "candidate" | "employer" | "moderator" | null;

/**
 * Decide the viewer's role in a hiring conversation from already-resolved server
 * state. The employer role is granted ONLY when the viewer's acting business id
 * equals the conversation pipeline's owning business id — never on the basis of
 * "has some employer membership". Moderator/admin/owner overrides are handled by
 * the route BEFORE this is called.
 */
export function decideHiringConvoRole(args: {
  viewerId: string;
  candidateIds: ReadonlyArray<string | null | undefined>;
  owningBusinessId: string | null;
  actingBusinessId: string | null;
}): HiringConvoRole {
  if (!args.viewerId) return null;

  if (args.candidateIds.some((c) => typeof c === "string" && c !== "" && c === args.viewerId)) {
    return "candidate";
  }

  if (
    args.actingBusinessId &&
    args.owningBusinessId &&
    args.actingBusinessId === args.owningBusinessId
  ) {
    return "employer";
  }

  return null;
}
