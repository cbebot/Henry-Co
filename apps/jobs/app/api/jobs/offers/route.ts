import { NextResponse } from "next/server";
import {
  issueOfferLetter,
  type IssueOfferLetterInput,
} from "@/lib/jobs/offer-letter";
import { resolveHiringActingContext } from "@/lib/jobs/hiring-guard";
import { getApplicationContext } from "@/lib/jobs/hiring-suite";
import { actingBusinessOwnsApplication } from "@/lib/jobs/hiring-authz";
import { createAdminSupabase } from "@/lib/supabase";

/**
 * V3 PASS 21 — POST /api/jobs/offers — issue an offer letter
 * (Distinctive Rule #4 + Mandatory APIs §G).
 *
 * Requires (V3-CARE-JOBS-PREAPPLY-FIX-01), gated exactly like the secure
 * sibling hiring routes (/api/hiring/interviews, /api/employer/hiring/*):
 *   - A signed-in caller acting as a BUSINESS (personal -> 403). The
 *     acting context is resolved from the session and its business
 *     membership is re-verified live; nothing in the request names the
 *     actor or the business.
 *   - The application's pipeline must be OWNED by that acting business
 *     (cross-business -> 403). business_id is the only trusted owner key;
 *     "has some employer membership" never authorizes a specific pipeline.
 *   - No platform-staff bypass: an offer letter is an employer-authored
 *     document, so only the owning business issues it.
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
    const ctx = await resolveHiringActingContext();
    if (!ctx.userId) {
      return NextResponse.json(
        { error: "unauthorized", message: "Sign in to issue offers." },
        { status: 401 },
      );
    }
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

    // Ownership gate: the application's pipeline must belong to the business
    // the caller is acting as. Unknown ids get the same 403 as foreign ones.
    const appCtx = await getApplicationContext(applicationId);
    if (!appCtx || !actingBusinessOwnsApplication(ctx, appCtx)) {
      return NextResponse.json(
        { error: "forbidden", message: "Application not visible." },
        { status: 403 },
      );
    }

    // Candidate addressing for the offer. Only real jobs_applications columns
    // (the candidate's user id is `candidate_id`; there is no
    // `candidate_user_id`, and selecting it failed every request).
    const admin = createAdminSupabase();
    const { data: appRow, error: appError } = await admin
      .from("jobs_applications")
      .select("id, candidate_name, candidate_email")
      .eq("id", appCtx.applicationId)
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
    const pipelineTitle = appCtx.jobTitle || "the role";

    const terms = (payload.terms || {}) as Record<string, unknown>;
    const issueInput: IssueOfferLetterInput = {
      applicationId: appCtx.applicationId,
      pipelineId: appCtx.pipelineId || null,
      issuedByUserId: ctx.userId,
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

    // Project the record — the employer client needs the draft facts only.
    // Signing infrastructure detail (provider, envelope id, signing URLs)
    // and signature forensics stay server-side.
    return NextResponse.json({
      offer: {
        id: offer.id,
        applicationId: offer.applicationId,
        pipelineId: offer.pipelineId,
        status: offer.status,
        terms: offer.terms,
        expiresAt: offer.expiresAt,
        issuedAt: offer.issuedAt,
        createdAt: offer.createdAt,
      },
    });
  } catch (error) {
    console.error("[jobs/offers] internal error:", error);
    return NextResponse.json(
      { error: "internal_error", message: "Internal server error." },
      { status: 500 },
    );
  }
}
