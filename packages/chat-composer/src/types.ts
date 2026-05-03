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
  attachmentCarouselLabel?: string;
  emptyAttachmentLabel?: string;
  failedSendLabel?: string;
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
};

export const DEFAULT_MAX_ATTACHMENTS = 10;
export const DEFAULT_MAX_FILE_BYTES = 20 * 1024 * 1024;
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
