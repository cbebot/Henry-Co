import { contactSafety } from "@henryco/contact-safety";

export function screenReplyBody(text: string): { action: "allow" | "mask" | "block"; body: string } {
  const verdict = contactSafety(text);
  if (verdict.action === "block") return { action: "block", body: text };
  if (verdict.action === "mask") return { action: "mask", body: verdict.maskedText };
  return { action: "allow", body: text };
}
