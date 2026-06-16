/**
 * Inbound-email payload contract (what the Cloudflare Worker POSTs) + mapping
 * to a received_emails insert row. Pure module (zod + node:crypto only) — the
 * webhook validates with `parseInboundPayload` and never trusts raw input.
 */
import crypto from "node:crypto";
import { z } from "zod";
import { buildSnippet, sanitizeEmailHtml } from "./sanitize";

export const inboundAttachmentSchema = z.object({
  filename: z.string().default("attachment"),
  contentType: z.string().nullable().default(null),
  sizeBytes: z.number().int().nonnegative().catch(0).default(0),
  isInline: z.boolean().default(false),
  contentId: z.string().nullable().default(null),
  contentBase64: z.string().nullable().default(null),
  captured: z.boolean().default(false),
});

export const inboundEmailPayloadSchema = z.object({
  messageId: z.string().nullable().default(null),
  toAddress: z.string().nullable().default(null),
  envelopeFrom: z.string().nullable().default(null),
  headerTo: z.string().nullable().default(null),
  fromAddress: z.string().nullable().default(null),
  fromName: z.string().nullable().default(null),
  replyTo: z.string().nullable().default(null),
  cc: z.array(z.string()).default([]),
  subject: z.string().default("(no subject)"),
  text: z.string().nullable().default(null),
  html: z.string().nullable().default(null),
  date: z.string().nullable().default(null),
  sizeBytes: z.number().int().nonnegative().catch(0).default(0),
  authResults: z.string().nullable().default(null),
  spf: z.string().nullable().default(null),
  dkim: z.string().nullable().default(null),
  dmarc: z.string().nullable().default(null),
  attachments: z.array(inboundAttachmentSchema).default([]),
  attachmentsTruncated: z.boolean().default(false),
  headers: z.record(z.string(), z.string()).default({}),
});

export type InboundEmailPayload = z.infer<typeof inboundEmailPayloadSchema>;
export type InboundAttachment = z.infer<typeof inboundAttachmentSchema>;

export function normalizeAddress(value: string | null | undefined): string | null {
  const raw = String(value ?? "").trim().toLowerCase();
  return raw ? raw : null;
}

export function parseInboundPayload(
  raw: unknown,
): { ok: true; payload: InboundEmailPayload } | { ok: false; error: string } {
  const result = inboundEmailPayloadSchema.safeParse(raw);
  if (!result.success) {
    return {
      ok: false,
      error: result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "),
    };
  }
  const p = result.data;
  // Never store a junk row: require a sender and a destination address.
  if (!normalizeAddress(p.fromAddress) || !normalizeAddress(p.toAddress ?? p.headerTo)) {
    return { ok: false, error: "missing from/to address" };
  }
  return { ok: true, payload: p };
}

/** Idempotency key: RFC822 Message-ID when present, else a content hash. */
export function computeDedupeKey(payload: InboundEmailPayload): string {
  const mid = String(payload.messageId ?? "").trim();
  if (mid) return `mid:${mid}`.slice(0, 500);
  const basis = [
    normalizeAddress(payload.fromAddress) ?? "",
    normalizeAddress(payload.toAddress ?? payload.headerTo) ?? "",
    payload.subject ?? "",
    payload.date ?? "",
    String(payload.sizeBytes ?? 0),
    // Body prefix adds entropy so two distinct messages with identical metadata
    // (same sender/recipient/subject/second/size) do not collide and drop one.
    (payload.text ?? payload.html ?? "").slice(0, 512),
  ].join("|");
  return `hash:${crypto.createHash("sha256").update(basis).digest("hex")}`;
}

export type ReceivedEmailInsert = {
  dedupe_key: string;
  message_id: string | null;
  to_address: string;
  envelope_to: string | null;
  from_address: string;
  from_name: string | null;
  reply_to: string | null;
  cc_addresses: string[];
  subject: string;
  text_body: string | null;
  html_body: string | null;
  snippet: string;
  spf: string | null;
  dkim: string | null;
  dmarc: string | null;
  spam_verdict: string | null;
  is_spam: boolean;
  headers: Record<string, string>;
  size_bytes: number;
  has_attachments: boolean;
  attachment_count: number;
  attachments_truncated: boolean;
  sent_at: string | null;
  received_at: string;
};

function parseDate(value: string | null): string | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export function buildEmailInsert(payload: InboundEmailPayload, nowIso: string): ReceivedEmailInsert {
  const to = normalizeAddress(payload.toAddress ?? payload.headerTo)!;
  const from = normalizeAddress(payload.fromAddress)!;
  const sanitizedHtml = sanitizeEmailHtml(payload.html);
  // Spoof heuristic (surfaced, not hidden): DMARC fail, hard SPF fail, or a DKIM
  // failure without a compensating SPF pass. Verdicts originate from Cloudflare's
  // trusted receipt-time header (the Worker reads message.headers, not the body).
  const dmarc = (payload.dmarc ?? "").toLowerCase();
  const spf = (payload.spf ?? "").toLowerCase();
  const dkim = (payload.dkim ?? "").toLowerCase();
  const isSpam = dmarc === "fail" || spf === "fail" || (dkim === "fail" && spf !== "pass");
  return {
    dedupe_key: computeDedupeKey(payload),
    message_id: payload.messageId ?? null,
    to_address: to,
    envelope_to: normalizeAddress(payload.toAddress),
    from_address: from,
    from_name: payload.fromName ?? null,
    reply_to: normalizeAddress(payload.replyTo),
    cc_addresses: payload.cc.map((c) => c.toLowerCase()).filter(Boolean),
    subject: payload.subject || "(no subject)",
    text_body: payload.text ?? null,
    html_body: sanitizedHtml || null,
    snippet: buildSnippet(payload.text, sanitizedHtml || payload.html),
    spf: payload.spf,
    dkim: payload.dkim,
    dmarc: payload.dmarc,
    spam_verdict: payload.authResults,
    is_spam: isSpam,
    headers: payload.headers,
    size_bytes: payload.sizeBytes,
    has_attachments: payload.attachments.length > 0,
    attachment_count: payload.attachments.length,
    attachments_truncated:
      payload.attachmentsTruncated || payload.attachments.some((a) => !a.captured),
    sent_at: parseDate(payload.date),
    received_at: nowIso,
  };
}
