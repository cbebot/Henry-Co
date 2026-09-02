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

import type { QualitySignals, QueueKey, QueueObservation, ServiceUnitType, DisputeFeatures } from "@henryco/intelligence";
import { createAdminSupabase } from "@/lib/supabase";
import {
  QUEUE_HISTORY_DAYS,
  QUEUE_HISTORY_ROW_LIMIT,
  SERVICE_UNIT_LIMIT,
  TRANSACTION_LIMIT,
} from "./config";

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

  for (const source of QUEUE_SOURCES[queue]) {
    try {
      const admin = createAdminSupabase();
      const { data, error } = await admin
        .from(source.table)
        .select(source.column)
        .gte(source.column, since.toISOString())
        .lte(source.column, now.toISOString())
        .order(source.column, { ascending: true })
        .limit(QUEUE_HISTORY_ROW_LIMIT);
      if (error || !data) continue;
      // The column name is dynamic, so PostgREST's generated types cannot narrow
      // the row shape; go through `unknown` and read defensively.
      for (const row of data as unknown as ReadonlyArray<Record<string, unknown>>) {
        const raw = row[source.column];
        if (typeof raw !== "string") continue;
        const bucket = hourBucket(raw);
        if (!bucket) continue;
        counts.set(bucket, (counts.get(bucket) ?? 0) + 1);
      }
    } catch {
      // A missing table or column contributes nothing — never fails the run.
    }
  }

  if (counts.size === 0) return [];

  // Densify: fill every hour between the first observed hour and `now`.
  const startMs = Math.min(...[...counts.keys()].map((k) => Date.parse(k)));
  const endMs = Math.floor(now.getTime() / MS_PER_HOUR) * MS_PER_HOUR;
  const out: QueueObservation[] = [];
  for (let ms = startMs; ms <= endMs; ms += MS_PER_HOUR) {
    const at = new Date(ms).toISOString();
    out.push({ at, count: counts.get(at) ?? 0 });
  }
  return out;
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
          refundRequestedUnresolved: row.status === "refund_requested",
          itemNotReceivedReported: row.status === "disputed",
        } satisfies DisputeFeatures,
      };
    });
  } catch {
    return [];
  }
}
