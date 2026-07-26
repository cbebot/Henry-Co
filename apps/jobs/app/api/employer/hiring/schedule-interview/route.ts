import { NextResponse } from "next/server";
import { writeAuditLog } from "@henryco/observability/audit-log";
import { hiringAuditClient, resolveHiringActingContext } from "@/lib/jobs/hiring-guard";
import { getApplicationContext, scheduleHiringInterview } from "@/lib/jobs/hiring-suite";
import { emitHiringEvent } from "@/lib/jobs/hiring-events";

/**
 * V3-70 S5 — POST /api/employer/hiring/schedule-interview
 * Body: { applicationId, title, scheduledAt, durationMinutes?, timezone?, interviewType?, location?, meetingUrl?, description? }
 *
 * Schedules an interview on the live jobs_interviews table and links it to the
 * candidate. Live-video room MECHANICS (recording/consent) are V3-54's concern —
 * this pass only schedules + links + emits telemetry. Business-context gated.
 */
export const dynamic = "force-dynamic";

const ALLOWED_TYPES = new Set(["video", "phone", "in-person", "in_person"]);

export async function POST(request: Request) {
  try {
    const ctx = await resolveHiringActingContext();
    if (ctx.kind !== "business") {
      return NextResponse.json({ error: "forbidden", message: "This action requires a business account." }, { status: 403 });
    }

    let payload: Record<string, unknown> = {};
    try {
      payload = (await request.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ error: "invalid_request", message: "Invalid request body." }, { status: 400 });
    }

    const applicationId = typeof payload.applicationId === "string" ? payload.applicationId.trim() : "";
    const title = typeof payload.title === "string" ? payload.title.trim().slice(0, 200) : "";
    const scheduledAt = typeof payload.scheduledAt === "string" ? payload.scheduledAt : "";
    const durationMinutes = Number.isFinite(Number(payload.durationMinutes)) ? Math.max(5, Math.min(480, Number(payload.durationMinutes))) : 30;
    const timezone = typeof payload.timezone === "string" && payload.timezone ? payload.timezone : "Africa/Lagos";
    const interviewType = typeof payload.interviewType === "string" && ALLOWED_TYPES.has(payload.interviewType) ? payload.interviewType : "video";
    const location = typeof payload.location === "string" ? payload.location.slice(0, 300) : null;
    const meetingUrl = typeof payload.meetingUrl === "string" ? payload.meetingUrl.slice(0, 500) : null;
    const description = typeof payload.description === "string" ? payload.description.slice(0, 2000) : null;

    if (!applicationId || !title || !scheduledAt || Number.isNaN(Date.parse(scheduledAt))) {
      return NextResponse.json(
        { error: "missing_fields", message: "applicationId, title and a valid scheduledAt are required." },
        { status: 400 },
      );
    }

    const appCtx = await getApplicationContext(applicationId);
    if (!appCtx || appCtx.businessId !== ctx.businessId) {
      return NextResponse.json({ error: "forbidden", message: "Application not in your business." }, { status: 403 });
    }

    const res = await scheduleHiringInterview({
      applicationId,
      pipelineId: appCtx.pipelineId,
      interviewerUserId: ctx.userId,
      candidateUserId: appCtx.candidateId,
      title,
      description,
      scheduledAt,
      durationMinutes,
      timezone,
      interviewType,
      location,
      meetingUrl,
    });
    if (!res.ok) {
      return NextResponse.json({ error: "schedule_failed", message: "Couldn't schedule the interview. Please check the details and try again." }, { status: 500 });
    }

    await writeAuditLog(hiringAuditClient(), {
      action: "hiring.interview.scheduled",
      entityType: "jobs_interview",
      entityId: res.interviewId,
      newValues: { applicationId, scheduledAt, interviewType, actorUserId: ctx.userId, businessId: ctx.businessId },
      division: "jobs",
    });

    await emitHiringEvent({
      key: "HIRING_INTERVIEW_SCHEDULED",
      actorUserId: ctx.userId,
      roleHint: ctx.role,
      businessId: ctx.businessId,
      pipelineId: appCtx.pipelineId,
      applicationId,
      properties: {
        title: "Interview scheduled",
        summary: `Interview "${title}" scheduled for ${scheduledAt}.`,
        status: "scheduled",
        interviewId: res.interviewId,
        scheduledAt,
        interviewType,
      },
    });

    return NextResponse.json({ ok: true, interviewId: res.interviewId });
  } catch (error) {
    console.error("[employer/hiring/schedule-interview] internal error:", error);
    return NextResponse.json({ error: "internal_error", message: "Internal server error." }, { status: 500 });
  }
}
