"use client";

/**
 * Filter-aware hooks built on top of `useRealtime()`.
 *
 * These satisfy the DASH-6 contract:
 *   - useNotificationSignal(filter?) — current notifications filtered by
 *     audience / category / division / severity / unread.
 *   - useTaskSignal(filter?) — task signals (cross-module activity) — for
 *     DASH-6 the implementation falls back to filtering customer-audience
 *     signals on category prefix `task.`. Owner-side and full activity
 *     channel come in DASH-8 / DASH-4 respectively.
 *   - useSignalInvalidation() — exposes a tag that DASH-4 Smart Home
 *     cache() honors via deps re-fetch.
 *   - useNotificationPreferences() — read + locally-update; persistence
 *     is the host's job via the existing /api/notifications/preferences
 *     PATCH endpoint.
 *
 * All four are pure derivations from `useRealtime()` — no extra
 * subscriptions, no extra state. Preserves anti-pattern #9 (single
 * subscription per session).
 */

import { useMemo } from "react";

import { useRealtime } from "./supabase-realtime-provider";
export { useRealtime } from "./supabase-realtime-provider";
import {
  isMutedDivision,
  isMutedEventType,
  isWithinQuietHours,
} from "./realtime-rules";
import type {
  RealtimePreferences,
  RealtimeSignal,
  SignalAudience,
  SignalFilter,
} from "./realtime-types";

function asArray(value: string | string[] | undefined): string[] | null {
  if (!value) return null;
  return Array.isArray(value) ? value : [value];
}

/**
 * Hash a filter into a stable key derived from its primitive contents.
 * Lets the hooks memoize correctly when callers pass an inline object
 * literal at the JSX call site (the common case): without this, the
 * object identity changes every render → useMemo never hits → filtering
 * runs on every render even when inputs are semantically unchanged.
 */
function filterKey(filter: SignalFilter | undefined): string {
  if (!filter) return "";
  const join = (v: string | string[] | undefined) =>
    Array.isArray(v) ? v.join(",") : v ?? "";
  return [
    filter.audience ?? "",
    join(filter.division),
    join(filter.category),
    join(filter.priority),
    filter.unreadOnly ? "u" : "",
    filter.visibleOnly === false ? "" : "v",
    filter.limit ?? "",
  ].join("|");
}

function matches(signal: RealtimeSignal, filter: SignalFilter): boolean {
  if (filter.audience && signal.audience !== filter.audience) return false;

  if (filter.unreadOnly && signal.is_read) return false;
  if (filter.visibleOnly && (signal.archived_at || signal.deleted_at)) return false;

  const divisions = asArray(filter.division);
  if (divisions && divisions.length > 0) {
    const match = divisions.some(
      (d) => d.toLowerCase() === (signal.division || "").toLowerCase(),
    );
    if (!match) return false;
  }
  const categories = asArray(filter.category);
  if (categories && categories.length > 0) {
    const match = categories.some(
      (c) => c.toLowerCase() === (signal.category || "").toLowerCase(),
    );
    if (!match) return false;
  }
  const priorities = asArray(filter.priority);
  if (priorities && priorities.length > 0) {
    const match = priorities.some(
      (p) => p.toLowerCase() === (signal.priority || "").toLowerCase(),
    );
    if (!match) return false;
  }
  return true;
}

/**
 * Live-filtered notification list. Filter omitted = all visible
 * unarchived signals.
 */
export function useNotificationSignal(filter?: SignalFilter): {
  signals: ReadonlyArray<RealtimeSignal>;
  unreadCount: number;
  loading: boolean;
  error: string | null;
} {
  const { signals, loading, error } = useRealtime();
  const key = filterKey(filter);
  return useMemo(() => {
    const effective: SignalFilter = {
      visibleOnly: true,
      ...(filter ?? {}),
    };
    let filtered = signals.filter((s) => matches(s, effective));
    if (effective.limit && filtered.length > effective.limit) {
      filtered = filtered.slice(0, effective.limit);
    }
    let unread = 0;
    for (const s of filtered) if (!s.is_read) unread += 1;
    return {
      signals: Object.freeze(filtered),
      unreadCount: unread,
      loading,
      error,
    };
    // `key` captures the filter's primitive contents; intentionally
    // exclude `filter` from deps so an inline object literal at the
    // call site doesn't defeat the memo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signals, loading, error, key]);
}

/**
 * Tasks emit through customer_activity in the existing data layer; the
 * realtime stream surfaces tasks as signals with category prefixed
 * `task.*`. DASH-6 exposes the surface; DASH-4 / DASH-8 consume it.
 */
export function useTaskSignal(filter?: Omit<SignalFilter, "category">): {
  signals: ReadonlyArray<RealtimeSignal>;
  loading: boolean;
} {
  const { signals, loading } = useRealtime();
  const key = filterKey(filter);
  return useMemo(() => {
    const result = signals.filter((s) => {
      if (!s.category || !s.category.startsWith("task.")) return false;
      return matches(s, { visibleOnly: true, ...(filter ?? {}) });
    });
    const limited = filter?.limit ? result.slice(0, filter.limit) : result;
    return { signals: Object.freeze(limited), loading };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signals, loading, key]);
}

/**
 * Tag-based invalidation token for cache() consumers (DASH-4). Bumps on
 * every customer or staff realtime event; DASH-4's Smart Home wraps
 * `getSignalFeed` in `cache()` and treats this tag as a deps trigger.
 */
export function useSignalInvalidation(): {
  invalidationTag: number;
  lastSignalAt: number;
} {
  const { invalidationTag, lastSignalAt } = useRealtime();
  return { invalidationTag, lastSignalAt };
}

/**
 * Preferences readout + local mutator. Persistence happens via the
 * host's PATCH endpoint (the spine doesn't write the network — it
 * surfaces the local copy and reflects updates).
 */
export function useNotificationPreferences(): {
  preferences: RealtimePreferences;
  apply: (updates: Partial<RealtimePreferences>) => void;
} {
  const { preferences, setPreferencesLocally } = useRealtime();
  return { preferences, apply: setPreferencesLocally };
}

/**
 * Per-signal render decisions. Used by the bell, toast, and inbox to
 * apply quiet-hours dimming, muted-divisions filtering, and email-
 * fallback dimming consistently.
 */
export function useSignalRenderState(signal: RealtimeSignal): {
  /** Render dimmer (quiet hours active OR email already dispatched). */
  dim: boolean;
  /** Quiet hours active right now — used to silence the chime (not just dim). */
  inQuiet: boolean;
  /** Suppress from bell badge (muted division). */
  badgeSuppressed: boolean;
  /** Suppress from toast viewport (muted event type or master toast off). */
  toastSuppressed: boolean;
} {
  const { preferences } = useRealtime();
  return useMemo(() => {
    const inQuiet = isWithinQuietHours(preferences);
    const muteByDivision = isMutedDivision(preferences, signal.division);
    const muteByEventType = isMutedEventType(preferences, signal.category);
    const emailFallback = !!signal.email_dispatched_at;
    return {
      dim: inQuiet || emailFallback,
      inQuiet,
      badgeSuppressed: muteByDivision,
      toastSuppressed:
        muteByEventType ||
        muteByDivision ||
        !preferences.in_app_toast_enabled ||
        (preferences.high_priority_only &&
          signal.priority !== "urgent" &&
          signal.priority !== "security"),
    };
  }, [
    preferences,
    signal.division,
    signal.category,
    signal.priority,
    signal.email_dispatched_at,
  ]);
}

/**
 * Aggregate audience-aware unread count, with mute filtering applied.
 * Used by the IdentityBar bell badge.
 */
export function useUnreadCount(audience: SignalAudience = "customer"): number {
  const { signals, preferences } = useRealtime();
  return useMemo(() => {
    let count = 0;
    for (const s of signals) {
      if (s.audience !== audience) continue;
      if (s.is_read || s.archived_at || s.deleted_at) continue;
      if (isMutedDivision(preferences, s.division)) continue;
      count += 1;
    }
    return count;
  }, [signals, audience, preferences]);
}
