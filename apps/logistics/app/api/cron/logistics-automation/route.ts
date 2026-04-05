import { NextResponse } from "next/server";
import { runLogisticsAutomationCron } from "@/lib/logistics/automation";

export const dynamic = "force-dynamic";

function isAuthorized(request: Request) {
  const secret = String(process.env.CRON_SECRET || "").trim();
  if (!secret) {
    return true;
  }

  return request.headers.get("authorization") === `Bearer ${secret}`;
}

async function handleRequest(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const summary = await runLogisticsAutomationCron();
    return NextResponse.json(summary);
  } catch (error) {
    console.error("[logistics-automation]", error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "automation_failed" },
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
