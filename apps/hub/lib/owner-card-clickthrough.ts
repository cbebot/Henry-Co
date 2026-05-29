import "server-only";

import { cache } from "react";

import { createAdminSupabase } from "./supabase";

/**
 * V3-11 card-clickthrough metrics for the owner-workspace tile.
 *
 * Reads the V3-11 card telemetry events from the `henry_events` table:
 *   - `henry.ui.card.rendered` — a classified card painted.
 *   - `henry.ui.card.clicked`  — the viewer activated the card's next step.
 *   - `henry.ui.card.demoted`  — a card demoted/removed during an audit.
 *
 * The headline read is per-card CLICK-THROUGH RATE = clicks / renders.
 * Per the V3-11 spec: "low click cards may indicate poor next-step
 * alignment." A card that renders often but is rarely clicked is a
 * demotion candidate — its next step is not compelling, or it is
 * informational and mis-styled as actionable.
 *
 * Mirrors the V3-05 SlowSurfaceMetrics pattern in
 * `owner-slow-surfaces.ts`: 24h totals + a ranked list + a graceful
 * empty-state when no data has landed yet.
 *
 * PERSISTENCE NOTE (mirrors V3-01 slice 5b / V3-05 gap): the V3-11 events
 * flow through `@henryco/observability/emitEvent` — pino + Sentry
 * breadcrumbs. To make this tile populate, the client emit sites need to
 * also write rows to `henry_events` via the canonical activity writer.
 * Until that pipe is wired, the tile renders the zero-state cleanly so
 * the owner does not read the zeros as a regression.
 */

export type CardClickThroughRow = {
  /** Stable card identifier (the `card_id` payload field). */
  cardId: string;
  /** Times this card was painted in the window. */
  rendered: number;
  /** Times the card's primary next step was activated. */
  clicked: number;
  /**
   * clicks / renders, rounded to a whole percent. 0 when the card never
   * rendered (avoids division-by-zero). The lower this is at high render
   * counts, the stronger the demotion signal.
   */
  clickThroughPct: number;
};

export type CardClickThroughMetrics = {
  /** `henry.ui.card.rendered` events in the last 24 hours. */
  cardsRenderedToday: number;
  /** `henry.ui.card.clicked` events in the last 24 hours. */
  cardsClickedToday: number;
  /**
   * `henry.ui.card.demoted` events in the last 7 days — audit churn
   * (how many cards an audit demoted/removed recently).
   */
  cardsDemoted7d: number;
  /**
   * Cards ranked by LOWEST click-through over the last 7 days, filtered
   * to those rendered enough times to be meaningful (>= MIN_RENDERS).
   * These are the demotion candidates the owner should review.
   */
  lowestClickThrough7d: ReadonlyArray<CardClickThroughRow>;
  /** Wall-clock ISO at the time these metrics were computed. */
  lastUpdatedAt: string;
  /** True when no V3-11 card events have been observed yet. */
  isEmptyState: boolean;
};

const CARD_EVENT_NAMES = {
  rendered: "henry.ui.card.rendered",
  clicked: "henry.ui.card.clicked",
  demoted: "henry.ui.card.demoted",
} as const;

/** Minimum renders before a card's click-through is statistically worth ranking. */
const MIN_RENDERS = 20;

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

/**
 * Pull rendered + clicked rows for the window and compute per-card
 * click-through in-memory. Volume is modest (one row per card paint),
 * but we soft-cap the scan so a busy week cannot blow the request.
 */
async function safeLowestClickThrough(
  client: ReturnType<typeof createAdminSupabase>,
  sinceISO: string,
): Promise<CardClickThroughMetrics["lowestClickThrough7d"]> {
  try {
    const [renderedRes, clickedRes] = await Promise.all([
      client
        .from("henry_events")
        .select("payload")
        .eq("name", CARD_EVENT_NAMES.rendered)
        .gte("created_at", sinceISO)
        .limit(5000),
      client
        .from("henry_events")
        .select("payload")
        .eq("name", CARD_EVENT_NAMES.clicked)
        .gte("created_at", sinceISO)
        .limit(5000),
    ]);
    if (renderedRes.error || clickedRes.error) return [];

    const renders = new Map<string, number>();
    const clicks = new Map<string, number>();

    for (const row of (renderedRes.data ?? []) as Array<{
      payload?: Record<string, unknown>;
    }>) {
      const cardId =
        typeof row.payload?.card_id === "string" ? row.payload.card_id : null;
      if (!cardId) continue;
      renders.set(cardId, (renders.get(cardId) ?? 0) + 1);
    }
    for (const row of (clickedRes.data ?? []) as Array<{
      payload?: Record<string, unknown>;
    }>) {
      const cardId =
        typeof row.payload?.card_id === "string" ? row.payload.card_id : null;
      if (!cardId) continue;
      clicks.set(cardId, (clicks.get(cardId) ?? 0) + 1);
    }

    const rows: CardClickThroughRow[] = [];
    for (const [cardId, rendered] of renders.entries()) {
      if (rendered < MIN_RENDERS) continue;
      const clicked = clicks.get(cardId) ?? 0;
      const clickThroughPct =
        rendered > 0 ? Math.round((clicked / rendered) * 100) : 0;
      rows.push({ cardId, rendered, clicked, clickThroughPct });
    }

    return rows
      .sort((a, b) => a.clickThroughPct - b.clickThroughPct)
      .slice(0, 5);
  } catch {
    return [];
  }
}

/**
 * Cached per-request — Next.js + React 19's `cache()` dedupes parallel
 * calls during the same render.
 */
export const getCardClickThroughMetrics = cache(
  async (): Promise<CardClickThroughMetrics> => {
    const client = createAdminSupabase();
    const now = new Date();
    const since24h = new Date(
      now.getTime() - 24 * 60 * 60 * 1000,
    ).toISOString();
    const since7d = new Date(
      now.getTime() - 7 * 24 * 60 * 60 * 1000,
    ).toISOString();

    const [
      cardsRenderedToday,
      cardsClickedToday,
      cardsDemoted7d,
      lowestClickThrough7d,
    ] = await Promise.all([
      safeCount(client, CARD_EVENT_NAMES.rendered, since24h),
      safeCount(client, CARD_EVENT_NAMES.clicked, since24h),
      safeCount(client, CARD_EVENT_NAMES.demoted, since7d),
      safeLowestClickThrough(client, since7d),
    ]);

    const isEmptyState =
      cardsRenderedToday === 0 &&
      cardsClickedToday === 0 &&
      cardsDemoted7d === 0 &&
      lowestClickThrough7d.length === 0;

    return {
      cardsRenderedToday,
      cardsClickedToday,
      cardsDemoted7d,
      lowestClickThrough7d,
      lastUpdatedAt: now.toISOString(),
      isEmptyState,
    };
  },
);
