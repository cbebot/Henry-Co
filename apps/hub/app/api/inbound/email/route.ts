import { NextResponse } from "next/server";

import { INBOUND_EMAIL_WEBHOOK_SECRET_ENV } from "@/lib/owner-inbox/constants";
import { buildPayloadFromEnvelope, parseInboundEnvelope } from "@/lib/owner-inbox/parse";
import { parseInboundPayload } from "@/lib/owner-inbox/payload";
import { recordInboundEmail } from "@/lib/owner-inbox/repository";
import { verifyInboundSignature } from "@/lib/owner-inbox/signature";

/**
 * Inbound-email webhook. The Cloudflare Email Worker POSTs an HMAC-signed
 * envelope (trusted Cloudflare from/to + auth verdict + the raw RFC822 message,
 * size-capped, base64). We verify, parse the raw MIME server-side, and store it
 * into the owner-only inbox.
 *
 * Security: shared-secret HMAC over `${timestamp}.${rawBody}` with a 5-minute
 * replay window. SPF/DKIM/DMARC come from the trusted Cloudflare header only.
 * No secrets or body content are ever logged. Storage is service-role behind
 * owner-only RLS.
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
      // Do not reveal secret-configuration state to unauthenticated callers.
      console.error("[henryco/hub-api] inbound/email: webhook secret not configured");
      return NextResponse.json({ error: "unavailable" }, { status: 503 });
    }

    // DoS guard: reject an oversized declared body BEFORE buffering it in memory
    // (well above MAX_RAW_BYTES + base64 + JSON overhead). The HMAC is verified
    // next, but this caps an unauthenticated attacker who finds the URL.
    const declaredLength = Number(request.headers.get("content-length") || 0);
    if (Number.isFinite(declaredLength) && declaredLength > 8_000_000) {
      return NextResponse.json({ error: "payload too large" }, { status: 413 });
    }

    const timestamp = clean(request.headers.get("x-henry-timestamp"));
    const signature = clean(request.headers.get("x-henry-signature"));
    const rawBody = await request.text();

    const verify = verifyInboundSignature({ secret, timestamp, signature, rawBody });
    if (!verify.ok) {
      // Never echo which verification step failed — that is an HMAC forgery
      // oracle. Keep the specific reason in server logs only.
      console.error("[henryco/hub-api] inbound/email: signature rejected —", verify.reason);
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    let json: unknown;
    try {
      json = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "invalid json" }, { status: 400 });
    }

    const env = parseInboundEnvelope(json);
    if (!env.ok) {
      return NextResponse.json({ error: "invalid envelope", detail: env.error }, { status: 422 });
    }

    const built = await buildPayloadFromEnvelope(env.envelope);
    const parsed = parseInboundPayload(built);
    if (!parsed.ok) {
      // 200 (acknowledge, don't error): a sender-less / unparseable message
      // (e.g. a garbled bounce) will never succeed on retry, so we accept-and-skip
      // rather than make the Worker retry it.
      return NextResponse.json({ ok: true, status: "skipped", reason: parsed.error });
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
