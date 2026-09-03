import "server-only";
import { cache } from "react";
import { createAdminSupabase } from "./supabase";

/**
 * V3-launch dashboard metrics (V3-96 S5, honest v1).
 *
 * Data source: the `henry_events` sink (V3-01 slice 5b) — the same
 * canonical-name table the owner observability tile reads. We count the
 * nine `henry.v3.*` closure events over 24h/7d windows and split
 * showcase views by `payload->surface`. Every query failure is
 * swallowed into `available: false` so the panel renders the V3-08
 * honest empty state instead of fake zeros: "0 views" and "not
 * reporting" are different truths and the owner must see which.
 */

export type V3LaunchWindowCounts = {
  last24h: number;
  last7d: number;
};

export type V3LaunchMetrics = {
  /** False when the sink itself was unreachable (vs. genuinely zero events). */
  available: boolean;
  showcaseBySurface: { surface: string; last24h: number; last7d: number }[];
  journey: {
    started: V3LaunchWindowCounts;
    completed: V3LaunchWindowCounts;
    abandoned: V3LaunchWindowCounts;
  };
  announcement: {
    delivered: V3LaunchWindowCounts;
    engaged: V3LaunchWindowCounts;
  };
};

type EventRow = { name: string; created_at: string; payload: Record<string, unknown> | null };

const EMPTY: V3LaunchMetrics = {
  available: false,
  showcaseBySurface: [],
  journey: {
    started: { last24h: 0, last7d: 0 },
    completed: { last24h: 0, last7d: 0 },
    abandoned: { last24h: 0, last7d: 0 },
  },
  announcement: {
    delivered: { last24h: 0, last7d: 0 },
    engaged: { last24h: 0, last7d: 0 },
  },
};

function windowCounts(rows: EventRow[], name: string, since24h: number): V3LaunchWindowCounts {
  const matching = rows.filter((row) => row.name === name);
  return {
    last24h: matching.filter((row) => Date.parse(row.created_at) >= since24h).length,
    last7d: matching.length,
  };
}

export const getV3LaunchMetrics = cache(async (): Promise<V3LaunchMetrics> => {
  const now = Date.now();
  const since24h = now - 24 * 3600 * 1000;
  const since7dISO = new Date(now - 7 * 24 * 3600 * 1000).toISOString();

  try {
    const client = createAdminSupabase();
    const result = await client
      .from("henry_events")
      .select("name, created_at, payload")
      .like("name", "henry.v3.%")
      .gte("created_at", since7dISO)
      .limit(10000);

    if (result.error || !Array.isArray(result.data)) return EMPTY;
    const rows = result.data as EventRow[];

    // Showcase views split by payload.surface (v3_story / v3_earning_map / …).
    const bySurface = new Map<string, { last24h: number; last7d: number }>();
    for (const row of rows) {
      if (row.name !== "henry.v3.showcase.viewed") continue;
      const surface = typeof row.payload?.surface === "string" ? row.payload.surface : "unknown";
      const bucket = bySurface.get(surface) ?? { last24h: 0, last7d: 0 };
      bucket.last7d += 1;
      if (Date.parse(row.created_at) >= since24h) bucket.last24h += 1;
      bySurface.set(surface, bucket);
    }

    return {
      available: true,
      showcaseBySurface: Array.from(bySurface.entries())
        .map(([surface, counts]) => ({ surface, ...counts }))
        .sort((a, b) => b.last7d - a.last7d),
      journey: {
        started: windowCounts(rows, "henry.v3.journey.started", since24h),
        completed: windowCounts(rows, "henry.v3.journey.completed", since24h),
        abandoned: windowCounts(rows, "henry.v3.journey.abandoned", since24h),
      },
      announcement: {
        delivered: windowCounts(rows, "henry.v3.announcement.delivered", since24h),
        engaged: windowCounts(rows, "henry.v3.announcement.engaged", since24h),
      },
    };
  } catch {
    return EMPTY;
  }
});
