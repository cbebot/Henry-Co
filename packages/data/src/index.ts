/**
 * @henryco/data — unified data access for the HenryCo dashboard.
 *
 * Server-only barrel. Importing this from a client component will
 * fail at build time because each helper carries `import "server-only"`.
 *
 * The package consolidates the cross-division read surface that was
 * previously duplicated across:
 *   - apps/account/lib/account-data.ts
 *   - apps/hub/lib/owner-data.ts
 *   - apps/staff/lib/intelligence-data.ts
 *
 * Closes audit §C.10 #3.
 */

export type { Database, Json } from "./database.types";
export type { SignalFeedRow } from "./signal-feed";
export { createDataAdminClient, type TypedSupabaseClient } from "./client";

export {
  loadOperatorMembership,
  type OperatorMembershipViewer,
  type OperatorMembershipResult,
} from "./operator-membership";

export {
  getDashboardSummary,
  type DashboardSummary,
  type CustomerSummary,
  type OwnerSummary,
  type StaffSummary,
  type CustomerWalletSnapshot,
  type ActivityRow,
  type NotificationRow,
  type SubscriptionRow,
  type InvoiceRow,
  type SupportThreadRow,
} from "./dashboard-summary";

export {
  getSignalFeed,
  signalFeedTag,
  SMART_HOME_TAG,
  type SignalFeedItem,
  type SignalFeedCursor,
  type SignalFeedOptions,
  type SignalFeedResult,
} from "./signal-feed";

export {
  getCrossDivisionActivity,
  type ActivityItem,
} from "./cross-division-activity";

export {
  getSupportSummary,
  type SupportSummary,
} from "./support-summary";

export {
  getInboxAggregate,
  type InboxAggregate,
  type InboxThread,
  type InboxDivision,
} from "./inbox-aggregate";

export {
  getCalendarAggregate,
  defaultCalendarRange,
  groupEventsByDay,
  type CalendarAggregate,
  type CalendarEvent,
  type CalendarKind,
  type CalendarRange,
} from "./calendar-aggregate";

export {
  studioViewerIdentity,
  filterToAllowedProjects,
  loadViewerStudioProjectIds,
  type StudioViewerIdentity,
} from "./studio-scope";

// V3-34 (Phase E) — per-user home-layout persistence (RLS owner-only).
export {
  getUserHomeLayout,
  upsertUserHomeLayout,
  isLayoutStale,
  type UserHomeLayout,
  type UserHomeLayoutPatch,
  type HomeLayoutSurface,
} from "./home-layout";

export {
  captureAbandonedTask,
  listPendingAbandonedTasks,
  bumpAbandonedTaskReminder,
  expireStaleAbandonedTasks,
  claimAbandonedTasksForUser,
  listUserAbandonedTasks,
  dismissAbandonedTask,
  markAbandonedTaskRecovered,
  markAbandonedTasksRecoveredByRefs,
  stripSecretsFromState,
  stateHasForbiddenKey,
  isAbandonedTaskType,
  isAbandonedTaskStatus,
  ABANDONED_TASK_TYPES,
  ABANDONED_TASK_STATUSES,
  type AbandonedTask,
  type AbandonedTaskState,
  type AbandonedTaskStatus,
  type AbandonedTaskType,
  type CaptureAbandonedTaskInput,
  type ClaimAbandonedTasksInput,
} from "./abandoned-tasks";
