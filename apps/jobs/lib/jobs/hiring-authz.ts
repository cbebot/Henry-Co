// JOB-1/2/3 — pure authorization + payload-hardening helpers for the hiring
// routes.
//
// This module imports ONLY types (no `server-only`, no Supabase, no auth), so it
// runs under bare `tsx --test` and is the testable seam for the route gates that
// would otherwise require importing server-only handlers. The routes resolve
// their inputs (acting context, application context, conversation rows) and
// delegate the allow/deny + payload-normalization DECISION here.
//
// The business_id model is the ONLY trusted owner key: employer_id may store an
// activityId rather than a slug, so ownership is NEVER inferred from slug
// matching — only from `businesses.id` equality.
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
