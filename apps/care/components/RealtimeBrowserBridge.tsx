"use client";

import { useCallback, type ReactNode } from "react";
import { SupabaseRealtimeProvider } from "@henryco/dashboard-shell";
import type { UnifiedViewer } from "@henryco/auth";
import { createSupabaseBrowser } from "@/lib/supabase/browser";

/**
 * RealtimeBrowserBridge — client boundary that supplies the browser
 * Supabase factory to the shell-level SupabaseRealtimeProvider.
 *
 * Mirrors the pattern in `apps/account/app/(account)/RealtimeBrowserBridge.tsx`.
 * The care public layout mounts `<NotificationsToastViewport audience="customer" />`
 * (from `@henryco/dashboard-shell`) which calls `useRealtime()` internally
 * — without a `SupabaseRealtimeProvider` ancestor, that hook throws and
 * V3-10's `error.tsx` catches the throw, killing the page for every
 * visitor (HOT-FIX: care.henrycogroup.com was rendering the
 * "Something went wrong" fallback on every load).
 *
 * For unauthenticated visitors, `viewer` is `null`; the provider's
 * internal state machine drops to `disabled` and no channels are
 * subscribed — but the context exists so consumer hooks resolve
 * cleanly.
 *
 * The `getSupabase` callback is wrapped in `useCallback` with no deps
 * so its identity is stable across renders. A parent re-render can
 * never trigger a realtime channel teardown + reconnect cycle.
 */
export type RealtimeBrowserBridgeProps = {
  viewer: UnifiedViewer | null;
  children: ReactNode;
};

export function RealtimeBrowserBridge({ viewer, children }: RealtimeBrowserBridgeProps) {
  const getSupabase = useCallback(() => createSupabaseBrowser(), []);
  return (
    <SupabaseRealtimeProvider viewer={viewer} getSupabase={getSupabase}>
      {children}
    </SupabaseRealtimeProvider>
  );
}
