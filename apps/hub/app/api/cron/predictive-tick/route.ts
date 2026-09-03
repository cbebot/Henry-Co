import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { runPredictiveBatch } from "@/lib/predictive/batch";

/**
 * V3-41 — the predictive quality & workload batch cron (daily).
 *
 * Auth: CRON_SECRET bearer with a constant-time compare (the operator-tick /
 * agency-tick idiom), fail-closed when the secret is unset.
 *
 * maxDuration (60s) is deliberately BELOW the predictive lock TTL (300s) so the
 * platform kills an overrunning tick BEFORE its single-flight lock can expire —
 * a live tick can never outlive its own lock (the SA-3 TTL lesson).
 *
 * The batch is flag-dark by default (`predictive_operations`) and writes only to
 * staff-read predictive tables; it can take no action on any customer.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function isAuthorized(request: NextRequest): boolean {
  const expected = String(process.env.CRON_SECRET || "").trim();
  if (!expected) return false; // fail-closed
  const header = request.headers.get("authorization") || "";
  const presented = header.startsWith("Bearer ") ? header.slice("Bearer ".length).trim() : "";
  if (!presented) return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(presented);
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

async function handle(request: NextRequest): Promise<Response> {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const summary = await runPredictiveBatch(new Date());
    return NextResponse.json({ ok: true, summary, executedAt: new Date().toISOString() });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "predictive tick failed" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest): Promise<Response> {
  return handle(request);
}

export async function POST(request: NextRequest): Promise<Response> {
  return handle(request);
}
