import { NextResponse } from "next/server";
import { runPropertyAutomationSweep } from "@/lib/property/automation";

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
    const summary = await runPropertyAutomationSweep(new Date());
    return NextResponse.json({
      ok: true,
      summary,
      executedAt: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Property automation sweep failed.",
      },
      { status: 500 }
    );
  }
}
