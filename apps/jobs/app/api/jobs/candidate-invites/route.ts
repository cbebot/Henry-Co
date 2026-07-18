import { NextResponse } from "next/server";
import { henryDomain } from "@henryco/config";
import { getLearnToEarnCopy } from "@henryco/i18n/server";
import { publishNotification } from "@henryco/notifications";
import { emitEvent } from "@henryco/observability/events";
import {
  writeBulkAuditLog,
  type AuditLogSupabaseClient,
} from "@henryco/observability/audit-log";
import { requireSensitiveAction } from "@henryco/auth/server/sensitive-action-guard";
import { getJobsViewer, viewerHasRole } from "@/lib/auth";
import { createAdminSupabase } from "@/lib/supabase";
import {
  bulkInviteCandidates,
  getEmployerGatedCourseIds,
} from "@/lib/jobs/learn-to-earn-data";

/**
 * V3-56 — bulk-invite verified completers (S5).
 *
 * Idempotent per (job, candidate); never invites past an active opt-out (consent
 * re-checked in bulkInviteCandidates). Each invite notifies the candidate via
 * @henryco/notifications, is audited (bulk), and emits henry.learn.employer.invited.
 * Sensitive (mass-contacts candidates) → requireSensitiveAction (V3-02).
 */
export const dynamic = "force-dynamic";

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string" && v.trim().length > 0).map((v) => v.trim());
}

export async function POST(request: Request) {
  try {
    const viewer = await getJobsViewer();
    if (!viewer.user) {
      return NextResponse.json(
        { error: "unauthorized", message: "Sign in to invite candidates." },
        { status: 401 },
      );
    }
    const user = viewer.user;
    const admin = createAdminSupabase();

    const guard = await requireSensitiveAction(request, {
      action: "jobs.candidate.invite",
      entityType: "jobs_candidate_invite",
      resolveUser: async () => user,
      userId: (u) => u.id,
      auditClient: admin as unknown as AuditLogSupabaseClient,
    });
    if (!guard.ok) return guard.response;

    let payload: Record<string, unknown> = {};
    try {
      payload = (await request.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json(
        { error: "invalid_request", message: "Invalid request body." },
        { status: 400 },
      );
    }

    const jobSlug = typeof payload.jobSlug === "string" ? payload.jobSlug.trim() : "";
    const jobTitle = typeof payload.jobTitle === "string" ? payload.jobTitle.trim() : "";
    const employerSlug = typeof payload.employerSlug === "string" ? payload.employerSlug.trim() : "";
    const courseId = typeof payload.courseId === "string" ? payload.courseId.trim() : null;
    const message = typeof payload.message === "string" ? payload.message.trim().slice(0, 600) : null;
    const candidateUserIds = asStringArray(payload.candidateUserIds);

    if (!jobSlug || !employerSlug || candidateUserIds.length === 0) {
      return NextResponse.json(
        { error: "missing_fields", message: "jobSlug, employerSlug and candidateUserIds are required." },
        { status: 400 },
      );
    }
    const isStaff = viewerHasRole(viewer, ["recruiter", "owner", "admin", "moderator"]);
    const isMember = viewer.employerMemberships.some((m) => m.employerSlug === employerSlug);
    if (!isStaff && !isMember) {
      return NextResponse.json(
        { error: "forbidden", message: "You can't invite candidates for this employer." },
        { status: 403 },
      );
    }

    const relevantCourseIds = await getEmployerGatedCourseIds(admin, employerSlug);
    const result = await bulkInviteCandidates(admin, {
      jobSlug,
      employerSlug,
      createdByUserId: user.id,
      candidateUserIds,
      courseId,
      message,
      relevantCourseIds,
    });

    // Notify each newly invited candidate (in-app; respects preferences + rate limits).
    if (result.invited.length > 0) {
      const copy = getLearnToEarnCopy("en");
      const jobLabel = jobTitle || "a role";
      const title = copy.invite.candidateNotifyTitle;
      const body = copy.invite.candidateNotifyBody.replace("{job}", jobLabel);
      const deepLink = henryDomain("jobs", `/jobs/${jobSlug}`);
      await Promise.all(
        result.invited.map((candidateUserId) =>
          publishNotification({
            userId: candidateUserId,
            division: "jobs",
            eventType: "jobs.invite.received",
            severity: "info",
            title,
            body,
            deepLink,
            actionLabel: "View role",
            relatedType: "jobs_candidate_invite",
            relatedId: jobSlug,
            actorUserId: user.id,
            publisher: "bridge:apps/jobs/api/jobs/candidate-invites",
          }).catch(() => undefined),
        ),
      );

      await writeBulkAuditLog(
        admin as unknown as AuditLogSupabaseClient,
        result.invited.map((candidateUserId) => ({
          action: "jobs.candidate.invited",
          entityType: "jobs_candidate_invite",
          entityId: candidateUserId,
          division: "jobs",
          reason: "Employer invited a verified Learn completer to apply.",
          newValues: { jobSlug, employerSlug, courseId },
        })),
      );

      emitEvent({
        name: "henry.learn.employer.invited",
        classification: "user_action",
        outcome: "completed",
        actorId: user.id,
        payload: {
          job_slug: jobSlug,
          course_id: courseId,
          count: result.invited.length,
          division: "jobs",
        },
      });
    }

    // Aggregate the skip count — a per-reason breakdown would let an
    // employer infer an individual candidate's consent or completion
    // state by differencing batches.
    return NextResponse.json({
      invited: result.invited.length,
      skipped:
        result.skippedInvited.length +
        result.skippedNoConsent.length +
        result.skippedNoCompletion.length,
    });
  } catch (error) {
    console.error("[candidate-invites] POST error:", error);
    return NextResponse.json(
      { error: "internal_error", message: "Internal server error." },
      { status: 500 },
    );
  }
}
