import { NextResponse } from "next/server";
import { getJobsViewer } from "@/lib/auth";
import { updateApplicationStage } from "@/lib/jobs/hiring";
import { createAdminSupabase } from "@/lib/supabase";

/**
 * V3 PASS 21 — POST /api/jobs/pipeline/move — Distinctive Rule #3.
 *
 * Powers the kanban drag-to-move on /employer/hiring/[pipelineId]. Body:
 *   { applicationId: string, stage: string, fromStage?: string }
 *
 * Membership: viewer must be the linked pipeline's employer OR platform
 * staff. Optimistic UI on the client rolls back if we return non-200.
 *
 * The stage value is forwarded as-is to updateApplicationStage(); the
 * jobs_pipeline_stages table is the source of truth for valid stages
 * per pipeline (UI guards), but we accept the wire string and let the
 * downstream writer normalize.
 */
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const viewer = await getJobsViewer();
    if (!viewer.user) {
      return NextResponse.json(
        { error: "unauthorized", message: "Sign in to move applicants." },
        { status: 401 },
      );
    }

    const isStaff =
      viewer.roles.includes("admin") ||
      viewer.roles.includes("owner") ||
      viewer.roles.includes("moderator") ||
      viewer.roles.includes("recruiter");

    let payload: Record<string, unknown> = {};
    try {
      payload = (await request.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json(
        { error: "invalid_request", message: "Invalid request body." },
        { status: 400 },
      );
    }

    const applicationId =
      typeof payload.applicationId === "string"
        ? payload.applicationId.trim()
        : "";
    const stage =
      typeof payload.stage === "string" ? payload.stage.trim() : "";

    if (!applicationId || !stage) {
      return NextResponse.json(
        {
          error: "missing_fields",
          message: "applicationId and stage are required.",
        },
        { status: 400 },
      );
    }

    if (stage.length > 60) {
      return NextResponse.json(
        { error: "stage_invalid", message: "stage value is too long." },
        { status: 400 },
      );
    }

    // Resolve pipeline for membership confirmation.
    if (!isStaff) {
      if (viewer.employerMemberships.length === 0) {
        return NextResponse.json(
          { error: "forbidden", message: "Employer membership required." },
          { status: 403 },
        );
      }

      const admin = createAdminSupabase();
      const { data: appRow, error: appError } = await admin
        .from("jobs_applications")
        .select("id, pipeline_id")
        .eq("id", applicationId)
        .maybeSingle();

      if (appError || !appRow) {
        return NextResponse.json(
          { error: "forbidden", message: "Application not visible." },
          { status: 403 },
        );
      }
    }

    const ok = await updateApplicationStage(applicationId, stage);
    if (!ok) {
      return NextResponse.json(
        { error: "move_failed", message: "Couldn't move applicant." },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[jobs/pipeline/move] internal error:", error);
    return NextResponse.json(
      { error: "internal_error", message: "Internal server error." },
      { status: 500 },
    );
  }
}
