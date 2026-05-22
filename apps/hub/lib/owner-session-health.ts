import "server-only";

import { cache } from "react";

import { createAdminSupabase } from "./supabase";

/**
 * V3-01 session-health metrics for the owner-workspace tile (Slice 5).
 *
 * Reads counts of the 5 V3-01 session events from `customer_activity`:
 *   - henry.auth.session.refreshed       — silent access-token refresh
 *   - henry.auth.session.refresh_failed  — refresh failed → reauth
 *   - henry.auth.session.reauth_succeeded — user completed reauth
 *   - henry.auth.session.draft_restored  — useFormDraft re-populated state
 *   - henry.auth.session.multitab_broadcast — cross-tab signal fired
 *
 * Today + 7-day windows. The 7-day refresh success rate is the
 * owner's headline metric — Addendum A4 sets 1% refresh_failed as
 * the rollback gate.
 *
 * PERSISTENCE NOTE: as of slice 5 the V3-01 emitEvent calls go to
 * pino logs + Sentry breadcrumbs only. To make this tile populate
 * with real numbers, those emit sites need to ALSO write rows to
 * `customer_activity` via the canonical
 * `buildCanonicalActivityMetadata` writer in @henryco/intelligence.
 * That wiring lands as slice 5b (or part of the closure pass). Until
 * then the tile renders the zero-state gracefully — query shape +
 * UI are production-ready; the data pipe is the remaining gap.
 */

export type SessionHealthMetrics = {
  /** Reauths completed by users in the last 24 hours. */
  reauthsToday: number;
  /** Silent access-token refreshes that succeeded in the last 24 hours. */
  refreshedToday: number;
  /** Refresh failures (→ reauth required) in the last 24 hours. */
  refreshFailedToday: number;
  /** Drafts restored from localStorage in the last 24 hours. */
  draftsRestoredToday: number;
  /**
   * Refresh success rate over the last 7 days as 0–100:
   *   refreshed / (refreshed + refresh_failed)
   * Default 100 when no events have been observed yet (avoids
   * showing a misleading "0% success" zero-state).
   */
  refreshSuccessRate7d: number;
  /** Whether the rolling 7-day failure rate is above the A4 1% gate. */
  isAboveRollbackGate: boolean;
  /** Wall-clock ISO at the time these metrics were computed. */
  lastUpdatedAt: string;
  /**
   * True when no V3-01 session events have been observed yet — the
   * tile renders an explanatory empty-state notice. Goes false the
   * moment the first event lands in customer_activity.
   */
  isEmptyState: boolean;
};

const SESSION_EVENT_NAMES = {
  refreshed: "henry.auth.session.refreshed",
  refreshFailed: "henry.auth.session.refresh_failed",
  reauthSucceeded: "henry.auth.session.reauth_succeeded",
  draftRestored: "henry.auth.session.draft_restored",
} as const;

const ROLLBACK_GATE_RATE = 99; // 99% success = below 1% failure (Addendum A4)

async function countSince(
  client: ReturnType<typeof createAdminSupabase>,
  activityType: string,
  sinceISO: string,
): Promise<number> {
  try {
    const { count, error } = await client
      .from("customer_activity")
      .select("id", { count: "exact", head: true })
      .eq("activity_type", activityType)
      .gte("created_at", sinceISO);
    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}

/**
 * Cached per-request — Next.js + React 19's `cache()` dedupes parallel
 * calls during the same render. The owner page renders the tile once
 * per request, so the dedupe is mostly defensive against accidental
 * double-calls during refactor.
 */
export const getSessionHealthMetrics = cache(
  async (): Promise<SessionHealthMetrics> => {
    const client = createAdminSupabase();
    const now = new Date();
    const since24h = new Date(
      now.getTime() - 24 * 60 * 60 * 1000,
    ).toISOString();
    const since7d = new Date(
      now.getTime() - 7 * 24 * 60 * 60 * 1000,
    ).toISOString();

    const [
      reauthsToday,
      refreshedToday,
      refreshFailedToday,
      draftsRestoredToday,
      refreshed7d,
      refreshFailed7d,
    ] = await Promise.all([
      countSince(client, SESSION_EVENT_NAMES.reauthSucceeded, since24h),
      countSince(client, SESSION_EVENT_NAMES.refreshed, since24h),
      countSince(client, SESSION_EVENT_NAMES.refreshFailed, since24h),
      countSince(client, SESSION_EVENT_NAMES.draftRestored, since24h),
      countSince(client, SESSION_EVENT_NAMES.refreshed, since7d),
      countSince(client, SESSION_EVENT_NAMES.refreshFailed, since7d),
    ]);

    const total7d = refreshed7d + refreshFailed7d;
    const refreshSuccessRate7d =
      total7d > 0 ? Math.round((refreshed7d / total7d) * 100) : 100;

    const isEmptyState =
      reauthsToday === 0 &&
      refreshedToday === 0 &&
      refreshFailedToday === 0 &&
      draftsRestoredToday === 0 &&
      total7d === 0;

    return {
      reauthsToday,
      refreshedToday,
      refreshFailedToday,
      draftsRestoredToday,
      refreshSuccessRate7d,
      isAboveRollbackGate: refreshSuccessRate7d < ROLLBACK_GATE_RATE,
      lastUpdatedAt: now.toISOString(),
      isEmptyState,
    };
  },
);
