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

// Track C (DASH-9) primitives — staff queue surfaces.
export { SLAChip, type SLAChipProps, type SLABucket } from "./sla-chip";
export {
  BulkActionBar,
  type BulkAction,
  type BulkActionBarProps,
  type BulkActionBarHandle,
} from "./bulk-action-bar";
export {
  AdvancedFilterBar,
  summarizeActiveFilters,
  type AdvancedFilterBarProps,
  type FilterField,
  type FilterValue,
  type FilterValueMap,
} from "./advanced-filter-bar";
export {
  BulkExportButton,
  type BulkExportButtonProps,
  type BulkExportFormat,
} from "./bulk-export-button";
export {
  QueueTable,
  type QueueTableProps,
  type QueueRow,
  type QueueColumn,
} from "./queue-table";

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
