import "server-only";

import type { UnifiedViewer } from "@henryco/auth";
import { createDataAdminClient } from "./client";

/**
 * @henryco/data/support-summary — viewer-scoped support thread summary.
 *
 * For customer viewers: counts open + unread threads from
 * `support_threads` (live prod table; not `customer_support_threads`
 * as the original DASH-1 draft assumed). For staff/owner viewers:
 * TODO V2-DATA-02 — the staff support inbox sits on a separate schema
 * (workspace_support_*) which DASH-1 does not migrate.
 */

export type SupportSummary = {
  openCount: number;
  unreadCount: number;
  recentSubject: string | null;
  recentCreatedAt: string | null;
};

export async function getSupportSummary(viewer: UnifiedViewer): Promise<SupportSummary> {
  const client = createDataAdminClient();

  if (viewer.kind !== "customer") {
    return { openCount: 0, unreadCount: 0, recentSubject: null, recentCreatedAt: null };
  }

  const userId = viewer.user.id;
  const [openRes, unreadRes, recentRes] = await Promise.all([
    client
      .from("support_threads")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .neq("status", "closed")
      .neq("status", "resolved"),
    // The "unread" condition is the same as "open" for the customer
    // surface today (each thread shows an indicator when the most
    // recent message is from staff). When the per-thread unread
    // signal lands, this query refines.
    client
      .from("support_threads")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .neq("status", "closed")
      .neq("status", "resolved"),
    client
      .from("support_threads")
      .select("id, subject, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  return {
    openCount: openRes.count ?? 0,
    unreadCount: unreadRes.count ?? 0,
    recentSubject: recentRes.data?.subject ?? null,
    recentCreatedAt: recentRes.data?.created_at ?? null,
  };
}
