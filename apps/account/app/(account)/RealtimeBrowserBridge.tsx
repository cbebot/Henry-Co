"use client";

import { useCallback, type ReactNode } from "react";
import { SupabaseRealtimeProvider } from "@henryco/dashboard-shell";
import type { UnifiedViewer } from "@henryco/auth";
import { createSupabaseBrowser } from "@/lib/supabase/browser";

/**
 * RealtimeBrowserBridge — client boundary that supplies the browser
 * Supabase factory to the shell-level SupabaseRealtimeProvider.
 *
 * Lives in apps/account because the package is host-agnostic by design
 * — each shell app passes its own Supabase client. Workspace apps
 * (V2-NOT-02-B) will write their own bridge that reuses their own
 * cookie config.
 *
 * The `viewer` prop is a serialized read of the server-side
 * UnifiedViewer; the realtime provider needs only `user.id` and
 * `access.hasStaffAccess` to gate its subscriptions.
 *
 * The `getSupabase` callback is wrapped in `useCallback` with no deps
 * so its identity is stable across renders. The provider also caches
 * the factory in a ref internally, but a stable callback here closes
 * the loophole at the source: a parent re-render can never trigger a
 * realtime channel teardown + reconnect cycle. Without the
 * `useCallback`, the inline arrow would have a fresh identity on every
 * render and any provider effect that included the factory in its
 * deps array would re-run.
 *
 * `createSupabaseBrowser()` returns a real `@supabase/supabase-js`
 * client; it satisfies the package's `SupabaseLike` structurally
 * (loose return-value typing on `channel`/`removeChannel`), so no cast
 * is needed.
 */
export type RealtimeBrowserBridgeProps = {
  viewer: UnifiedViewer | null;
  initialPreferences?: Record<string, unknown> | null;
  children: ReactNode;
};

export function RealtimeBrowserBridge({
  viewer,
  initialPreferences,
  children,
}: RealtimeBrowserBridgeProps) {
  const getSupabase = useCallback(() => createSupabaseBrowser(), []);
  return (
    <SupabaseRealtimeProvider
      viewer={viewer}
      getSupabase={getSupabase}
      initialPreferences={initialPreferences}
    >
      {children}
    </SupabaseRealtimeProvider>
  );
}
