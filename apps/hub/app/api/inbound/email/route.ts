import { NextResponse } from "next/server";

import { INBOUND_EMAIL_WEBHOOK_SECRET_ENV } from "@/lib/owner-inbox/constants";
import { parseInboundPayload } from "@/lib/owner-inbox/payload";
import { recordInboundEmail } from "@/lib/owner-inbox/repository";
import { verifyInboundSignature } from "@/lib/owner-inbox/signature";

/**
 * Inbound-email webhook. The Cloudflare Email Worker POSTs HMAC-signed parsed
 * mail here; we verify, validate, and store into the owner-only inbox.
 *
 * Security: shared-secret HMAC over `${timestamp}.${rawBody}` with a 5-minute
 * replay window (verifyInboundSignature). No secrets or body content are ever
 * logged. Storage is service-role behind owner-only RLS.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clean(value: unknown): string {
  return String(value ?? "").trim();
}

export async function POST(request: Request): Promise<Response> {
  try {
    const secret = clean(process.env[INBOUND_EMAIL_WEBHOOK_SECRET_ENV]);
    if (!secret) {
      return NextResponse.json(
        { error: "inbound email webhook secret not configured" },
        { status: 503 },
      );
    }

    const timestamp = clean(request.headers.get("x-henry-timestamp"));
    const signature = clean(request.headers.get("x-henry-signature"));
    const rawBody = await request.text();

    const verify = verifyInboundSignature({ secret, timestamp, signature, rawBody });
    if (!verify.ok) {
      return NextResponse.json({ error: "unauthorized", reason: verify.reason }, { status: 401 });
    }

    let json: unknown;
    try {
      json = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "invalid json" }, { status: 400 });
    }

    const parsed = parseInboundPayload(json);
    if (!parsed.ok) {
      // 422 (not 5xx): a shape error will not improve on retry.
      return NextResponse.json({ error: "invalid payload", detail: parsed.error }, { status: 422 });
    }

    const result = await recordInboundEmail(parsed.payload);
    if (result.status === "error") {
      return NextResponse.json({ error: "store failed", detail: result.error }, { status: 500 });
    }

    return NextResponse.json({ ok: true, status: result.status, id: result.id ?? null });
  } catch (err) {
    // Log the error only — never the body (it carries PII/secrets).
    console.error("[inbound-email] webhook error:", err instanceof Error ? err.message : "unknown");
    return NextResponse.json({ error: "internal error" }, { status: 500 });
  }
}
