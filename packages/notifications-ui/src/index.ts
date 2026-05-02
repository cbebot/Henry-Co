// Types
export {
  DIVISIONS,
  type Division,
  type NotificationAction,
  type NotificationItem,
  type SignalSeverity,
} from "./types";

// Token schemes
export {
  ACCOUNT_NOTIFICATION_TOKENS,
  STAFF_NOTIFICATION_TOKENS,
  type SeverityTokens,
} from "./tokens";

// Severity + division presentation
export {
  createSeverityResolver,
  type SeverityResolver,
  type SeverityStyle,
} from "./severity-style";

// Icons
export {
  ArchiveIcon,
  DeleteForeverIcon,
  DeleteIcon,
  EmptyStateGlyph,
  HenryCoBell,
  MarkReadIcon,
  RestoreIcon,
  SeverityInfoIcon,
  SeveritySecurityIcon,
  SeveritySuccessIcon,
  SeverityUrgentIcon,
  SeverityWarningIcon,
} from "./icons";

// Motion
export {
  henrycoSwipeCommitCurve,
  henrycoSwipeCommitMs,
  henrycoSwipeCommitTransition,
  henrycoSwipeRevealCurve,
  henrycoSwipeRevealMs,
  henrycoSwipeRevealTransition,
  henrycoSwipeSettleCurve,
  henrycoSwipeSettleMs,
  henrycoSwipeSettleTransition,
  LONG_PRESS_FALLBACK_MS,
  reducedMotionCurve,
  reducedMotionMs,
  SWIPE_COMMIT_VELOCITY_PX_PER_MS,
  SWIPE_DIRECTION_LOCK_PX,
  SWIPE_PRIMARY_REVEAL_PX,
  SWIPE_SECONDARY_REVEAL_PX,
} from "./motion";

// Gestures
export {
  useSwipeReveal,
  type SwipeAction,
  type SwipeRevealCallbacks,
  type SwipeRevealHandlers,
  type SwipeRevealState,
} from "./gestures";

// Deep-link guard
export { isSafeNotificationDeepLink } from "./deep-link";
