import type { MessagingAdapter } from "./adapter";
import type { Message } from "./types";
import { contactSafety } from "@henryco/contact-safety";

export interface SendDeps {
  adapter: MessagingAdapter;
  notify?: (n: { recipientUserId: string; conversationId: string }) => Promise<void>;
  safety?: (text: string) => { action: "allow" | "mask" | "block"; maskedText: string; severity: string };
}

export type SendResult =
  | { ok: true; message: Message }
  | { ok: false; reason: "contact_blocked"; rewritePrompt: string };

const REWRITE_PROMPT =
  "Keep it on Henry Onyx — you're protected here. Please remove phone numbers, emails, links, or off-platform contact and try again.";

export async function sendMessage(
  input: { conversationId: string; senderId: string; senderRole: string; body: string; attachments?: string[] },
  deps: SendDeps,
): Promise<SendResult> {
  const check = (deps.safety ?? contactSafety)(input.body);

  if (check.action === "block") {
    return { ok: false, reason: "contact_blocked", rewritePrompt: REWRITE_PROMPT };
  }

  const body = check.action === "mask" ? check.maskedText : input.body;

  const message = await deps.adapter.persistMessage({
    conversationId: input.conversationId,
    senderId: input.senderId,
    senderRole: input.senderRole,
    body,
    attachments: input.attachments ?? [],
    safetySeverity: check.severity,
  });

  if (deps.notify) {
    const participants = await deps.adapter.getParticipants(input.conversationId);
    const recipients = participants.filter((p) => p.userId !== input.senderId); // stable FK, never sender
    for (const r of recipients) {
      await deps.notify({ recipientUserId: r.userId, conversationId: input.conversationId });
    }
  }

  return { ok: true, message };
}
