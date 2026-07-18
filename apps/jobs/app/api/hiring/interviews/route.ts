import { NextResponse } from "next/server";
import { scheduleInterview } from "@/lib/jobs/hiring";
import { resolveHiringActingContext } from "@/lib/jobs/hiring-guard";
import { getApplicationContext } from "@/lib/jobs/hiring-suite";
import {
  actingBusinessOwnsApplication,
  normalizeScheduleInterviewInput,
} from "@/lib/jobs/hiring-authz";

/**
 * JOB-1 — POST /api/hiring/interviews.
 *
 * Prior version had ZERO authorization and wrote jobs_interviews via the
 * service-role client, so anyone could inject a phishing meetingUrl onto any
 * application. Now gated exactly like the secure sibling
 * /api/employer/hiring/schedule-interview:
 *   1. Require a BUSINESS acting context (personal -> 403).
 *   2. Resolve the application's owning business and require it to equal the
 *      acting business id (cross-business -> 403). business_id is the only
 *      trusted owner key — never employer slug.
 *   3. Harden the payload: https-only meetingUrl, interviewType allowlist,
 *      durationMinutes clamped to 5..480, scheduledAt must parse.
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

    const normalized = normalizeScheduleInterviewInput(payload);
    if (!normalized.ok) {
      return NextResponse.json(
        { error: normalized.error, message: "Invalid interview details." },
        { status: 400 },
      );
    }
    const input = normalized.value;

    const appCtx = await getApplicationContext(input.applicationId);
    if (!actingBusinessOwnsApplication(ctx, appCtx)) {
      return NextResponse.json(
        { error: "forbidden", message: "Application not in your business." },
        { status: 403 },
      );
    }

    const interview = await scheduleInterview({
      applicationId: input.applicationId,
      title: input.title,
      scheduledAt: input.scheduledAt,
      durationMinutes: input.durationMinutes,
      timezone: input.timezone,
      interviewType: input.interviewType,
      location: input.location ?? undefined,
      meetingUrl: input.meetingUrl ?? undefined,
      notes: input.notes ?? undefined,
    });

    if (!interview) {
      return NextResponse.json({ error: "Failed to schedule interview." }, { status: 500 });
    }

    return NextResponse.json({ interview });
  } catch {
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
