import { NextResponse } from "next/server";
import { writeAuditLog } from "@henryco/observability/audit-log";
import { hiringAuditClient, resolveHiringActingContext } from "@/lib/jobs/hiring-guard";
import { bulkMoveStage, getApplicationContext } from "@/lib/jobs/hiring-suite";
import { emitHiringEvent } from "@/lib/jobs/hiring-events";

/**
 * V3-70 S2 — POST /api/employer/hiring/stage-move
 * Body: { applicationIds: string[], toStage: string }
 *
 * Bulk-moves applications to a target stage in one all-or-nothing transaction.
 * Business-context gated; the guarded RPC re-verifies membership + stage validity
 * per application and aborts the whole batch on any cross-business/invalid row.
 */
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const ctx = await resolveHiringActingContext();
    if (ctx.kind !== "business") {
      return NextResponse.json(
        { error: "forbidden", message: "This action requires a business account." },
        { status: 403 },
      );
    }

    let payload: Record<string, unknown> = {};
    try {
      payload = (await request.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ error: "invalid_request", message: "Invalid request body." }, { status: 400 });
    }

    const applicationIds = Array.isArray(payload.applicationIds)
      ? payload.applicationIds.filter((x): x is string => typeof x === "string" && x.length > 0)
      : [];
    const toStage = typeof payload.toStage === "string" ? payload.toStage.trim() : "";

    if (applicationIds.length === 0 || !toStage) {
      return NextResponse.json(
        { error: "missing_fields", message: "applicationIds and toStage are required." },
        { status: 400 },
      );
    }
    if (toStage.length > 60) {
      return NextResponse.json({ error: "stage_invalid", message: "stage value is too long." }, { status: 400 });
    }

    const result = await bulkMoveStage({
      applicationIds,
      toStage,
      actorUserId: ctx.userId,
      businessId: ctx.businessId,
    });
    if (!result.ok) {
      return NextResponse.json({ error: "move_rejected", message: "Couldn't move the selected applicants. Please try again." }, { status: 422 });
    }

    const auditClient = hiringAuditClient();
    const correlationId = crypto.randomUUID();
    await Promise.all(
      applicationIds.map(async (applicationId) => {
        await writeAuditLog(auditClient, {
          action: "hiring.application.stage_moved",
          entityType: "jobs_application",
          entityId: applicationId,
          newValues: { toStage, actorUserId: ctx.userId, businessId: ctx.businessId },
          division: "jobs",
          correlationId,
        });
        const appCtx = await getApplicationContext(applicationId);
        await emitHiringEvent({
          key: "HIRING_APPLICATION_STAGED",
          actorUserId: ctx.userId,
          roleHint: ctx.role,
          businessId: ctx.businessId,
          pipelineId: appCtx?.pipelineId,
          applicationId,
          properties: {
            title: "Application staged",
            summary: `Application moved to ${toStage}.`,
            status: toStage,
            toStage,
          },
        });
      }),
    );

    return NextResponse.json({ ok: true, moved: result.moved });
  } catch (error) {
    console.error("[employer/hiring/stage-move] internal error:", error);
    return NextResponse.json({ error: "internal_error", message: "Internal server error." }, { status: 500 });
  }
}
