import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { runMarketplaceAutomationSweep } from "@/lib/marketplace/automation";
import { isInstantPublishEnabled } from "@/lib/marketplace/publish-gate/flag";
import { runListingTrustSweep, type TrustSweepSummary } from "@/lib/marketplace/publish-gate/sweep";
import { createAdminSupabase } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAuthorized(request: Request) {
  const expected = String(process.env.CRON_SECRET || "").trim();
  if (!expected) return false;
  return request.headers.get("authorization") === `Bearer ${expected}`;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const summary = await runMarketplaceAutomationSweep(new Date());

    // V3-MKT-TRUST-01 — post-publish enforcement (reversible take-downs only).
    // Flag ON only; with the flag off this block does not run and the response
    // is what it always was. Its failure never fails the automation sweep.
    let trustSweep: TrustSweepSummary | null = null;
    if (isInstantPublishEnabled()) {
      try {
        trustSweep = await runListingTrustSweep(createAdminSupabase());
        if (trustSweep.hiddenPolicy + trustSweep.hiddenReports + trustSweep.hiddenRisk > 0) {
          // A listing left the storefront: the cached catalogue must show that now.
          revalidateTag("marketplace-home", { expire: 0 });
        }
      } catch {
        trustSweep = null;
      }
    }

    return NextResponse.json({
      ok: !summary.blocked,
      summary,
      ...(trustSweep ? { trustSweep } : {}),
      executedAt: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Marketplace automation sweep failed.",
      },
      { status: 500 }
    );
  }
}
