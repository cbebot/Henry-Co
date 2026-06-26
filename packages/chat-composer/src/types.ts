import type { ReactNode } from "react";

export type AttachmentStatus = "pending" | "uploading" | "uploaded" | "failed";

export type RemoteAttachment = {
  url: string;
  publicId?: string;
  resourceType?: "image" | "video" | "raw" | "auto";
  width?: number;
  height?: number;
  bytes?: number;
  format?: string;
};

export type ComposerAttachment = {
  id: string;
  file: File;
  name: string;
  size: number;
  mimeType: string;
  kind: "image" | "video" | "pdf" | "doc" | "other";
  previewUrl?: string;
  status: AttachmentStatus;
  progress: number;
  remote?: RemoteAttachment;
  error?: string;
};

export type ComposerSendPayload = {
  threadId: string;
  text: string;
  attachments: ComposerAttachment[];
};

export type ComposerSendHandler = (
  payload: ComposerSendPayload
) => Promise<void> | void;

export type AttachmentUploader = (
  file: File,
  onProgress: (percent: number) => void,
  signal: AbortSignal
) => Promise<RemoteAttachment>;

export type ComposerTone =
  | "account"
  | "care"
  | "jobs"
  | "marketplace"
  | "studio"
  | "neutral";

export type ComposerLabels = {
  placeholder?: string;
  sendLabel?: string;
  sendingLabel?: string;
  attachLabel?: string;
  expandLabel?: string;
  collapseLabel?: string;
  draftSavedLabel?: string;
  discardDraftLabel?: string;
  removeAttachmentLabel?: string;
  retryUploadLabel?: string;
  fullScreenTitleLabel?: string;
  shortcutHint?: string;
  failedSendLabel?: string;
  /** Group aria-label on the inline composer shell ("Message composer"). */
  composerAriaLabel?: string;
  /** Textarea aria-label ("Message body"). */
  bodyAriaLabel?: string;
  /** Drag-over overlay copy ("Drop to attach"). */
  dropToAttachLabel?: string;
  /** SR-only live-region announcement while sending ("Sending message"). */
  srSendingLabel?: string;
  /** Attachment chip in-progress copy ("Uploading…"). */
  uploadingLabel?: string;
  /** Attachment chip failed-upload copy ("Failed"). */
  attachmentFailedLabel?: string;
  /** Attachment list aria-label ("Attached files"). */
  attachmentListLabel?: string;
  /** Draft indicator saving copy ("Saving…"). */
  savingLabel?: string;
};

export type ComposerExtrasContext = {
  /** Live composer text — read it to drive a slot button (e.g. "Refine"). */
  text: string;
  /** Replace the composer text — slot can rewrite the draft. */
  setText: (value: string) => void;
};

export type ComposerProps = {
  threadId: string;
  onSend: ComposerSendHandler;
  placeholder?: string;
  tone?: ComposerTone;
  disabled?: boolean;
  busy?: boolean;
  maxAttachments?: number;
  maxFileBytes?: number;
  acceptedMimeTypes?: readonly string[];
  acceptAttribute?: string;
  enableAttachments?: boolean;
  enableDraft?: boolean;
  enableFullScreenOnMobile?: boolean;
  uploadAttachment?: AttachmentUploader;
  onTyping?: () => void;
  onValidationError?: (message: string) => void;
  onSendSuccess?: () => void;
  onSendError?: (error: Error) => void;
  className?: string;
  labels?: ComposerLabels;
  belowInputSlot?: ReactNode;
  initialText?: string;
  ariaLabel?: string;
  textareaName?: string;
  /**
   * Focus the textarea on mount. Useful for chat surfaces where the
   * thread is the entire screen — the keyboard opens immediately on
   * mobile (subject to host browser allowing programmatic focus from a
   * navigation gesture). Defaults to false.
   */
  autoFocus?: boolean;
  /**
   * Opt-in WhatsApp / iMessage parity on mobile (max-width: 767px):
   * the composer shell goes flush to the viewport edge — no outer
   * radius, no side border, no side padding, hairline top border,
   * safe-area-inset on the bottom. Use on chat-first surfaces where
   * the composer should read as device chrome (studio messaging
   * centre, jobs hiring conversation). MessageThread mounts always
   * get edge-to-edge via the `.mt-composer-host` parent selector so
   * they do not need to pass this. Form-embedded composers
   * (NewSupportForm, care ReplyComposer) should leave it off so the
   * composer keeps its rounded card chrome inside the form.
   */
  edgeToEdgeMobile?: boolean;
  /**
   * Extra controls rendered in the actions row, before Send. Receives the
   * live `text` and a `setText` callback so extras can both read AND mutate
   * the draft. The studio ✨ Refine button uses this to call Claude on the
   * current draft and replace it with a polished version.
   *
   * Render prop instead of plain ReactNode so the slot stays declarative
   * without forcing the engine to expose its internal state via context.
   */
  composerExtras?: (ctx: ComposerExtrasContext) => ReactNode;
};

export const DEFAULT_MAX_ATTACHMENTS = 25;
export const DEFAULT_MAX_FILE_BYTES = 50 * 1024 * 1024;
export const DEFAULT_ACCEPTED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "application/pdf",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;
