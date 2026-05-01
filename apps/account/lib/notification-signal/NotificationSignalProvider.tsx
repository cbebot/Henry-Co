"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import {
  fetchRecentNotifications,
  startNotificationPolling,
  type BellPayload,
  type SignalNotification,
} from "./notification-polling";
import {
  isNotificationAudioUnlocked,
  playNotificationSound,
  testNotificationSound,
  unlockNotificationAudio,
} from "./notification-sound";
import {
  normalizeNotificationSignalPreferences,
  type NotificationSignalPreferences,
} from "./notification-signal-preferences";
import {
  getNotificationPriorityBadge,
  shouldPlayNotificationSound,
  shouldShowNotificationPreview,
  shouldTriggerNotificationVibration,
} from "./notification-signal-rules";
import { triggerNotificationVibration } from "./notification-vibration";
import { createSupabaseBrowser } from "@/lib/supabase/browser";

// V2-NOT-01-B B3.2: Realtime subscription tuning. The push-to-poll trigger
// pattern means a Realtime INSERT/UPDATE simply calls refreshFeed() — the
// server-side localization + brand-resolution pipeline at
// /api/notifications/recent is reused so client and server stay in sync.
const REALTIME_BACKOFF_INITIAL_MS = 1_000;
const REALTIME_BACKOFF_MAX_MS = 30_000;
const REALTIME_REFRESH_DEBOUNCE_MS = 250;

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

type NotificationSignalProviderProps = {
  children: ReactNode;
  initialPreferences?: Record<string, unknown> | null;
};

const MAX_PREVIEW_QUEUE = 6;
const NotificationSignalContext = createContext<NotificationSignalContextValue | null>(null);

export function useNotificationSignalContext() {
  return useContext(NotificationSignalContext);
}

export function NotificationSignalProvider({
  children,
  initialPreferences,
}: NotificationSignalProviderProps) {
  const pathname = usePathname();
  const [preferences, setPreferences] = useState(() =>
    normalizeNotificationSignalPreferences(initialPreferences),
  );
  const [audioUnlocked, setAudioUnlocked] = useState(isNotificationAudioUnlocked);
  const [feed, setFeed] = useState<BellPayload>({ unreadCount: 0, items: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewToasts, setPreviewToasts] = useState<PreviewToastItem[]>([]);
  const hasMountedPathRef = useRef(false);
  const signaledIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    setPreferences(normalizeNotificationSignalPreferences(initialPreferences));
  }, [initialPreferences]);

  const refreshFeed = useCallback(async () => {
    const payload = await fetchRecentNotifications();
    if (!payload) {
      setError("Unable to load notifications.");
      setLoading(false);
      return;
    }

    setFeed(payload);
    setError(null);
    setLoading(false);
  }, []);

  const updatePreferences = useCallback(
    (updates: Partial<NotificationSignalPreferences>) => {
      setPreferences((current) =>
        normalizeNotificationSignalPreferences({
          ...current,
          ...updates,
        }),
      );
    },
    [],
  );

  const dismissToast = useCallback((toastId: string) => {
    setPreviewToasts((current) => current.filter((item) => item.toastId !== toastId));
  }, []);

  const markNotificationReadLocally = useCallback((notificationId: string) => {
    setFeed((current) => ({
      unreadCount: Math.max(
        0,
        current.unreadCount - (current.items.some((item) => item.id === notificationId && !item.is_read) ? 1 : 0),
      ),
      items: current.items.map((item) =>
        item.id === notificationId ? { ...item, is_read: true } : item,
      ),
    }));
    setPreviewToasts((current) => current.filter((item) => item.id !== notificationId));
  }, []);

  const handleAudioInteraction = useEffectEvent(async () => {
    if (audioUnlocked) return;

    const unlocked = await unlockNotificationAudio();
    if (unlocked) {
      setAudioUnlocked(true);
    }
  });

  useEffect(() => {
    if (audioUnlocked) return;

    document.addEventListener("click", handleAudioInteraction, { passive: true });
    document.addEventListener("keydown", handleAudioInteraction, { passive: true });
    document.addEventListener("touchstart", handleAudioInteraction, { passive: true });

    return () => {
      document.removeEventListener("click", handleAudioInteraction);
      document.removeEventListener("keydown", handleAudioInteraction);
      document.removeEventListener("touchstart", handleAudioInteraction);
    };
  }, [audioUnlocked]);

  const handleSnapshot = useEffectEvent((payload: BellPayload) => {
    setFeed(payload);
    setLoading(false);
    setError(null);
  });

  const handleNewNotifications = useEffectEvent(async (notifications: SignalNotification[]) => {
    const unseenNotifications = notifications.filter((notification) => {
      if (signaledIdsRef.current.has(notification.id)) {
        return false;
      }

      signaledIdsRef.current.add(notification.id);
      return true;
    });

    if (unseenNotifications.length === 0) {
      return;
    }

    if (signaledIdsRef.current.size > 180) {
      signaledIdsRef.current = new Set([
        ...feed.items.slice(0, 32).map((item) => item.id),
        ...unseenNotifications.slice(-16).map((item) => item.id),
      ]);
    }

    const shouldPlaySoundForBatch =
      audioUnlocked &&
      unseenNotifications.some((notification) =>
        shouldPlayNotificationSound(notification, preferences),
      );
    const shouldVibrateForBatch = unseenNotifications.some((notification) =>
      shouldTriggerNotificationVibration(notification, preferences),
    );

    if (shouldPlaySoundForBatch) {
      await playNotificationSound();
    }

    if (shouldVibrateForBatch) {
      triggerNotificationVibration();
    }

    setPreviewToasts((current) => {
      const next = [...current];

      for (const notification of unseenNotifications) {
        if (!shouldShowNotificationPreview(notification, preferences)) {
          continue;
        }

        const toastId = `notification-toast:${notification.id}`;
        if (next.some((item) => item.toastId === toastId)) {
          continue;
        }

        next.push({
          ...notification,
          toastId,
          shownAt: Date.now(),
          priorityBadge: getNotificationPriorityBadge(notification),
        });
      }

      return next.slice(-MAX_PREVIEW_QUEUE);
    });
  });

  useEffect(() => {
    const stopPolling = startNotificationPolling({
      onSnapshot: handleSnapshot,
      onNewNotifications: handleNewNotifications,
      onError: () => {
        setError("Unable to load notifications.");
        setLoading(false);
      },
    });

    return stopPolling;
  }, []);

  // V2-NOT-01-B B3.2: Realtime push channel. When customer_notifications
  // changes for the current user, refresh the feed via the existing REST
  // path so we keep one localization pipeline. Polling continues in the
  // background as a fallback for missed events during disconnections.
  //
  // RLS on customer_notifications restricts SELECT to user_id = auth.uid(),
  // and Supabase Realtime applies SELECT-side RLS to the subscription
  // stream. The explicit user_id=eq.<userId> filter below is
  // belt-and-braces — if RLS were ever misconfigured, the channel filter
  // still scopes events to the current user.
  useEffect(() => {
    let cancelled = false;
    let channel: ReturnType<ReturnType<typeof createSupabaseBrowser>["channel"]> | null = null;
    let backoffMs = REALTIME_BACKOFF_INITIAL_MS;
    let retryTimer: number | null = null;
    let lastRefreshAt = 0;

    const debouncedRefresh = () => {
      const now = Date.now();
      if (now - lastRefreshAt < REALTIME_REFRESH_DEBOUNCE_MS) return;
      lastRefreshAt = now;
      void refreshFeed();
    };

    const teardown = () => {
      if (channel) {
        const supabase = createSupabaseBrowser();
        void supabase.removeChannel(channel);
        channel = null;
      }
      if (retryTimer !== null) {
        window.clearTimeout(retryTimer);
        retryTimer = null;
      }
    };

    const start = async () => {
      if (cancelled) return;
      const supabase = createSupabaseBrowser();
      const { data, error: authError } = await supabase.auth.getUser();
      if (cancelled) return;
      if (authError || !data.user) {
        // Anonymous session — Realtime cannot scope to a user. Polling
        // is the only delivery path. No retry; auth state changes will
        // remount this provider.
        return;
      }
      const userId = data.user.id;
      const filter = `user_id=eq.${userId}`;

      channel = supabase
        .channel(`customer_notifications:user:${userId}`)
        .on(
          // @ts-expect-error - "postgres_changes" is the canonical Supabase
          // Realtime event name; the SDK type doesn't always expose it
          // when DB types aren't generated, but the runtime accepts it.
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "customer_notifications", filter },
          () => debouncedRefresh(),
        )
        .on(
          // @ts-expect-error - same as above
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "customer_notifications", filter },
          () => debouncedRefresh(),
        )
        .subscribe((status) => {
          if (cancelled) return;
          if (status === "SUBSCRIBED") {
            backoffMs = REALTIME_BACKOFF_INITIAL_MS;
            return;
          }
          if (status === "CLOSED" || status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
            teardown();
            retryTimer = window.setTimeout(() => {
              backoffMs = Math.min(backoffMs * 2, REALTIME_BACKOFF_MAX_MS);
              void start();
            }, backoffMs);
          }
        });
    };

    void start();

    return () => {
      cancelled = true;
      teardown();
    };
  }, [refreshFeed]);

  useEffect(() => {
    if (!hasMountedPathRef.current) {
      hasMountedPathRef.current = true;
      return;
    }

    void refreshFeed();
  }, [pathname, refreshFeed]);

  useEffect(() => {
    setPreviewToasts((current) =>
      current.filter((item) => shouldShowNotificationPreview(item, preferences)),
    );
  }, [preferences]);

  const handleTestSound = useCallback(async () => {
    const played = await testNotificationSound();
    setAudioUnlocked(isNotificationAudioUnlocked());
    return played;
  }, []);

  return (
    <NotificationSignalContext.Provider
      value={{
        preferences,
        audioUnlocked,
        loading,
        error,
        unreadCount: feed.unreadCount,
        recentNotifications: feed.items,
        previewToasts,
        updatePreferences,
        dismissToast,
        refreshFeed,
        markNotificationReadLocally,
        testSound: handleTestSound,
      }}
    >
      {children}
    </NotificationSignalContext.Provider>
  );
}
