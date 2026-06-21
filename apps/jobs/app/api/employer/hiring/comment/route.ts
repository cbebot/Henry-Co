import { NextResponse } from "next/server";
import { publishNotification } from "@henryco/notifications";
import { writeAuditLog } from "@henryco/observability/audit-log";
import { hiringAuditClient, resolveHiringActingContext } from "@/lib/jobs/hiring-guard";
import { addTeamNote, getApplicationContext, getBusinessMembers } from "@/lib/jobs/hiring-suite";

/**
 * V3-70 S4 — POST /api/employer/hiring/comment
 * Body: { applicationId, body, parentNoteId?, mentions?: string[] }
 *
 * Posts an internal (operator-only) team note. @mentions are resolved against the
 * owning business's members only — a mention of a non-member is dropped server-
 * side and never delivered. Each delivered mention gets one in-app notification.
 */
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const ctx = await resolveHiringActingContext();
    if (ctx.kind !== "business") {
      return NextResponse.json({ error: "forbidden", message: "Switch to your business to comment." }, { status: 403 });
    }

    let payload: Record<string, unknown> = {};
    try {
      payload = (await request.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ error: "invalid_request", message: "Invalid request body." }, { status: 400 });
    }

    const applicationId = typeof payload.applicationId === "string" ? payload.applicationId.trim() : "";
    const body = typeof payload.body === "string" ? payload.body.trim().slice(0, 5000) : "";
    const parentNoteId = typeof payload.parentNoteId === "string" && payload.parentNoteId ? payload.parentNoteId : null;
    const mentions = Array.isArray(payload.mentions)
      ? payload.mentions.filter((x): x is string => typeof x === "string" && x.length > 0)
      : [];

    if (!applicationId || !body) {
      return NextResponse.json({ error: "missing_fields", message: "applicationId and body are required." }, { status: 400 });
    }

    const appCtx = await getApplicationContext(applicationId);
    if (!appCtx || appCtx.businessId !== ctx.businessId) {
      return NextResponse.json({ error: "forbidden", message: "Application not in your business." }, { status: 403 });
    }

    const result = await addTeamNote({
      applicationId,
      authorUserId: ctx.userId,
      businessId: ctx.businessId,
      body,
      parentNoteId,
      requestedMentions: mentions,
    });
    if (!result.ok) {
      return NextResponse.json({ error: "comment_failed", message: result.error }, { status: 422 });
    }

    // Notify each delivered mention (members only) — best-effort, never blocks.
    if (result.deliveredMentions.length > 0) {
      const members = await getBusinessMembers(ctx.businessId);
      const authorName = members.find((m) => m.userId === ctx.userId)?.name ?? "A teammate";
      const deepLink = `/employer/hiring/${appCtx.pipelineId}/${applicationId}`;
      const snippet = body.length > 140 ? `${body.slice(0, 140)}…` : body;
      await Promise.all(
        result.deliveredMentions.map((userId) =>
          publishNotification({
            userId,
            division: "jobs",
            eventType: `hiring.comment.mention.${result.note.id}`,
            title: `${authorName} mentioned you`,
            body: snippet,
            deepLink,
            actorUserId: ctx.userId,
            relatedId: result.note.id,
            relatedType: "hiring_comment",
          }).catch((err: unknown) => {
            console.error("[employer/hiring/comment] notify error:", err);
            return null;
          }),
        ),
      );
    }

    await writeAuditLog(hiringAuditClient(), {
      action: "hiring.application.commented",
      entityType: "jobs_application",
      entityId: applicationId,
      newValues: { noteId: result.note.id, mentions: result.deliveredMentions, actorUserId: ctx.userId, businessId: ctx.businessId },
      division: "jobs",
    });

    return NextResponse.json({ ok: true, note: result.note, deliveredMentions: result.deliveredMentions });
  } catch (error) {
    console.error("[employer/hiring/comment] internal error:", error);
    return NextResponse.json({ error: "internal_error", message: "Internal server error." }, { status: 500 });
  }
}
