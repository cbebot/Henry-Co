"use client";

import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";
import {
  useNotificationSignal,
  useRealtime,
  useNotificationPreferences,
} from "@henryco/dashboard-shell";
import {
  normalizeNotificationSignalPreferences,
  type NotificationSignalPreferences,
} from "./notification-signal-preferences";
import type { SignalNotification } from "./notification-polling";

/**
 * V2-DASH-06 — NotificationSignalProvider is now a THIN BRIDGE around
 * the shell-level SupabaseRealtimeProvider in `@henryco/dashboard-shell`.
 *
 * Before DASH-6 this provider mounted its own Supabase Realtime channel
 * + polled `/api/notifications/recent` itself. That fragmented the
 * notification spine across apps and kept `@henryco/notifications-ui`
 * locked inside `apps/account` (audit §A.3-1).
 *
 * After DASH-6:
 *   - The shell's SupabaseRealtimeProvider owns the single subscription
 *     per session (closes anti-pattern #9).
 *   - This bridge re-projects the shell store into the legacy
 *     `useNotificationSignalContext()` shape so the existing 7+ call
 *     sites (NotificationBell, NotificationsFeed, NotificationLifecycleControls,
 *     etc.) compile unchanged.
 *
 * Once a follow-up phase migrates each call site to the shell hooks
 * directly, this bridge can be deleted.
 */

export type PreviewToastItem = SignalNotification & {
  toastId: string;
  shownAt: number;
  priorityBadge: string | null;
};

type NotificationSignalContextValue = {
  preferences: NotificationSignalPreferences;
  audioUnlocked: boolean;
  loading: boolean;
  error: string | null;
  unreadCount: number;
  recentNotifications: SignalNotification[];
  previewToasts: PreviewToastItem[];
  updatePreferences: (updates: Partial<NotificationSignalPreferences>) => void;
  dismissToast: (toastId: string) => void;
  refreshFeed: () => Promise<void>;
  markNotificationReadLocally: (notificationId: string) => void;
  testSound: () => Promise<boolean>;
};

const NotificationSignalContext = createContext<NotificationSignalContextValue | null>(
  null,
);

export function useNotificationSignalContext() {
  return useContext(NotificationSignalContext);
}

type NotificationSignalProviderProps = {
  children: ReactNode;
  /**
   * Initial preferences from the server-rendered customer_preferences
   * row. The shell's provider already accepts this; the bridge accepts
   * it too for back-compat with existing call sites that pass it.
   */
  initialPreferences?: Record<string, unknown> | null;
};

/**
 * Project a `RealtimeSignal` into the legacy `SignalNotification` shape
 * the bell + feed components expect.
 */
function toSignalNotification(s: ReturnType<typeof useNotificationSignal>["signals"][number]): SignalNotification {
  return {
    id: s.id,
    title: s.title,
    body: s.body ?? "",
    created_at: s.created_at,
    is_read: s.is_read,
    message_href: s.message_href,
    related_url: null,
    action_url: s.action_url,
    division: s.division,
    category: s.category,
    priority: s.priority,
    reference_type: null,
    source: s.source ?? {
      key: s.division ?? "system",
      label: "HenryCo",
      accent: "#111827",
      logoUrl: null,
    },
  };
}

export function NotificationSignalProvider({
  children,
  initialPreferences,
}: NotificationSignalProviderProps) {
  const { signals, unreadCount, loading, error } = useNotificationSignal({
    audience: "customer",
    visibleOnly: true,
    limit: 12,
  });
  const { refresh, markReadLocally } = useRealtime();
  const { preferences: shellPrefs, apply } = useNotificationPreferences();

  const recentNotifications = useMemo(
    () => signals.map(toSignalNotification),
    [signals],
  );

  // Bridge preferences from the shell shape onto the legacy shape.
  const legacyPrefs = useMemo<NotificationSignalPreferences>(() => {
    return normalizeNotificationSignalPreferences({
      ...initialPreferences,
      // Shell prefs override the server seed — they reflect the latest
      // optimistic edits + PATCH responses.
      in_app_toast_enabled: shellPrefs.in_app_toast_enabled,
      notification_sound_enabled: shellPrefs.notification_sound_enabled,
      notification_vibration_enabled: shellPrefs.notification_vibration_enabled,
      high_priority_only: shellPrefs.high_priority_only,
      quiet_hours_enabled: shellPrefs.quiet_hours_enabled,
      quiet_hours_start: shellPrefs.quiet_hours_start,
      quiet_hours_end: shellPrefs.quiet_hours_end,
    });
  }, [initialPreferences, shellPrefs]);

  const updatePreferences = useCallback(
    (updates: Partial<NotificationSignalPreferences>) => {
      // Map a subset of legacy keys onto the shell shape. Division
      // toggles (notification_care, notification_marketplace, etc.) in
      // the legacy shape are managed by the legacy /settings page —
      // the shell uses muted_divisions[] which the new PreferencesPanel
      // writes directly. This bridge intentionally doesn't map them
      // both ways to avoid double-writes.
      apply({
        in_app_toast_enabled: updates.in_app_toast_enabled,
        notification_sound_enabled: updates.notification_sound_enabled,
        notification_vibration_enabled: updates.notification_vibration_enabled,
        high_priority_only: updates.high_priority_only,
        quiet_hours_enabled: updates.quiet_hours_enabled,
        quiet_hours_start: updates.quiet_hours_start,
        quiet_hours_end: updates.quiet_hours_end,
      });
    },
    [apply],
  );

  const refreshFeed = useCallback(async () => {
    await refresh();
  }, [refresh]);

  const value = useMemo<NotificationSignalContextValue>(
    () => ({
      preferences: legacyPrefs,
      audioUnlocked: false,
      loading,
      error,
      unreadCount,
      recentNotifications,
      previewToasts: [],
      updatePreferences,
      dismissToast: () => undefined,
      refreshFeed,
      markNotificationReadLocally: markReadLocally,
      testSound: async () => false,
    }),
    [
      legacyPrefs,
      loading,
      error,
      unreadCount,
      recentNotifications,
      updatePreferences,
      refreshFeed,
      markReadLocally,
    ],
  );

  return (
    <NotificationSignalContext.Provider value={value}>
      {children}
    </NotificationSignalContext.Provider>
  );
}
