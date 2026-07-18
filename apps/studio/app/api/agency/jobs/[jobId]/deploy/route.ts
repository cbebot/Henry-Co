import { NextResponse, type NextRequest } from "next/server";

import { getOptionalEnv } from "@/lib/env";
import { getStudioViewer, viewerHasRole } from "@/lib/studio/auth";
import { runDeploy } from "@/lib/agency/deploy";

/**
 * POST /api/agency/jobs/[jobId]/deploy — the staff-manual deploy RUN (SA-2).
 * Reachable only for a job already in `approved_for_deploy` (a stage produced
 * solely by the reauth-gated owner approval), so no code path deploys without
 * the one-tap+reauth. The run itself re-verifies the artifact hash before the
 * live flip (runDeploy → goLive). Owner-gated.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(_request: NextRequest, ctx: { params: Promise<{ jobId: string }> }): Promise<Response> {
  const { jobId } = await ctx.params;

  const viewer = await getStudioViewer();
  if (!viewer.user || !viewerHasRole(viewer, ["studio_owner"])) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  const sitesBaseDomain =
    getOptionalEnv("STUDIO_SITES_BASE_DOMAIN") || "sites.henryonyx.com";

  const result = await runDeploy({ jobId, actor: viewer.user.id, sitesBaseDomain });
  if (!result.ok) {
    return NextResponse.json({ error: "Deploy did not complete.", reason: result.reason }, { status: 409 });
  }
  return NextResponse.json({ ok: true, host: result.host });
}
