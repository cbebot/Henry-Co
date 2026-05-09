"use client";

import { useCallback, useMemo, type ReactNode } from "react";
import { SupabaseRealtimeProvider } from "@henryco/dashboard-shell";
import type { UnifiedViewer } from "@henryco/auth";
import { createSupabaseBrowser } from "@/lib/supabase/browser";

/**
 * JobsRealtimeBridge — wires the shared @henryco/dashboard-shell
 * realtime spine into the jobs workspace surface.
 *
 * Same pattern as apps/account and apps/studio (StudioRealtimeBridge).
 * The provider subscribes to customer_notifications filtered by the
 * viewer's user.id, hydrates initial signals via REST, and serves
 * useRealtime() / useNotificationSignal() to descendants.
 *
 * Mounted automatically by `WorkspaceShell` so every authenticated
 * candidate / employer / recruiter page picks up live toast pop-ups
 * without per-page wiring.
 *
 * Operates in degraded mode (no subscription, no errors) when the
 * viewer is null — keeps unauthenticated render paths quiet.
 */
export type JobsRealtimeBridgeProps = {
  viewer: {
    userId: string | null;
    email: string | null;
    fullName: string | null;
    avatarUrl: string | null;
    hasStaffAccess?: boolean;
  };
  children: ReactNode;
};

export function JobsRealtimeBridge({ viewer, children }: JobsRealtimeBridgeProps) {
  const getSupabase = useCallback(() => {
    try {
      return createSupabaseBrowser();
    } catch {
      return null;
    }
  }, []);

  const unifiedViewer = useMemo<UnifiedViewer | null>(() => {
    if (!viewer.userId) return null;
    return {
      user: {
        id: viewer.userId,
        email: viewer.email,
        fullName: viewer.fullName,
        avatarUrl: viewer.avatarUrl,
        appMetadata: {},
        userMetadata: {},
      },
      access: {
        hasOwnerAccess: false,
        hasStaffAccess: Boolean(viewer.hasStaffAccess),
        staffDivisionCount: viewer.hasStaffAccess ? 1 : 0,
        ownerRole: null,
        profileRole: null,
      },
      role: viewer.hasStaffAccess ? "staff" : "customer",
      kind: viewer.hasStaffAccess ? "staff" : "customer",
    };
  }, [viewer]);

  return (
    <SupabaseRealtimeProvider viewer={unifiedViewer} getSupabase={getSupabase}>
      {children}
    </SupabaseRealtimeProvider>
  );
}
