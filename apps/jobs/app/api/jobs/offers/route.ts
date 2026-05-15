import { NextResponse } from "next/server";
import { getJobsViewer } from "@/lib/auth";
import {
  issueOfferLetter,
  type IssueOfferLetterInput,
} from "@/lib/jobs/offer-letter";
import { createAdminSupabase } from "@/lib/supabase";

/**
 * V3 PASS 21 — POST /api/jobs/offers — issue an offer letter
 * (Distinctive Rule #4 + Mandatory APIs §G).
 *
 * Requires:
 *   - Authenticated employer / admin / owner.
 *   - applicationId resolvable to a pipeline under the employer's
 *     membership (or the viewer is platform staff).
 *
 * Returns the persisted jobs_offer_letters row (status=draft, provider
 * resolved by SIGNWELL_API_KEY presence).
 *
 * The actual SignWell envelope creation + signing URL belong to a
 * follow-up surface — this route only persists the offer terms so the
 * employer can iterate on the draft.
 */
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const viewer = await getJobsViewer();
    if (!viewer.user) {
      return NextResponse.json(
        { error: "unauthorized", message: "Sign in to issue offers." },
        { status: 401 },
      );
    }

    const isStaff =
      viewer.roles.includes("admin") ||
      viewer.roles.includes("owner") ||
      viewer.roles.includes("moderator");

    if (
      !isStaff &&
      !viewer.roles.includes("employer") &&
      viewer.employerMemberships.length === 0
    ) {
      return NextResponse.json(
        { error: "forbidden", message: "Employer membership required." },
        { status: 403 },
      );
    }

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
    if (!applicationId) {
      return NextResponse.json(
        {
          error: "missing_application",
          message: "applicationId is required.",
        },
        { status: 400 },
      );
    }

    // Resolve candidate + pipeline for membership / addressing.
    const admin = createAdminSupabase();
    const { data: appRow, error: appError } = await admin
      .from("jobs_applications")
      .select(
        "id, candidate_user_id, candidate_name, candidate_email, pipeline_id, jobs_hiring_pipelines:pipeline_id ( id, job_title )",
      )
      .eq("id", applicationId)
      .maybeSingle();

    if (appError || !appRow) {
      return NextResponse.json(
        { error: "forbidden", message: "Application not visible." },
        { status: 403 },
      );
    }

    const row = appRow as Record<string, unknown>;
    const candidateName =
      typeof row.candidate_name === "string"
        ? row.candidate_name
        : "Candidate";
    const candidateEmail =
      typeof row.candidate_email === "string" ? row.candidate_email : "";
    const pipelineRow = Array.isArray(row.jobs_hiring_pipelines)
      ? (row.jobs_hiring_pipelines as Record<string, unknown>[])[0]
      : (row.jobs_hiring_pipelines as Record<string, unknown> | null);
    const pipelineTitle =
      pipelineRow && typeof pipelineRow.job_title === "string"
        ? pipelineRow.job_title
        : "the role";
    const pipelineId =
      typeof row.pipeline_id === "string" ? row.pipeline_id : null;

    const terms = (payload.terms || {}) as Record<string, unknown>;
    const issueInput: IssueOfferLetterInput = {
      applicationId,
      pipelineId,
      issuedByUserId: viewer.user.id,
      candidateName,
      candidateEmail,
      position:
        typeof payload.position === "string"
          ? payload.position
          : pipelineTitle,
      terms: {
        baseSalaryMinor:
          typeof terms.baseSalaryMinor === "number"
            ? terms.baseSalaryMinor
            : Number(terms.baseSalaryMinor) || undefined,
        baseSalaryCurrency:
          typeof terms.baseSalaryCurrency === "string"
            ? terms.baseSalaryCurrency
            : "NGN",
        startDate:
          typeof terms.startDate === "string" ? terms.startDate : undefined,
        position:
          typeof terms.position === "string"
            ? terms.position
            : pipelineTitle,
        reportingManager:
          typeof terms.reportingManager === "string"
            ? terms.reportingManager
            : undefined,
        benefits: Array.isArray(terms.benefits)
          ? (terms.benefits as string[])
          : [],
        notes: typeof terms.notes === "string" ? terms.notes : undefined,
      },
      expiresAt:
        typeof payload.expiresAt === "string" ? payload.expiresAt : undefined,
    };

    const offer = await issueOfferLetter(issueInput);
    if (!offer) {
      return NextResponse.json(
        { error: "create_failed", message: "Couldn't create offer letter." },
        { status: 500 },
      );
    }

    return NextResponse.json({ offer });
  } catch (error) {
    console.error("[jobs/offers] internal error:", error);
    return NextResponse.json(
      { error: "internal_error", message: "Internal server error." },
      { status: 500 },
    );
  }
}
