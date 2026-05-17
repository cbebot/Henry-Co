"use client";

/**
 * OwnerRealtimeBridge — V3 PASS 21 / H2.
 *
 * Client boundary that supplies the browser Supabase factory to the
 * shell-level `SupabaseRealtimeProvider` so the owner workspace
 * notifications bell, drawer body, and toast viewport all share a
 * SINGLE realtime subscription per session.
 *
 * Mirrors `apps/account/.../RealtimeBrowserBridge.tsx` but scoped to
 * the owner / Track B shell on `hq.henrycogroup.com/owner`.
 *
 * The provider needs only `user.id` and `access.hasStaffAccess`/owner
 * flags to gate its subscriptions; the viewer comes from
 * `buildUnifiedViewer()` in the owner layout.
 */

import { useCallback, type ReactNode } from "react";
import { SupabaseRealtimeProvider } from "@henryco/dashboard-shell";
import type { UnifiedViewer } from "@henryco/auth";
import { createSupabaseBrowser } from "@/lib/supabase/browser";

export type OwnerRealtimeBridgeProps = {
  viewer: UnifiedViewer | null;
  initialPreferences?: Record<string, unknown> | null;
  children: ReactNode;
};

export default function OwnerRealtimeBridge({
  viewer,
  initialPreferences,
  children,
}: OwnerRealtimeBridgeProps) {
  const getSupabase = useCallback(() => createSupabaseBrowser(), []);
  return (
    <SupabaseRealtimeProvider
      viewer={viewer}
      getSupabase={getSupabase}
      initialPreferences={initialPreferences ?? null}
    >
      {children}
    </SupabaseRealtimeProvider>
  );
}
