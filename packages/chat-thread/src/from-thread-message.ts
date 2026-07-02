import type { ThreadMessage } from "@henryco/messaging-thread/types";
import type { ChatDeliveryState, ChatThreadMessage } from "./types";

/**
 * Adapt @henryco/messaging-thread's `ThreadMessage` (what existing adapters'
 * `rowToMessage` produce) to the ChatThread shape, so hosts migrating off
 * `MessageThread` keep their adapters unchanged.
 */
export function fromThreadMessage(message: ThreadMessage): ChatThreadMessage {
  const role =
    message.senderRole === "viewer"
      ? "viewer"
      : message.senderRole === "system"
        ? "system"
        : "other";

  let deliveryState: ChatDeliveryState | null = null;
  if (role === "viewer") {
    if (message.deliveryState === "failed") deliveryState = "failed";
    else if (message.deliveryState === "seen" || message.readAt) deliveryState = "read";
    else if (message.deliveryState === "delivered" || message.deliveredAt)
      deliveryState = "delivered";
    else deliveryState = "sent";
  }

  return {
    id: message.id,
    authorId: message.senderId,
    authorName: message.senderName,
    authorRole: role,
    body: message.body,
    createdAt: message.createdAt,
    attachments: message.attachments?.map((attachment) => ({
      url: attachment.url,
      name: attachment.name,
      type: attachment.type,
      size: attachment.size ?? undefined,
    })),
    deliveryState,
  };
}
