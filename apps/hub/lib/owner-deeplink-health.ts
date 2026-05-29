import "server-only";

import { cache } from "react";

import { createAdminSupabase } from "./supabase";

/**
 * V3-04 (S7) — owner-workspace deep-link health metrics.
 *
 * Data source: `henry_events` rows written by the S8 recorders
 * (`recordDeepLinkArrived` / `recordDeepLinkDeadLink` in
 * `@henryco/observability`). 24-hour window. Two concerns:
 *   1. Dead links     — `name='henry.deeplink.dead_link'`, ranked by the
 *      404'd `payload->>'target'` so the owner sees WHICH links are broken.
 *   2. Arrivals       — `name='henry.deeplink.arrived'`, split by
 *      `payload->>'outcome'` (ok / auth_gated / not_found) so the owner
 *      sees whether attributed links land or bounce.
 *
 * IMPORTANT: the canonical `henry_events` schema is
 * { id, name, actor_id, payload jsonb, created_at } — there is NO
 * `outcome` column. The arrival outcome + dead-link target live INSIDE
 * `payload`, so we SELECT `payload` and group in JS rather than filtering
 * on a column that does not exist. (The V3-10 observability tile filters
 * `.eq("outcome", …)` against the missing column — tracked separately;
 * this tile deliberately does not repeat that pattern.)
 *
 * Pattern mirrors `owner-observability.ts`: cache(), parallel windowed
 * reads, try/catch → empty-state on failure (telemetry health must never
 * throw on the owner dashboard).
 */

const WINDOW_MS = 24 * 60 * 60 * 1000;
const TOP_N = 8;

export type DeadLinkRow = {
  /** The 404'd target path, e.g. "/modules/does-not-exist". */
  target: string;
  count: number;
  /** ISO timestamp of the most recent hit for this target. */
  lastSeenAt: string;
};

export type ArrivalOutcomeRow = {
  /** "ok" | "auth_gated" | "not_found" | "unknown" (defensive). */
  outcome: string;
  count: number;
};

export type DeepLinkHealthMetrics = {
  /** Count of dead-link events in the last 24h. */
  deadLinks24h: number;
  /** Top dead links by hit count (most-broken first). */
  topDeadLinks: DeadLinkRow[];
  /** Count of attributed deep-link arrivals in the last 24h. */
  arrivals24h: number;
  /** Arrival outcomes split (ok vs auth-gated vs not-found). */
  arrivalsByOutcome: ArrivalOutcomeRow[];
  /** Wall-clock ISO when these metrics were computed. */
  lastUpdatedAt: string;
  /** True when no deep-link events have been observed yet. */
  isEmptyState: boolean;
};

/** Read a string field out of a jsonb payload, defensively. */
function payloadString(payload: unknown, key: string): string | null {
  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    const value = (payload as Record<string, unknown>)[key];
    if (typeof value === "string") return value;
  }
  return null;
}

type EventRow = { payload: unknown; created_at: string };

function rankDeadLinks(rows: EventRow[], limit: number): DeadLinkRow[] {
  const byTarget = new Map<string, { count: number; lastSeenAt: string }>();
  for (const row of rows) {
    const target = payloadString(row.payload, "target") ?? "(unknown)";
    const prev = byTarget.get(target);
    if (prev) {
      prev.count += 1;
      if (row.created_at > prev.lastSeenAt) prev.lastSeenAt = row.created_at;
    } else {
      byTarget.set(target, { count: 1, lastSeenAt: row.created_at });
    }
  }
  return Array.from(byTarget.entries())
    .map(([target, value]) => ({ target, ...value }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

function rankOutcomes(rows: EventRow[]): ArrivalOutcomeRow[] {
  const byOutcome = new Map<string, number>();
  for (const row of rows) {
    const outcome = payloadString(row.payload, "outcome") ?? "unknown";
    byOutcome.set(outcome, (byOutcome.get(outcome) ?? 0) + 1);
  }
  return Array.from(byOutcome.entries())
    .map(([outcome, count]) => ({ outcome, count }))
    .sort((a, b) => b.count - a.count);
}

export const getDeepLinkHealthMetrics = cache(
  async (): Promise<DeepLinkHealthMetrics> => {
    const client = createAdminSupabase();
    const now = new Date();
    const sinceISO = new Date(now.getTime() - WINDOW_MS).toISOString();

    let deadRows: EventRow[] = [];
    let arrivalRows: EventRow[] = [];

    try {
      const [deadResult, arrivalResult] = await Promise.all([
        client
          .from("henry_events")
          .select("payload, created_at")
          .eq("name", "henry.deeplink.dead_link")
          .gte("created_at", sinceISO)
          .limit(5000),
        client
          .from("henry_events")
          .select("payload, created_at")
          .eq("name", "henry.deeplink.arrived")
          .gte("created_at", sinceISO)
          .limit(5000),
      ]);
      if (!deadResult.error && Array.isArray(deadResult.data)) {
        deadRows = deadResult.data as EventRow[];
      }
      if (!arrivalResult.error && Array.isArray(arrivalResult.data)) {
        arrivalRows = arrivalResult.data as EventRow[];
      }
    } catch {
      deadRows = [];
      arrivalRows = [];
    }

    const deadLinks24h = deadRows.length;
    const arrivals24h = arrivalRows.length;

    return {
      deadLinks24h,
      topDeadLinks: rankDeadLinks(deadRows, TOP_N),
      arrivals24h,
      arrivalsByOutcome: rankOutcomes(arrivalRows),
      lastUpdatedAt: now.toISOString(),
      isEmptyState: deadLinks24h === 0 && arrivals24h === 0,
    };
  },
);
