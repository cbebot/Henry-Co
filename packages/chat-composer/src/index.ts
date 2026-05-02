export { ChatComposer } from "./composer/ChatComposer";
export { FullScreenComposer } from "./composer/FullScreenComposer";
export { AttachmentPreview } from "./composer/AttachmentPreview";
export { DraftIndicator } from "./composer/DraftIndicator";
export { SendButton } from "./composer/SendButton";
export { AutosizeTextarea } from "./composer/AutosizeTextarea";
export {
  ChatComposerProvider,
  useChatComposerSurface,
} from "./composer/ChatComposerProvider";
export { ensureComposerStyles } from "./composer/composer-styles";

export { useDraftStorage } from "./hooks/useDraftStorage";
export type { DraftState, UseDraftStorageResult } from "./hooks/useDraftStorage";
export { useAttachmentUpload } from "./hooks/useAttachmentUpload";
export { useComposerKeyboard, shortcutHintText, isMacLike } from "./hooks/useComposerKeyboard";
export { useViewportKeyboard } from "./hooks/useViewportKeyboard";
export type { ViewportKeyboardState } from "./hooks/useViewportKeyboard";
export { useReducedMotion } from "./hooks/useReducedMotion";
export { useIsMobile } from "./hooks/useIsMobile";

export {
  henrycoSendReady,
  henrycoSendCommit,
  henrycoSendFail,
  henrycoExpandComposer,
  henrycoDraftPulse,
  HENRYCO_COMPOSER_MOTION,
  ALL_COMPOSER_CURVES,
} from "./motion";
export type { MotionCurve } from "./motion";

export {
  validateFile,
  formatMb,
  classifyAttachment,
  nextAttachmentId,
} from "./util/validateAttachment";

export type {
  AttachmentStatus,
  AttachmentUploader,
  ComposerAttachment,
  ComposerLabels,
  ComposerProps,
  ComposerSendHandler,
  ComposerSendPayload,
  ComposerTone,
  RemoteAttachment,
} from "./types";

export {
  DEFAULT_ACCEPTED_MIME_TYPES,
  DEFAULT_MAX_ATTACHMENTS,
  DEFAULT_MAX_FILE_BYTES,
} from "./types";
