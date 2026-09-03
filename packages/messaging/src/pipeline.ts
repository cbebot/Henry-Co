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
  | { ok: false; reason: "contact_blocked" };

export async function sendMessage(
  input: { conversationId: string; senderId: string; senderRole: string; body: string; attachments?: string[] },
  deps: SendDeps,
): Promise<SendResult> {
  const check = (deps.safety ?? contactSafety)(input.body);

  if (check.action === "block") {
    // Return only the stable reason code; the rendering surface owns the localized
    // copy (Pattern A typed copy) — no user-facing English string in this shared package.
    return { ok: false, reason: "contact_blocked" };
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
      // Best-effort: the message is already persisted (the source of truth). A
      // failing downstream notification (the host `notify` is publishNotification,
      // itself best-effort) must NEVER reject an already-committed send — that would
      // make a caller retry and write a duplicate. Swallow + log per recipient so one
      // bad recipient can't starve the others, and always resolve {ok:true}.
      try {
        await deps.notify({ recipientUserId: r.userId, conversationId: input.conversationId });
      } catch (err) {
        console.warn("sendMessage: notify failed (message already persisted)", {
          recipientUserId: r.userId,
          conversationId: input.conversationId,
          err,
        });
      }
    }
  }

  return { ok: true, message };
}
