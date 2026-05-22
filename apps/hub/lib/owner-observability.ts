import "server-only";

import { cache } from "react";

import { createAdminSupabase } from "./supabase";

/**
 * V3-10 S9 + A10 — owner-workspace observability metrics.
 *
 * Data source: `henry_events` table (NOT Sentry stats API per A10 —
 * Sentry stats requires a paid plan tier and the project may not have
 * it; `henry_events` is the canonical event sink V3-01 provisioned).
 *
 * 24-hour window. Five rolled-up signals:
 *   1. errorEvents24h       — count of `*.failed` outcomes
 *   2. degradedSideEffects24h — count of `*_fallback` + degraded events
 *   3. topErrorEvents       — { name, count } top 5 failing event names
 *   4. topDegradedServices  — { service, count } top 5 degraded events
 *   5. emptyState           — no events yet, render explanatory notice
 *
 * The "slowest routes" metric (S9 original wording) is intentionally
 * NOT in this tile — that requires APM trace data which we don't
 * persist anywhere yet (V3-89 will add it). Surfacing it as a
 * placeholder would be a fake-data anti-pattern.
 *
 * Pattern mirrors V3-01 owner-session-health.ts (cache(), countSince
 * pattern, isEmptyState handling).
 */

export type ObservabilityMetrics = {
  /** Count of `*.failed` outcome events in the last 24h. */
  errorEvents24h: number;
  /** Count of `*_fallback` + `*.degraded.*` events in the last 24h. */
  degradedSideEffects24h: number;
  /** Top 5 failing event names with their counts. */
  topErrorEvents: { name: string; count: number }[];
  /** Top 5 degraded services (event name → count). */
  topDegradedServices: { service: string; count: number }[];
  /** Wall-clock ISO at the time these metrics were computed. */
  lastUpdatedAt: string;
  /** True when no events have been observed yet — render empty-state. */
  isEmptyState: boolean;
};

/**
 * Group an array of event-name rows into a (name → count) sorted top-N.
 */
function groupAndRank(
  rows: { name: string }[],
  limit: number,
): { name: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const row of rows) {
    counts.set(row.name, (counts.get(row.name) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

/**
 * Per-request cached observability summary. Owner page renders the
 * tile once per request so dedupe is mostly defensive.
 */
export const getObservabilityMetrics = cache(
  async (): Promise<ObservabilityMetrics> => {
    const client = createAdminSupabase();
    const now = new Date();
    const since24hISO = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

    // Pull two windows in parallel:
    //   - All `*.failed` outcome events (errorEvents24h + topErrorEvents)
    //   - All degraded events: `*_fallback` OR names ending `.degraded`
    //
    // The henry_events table indexes `(name, created_at)` per V3-01
    // slice 5b; both queries hit the index range and stay cheap.
    let errorRows: { name: string }[] = [];
    let degradedRows: { name: string }[] = [];

    try {
      const [errorResult, degradedResult] = await Promise.all([
        client
          .from("henry_events")
          .select("name")
          .eq("outcome", "failed")
          .gte("created_at", since24hISO)
          .limit(5000),
        client
          .from("henry_events")
          .select("name")
          .or("name.ilike.%_fallback,name.ilike.%.degraded.%")
          .gte("created_at", since24hISO)
          .limit(5000),
      ]);
      if (!errorResult.error && Array.isArray(errorResult.data)) {
        errorRows = errorResult.data;
      }
      if (!degradedResult.error && Array.isArray(degradedResult.data)) {
        degradedRows = degradedResult.data;
      }
    } catch {
      // Query failure surfaces as an empty state — the tile's empty
      // notice tells the owner why the numbers aren't populating.
      errorRows = [];
      degradedRows = [];
    }

    const errorEvents24h = errorRows.length;
    const degradedSideEffects24h = degradedRows.length;
    const topErrorEvents = groupAndRank(errorRows, 5);
    const topDegradedServices = groupAndRank(degradedRows, 5).map((row) => ({
      service: row.name,
      count: row.count,
    }));

    return {
      errorEvents24h,
      degradedSideEffects24h,
      topErrorEvents,
      topDegradedServices,
      lastUpdatedAt: now.toISOString(),
      isEmptyState: errorEvents24h === 0 && degradedSideEffects24h === 0,
    };
  },
);
