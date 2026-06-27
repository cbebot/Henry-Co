import { contactSafety } from "@henryco/contact-safety";

/**
 * Screens a candidate<->employer message body before it is persisted to
 * jobs_messages. High/critical off-platform contact (phone, email,
 * payout-diversion, "talk outside the platform") is blocked and never written;
 * medium signals (handles, links, messaging-app names) are masked; clean text
 * passes through unchanged.
 *
 * Mirrors apps/marketplace/lib/messaging/screen-message.ts and
 * apps/studio/lib/messaging/screen-message.ts exactly so every division shares
 * one classifier and one block/mask contract. Direction is irrelevant — the
 * same screen runs whether the sender is the candidate or the employer, so
 * neither side can leak contact details to the other. Jobs is NOT
 * identity-minimized (names are legitimately visible in a hiring conversation),
 * but contact details must still stay inside Henry & Co.
 */
export function screenMessageBody(text: string): { action: "allow" | "mask" | "block"; body: string } {
  const verdict = contactSafety(text);
  if (verdict.action === "block") return { action: "block", body: text };
  if (verdict.action === "mask") return { action: "mask", body: verdict.maskedText };
  return { action: "allow", body: text };
}

/**
 * Bound a message body before it is screened + persisted. A regex-screened,
 * re-masked-on-every-read body is a CPU/storage abuse vector if unbounded, so
 * every send path clamps to the same ceiling the other divisions use (8000
 * chars). CRLF is normalized so the limit is content-based, not
 * line-ending-inflated.
 */
export function clipBody(text: string): string {
  return String(text || "").replace(/\r\n/g, "\n").slice(0, 8000);
}
