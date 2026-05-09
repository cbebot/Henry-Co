"use client";

import { useCallback, useMemo, type ReactNode } from "react";
import { SupabaseRealtimeProvider } from "@henryco/dashboard-shell";
import type { UnifiedViewer } from "@henryco/auth";
import { getBrowserSupabase } from "@/lib/supabase/browser";
import type { ClientPortalViewer } from "@/types/portal";

/**
 * RealtimeBrowserBridge — client boundary that wires the shared
 * SupabaseRealtimeProvider into the studio /client portal.
 *
 * Same pattern apps/account uses; studio is the second consumer of the
 * spine. The provider subscribes to `customer_notifications` filtered
 * by `viewer.user.id`, hydrates initial signals via REST, and serves
 * `useRealtime()` / `useNotificationSignal()` to any descendant.
 *
 * Studio's existing PortalRealtimeBridge keeps working in parallel —
 * it covers project-specific postgres_changes (studio_project_messages,
 * _updates, _invoices) that the cross-division spine doesn't see. Both
 * channels coexist until backend triggers fire customer_notifications
 * rows for every relevant event (separate migration).
 *
 * `viewer` is converted from ClientPortalViewer (customer, no staff
 * access) to UnifiedViewer here so the spine sees the shape it expects.
 */
export type StudioRealtimeBridgeProps = {
  viewer: ClientPortalViewer | null;
  children: ReactNode;
};

export function StudioRealtimeBridge({ viewer, children }: StudioRealtimeBridgeProps) {
  const getSupabase = useCallback(() => {
    try {
      return getBrowserSupabase();
    } catch {
      return null;
    }
  }, []);

  const unifiedViewer = useMemo<UnifiedViewer | null>(() => {
    if (!viewer) return null;
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
        hasStaffAccess: false,
        staffDivisionCount: 0,
        ownerRole: null,
        profileRole: null,
      },
      role: "customer",
      kind: "customer",
    };
  }, [viewer]);

  return (
    <SupabaseRealtimeProvider viewer={unifiedViewer} getSupabase={getSupabase}>
      {children}
    </SupabaseRealtimeProvider>
  );
}
