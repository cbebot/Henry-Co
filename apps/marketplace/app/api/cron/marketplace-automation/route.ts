import { NextResponse } from "next/server";
import { runMarketplaceAutomationSweep } from "@/lib/marketplace/automation";

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
    return NextResponse.json({
      ok: !summary.blocked,
      summary,
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
