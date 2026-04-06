import { NextResponse } from "next/server";
import { runOwnerReport } from "@/lib/owner-reporting";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function cleanText(value?: unknown) {
  return String(value ?? "").trim();
}

function isAuthorized(request: Request) {
  const secret = cleanText(process.env.CRON_SECRET);
  if (!secret) {
    return process.env.NODE_ENV !== "production";
  }

  return request.headers.get("authorization") === `Bearer ${secret}`;
}

async function handleRequest(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const force = ["1", "true", "yes"].includes(
      cleanText(url.searchParams.get("force")).toLowerCase()
    );
    const summary = await runOwnerReport("monthly", { now: new Date(), force });
    return NextResponse.json(summary, {
      status: summary.ok ? 200 : summary.failed ? 500 : 200,
    });
  } catch (error) {
    console.error("[owner-reporting/monthly]", error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "monthly_owner_report_failed" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  return handleRequest(request);
}

export async function POST(request: Request) {
  return handleRequest(request);
}
