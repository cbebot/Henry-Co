import { NextResponse } from "next/server";
import { buildHealthResponse, healthStatusCode } from "@henryco/observability/health";

/**
 * V3-10 S8 + A6 — apps/account /api/health.
 *
 * Uniform pattern across all 10 web apps. See
 * packages/observability/src/health.ts for the helper contract.
 *
 * Returns 200 only when Supabase `SELECT 1` succeeds AND the critical
 * env vars are set. Returns 503 with a structured `{ ok: false,
 * checks: { supabase: 'fail'|'ok', env: 'fail'|'ok' } }` body
 * otherwise — Vercel monitoring + future SLO tooling consume the 503
 * signal.
 *
 * `version` is the commit SHA Vercel deploys with; `deploy` is the
 * Vercel deployment id.
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
