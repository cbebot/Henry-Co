/**
 * Audience-generic notification primitives.
 *
 * Both customer (`customer_notifications`) and staff (`staff_notifications`
 * + `staff_notification_states`) audiences flatten into the shape below
 * before rendering. Provider/data-source adapters are responsible for the
 * mapping; UI components consume `NotificationItem` only.
 */

export type SignalSeverity =
  | "info"
  | "success"
  | "warning"
  | "urgent"
  | "security";

export type Division =
  | "hub"
  | "account"
  | "staff"
  | "care"
  | "marketplace"
  | "property"
  | "logistics"
  | "jobs"
  | "learn"
  | "studio"
  | "security"
  | "system";

/** The 12 known divisions, in stable order. */
export const DIVISIONS: readonly Division[] = [
  "hub",
  "account",
  "staff",
  "care",
  "marketplace",
  "property",
  "logistics",
  "jobs",
  "learn",
  "studio",
  "security",
  "system",
] as const;

/**
 * The flattened, audience-agnostic shape rendered by the bell, popover,
 * inbox row, toast, and recently-deleted page.
 *
 * Lifecycle fields (is_read, archived_at, deleted_at) live on the row
 * itself for customer audience and on `staff_notification_states` for
 * staff. The data-source adapter joins them so consumers always see the
 * caller's effective state, not the producer-side state of a broadcast.
 */
export type NotificationItem = {
  id: string;
  /** Producing division — drives accent color + source label. */
  division: string | null;
  /** Event type / category (e.g. "auth.password.changed"). */
  category: string | null;
  /** Severity priority. Coerced via resolveSeverity() for legacy values. */
  priority: string | null;
  title: string;
  body: string | null;
  /** Deep link the bell click navigates to. Validated at render via isSafeNotificationDeepLink. */
  action_url: string | null;
  action_label: string | null;
  is_read: boolean;
  archived_at: string | null;
  deleted_at: string | null;
  created_at: string;
};

/** Lifecycle action a UI gesture can request against a notification. */
export type NotificationAction =
  | "mark_read"
  | "mark_unread"
  | "archive"
  | "delete"
  | "restore";
