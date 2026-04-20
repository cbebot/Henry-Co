export type SignalNotification = {
  id: string;
  title: string;
  body: string;
  created_at: string;
  is_read: boolean;
  message_href: string;
  related_url: string | null;
  division?: string | null;
  category?: string | null;
  priority?: string | null;
  reference_type?: string | null;
  source: {
    key: string;
    label: string;
    accent: string;
    logoUrl: string | null;
  };
};

export type BellPayload = {
  unreadCount: number;
  items: SignalNotification[];
};

export type NotificationPollingOptions = {
  intervalMs?: number;
  pauseWhenHidden?: boolean;
  onNewNotifications: (notifications: SignalNotification[]) => void;
  onSnapshot?: (payload: BellPayload) => void;
  onUnreadCountChange?: (count: number) => void;
  onError?: (error: Error) => void;
};

type PollingState = {
  initialized: boolean;
  knownIds: Set<string>;
  lastSeenCreatedAt: string | null;
  timerId: ReturnType<typeof setTimeout> | null;
  stopped: boolean;
  inFlight: boolean;
};

const DEFAULT_INTERVAL_MS = 30_000;
const API_PATH = "/api/notifications/recent?limit=8";
const MAX_KNOWN_IDS = 80;

export async function fetchRecentNotifications() {
  try {
    const response = await fetch(API_PATH, {
      method: "GET",
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as BellPayload;
  } catch {
    return null;
  }
}

function updateKnownNotifications(items: SignalNotification[], state: PollingState) {
  const nextKnownIds = new Set<string>();

  for (const item of items) {
    nextKnownIds.add(item.id);
  }

  for (const itemId of state.knownIds) {
    if (nextKnownIds.size >= MAX_KNOWN_IDS) break;
    nextKnownIds.add(itemId);
  }

  state.knownIds = nextKnownIds;
  state.lastSeenCreatedAt = items[0]?.created_at ?? state.lastSeenCreatedAt;
}

function filterNewNotifications(items: SignalNotification[], state: PollingState) {
  if (!state.initialized) return [] as SignalNotification[];

  return items
    .filter((item) => {
      if (item.is_read) return false;
      if (state.knownIds.has(item.id)) return false;
      if (state.lastSeenCreatedAt && item.created_at < state.lastSeenCreatedAt) return false;
      return true;
    })
    .sort(
      (left, right) =>
        new Date(left.created_at).getTime() - new Date(right.created_at).getTime(),
    );
}

export function startNotificationPolling(options: NotificationPollingOptions) {
  const intervalMs = options.intervalMs ?? DEFAULT_INTERVAL_MS;
  const pauseWhenHidden = options.pauseWhenHidden ?? true;
  const state: PollingState = {
    initialized: false,
    knownIds: new Set<string>(),
    lastSeenCreatedAt: null,
    timerId: null,
    stopped: false,
    inFlight: false,
  };

  const scheduleNextPoll = () => {
    if (state.stopped) return;

    if (state.timerId) {
      clearTimeout(state.timerId);
    }

    state.timerId = setTimeout(() => {
      void poll();
    }, intervalMs);
  };

  const poll = async () => {
    if (state.stopped || state.inFlight) {
      return;
    }

    if (pauseWhenHidden && typeof document !== "undefined" && document.hidden) {
      scheduleNextPoll();
      return;
    }

    state.inFlight = true;

    try {
      const payload = await fetchRecentNotifications();
      if (!payload) {
        options.onError?.(new Error("Notification poll failed"));
        return;
      }

      options.onSnapshot?.(payload);
      options.onUnreadCountChange?.(payload.unreadCount);

      if (!state.initialized) {
        updateKnownNotifications(payload.items, state);
        state.initialized = true;
        return;
      }

      const newItems = filterNewNotifications(payload.items, state);
      updateKnownNotifications(payload.items, state);

      if (newItems.length > 0) {
        options.onNewNotifications(newItems);
      }
    } finally {
      state.inFlight = false;
      scheduleNextPoll();
    }
  };

  const handleVisibilityChange = () => {
    if (document.visibilityState === "visible") {
      void poll();
    }
  };

  void poll();

  if (pauseWhenHidden && typeof document !== "undefined") {
    document.addEventListener("visibilitychange", handleVisibilityChange);
  }

  return () => {
    state.stopped = true;

    if (state.timerId) {
      clearTimeout(state.timerId);
      state.timerId = null;
    }

    if (pauseWhenHidden && typeof document !== "undefined") {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    }
  };
}
