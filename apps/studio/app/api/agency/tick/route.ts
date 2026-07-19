import { NextResponse, type NextRequest } from "next/server";
import { timingSafeEqual } from "node:crypto";

import { runAgencyTick } from "@/lib/agency/tick";

/**
 * GET|POST /api/agency/tick — the orchestration cron (ARCHITECTURE §3.1). Auth
 * mirrors the account crons: Bearer CRON_SECRET compared with timingSafeEqual
 * (constant-time — a `===` compare leaks the secret through timing). The tick
 * claims due jobs, advances what can advance, detects stalls, and releases its
 * claim; it deploys NOTHING (that door is the human one-tap+reauth only).
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Bound the tick BELOW the single-flight lock's TTL (TICK_LOCK_TTL_SECONDS=90):
// the platform kills an overrunning tick before its lock can expire, so a live
// tick can never outlive its lock and overlap a concurrent one (adversarial
// TTL-expiry hardening). The tick is idempotent, so a mid-run kill resumes cleanly.
export const maxDuration = 60;

const CRON_SECRET_ENV = "CRON_SECRET";

function isAuthorized(request: NextRequest): boolean {
  const expected = String(process.env[CRON_SECRET_ENV] || "").trim();
  if (!expected) return false;
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
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  try {
    const summary = await runAgencyTick(new Date());
    return NextResponse.json({ ok: true, summary, executedAt: new Date().toISOString() });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "agency tick failed" },
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
