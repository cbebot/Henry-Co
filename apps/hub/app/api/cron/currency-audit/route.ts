import { NextResponse } from "next/server";
import { runCurrencyContextAudit } from "@/lib/currency-audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function cleanText(value: unknown) {
  return String(value ?? "").trim();
}

function isAuthorized(request: Request) {
  const expected = cleanText(process.env.CRON_SECRET);
  if (!expected) return false;
  return request.headers.get("authorization") === `Bearer ${expected}`;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const limit = Number(url.searchParams.get("limit") || 250);

  try {
    const summary = await runCurrencyContextAudit(Number.isFinite(limit) ? limit : 250);
    return NextResponse.json({
      ok: true,
      summary,
      executedAt: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Currency audit could not complete.",
      },
      { status: 500 }
    );
  }
}
