/**
 * /api/runtime-error — receives client-side error boundary reports.
 *
 * DIAG-IOS-01. Symmetric to the account-app endpoint (added in PASS 22
 * issue #4) so hub's V3-10 `error.tsx` and `global-error.tsx` can also
 * phone home with the digest, message, stack, path, and UA. Without this
 * endpoint, hub error reports were observability dead-ends — Sentry
 * captured them but the runtime-log grep path used by support did not.
 *
 * Hardening invariants (mirror the account endpoint):
 *
 *   1. Zero downstream dependencies (no Supabase client, no observability
 *      SDK). A logging endpoint that fails closed makes a bad bug worse.
 *   2. Returns 204 on malformed bodies so the client never retry-loops.
 *   3. `clamp` each field to MAX_FIELD chars so payloads stay grep-able
 *      and don't balloon a single log line past the search-pane cap.
 *   4. Force-dynamic + nodejs runtime so the route is never edge-cached
 *      and the structured `console.error` line lands in Vercel runtime
 *      logs in real time.
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

  // Single structured log line — grep-able in Vercel runtime logs by the
  // leading prefix. The `hub-runtime-error` prefix mirrors the
  // `account-runtime-error` prefix used by the symmetric account endpoint
  // so a single log filter can pivot between divisions cleanly.
  console.error("[hub-runtime-error]", {
    surface: clamp(payload.surface) ?? "hub",
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
