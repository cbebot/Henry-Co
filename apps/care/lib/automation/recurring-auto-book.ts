import "server-only";

import { createAdminSupabase } from "@/lib/supabase";

/**
 * V3 PASS 21 — recurring auto-book sweep.
 *
 * Called from /api/cron/care-automation. Reads
 * `care_recurring_schedules` rows where:
 *   - status = 'active'
 *   - paused_until IS NULL OR paused_until <= now()
 *   - next_run_at IS NULL OR next_run_at <= now() + 24h
 *
 * For each row, inserts a `care_bookings` row from the stored
 * `service_payload` + `pickup_address`, then advances `next_run_at`
 * forward by the cadence and writes `last_run_at` + `last_booking_id`.
 *
 * Idempotent guard: the inserted booking carries a tracking_code
 * derived from `RECUR-{schedule_id_first_8}-{yyyymmdd}`. If a booking
 * with that tracking_code already exists, the row is skipped — re-runs
 * within the same calendar day do not double-book.
 *
 * Returns a summary with counts so the orchestrator can roll it into
 * the larger automation summary.
 */

const ADVANCE_BY_CADENCE_DAYS: Record<string, number> = {
  weekly: 7,
  biweekly: 14,
  monthly: 30,
  custom: 7,
};

const LOOKAHEAD_MS = 24 * 60 * 60 * 1000;

type ScheduleRow = {
  id: string;
  user_id: string;
  cadence: string;
  day_of_week: number | null;
  time_of_day: string | null;
  pickup_window: string | null;
  service_payload: Record<string, unknown>;
  pickup_address: Record<string, unknown>;
  contact_phone: string | null;
  notes: string | null;
  next_run_at: string | null;
};

export type RecurringAutoBookSummary = {
  scheduledRunsConsidered: number;
  bookingsCreated: number;
  skippedDuplicates: number;
  skippedInvalid: number;
};

function computeTrackingCode(scheduleId: string, runAt: Date): string {
  const yyyy = runAt.getUTCFullYear();
  const mm = String(runAt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(runAt.getUTCDate()).padStart(2, "0");
  return `RECUR-${scheduleId.slice(0, 8)}-${yyyy}${mm}${dd}`;
}

function advanceNextRunAt(current: Date, cadence: string): Date {
  const days = ADVANCE_BY_CADENCE_DAYS[cadence] ?? 7;
  return new Date(current.getTime() + days * 24 * 60 * 60 * 1000);
}

function payloadString(payload: Record<string, unknown>, key: string): string | null {
  const value = payload[key];
  if (typeof value === "string" && value.trim()) return value.trim();
  return null;
}

export async function runRecurringAutoBookSweep(
  now: Date = new Date(),
): Promise<RecurringAutoBookSummary> {
  const summary: RecurringAutoBookSummary = {
    scheduledRunsConsidered: 0,
    bookingsCreated: 0,
    skippedDuplicates: 0,
    skippedInvalid: 0,
  };

  const admin = createAdminSupabase();
  const horizonIso = new Date(now.getTime() + LOOKAHEAD_MS).toISOString();

  const { data: rows, error } = await admin
    .from("care_recurring_schedules")
    .select(
      "id, user_id, cadence, day_of_week, time_of_day, pickup_window, service_payload, pickup_address, contact_phone, notes, next_run_at",
    )
    .eq("status", "active")
    .or(`paused_until.is.null,paused_until.lte.${now.toISOString()}`)
    .or(`next_run_at.is.null,next_run_at.lte.${horizonIso}`)
    .limit(200);

  if (error) {
    return summary;
  }

  const scheduleRows = (rows ?? []) as ScheduleRow[];
  summary.scheduledRunsConsidered = scheduleRows.length;

  for (const row of scheduleRows) {
    const nextRun = row.next_run_at ? new Date(row.next_run_at) : now;
    if (Number.isNaN(nextRun.getTime())) {
      summary.skippedInvalid += 1;
      continue;
    }

    const trackingCode = computeTrackingCode(row.id, nextRun);

    const { data: existing } = await admin
      .from("care_bookings")
      .select("id")
      .eq("tracking_code", trackingCode)
      .maybeSingle();

    if (existing?.id) {
      // Advance next_run forward so we don't keep re-considering this row.
      const advanced = advanceNextRunAt(nextRun, row.cadence).toISOString();
      await admin
        .from("care_recurring_schedules")
        .update({
          next_run_at: advanced,
          last_run_at: now.toISOString(),
          last_booking_id: existing.id,
          updated_at: now.toISOString(),
        })
        .eq("id", row.id);
      summary.skippedDuplicates += 1;
      continue;
    }

    const customerName =
      payloadString(row.service_payload, "customer_name") ??
      payloadString(row.service_payload, "name") ??
      "Recurring customer";
    const serviceType =
      payloadString(row.service_payload, "service_type") ?? "garment_care";
    const itemSummary =
      payloadString(row.service_payload, "item_summary") ??
      "Recurring care service";
    const specialInstructions =
      payloadString(row.service_payload, "special_instructions") ?? row.notes;
    const pickupAddress =
      typeof row.pickup_address === "string"
        ? row.pickup_address
        : JSON.stringify(row.pickup_address ?? {});

    const insertPayload = {
      tracking_code: trackingCode,
      user_id: row.user_id,
      customer_name: customerName,
      phone: row.contact_phone,
      service_type: serviceType,
      item_summary: itemSummary,
      pickup_address: pickupAddress,
      pickup_date: nextRun.toISOString().slice(0, 10),
      pickup_slot: row.pickup_window,
      special_instructions: specialInstructions,
      status: "scheduled",
      payment_status: "pending",
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    };

    const { data: inserted, error: insertError } = await admin
      .from("care_bookings")
      .insert(insertPayload as never)
      .select("id")
      .maybeSingle();

    if (insertError || !inserted?.id) {
      summary.skippedInvalid += 1;
      continue;
    }

    const advanced = advanceNextRunAt(nextRun, row.cadence).toISOString();
    await admin
      .from("care_recurring_schedules")
      .update({
        next_run_at: advanced,
        last_run_at: now.toISOString(),
        last_booking_id: inserted.id,
        updated_at: now.toISOString(),
      })
      .eq("id", row.id);

    summary.bookingsCreated += 1;
  }

  return summary;
}
