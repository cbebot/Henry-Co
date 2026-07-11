import { NextResponse } from "next/server";

import { requireOwner } from "@/app/lib/owner-auth";
import { getOwnerOverviewData } from "@/lib/owner-data";

export const runtime = "nodejs";

/**
 * GET /api/owner/intelligence/briefing — the greeting card of the founder dock
 * (OCC-2). The desktop assistant opens with the company's live state, not an
 * empty box: the same deterministic owner briefing the overview page renders
 * (signal-derived headline + focus + the next steps with their deep links).
 *
 * Fetched lazily when the dock opens — never on layout render — because the
 * owner dataset behind it is the heavy 27-table pull. OCC-3 re-points the
 * internals at the rebuilt data layer without changing this contract.
 *
 * Access model mirrors the chat route: flag-dark ⇒ 404, non-owner ⇒ 404.
 */
export async function GET() {
  if (process.env.NEXT_PUBLIC_FOUNDER_INTELLIGENCE_LIVE !== "1") {
    return NextResponse.json({ error: "Not available." }, { status: 404 });
  }

  const auth = await requireOwner();
  if (!auth.ok) {
    return NextResponse.json({ error: "Not available." }, { status: 404 });
  }

  try {
    const overview = await getOwnerOverviewData();
    const briefing = overview.briefing;
    return NextResponse.json({
      headline: briefing.headline,
      focus: briefing.focus,
      nextSteps: briefing.nextSteps.map((step) => ({
        title: step.title,
        href: step.href,
        severity: step.severity,
      })),
      generatedAt: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json({ error: "Please try again." }, { status: 502 });
  }
}
