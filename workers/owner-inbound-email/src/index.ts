/**
 * Henry Onyx — owner inbound-email Worker (dependency-free).
 *
 * Cloudflare Email Routing (catch-all on henryonyx.com) delivers EVERY inbound
 * message to this Worker. It stays deliberately tiny: it reads Cloudflare's
 * TRUSTED envelope (from/to) + auth verdict, reads the raw RFC822 message
 * (size-capped), HMAC-signs the bundle, and POSTs it to the app webhook
 * (/api/inbound/email). All MIME parsing + storage happens in the app, behind
 * owner-only RLS. The Worker holds NO database/storage credentials — only the
 * shared HMAC secret + the destination URL.
 *
 * No npm imports / no nodejs_compat — pastes and deploys cleanly in the
 * Cloudflare dashboard. HMAC scheme matches the app verifier:
 *   signature = hex(HMAC_SHA256(secret, `${timestamp}.${body}`))
 *   headers:   x-henry-timestamp, x-henry-signature
 */

export interface Env {
  /** Full URL of the app webhook, e.g. https://hq.henryonyx.com/api/inbound/email */
  INBOUND_WEBHOOK_URL: string;
  /** Shared secret; set via `wrangler secret put` or the dashboard. */
  INBOUND_EMAIL_WEBHOOK_SECRET: string;
  /** Max raw bytes to forward (keeps the POST under the app's body limit). */
  MAX_RAW_BYTES?: string;
}

const DEFAULT_MAX_RAW_BYTES = 2_500_000;

async function hmacHex(secret: string, data: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + 0x8000)));
  }
  return btoa(binary);
}

export default {
  async email(message: ForwardableEmailMessage, env: Env): Promise<void> {
    if (!env.INBOUND_WEBHOOK_URL || !env.INBOUND_EMAIL_WEBHOOK_SECRET) {
      throw new Error("owner-inbound-email Worker is not configured (URL/secret missing).");
    }

    const maxBytes = Number(env.MAX_RAW_BYTES) || DEFAULT_MAX_RAW_BYTES;
    const full = new Uint8Array(await new Response(message.raw).arrayBuffer());
    const truncated = full.length > maxBytes;
    const bytes = truncated ? full.subarray(0, maxBytes) : full;

    const payload = {
      envelopeFrom: message.from || null,
      envelopeTo: message.to || null,
      // TRUSTED Cloudflare verdict (prepended at the MX) — not the forgeable body.
      authResults: message.headers.get("authentication-results") || null,
      rawBase64: toBase64(bytes),
      rawSize: message.rawSize || full.length,
      truncated,
    };

    const body = JSON.stringify(payload);
    const ts = Math.floor(Date.now() / 1000).toString();
    const signature = await hmacHex(env.INBOUND_EMAIL_WEBHOOK_SECRET, `${ts}.${body}`);

    const res = await fetch(env.INBOUND_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-henry-timestamp": ts,
        "x-henry-signature": signature,
      },
      body,
    });
    // Surface failures in Workers logs; never setReject() (don't bounce senders).
    if (!res.ok) {
      throw new Error(`inbound forward failed: ${res.status}`);
    }
  },
};
