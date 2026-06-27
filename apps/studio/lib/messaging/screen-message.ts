import { contactSafety } from "@henryco/contact-safety";

/**
 * Screens a user message body before it is persisted to studio_project_messages.
 * High/critical off-platform contact (phone, email) is blocked; medium (handles,
 * links) is masked; clean text passes through. Shared by both studio send paths
 * (lib/messaging/mutations.ts and lib/portal/actions.ts).
 */
export function screenMessageBody(text: string): { action: "allow" | "mask" | "block"; body: string } {
  const verdict = contactSafety(text);
  if (verdict.action === "block") return { action: "block", body: text };
  if (verdict.action === "mask") return { action: "mask", body: verdict.maskedText };
  return { action: "allow", body: text };
}
