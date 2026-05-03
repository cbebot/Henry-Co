/**
 * Studio messaging — TypeScript surface.
 *
 * These types model rows as the messaging UI consumes them, not the
 * raw Supabase response shape. Server queries reshape DB rows into
 * these types so the UI never needs to know about column casing or
 * jsonb deserialisation.
 */

import type { ReactionEmoji } from "./constants";

export type MessageType =
  | "text"
  | "file"
  | "milestone_update"
  | "file_share"
  | "payment_update"
  | "approval_request"
  | "system";

export type SenderRole = "client" | "team" | "system";

export type MessageAttachment = {
  /** Stable ID used for React keys and attachment-level operations. */
  id: string;
  /** Display label — usually the original filename. */
  label: string;
  /** Public URL (Cloudinary secure_url). */
  url: string;
  /** Cloudinary public_id, retained for future deletion / transforms. */
  publicId?: string;
  /** Original MIME type. */
  mimeType?: string;
  /** Original byte size. */
  size?: number;
  /** Coarse classification used by the renderer. */
  kind: "image" | "video" | "pdf" | "doc" | "other";
};

export type MessageReaction = {
  emoji: ReactionEmoji;
  count: number;
  /** True if the current viewer has applied this reaction. */
  appliedByViewer: boolean;
};

export type ReadReceipt = {
  userId: string;
  readAt: string;
  displayName?: string | null;
};

/**
 * Reply preview embedded inline in a message bubble. We materialise
 * a small subset of the parent message so the UI never has to chase
 * additional joins to render a reply.
 */
export type ReplyPreview = {
  id: string;
  senderName: string;
  senderRole: SenderRole;
  bodyExcerpt: string;
};

export type StudioMessage = {
  id: string;
  projectId: string;
  /**
   * Display name for the sender. For client-sent messages this is the
   * resolved display name on the auth user. For team messages this is
   * a free-form text the team set when sending.
   */
  senderName: string;
  /** Sender's auth.users.id, when the message was sent by a logged-in user. */
  senderId: string | null;
  senderRole: SenderRole;
  /** Markdown-friendly text body. May be empty when attachments only. */
  body: string;
  messageType: MessageType;
  /** Structured payload for non-text message types. */
  metadata: Record<string, unknown>;
  attachments: MessageAttachment[];
  reactions: MessageReaction[];
  readReceipts: ReadReceipt[];
  reply?: ReplyPreview;
  createdAt: string;
  editedAt?: string | null;
  deletedAt?: string | null;
  /** Heuristic — was this message authored by the viewing user. */
  isOwnMessage: boolean;
  /** Heuristic — has the current viewer marked this read. */
  readByViewer: boolean;
};

export type TypingIndicator = {
  userId: string;
  displayName: string;
  startedAt: string;
};

export type ProjectThreadContext = {
  projectId: string;
  projectTitle: string;
  /** Currently active milestone for the right-panel summary. */
  currentMilestone?: {
    id: string;
    name: string;
    status: string;
    dueLabel: string;
    dueDate: string | null;
    description: string;
  };
  /** Three most recently shared deliverables. */
  recentFiles: Array<{
    id: string;
    label: string;
    url: string | null;
    fileType: string | null;
    sharedAt: string;
    thumbnailUrl: string | null;
  }>;
  /** Compact milestone timeline. */
  timeline: Array<{
    id: string;
    name: string;
    status: string;
    dueLabel: string;
    dueDate: string | null;
    sortOrder: number;
  }>;
  /** Studio team members assigned to this project. */
  team: Array<{
    id: string;
    name: string;
    label: string;
    isOnline: boolean;
  }>;
};

export type ThreadInitialState = {
  context: ProjectThreadContext;
  messages: StudioMessage[];
  /** True if more historical messages exist beyond the loaded page. */
  hasMoreHistory: boolean;
  /** ID of the viewing user, when authenticated. Used for own-message detection. */
  viewerId: string | null;
  /** Display name of the viewing user, used for typing-indicator labels. */
  viewerName: string | null;
  /** Resolved as: viewer is staff (team) vs client. */
  viewerRole: SenderRole;
};

export type ProjectThreadSummary = {
  projectId: string;
  projectTitle: string;
  projectStatus: string;
  lastMessage: {
    senderName: string;
    senderRole: SenderRole;
    bodyExcerpt: string;
    createdAt: string;
  } | null;
  unreadCount: number;
  /** True if any team member is currently active in the portal. */
  teamActive: boolean;
};

export type SendMessageInput = {
  projectId: string;
  body: string;
  attachments?: Array<{
    label: string;
    url: string;
    publicId?: string;
    mimeType?: string;
    size?: number;
    kind: MessageAttachment["kind"];
  }>;
  /** Reply target message id, if this is a threaded reply. */
  replyToId?: string | null;
  /** Override message_type. Defaults to 'text' (or 'file' if only attachments). */
  messageType?: MessageType;
  /** Structured payload for non-text messages. */
  metadata?: Record<string, unknown>;
};

export type SendMessageResult =
  | { ok: true; messageId: string }
  | { ok: false; error: string };

export type ToggleReactionInput = {
  messageId: string;
  emoji: ReactionEmoji;
};

export type MarkReadInput = {
  messageIds: string[];
};

export type EditMessageInput = {
  messageId: string;
  body: string;
};

export type SoftDeleteMessageInput = {
  messageId: string;
};

export type SetTypingInput = {
  projectId: string;
  isTyping: boolean;
};
