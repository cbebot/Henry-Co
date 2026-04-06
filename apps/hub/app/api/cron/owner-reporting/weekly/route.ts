import { NextResponse } from "next/server";
import { runOwnerReport } from "@/lib/owner-reporting";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function isAuthorized(request: Request) {
  const secret = cleanText(process.env.CRON_SECRET);
  if (!secret) {
    return true;
  }

  return request.headers.get("authorization") === `Bearer ${secret}`;
}

function cleanText(value?: unknown) {
  return String(value ?? "").trim();
}

async function handleRequest(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const summary = await runOwnerReport("weekly");
    return NextResponse.json(summary, {
      status: summary.ok ? 200 : summary.failed ? 500 : 200,
    });
  } catch (error) {
    console.error("[owner-reporting/weekly]", error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "weekly_owner_report_failed" },
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
