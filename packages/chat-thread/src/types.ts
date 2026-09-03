/**
 * @henryco/chat-thread — shared full-viewport chat screen.
 *
 * Message + label contracts. This package is deliberately i18n-agnostic:
 * every user-visible string is an injectable label with an English default
 * (same hard boundary as @henryco/messaging-thread). Hosts localize via
 * buildChatThreadLabels(t) in @henryco/i18n.
 */

export type ChatAttachment = {
  url: string;
  name: string;
  type: string;
  size?: number;
  /** Intrinsic dimensions when known — used for the fixed aspect-ratio box. */
  width?: number;
  height?: number;
};

export type ChatDeliveryState = "sending" | "sent" | "delivered" | "read" | "failed";

export type ChatAuthorRole = "viewer" | "other" | "system";

export type ChatThreadMessage = {
  id: string;
  authorId: string | null;
  authorName?: string;
  authorRole: ChatAuthorRole;
  body: string;
  /** ISO timestamp. */
  createdAt: string;
  attachments?: ChatAttachment[];
  deliveryState?: ChatDeliveryState | null;
  /** Localized failure reason rendered on the bubble when deliveryState === "failed". */
  failReason?: string | null;
};

export type ChatSendPayload = { body: string; attachments?: ChatAttachment[] };

export type ChatSendResult =
  | { ok: true; message?: ChatThreadMessage }
  | { ok: false; reason?: string };

export type ChatThreadLabels = {
  newMessages?: string;
  retry?: string;
  sending?: string;
  sent?: string;
  delivered?: string;
  read?: string;
  typing?: string;
  today?: string;
  yesterday?: string;
  back?: string;
  live?: string;
  reconnecting?: string;
  systemName?: string;
};

export const DEFAULT_CHAT_THREAD_LABELS: Required<ChatThreadLabels> = {
  newMessages: "New messages",
  retry: "Didn't send — tap to retry",
  sending: "Sending…",
  sent: "Sent",
  delivered: "Delivered",
  read: "Read",
  typing: "Typing…",
  today: "Today",
  yesterday: "Yesterday",
  back: "Back",
  live: "Live",
  reconnecting: "Reconnecting…",
  systemName: "System",
};
