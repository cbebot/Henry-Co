"use client";

import type { ReactNode } from "react";
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
  return (
    <SupabaseRealtimeProvider
      viewer={viewer}
      getSupabase={() => createSupabaseBrowser() as never}
      initialPreferences={initialPreferences}
    >
      {children}
    </SupabaseRealtimeProvider>
  );
}
