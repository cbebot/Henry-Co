/**
 * V2-SEARCH-01 + V3 PASS 21 / H7 + SEARCH-01 — search index worker.
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
 * SEARCH-01 closure (Phase 2 — indexing reliability):
 *   1. Backlog probe queried non-existent columns (`status`, `created_at`)
 *      against the real schema (`completed_at`, `enqueued_at`). Fixed.
 *   2. Emits `henry.search.indexing.lag` per drain with backlog +
 *      oldest_pending_age_s so the owner observability tile can compute
 *      the indexing SLO.
 *   3. Emits `henry.search.indexing.failed` per failed-batch class with
 *      a `failure_class` discriminant.
 *   4. Detects `attempts >= MAX_ATTEMPTS` rows and emits
 *      `henry.search.indexing.dead_letter` so they surface (no Dead-
 *      Letter table written in this pass — owner-gated).
 *
 * Operators on the messaging-alerts surface can group on the action
 * name to spot sustained outbox stress without bespoke wiring.
 */

import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { Logger, emitEvent } from "@henryco/observability";
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
/**
 * Mirrors `MAX_ATTEMPTS` in `@henryco/search-core/outbox`. Kept here as
 * a separate const so the worker can emit a dead-letter event without
 * importing the constant; if the search-core value changes, bump here.
 */
const MAX_ATTEMPTS = 8;

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

interface BacklogProbeResult {
  backlog: number | null;
  oldest_pending_age_s: number | null;
  error: string | null;
}

/**
 * Pending rows = `completed_at IS NULL AND attempts < MAX_ATTEMPTS`.
 *
 * "Stale" means the row has been pending longer than 60 seconds — that
 * lets the cron tick land within the SLO before alerting. We surface
 * both the count AND the age of the oldest pending row so the lag
 * event payload carries enough signal for the owner tile to render the
 * worst-case age without an extra query.
 */
async function measureBacklog(
  supabase: ReturnType<typeof createAdminSupabase>,
): Promise<BacklogProbeResult> {
  const sixtySecondsAgo = new Date(Date.now() - 60_000).toISOString();

  const countQuery = supabase
    .from("search_index_outbox")
    .select("id", { count: "exact", head: true })
    .is("completed_at", null)
    .lt("attempts", MAX_ATTEMPTS)
    .lt("enqueued_at", sixtySecondsAgo);

  const oldestQuery = supabase
    .from("search_index_outbox")
    .select("enqueued_at")
    .is("completed_at", null)
    .lt("attempts", MAX_ATTEMPTS)
    .order("enqueued_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const [{ count, error: countError }, { data: oldestRow, error: oldestError }] = await Promise.all(
    [countQuery, oldestQuery],
  );

  if (countError) {
    return { backlog: null, oldest_pending_age_s: null, error: countError.message };
  }

  let oldest_pending_age_s: number | null = null;
  if (!oldestError && oldestRow?.enqueued_at) {
    const enqueuedAtMs = new Date(oldestRow.enqueued_at).getTime();
    if (Number.isFinite(enqueuedAtMs)) {
      oldest_pending_age_s = Math.max(0, Math.floor((Date.now() - enqueuedAtMs) / 1000));
    }
  }

  return { backlog: count ?? 0, oldest_pending_age_s, error: null };
}

/**
 * Count rows that have reached MAX_ATTEMPTS and are NOT yet completed
 * — these are effectively dead-letter and cannot be re-drained until
 * an operator intervenes. We emit a per-tick count so the owner tile
 * can surface a non-zero dead-letter quantity even when no new
 * failure happens this tick.
 */
async function measureDeadLetter(
  supabase: ReturnType<typeof createAdminSupabase>,
): Promise<number | null> {
  const { count, error } = await supabase
    .from("search_index_outbox")
    .select("id", { count: "exact", head: true })
    .is("completed_at", null)
    .gte("attempts", MAX_ATTEMPTS);
  if (error) return null;
  return count ?? 0;
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
    const result = await drainOutbox({
      supabase,
      onFailure: (report) => {
        emitEvent({
          name: "henry.search.indexing.failed",
          classification: "system_state",
          outcome: "failed",
          payload: {
            failure_class: report.failure_class,
            collection: report.collection,
            count: report.count,
            message: report.message,
          },
        });
      },
    });

    // Opportunistic prune of completed rows older than 7 days.
    await supabase.rpc("purge_completed_search_outbox", {
      p_older_than: "7 days",
    });

    // V3 PASS 21 / H7 + SEARCH-01 — measure remaining backlog + alert.
    const threshold = resolveBacklogThreshold();
    const [{ backlog, oldest_pending_age_s, error: backlogError }, deadLetter] = await Promise.all(
      [measureBacklog(supabase), measureDeadLetter(supabase)],
    );
    const backlogAlert = backlog !== null && backlog > threshold;

    const durationMs = Date.now() - startedAt;

    // SEARCH-01: per-failure events fire from inside `drainOutbox`
    // via the injected `onFailure` emitter (one event per failed
    // batch with its precise `failure_class`). The worker-level
    // `lag` event below is the per-drain summary.

    // SEARCH-01: per-drain lag event. Backlog `null` is a measurement
    // failure (probably auth / column drift) — still emit so operators
    // know the probe is broken; carry the error message.
    emitEvent({
      name: "henry.search.indexing.lag",
      classification: "system_state",
      outcome: backlogAlert ? "blocked" : "completed",
      payload: {
        backlog,
        backlog_threshold: threshold,
        oldest_pending_age_s,
        dead_letter: deadLetter,
        processed: result.processed,
        upserted: result.upserted,
        deleted: result.deleted,
        failed: result.failed,
        duration_ms: durationMs,
        probe_error: backlogError,
      },
    });

    // SEARCH-01: surface dead-letter count when non-zero. Owner can
    // decide whether to manually requeue or surgically delete.
    if (deadLetter !== null && deadLetter > 0) {
      emitEvent({
        name: "henry.search.indexing.dead_letter",
        classification: "system_state",
        outcome: "blocked",
        payload: {
          dead_letter: deadLetter,
          duration_ms: durationMs,
        },
      });
    }

    if (backlogAlert) {
      searchLogger.warn("search.outbox.backlog.alert", {
        backlog,
        threshold,
        oldest_pending_age_s,
        durationMs,
      });
      Sentry.captureMessage(
        `search index outbox backlog ${backlog} exceeds threshold ${threshold}`,
        {
          level: "warning",
          tags: { surface: "hub.cron.search-index-worker", alert: "backlog" },
          extra: { backlog, threshold, oldest_pending_age_s, drainResult: result },
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
        oldest_pending_age_s,
        dead_letter: deadLetter,
        durationMs,
      });
    }

    return NextResponse.json({
      ok: true,
      ...result,
      backlog,
      backlog_threshold: threshold,
      backlog_alert: backlogAlert,
      oldest_pending_age_s,
      dead_letter: deadLetter,
      duration_ms: durationMs,
    });
  } catch (error) {
    Sentry.captureException(error, {
      tags: { surface: "hub.cron.search-index-worker" },
    });
    // SEARCH-01: top-level throw is a hard failure class — emit the
    // event so the owner tile sees the gap.
    emitEvent({
      name: "henry.search.indexing.failed",
      classification: "system_state",
      outcome: "failed",
      payload: {
        failure_class: "worker_throw",
        message: error instanceof Error ? error.message : String(error),
      },
    });
    return NextResponse.json(
      {
        ok: false,
        // Raw error already captured in the internal event above — the response
        // body stays generic.
        error: "Search worker failed.",
      },
      { status: 500 },
    );
  }
}
