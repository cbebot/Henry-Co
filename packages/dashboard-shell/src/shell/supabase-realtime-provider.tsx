"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

/**
 * SupabaseRealtimeProvider — single subscription at the shell root.
 *
 * Closes anti-pattern #9 (per-widget Supabase Realtime subscription).
 * The shell mounts ONE channel; widgets fan out via React context.
 *
 * DASH-1 ships the provider + context shape with a NULL channel — the
 * actual subscription registration is in DASH-6, where the realtime
 * spine is wired (channel name, RLS-aware filters, etc.). DASH-1's
 * provider just establishes the mount point so DASH-6 can extend
 * without touching the shell layout.
 *
 * The fan-out API is two values:
 *   - `lastSignalAt` — timestamp of the most recent realtime event
 *     received. Widgets re-fetch from a memoized server source when
 *     this timestamp advances past their own last-fetch timestamp.
 *   - `subscribe(eventType, handler)` — for widgets that need
 *     event-type-specific handling beyond cache invalidation.
 *
 * Both are NO-OPS in DASH-1. DASH-6 implements.
 */
type RealtimeContextValue = {
  /** Most recent realtime event timestamp (ms epoch). 0 = none yet. */
  lastSignalAt: number;
  /** Subscribe to a specific event type. DASH-6 wires.
   *  Returns an unsubscribe function. */
  subscribe: (eventType: string, handler: (payload: unknown) => void) => () => void;
};

const RealtimeContext = createContext<RealtimeContextValue | null>(null);

export type SupabaseRealtimeProviderProps = {
  children: ReactNode;
};

export function SupabaseRealtimeProvider({ children }: SupabaseRealtimeProviderProps) {
  // DASH-1: lastSignalAt stays at 0; subscribe is a no-op. DASH-6
  // replaces this useState with a real subscription bound to the
  // viewer's RLS-allowed channel.
  const [lastSignalAt] = useState(0);
  const subscribersRef = useRef(new Map<string, Set<(payload: unknown) => void>>());

  // Cleanup on unmount — even though there's no live subscription in
  // DASH-1, the cleanup hook is in place so DASH-6 doesn't need to
  // re-introduce lifecycle handling at the shell layer.
  useEffect(() => {
    return () => {
      subscribersRef.current.clear();
    };
  }, []);

  const value = useMemo<RealtimeContextValue>(
    () => ({
      lastSignalAt,
      subscribe: (eventType, handler) => {
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
    }),
    [lastSignalAt],
  );

  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
}

/**
 * Hook for widgets to consume the realtime spine. Returns a
 * sentinel `lastSignalAt` they can pass to `useEffect` deps to
 * re-fetch on signal arrival.
 *
 * In DASH-1 this hook always returns `lastSignalAt: 0` — widgets
 * compile and run identically; they just don't observe realtime
 * events until DASH-6 lands.
 *
 * Throws if called outside a `SupabaseRealtimeProvider` so missed
 * provider mounts surface as build-time / first-render errors
 * instead of silent stale-data bugs.
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
