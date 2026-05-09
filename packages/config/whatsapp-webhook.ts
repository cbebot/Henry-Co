import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Verify a Meta (WhatsApp Business) webhook POST signature.
 *
 * Meta signs every POST body with HMAC-SHA256 keyed on the App Secret and
 * delivers the result in `X-Hub-Signature-256` as `sha256=<hex>`. The webhook
 * receiver must:
 *
 *   1. Read the raw request body (NOT the parsed JSON — whitespace matters).
 *   2. Compute HMAC-SHA256(rawBody, APP_SECRET).
 *   3. Compare in constant time against the header value.
 *
 * If APP_SECRET is unset, the route MUST fail closed (reject the call rather
 * than allow it through). This is the behaviour the V5-3 deep-sweep B1
 * finding required across the three webhook routes (apps/care, apps/property,
 * apps/studio).
 *
 * Usage in a Next.js route handler:
 *
 *   const raw = await request.text();
 *   const verdict = verifyWhatsAppSignature({
 *     rawBody: raw,
 *     header: request.headers.get("x-hub-signature-256"),
 *     appSecret: process.env.WHATSAPP_APP_SECRET,
 *   });
 *   if (!verdict.valid) return NextResponse.json({ error: verdict.reason }, { status: 401 });
 *   const body = JSON.parse(raw);
 *   …
 */

export type WhatsAppSignatureVerdict =
  | { valid: true }
  | { valid: false; reason: WhatsAppSignatureFailureReason };

export type WhatsAppSignatureFailureReason =
  | "missing_app_secret"
  | "missing_header"
  | "malformed_header"
  | "signature_mismatch";

export type WhatsAppSignatureVerifyArgs = {
  rawBody: string;
  header: string | null | undefined;
  appSecret: string | null | undefined;
};

export function verifyWhatsAppSignature(
  args: WhatsAppSignatureVerifyArgs,
): WhatsAppSignatureVerdict {
  const { rawBody, header, appSecret } = args;

  if (!appSecret || appSecret.length === 0) {
    return { valid: false, reason: "missing_app_secret" };
  }

  if (!header || typeof header !== "string") {
    return { valid: false, reason: "missing_header" };
  }

  const trimmed = header.trim();
  if (!trimmed.startsWith("sha256=")) {
    return { valid: false, reason: "malformed_header" };
  }

  const provided = trimmed.slice("sha256=".length);
  if (!/^[0-9a-fA-F]{64}$/.test(provided)) {
    return { valid: false, reason: "malformed_header" };
  }

  const expected = createHmac("sha256", appSecret)
    .update(rawBody, "utf8")
    .digest("hex");

  // Compare in constant time. Both sides must be the same length;
  // we already pinned `provided` to 64 hex chars and the digest is 64.
  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(provided.toLowerCase(), "hex");
  if (a.length !== b.length) {
    return { valid: false, reason: "signature_mismatch" };
  }

  try {
    if (timingSafeEqual(a, b)) {
      return { valid: true };
    }
  } catch {
    // timingSafeEqual throws if the buffers differ in length; we already
    // guarded against that, but be defensive.
  }
  return { valid: false, reason: "signature_mismatch" };
}

/**
 * Convenience wrapper that turns the verdict into the (status, body) pair a
 * Next.js webhook route would return on failure.
 */
export function whatsAppFailureResponseInit(
  reason: WhatsAppSignatureFailureReason,
): { status: number; body: { error: string } } {
  // 401 for any signing failure — Meta will retry, which is what we want
  // for transient header-shape oddities and what we don't mind for genuine
  // attackers (they get the same response either way).
  return {
    status: 401,
    body: {
      error:
        reason === "missing_app_secret"
          ? "Webhook receiver is not configured."
          : "Invalid webhook signature.",
    },
  };
}
