// ---------------------------------------------------------------------------
// snapshot.ts — PII-redacted content snapshot for the moderation_decisions ledger
//
// The snapshot is a training/audit artifact, so it must carry NO raw PII. Two
// layers, because @henryco/observability defaultRedactor is KEY-BASED (it
// redacts values under known keys; it does NOT scan free text):
//   1. mask phone/email (trust sanitizeForDisplay) + street addresses in the
//      free-text body BEFORE it ever enters the snapshot object;
//   2. run defaultRedactor over the whole object to catch any keyed PII.
// Pure + client-safe (no server-only imports).
// ---------------------------------------------------------------------------

import { sanitizeForDisplay } from "@henryco/trust/detect";
import { defaultRedactor } from "@henryco/observability/redaction";
import type { ModerationInput } from "./types";

const ADDRESS_RE =
  /\b\d{1,5}[a-z]?\s+([a-z]+\s+){0,3}(street|st\.?|road|rd\.?|avenue|ave\.?|close|crescent|drive|dr\.?|lane|ln\.?|boulevard|blvd\.?|way|estate)\b/gi;

/** Mask phone, email and street addresses in free text. */
export function maskPii(text: string): string {
  if (!text) return "";
  const masked = sanitizeForDisplay(text); // phone (last 4) + email (first 2 + ***)
  return masked.replace(ADDRESS_RE, "[address]");
}

/**
 * Build the PII-redacted snapshot stored in moderation_decisions.content_snapshot.
 * Never contains raw phone/email/address or keyed PII.
 */
export function buildContentSnapshot(input: ModerationInput): Record<string, unknown> {
  const snapshot = {
    contentType: input.contentType,
    contentId: input.contentId,
    locale: input.locale,
    text: maskPii(input.text ?? ""),
    imageCount: input.imageUrls?.length ?? 0,
    actorRef: input.actorId ?? null,
  };
  return defaultRedactor(snapshot) as Record<string, unknown>;
}
