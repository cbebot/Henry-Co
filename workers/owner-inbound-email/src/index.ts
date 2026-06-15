/**
 * Henry Onyx — owner inbound-email Worker.
 *
 * Cloudflare Email Routing (catch-all rule on henryonyx.com) delivers EVERY
 * inbound message — support@, contact@, owner@, hello@, accounts@, and even
 * typo'd local-parts — to this Worker's `email()` handler. The Worker:
 *   1. parses the MIME message (postal-mime),
 *   2. caps large attachments so the forward stays within the app's body limit,
 *   3. HMAC-signs a JSON payload with a shared secret, and
 *   4. POSTs it to the Next.js webhook (/api/inbound/email) on the hub app.
 *
 * The Worker holds NO database or storage credentials — only the shared HMAC
 * secret and the destination URL. All privileged storage (Supabase + private
 * attachment bucket) happens inside the app, behind owner-only RLS.
 *
 * The HMAC scheme is byte-compatible with the app webhook's verifier:
 *   signature = hex(HMAC_SHA256(secret, `${timestamp}.${body}`))
 *   headers:   x-henry-timestamp, x-henry-signature
 * (mirrors apps/account/app/api/webhooks/account/route.ts).
 */

import PostalMime, { type Email, type Address } from "postal-mime";

export interface Env {
  /** Full URL of the app webhook, e.g. https://hub.henryonyx.com/api/inbound/email */
  INBOUND_WEBHOOK_URL: string;
  /** Shared secret; set via `wrangler secret put INBOUND_EMAIL_WEBHOOK_SECRET`. */
  INBOUND_EMAIL_WEBHOOK_SECRET: string;
  /**
   * Max total base64 bytes of attachments to forward inline. Larger attachments
   * are recorded as metadata-only (captured:false) so nothing is silently
   * dropped. Default 3_500_000 (~3.5 MB) keeps the POST under the typical
   * 4.5 MB serverless body limit after JSON + header overhead.
   */
  MAX_INLINE_BASE64_BYTES?: string;
}

interface OutboundAttachment {
  filename: string;
  contentType: string | null;
  sizeBytes: number;
  isInline: boolean;
  contentId: string | null;
  /** base64 of the raw bytes, or null when too large to forward inline. */
  contentBase64: string | null;
  captured: boolean;
}

interface OutboundPayload {
  messageId: string | null;
  toAddress: string | null; // envelope RCPT TO — the address the catch-all matched
  envelopeFrom: string | null; // envelope MAIL FROM
  headerTo: string | null;
  fromAddress: string | null;
  fromName: string | null;
  replyTo: string | null;
  cc: string[];
  subject: string;
  text: string | null;
  html: string | null;
  date: string | null;
  sizeBytes: number;
  authResults: string | null;
  spf: string | null;
  dkim: string | null;
  dmarc: string | null;
  attachments: OutboundAttachment[];
  attachmentsTruncated: boolean;
  headers: Record<string, string>;
}

const DEFAULT_MAX_INLINE_BASE64 = 3_500_000;
const MAX_RETRIES = 3;

function firstAddress(list: Address[] | undefined): Address | null {
  if (!list || list.length === 0) return null;
  return list[0] ?? null;
}

/** Flatten address lists, expanding RFC822 group syntax to its members. */
function collectAddresses(list: Address[] | undefined): string[] {
  const out: string[] = [];
  for (const a of list ?? []) {
    if (a.group && a.group.length) {
      for (const g of a.group) if (g.address) out.push(g.address);
    } else if (a.address) {
      out.push(a.address);
    }
  }
  return out;
}

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

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

/** Extract a single mechanism verdict (spf/dkim/dmarc) from Authentication-Results. */
function readVerdict(authResults: string | null, mechanism: string): string | null {
  if (!authResults) return null;
  const m = new RegExp(`${mechanism}=([a-zA-Z]+)`).exec(authResults);
  return m ? m[1].toLowerCase() : null;
}

function buildPayload(
  email: Email,
  message: ForwardableEmailMessage,
  maxInlineBase64: number,
): OutboundPayload {
  const headers: Record<string, string> = {};
  for (const h of email.headers ?? []) {
    // Forensic context only — sender-supplied MIME headers are NOT trusted.
    headers[h.key.toLowerCase()] = h.value;
  }
  // SPF/DKIM/DMARC verdicts MUST come from Cloudflare's receipt-time header
  // (prepended at the MX, topmost, unforgeable) — NEVER the parsed MIME body,
  // where a spoofer can inject a fake "spf=pass; dkim=pass; dmarc=pass".
  const authResults = message.headers.get("authentication-results");
  if (authResults) headers["authentication-results"] = authResults;

  const from = email.from ?? null;
  const replyTo = firstAddress(email.replyTo);
  const headerTo = collectAddresses(email.to)[0] ?? null;

  let runningBase64 = 0;
  let attachmentsTruncated = false;
  const attachments: OutboundAttachment[] = (email.attachments ?? []).map((att) => {
    const content: unknown = att.content;
    const bytes: Uint8Array | null =
      content instanceof Uint8Array
        ? content
        : content instanceof ArrayBuffer
          ? new Uint8Array(content)
          : ArrayBuffer.isView(content)
            ? new Uint8Array(content.buffer, content.byteOffset, content.byteLength)
            : typeof content === "string"
              ? new TextEncoder().encode(content)
              : null;
    const sizeBytes = bytes ? bytes.byteLength : 0;
    let contentBase64: string | null = null;
    let captured = false;
    if (bytes) {
      const b64 = toBase64(bytes);
      if (runningBase64 + b64.length <= maxInlineBase64) {
        contentBase64 = b64;
        captured = true;
        runningBase64 += b64.length;
      } else {
        attachmentsTruncated = true;
      }
    }
    return {
      filename: att.filename || "attachment",
      contentType: att.mimeType ?? null,
      sizeBytes,
      isInline: att.disposition === "inline" || Boolean(att.related),
      contentId: att.contentId ?? null,
      contentBase64,
      captured,
    };
  });

  return {
    messageId: email.messageId ?? null,
    // Envelope RCPT TO is the address the catch-all actually matched. This is
    // the source of truth for "which brand address received this".
    toAddress: message.to ?? headerTo ?? null,
    envelopeFrom: message.from ?? null,
    headerTo: headerTo ?? null,
    fromAddress: from?.address ?? message.from ?? null,
    fromName: from?.name || null,
    replyTo: replyTo?.address ?? null,
    cc: collectAddresses(email.cc),
    subject: email.subject || "(no subject)",
    text: email.text ?? null,
    html: email.html ?? null,
    date: email.date ?? null,
    sizeBytes: message.rawSize ?? 0,
    authResults,
    spf: readVerdict(authResults, "spf"),
    dkim: readVerdict(authResults, "dkim"),
    dmarc: readVerdict(authResults, "dmarc"),
    attachments,
    attachmentsTruncated,
    headers,
  };
}

async function forwardToApp(env: Env, payload: OutboundPayload): Promise<void> {
  const body = JSON.stringify(payload);
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = await hmacHex(env.INBOUND_EMAIL_WEBHOOK_SECRET, `${timestamp}.${body}`);

  let lastError: unknown = null;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(env.INBOUND_WEBHOOK_URL, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-henry-timestamp": timestamp,
          "x-henry-signature": signature,
          "user-agent": "henry-onyx-inbound-email-worker/1",
        },
        body,
      });
      if (res.ok) return;
      // 4xx (bad signature / malformed) won't improve on retry — stop early.
      if (res.status >= 400 && res.status < 500) {
        throw new Error(`webhook rejected: ${res.status} ${await res.text().catch(() => "")}`);
      }
      lastError = new Error(`webhook ${res.status}`);
    } catch (err) {
      lastError = err;
    }
    // brief backoff before retry
    if (attempt < MAX_RETRIES) {
      await new Promise((r) => setTimeout(r, 250 * attempt));
    }
  }
  // Surface the failure in Workers logs. We deliberately do NOT setReject() —
  // bouncing the sender is worse than a logged, retryable capture failure.
  throw new Error(`inbound-email forward failed after ${MAX_RETRIES} attempts: ${String(lastError)}`);
}

export default {
  async email(message: ForwardableEmailMessage, env: Env, ctx: ExecutionContext): Promise<void> {
    if (!env.INBOUND_WEBHOOK_URL || !env.INBOUND_EMAIL_WEBHOOK_SECRET) {
      throw new Error("owner-inbound-email Worker is not configured (URL/secret missing).");
    }
    const maxInline = Number(env.MAX_INLINE_BASE64_BYTES) || DEFAULT_MAX_INLINE_BASE64;

    // Read the raw message once into an ArrayBuffer (also lets us size it).
    const raw = await new Response(message.raw).arrayBuffer();
    const email = await new PostalMime().parse(raw);
    const payload = buildPayload(email, message, maxInline);

    // Run the forward to completion even though the handler returns; if it
    // throws it is logged by the Workers runtime.
    await forwardToApp(env, payload);
  },
};
