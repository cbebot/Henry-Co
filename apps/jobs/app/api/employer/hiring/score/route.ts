import { NextResponse } from "next/server";
import { writeAuditLog } from "@henryco/observability/audit-log";
import { hiringAuditClient, resolveHiringActingContext } from "@/lib/jobs/hiring-guard";
import { getApplicationContext, upsertScore } from "@/lib/jobs/hiring-suite";
import { HIRING_RUBRIC_KEYS, isValidScore } from "@/lib/jobs/hiring-suite-logic";

/**
 * V3-70 S3 — POST /api/employer/hiring/score
 * Body: { applicationId, rubricKey, score (1-5), comment? }
 *
 * Idempotent per (application, stage, scorer, rubric) — re-scoring updates.
 * Business-context gated + the application must belong to the acting business.
 */
export const dynamic = "force-dynamic";

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
    const rubricKey = typeof payload.rubricKey === "string" ? payload.rubricKey.trim() : "";
    const score = Number(payload.score);
    const comment = typeof payload.comment === "string" ? payload.comment.slice(0, 2000) : null;

    if (!applicationId || !rubricKey) {
      return NextResponse.json({ error: "missing_fields", message: "applicationId and rubricKey are required." }, { status: 400 });
    }
    if (!(HIRING_RUBRIC_KEYS as readonly string[]).includes(rubricKey)) {
      return NextResponse.json({ error: "rubric_invalid", message: "Unknown rubric." }, { status: 400 });
    }
    if (!isValidScore(score)) {
      return NextResponse.json({ error: "score_invalid", message: "Score must be an integer 1–5." }, { status: 400 });
    }

    const appCtx = await getApplicationContext(applicationId);
    if (!appCtx || appCtx.businessId !== ctx.businessId) {
      return NextResponse.json({ error: "forbidden", message: "Application not in your business." }, { status: 403 });
    }

    const res = await upsertScore({
      applicationId,
      stage: appCtx.currentStage,
      scorerUserId: ctx.userId,
      rubricKey,
      score,
      comment,
    });
    if (!res.ok) {
      return NextResponse.json({ error: "score_failed", message: "Couldn't save the score. Please try again." }, { status: 500 });
    }

    await writeAuditLog(hiringAuditClient(), {
      action: "hiring.application.scored",
      entityType: "jobs_application",
      entityId: applicationId,
      newValues: { rubricKey, score, stage: appCtx.currentStage, actorUserId: ctx.userId, businessId: ctx.businessId },
      division: "jobs",
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[employer/hiring/score] internal error:", error);
    return NextResponse.json({ error: "internal_error", message: "Internal server error." }, { status: 500 });
  }
}
