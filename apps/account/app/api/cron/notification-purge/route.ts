/**
 * V2-NOT-02-A · N6 — Daily 30-day notification purge.
 *
 * Hard-deletes notifications whose `deleted_at` is older than 30 days,
 * across both audiences:
 *   - public.customer_notifications        (lifecycle on the row itself)
 *   - public.staff_notification_states     (per-recipient lifecycle)
 *
 * Staff content rows in `public.staff_notifications` are NOT purged here:
 * a broadcast may still be live for other recipients. A separate orphan
 * sweep (PR-β) handles content rows whose state rows are all gone.
 *
 * Each purged row is followed by an audit insert in
 * `notification_delivery_log` with status='purged', purged_at=NOW(), and
 * metadata.purged_id pointing at the now-removed row id.
 *
 * Security posture mirrors apps/account/app/api/cron/notification-email-
 * fallback/route.ts:
 *   - Bearer-token auth via CRON_SECRET, timingSafeEqual
 *   - per-IP rate limit (1 req / 60 s)
 *   - body cap; reject anything beyond 1 KiB
 *   - GET + POST handlers (Vercel Cron varies)
 *   - safe response codes only (200/401/413/429/500); never leaks shape
 *   - service-role admin client; structured summary log
 *   - runtime: nodejs; dynamic: force-dynamic
 *
 * Schedule: 03:00 UTC daily, defined in apps/account/vercel.json.
 */

import { NextResponse, type NextRequest } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { createAdminSupabase } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CRON_SECRET_ENV = "CRON_SECRET";
const PURGE_AFTER_DAYS = 30;
const BATCH_LIMIT = 500;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 1;
const BODY_CAP = 1024;

type Bucket = { count: number; windowStartedAt: number };
const rateBuckets = new Map<string, Bucket>();

function safe200(body?: Record<string, unknown>) {
  return NextResponse.json(body ?? { ok: true }, { status: 200 });
}
function safe401() {
  return new NextResponse(null, { status: 401 });
}
function safe413() {
  return new NextResponse(null, { status: 413 });
}
function safe429(retryAfterSeconds = 60) {
  return new NextResponse(null, {
    status: 429,
    headers: { "Retry-After": String(retryAfterSeconds) },
  });
}
function safe500() {
  return new NextResponse(null, { status: 500 });
}

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

  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

type AdminClient = ReturnType<typeof createAdminSupabase>;

type PurgeResult = {
  table: string;
  audience: "customer" | "staff";
  scanned: number;
  purged: number;
  auditFailed: number;
  remainingHint: boolean;
};

function cutoffIso(): string {
  const cutoff = new Date(Date.now() - PURGE_AFTER_DAYS * 24 * 60 * 60 * 1000);
  return cutoff.toISOString();
}

async function purgeCustomer(admin: AdminClient): Promise<PurgeResult> {
  const cutoff = cutoffIso();

  // Two-step: select candidate ids, then delete by id and write audit
  // rows. A single DELETE ... RETURNING would be simpler, but supabase-js
  // doesn't expose RETURNING ergonomically across PostgREST versions; the
  // two-step keeps the worker steady across schema changes.
  const { data: candidates, error: selectError } = await admin
    .from("customer_notifications")
    .select("id, user_id, division, category")
    .lt("deleted_at", cutoff)
    .not("deleted_at", "is", null)
    .order("deleted_at", { ascending: true })
    .limit(BATCH_LIMIT);

  if (selectError) {
    console.error("[cron/notification-purge] customer select failed", {
      code: selectError.code,
      message: selectError.message,
    });
    return {
      table: "customer_notifications",
      audience: "customer",
      scanned: 0,
      purged: 0,
      auditFailed: 0,
      remainingHint: false,
    };
  }

  const rows = (candidates || []) as Array<{
    id: string;
    user_id: string;
    division: string | null;
    category: string | null;
  }>;

  if (rows.length === 0) {
    return {
      table: "customer_notifications",
      audience: "customer",
      scanned: 0,
      purged: 0,
      auditFailed: 0,
      remainingHint: false,
    };
  }

  const ids = rows.map((row) => row.id);
  const { error: deleteError } = await admin
    .from("customer_notifications")
    .delete()
    .in("id", ids);

  if (deleteError) {
    console.error("[cron/notification-purge] customer delete failed", {
      code: deleteError.code,
      message: deleteError.message,
      batchSize: ids.length,
    });
    return {
      table: "customer_notifications",
      audience: "customer",
      scanned: rows.length,
      purged: 0,
      auditFailed: 0,
      remainingHint: false,
    };
  }

  const purgedAt = new Date().toISOString();
  const auditRows = rows.map((row) => ({
    user_id: row.user_id,
    notification_id: null,
    channel: "audit" as const,
    provider: "cron" as const,
    status: "purged" as const,
    division: row.division || "account",
    event_name: row.category || "notification.purge",
    publisher: "cron:notification-purge",
    purged_at: purgedAt,
    metadata: {
      audience: "customer",
      purged_table: "customer_notifications",
      purged_id: row.id,
      cutoff,
      trigger: "cron",
    },
  }));

  const { error: auditError } = await admin
    .from("notification_delivery_log")
    .insert(auditRows as never);

  return {
    table: "customer_notifications",
    audience: "customer",
    scanned: rows.length,
    purged: rows.length,
    auditFailed: auditError ? auditRows.length : 0,
    remainingHint: rows.length >= BATCH_LIMIT,
  };
}

async function purgeStaff(admin: AdminClient): Promise<PurgeResult> {
  const cutoff = cutoffIso();

  // Staff lifecycle lives on staff_notification_states (per-recipient).
  // Purging a state row hides the notification for the calling staff
  // without affecting other targeted recipients of the same broadcast.
  const { data: candidates, error: selectError } = await admin
    .from("staff_notification_states")
    .select("id, recipient_user_id, notification_id")
    .lt("deleted_at", cutoff)
    .not("deleted_at", "is", null)
    .order("deleted_at", { ascending: true })
    .limit(BATCH_LIMIT);

  if (selectError) {
    // Staff schema may not be applied yet on every environment; degrade
    // gracefully rather than 5xx the cron.
    console.warn("[cron/notification-purge] staff select skipped", {
      code: selectError.code,
      message: selectError.message,
    });
    return {
      table: "staff_notification_states",
      audience: "staff",
      scanned: 0,
      purged: 0,
      auditFailed: 0,
      remainingHint: false,
    };
  }

  const rows = (candidates || []) as Array<{
    id: string;
    recipient_user_id: string;
    notification_id: string;
  }>;

  if (rows.length === 0) {
    return {
      table: "staff_notification_states",
      audience: "staff",
      scanned: 0,
      purged: 0,
      auditFailed: 0,
      remainingHint: false,
    };
  }

  const ids = rows.map((row) => row.id);
  const { error: deleteError } = await admin
    .from("staff_notification_states")
    .delete()
    .in("id", ids);

  if (deleteError) {
    console.error("[cron/notification-purge] staff delete failed", {
      code: deleteError.code,
      message: deleteError.message,
      batchSize: ids.length,
    });
    return {
      table: "staff_notification_states",
      audience: "staff",
      scanned: rows.length,
      purged: 0,
      auditFailed: 0,
      remainingHint: false,
    };
  }

  const purgedAt = new Date().toISOString();
  const auditRows = rows.map((row) => ({
    user_id: row.recipient_user_id,
    notification_id: null,
    channel: "audit" as const,
    provider: "cron" as const,
    status: "purged" as const,
    division: "staff" as const,
    event_name: "staff.notification.purge",
    publisher: "cron:notification-purge",
    purged_at: purgedAt,
    metadata: {
      audience: "staff",
      purged_table: "staff_notification_states",
      purged_id: row.id,
      staff_notification_id: row.notification_id,
      cutoff,
      trigger: "cron",
    },
  }));

  const { error: auditError } = await admin
    .from("notification_delivery_log")
    .insert(auditRows as never);

  return {
    table: "staff_notification_states",
    audience: "staff",
    scanned: rows.length,
    purged: rows.length,
    auditFailed: auditError ? auditRows.length : 0,
    remainingHint: rows.length >= BATCH_LIMIT,
  };
}

async function handleCron(req: NextRequest): Promise<NextResponse> {
  if (req.headers.get("content-length")) {
    const len = Number(req.headers.get("content-length") || "0");
    if (len > BODY_CAP) return safe413();
  }
  if (!rateLimit(clientIp(req))) return safe429();
  if (!verifyCronAuth(req)) return safe401();

  let admin: AdminClient;
  try {
    admin = createAdminSupabase();
  } catch (error) {
    console.error("[cron/notification-purge] admin client init failed", {
      message: error instanceof Error ? error.message : "unknown",
    });
    return safe500();
  }

  const startedAt = Date.now();
  const [customerResult, staffResult] = await Promise.all([
    purgeCustomer(admin),
    purgeStaff(admin),
  ]);
  const elapsedMs = Date.now() - startedAt;

  const remaining =
    customerResult.remainingHint || staffResult.remainingHint;

  console.info("[cron/notification-purge] complete", {
    elapsedMs,
    customer: {
      purged: customerResult.purged,
      auditFailed: customerResult.auditFailed,
      remainingHint: customerResult.remainingHint,
    },
    staff: {
      purged: staffResult.purged,
      auditFailed: staffResult.auditFailed,
      remainingHint: staffResult.remainingHint,
    },
  });

  return safe200({
    ok: true,
    elapsedMs,
    customerPurged: customerResult.purged,
    staffPurged: staffResult.purged,
    remainingHint: remaining,
  });
}

export async function GET(req: NextRequest) {
  return handleCron(req);
}

export async function POST(req: NextRequest) {
  return handleCron(req);
}
