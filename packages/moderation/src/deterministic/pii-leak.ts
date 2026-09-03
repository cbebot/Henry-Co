// ---------------------------------------------------------------------------
// deterministic/pii-leak.ts — PII / off-platform-contact leak detection
//
// Sellers must route contact through platform messaging, not raw listing text.
// A phone / email / street address embedded in a PUBLIC body is a leak — and
// also an off-platform-contact attempt. Both are `hold` (human review), never
// an automated reject: there are legitimate reasons a body mentions an address
// (e.g. "near Yaba"), so a human confirms.
//
// Composes @henryco/trust's detectOffPlatformContact (social handles, messaging
// apps, meeting links, QR bypass) rather than duplicating those patterns.
// ---------------------------------------------------------------------------

import { detectOffPlatformContact } from "@henryco/trust/detect";
import type { DetectorVerdict, ModerationReason } from "../types";

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;

// Phone: a +country-code form, or a 10-15 digit run allowing common separators.
// Stricter than a bare digit run so listing prices/SKUs don't false-positive.
const PHONE_INTL_RE = /\+\d{1,3}[\s.-]?\(?\d{2,4}\)?(?:[\s.-]?\d{2,4}){2,4}/;
const PHONE_LOCAL_RE = /(?<!\d)(?:\d[\s.-]?){10,15}(?!\d)/;
// Nigerian mobile (0[789][01]xxxxxxxx) is the dominant local form.
const PHONE_NG_RE = /(?<!\d)0[789][01]\d{8}(?!\d)/;

// Street address: a house number followed by a street-type word.
const ADDRESS_RE =
  /\b\d{1,5}[a-z]?\s+([a-z]+\s+){0,3}(street|st\.?|road|rd\.?|avenue|ave\.?|close|crescent|drive|dr\.?|lane|ln\.?|boulevard|blvd\.?|way|estate)\b/i;

function digitCount(s: string): number {
  return (s.match(/\d/g) ?? []).length;
}

/**
 * Detect PII / off-platform-contact leaks in a public body.
 * Pure + deterministic. Returns `hold` on any signal; never auto-rejects.
 */
export function detectPiiLeak(text: string, _locale = "en"): DetectorVerdict {
  const body = text || "";
  const reasons = new Set<ModerationReason>();
  const detail: string[] = [];

  if (EMAIL_RE.test(body)) {
    reasons.add("pii_leak");
    detail.push("email");
  }

  const phoneMatch = body.match(PHONE_NG_RE) ?? body.match(PHONE_INTL_RE) ?? body.match(PHONE_LOCAL_RE);
  if (phoneMatch && digitCount(phoneMatch[0]) >= 10) {
    reasons.add("pii_leak");
    detail.push("phone");
  }

  if (ADDRESS_RE.test(body)) {
    reasons.add("pii_leak");
    detail.push("address");
  }

  const offPlatform = detectOffPlatformContact(body);
  if (offPlatform.detected) {
    reasons.add("off_platform_contact");
    detail.push("off_platform");
  }

  if (reasons.size === 0) {
    return { decision: "approve", reasons: [], severity: "low", unambiguous: false, detail: [] };
  }

  return {
    decision: "hold",
    reasons: [...reasons],
    severity: "medium",
    unambiguous: false,
    detail,
  };
}
