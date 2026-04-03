import { NextResponse } from "next/server";
import { runCareAutomationSweep } from "@/lib/automation/care-automation";
import { syncInboundSupportEmails } from "@/lib/support/data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAuthorized(request: Request) {
  const expected = String(process.env.CRON_SECRET || "").trim();
  if (!expected) {
    return false;
  }

  return request.headers.get("authorization") === `Bearer ${expected}`;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [summary, inboundSync] = await Promise.all([
      runCareAutomationSweep(new Date()),
      syncInboundSupportEmails(20),
    ]);
    return NextResponse.json({
      ok: true,
      summary,
      inboundSync,
      executedAt: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Automation sweep failed.",
      },
      { status: 500 }
    );
  }
}
