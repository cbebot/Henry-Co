import "server-only";

import type { UnifiedViewer } from "@henryco/auth";
import { createDataAdminClient } from "./client";
import type { Database } from "./database.types";

/**
 * Row shape returned by the SQL `public.get_signal_feed` function.
 * Derived from the generated types so it stays in sync with the
 * database without manual maintenance.
 */
export type SignalFeedRow =
  Database["public"]["Functions"]["get_signal_feed"]["Returns"][number] & {
    /**
     * The SQL function returns text 'kind' but only emits two known
     * values: 'notification' (from customer_notifications) and
     * 'activity' (from customer_activity). Narrow the type so callers
     * can switch exhaustively.
     */
    kind: "notification" | "activity";
  };

/**
 * @henryco/data/signal-feed — unified ranked signal stream.
 *
 * Calls the SQL `public.get_signal_feed(viewer_id, limit_count,
 * after_score, after_created_at)` function (DASH-1's migration G6).
 *
 * DASH-1 SCOPE: the function joins customer_notifications +
 * customer_activity (the two sources that exist in production today),
 * ranks by (priority weight × recency weight), and returns up to
 * `limit` rows. DASH-6 will EXTEND this function with the
 * staff_notifications source + role-fit weight once the V2-NOT-02-A
 * audience migration ships to production.
 *
 * Cursor pagination: pass the last item's `score` + `created_at` as
 * the cursor. Avoids offset pagination pitfalls on large result sets.
 *
 * The function is SECURITY DEFINER + RLS-aware: the viewer never sees
 * rows they wouldn't see via direct SELECT against the underlying
 * tables. G10 (live RLS probe) verifies cross-tenant isolation.
 */

export type SignalFeedItem = {
  id: string;
  kind: SignalFeedRow["kind"];
  source: string;
  division: string;
  priority: string;
  title: string;
  body: string | null;
  actionUrl: string | null;
  createdAt: string;
  score: number;
};

export type SignalFeedCursor = {
  score: number;
  createdAt: string;
};

export type SignalFeedOptions = {
  limit?: number;
  cursor?: SignalFeedCursor;
};

export type SignalFeedResult = {
  items: ReadonlyArray<SignalFeedItem>;
  nextCursor: SignalFeedCursor | null;
};

export async function getSignalFeed(
  viewer: UnifiedViewer,
  opts: SignalFeedOptions = {},
): Promise<SignalFeedResult> {
  const limit = Math.min(Math.max(opts.limit ?? 50, 1), 100);
  const client = createDataAdminClient();

  // The RPC is type-safe against `Database["public"]["Functions"]["get_signal_feed"]`.
  // Type assertion is required because the RPC return-shape can be a
  // single row OR an array depending on the function definition; our
  // SQL returns SETOF, which the supabase-js typing folds into an
  // array.
  const { data, error } = await client.rpc("get_signal_feed", {
    viewer_id: viewer.user.id,
    limit_count: limit,
    after_score: opts.cursor?.score,
    after_created_at: opts.cursor?.createdAt,
  });

  if (error) {
    // Surface to Sentry via @henryco/observability — calling code
    // can wrap with try/catch + logger.error if it wants soft-fail.
    throw new Error(`get_signal_feed RPC failed: ${error.message}`);
  }

  const rows: SignalFeedRow[] = (data ?? []) as SignalFeedRow[];

  const items: SignalFeedItem[] = rows.map((row) => ({
    id: row.id,
    kind: row.kind,
    source: row.source,
    division: row.division,
    priority: row.priority,
    title: row.title,
    body: row.body,
    actionUrl: row.action_url,
    createdAt: row.created_at,
    score: row.score,
  }));

  const last = items[items.length - 1];
  const nextCursor =
    items.length === limit && last ? { score: last.score, createdAt: last.createdAt } : null;

  return { items, nextCursor };
}
