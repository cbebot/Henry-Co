/**
 * /api/runtime-error — receives client-side error boundary reports.
 *
 * PASS 22 issue #4. Before this route, the account error boundary only
 * called `console.error()` in the browser; the Next.js error digest the
 * user shared with support (e.g. "ref 3280500486") had no server-side
 * counterpart, so root-cause traces were impossible after the fact.
 *
 * The route writes a structured line to the server log (Vercel surfaces it
 * in the runtime log search). It deliberately avoids dependencies on the
 * Supabase client, observability SDKs, or any other surface that could
 * itself fail — a logging endpoint that fails closed makes a bad bug
 * worse. If the request body is malformed we still return 204 so the
 * client doesn't loop on a retry.
 */

import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type IncomingPayload = {
  surface?: unknown;
  digest?: unknown;
  message?: unknown;
  stack?: unknown;
  path?: unknown;
  userAgent?: unknown;
  at?: unknown;
};

const MAX_FIELD = 4000;

function clamp(value: unknown): string | null {
  if (value == null) return null;
  const text = typeof value === "string" ? value : String(value);
  return text.length > MAX_FIELD ? `${text.slice(0, MAX_FIELD)}…[truncated]` : text;
}

export async function POST(request: Request) {
  let payload: IncomingPayload = {};
  try {
    payload = (await request.json()) as IncomingPayload;
  } catch {
    return new NextResponse(null, { status: 204 });
  }

  // Single structured log line — easy to grep by digest in Vercel runtime
  // logs. The leading prefix is intentional so log filters can pin to it.
  console.error("[account-runtime-error]", {
    surface: clamp(payload.surface) ?? "account",
    digest: clamp(payload.digest),
    message: clamp(payload.message),
    stack: clamp(payload.stack),
    path: clamp(payload.path),
    userAgent: clamp(payload.userAgent),
    at: clamp(payload.at) ?? new Date().toISOString(),
    ip: request.headers.get("x-forwarded-for") ?? null,
  });

  return new NextResponse(null, { status: 204 });
}
