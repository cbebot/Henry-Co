import "server-only";

import { cache } from "react";

import { createAdminSupabase } from "./supabase";

/**
 * V3-05 slow-surface metrics for the owner-workspace tile (Priority-2
 * scaffold). Reads `henry.ui.skeleton.exceeded_threshold` events from
 * the `henry_events` table — these fire whenever a StructuredSkeleton
 * stays mounted longer than its threshold (default 3s).
 *
 * Mirrors the V3-01 SessionHealthMetrics pattern in
 * `owner-session-health.ts`: 24h totals + a top-5 surface ranking +
 * graceful empty-state when no data has landed yet.
 *
 * PERSISTENCE NOTE (mirrors V3-01 slice 5b gap): the V3-05 events from
 * `StructuredSkeleton` flow through `@henryco/observability/emitEvent`
 * — pino + Sentry breadcrumbs. To make this tile populate, those emit
 * sites need to also write rows to `henry_events` via the canonical
 * activity writer. Until then the tile renders the zero-state cleanly.
 */

export type SlowSurfaceMetrics = {
  /** Skeleton-shown events in the last 24 hours. */
  skeletonsShownToday: number;
  /**
   * Skeletons that exceeded their threshold (default 3s) in the last
   * 24 hours. The headline metric — high counts mean the page took
   * longer than the platform target to surface content.
   */
  thresholdExceededToday: number;
  /** Top 5 surfaces by exceeded-threshold count over the last 7 days. */
  topSlowSurfaces7d: Array<{
    surface: string;
    exceededCount: number;
    /** Average duration the skeleton was held (ms). */
    avgDurationMs: number;
  }>;
  /** Wall-clock ISO at the time these metrics were computed. */
  lastUpdatedAt: string;
  /** True when no V3-05 skeleton events have been observed yet. */
  isEmptyState: boolean;
};

const SKELETON_EVENT_NAMES = {
  shown: "henry.ui.skeleton.shown",
  exceededThreshold: "henry.ui.skeleton.exceeded_threshold",
} as const;

async function safeCount(
  client: ReturnType<typeof createAdminSupabase>,
  eventName: string,
  sinceISO: string,
): Promise<number> {
  try {
    const { count, error } = await client
      .from("henry_events")
      .select("id", { count: "exact", head: true })
      .eq("name", eventName)
      .gte("created_at", sinceISO);
    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}

async function safeTopSurfaces(
  client: ReturnType<typeof createAdminSupabase>,
  sinceISO: string,
): Promise<SlowSurfaceMetrics["topSlowSurfaces7d"]> {
  try {
    const { data, error } = await client
      .from("henry_events")
      .select("payload, created_at")
      .eq("name", SKELETON_EVENT_NAMES.exceededThreshold)
      .gte("created_at", sinceISO)
      .limit(2000); // soft cap; if we ever exceed this we should aggregate server-side
    if (error || !data) return [];
    // Aggregate in-memory — the typical volume is small (per-page; only
    // skeletons that exceeded 3s land here).
    const buckets = new Map<
      string,
      { exceededCount: number; totalDuration: number }
    >();
    for (const row of data as Array<{
      payload?: Record<string, unknown>;
      created_at: string;
    }>) {
      const payload = row.payload || {};
      const surface = typeof payload.surface === "string" ? payload.surface : "unknown";
      const duration =
        typeof payload.duration === "number" ? payload.duration : 0;
      const b = buckets.get(surface) ?? { exceededCount: 0, totalDuration: 0 };
      b.exceededCount += 1;
      b.totalDuration += duration;
      buckets.set(surface, b);
    }
    const ranked = [...buckets.entries()]
      .map(([surface, b]) => ({
        surface,
        exceededCount: b.exceededCount,
        avgDurationMs:
          b.exceededCount > 0 ? Math.round(b.totalDuration / b.exceededCount) : 0,
      }))
      .sort((a, b) => b.exceededCount - a.exceededCount)
      .slice(0, 5);
    return ranked;
  } catch {
    return [];
  }
}

/**
 * Cached per-request — Next.js + React 19's `cache()` dedupes parallel
 * calls during the same render.
 */
export const getSlowSurfaceMetrics = cache(
  async (): Promise<SlowSurfaceMetrics> => {
    const client = createAdminSupabase();
    const now = new Date();
    const since24h = new Date(
      now.getTime() - 24 * 60 * 60 * 1000,
    ).toISOString();
    const since7d = new Date(
      now.getTime() - 7 * 24 * 60 * 60 * 1000,
    ).toISOString();

    const [skeletonsShownToday, thresholdExceededToday, topSlowSurfaces7d] =
      await Promise.all([
        safeCount(client, SKELETON_EVENT_NAMES.shown, since24h),
        safeCount(client, SKELETON_EVENT_NAMES.exceededThreshold, since24h),
        safeTopSurfaces(client, since7d),
      ]);

    const isEmptyState =
      skeletonsShownToday === 0 &&
      thresholdExceededToday === 0 &&
      topSlowSurfaces7d.length === 0;

    return {
      skeletonsShownToday,
      thresholdExceededToday,
      topSlowSurfaces7d,
      lastUpdatedAt: now.toISOString(),
      isEmptyState,
    };
  },
);
