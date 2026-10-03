import "server-only";

import { createHash, randomUUID } from "node:crypto";
import { normalizeEmail, normalizePhone } from "@henryco/config";
import { createAdminSupabase } from "@/lib/supabase";

/**
 * V3 PASS 21 — recurring auto-book sweep.
 *
 * Called daily from /api/cron/care-automation. Reads
 * `care_recurring_schedules` rows where:
 *   - status = 'active'
 *   - paused_until IS NULL OR paused_until <= now()
 *   - next_run_at IS NULL OR next_run_at is before the end of tomorrow (UTC)
 *
 * For each row, inserts a `care_bookings` row from the stored
 * `service_payload` + `pickup_address`, then advances `next_run_at`
 * forward by the cadence and writes `last_run_at` (the run's time) +
 * `last_booking_id`.
 *
 * Due window: a run dated tomorrow or earlier (UTC) is due, so the daily
 * sweep books each run the day before its pickup. A window of "now + 24h"
 * made the lead time depend on cron timing: a run stored at 08:15:03 was
 * missed by an 08:15:00 sweep and booked on the pickup day itself.
 *
 * A schedule with no `next_run_at` (new, or saved again through
 * /api/care/recurring, which clears it) is due one cadence after its
 * `last_run_at`, or now if it has never run. That due time is claimed into
 * `next_run_at` before anything is booked, so a re-saved schedule keeps its
 * cadence instead of booking again at once.
 *
 * Idempotency: each run is keyed by its tracking code, `RECUR-` followed by
 * 32 hex characters of SHA-256 over the schedule id and the UTC date of the
 * stored run. The code is the same on every retry of a run and differs
 * between schedules and run days. It does not reveal the schedule id, so one
 * code cannot be turned into the code of another run (the track and pay
 * surfaces accept a code on its own). A retry of a run (after a failed
 * schedule update, a timeout, or a concurrent sweep) finds its booking and
 * books nothing more; if two inserts race, the code's UNIQUE constraint
 * rejects the second, and the next sweep finds the booking. Just before a run
 * is booked, one conditional write re-checks that the schedule is still
 * active, not paused, and still stores the run that was read, so a pause,
 * cancel or re-save made during the sweep is honored.
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
 * It costs no request and holds no place in the sweep.
 *
 * Fairness and bounds: the due set is read a page at a time in id order,
 * starting after a random id and wrapping round, up to MAX_SCANNED_PER_SWEEP
 * rows. One sweep books at most MAX_RUNS_PER_SWEEP schedules, the bound it
 * has always had, and at most MAX_RUNS_PER_CUSTOMER of one customer's; the
 * rest are counted as skippedDeferred and taken up by the next sweep. So
 * schedules that can never book, however many and wherever their ids fall,
 * cannot keep the sweep from another customer's schedule: below the scan
 * ceiling every due schedule is read, and above it the random start spreads
 * the reads over successive sweeps. Abusive volume is bounded for good by a
 * per-user cap on active schedules, which belongs in the database, since the
 * owner insert policy lets a customer write rows directly.
 *
 * Each schedule is handled on its own: an error on one is logged and counted
 * as skippedInvalid, and the sweep carries on with the rest.
 *
 * Returns a summary with counts so the orchestrator can roll it into
 * the larger automation summary.
 */

// A Map, not an object literal: `cadence` is text the schedule owner can
// write, and an object lookup would also answer for inherited keys such as
// "constructor".
const CADENCE_DAYS = new Map<string, number>([
  ["weekly", 7],
  ["biweekly", 14],
  ["monthly", 30],
  ["custom", 7],
]);
const DEFAULT_CADENCE_DAYS = 7;

const DAY_MS = 24 * 60 * 60 * 1000;

/** Due schedules read per request. */
const PAGE_SIZE = 200;
/** Due schedules one sweep reads at most. */
export const MAX_SCANNED_PER_SWEEP = 5_000;
/** Schedules one sweep books, or finds already booked, at most. */
export const MAX_RUNS_PER_SWEEP = 200;
/** Schedules of one customer that one sweep books, or finds already booked, at most. */
export const MAX_RUNS_PER_CUSTOMER = 5;

const SCHEDULE_COLUMNS =
  "id, user_id, cadence, day_of_week, time_of_day, pickup_window, service_payload, pickup_address, contact_phone, notes, paused_until, next_run_at, last_run_at";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
  paused_until: string | null;
  next_run_at: string | null;
  last_run_at: string | null;
};

type AdminClient = ReturnType<typeof createAdminSupabase>;

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
  /** Bookable schedules left for the next sweep by the sweep or customer bound. */
  skippedDeferred: number;
};

export type RecurringAutoBookOptions = {
  /**
   * Where the scan starts: the sweep reads the due schedules with ids after
   * this one, then those up to it. A random id by default, so where a
   * schedule's id falls never decides whether a sweep reaches it.
   */
  startAfter?: string;
};

type RunOutcome = "created" | "duplicate" | "invalid" | "deferred";

/** What a booking takes from the schedule and its owner's profile. */
type BookingInputs = {
  contact: { phone: string; phoneNormalized: string };
  pickupAddress: string;
  pickupSlot: string;
};

/**
 * The tracking code of one run: `RECUR-` and 32 hex characters of SHA-256
 * over the schedule id and the run's UTC date. See the idempotency note above.
 * Upper-case: the track and pay surfaces upper-case the code a customer
 * enters and match it exactly.
 */
export function recurringTrackingCode(scheduleId: string, run: Date): string {
  const yyyy = run.getUTCFullYear();
  const mm = String(run.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(run.getUTCDate()).padStart(2, "0");
  const digest = createHash("sha256")
    .update(`care-recurring-run:${scheduleId}:${yyyy}${mm}${dd}`)
    .digest("hex");
  return `RECUR-${digest.slice(0, 32).toUpperCase()}`;
}

function startOfUtcDay(value: Date): Date {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
}

/**
 * The end of the due window: the start of the day after tomorrow (UTC). A run
 * dated before it, at any time of day, is due, so the daily sweep books it the
 * day before its pickup. See the due-window note above.
 */
export function bookingHorizon(now: Date): Date {
  return new Date(startOfUtcDay(now).getTime() + 2 * DAY_MS);
}

export function advanceNextRunAt(current: Date, cadence: string): Date {
  const days = CADENCE_DAYS.get(cadence) ?? DEFAULT_CADENCE_DAYS;
  return new Date(current.getTime() + days * DAY_MS);
}

/**
 * When a schedule with no stored `next_run_at` is due: one cadence after its
 * last run, or now if it has never run (or that is already past).
 */
export function dueWithoutStoredRun(lastRunAt: string | null, cadence: string, now: Date): Date {
  const lastRun = lastRunAt ? new Date(lastRunAt) : null;
  if (!lastRun || Number.isNaN(lastRun.getTime())) return now;
  const next = advanceNextRunAt(lastRun, cadence);
  return next.getTime() > now.getTime() ? next : now;
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

/** What a booking needs from the schedule and its owner, or null when it cannot book. */
function bookingInputs(row: ScheduleRow, owner: OwnerProfile | null): BookingInputs | null {
  const pickupAddress = formatPickupAddress(row.pickup_address);
  const pickupSlot = resolvePickupSlot(row);
  const contact = resolvePhone(row.contact_phone, owner?.phone);
  if (!row.user_id || !pickupAddress || !pickupSlot || !contact) return null;
  return { contact, pickupAddress, pickupSlot };
}

/**
 * The bookings one sweep may still make: `perSweep` in all and `perCustomer`
 * for each customer. `take` reserves one for a customer, or answers false
 * when the sweep or that customer has none left.
 */
export function createSweepBudget(perSweep = MAX_RUNS_PER_SWEEP, perCustomer = MAX_RUNS_PER_CUSTOMER) {
  let used = 0;
  const usedBy = new Map<string, number>();
  return {
    take(customerId: string): boolean {
      const customerUsed = usedBy.get(customerId) ?? 0;
      if (used >= perSweep || customerUsed >= perCustomer) return false;
      used += 1;
      usedBy.set(customerId, customerUsed + 1);
      return true;
    },
    get spent(): boolean {
      return used >= perSweep;
    },
  };
}

/**
 * Move the schedule past a run that has its booking: the next run is one
 * cadence after this one, and `last_run_at` is this run's time (the pickup the
 * booking is for), which a schedule saved again counts its cadence from. If
 * this write fails, `next_run_at` still names the same run, so the next sweep
 * finds the booking by its tracking code and advances then; nothing is booked
 * twice.
 */
async function recordRun(
  admin: AdminClient,
  row: ScheduleRow,
  runAt: Date,
  bookingId: string,
  now: Date,
): Promise<void> {
  const { error } = await admin
    .from("care_recurring_schedules")
    .update({
      next_run_at: advanceNextRunAt(runAt, row.cadence).toISOString(),
      last_run_at: runAt.toISOString(),
      last_booking_id: bookingId,
      updated_at: now.toISOString(),
    })
    .eq("id", row.id);
  if (error) {
    console.error("[care:recurring-auto-book] schedule update failed", row.id, error.message);
  }
}

/**
 * Claim a run with one conditional write. It holds only while the schedule is
 * still active, not paused, and still stores the run this sweep read; an
 * empty `next_run_at` is set to `runIso` here. A pause, cancel or re-save made
 * since the read, or another sweep that claimed first, makes it match no row
 * ("lost"), and the schedule is left for the next sweep.
 */
async function claimRun(
  admin: AdminClient,
  row: ScheduleRow,
  runIso: string,
  now: Date,
): Promise<"claimed" | "lost" | "failed"> {
  const nowIso = now.toISOString();
  let claim = admin
    .from("care_recurring_schedules")
    .update(row.next_run_at ? { updated_at: nowIso } : { next_run_at: runIso, updated_at: nowIso })
    .eq("id", row.id)
    .eq("status", "active");
  // Plain AND filters only: still not paused (an empty paused_until is still
  // empty, a past one still past) and still the run that was read.
  claim = row.paused_until ? claim.lte("paused_until", nowIso) : claim.is("paused_until", null);
  claim = row.next_run_at ? claim.eq("next_run_at", row.next_run_at) : claim.is("next_run_at", null);
  const { data, error } = await claim.select("id");
  if (error) {
    console.error("[care:recurring-auto-book] run claim failed", row.id, error.message);
    return "failed";
  }
  return data && data.length > 0 ? "claimed" : "lost";
}

/**
 * Book one schedule's due run. The caller has checked that the schedule can
 * book (`inputs`) and reserved its place in the sweep.
 */
async function bookScheduleRun(
  admin: AdminClient,
  row: ScheduleRow,
  inputs: BookingInputs,
  owner: OwnerProfile | null,
  now: Date,
  horizon: Date,
): Promise<RunOutcome> {
  const { contact, pickupAddress, pickupSlot } = inputs;

  // The run is always a stored next_run_at, so every retry of it computes the
  // same tracking code. A schedule without one claims its due time first.
  let storedRun = row.next_run_at;
  if (!storedRun) {
    const due = dueWithoutStoredRun(row.last_run_at, row.cadence, now);
    const claim = await claimRun(admin, row, due.toISOString(), now);
    if (claim === "failed") return "invalid";
    if (claim === "lost") return "duplicate";
    // Due after tomorrow: the current period already has its booking. The
    // claim stored the next run, so a later sweep books it.
    if (due.getTime() >= horizon.getTime()) return "duplicate";
    storedRun = due.toISOString();
  }

  const scheduledRun = new Date(storedRun);
  if (Number.isNaN(scheduledRun.getTime())) return "invalid";
  // A run scheduled before today (a paused schedule resuming, or a missed
  // cron day) is carried out today: its pickup is never dated in the past,
  // and the schedule resumes on its cadence from now instead of booking once
  // per missed period. Runs dated today or later are unchanged. The tracking
  // code stays keyed on the stored run, so a retry of the same run always
  // takes the duplicate path instead of booking again.
  const runAt = scheduledRun < startOfUtcDay(now) ? now : scheduledRun;
  const trackingCode = recurringTrackingCode(row.id, scheduledRun);

  // Only this customer's booking can be this run's booking.
  const { data: existing } = await admin
    .from("care_bookings")
    .select("id")
    .eq("tracking_code", trackingCode)
    .eq("customer_id", row.user_id)
    .maybeSingle();

  if (existing?.id) {
    // This run already has its booking: advance past it, book nothing.
    await recordRun(admin, row, runAt, existing.id, now);
    return "duplicate";
  }

  // A stored run is re-checked just before it is booked (a run claimed above
  // was checked when it was claimed).
  if (row.next_run_at) {
    const claim = await claimRun(admin, row, storedRun, now);
    if (claim === "failed") return "invalid";
    if (claim === "lost") return "duplicate";
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
    pickup_date: runAt.toISOString().slice(0, 10),
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

  if (insertError || !inserted?.id) return "invalid";

  await recordRun(admin, row, runAt, inserted.id, now);
  return "created";
}

/**
 * The due schedules, a page at a time in id order: those after `startAfter`,
 * then, wrapping round, those up to it. Reads at most MAX_SCANNED_PER_SWEEP
 * rows. A failed read ends the scan; it is logged and the next sweep starts
 * again.
 */
async function* dueSchedulePages(
  admin: AdminClient,
  now: Date,
  horizon: Date,
  startAfter: string,
): AsyncGenerator<ScheduleRow[]> {
  const nowIso = now.toISOString();
  const horizonIso = horizon.toISOString();
  let remaining = MAX_SCANNED_PER_SWEEP;

  for (const upTo of [null, startAfter]) {
    let cursor: string | null = upTo ? null : startAfter;
    for (;;) {
      if (remaining <= 0) {
        console.warn("[care:recurring-auto-book] scan ceiling reached", MAX_SCANNED_PER_SWEEP, startAfter);
        return;
      }
      const size = Math.min(PAGE_SIZE, remaining);
      let page = admin
        .from("care_recurring_schedules")
        .select(SCHEDULE_COLUMNS)
        .eq("status", "active")
        .or(`paused_until.is.null,paused_until.lte.${nowIso}`)
        .or(`next_run_at.is.null,next_run_at.lt.${horizonIso}`);
      if (cursor) page = page.gt("id", cursor);
      if (upTo) page = page.lte("id", upTo);
      const { data, error } = await page.order("id", { ascending: true }).limit(size);
      if (error) {
        console.error("[care:recurring-auto-book] due schedules read failed", error.message);
        return;
      }
      const rows = (data ?? []) as ScheduleRow[];
      remaining -= rows.length;
      if (rows.length > 0) yield rows;
      if (rows.length < size) break;
      cursor = rows[rows.length - 1].id;
    }
  }
}

/**
 * Read the profiles of this page's customers whose schedule has an address and
 * a slot: their phone, name and email fill in what the schedule lacks. Each
 * profile is read once per sweep.
 */
async function loadOwnerProfiles(
  admin: AdminClient,
  rows: ScheduleRow[],
  owners: Map<string, OwnerProfile | null>,
): Promise<void> {
  const ids = [
    ...new Set(
      rows
        .filter(
          (row) =>
            row.user_id &&
            !owners.has(row.user_id) &&
            formatPickupAddress(row.pickup_address) &&
            resolvePickupSlot(row),
        )
        .map((row) => row.user_id),
    ),
  ];
  if (ids.length === 0) return;
  for (const id of ids) owners.set(id, null);

  const { data, error } = await admin
    .from("customer_profiles")
    .select("id, full_name, phone, email")
    .in("id", ids);
  if (error) {
    console.error("[care:recurring-auto-book] owner profiles read failed", error.message);
    return;
  }
  for (const profile of (data ?? []) as Array<OwnerProfile & { id: string }>) {
    owners.set(profile.id, profile);
  }
}

export async function runRecurringAutoBookSweep(
  now: Date = new Date(),
  options: RecurringAutoBookOptions = {},
): Promise<RecurringAutoBookSummary> {
  const summary: RecurringAutoBookSummary = {
    scheduledRunsConsidered: 0,
    bookingsCreated: 0,
    skippedDuplicates: 0,
    skippedInvalid: 0,
    skippedDeferred: 0,
  };

  const admin = createAdminSupabase();
  const horizon = bookingHorizon(now);
  const budget = createSweepBudget();
  const owners = new Map<string, OwnerProfile | null>();
  const startAfter =
    options.startAfter && UUID_PATTERN.test(options.startAfter)
      ? options.startAfter.toLowerCase()
      : randomUUID();

  for await (const page of dueSchedulePages(admin, now, horizon, startAfter)) {
    summary.scheduledRunsConsidered += page.length;
    await loadOwnerProfiles(admin, page, owners);

    for (const row of page) {
      let outcome: RunOutcome;
      try {
        const owner = owners.get(row.user_id) ?? null;
        const inputs = bookingInputs(row, owner);
        if (!inputs) outcome = "invalid";
        else if (!budget.take(row.user_id)) outcome = "deferred";
        else outcome = await bookScheduleRun(admin, row, inputs, owner, now, horizon);
      } catch (runError) {
        // One malformed schedule never stops the sweep for everyone else.
        console.error(
          "[care:recurring-auto-book] schedule skipped",
          row.id,
          runError instanceof Error ? runError.message : String(runError),
        );
        outcome = "invalid";
      }
      if (outcome === "created") summary.bookingsCreated += 1;
      else if (outcome === "duplicate") summary.skippedDuplicates += 1;
      else if (outcome === "deferred") summary.skippedDeferred += 1;
      else summary.skippedInvalid += 1;
    }

    if (budget.spent) break;
  }

  return summary;
}
