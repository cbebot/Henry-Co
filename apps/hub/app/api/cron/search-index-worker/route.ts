/**
 * V2-SEARCH-01 + V3 PASS 21 / H7 — search index worker.
 *
 * Drains `public.search_index_outbox` and pushes pending operations to
 * Typesense. Designed to be invoked from Vercel Cron at 60s cadence
 * (see apps/hub/vercel.json) or manually via curl with the CRON_SECRET.
 *
 * H7 closure: after the drain, the worker measures the remaining
 * backlog (pending rows older than 60 seconds). If the backlog crosses
 * the alert threshold the worker:
 *   - emits a structured `search.outbox.backlog.alert` log line
 *   - captures a Sentry warning with the backlog count + threshold
 *   - includes `backlog_alert: true` in the JSON response
 *
 * Operators on the messaging-alerts surface can group on the action
 * name to spot sustained outbox stress without bespoke wiring.
 */

import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { Logger } from "@henryco/observability";
import { drainOutbox, ensureCollectionsExist } from "@henryco/search-core";

import { createAdminSupabase } from "@/app/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Default alert threshold — backlog rows > this number causes a
 * warning to fire. Tunable via `SEARCH_OUTBOX_ALERT_THRESHOLD` env
 * var so operators can pin a tighter ceiling during incident windows.
 */
const DEFAULT_BACKLOG_ALERT_THRESHOLD = 100;

const searchLogger = new Logger({ namespace: "hub.cron.search-index-worker" });

function isAuthorized(request: Request) {
  const expected = (process.env.CRON_SECRET ?? "").trim();
  if (!expected) return false;
  return request.headers.get("authorization") === `Bearer ${expected}`;
}

function resolveBacklogThreshold(): number {
  const raw = Number((process.env.SEARCH_OUTBOX_ALERT_THRESHOLD ?? "").trim());
  if (Number.isFinite(raw) && raw > 0) return raw;
  return DEFAULT_BACKLOG_ALERT_THRESHOLD;
}

async function measureBacklog(
  supabase: ReturnType<typeof createAdminSupabase>,
): Promise<{ backlog: number | null; error: string | null }> {
  const sixtySecondsAgo = new Date(Date.now() - 60_000).toISOString();
  const { count, error } = await supabase
    .from("search_index_outbox")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending")
    .lt("created_at", sixtySecondsAgo);

  if (error) {
    return { backlog: null, error: error.message };
  }
  return { backlog: count ?? 0, error: null };
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const provision = ["1", "true", "yes"].includes(
    String(url.searchParams.get("provision") ?? "").trim().toLowerCase(),
  );

  try {
    const supabase = createAdminSupabase();

    if (provision) {
      const provisioned = await ensureCollectionsExist({});
      return NextResponse.json({ ok: true, provisioned });
    }

    const startedAt = Date.now();
    const result = await drainOutbox({ supabase });

    // Opportunistic prune of completed rows older than 7 days.
    await supabase.rpc("purge_completed_search_outbox", {
      p_older_than: "7 days",
    });

    // V3 PASS 21 / H7 — measure remaining backlog + alert on overflow.
    const threshold = resolveBacklogThreshold();
    const { backlog, error: backlogError } = await measureBacklog(supabase);
    const backlogAlert =
      backlog !== null && backlog > threshold;

    const durationMs = Date.now() - startedAt;

    if (backlogAlert) {
      searchLogger.warn("search.outbox.backlog.alert", {
        backlog,
        threshold,
        durationMs,
      });
      Sentry.captureMessage(
        `search index outbox backlog ${backlog} exceeds threshold ${threshold}`,
        {
          level: "warning",
          tags: { surface: "hub.cron.search-index-worker", alert: "backlog" },
          extra: { backlog, threshold, drainResult: result },
        },
      );
    } else if (backlogError) {
      searchLogger.warn("search.outbox.backlog.measure_failed", {
        error: backlogError,
        durationMs,
      });
    } else {
      searchLogger.info("search.outbox.drain.ok", {
        backlog,
        threshold,
        durationMs,
      });
    }

    return NextResponse.json({
      ok: true,
      ...result,
      backlog,
      backlog_threshold: threshold,
      backlog_alert: backlogAlert,
      duration_ms: durationMs,
    });
  } catch (error) {
    Sentry.captureException(error, {
      tags: { surface: "hub.cron.search-index-worker" },
    });
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Search worker failed.",
      },
      { status: 500 },
    );
  }
}
