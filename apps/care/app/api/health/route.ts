import { NextResponse } from "next/server";
import { buildHealthResponse, healthStatusCode } from "@henryco/observability/health";

/**
 * V3-10 S8 + A6 — apps/care /api/health.
 * See apps/account/app/api/health/route.ts for the canonical pattern.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const body = await buildHealthResponse();
  return NextResponse.json(body, {
    status: healthStatusCode(body),
    headers: { "Cache-Control": "no-store" },
  });
}
