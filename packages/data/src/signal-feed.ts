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
 *
 * DASH-4 EXTENSION: each notification-kind item is augmented with
 * `emailDispatched` (the value of `customer_notifications.email_dispatched_at
 * IS NOT NULL`). The Smart Home dims signals already mirrored to
 * email — see audit §A.8. We do NOT add the column to the SQL
 * function (V2 scope boundary forbids new SQL). Instead we issue a
 * single follow-up `select id, email_dispatched_at` filtered by the
 * viewer's user_id.
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
  /**
   * True when this notification has already been mirrored to email
   * via the notification-email-fallback cron. The Smart Home renders
   * those signals dimmer because they have a parallel acknowledgement
   * channel. Always false for activity-kind rows.
   */
  emailDispatched: boolean;
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

/**
 * Build the cache tag for a viewer's signal feed. DASH-6's realtime
 * spine calls `revalidateTag(signalFeedTag(userId))` when a new
 * notification is published, dropping the 30s cache window early so
 * the next render reads fresh data.
 */
export function signalFeedTag(viewerId: string): string {
  return `signal-feed:${viewerId}`;
}

/**
 * The shared cache tag for any Smart Home read. Used as a coarse
 * "drop everything" hook for global invalidation paths.
 */
export const SMART_HOME_TAG = "smart-home";

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

  // Look up email_dispatched_at for the notification-kind subset so
  // the Smart Home can render dispatched signals dimmer. One round
  // trip; service-role admin client; viewer-scoped (defence in depth
  // even though the SQL function already guards by user_id).
  const dispatchedSet = await loadEmailDispatchedSet(client, viewer.user.id, rows);

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
    emailDispatched: row.kind === "notification" && dispatchedSet.has(row.id),
  }));

  const last = items[items.length - 1];
  const nextCursor =
    items.length === limit && last ? { score: last.score, createdAt: last.createdAt } : null;

  return { items, nextCursor };
}

async function loadEmailDispatchedSet(
  client: ReturnType<typeof createDataAdminClient>,
  viewerId: string,
  rows: ReadonlyArray<SignalFeedRow>,
): Promise<ReadonlySet<string>> {
  const notificationIds = rows.filter((r) => r.kind === "notification").map((r) => r.id);
  if (notificationIds.length === 0) return new Set();

  const { data, error } = await client
    .from("customer_notifications")
    .select("id")
    .eq("user_id", viewerId)
    .in("id", notificationIds)
    .not("email_dispatched_at", "is", null);

  if (error || !data) return new Set();
  return new Set((data as Array<{ id: string }>).map((row) => row.id));
}

// NOTE: the 30-second TTL cache wrapper for `getSignalFeed` lives in
// the host app at `apps/account/lib/smart-home/signal-feed-cache.ts`.
// It's kept out of this package so `@henryco/data` doesn't grow a
// hard dependency on `next/cache` or `react` — `@henryco/data` is
// designed to be importable from any Next 16 app (account, hub,
// staff, marketplace) without adding a Next-version coupling here.
// Tags + helpers (`signalFeedTag`, `SMART_HOME_TAG`) ARE shipped
// from this package because they are pure constants/helpers.
