import { NextResponse } from "next/server";
import { writeAuditLog } from "@henryco/observability/audit-log";
import { hiringAuditClient, resolveHiringActingContext } from "@/lib/jobs/hiring-guard";
import { applyDecision, getApplicationContext } from "@/lib/jobs/hiring-suite";
import { decisionToTransition, type DecisionType } from "@/lib/jobs/hiring-suite-logic";
import { emitHiringEvent } from "@/lib/jobs/hiring-events";

/**
 * V3-70 S6 — POST /api/employer/hiring/decision
 * Body: { applicationId, type: "offer" | "rejection" | "hire", templateKey?, tone? }
 *
 * Records a recruiter decision: moves the stage (offer→offer, rejection→rejected,
 * hire→hired), sets status, stamps metadata.decision, and emits the matching
 * telemetry event. The branded offer/rejection PDF renders via GET
 * /api/employer/hiring/document. Business-context gated. No money mutation.
 */
export const dynamic = "force-dynamic";

const DECISION_TYPES = new Set<DecisionType>(["offer", "rejection", "hire"]);

export async function POST(request: Request) {
  try {
    const ctx = await resolveHiringActingContext();
    if (ctx.kind !== "business") {
      return NextResponse.json({ error: "forbidden", message: "Switch to your business to make hiring decisions." }, { status: 403 });
    }

    let payload: Record<string, unknown> = {};
    try {
      payload = (await request.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ error: "invalid_request", message: "Invalid request body." }, { status: 400 });
    }

    const applicationId = typeof payload.applicationId === "string" ? payload.applicationId.trim() : "";
    const type = typeof payload.type === "string" ? (payload.type as DecisionType) : ("" as DecisionType);
    const templateKey = typeof payload.templateKey === "string" ? payload.templateKey.slice(0, 80) : null;
    const tone = typeof payload.tone === "string" ? payload.tone.slice(0, 40) : null;

    if (!applicationId || !DECISION_TYPES.has(type)) {
      return NextResponse.json({ error: "missing_fields", message: "applicationId and a valid type are required." }, { status: 400 });
    }

    const appCtx = await getApplicationContext(applicationId);
    if (!appCtx || appCtx.businessId !== ctx.businessId) {
      return NextResponse.json({ error: "forbidden", message: "Application not in your business." }, { status: 403 });
    }

    const res = await applyDecision({
      applicationId,
      type,
      actorUserId: ctx.userId,
      businessId: ctx.businessId,
      pipelineStages: appCtx.stages,
      templateKey,
      tone,
    });
    if (!res.ok) {
      return NextResponse.json({ error: "decision_failed", message: res.error }, { status: 500 });
    }

    const transition = decisionToTransition(type);
    await writeAuditLog(hiringAuditClient(), {
      action: `hiring.application.${type}`,
      entityType: "jobs_application",
      entityId: applicationId,
      newValues: { type, stage: res.stage, status: res.status, templateKey, actorUserId: ctx.userId, businessId: ctx.businessId },
      division: "jobs",
    });

    await emitHiringEvent({
      key: transition.eventKey,
      actorUserId: ctx.userId,
      roleHint: ctx.role,
      businessId: ctx.businessId,
      pipelineId: appCtx.pipelineId,
      applicationId,
      properties: {
        title:
          type === "offer" ? "Offer sent" : type === "hire" ? "Candidate hired" : "Application rejected",
        summary: `Decision "${type}" recorded (${res.status}).`,
        status: res.status,
        decisionType: type,
      },
    });

    return NextResponse.json({ ok: true, stage: res.stage, status: res.status });
  } catch (error) {
    console.error("[employer/hiring/decision] internal error:", error);
    return NextResponse.json({ error: "internal_error", message: "Internal server error." }, { status: 500 });
  }
}
