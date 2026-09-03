import "server-only";

import { cache } from "react";

import { createAdminSupabase } from "./supabase";

/**
 * V3-01 session-health metrics for the owner-workspace tile (Slice 5).
 *
 * Reads counts of the V3-01 session events from `henry_events`
 * (Slice 5b telemetry sink):
 *   - henry.auth.session.refreshed       — silent access-token refresh
 *   - henry.auth.session.refresh_failed  — refresh failed → reauth
 *   - henry.auth.session.reauth_succeeded — user completed reauth
 *   - henry.auth.session.draft_restored  — useFormDraft re-populated state
 *
 * Today + 7-day windows. The 7-day refresh success rate is the
 * owner's headline metric — Addendum A4 sets 1% refresh_failed as
 * the rollback gate (i.e., refreshSuccessRate7d ≥ 99 is the floor).
 *
 * Persistence pipe (Slice 5b):
 *   - refreshed / refresh_failed — written server-side from
 *     `verify-supabase-session` (proxy middleware) via persistEvent.
 *   - reauth_succeeded — written client-side from ReauthClient on
 *     successful re-auth (also via persistEvent).
 *   - draft_restored — still emitEvent-only until the client-side
 *     persistEvent bridge for useFormDraft lands. Tile shows 0 for
 *     this metric until then.
 *
 * Empty state: the tile renders an informational notice when no
 * events have been observed (avoids reading the zero-state as a
 * regression). The state flips the moment the first row lands.
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

// Exclude rows tagged by the v3-01-session-persistence-e2e workflow
// (payload.source='ci'). The marker is set server-side from
// verify-supabase-session whenever process.env.HENRY_TELEMETRY_SOURCE
// is non-empty; production deployments don't set it, so real-user
// rows remain untagged and are always included.
//
// Three-branch OR covers every shape the column can take:
//   payload IS NULL                — events without any payload
//   payload->>'source' IS NULL     — payload exists but no source key
//   payload->>'source' != 'ci'     — payload has source but it's not ci
const EXCLUDE_CI_TAG =
  "payload.is.null,payload->>source.is.null,payload->>source.neq.ci";

async function countSince(
  client: ReturnType<typeof createAdminSupabase>,
  eventName: string,
  sinceISO: string,
): Promise<number> {
  try {
    const { count, error } = await client
      .from("henry_events")
      .select("id", { count: "exact", head: true })
      .eq("name", eventName)
      .gte("created_at", sinceISO)
      .or(EXCLUDE_CI_TAG);
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
