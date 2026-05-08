"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { UnifiedViewer } from "@henryco/auth";

import {
  DEFAULT_REALTIME_PREFERENCES,
  type ChannelStatus,
  type RealtimeContextValue,
  type RealtimePreferences,
  type RealtimeSignal,
  type SignalAudience,
} from "./realtime-types";
import {
  DEFAULT_SOURCE_CONFIG,
  type HydrationPayload,
  type PreferencesPayload,
  type RealtimeSourceConfig,
} from "./realtime-data-source";

/**
 * SupabaseRealtimeProvider — single subscription at the shell root.
 *
 * Closes anti-pattern #9: the shell mounts ONE customer channel + (when
 * the viewer holds staff access) ONE staff content channel + ONE staff
 * state channel. Widgets fan out via the React context exposed by
 * `useRealtime()` and the filter-aware hooks in `./realtime-hooks`.
 *
 * The provider owns:
 *   - the live signal list (cap MAX_RETAINED, audience-flat)
 *   - unread counts per audience
 *   - preferences (quiet hours, muted divisions, muted event types,
 *     email-fallback enabled, in-app toast enabled, etc.)
 *   - the invalidation tag (monotonic counter, bumped on every event)
 *
 * The provider does NOT own:
 *   - persisting preference edits (host endpoints handle that;
 *     `setPreferencesLocally` only mutates the in-memory copy)
 *   - REST endpoint shapes — the host supplies URLs via `sources`.
 *
 * RLS posture (verified against
 * apps/hub/supabase/migrations/20260501130000_*.sql and
 * apps/hub/supabase/migrations/20260502120000_*.sql):
 *   - customer_notifications: SELECT scoped to auth.uid() = user_id.
 *     Subscription filter `user_id=eq.<userId>` is defense-in-depth.
 *   - staff_notifications: RLS via is_staff_in() — no client-side
 *     channel filter (RLS is the isolator).
 *   - staff_notification_states: SELECT/INSERT/UPDATE own only;
 *     channel filter `recipient_user_id=eq.<userId>`.
 */

/**
 * Minimum surface of `@supabase/supabase-js` the spine actually
 * exercises. Typed loosely (return values are `unknown` where we only
 * use them for chaining) so a real Supabase client conforms by
 * structural typing without callers needing `as never` / `as unknown`
 * casts at the call site. Keeps `@supabase/supabase-js` out of the
 * package's import graph; the host app remains the only place that
 * imports the actual SDK.
 */
type SupabaseLike = {
  channel: (name: string) => RealtimeChannelLike;
  removeChannel: (channel: RealtimeChannelLike) => unknown;
};

type RealtimeChannelLike = {
  on: (
    event: string,
    options: { event: string; schema: string; table: string; filter?: string },
    handler: (payload: {
      new?: Record<string, unknown>;
      old?: Record<string, unknown>;
      eventType?: string;
    }) => void,
  ) => RealtimeChannelLike;
  subscribe: (callback?: (status: string) => void) => RealtimeChannelLike;
};

const MAX_RETAINED = 50;
const REALTIME_BACKOFF_INITIAL_MS = 1_000;
const REALTIME_BACKOFF_MAX_MS = 30_000;
const REALTIME_REFRESH_DEBOUNCE_MS = 250;
const POLL_FALLBACK_INTERVAL_MS = 30_000;

const RealtimeContext = createContext<RealtimeContextValue | null>(null);

export type SupabaseRealtimeProviderProps = {
  children: ReactNode;
  /**
   * The unified viewer. The provider subscribes to `customer_notifications`
   * filtered by `viewer.user.id` and (when `viewer.access.hasStaffAccess`
   * is true) to `staff_notifications` + `staff_notification_states`.
   *
   * Optional — when omitted, the provider operates in degraded mode:
   * no subscriptions, but `useRealtime()` still returns a stable shape
   * so consumer components don't crash on unauthenticated routes.
   */
  viewer?: UnifiedViewer | null;
  /**
   * Browser Supabase client factory. The host app passes its own
   * `createSupabaseBrowser()` (typically from `lib/supabase/browser.ts`)
   * so the package stays free of `@supabase/ssr` direct imports — that
   * keeps the package portable across apps that may use different
   * Supabase clients.
   *
   * Returns null in environments without a configured Supabase client
   * (e.g. SSR, tests). The provider operates in degraded mode in that
   * case (polling only, no realtime).
   */
  getSupabase?: () => SupabaseLike | null;
  /**
   * REST endpoint configuration. Defaults match apps/account; workspace
   * apps override.
   */
  sources?: RealtimeSourceConfig;
  /**
   * Preferences seed — host can pass a server-side read of
   * `customer_preferences` to avoid an initial fetch flash.
   */
  initialPreferences?: Partial<RealtimePreferences> | null;
  /**
   * Disable polling fallback (defaults to enabled; set false in tests
   * to keep them deterministic).
   */
  disablePolling?: boolean;
};

function normalizeHHMM(value: string): string {
  const trimmed = value.trim();
  const m = trimmed.match(/^([01]\d|2[0-3]):([0-5]\d)(?::[0-5]\d)?$/);
  return m ? `${m[1]}:${m[2]}` : DEFAULT_REALTIME_PREFERENCES.quiet_hours_start;
}

function normalizePreferences(
  raw: Partial<RealtimePreferences> | null | undefined,
): RealtimePreferences {
  return {
    quiet_hours_enabled: Boolean(raw?.quiet_hours_enabled),
    quiet_hours_start:
      typeof raw?.quiet_hours_start === "string"
        ? normalizeHHMM(raw.quiet_hours_start)
        : DEFAULT_REALTIME_PREFERENCES.quiet_hours_start,
    quiet_hours_end:
      typeof raw?.quiet_hours_end === "string"
        ? normalizeHHMM(raw.quiet_hours_end)
        : DEFAULT_REALTIME_PREFERENCES.quiet_hours_end,
    quiet_hours_timezone:
      typeof raw?.quiet_hours_timezone === "string" ? raw.quiet_hours_timezone : null,
    muted_divisions: Array.isArray(raw?.muted_divisions)
      ? Object.freeze([...(raw.muted_divisions as string[])])
      : DEFAULT_REALTIME_PREFERENCES.muted_divisions,
    muted_event_types: Array.isArray(raw?.muted_event_types)
      ? Object.freeze([...(raw.muted_event_types as string[])])
      : DEFAULT_REALTIME_PREFERENCES.muted_event_types,
    email_fallback_enabled: raw?.email_fallback_enabled ?? true,
    email_fallback_delay_hours:
      typeof raw?.email_fallback_delay_hours === "number"
        ? raw.email_fallback_delay_hours
        : DEFAULT_REALTIME_PREFERENCES.email_fallback_delay_hours,
    in_app_toast_enabled: raw?.in_app_toast_enabled ?? true,
    notification_sound_enabled: Boolean(raw?.notification_sound_enabled),
    notification_vibration_enabled: Boolean(raw?.notification_vibration_enabled),
    high_priority_only: Boolean(raw?.high_priority_only),
  };
}

function projectHydrationItem(
  raw: unknown,
  audience: SignalAudience,
): RealtimeSignal | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const id = typeof row.id === "string" ? row.id : null;
  if (!id) return null;
  const source =
    row.source && typeof row.source === "object"
      ? (row.source as Record<string, unknown>)
      : null;
  return {
    id,
    audience,
    division: typeof row.division === "string" ? row.division : null,
    category: typeof row.category === "string" ? row.category : null,
    priority: typeof row.priority === "string" ? row.priority : null,
    title: typeof row.title === "string" ? row.title : "",
    body: typeof row.body === "string" ? row.body : null,
    action_url: typeof row.action_url === "string" ? row.action_url : null,
    message_href:
      typeof row.message_href === "string"
        ? row.message_href
        : `/messages/notification/${encodeURIComponent(id)}`,
    is_read: row.is_read === true,
    archived_at: typeof row.archived_at === "string" ? row.archived_at : null,
    deleted_at: typeof row.deleted_at === "string" ? row.deleted_at : null,
    created_at:
      typeof row.created_at === "string" ? row.created_at : new Date().toISOString(),
    email_dispatched_at:
      typeof row.email_dispatched_at === "string" ? row.email_dispatched_at : null,
    source: source
      ? {
          key: typeof source.key === "string" ? source.key : "system",
          label: typeof source.label === "string" ? source.label : "HenryCo",
          accent: typeof source.accent === "string" ? source.accent : "#111827",
          logoUrl: typeof source.logoUrl === "string" ? source.logoUrl : null,
        }
      : null,
  };
}

/**
 * Merge a fresh hydration into the local signal store.
 *
 * `trustedAudiences` lists the audience(s) whose fetch resolved
 * authoritatively (HTTP OK + parseable body). For those audiences the
 * incoming list is the source of truth: any locally-cached row of that
 * audience that is NOT in incoming is dropped. This is what lets a
 * soft-deleted notification disappear from the bell + inbox the moment
 * the recent endpoint stops returning it (the recent endpoint filters
 * `deleted_at IS NOT NULL` out, so without this drop the stale row
 * would linger until 50 newer notifications evicted it).
 *
 * Audiences NOT in `trustedAudiences` (typically because their fetch
 * failed) keep their cached rows so a network blip doesn't blank the
 * UI.
 *
 * Within trusted audiences, incoming wins on ID collision so the freshly
 * projected row (with the latest `is_read`, `email_dispatched_at`, etc.)
 * replaces the stale copy.
 */
function mergeSignals(
  current: ReadonlyArray<RealtimeSignal>,
  incoming: ReadonlyArray<RealtimeSignal>,
  trustedAudiences: ReadonlySet<SignalAudience>,
): ReadonlyArray<RealtimeSignal> {
  const byId = new Map<string, RealtimeSignal>();
  for (const item of incoming) {
    byId.set(item.id, item);
  }
  for (const item of current) {
    if (byId.has(item.id)) continue;
    if (trustedAudiences.has(item.audience)) {
      // The incoming hydration for this audience succeeded but did not
      // include this row → it has been removed (soft-delete, archive,
      // age-out beyond the visible window). Drop it from local.
      continue;
    }
    byId.set(item.id, item);
  }
  return Object.freeze(
    Array.from(byId.values())
      .sort((a, b) => {
        const timeA = new Date(a.created_at).getTime();
        const timeB = new Date(b.created_at).getTime();
        return timeB - timeA;
      })
      .slice(0, MAX_RETAINED),
  );
}

function deriveCounts(signals: ReadonlyArray<RealtimeSignal>) {
  let customerUnread = 0;
  let staffUnread = 0;
  for (const s of signals) {
    if (s.is_read || s.archived_at || s.deleted_at) continue;
    if (s.audience === "customer") customerUnread += 1;
    else staffUnread += 1;
  }
  return { customerUnread, staffUnread };
}

export function SupabaseRealtimeProvider({
  children,
  viewer,
  getSupabase,
  sources,
  initialPreferences,
  disablePolling,
}: SupabaseRealtimeProviderProps) {
  const config = useMemo(
    () => ({ ...DEFAULT_SOURCE_CONFIG, ...(sources ?? {}) }),
    [sources],
  );
  const [signals, setSignals] = useState<ReadonlyArray<RealtimeSignal>>(() =>
    Object.freeze([]),
  );
  const [loading, setLoading] = useState(Boolean(viewer?.user.id));
  const [error, setError] = useState<string | null>(null);
  const [customerStatus, setCustomerStatus] = useState<ChannelStatus>(
    viewer?.user.id ? "idle" : "disabled",
  );
  const [staffStatus, setStaffStatus] = useState<ChannelStatus>(
    viewer?.access.hasStaffAccess ? "idle" : "disabled",
  );
  const [preferences, setPreferences] = useState<RealtimePreferences>(() =>
    normalizePreferences(initialPreferences ?? null),
  );
  const [invalidationTag, setInvalidationTag] = useState(0);
  const [lastSignalAt, setLastSignalAt] = useState(0);

  const lastRefreshAtRef = useRef(0);
  const subscribersRef = useRef(
    new Map<string, Set<(signal: RealtimeSignal) => void>>(),
  );
  const supabaseRef = useRef<SupabaseLike | null>(null);
  // Stash the host-supplied factory in a ref so the realtime channel
  // effects don't re-subscribe when the parent re-renders with a fresh
  // arrow identity. The factory is read once at first connect; thereafter
  // the cached `supabaseRef.current` is reused. Updating the ref via a
  // `useEffect` keeps the stash in sync if the host swaps factories at
  // runtime (rare, e.g. test harness swaps).
  const getSupabaseRef = useRef<typeof getSupabase>(getSupabase);
  useEffect(() => {
    getSupabaseRef.current = getSupabase;
  }, [getSupabase]);

  // Hydration: GET the customer + (when staff) staff endpoints, project
  // into RealtimeSignal[]. Refresh runs on mount, on every channel event
  // (debounced), and from the polling fallback.
  const hydrateOnce = useCallback(async () => {
    if (!viewer?.user.id) return;
    try {
      type Bucket = { audience: SignalAudience; items: RealtimeSignal[]; ok: boolean };
      const reqs: Array<Promise<Bucket>> = [];
      reqs.push(
        fetch(config.customerHydrateUrl, { method: "GET", cache: "no-store" })
          .then(async (r): Promise<Bucket> => {
            if (!r.ok) return { audience: "customer", items: [], ok: false };
            const p = (await r.json()) as HydrationPayload;
            const items = (p?.items ?? [])
              .map((it) => projectHydrationItem(it, "customer"))
              .filter((x): x is RealtimeSignal => x !== null);
            return { audience: "customer", items, ok: true };
          })
          .catch(() => ({ audience: "customer", items: [], ok: false })),
      );
      if (viewer.access.hasStaffAccess) {
        reqs.push(
          fetch(config.staffHydrateUrl, { method: "GET", cache: "no-store" })
            .then(async (r): Promise<Bucket> => {
              if (!r.ok) return { audience: "staff", items: [], ok: false };
              const p = (await r.json()) as HydrationPayload;
              const items = (p?.items ?? [])
                .map((it) => projectHydrationItem(it, "staff"))
                .filter((x): x is RealtimeSignal => x !== null);
              return { audience: "staff", items, ok: true };
            })
            .catch(() => ({ audience: "staff", items: [], ok: false })),
        );
      }
      const buckets = await Promise.all(reqs);
      const combined = buckets.flatMap((b) => b.items);
      const trusted = new Set<SignalAudience>(
        buckets.filter((b) => b.ok).map((b) => b.audience),
      );
      setSignals((current) => mergeSignals(current, combined, trusted));
      setError(null);
      setLoading(false);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to load notifications.";
      setError(message);
      setLoading(false);
    }
  }, [viewer?.user.id, viewer?.access.hasStaffAccess, config]);

  // Stash the latest hydrateOnce in a ref so the realtime + polling
  // effects don't tear down when the function identity changes.
  // debouncedRefresh becomes a stable callback that simply reads the
  // ref. This is the React equivalent of "always call the latest
  // closure" without inflating effect deps.
  const hydrateOnceRef = useRef(hydrateOnce);
  useEffect(() => {
    hydrateOnceRef.current = hydrateOnce;
  }, [hydrateOnce]);

  const debouncedRefresh = useCallback(() => {
    const now = Date.now();
    if (now - lastRefreshAtRef.current < REALTIME_REFRESH_DEBOUNCE_MS) return;
    lastRefreshAtRef.current = now;
    setLastSignalAt(now);
    setInvalidationTag((t) => t + 1);
    void hydrateOnceRef.current();
  }, []);

  // Hydrate preferences once on mount.
  useEffect(() => {
    if (!viewer?.user.id) return;
    let cancelled = false;
    fetch(config.preferencesUrl, { method: "GET", cache: "no-store" })
      .then((r) => (r.ok ? (r.json() as Promise<PreferencesPayload>) : null))
      .then((payload) => {
        if (cancelled) return;
        if (payload?.preferences) {
          setPreferences(normalizePreferences(payload.preferences));
        }
      })
      .catch(() => {
        // Silently degrade; defaults already applied.
      });
    return () => {
      cancelled = true;
    };
  }, [viewer?.user.id, config.preferencesUrl]);

  // Initial hydration.
  useEffect(() => {
    if (!viewer?.user.id) return;
    void hydrateOnce();
  }, [viewer?.user.id, hydrateOnce]);

  // Customer realtime channel — single subscription, exponential backoff.
  // Effect deps intentionally exclude `getSupabase` and `debouncedRefresh`
  // so a parent re-render that hands fresh function identities does NOT
  // tear down + reconnect the channel. The factory is read from
  // `getSupabaseRef`; refreshes go through `debouncedRefresh` which
  // itself reads `hydrateOnceRef`.
  useEffect(() => {
    if (!viewer?.user.id) return;
    const factory = getSupabaseRef.current;
    if (!factory) return;
    let cancelled = false;
    let backoffMs = REALTIME_BACKOFF_INITIAL_MS;
    let retryTimer: number | null = null;
    let channel: RealtimeChannelLike | null = null;

    const teardown = () => {
      if (channel && supabaseRef.current) {
        try {
          supabaseRef.current.removeChannel(channel);
        } catch {
          /* ignore */
        }
        channel = null;
      }
      if (retryTimer !== null) {
        window.clearTimeout(retryTimer);
        retryTimer = null;
      }
    };

    const handleUpdate = (payload: { new?: Record<string, unknown> }) => {
      // Soft-delete fast path: if the UPDATE event tells us the row has
      // been deleted, splice it out of local state immediately. The
      // subsequent debounced refresh re-confirms; this just removes the
      // visible-in-UI flicker between the click and the refresh.
      const row = payload?.new;
      if (row && typeof row.id === "string" && typeof row.deleted_at === "string") {
        const id = row.id;
        setSignals((current) =>
          Object.freeze(current.filter((s) => s.id !== id)),
        );
      }
      debouncedRefresh();
    };

    const start = () => {
      if (cancelled) return;
      let supabase = supabaseRef.current;
      if (!supabase) {
        supabase = factory();
        if (!supabase) {
          setCustomerStatus("disabled");
          return;
        }
        supabaseRef.current = supabase;
      }
      const userId = viewer.user.id;
      const filter = `user_id=eq.${userId}`;
      setCustomerStatus("connecting");

      channel = supabase
        .channel(`customer_notifications:user:${userId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "customer_notifications",
            filter,
          },
          () => debouncedRefresh(),
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "customer_notifications",
            filter,
          },
          handleUpdate,
        )
        .subscribe((status: string) => {
          if (cancelled) return;
          if (status === "SUBSCRIBED") {
            setCustomerStatus("subscribed");
            backoffMs = REALTIME_BACKOFF_INITIAL_MS;
            return;
          }
          if (
            status === "CLOSED" ||
            status === "CHANNEL_ERROR" ||
            status === "TIMED_OUT"
          ) {
            setCustomerStatus(status === "CLOSED" ? "closed" : "error");
            teardown();
            retryTimer = window.setTimeout(() => {
              backoffMs = Math.min(backoffMs * 2, REALTIME_BACKOFF_MAX_MS);
              start();
            }, backoffMs);
          }
        });
    };

    start();

    return () => {
      cancelled = true;
      teardown();
    };
  }, [viewer?.user.id, debouncedRefresh]);

  // Staff realtime channels — gated by hasStaffAccess.
  // Same stable-deps approach as the customer effect.
  useEffect(() => {
    if (!viewer?.user.id || !viewer.access.hasStaffAccess) return;
    const factory = getSupabaseRef.current;
    if (!factory) return;
    let cancelled = false;
    let backoffMs = REALTIME_BACKOFF_INITIAL_MS;
    let retryTimer: number | null = null;
    let contentChannel: RealtimeChannelLike | null = null;
    let stateChannel: RealtimeChannelLike | null = null;

    const teardown = () => {
      const sb = supabaseRef.current;
      if (sb) {
        if (contentChannel) {
          try {
            sb.removeChannel(contentChannel);
          } catch {
            /* ignore */
          }
        }
        if (stateChannel) {
          try {
            sb.removeChannel(stateChannel);
          } catch {
            /* ignore */
          }
        }
      }
      contentChannel = null;
      stateChannel = null;
      if (retryTimer !== null) {
        window.clearTimeout(retryTimer);
        retryTimer = null;
      }
    };

    const start = () => {
      if (cancelled) return;
      let supabase = supabaseRef.current;
      if (!supabase) {
        supabase = factory();
        if (!supabase) {
          setStaffStatus("disabled");
          return;
        }
        supabaseRef.current = supabase;
      }
      const userId = viewer.user.id;
      setStaffStatus("connecting");

      // Content rows: RLS isolates via is_staff_in() — no client filter.
      contentChannel = supabase
        .channel(`staff_notifications:user:${userId}`)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "staff_notifications" },
          () => debouncedRefresh(),
        )
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "staff_notifications" },
          () => debouncedRefresh(),
        )
        .subscribe((status: string) => {
          if (cancelled) return;
          if (status === "SUBSCRIBED") {
            setStaffStatus("subscribed");
            backoffMs = REALTIME_BACKOFF_INITIAL_MS;
            return;
          }
          if (
            status === "CLOSED" ||
            status === "CHANNEL_ERROR" ||
            status === "TIMED_OUT"
          ) {
            setStaffStatus(status === "CLOSED" ? "closed" : "error");
            teardown();
            retryTimer = window.setTimeout(() => {
              backoffMs = Math.min(backoffMs * 2, REALTIME_BACKOFF_MAX_MS);
              start();
            }, backoffMs);
          }
        });

      // State rows: own-only by RLS; channel filter is belt-and-braces.
      const stateFilter = `recipient_user_id=eq.${userId}`;
      stateChannel = supabase
        .channel(`staff_notification_states:user:${userId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "staff_notification_states",
            filter: stateFilter,
          },
          () => debouncedRefresh(),
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "staff_notification_states",
            filter: stateFilter,
          },
          () => debouncedRefresh(),
        )
        .subscribe();
    };

    start();

    return () => {
      cancelled = true;
      teardown();
    };
  }, [viewer?.user.id, viewer?.access.hasStaffAccess, debouncedRefresh]);

  // Polling fallback — covers the gap when Realtime drops events during
  // disconnects. Pauses while tab hidden. Uses the hydrate ref so this
  // effect doesn't tear down on every hydrateOnce identity change.
  useEffect(() => {
    if (!viewer?.user.id || disablePolling) return;
    let cancelled = false;
    let timer: number | null = null;

    const tick = () => {
      if (cancelled) return;
      if (typeof document !== "undefined" && document.hidden) {
        timer = window.setTimeout(tick, POLL_FALLBACK_INTERVAL_MS);
        return;
      }
      void hydrateOnceRef.current();
      timer = window.setTimeout(tick, POLL_FALLBACK_INTERVAL_MS);
    };

    timer = window.setTimeout(tick, POLL_FALLBACK_INTERVAL_MS);
    const onVisibility = () => {
      if (typeof document !== "undefined" && !document.hidden) {
        void hydrateOnceRef.current();
      }
    };
    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", onVisibility);
    }

    return () => {
      cancelled = true;
      if (timer !== null) window.clearTimeout(timer);
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", onVisibility);
      }
    };
  }, [viewer?.user.id, disablePolling]);

  const markReadLocally = useCallback((id: string) => {
    setSignals((current) => {
      let touched = false;
      const next = current.map((s) => {
        if (s.id !== id || s.is_read) return s;
        touched = true;
        return { ...s, is_read: true };
      });
      return touched ? Object.freeze(next) : current;
    });
  }, []);

  const setPreferencesLocally = useCallback(
    (updates: Partial<RealtimePreferences>) => {
      setPreferences((current) => normalizePreferences({ ...current, ...updates }));
    },
    [],
  );

  const subscribe = useCallback(
    (eventType: string, handler: (signal: RealtimeSignal) => void) => {
      let bucket = subscribersRef.current.get(eventType);
      if (!bucket) {
        bucket = new Set();
        subscribersRef.current.set(eventType, bucket);
      }
      bucket.add(handler);
      return () => {
        const current = subscribersRef.current.get(eventType);
        if (current) {
          current.delete(handler);
          if (current.size === 0) subscribersRef.current.delete(eventType);
        }
      };
    },
    [],
  );

  const refresh = useCallback(async () => {
    await hydrateOnce();
  }, [hydrateOnce]);

  const counts = useMemo(() => deriveCounts(signals), [signals]);

  const value = useMemo<RealtimeContextValue>(
    () => ({
      lastSignalAt,
      invalidationTag,
      signals,
      customerUnread: counts.customerUnread,
      staffUnread: counts.staffUnread,
      loading,
      error,
      customerChannelStatus: customerStatus,
      staffChannelStatus: staffStatus,
      preferences,
      refresh,
      markReadLocally,
      setPreferencesLocally,
      subscribe,
    }),
    [
      lastSignalAt,
      invalidationTag,
      signals,
      counts.customerUnread,
      counts.staffUnread,
      loading,
      error,
      customerStatus,
      staffStatus,
      preferences,
      refresh,
      markReadLocally,
      setPreferencesLocally,
      subscribe,
    ],
  );

  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
}

/**
 * Hook for widgets to consume the realtime spine.
 *
 * Throws if called outside a `<SupabaseRealtimeProvider>` so missed
 * provider mounts surface as build-time / first-render errors instead
 * of silent stale-data bugs.
 */
export function useRealtime(): RealtimeContextValue {
  const ctx = useContext(RealtimeContext);
  if (!ctx) {
    throw new Error(
      "useRealtime() must be called inside <SupabaseRealtimeProvider>. " +
        "Mount the provider at the shell layout root (apps/account/app/(account)/layout.tsx).",
    );
  }
  return ctx;
}

/**
 * Variant that returns null when no provider is mounted — used by
 * components that may render outside the shell (e.g. a public page that
 * embeds a notification preview).
 */
export function useRealtimeOptional(): RealtimeContextValue | null {
  return useContext(RealtimeContext);
}
