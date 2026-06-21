import { NextResponse } from "next/server";
import { COMPANY } from "@henryco/config";
import { getJobsCopy } from "@henryco/i18n";
import { JobsRejectionLetterDocument, renderDocumentToBuffer } from "@henryco/branded-documents";
import { resolveHiringActingContext } from "@/lib/jobs/hiring-guard";
import { getApplicationContext, getBusinessName } from "@/lib/jobs/hiring-suite";
import { getJobsPublicLocale } from "@/lib/locale-server";

/**
 * V3-70 S6 — GET /api/employer/hiring/document?applicationId=&type=rejection
 *
 * Renders the branded rejection / application-update letter as a PDF. Copy is
 * resolved through @henryco/i18n (merge fields filled here) and the legal entity
 * from @henryco/config (COMPANY.group.legalName = "Henry Onyx Limited"). Offers
 * keep the existing /api/jobs/offers + offer-letter path (not duplicated here).
 * Business-context gated + the application must belong to the acting business.
 */
export const dynamic = "force-dynamic";

const fill = (template: string, vars: Record<string, string>) =>
  Object.entries(vars).reduce((acc, [k, v]) => acc.replaceAll(`{${k}}`, v), template);

export async function GET(request: Request) {
  try {
    const ctx = await resolveHiringActingContext();
    if (ctx.kind !== "business") {
      return NextResponse.json({ error: "forbidden", message: "Switch to your business to download documents." }, { status: 403 });
    }

    const url = new URL(request.url);
    const applicationId = (url.searchParams.get("applicationId") ?? "").trim();
    const type = (url.searchParams.get("type") ?? "rejection").trim();
    if (!applicationId) {
      return NextResponse.json({ error: "missing_fields", message: "applicationId is required." }, { status: 400 });
    }
    if (type !== "rejection") {
      return NextResponse.json({ error: "unsupported_type", message: "Only the rejection letter renders here." }, { status: 400 });
    }

    const appCtx = await getApplicationContext(applicationId);
    if (!appCtx || appCtx.businessId !== ctx.businessId) {
      return NextResponse.json({ error: "forbidden", message: "Application not in your business." }, { status: 403 });
    }

    const locale = await getJobsPublicLocale();
    const copy = getJobsCopy(locale).employerHiringSuite;
    const businessName = (await getBusinessName(ctx.businessId)) ?? "the company";
    const candidateName = appCtx.candidateName ?? "Candidate";
    const roleTitle = appCtx.jobTitle ?? "the role";
    const legalEntity = COMPANY.group.legalName;
    const vars = { candidate: candidateName, role: roleTitle, business: businessName, legalEntity };

    const referenceNo = `REJ-${applicationId.slice(0, 8).toUpperCase()}`;
    const buffer = await renderDocumentToBuffer(
      JobsRejectionLetterDocument({
        referenceNo,
        issuedAt: new Date().toISOString(),
        candidateName,
        roleTitle,
        businessName,
        labels: {
          documentType: copy.rejectionDocType,
          headerTitle: copy.rejectionDocTitle,
          subtitle: fill(copy.rejectionDocSubtitleTemplate, vars),
          bodyKicker: copy.rejectionDocKicker,
        },
        paragraphs: [
          fill(copy.rejectionParaGreetingTemplate, vars),
          fill(copy.rejectionParaBodyTemplate, vars),
          fill(copy.rejectionParaClosingTemplate, vars),
        ],
        signOff: fill(copy.rejectionSignOffTemplate, vars),
        legalLines: [fill(copy.rejectionLegalLineTemplate, vars)],
      }),
    );

    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "content-type": "application/pdf",
        "content-disposition": `attachment; filename="${referenceNo}.pdf"`,
        "cache-control": "no-store",
      },
    });
  } catch (error) {
    console.error("[employer/hiring/document] internal error:", error);
    return NextResponse.json({ error: "internal_error", message: "Internal server error." }, { status: 500 });
  }
}
