/**
 * Shared types for the shell-level realtime spine.
 *
 * Lifted to its own module so the provider, hooks, and consumer
 * components reference one canonical shape.
 */

/**
 * Audience tag — drives quiet-hours scope, muted-divisions scope, and the
 * publication channel a signal arrived on.
 */
export type SignalAudience = "customer" | "staff";

/**
 * One realtime signal as the shell holds it in-memory. Audience-flat —
 * both `customer_notifications` and `staff_notifications` rows project
 * into this shape via the host-supplied data source. Fields not
 * applicable to one audience (e.g. `email_dispatched_at` is customer-only)
 * are simply null.
 */
export type RealtimeSignal = {
  id: string;
  audience: SignalAudience;
  /** Producing division — drives accent color + source label. */
  division: string | null;
  /** Event type / category — used for muted_event_types matching. */
  category: string | null;
  /** Severity priority. Coerced via resolveSeverity() for legacy values. */
  priority: string | null;
  title: string;
  body: string | null;
  /** Deep link the bell click navigates to. */
  action_url: string | null;
  message_href: string;
  is_read: boolean;
  archived_at: string | null;
  deleted_at: string | null;
  created_at: string;
  /**
   * Set when the email-fallback cron has dispatched. Surface render
   * dims the row + toast. Always null for staff audience.
   */
  email_dispatched_at: string | null;
  /**
   * Optional source-brand metadata, host-supplied. Populated when the
   * data source enriches via `getDivisionBrand`.
   */
  source: {
    key: string;
    label: string;
    accent: string;
    logoUrl: string | null;
  } | null;
};

/**
 * Realtime preferences read from `customer_preferences`. Render layer
 * checks for quiet hours, muted divisions, muted event types.
 */
export type RealtimePreferences = {
  /** Whether quiet hours apply to current rendering. */
  quiet_hours_enabled: boolean;
  /** "HH:MM" in the user's local time (or quiet_hours_timezone). */
  quiet_hours_start: string;
  /** "HH:MM" in the user's local time (or quiet_hours_timezone). */
  quiet_hours_end: string;
  /** IANA timezone for quiet hours; null = browser local. */
  quiet_hours_timezone: string | null;
  /** Division keys to suppress from the bell badge (still inboxed). */
  muted_divisions: ReadonlyArray<string>;
  /** Event-type slugs to suppress from toast (still inboxed). */
  muted_event_types: ReadonlyArray<string>;
  /** Whether email fallback may dispatch for this user. */
  email_fallback_enabled: boolean;
  /** Hours before email fallback fires for unread (1|4|12|24|48). */
  email_fallback_delay_hours: number;
  /** Master toast switch. */
  in_app_toast_enabled: boolean;
  /** Sound on toast. */
  notification_sound_enabled: boolean;
  /** Vibrate on toast (mobile). */
  notification_vibration_enabled: boolean;
  /** Show urgent/security only. */
  high_priority_only: boolean;
};

/**
 * Filter shape consumed by `useNotificationSignal()` and `useTaskSignal()`.
 * Each filter is AND-combined; omit a field to skip that constraint.
 */
export type SignalFilter = {
  /** Match the signal's audience. */
  audience?: SignalAudience;
  /** Match the producing division (case-insensitive). */
  division?: string | string[];
  /** Match the category slug (case-insensitive). */
  category?: string | string[];
  /** Match severity priority (case-insensitive). */
  priority?: string | string[];
  /** Restrict to unread. */
  unreadOnly?: boolean;
  /** Restrict to non-archived, non-deleted. */
  visibleOnly?: boolean;
  /** Cap returned items. */
  limit?: number;
};

/**
 * Status of one realtime channel — exposed so the host UI can render a
 * disconnected banner state.
 */
export type ChannelStatus =
  | "idle" // not yet subscribed
  | "connecting"
  | "subscribed"
  | "error"
  | "closed"
  | "disabled"; // viewer doesn't qualify

/**
 * The core realtime context value provided by `<SupabaseRealtimeProvider>`.
 */
export type RealtimeContextValue = {
  /** Most recent realtime event timestamp (ms epoch). 0 = none yet. */
  lastSignalAt: number;
  /**
   * Monotonic invalidation token; increments on every customer or staff
   * realtime event. DASH-4's Smart Home cache() honors this via a deps
   * re-fetch trigger.
   */
  invalidationTag: number;
  /** Live signal list. Capped at MAX_RETAINED (50) by the provider. */
  signals: ReadonlyArray<RealtimeSignal>;
  /** Active customer-audience unread count. */
  customerUnread: number;
  /** Active staff-audience unread count (0 when viewer.hasStaffAccess=false). */
  staffUnread: number;
  /** True while the initial hydration is in flight. */
  loading: boolean;
  /** Set when hydration or the realtime channel errors. */
  error: string | null;
  /** Customer realtime channel status. */
  customerChannelStatus: ChannelStatus;
  /** Staff realtime channel status. */
  staffChannelStatus: ChannelStatus;
  /** Realtime preferences from `customer_preferences`. */
  preferences: RealtimePreferences;
  /** Force a re-hydration (drops the cache, re-fetches). */
  refresh: () => Promise<void>;
  /** Optimistically mark a signal read locally (server roundtrip optional). */
  markReadLocally: (id: string) => void;
  /** Locally update preferences (does NOT persist; pair with PATCH endpoint). */
  setPreferencesLocally: (
    updates: Partial<RealtimePreferences>,
  ) => void;
  /**
   * Subscribe to event-type-specific handlers for advanced cases. Most
   * consumers should use `useNotificationSignal()`.
   */
  subscribe: (
    eventType: string,
    handler: (signal: RealtimeSignal) => void,
  ) => () => void;
};

/**
 * Default preference values — applied when `customer_preferences` row is
 * missing or partial. Mirrors the trigger defaults in the V2-NOT-01-A
 * migration.
 */
export const DEFAULT_REALTIME_PREFERENCES: RealtimePreferences = {
  quiet_hours_enabled: false,
  quiet_hours_start: "22:00",
  quiet_hours_end: "07:00",
  quiet_hours_timezone: null,
  muted_divisions: [],
  muted_event_types: [],
  email_fallback_enabled: true,
  email_fallback_delay_hours: 24,
  in_app_toast_enabled: true,
  notification_sound_enabled: false,
  notification_vibration_enabled: false,
  high_priority_only: false,
};
