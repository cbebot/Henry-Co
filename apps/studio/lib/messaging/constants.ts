/**
 * Studio messaging — invariant configuration.
 *
 * Curated reaction set: six emoji whose meanings cover the entire
 * studio-client communication response surface. Adding the seventh
 * dilutes the system; deleting one breaks a workflow. Owner has
 * signed off on this exact set.
 */

export type ReactionEmoji =
  | "👍"
  | "✅"
  | "❤️"
  | "🔁"
  | "❓"
  | "🙏";

export type ReactionDescriptor = {
  emoji: ReactionEmoji;
  label: string;
  hint: string;
};

export const REACTIONS: readonly ReactionDescriptor[] = [
  { emoji: "👍", label: "Noted", hint: "Noted / Agreed" },
  { emoji: "✅", label: "Approved", hint: "Approved" },
  { emoji: "❤️", label: "Love this", hint: "Love this" },
  { emoji: "🔁", label: "Needs revision", hint: "Needs revision" },
  { emoji: "❓", label: "Question", hint: "Question / Unclear" },
  { emoji: "🙏", label: "Thank you", hint: "Thank you" },
] as const;

export const REACTION_EMOJIS: readonly ReactionEmoji[] = REACTIONS.map(
  (r) => r.emoji,
);

export function isReactionEmoji(value: string): value is ReactionEmoji {
  return (REACTION_EMOJIS as readonly string[]).includes(value);
}

/** First-load page size for the thread. Server-rendered. */
export const THREAD_INITIAL_PAGE_SIZE = 30;

/** Subsequent paginated loads as the user scrolls back into history. */
export const THREAD_HISTORY_PAGE_SIZE = 30;

/**
 * Threshold above which a thread is rendered through the virtual list.
 * Below this we render the messages directly — virtualisation has its
 * own cost and a 60-message thread is small enough to render cheaply.
 */
export const VIRTUALISE_THREAD_AFTER = 100;

/**
 * Sequence-grouping window. Messages from the same sender within this
 * window are collapsed into a single visual sequence (no repeated
 * avatar / name / timestamp).
 */
export const SEQUENCE_WINDOW_MS = 3 * 60 * 1000;

/**
 * Auto-scroll threshold. When a new message arrives we auto-scroll only
 * if the user is within this many pixels of the bottom.
 */
export const AUTO_SCROLL_THRESHOLD_PX = 200;

/** Typing indicator: appears after this delay of detected typing. */
export const TYPING_INDICATOR_APPEAR_MS = 500;

/** Typing indicator: disappears this long after typing stops. */
export const TYPING_INDICATOR_LINGER_MS = 3000;

/**
 * Typing indicator broadcast TTL. The DB row is considered stale after
 * this and pruned by the studio_prune_stale_typing helper.
 */
export const TYPING_INDICATOR_TTL_MS = 10 * 1000;

/** Notification toast auto-dismiss. */
export const NOTIFICATION_TOAST_DISMISS_MS = 6000;

/** Realtime "Connecting…" banner threshold. */
export const REALTIME_CONNECTING_THRESHOLD_MS = 2000;

/** Maximum attachments per message. */
export const MAX_ATTACHMENTS_PER_MESSAGE = 6;

/** Maximum attachment size in bytes (15MB — sane for project assets). */
export const MAX_ATTACHMENT_BYTES = 15 * 1024 * 1024;

export const ACCEPTED_ATTACHMENT_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "text/csv",
] as const;

/** Bubble copy variants for the input placeholder, by context. */
export const INPUT_PLACEHOLDERS = {
  empty: (projectName: string) =>
    `Start the conversation about ${projectName}…`,
  awaitingReply: "Reply to the Studio team…",
  default: "Message the Studio team…",
} as const;

/** Realtime channel name for a project. */
export function projectChannelName(projectId: string): string {
  return `project-messages:${projectId}`;
}
