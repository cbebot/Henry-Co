import { NextResponse } from "next/server";
import { runSellerTierReconcile } from "@/lib/marketplace/seller-tier-reconcile";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAuthorized(request: Request) {
  const expected = String(process.env.CRON_SECRET || "").trim();
  if (!expected) return false;
  return request.headers.get("authorization") === `Bearer ${expected}`;
}

// V3-58 — daily seller-tier reconcile (registered in vercel.json crons at 03:10).
export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const summary = await runSellerTierReconcile();
    return NextResponse.json({ ok: true, summary, executedAt: new Date().toISOString() });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Seller-tier reconcile failed.",
      },
      { status: 500 },
    );
  }
}
