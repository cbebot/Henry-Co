/**
 * V3-KYC-VAULT-01 · scheduled KYC retention / crypto-shred sweep.
 *
 * Finds envelope-encrypted KYC artifacts past their CONFIGURED retention window
 * and crypto-shreds them (destroys the per-record data key → ciphertext is
 * permanently unrecoverable). DORMANT by default — it destroys nothing until a
 * master key AND a retention period are configured (legal sign-off required).
 *
 * Security posture mirrors the other account crons:
 *   - Bearer-token auth via CRON_SECRET, timingSafeEqual
 *   - GET + POST (Vercel Cron varies)
 *   - safe response codes only (200/401/500); never leaks shape
 *   - runtime: nodejs; dynamic: force-dynamic
 *
 * Schedule defined in apps/account/vercel.json.
 */
import { NextResponse, type NextRequest } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { runKycRetentionSweep } from "@/lib/kyc/retention";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CRON_SECRET_ENV = "CRON_SECRET";

function verifyCronAuth(req: NextRequest): boolean {
  const expected = (process.env[CRON_SECRET_ENV] || "").trim();
  if (!expected) return false;
  const header = req.headers.get("authorization") || "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) return false;
  const a = Buffer.from(match[1]!.trim());
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

async function handle(req: NextRequest): Promise<NextResponse> {
  if (!verifyCronAuth(req)) return new NextResponse(null, { status: 401 });
  try {
    const summary = await runKycRetentionSweep();
    return NextResponse.json({ ok: true, summary, executedAt: new Date().toISOString() });
  } catch {
    // Never leak internals from an identity-data path.
    return new NextResponse(null, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  return handle(req);
}
export async function POST(req: NextRequest) {
  return handle(req);
}
