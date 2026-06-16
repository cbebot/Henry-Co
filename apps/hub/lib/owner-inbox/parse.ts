import "server-only";

import PostalMime, { type Email } from "postal-mime";
import { z } from "zod";

import type { InboundAttachment, InboundEmailPayload } from "./payload";

/**
 * Server-side MIME parsing. The Cloudflare Email Worker stays trivial and
 * dependency-free: it forwards the raw RFC822 message (base64, size-capped) plus
 * the TRUSTED Cloudflare envelope + auth verdict. Here in the app (Node) we do
 * the heavy parsing with postal-mime — where it's testable — and build the same
 * InboundEmailPayload the rest of the pipeline already expects.
 *
 * The SPF/DKIM/DMARC verdicts come ONLY from the Worker's `authResults` (read
 * from Cloudflare's receipt-time header), never from the parsed MIME body, which
 * a sender can forge.
 */

export const inboundEnvelopeSchema = z.object({
  envelopeFrom: z.string().nullable().default(null),
  envelopeTo: z.string().nullable().default(null),
  authResults: z.string().nullable().default(null),
  rawBase64: z.string().min(1),
  rawSize: z.number().int().nonnegative().catch(0).default(0),
  truncated: z.boolean().default(false),
});

export type InboundEnvelope = z.infer<typeof inboundEnvelopeSchema>;

export function parseInboundEnvelope(
  raw: unknown,
): { ok: true; envelope: InboundEnvelope } | { ok: false; error: string } {
  const r = inboundEnvelopeSchema.safeParse(raw);
  if (!r.success) {
    return { ok: false, error: r.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ") };
  }
  return { ok: true, envelope: r.data };
}

function readVerdict(authResults: string | null, mechanism: string): string | null {
  if (!authResults) return null;
  // Anchor to a ';'-delimited segment start so an ARC sub-result or comment that
  // embeds e.g. "spf=pass" inside "arc=pass (... spf=pass ...)" cannot win over
  // the authoritative "; spf=none" verdict.
  const m = new RegExp(`(?:^|;)\\s*${mechanism}=([a-zA-Z]+)`).exec(authResults);
  return m ? m[1].toLowerCase() : null;
}

type PMAddress = { address?: string; name?: string; group?: PMAddress[] };

/** Flatten address lists (expanding RFC822 groups), lowercased. */
function collect(list: PMAddress[] | undefined): string[] {
  const out: string[] = [];
  for (const a of list ?? []) {
    if (a.group && a.group.length) {
      for (const g of a.group) if (g.address) out.push(g.address.toLowerCase());
    } else if (a.address) {
      out.push(a.address.toLowerCase());
    }
  }
  return out;
}

/** Total inline attachment budget (base64 chars) — defensive; the Worker already
 *  caps the raw message, so attachments here are small, but we guard anyway. */
const MAX_ATTACH_TOTAL_BASE64 = 3_500_000;

function attachmentBytes(content: unknown): Uint8Array | null {
  if (content instanceof Uint8Array) return content;
  if (content instanceof ArrayBuffer) return new Uint8Array(content);
  if (ArrayBuffer.isView(content)) {
    return new Uint8Array(content.buffer, content.byteOffset, content.byteLength);
  }
  if (typeof content === "string") return new TextEncoder().encode(content);
  return null;
}

/** Parse the raw email and build the canonical InboundEmailPayload. Never throws
 *  — a malformed/truncated message still yields a row from the trusted envelope. */
export async function buildPayloadFromEnvelope(
  envelope: InboundEnvelope,
): Promise<InboundEmailPayload> {
  const rawBytes = new Uint8Array(Buffer.from(envelope.rawBase64, "base64"));

  let email: Email | null = null;
  try {
    email = await new PostalMime().parse(rawBytes);
  } catch {
    email = null; // truncated/garbled — fall back to envelope-only below
  }

  const authResults = envelope.authResults;
  const headers: Record<string, string> = {};
  for (const h of email?.headers ?? []) headers[h.key.toLowerCase()] = h.value;
  // Never let sender-supplied auth headers survive in the forensic blob — replace
  // with Cloudflare's trusted verdict (or drop entirely when it is absent).
  delete headers["authentication-results"];
  delete headers["received-spf"];
  if (authResults) headers["authentication-results"] = authResults;

  let runningB64 = 0;
  let attachmentsTruncated = envelope.truncated;
  const attachments: InboundAttachment[] = [];
  for (const att of email?.attachments ?? []) {
    const bytes = attachmentBytes(att.content as unknown);
    const sizeBytes = bytes?.length ?? 0;
    let contentBase64: string | null = null;
    let captured = false;
    if (bytes && bytes.length > 0) {
      const b64 = Buffer.from(bytes).toString("base64");
      if (runningB64 + b64.length <= MAX_ATTACH_TOTAL_BASE64) {
        contentBase64 = b64;
        captured = true;
        runningB64 += b64.length;
      } else {
        attachmentsTruncated = true;
      }
    }
    attachments.push({
      filename: att.filename || "attachment",
      contentType: att.mimeType ?? null,
      sizeBytes,
      isInline: att.disposition === "inline" || Boolean(att.related),
      contentId: att.contentId ?? null,
      contentBase64,
      captured,
    });
  }

  // A truncated raw message may have cut the final attachment's bytes — don't
  // present it as a complete capture.
  if (envelope.truncated && attachments.length > 0) {
    const last = attachments[attachments.length - 1];
    if (last.captured) {
      last.captured = false;
      last.contentBase64 = null;
    }
    attachmentsTruncated = true;
  }

  const from = email?.from ?? null;

  return {
    messageId: email?.messageId ?? null,
    toAddress: envelope.envelopeTo ?? collect(email?.to)[0] ?? null,
    envelopeFrom: envelope.envelopeFrom,
    headerTo: collect(email?.to)[0] ?? null,
    fromAddress: from?.address?.toLowerCase() ?? envelope.envelopeFrom ?? null,
    fromName: from?.name || null,
    replyTo: collect(email?.replyTo)[0] ?? null,
    cc: collect(email?.cc),
    subject: email?.subject || "(no subject)",
    text: email?.text ?? null,
    html: email?.html ?? null,
    date: email?.date ?? null,
    sizeBytes: envelope.rawSize || rawBytes.length,
    authResults,
    spf: readVerdict(authResults, "spf"),
    dkim: readVerdict(authResults, "dkim"),
    dmarc: readVerdict(authResults, "dmarc"),
    attachments,
    attachmentsTruncated,
    headers,
  };
}
