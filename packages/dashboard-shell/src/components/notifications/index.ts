/**
 * @henryco/dashboard-shell/components/notifications — shell-wide
 * notification UI surface.
 *
 * Closes audit §A.3-1 / §C.10 #6: the bell, popover, toast viewport,
 * inbox surface, quiet-hours panel, and preferences panel were
 * previously locked inside `apps/account/components/notifications/*`.
 * They live here now so any HenryCo shell — customer, staff workspace,
 * owner — can mount them.
 *
 * They consume the realtime spine via `useNotificationSignal()` etc.
 * from `../../shell/realtime-hooks`; nothing here directly subscribes
 * to Supabase Realtime (anti-pattern #9). Audience-agnostic primitives
 * (icons, severity-style, gestures, deep-link, motion) come from
 * `@henryco/notifications-ui` (V2-NOT-02-A).
 */

export {
  NotificationCard,
  type NotificationCardProps,
} from "./notification-card";
export {
  NotificationsBell,
  type NotificationsBellProps,
} from "./notifications-bell";
export {
  NotificationsToastViewport,
  type NotificationsToastViewportProps,
} from "./notifications-toast-viewport";
export { InboxFeed, type InboxFeedProps } from "./inbox-feed";
export {
  QuietHoursPanel,
  type QuietHoursPanelProps,
} from "./quiet-hours-panel";
export {
  PreferencesPanel,
  type PreferencesPanelProps,
} from "./preferences-panel";
export {
  NotificationsDrawerBody,
  type NotificationsDrawerBodyProps,
} from "./notifications-drawer-body";
