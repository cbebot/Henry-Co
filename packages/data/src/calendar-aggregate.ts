import "server-only";

import type { UnifiedViewer } from "@henryco/auth";
import { createDataAdminClient, type TypedSupabaseClient } from "./client";

/**
 * @henryco/data/calendar-aggregate — V3 Wave A1 D4.
 *
 * Cross-portal calendar aggregator for
 * `account.henrycogroup.com/calendar`. Aggregates every scheduled
 * cross-division event the viewer has on the books into one
 * day-grouped agenda.
 *
 * Sources read (customer scope):
 *   - care_bookings              (pickup/delivery date, viewer = email match)
 *   - property_viewing_requests  (preferred_date / scheduled_for, viewer.user.id)
 *   - jobs_interviews            (scheduled_at, candidate_id OR interviewer_id)
 *   - studio_project_milestones  (due_date, viewer is project member)
 *   - logistics_shipments        (scheduled_pickup_at / scheduled_delivery_at, customer_user_id)
 *   - learn_lessons              (lesson scheduled_at where the viewer is enrolled)
 *
 * Wave A2 integration TODO: when packages/rooms ships, sessions
 * (`rooms_sessions.kind = jobs_interview | property_tour | …`) become a
 * first-class source. Marked with `// TODO Wave-A2` below.
 *
 * Vercel preview-env degradation contract honoured — missing admin
 * Supabase env returns an empty aggregate (200 with empty state),
 * never throws.
 */

export type CalendarKind =
  | "care_booking"
  | "property_viewing"
  | "jobs_interview"
  | "learn_class"
  | "studio_milestone"
  | "logistics_pickup"
  | "logistics_delivery"
  | "room_session";

export type CalendarEvent = {
  /** Stable cross-source key (`<kind>:<row_id>`). */
  key: string;
  kind: CalendarKind;
  /** Logical division ("care", "property", "jobs", "studio", "logistics", "learn"). */
  division: string;
  title: string;
  subtitle: string | null;
  /** ISO timestamp the event is scheduled to start. */
  startAt: string;
  /** Optional ISO timestamp the event ends — null when unknown. */
  endAt: string | null;
  /** Status / lifecycle pill text. */
  status: string;
  /** Deep-link to the originating portal entity. */
  href: string;
};

export type CalendarRange = {
  /** Inclusive lower bound (ISO). */
  from: string;
  /** Exclusive upper bound (ISO). */
  to: string;
};

export type CalendarAggregate = {
  range: CalendarRange;
  events: ReadonlyArray<CalendarEvent>;
  /** Per-division counts for the requested range. */
  counts: Record<string, number>;
};

function emptyAggregate(range: CalendarRange): CalendarAggregate {
  return { range, events: [], counts: {} };
}

function clientOrNull(): TypedSupabaseClient | null {
  try {
    return createDataAdminClient();
  } catch {
    return null;
  }
}

/**
 * Default range = today (UTC) through 28 days forward.
 */
export function defaultCalendarRange(now: Date = new Date()): CalendarRange {
  const start = new Date(now);
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 28);
  return { from: start.toISOString(), to: end.toISOString() };
}

export async function getCalendarAggregate(
  viewer: UnifiedViewer,
  range: CalendarRange = defaultCalendarRange(),
): Promise<CalendarAggregate> {
  if (viewer.kind !== "customer") {
    // Owner / staff calendars ride workspace_audit_log / staff_assignments —
    // out of Wave A1 scope.
    return emptyAggregate(range);
  }

  const client = clientOrNull();
  if (!client) return emptyAggregate(range);

  const userId = viewer.user.id;
  const email = viewer.user.email ?? "";

  const [care, propertyViewings, interviews, milestones, shipments] =
    await Promise.all([
      safeRead(() =>
        client
          .from("care_bookings")
          .select(
            "id, status, service_type, item_summary, pickup_date, pickup_slot, customer_id, email, tracking_code",
          )
          .or(buildCareOr(userId, email))
          .gte("pickup_date", range.from.slice(0, 10))
          .lt("pickup_date", range.to.slice(0, 10))
          .order("pickup_date", { ascending: true })
          .limit(100),
      ),
      safeRead(() =>
        client
          .from("property_viewing_requests")
          .select(
            "id, listing_id, status, attendee_name, preferred_date, scheduled_for, normalized_email, user_id",
          )
          .or(`user_id.eq.${userId},normalized_email.eq.${email.toLowerCase()}`)
          .gte("preferred_date", range.from)
          .lt("preferred_date", range.to)
          .order("preferred_date", { ascending: true })
          .limit(100),
      ),
      safeRead(() =>
        client
          .from("jobs_interviews")
          .select(
            "id, title, status, interview_type, location, meeting_url, scheduled_at, duration_minutes, candidate_id, interviewer_id",
          )
          .or(`candidate_id.eq.${userId},interviewer_id.eq.${userId}`)
          .gte("scheduled_at", range.from)
          .lt("scheduled_at", range.to)
          .order("scheduled_at", { ascending: true })
          .limit(100),
      ),
      safeRead(() =>
        client
          .from("studio_project_milestones")
          .select("id, project_id, title, status, due_date")
          .gte("due_date", range.from)
          .lt("due_date", range.to)
          .order("due_date", { ascending: true })
          .limit(100),
      ),
      safeRead(() =>
        client
          .from("logistics_shipments")
          .select(
            "id, tracking_code, lifecycle_status, parcel_description, scheduled_pickup_at, scheduled_delivery_at, customer_user_id",
          )
          .eq("customer_user_id", userId)
          .or(
            `scheduled_pickup_at.gte.${range.from},scheduled_delivery_at.gte.${range.from}`,
          )
          .order("scheduled_pickup_at", {
            ascending: true,
            nullsFirst: false,
          })
          .limit(100),
      ),
      // Learn live classes: deferred. The current schema
      // (`learn_lessons`) has no scheduled_at column — lessons are
      // self-paced content, not live sessions. Wave B5 (Academy) ships
      // `learn_live_sessions` (or extends `learn_lessons` with a
      // `scheduled_at`) per audit §7.3. Until then this branch is a
      // no-op and the calendar simply has no learn rows.
      Promise.resolve(null),
    ]);

  const events: CalendarEvent[] = [];

  for (const row of care ?? []) {
    const startAt = carePickupStartIso(row.pickup_date, row.pickup_slot);
    if (!startAt) continue;
    events.push({
      key: `care:${row.id}`,
      kind: "care_booking",
      division: "care",
      title: row.service_type
        ? `Care · ${row.service_type}`
        : "Care booking",
      subtitle: row.item_summary ?? row.tracking_code ?? null,
      startAt,
      endAt: null,
      status: row.status ?? "scheduled",
      href: `/care`,
    });
  }

  for (const row of propertyViewings ?? []) {
    const startAt = row.scheduled_for ?? row.preferred_date;
    if (!startAt) continue;
    events.push({
      key: `viewing:${row.id}`,
      kind: "property_viewing",
      division: "property",
      title: "Property viewing",
      subtitle: row.attendee_name ?? null,
      startAt,
      endAt: null,
      status: row.status ?? "scheduled",
      href: `/property`,
    });
  }

  for (const row of interviews ?? []) {
    if (!row.scheduled_at) continue;
    const duration = row.duration_minutes ?? 45;
    const startMs = Date.parse(row.scheduled_at);
    const endAt = Number.isFinite(startMs)
      ? new Date(startMs + duration * 60_000).toISOString()
      : null;
    const viewerIsCandidate = row.candidate_id === userId;
    events.push({
      key: `interview:${row.id}`,
      kind: "jobs_interview",
      division: "jobs",
      title: row.title ?? "Interview",
      subtitle: viewerIsCandidate
        ? row.interview_type ?? "Hiring interview"
        : "Interview · you are the interviewer",
      startAt: row.scheduled_at,
      endAt,
      status: row.status ?? "scheduled",
      // TODO Wave-A2 integration: link to rooms_sessions when a
      // room_id is wired on jobs_interviews. For now deep-link to the
      // jobs interview detail route — Wave C builds the room consumer.
      href: `/jobs`,
    });
  }

  for (const row of milestones ?? []) {
    if (!row.due_date) continue;
    events.push({
      key: `milestone:${row.id}`,
      kind: "studio_milestone",
      division: "studio",
      title: row.title ?? "Studio milestone",
      subtitle: "Project milestone",
      startAt: row.due_date,
      endAt: null,
      status: row.status ?? "pending",
      href: `/studio`,
    });
  }

  for (const row of shipments ?? []) {
    if (row.scheduled_pickup_at) {
      events.push({
        key: `pickup:${row.id}`,
        kind: "logistics_pickup",
        division: "logistics",
        title: "Pickup window",
        subtitle: row.parcel_description ?? row.tracking_code ?? null,
        startAt: row.scheduled_pickup_at,
        endAt: null,
        status: row.lifecycle_status ?? "scheduled",
        href: `/logistics`,
      });
    }
    if (row.scheduled_delivery_at) {
      events.push({
        key: `delivery:${row.id}`,
        kind: "logistics_delivery",
        division: "logistics",
        title: "Delivery window",
        subtitle: row.parcel_description ?? row.tracking_code ?? null,
        startAt: row.scheduled_delivery_at,
        endAt: null,
        status: row.lifecycle_status ?? "scheduled",
        href: `/logistics`,
      });
    }
  }

  // Learn live classes intentionally absent — see the comment in the
  // Promise.all branch above. Wave B5 lands `learn_live_sessions` and
  // this aggregator picks them up at that point.

  // TODO Wave-A2: when rooms_sessions ships, pull future scheduled
  // sessions for this viewer here and append { kind: "room_session" }.

  events.sort((a, b) => a.startAt.localeCompare(b.startAt));

  const counts: Record<string, number> = {};
  for (const e of events) {
    counts[e.division] = (counts[e.division] ?? 0) + 1;
  }

  return { range, events, counts };
}

/**
 * Build the OR predicate for matching the care_bookings table for a
 * viewer. care_bookings uses `customer_id` (uuid) OR `email` (string)
 * — the prod table predates uniform user_id linking on the customer
 * surface.
 */
function buildCareOr(userId: string, email: string): string {
  const escaped = email.replace(/,/g, "");
  return `customer_id.eq.${userId},email.eq.${escaped}`;
}

/**
 * care_bookings stores pickup_date (DATE) and pickup_slot (TEXT, e.g.
 * "08:00-10:00"). Normalize to an ISO start instant for sorting.
 */
function carePickupStartIso(
  pickupDate: string | null | undefined,
  pickupSlot: string | null | undefined,
): string | null {
  if (!pickupDate) return null;
  const slotMatch = (pickupSlot ?? "").match(/(\d{1,2}):(\d{2})/);
  const hh = slotMatch ? Math.min(23, Math.max(0, Number(slotMatch[1]))) : 9;
  const mm = slotMatch ? Math.min(59, Math.max(0, Number(slotMatch[2]))) : 0;
  const d = new Date(`${pickupDate}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) return null;
  d.setUTCHours(hh, mm, 0, 0);
  return d.toISOString();
}

async function safeRead<T>(
  fn: () => PromiseLike<{ data: T[] | null; error: unknown }>,
): Promise<T[] | null> {
  try {
    const { data, error } = await fn();
    if (error) return [];
    return data ?? [];
  } catch {
    return [];
  }
}

/**
 * Group events by ISO date (YYYY-MM-DD, UTC).
 */
export function groupEventsByDay(
  events: ReadonlyArray<CalendarEvent>,
): ReadonlyArray<{ date: string; items: ReadonlyArray<CalendarEvent> }> {
  const buckets = new Map<string, CalendarEvent[]>();
  for (const e of events) {
    const day = e.startAt.slice(0, 10);
    const bucket = buckets.get(day);
    if (bucket) {
      bucket.push(e);
    } else {
      buckets.set(day, [e]);
    }
  }
  const result: { date: string; items: CalendarEvent[] }[] = [];
  for (const [date, items] of buckets.entries()) {
    items.sort((a, b) => a.startAt.localeCompare(b.startAt));
    result.push({ date, items });
  }
  result.sort((a, b) => a.date.localeCompare(b.date));
  return result;
}
