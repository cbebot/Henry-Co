import { NextResponse } from "next/server";
import { runOwnerReports, type OwnerReportKind } from "@/lib/owner-reporting";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAuthorized(request: Request) {
  const expected = cleanText(process.env.CRON_SECRET);
  if (!expected) return false;
  return request.headers.get("authorization") === `Bearer ${expected}`;
}

function cleanText(value: unknown) {
  return String(value ?? "").trim();
}

function parseKinds(request: Request): OwnerReportKind[] {
  const url = new URL(request.url);
  const kind = cleanText(url.searchParams.get("kind")).toLowerCase();
  if (kind === "daily" || kind === "weekly" || kind === "monthly") {
    return [kind];
  }
  // The cron fires once a day (vercel.json 07:05 UTC): the DAILY morning brief
  // always runs; weekly/monthly gate themselves to Mondays / the 1st inside
  // shouldRunReport.
  return ["daily", "weekly", "monthly"];
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const force = ["1", "true", "yes"].includes(cleanText(url.searchParams.get("force")).toLowerCase());

  try {
    const summary = await runOwnerReports({
      now: new Date(),
      force,
      kinds: parseKinds(request),
    });

    return NextResponse.json({
      ok: true,
      force,
      summary,
      executedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[owner-reports]", error);
    return NextResponse.json(
      { ok: false, error: "Owner report run failed." },
      { status: 500 }
    );
  }
}
