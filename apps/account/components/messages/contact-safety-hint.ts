import { contactSafety } from "@henryco/contact-safety";
import type { MessagingCopy } from "@henryco/i18n";

export function contactSafetyHintState(
  text: string,
  copy: MessagingCopy["contactSafety"],
): { show: boolean; tone: "block" | "mask"; title: string; body: string } | null {
  const verdict = contactSafety(text);
  if (verdict.action === "allow") return null;
  if (verdict.action === "block") {
    return { show: true, tone: "block", title: copy.blockedTitle, body: copy.blockedBody };
  }
  return { show: true, tone: "mask", title: copy.maskedTitle, body: copy.maskedBody };
}
