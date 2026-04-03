import { NextResponse } from "next/server";
import { runLearnAutomationSweep } from "@/lib/learn/automation";

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  const provided = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || request.headers.get("x-cron-secret");
  return provided === secret;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const result = await runLearnAutomationSweep();
  return NextResponse.json({ ok: true, result });
}
