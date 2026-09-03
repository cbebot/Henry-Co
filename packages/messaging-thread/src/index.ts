/**
 * @henryco/messaging-thread — shared message thread renderer.
 *
 * Audience-agnostic: hosts plug in via `MessageThreadAdapter` (table,
 * channel name, row mapper, server actions). The engine owns rendering,
 * optimistic state, scroll, and the realtime subscription.
 *
 * First consumer: studio /client/projects/[id] messages tab.
 * Future consumers: jobs candidate-recruiter messaging, care customer
 * threads, marketplace seller chat, learn instructor-learner Q&A.
 */

export { MessageThread } from "./thread";
export {
  ThreadAppearanceProvider,
  useThreadAppearance,
} from "./appearance";
export { ThreadCustomizationMenu } from "./customization";
export type { ThreadCustomizationMenuLabels } from "./customization";
export { ThreadParticipantsStrip } from "./participants";
export type { ThreadParticipant } from "./participants";

export type {
  ThreadAppearance,
  ThreadFontSize,
  ThreadDensity,
  ThreadSurfaceTone,
} from "./appearance";
export type {
  ThreadMessage,
  ThreadAttachment,
  ThreadViewer,
  ThreadSendResult,
  ThreadAttachmentUploadResult,
  MessageThreadAdapter,
  MessageThreadProps,
  ThreadSupabaseFactory,
  ThreadSupabaseLike,
  ThreadChannelLike,
} from "./types";

// Safe markdown-subset renderer, shared with @henryco/chat-thread hosts so
// the XSS-audited pipeline stays single-sourced (additive re-export).
export { renderBody as renderMessageMarkdown } from "./markdown";

// V3-03 — WhatsApp-style delivery state pip
export { DeliveryStatePip } from "./delivery-pip";
export type {
  DeliveryState,
  DeliveryPipLabels,
  DeliveryStatePipProps,
} from "./delivery-pip";
