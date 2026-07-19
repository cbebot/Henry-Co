import { NextResponse } from "next/server";
import { runLearnAutomationSweep } from "@/lib/learn/automation";

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  // Fail CLOSED when the secret is unset — an unset secret must never let an
  // anonymous caller trigger the sweep or read its internal counters.
  if (!secret) return false;
  const provided = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || request.headers.get("x-cron-secret");
  return provided === secret;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  // Keep the internal automation counters in server logs / telemetry — the
  // HTTP body carries only an opaque acknowledgement.
  await runLearnAutomationSweep();
  return NextResponse.json({ ok: true });
}
