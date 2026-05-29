import "server-only";

import { cache } from "react";

import { createAdminSupabase } from "./supabase";

/**
 * V3-08 (Empty Dashboard Truth) — module-health metrics for the owner
 * workspace tile. Reads `henry.dashboard.module.rendered` events from
 * the `henry_events` table. Each row carries `payload.module_id` and
 * `payload.state` (one of the V3-08 module-state taxonomy values:
 * `real | empty_yet | empty_none | loading | error`).
 *
 * The point of this tile is HONESTY about empty dashboards: it flags
 * modules that render but have been EMPTY for the whole observation
 * window. A module that is always empty is either (a) waiting on data
 * the customer hasn't generated yet, or (b) a candidate for removal or
 * a messaging fix. The owner needs to tell those apart — a perpetually
 * empty tile that teaches nothing is dashboard theatre, which V3-08
 * exists to kill.
 *
 * Mirrors the V3-05 SlowSurfaceMetrics pattern in
 * `owner-slow-surfaces.ts`: 24h totals + a ranking + graceful
 * empty-state when no telemetry has landed yet.
 *
 * PERSISTENCE NOTE (mirrors V3-01 slice 5b / V3-05): the render events
 * are written by `apps/account/lib/smart-home/widgets.ts` via
 * `@henryco/observability/persistEvent` (best-effort henry_events
 * dual-write). Until enough Smart Home renders have landed, this tile
 * renders the zero-state cleanly rather than reading the empty table
 * as a regression.
 */

const MODULE_RENDER_EVENT = "henry.dashboard.module.rendered" as const;

/** Empty-state taxonomy values that this tile treats as "showed nothing". */
const EMPTY_STATES = new Set(["empty_yet", "empty_none"]);

export type ModuleHealthRow = {
  /** The module slug — e.g. `customer-overview`, `wallet`. */
  moduleId: string;
  /** Total render observations for this module in the window. */
  renders: number;
  /** Renders that resolved to an empty state (`empty_yet`/`empty_none`). */
  emptyRenders: number;
  /** Renders that resolved to an error state. */
  errorRenders: number;
  /**
   * Share of renders that were empty, 0..1. The headline signal:
   * `1` means the module rendered but NEVER had data in the window.
   */
  emptyRatio: number;
};

export type ModuleHealthMetrics = {
  /** Distinct modules observed rendering in the last 7 days. */
  modulesObserved7d: number;
  /** Module render observations in the last 24 hours. */
  rendersToday: number;
  /**
   * Modules that were empty on EVERY render across the last 7 days —
   * the "always empty" set. These are the removal / messaging-fix
   * candidates the owner should review.
   */
  alwaysEmpty7d: ModuleHealthRow[];
  /** Wall-clock ISO at the time these metrics were computed. */
  lastUpdatedAt: string;
  /** True when no V3-08 module-render events have been observed yet. */
  isEmptyState: boolean;
};

async function safeCount(
  client: ReturnType<typeof createAdminSupabase>,
  sinceISO: string,
): Promise<number> {
  try {
    const { count, error } = await client
      .from("henry_events")
      .select("id", { count: "exact", head: true })
      .eq("name", MODULE_RENDER_EVENT)
      .gte("created_at", sinceISO);
    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}

async function safeModuleRollup(
  client: ReturnType<typeof createAdminSupabase>,
  sinceISO: string,
): Promise<ModuleHealthRow[]> {
  try {
    const { data, error } = await client
      .from("henry_events")
      .select("payload, created_at")
      .eq("name", MODULE_RENDER_EVENT)
      .gte("created_at", sinceISO)
      .limit(5000); // soft cap; aggregate server-side if we ever exceed
    if (error || !data) return [];
    const buckets = new Map<
      string,
      { renders: number; emptyRenders: number; errorRenders: number }
    >();
    for (const row of data as Array<{
      payload?: Record<string, unknown>;
      created_at: string;
    }>) {
      const payload = row.payload || {};
      const moduleId =
        typeof payload.module_id === "string" ? payload.module_id : "unknown";
      const state = typeof payload.state === "string" ? payload.state : "";
      const b =
        buckets.get(moduleId) ??
        { renders: 0, emptyRenders: 0, errorRenders: 0 };
      b.renders += 1;
      if (EMPTY_STATES.has(state)) b.emptyRenders += 1;
      if (state === "error") b.errorRenders += 1;
      buckets.set(moduleId, b);
    }
    return [...buckets.entries()].map(([moduleId, b]) => ({
      moduleId,
      renders: b.renders,
      emptyRenders: b.emptyRenders,
      errorRenders: b.errorRenders,
      emptyRatio: b.renders > 0 ? b.emptyRenders / b.renders : 0,
    }));
  } catch {
    return [];
  }
}

/**
 * Cached per-request — Next.js + React 19's `cache()` dedupes parallel
 * calls during the same render.
 */
export const getModuleHealthMetrics = cache(
  async (): Promise<ModuleHealthMetrics> => {
    const client = createAdminSupabase();
    const now = new Date();
    const since24h = new Date(
      now.getTime() - 24 * 60 * 60 * 1000,
    ).toISOString();
    const since7d = new Date(
      now.getTime() - 7 * 24 * 60 * 60 * 1000,
    ).toISOString();

    const [rendersToday, rollup7d] = await Promise.all([
      safeCount(client, since24h),
      safeModuleRollup(client, since7d),
    ]);

    // "Always empty" = rendered at least once and EVERY render was empty.
    // Sorted by render count desc so the most-frequently-shown empty
    // module (the worst dashboard-theatre offender) is first.
    const alwaysEmpty7d = rollup7d
      .filter((r) => r.renders > 0 && r.emptyRenders === r.renders)
      .sort((a, b) => b.renders - a.renders)
      .slice(0, 5);

    const isEmptyState = rendersToday === 0 && rollup7d.length === 0;

    return {
      modulesObserved7d: rollup7d.length,
      rendersToday,
      alwaysEmpty7d,
      lastUpdatedAt: now.toISOString(),
      isEmptyState,
    };
  },
);
