/**
 * @henryco/chat-thread — one shared full-viewport chat screen.
 *
 * Consumers: account /support/[threadId] (support variant) and studio
 * /request/copilot (assistant variant). The embedded-card thread widget for
 * other divisions remains @henryco/messaging-thread.
 */

export { ChatThread } from "./chat-thread";
export type {
  ChatThreadProps,
  ChatThreadHeaderProps,
  ChatThreadComposerOptions,
  ChatThreadSuggestion,
} from "./chat-thread";

export { useThreadRealtime } from "./use-thread-realtime";
export type {
  ThreadRealtimeStatus,
  UseThreadRealtimeOptions,
} from "./use-thread-realtime";

export { fromThreadMessage } from "./from-thread-message";

export { buildThreadView, GROUP_WINDOW_MS } from "./grouping";
export type { ThreadViewItem, DayLabel, BuildThreadViewOptions } from "./grouping";

export {
  emptyOutbox,
  mergeOutbox,
  outboxAck,
  outboxAppend,
  outboxFail,
  outboxRetry,
} from "./outbox";
export type { OutboxEntry, OutboxState } from "./outbox";

export {
  FOLLOW_THRESHOLD_PX,
  initialFollow,
  isNearBottom,
  onIncoming,
  onScrollPosition,
} from "./follow";
export type { FollowState } from "./follow";

export type {
  ChatAttachment,
  ChatAuthorRole,
  ChatDeliveryState,
  ChatSendPayload,
  ChatSendResult,
  ChatThreadLabels,
  ChatThreadMessage,
} from "./types";
export { DEFAULT_CHAT_THREAD_LABELS } from "./types";
