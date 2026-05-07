import "server-only";

import type { UnifiedViewer } from "@henryco/auth";
import { createDataAdminClient } from "./client";

/**
 * @henryco/data/cross-division-activity — unified activity timeline.
 *
 * Reads `customer_activity` (live prod table; not `customer_activity_log`
 * as the original DASH-1 draft assumed) for customer viewers, joining
 * division tags so the consumer can render the activity grouped by
 * division.
 *
 * For owner / staff viewers the reader sits on different schemas
 * (workspace_audit_log, staff_activity_log) which DASH-1 does not yet
 * extend to. DASH-2+ plumbs the additional reader paths.
 */

export type ActivityItem = {
  id: string;
  division: string;
  activityType: string;
  title: string;
  description: string | null;
  createdAt: string;
};

export async function getCrossDivisionActivity(
  viewer: UnifiedViewer,
  opts: { limit?: number } = {},
): Promise<ReadonlyArray<ActivityItem>> {
  const limit = Math.min(Math.max(opts.limit ?? 20, 1), 100);
  const client = createDataAdminClient();

  if (viewer.kind === "customer") {
    const { data } = await client
      .from("customer_activity")
      .select("id, division, activity_type, title, description, created_at")
      .eq("user_id", viewer.user.id)
      .is("archived_at", null)
      .order("created_at", { ascending: false })
      .limit(limit);
    return (data ?? []).map((row) => ({
      id: row.id,
      division: row.division,
      activityType: row.activity_type,
      title: row.title,
      description: row.description,
      createdAt: row.created_at,
    }));
  }

  // TODO V2-DATA-02 — owner / staff cross-division activity readouts
  // ride on different schemas (workspace_audit_log, staff_activity_log).
  // DASH-1 returns empty; the host apps continue to use their own
  // readers until the migration lands.
  return [];
}
