import "server-only";

import { normalizeEmail, normalizePhone } from "@henryco/config";
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
 * derived from `RECUR-{SCHEDULE_ID_FIRST_8}-{yyyymmdd}`. If a booking
 * with that tracking_code already exists, the row is skipped — re-runs
 * within the same calendar day do not double-book.
 *
 * The booking row matches prod `care_bookings` (V3-CARE-JOBS-PREAPPLY-FIX-01):
 * the owner link is `customer_id` (there is no `user_id` column), and the
 * NOT NULL `phone` / `phone_normalized` / `pickup_address` / `pickup_slot`
 * are always supplied. `status` / `payment_status` use the values the table's
 * CHECK constraints allow ('booked' / 'unpaid', as the public booking flow
 * writes). Quote and payment amounts keep their column defaults; money is
 * settled later through the guarded payment path, never here. Phone, name and
 * email fall back to the schedule owner's customer profile, like an
 * authenticated booking. A schedule that still cannot supply a phone, an
 * address and a slot is counted as skippedInvalid and retried next sweep.
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

type OwnerProfile = {
  full_name: string | null;
  phone: string | null;
  email: string | null;
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
  // Upper-case: the track and pay surfaces upper-case the code a customer
  // enters and match it exactly.
  return `RECUR-${scheduleId.slice(0, 8).toUpperCase()}-${yyyy}${mm}${dd}`;
}

function startOfUtcDay(value: Date): Date {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
}

function advanceNextRunAt(current: Date, cadence: string): Date {
  const days = ADVANCE_BY_CADENCE_DAYS[cadence] ?? 7;
  return new Date(current.getTime() + days * 24 * 60 * 60 * 1000);
}

function payloadString(payload: Record<string, unknown>, key: string): string | null {
  const value = payload?.[key];
  if (typeof value === "string" && value.trim()) return value.trim();
  return null;
}

/** First candidate that normalizes to a usable phone (5+ digits, as create_care_booking requires). */
function resolvePhone(
  ...candidates: Array<string | null | undefined>
): { phone: string; phoneNormalized: string } | null {
  for (const candidate of candidates) {
    const phone = String(candidate ?? "").trim();
    const phoneNormalized = normalizePhone(phone);
    if (phone && phoneNormalized && phoneNormalized.length >= 5) {
      return { phone, phoneNormalized };
    }
  }
  return null;
}

/**
 * Render the stored pickup address (a string, or an address object shaped
 * like `user_addresses`) as the single line `care_bookings.pickup_address`
 * holds. Null when nothing usable is stored.
 */
function formatPickupAddress(value: unknown): string | null {
  let line = "";
  if (typeof value === "string") {
    line = value.trim();
  } else if (value && typeof value === "object" && !Array.isArray(value)) {
    const record = value as Record<string, unknown>;
    const text = (key: string) =>
      typeof record[key] === "string" ? (record[key] as string).trim() : "";
    line =
      text("formatted_address") ||
      [text("street") || text("line1") || text("address"), text("city"), text("state"), text("country")]
        .filter(Boolean)
        .join(", ");
  }
  return line.length >= 5 ? line : null;
}

/** The schedule's pickup window, else its time of day (HH:MM). */
function resolvePickupSlot(row: ScheduleRow): string | null {
  const window = String(row.pickup_window ?? "").trim();
  if (window) return window;
  const time = String(row.time_of_day ?? "").trim();
  return /^\d{2}:\d{2}/.test(time) ? time.slice(0, 5) : null;
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

  // Owner fallbacks for contact details, one read for the whole sweep.
  const ownerIds = [...new Set(scheduleRows.map((row) => row.user_id).filter(Boolean))];
  const ownerProfiles = new Map<string, OwnerProfile>();
  if (ownerIds.length > 0) {
    const { data: profileRows } = await admin
      .from("customer_profiles")
      .select("id, full_name, phone, email")
      .in("id", ownerIds);
    for (const profile of (profileRows ?? []) as Array<OwnerProfile & { id: string }>) {
      ownerProfiles.set(profile.id, profile);
    }
  }

  for (const row of scheduleRows) {
    const scheduledRun = row.next_run_at ? new Date(row.next_run_at) : now;
    if (Number.isNaN(scheduledRun.getTime())) {
      summary.skippedInvalid += 1;
      continue;
    }
    // A next_run_at dated before today (a paused schedule resuming, or a
    // missed cron day) books from now: never a pickup dated in the past, and
    // the schedule resumes on its cadence rather than booking once per missed
    // period. Runs dated today or later are unchanged.
    const nextRun = scheduledRun < startOfUtcDay(now) ? now : scheduledRun;

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

    const owner = ownerProfiles.get(row.user_id) ?? null;
    const contact = resolvePhone(row.contact_phone, owner?.phone);
    const pickupAddress = formatPickupAddress(row.pickup_address);
    const pickupSlot = resolvePickupSlot(row);
    if (!row.user_id || !contact || !pickupAddress || !pickupSlot) {
      summary.skippedInvalid += 1;
      continue;
    }

    const customerName =
      payloadString(row.service_payload, "customer_name") ??
      payloadString(row.service_payload, "name") ??
      (owner?.full_name?.trim() || null) ??
      "Recurring customer";
    const serviceType =
      payloadString(row.service_payload, "service_type") ?? "garment_care";
    const itemSummary =
      payloadString(row.service_payload, "item_summary") ??
      "Recurring care service";
    const specialInstructions =
      payloadString(row.service_payload, "special_instructions") ?? row.notes;

    const insertPayload = {
      tracking_code: trackingCode,
      customer_id: row.user_id,
      customer_name: customerName,
      email: normalizeEmail(owner?.email) || null,
      phone: contact.phone,
      phone_normalized: contact.phoneNormalized,
      service_type: serviceType,
      item_summary: itemSummary,
      pickup_address: pickupAddress,
      pickup_date: nextRun.toISOString().slice(0, 10),
      pickup_slot: pickupSlot,
      special_instructions: specialInstructions,
      status: "booked",
      payment_status: "unpaid",
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
