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
