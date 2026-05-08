/**
 * @henryco/dashboard-shell/shell — chrome barrel.
 */
export { IdentityBar, type IdentityBarProps } from "./identity-bar";
export { WorkspaceRail, type WorkspaceRailProps } from "./workspace-rail";
export {
  StaffShell,
  StaffRailGroup,
  StaffRailEntry,
  type StaffShellProps,
  type StaffRailGroupProps,
  type StaffRailEntryProps,
} from "./staff-shell";
export { WorkspaceSlot, type WorkspaceSlotProps } from "./workspace-slot";
export { ContextDrawer, type ContextDrawerProps } from "./context-drawer";
export {
  SupabaseRealtimeProvider,
  useRealtime,
  useRealtimeOptional,
  type SupabaseRealtimeProviderProps,
} from "./supabase-realtime-provider";
export {
  useNotificationSignal,
  useTaskSignal,
  useSignalInvalidation,
  useNotificationPreferences,
  useSignalRenderState,
  useUnreadCount,
} from "./realtime-hooks";
export {
  isWithinQuietHours,
  isMutedDivision,
  isMutedEventType,
} from "./realtime-rules";
export {
  DEFAULT_REALTIME_PREFERENCES,
  type ChannelStatus,
  type RealtimeContextValue,
  type RealtimePreferences,
  type RealtimeSignal,
  type SignalAudience,
  type SignalFilter,
} from "./realtime-types";
export {
  DEFAULT_SOURCE_CONFIG,
  type HydrationPayload,
  type PreferencesPayload,
  type RealtimeSourceConfig,
} from "./realtime-data-source";
export {
  BottomActionBar,
  computeActive,
  BOTTOM_ACTION_BAR_ANCHOR_KEYS,
  type BottomActionBarProps,
  type BottomActionBarAnchorKey,
  type ModuleNavEntry,
} from "./bottom-action-bar";
export {
  MOBILE_SHELL_CSS,
  MOBILE_BREAKPOINT_PX,
  TABLET_BREAKPOINT_PX,
} from "./mobile-shell-css";
