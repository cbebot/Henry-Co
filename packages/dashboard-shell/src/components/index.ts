/**
 * @henryco/dashboard-shell/components — primitive barrel.
 */
export { Panel, type PanelProps } from "./panel";
export { PageHeader, type PageHeaderProps } from "./page-header";
export { Section, type SectionProps } from "./section";
export { Chip, type ChipProps } from "./chip";
export { Badge, type BadgeProps } from "./badge";
export { FocusRing, type FocusRingProps } from "./focus-ring";
export {
  MetricCard,
  type MetricCardProps,
  type MetricContext,
  type MetricContextComparison,
  type MetricContextTrend,
} from "./metric-card";
export { SignalCard, type SignalCardProps } from "./signal-card";
export { EmptyState, type EmptyStateProps } from "./empty-state";
export { LoadingSkeleton, type LoadingSkeletonProps } from "./loading-skeleton";
export { ErrorBoundary } from "./error-boundary";
export { ActionButton, type ActionButtonProps } from "./action-button";
export { DivisionImage, type DivisionImageProps } from "./division-image";
export { QuickLink, type QuickLinkProps } from "./quick-link";
export { TypeaheadGrid, type TypeaheadGridProps } from "./typeahead-grid";
export { BottomSheet, type BottomSheetProps } from "./bottom-sheet";
export { Drawer, type DrawerProps } from "./drawer";

// Notifications (DASH-6)
export {
  NotificationCard,
  NotificationsBell,
  NotificationsToastViewport,
  InboxFeed,
  QuietHoursPanel,
  PreferencesPanel,
  NotificationsDrawerBody,
  type NotificationCardProps,
  type NotificationsBellProps,
  type NotificationsToastViewportProps,
  type InboxFeedProps,
  type QuietHoursPanelProps,
  type PreferencesPanelProps,
  type NotificationsDrawerBodyProps,
} from "./notifications";
