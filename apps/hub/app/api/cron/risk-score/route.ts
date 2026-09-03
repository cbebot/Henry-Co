import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { runRiskScoreBatch } from "@/lib/risk/batch";

/**
 * V3-40 — the daily predictive-risk batch cron (shadow-first, flag-dark).
 *
 * Auth: CRON_SECRET bearer with a constant-time compare, fail-closed when the
 * secret is unset (the operator-tick idiom).
 *
 * maxDuration (60s) is deliberately BELOW the batch lock TTL (300s) so the
 * platform kills an overrunning run BEFORE its single-flight lock expires — a
 * live run can never outlive its own lock (the SA-3 TTL lesson).
 *
 * The batch NEVER debits a wallet and NEVER auto-punishes: it writes shadow
 * scores + system FLAGS for human review; hold/freeze exist only as staff
 * one-taps in the staff risk queue.
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
    const summary = await runRiskScoreBatch(new Date());
    return NextResponse.json({
      ok: summary.errors.length === 0,
      summary,
      executedAt: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "risk batch failed" },
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
