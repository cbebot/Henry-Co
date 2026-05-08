import "server-only";

import { cache } from "react";
import { unstable_cache } from "next/cache";
import type { UnifiedViewer } from "@henryco/auth";
import {
  getSignalFeed,
  signalFeedTag,
  SMART_HOME_TAG,
  type SignalFeedOptions,
  type SignalFeedResult,
} from "@henryco/data";

/**
 * Smart-Home-shaped `getSignalFeed` wrapper. Two layers of caching:
 *
 *   1. `unstable_cache` from `next/cache` — 30 s TTL keyed by
 *      `(viewerId, limit, cursor)`, tagged with
 *      `[SMART_HOME_TAG, signalFeedTag(viewerId)]`. DASH-6's realtime
 *      spine calls `revalidateTag(signalFeedTag(userId))` when a new
 *      notification lands so the cache is invalidated before the
 *      30 s window expires.
 *
 *   2. React `cache()` — within-request memoization so two callers
 *      in the same render (e.g. SignalFeed + AttentionPanel both
 *      inspecting the same cursor) share one network round trip.
 *
 * Lives in the host app, not the `@henryco/data` package, so the
 * package doesn't grow a hard dependency on `next/cache` or `react`.
 */
export const getCachedSignalFeed = cache(
  async (viewer: UnifiedViewer, opts: SignalFeedOptions = {}): Promise<SignalFeedResult> => {
    const cursorKey = opts.cursor ? `${opts.cursor.score}|${opts.cursor.createdAt}` : "";
    const limitKey = String(opts.limit ?? 50);
    const cacheKey = ["signal-feed", viewer.user.id, limitKey, cursorKey];

    const fetcher = unstable_cache(
      async () => getSignalFeed(viewer, opts),
      cacheKey,
      {
        revalidate: 30,
        tags: [SMART_HOME_TAG, signalFeedTag(viewer.user.id)],
      },
    );

    return fetcher();
  },
);
