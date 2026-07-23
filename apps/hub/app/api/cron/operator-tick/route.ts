import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { runOperatorTick } from "@/lib/founder-intelligence/operator-tick";

/**
 * SA-4 — the Owner-AI operator tick cron (every 30 min; ARCHITECTURE §4.3).
 *
 * Auth: CRON_SECRET bearer with a constant-time compare (the agency-tick /
 * account-cron idiom — NOT the plain === some legacy hub crons use), fail-closed
 * when the secret is unset.
 *
 * maxDuration (60s) is deliberately BELOW the operator lock TTL (90s) so the
 * platform kills an overrunning tick BEFORE its single-flight lock can expire —
 * a live tick can never outlive its own lock (the SA-3 TTL lesson).
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
    const summary = await runOperatorTick(new Date());
    return NextResponse.json({ ok: true, summary, executedAt: new Date().toISOString() });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "operator tick failed" },
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
