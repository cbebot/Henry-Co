import "server-only";

/**
 * V3-41 — the bounded, service-role readers that feed the pure engines.
 *
 * Three rules, all load-bearing:
 *
 *   1. BOUNDED. Every read carries an explicit time window AND a row limit. A
 *      nightly batch must never attempt an unbounded scan.
 *   2. BEST-EFFORT. Every reader is wrapped so a missing table, a renamed column
 *      or a PostgREST error yields an EMPTY result instead of failing the run.
 *      The batch then simply contributes nothing for that queue/unit type.
 *   3. IDS AND NUMBERS ONLY. Nothing here selects a name, an email, an address,
 *      a message body or any other personal field. The engines never see one, so
 *      no personal content can reach a persisted row or a telemetry payload.
 *
 * Why service-role: this is PLATFORM-INVOKED work with no viewer. It is also
 * required — `support_threads` has a staff UPDATE policy but no staff SELECT
 * policy, so an RLS-scoped staff client reads only its own operator's threads.
 * Because there is no viewer, there is also no viewer to leak ACROSS: the batch
 * writes to staff-only tables, and the staff surface re-reads them under RLS.
 */

import type {
  DisputeFeatures,
  ObservedDay,
  QualitySignals,
  QueueKey,
  QueueObservation,
  ServiceUnitType,
} from "@henryco/intelligence";
import { createAdminSupabase } from "@/lib/supabase";
import {
  QUEUE_HISTORY_DAYS,
  QUEUE_HISTORY_PAGE_SIZE,
  QUEUE_HISTORY_ROW_LIMIT,
  SERVICE_UNIT_LIMIT,
  TRANSACTION_LIMIT,
} from "./config";
import { isMissingRelation } from "./postgrest-head";

const MS_PER_HOUR = 3_600_000;
const MS_PER_DAY = 86_400_000;

/** Which table + arrival column backs each operator queue. Verified against the
 *  live Track C modules and the prod schema. */
const QUEUE_SOURCES: Record<QueueKey, ReadonlyArray<{ table: string; column: string }>> = {
  support: [{ table: "support_threads", column: "created_at" }],
  kyc_review: [{ table: "customer_verification_submissions", column: "submitted_at" }],
  moderation: [
    { table: "platform_moderation_queue", column: "created_at" },
    { table: "moderation_reports", column: "created_at" },
  ],
  finance: [{ table: "marketplace_payout_requests", column: "created_at" }],
  refunds: [{ table: "marketplace_refunds", column: "created_at" }],
  logistics_ops: [{ table: "logistics_shipments", column: "created_at" }],
};

function hourBucket(iso: string): string | null {
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return null;
  return new Date(Math.floor(ms / MS_PER_HOUR) * MS_PER_HOUR).toISOString();
}

/**
 * Read the last N days of ARRIVAL timestamps for a queue and fold them into
 * dense hourly buckets. Hours with no arrivals become explicit zeros — without
 * them the forecaster would only ever see busy hours and would systematically
 * over-predict the quiet ones.
 */
export async function readQueueHistory(queue: QueueKey, now: Date): Promise<QueueObservation[]> {
  const since = new Date(now.getTime() - QUEUE_HISTORY_DAYS * MS_PER_DAY);
  const counts = new Map<string, number>();

  // NEWEST-FIRST, paged (V3-42 adversarial round 2). PostgREST caps every
  // response at max_rows = 1000, so the old single ascending read silently
  // dropped the MOST RECENT days of any queue above ~36 arrivals/day, and the
  // densify below turned them into zeros. Reading DESC in pages means a read
  // that exhausts its budget loses only the OLDEST history.
  let partialFromMs: number | null = null;
  for (const source of QUEUE_SOURCES[queue]) {
    try {
      const admin = createAdminSupabase();
      let offset = 0;
      let oldestMs: number | null = null;
      let exhausted = false;
      while (offset < QUEUE_HISTORY_ROW_LIMIT) {
        const { data, error } = await admin
          .from(source.table)
          .select(source.column)
          .gte(source.column, since.toISOString())
          .lte(source.column, now.toISOString())
          .order(source.column, { ascending: false })
          .range(offset, offset + QUEUE_HISTORY_PAGE_SIZE - 1);
        if (error || !data) {
          // A failure on the FIRST page means the source contributed nothing.
          // A failure mid-read is a TRUNCATION (round 3): its older history is
          // missing, not zero, so it must cut the history like a spent budget.
          exhausted = offset === 0;
          break;
        }
        // The column name is dynamic, so PostgREST's generated types cannot narrow
        // the row shape; go through `unknown` and read defensively.
        for (const row of data as unknown as ReadonlyArray<Record<string, unknown>>) {
          const raw = row[source.column];
          if (typeof raw !== "string") continue;
          const bucket = hourBucket(raw);
          if (!bucket) continue;
          counts.set(bucket, (counts.get(bucket) ?? 0) + 1);
          const ms = Date.parse(bucket);
          if (oldestMs === null || ms < oldestMs) oldestMs = ms;
        }
        offset += data.length;
        if (data.length < QUEUE_HISTORY_PAGE_SIZE) {
          exhausted = true;
          break;
        }
      }
      // The row budget ran out before the source did: its oldest hour is only
      // partly counted, so the history must start after it.
      if (!exhausted && oldestMs !== null && (partialFromMs === null || oldestMs > partialFromMs)) {
        partialFromMs = oldestMs;
      }
    } catch {
      // A missing table or column contributes nothing — never fails the run.
    }
  }

  if (partialFromMs !== null) {
    for (const key of [...counts.keys()]) if (Date.parse(key) <= partialFromMs) counts.delete(key);
  }
  if (counts.size === 0) return [];

  // Densify: fill every hour between the first fully-read hour and `now`. An
  // untruncated read covered the whole window back to `since`, so the hours
  // before the first arrival are KNOWN zeros (round 3: a dormant queue that
  // suddenly flooded used to start its history at the flood and lose it).
  const startMs = partialFromMs !== null
    ? partialFromMs + MS_PER_HOUR
    : Math.ceil(since.getTime() / MS_PER_HOUR) * MS_PER_HOUR;
  const endMs = Math.floor(now.getTime() / MS_PER_HOUR) * MS_PER_HOUR;
  const out: QueueObservation[] = [];
  for (let ms = startMs; ms <= endMs; ms += MS_PER_HOUR) {
    const at = new Date(ms).toISOString();
    out.push({ at, count: counts.get(at) ?? 0 });
  }
  return out;
}

/**
 * EXACT arrivals per COMPLETE UTC day, for the staff dashboards' volume chart
 * (V3-42 adversarial round 3).
 *
 * The chart used to be summed from `readQueueHistory`'s row sample, which is
 * bounded: a burst that filled the row budget erased the very days it
 * happened on, a busy queue kept only a few days, and a page failure mid-read
 * drew a false step. Here each day is a `count: "exact", head: true` query —
 * PostgREST returns the number with NO rows, so max_rows never applies and the
 * figure is exact at any volume. ~27 tiny queries per source, once a night.
 *
 * Fail-closed: if ANY day of ANY source cannot be counted the whole series is
 * withheld (null). No chart beats a chart with a hole drawn as a zero.
 * Returns days from the first complete day after `since` through yesterday.
 */
export async function readQueueDailyCounts(queue: QueueKey, now: Date): Promise<ObservedDay[] | null> {
  const todayMs = Date.parse(`${now.toISOString().slice(0, 10)}T00:00:00.000Z`);
  const days: number[] = [];
  for (let d = QUEUE_HISTORY_DAYS - 1; d >= 1; d -= 1) days.push(todayMs - d * MS_PER_DAY);

  const totals = new Map<number, number>(days.map((ms) => [ms, 0]));
  let countedSources = 0;
  try {
    const admin = createAdminSupabase();
    for (const source of QUEUE_SOURCES[queue]) {
      const results = await Promise.all(
        days.map(async (dayMs) => {
          const { count, error, status } = await admin
            .from(source.table)
            .select(source.column, { count: "exact", head: true })
            .gte(source.column, new Date(dayMs).toISOString())
            .lt(source.column, new Date(dayMs + MS_PER_DAY).toISOString());
          return { dayMs, count: error ? null : count, missing: isMissingRelation(error, status, count) };
        }),
      );
      // ONLY a table/column that does not exist is the documented degrade (the
      // queue has no such source yet). Any other failure — timeout, saturated
      // pool, outage — withholds the series (round 4: treating "all failed"
      // as "absent" published 27 days of confident zeros).
      if (results.every((r) => r.missing)) continue;
      for (const r of results) {
        if (typeof r.count !== "number" || !Number.isFinite(r.count) || r.count < 0) return null;
        totals.set(r.dayMs, (totals.get(r.dayMs) ?? 0) + r.count);
      }
      countedSources += 1;
    }
  } catch {
    return null;
  }
  // No source could be counted at all: there is nothing to chart, not zero.
  if (countedSources === 0) return null;
  return days.map((ms) => ({ date: new Date(ms).toISOString().slice(0, 10), count: totals.get(ms) ?? 0 }));
}

export type ServiceUnitCandidate = {
  unitType: ServiceUnitType;
  unitId: string;
  signals: QualitySignals;
};

function daysBetween(from: string | null | undefined, now: Date): number | null {
  if (!from) return null;
  const ms = Date.parse(from);
  if (!Number.isFinite(ms)) return null;
  return Math.max(0, (now.getTime() - ms) / MS_PER_DAY);
}

function hoursBetween(from: string | null | undefined, now: Date): number | null {
  if (!from) return null;
  const ms = Date.parse(from);
  if (!Number.isFinite(ms)) return null;
  return Math.max(0, (now.getTime() - ms) / MS_PER_HOUR);
}

/** In-flight care bookings: not yet delivered, not cancelled. */
async function readCareBookings(now: Date): Promise<ServiceUnitCandidate[]> {
  try {
    const admin = createAdminSupabase();
    const { data, error } = await admin
      .from("care_bookings")
      .select("id,status,payment_status,updated_at,created_at,payment_due_at")
      .not("status", "in", "(delivered,cancelled)")
      .order("created_at", { ascending: false })
      .limit(SERVICE_UNIT_LIMIT);
    if (error || !data) return [];
    return (data as ReadonlyArray<Record<string, unknown>>).map((row) => ({
      unitType: "care_booking" as const,
      unitId: String(row.id),
      signals: {
        hoursSinceProviderMessage: hoursBetween(row.updated_at as string | null, now),
        paymentStalledDays:
          row.payment_status === "unpaid" ? daysBetween(row.payment_due_at as string | null, now) : 0,
      } satisfies QualitySignals,
    }));
  } catch {
    return [];
  }
}

/** Active studio projects, with milestone overdue days folded in. */
async function readStudioProjects(now: Date): Promise<ServiceUnitCandidate[]> {
  try {
    const admin = createAdminSupabase();
    const { data, error } = await admin
      .from("studio_projects")
      .select("id,status,updated_at,created_at")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(SERVICE_UNIT_LIMIT);
    if (error || !data) return [];
    return (data as ReadonlyArray<Record<string, unknown>>).map((row) => ({
      unitType: "studio_project" as const,
      unitId: String(row.id),
      signals: {
        hoursSinceProviderMessage: hoursBetween(row.updated_at as string | null, now),
      } satisfies QualitySignals,
    }));
  } catch {
    return [];
  }
}

/** Active learn enrolments — the customer's own disengagement is the signal. */
async function readLearnEnrolments(now: Date): Promise<ServiceUnitCandidate[]> {
  try {
    const admin = createAdminSupabase();
    const { data, error } = await admin
      .from("learn_enrollments")
      .select("id,status,percent_complete,last_activity_at,enrolled_at")
      .eq("status", "active")
      .order("enrolled_at", { ascending: false })
      .limit(SERVICE_UNIT_LIMIT);
    if (error || !data) return [];
    return (data as ReadonlyArray<Record<string, unknown>>).map((row) => {
      const percent = Number(row.percent_complete);
      return {
        unitType: "learn_enrolment" as const,
        unitId: String(row.id),
        signals: {
          hoursSinceProviderMessage: hoursBetween(row.last_activity_at as string | null, now),
          customerEngagement: Number.isFinite(percent) ? Math.max(0, Math.min(1, percent / 100)) : null,
        } satisfies QualitySignals,
      };
    });
  } catch {
    return [];
  }
}

/** Marketplace orders still in fulfilment. */
async function readMarketplaceOrders(now: Date): Promise<ServiceUnitCandidate[]> {
  try {
    const admin = createAdminSupabase();
    const { data, error } = await admin
      .from("marketplace_orders")
      .select("id,status,payment_status,placed_at,created_at,updated_at")
      .not("status", "in", "(delivered,cancelled,refunded)")
      .order("created_at", { ascending: false })
      .limit(SERVICE_UNIT_LIMIT);
    if (error || !data) return [];
    return (data as ReadonlyArray<Record<string, unknown>>).map((row) => ({
      unitType: "marketplace_order" as const,
      unitId: String(row.id),
      signals: {
        hoursSinceProviderMessage: hoursBetween(row.updated_at as string | null, now),
        paymentStalledDays:
          row.payment_status === "pending" ? daysBetween(row.placed_at as string | null, now) : 0,
      } satisfies QualitySignals,
    }));
  } catch {
    return [];
  }
}

export async function readServiceUnits(now: Date): Promise<ServiceUnitCandidate[]> {
  const groups = await Promise.all([
    readCareBookings(now),
    readStudioProjects(now),
    readLearnEnrolments(now),
    readMarketplaceOrders(now),
  ]);
  return groups.flat();
}

export type TransactionCandidate = {
  transactionId: string;
  features: DisputeFeatures;
};

/**
 * Recent marketplace orders as dispute candidates. Reads amounts and timestamps
 * only — never a buyer name, email or address. NOTE: it reads the ORDER row; the
 * isolated money schema and its guarded RPCs are never referenced, and the pass
 * never reads or writes payment state.
 */
export async function readTransactions(now: Date): Promise<TransactionCandidate[]> {
  try {
    const admin = createAdminSupabase();
    const { data, error } = await admin
      .from("marketplace_orders")
      .select("id,status,payment_status,grand_total,placed_at,created_at")
      .order("created_at", { ascending: false })
      .limit(TRANSACTION_LIMIT);
    if (error || !data) return [];

    // Unresolved refunds, read from the REAL refunds table. The order status
    // vocabulary is placed/paid/shipped/delivered/disputed/cancelled/refunded —
    // it has no "a refund was asked for and is still open" member, so deriving
    // this signal from `orders.status` would be silently false forever: exactly
    // the dead-signal class of bug that already leaves staff-marketplace
    // rendering an empty queue. Read the refunds themselves instead.
    const unresolvedRefundOrderIds = new Set<string>();
    try {
      const { data: refunds } = await admin
        .from("marketplace_refunds")
        .select("order_id,status,created_at")
        .in("status", ["pending", "processing"])
        .order("created_at", { ascending: false })
        .limit(TRANSACTION_LIMIT);
      for (const row of (refunds ?? []) as ReadonlyArray<Record<string, unknown>>) {
        if (typeof row.order_id === "string") unresolvedRefundOrderIds.add(row.order_id);
      }
    } catch {
      // Absent table ⇒ the feature is simply not present for this run.
    }
    return (data as ReadonlyArray<Record<string, unknown>>).map((row) => {
      const total = Number(row.grand_total);
      const settledDays = daysBetween((row.placed_at as string | null) ?? (row.created_at as string | null), now);
      const delivered = row.status === "delivered";
      return {
        transactionId: String(row.id),
        features: {
          amountKobo: Number.isFinite(total) ? total : null,
          // No delivery confirmation yet => the gap IS the age of the order.
          deliveryConfirmationGapDays: delivered ? 0 : settledDays,
          daysSincePayment: settledDays,
          refundRequestedUnresolved: unresolvedRefundOrderIds.has(String(row.id)),
          // 'disputed' IS a real order status (set when a dispute opens —
          // apps/marketplace/app/api/marketplace/route.ts:2248).
          itemNotReceivedReported: row.status === "disputed",
        } satisfies DisputeFeatures,
      };
    });
  } catch {
    return [];
  }
}
