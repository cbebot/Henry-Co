import { NextResponse } from "next/server";
import { requireSensitiveAction } from "@henryco/auth/server/sensitive-action-guard";
import { writeAuditLog, type AuditLogSupabaseClient } from "@henryco/observability/audit-log";
import { getJobsViewer, viewerHasRole } from "@/lib/auth";
import { createAdminSupabase } from "@/lib/supabase";
import { removeCourseGate, upsertCourseGate } from "@/lib/jobs/learn-to-earn-data";

/**
 * V3-56 — employer course gates (S3).
 *
 * POST   creates/updates a course gate on a job posting (by slug).
 * DELETE removes a gate the caller owns.
 *
 * Both are sensitive (they change who can apply / who is preferred) → gated by
 * requireSensitiveAction (V3-02) and audited. The caller must be the employer
 * who owns the posting (employer membership for employer_slug) or jobs staff.
 */
export const dynamic = "force-dynamic";

function canManage(
  viewer: Awaited<ReturnType<typeof getJobsViewer>>,
  employerSlug: string,
): boolean {
  if (viewerHasRole(viewer, ["recruiter", "owner", "admin", "moderator"])) return true;
  return viewer.employerMemberships.some((m) => m.employerSlug === employerSlug);
}

export async function POST(request: Request) {
  try {
    const viewer = await getJobsViewer();
    if (!viewer.user) {
      return NextResponse.json(
        { error: "unauthorized", message: "Sign in to manage course gates." },
        { status: 401 },
      );
    }
    const user = viewer.user;
    const admin = createAdminSupabase();

    const guard = await requireSensitiveAction(request, {
      action: "jobs.course_gate.manage",
      entityType: "jobs_course_gate",
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
    const employerSlug = typeof payload.employerSlug === "string" ? payload.employerSlug.trim() : "";
    const courseId = typeof payload.courseId === "string" ? payload.courseId.trim() : "";
    const courseSlug = typeof payload.courseSlug === "string" ? payload.courseSlug.trim() : null;
    const courseLabel = typeof payload.courseLabel === "string" ? payload.courseLabel.trim() : null;
    const required = payload.required !== false; // default hard gate

    if (!jobSlug || !employerSlug || !courseId) {
      return NextResponse.json(
        { error: "missing_fields", message: "jobSlug, employerSlug and courseId are required." },
        { status: 400 },
      );
    }
    if (!canManage(viewer, employerSlug)) {
      return NextResponse.json(
        { error: "forbidden", message: "You can't manage gates for this employer." },
        { status: 403 },
      );
    }

    const result = await upsertCourseGate(admin, {
      jobSlug,
      employerSlug,
      createdByUserId: user.id,
      courseId,
      courseSlug,
      courseLabel,
      required,
    });
    if (!result.ok) {
      return NextResponse.json(
        { error: "save_failed", message: "Couldn't save the course gate." },
        { status: 500 },
      );
    }

    await writeAuditLog(admin as unknown as AuditLogSupabaseClient, {
      action: "jobs.course_gate.created",
      entityType: "jobs_course_gate",
      entityId: result.id ?? null,
      division: "jobs",
      reason: "Employer set a Learn course gate on a job posting.",
      newValues: { jobSlug, employerSlug, courseId, required },
    });

    return NextResponse.json({ gate: { id: result.id, jobSlug, courseId, required } });
  } catch (error) {
    console.error("[course-gates] POST error:", error);
    return NextResponse.json(
      { error: "internal_error", message: "Internal server error." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const viewer = await getJobsViewer();
    if (!viewer.user) {
      return NextResponse.json(
        { error: "unauthorized", message: "Sign in to manage course gates." },
        { status: 401 },
      );
    }
    const user = viewer.user;
    const admin = createAdminSupabase();

    const guard = await requireSensitiveAction(request, {
      action: "jobs.course_gate.manage",
      entityType: "jobs_course_gate",
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
    const id = typeof payload.id === "string" ? payload.id.trim() : "";
    if (!id) {
      return NextResponse.json(
        { error: "missing_fields", message: "id is required." },
        { status: 400 },
      );
    }

    const result = await removeCourseGate(admin, { id, createdByUserId: user.id });
    if (!result.ok) {
      return NextResponse.json(
        { error: "delete_failed", message: "Couldn't remove the course gate." },
        { status: 500 },
      );
    }

    await writeAuditLog(admin as unknown as AuditLogSupabaseClient, {
      action: "jobs.course_gate.removed",
      entityType: "jobs_course_gate",
      entityId: id,
      division: "jobs",
      reason: "Employer removed a Learn course gate from a job posting.",
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[course-gates] DELETE error:", error);
    return NextResponse.json(
      { error: "internal_error", message: "Internal server error." },
      { status: 500 },
    );
  }
}
