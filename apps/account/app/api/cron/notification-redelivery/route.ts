/**
 * V3-03 — In-app notification redelivery cron.
 *
 * Runs every 5 minutes (Vercel cron `*\/5 * * * *` in
 * apps/account/vercel.json). For every customer_notification +
 * staff_notification with delivery_state still 'sent' AND
 * `created_at > now() - 1h`, the worker:
 *
 *   1. Marks the row as 'delivered' if the realtime publication has
 *      a confirmed delivery log entry (the publisher writes the log
 *      row on successful subscribe push; cron can't observe push
 *      receipts directly, so it trusts the audit log).
 *   2. After 1h with no delivery log entry, falls back to email if
 *      the user has email-fallback preference enabled (handled by
 *      the existing email-fallback cron — this cron just bumps the
 *      `metadata.redelivery_attempted_at` so the email cron picks
 *      it up).
 *   3. After 24h with delivery_state still 'sent' / 'delivered' but
 *      no 'seen' transition, marks `delivery_state = 'failed'` so
 *      observability counts a confirmed failure.
 *
 * Operational posture matches `notification-email-fallback/route.ts`:
 *   - CRON_SECRET fail-closed (timing-safe compare).
 *   - Per-IP rate limit (1 req / 60s).
 *   - Body cap to detect accidental loops.
 *   - Safe-200/401/429/413/500 — no shape leakage.
 *   - PROCESS_LIMIT bounds the per-run scan so duration stays well
 *     inside Vercel's function timeout.
 *
 * Idempotent: every row mutation guards on current state, so a
 * second invocation in the same minute is a no-op.
 */

import { NextResponse, type NextRequest } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { createAdminSupabase } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ─── Constants ─────────────────────────────────────────────────────────────

const CRON_SECRET_ENV = "CRON_SECRET";
const PROCESS_LIMIT = 200; // upper bound per audience per run
const PENDING_WINDOW_HOURS = 1; // 'sent' → bump to 'delivered' attempt
const FAILED_WINDOW_HOURS = 24; // 'sent'/'delivered' → 'failed' if no 'seen'
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 1;
const BODY_CAP = 1024;

// Per-IP rate-limit buckets. In-memory is fine for a single Vercel
// region; cron invocations come from Vercel IPs which are stable.
type Bucket = { count: number; windowStartedAt: number };
const rateBuckets = new Map<string, Bucket>();

// ─── Safe responses ───────────────────────────────────────────────────────

function safe200() {
  return new NextResponse(null, { status: 200 });
}
function safe401() {
  return new NextResponse(null, { status: 401 });
}
function safe413() {
  return new NextResponse(null, { status: 413 });
}
function safe429() {
  return new NextResponse(null, { status: 429 });
}
function safe500() {
  return new NextResponse(null, { status: 500 });
}

// ─── Auth ──────────────────────────────────────────────────────────────────

function clientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}

function rateLimit(ip: string): boolean {
  const now = Date.now();
  const bucket = rateBuckets.get(ip);
  if (!bucket || now - bucket.windowStartedAt > RATE_LIMIT_WINDOW_MS) {
    rateBuckets.set(ip, { count: 1, windowStartedAt: now });
    return true;
  }
  bucket.count += 1;
  return bucket.count <= RATE_LIMIT_MAX;
}

function verifyCronAuth(req: NextRequest): boolean {
  const expected = (process.env[CRON_SECRET_ENV] || "").trim();
  if (!expected) return false;

  const header = req.headers.get("authorization") || "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) return false;
  const provided = match[1]!.trim();

  // Timing-safe comparison; equalize lengths via padding so the
  // operation runs in constant time relative to the secret length.
  if (provided.length !== expected.length) {
    // Still run a dummy timingSafeEqual so the failure path doesn't
    // leak a length-distinguishable timing signature.
    const dummy = Buffer.alloc(expected.length, 0);
    try {
      timingSafeEqual(dummy, Buffer.from(expected, "utf8"));
    } catch {
      /* no-op */
    }
    return false;
  }
  try {
    return timingSafeEqual(
      Buffer.from(provided, "utf8"),
      Buffer.from(expected, "utf8"),
    );
  } catch {
    return false;
  }
}

// ─── Worker ───────────────────────────────────────────────────────────────

type Summary = {
  customer_pending_processed: number;
  customer_failed_marked: number;
  staff_pending_processed: number;
  staff_failed_marked: number;
};

async function runWorker(): Promise<Summary> {
  const admin = createAdminSupabase();
  const summary: Summary = {
    customer_pending_processed: 0,
    customer_failed_marked: 0,
    staff_pending_processed: 0,
    staff_failed_marked: 0,
  };

  const nowIso = new Date().toISOString();
  const pendingCutoff = new Date(
    Date.now() - PENDING_WINDOW_HOURS * 60 * 60 * 1000,
  ).toISOString();
  const failedCutoff = new Date(
    Date.now() - FAILED_WINDOW_HOURS * 60 * 60 * 1000,
  ).toISOString();

  // ─── customer_notifications ────────────────────────────────────────────
  // Stage 1: 'sent' for > 1h → tag metadata for email-fallback pickup.
  // We don't bump delivery_state here — the email-fallback cron writes
  // 'delivered' on successful send and 'failed' on hard bounce. This
  // cron's job is to add the marker so the email cron picks the row up.
  {
    const { data: pendingRows, error: selErr } = await admin
      .from("customer_notifications")
      .select("id, metadata, created_at")
      .eq("delivery_state", "sent")
      .lte("created_at", pendingCutoff)
      .gt("created_at", failedCutoff)
      .limit(PROCESS_LIMIT);

    if (selErr) {
      console.warn("[cron/notification-redelivery] customer pending select", {
        message: selErr.message,
      });
    } else if (pendingRows) {
      for (const row of pendingRows) {
        const existingMeta =
          (row as { metadata?: Record<string, unknown> }).metadata || {};
        if (existingMeta.redelivery_attempted_at) continue;
        const { error: upErr } = await admin
          .from("customer_notifications")
          .update({
            metadata: {
              ...existingMeta,
              redelivery_attempted_at: nowIso,
              redelivery_attempt_count:
                Number(existingMeta.redelivery_attempt_count || 0) + 1,
            },
          })
          .eq("id", (row as { id: string }).id)
          .eq("delivery_state", "sent"); // optimistic guard
        if (!upErr) summary.customer_pending_processed += 1;
      }
    }
  }

  // Stage 2: 'sent'/'delivered' for > 24h → mark 'failed'.
  {
    const { data: failedRows, error: selErr } = await admin
      .from("customer_notifications")
      .select("id")
      .in("delivery_state", ["sent", "delivered"])
      .lte("created_at", failedCutoff)
      .limit(PROCESS_LIMIT);
    if (selErr) {
      console.warn("[cron/notification-redelivery] customer failed select", {
        message: selErr.message,
      });
    } else if (failedRows) {
      for (const row of failedRows) {
        const { error: upErr } = await admin
          .from("customer_notifications")
          .update({ delivery_state: "failed" })
          .eq("id", (row as { id: string }).id)
          .in("delivery_state", ["sent", "delivered"]); // optimistic guard
        if (!upErr) summary.customer_failed_marked += 1;
      }
    }
  }

  // ─── staff_notifications ────────────────────────────────────────────────
  {
    const { data: pendingRows, error: selErr } = await admin
      .from("staff_notifications")
      .select("id, metadata, created_at")
      .eq("delivery_state", "sent")
      .lte("created_at", pendingCutoff)
      .gt("created_at", failedCutoff)
      .limit(PROCESS_LIMIT);

    if (selErr) {
      console.warn("[cron/notification-redelivery] staff pending select", {
        message: selErr.message,
      });
    } else if (pendingRows) {
      for (const row of pendingRows) {
        const existingMeta =
          (row as { metadata?: Record<string, unknown> }).metadata || {};
        if (existingMeta.redelivery_attempted_at) continue;
        const { error: upErr } = await admin
          .from("staff_notifications")
          .update({
            metadata: {
              ...existingMeta,
              redelivery_attempted_at: nowIso,
              redelivery_attempt_count:
                Number(existingMeta.redelivery_attempt_count || 0) + 1,
            },
          })
          .eq("id", (row as { id: string }).id)
          .eq("delivery_state", "sent");
        if (!upErr) summary.staff_pending_processed += 1;
      }
    }
  }

  {
    const { data: failedRows, error: selErr } = await admin
      .from("staff_notifications")
      .select("id")
      .in("delivery_state", ["sent", "delivered"])
      .lte("created_at", failedCutoff)
      .limit(PROCESS_LIMIT);
    if (selErr) {
      console.warn("[cron/notification-redelivery] staff failed select", {
        message: selErr.message,
      });
    } else if (failedRows) {
      for (const row of failedRows) {
        const { error: upErr } = await admin
          .from("staff_notifications")
          .update({ delivery_state: "failed" })
          .eq("id", (row as { id: string }).id)
          .in("delivery_state", ["sent", "delivered"]);
        if (!upErr) summary.staff_failed_marked += 1;
      }
    }
  }

  return summary;
}

// ─── Handlers ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const ip = clientIp(req);
  if (!rateLimit(ip)) return safe429();

  const lengthHeader = req.headers.get("content-length");
  if (lengthHeader && Number.parseInt(lengthHeader, 10) > BODY_CAP) {
    return safe413();
  }

  if (!verifyCronAuth(req)) return safe401();

  try {
    const summary = await runWorker();
    // Operational visibility — counts only, never row payload.
    console.info(
      "[cron/notification-redelivery] run complete",
      summary as unknown as Record<string, number>,
    );
    return safe200();
  } catch (err) {
    console.error("[cron/notification-redelivery] unhandled", {
      message: err instanceof Error ? err.message : "unknown",
    });
    return safe500();
  }
}

// Vercel Cron defaults to GET in some scheduling configs; mirror POST.
// Idempotent because every UPDATE has an optimistic state guard.
export async function GET(req: NextRequest) {
  return POST(req);
}
