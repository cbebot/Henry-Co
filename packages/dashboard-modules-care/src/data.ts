import "server-only";

import type { UnifiedViewer } from "@henryco/auth";
import { createDataAdminClient } from "@henryco/data";
import {
  emailsMatch,
  normalizeEmail,
  normalizePhone,
  phonesMatch,
  phoneSearchVariants,
} from "@henryco/config";

/**
 * Module-local data layer for the care (Henry Onyx Fabric Care) home
 * widgets.
 *
 * The account shell loads a customer's care bookings in
 * `apps/account/lib/division-data.ts` (`getCareBookings`) via the
 * identity-reconciliation read in `apps/account/lib/care-sync.ts`
 * (`listLinkedCareBookingsForUser`), then aggregates them with
 * `careStats` / `heroState` from
 * `apps/account/components/care/helpers.ts`. Those modules live behind
 * the app's `@/` path alias and pull in app-only side effects (the
 * `next/server` `after()` linkage writes), so a workspace package cannot
 * import them directly — mirroring how the marketplace and wallet module
 * packages re-issue their reads through `@henryco/data` rather than
 * reaching into `apps/account`.
 *
 * This file therefore ports the *read-only* slice of that pipeline:
 *   - the same email / phone / mapped-id booking match
 *     (`findMatchedCareBookings`),
 *   - the same latest-payment-request resolution and verification-status
 *     derivation, and
 *   - the `statusKind` / `careStats` / `heroState` taxonomy verbatim
 *     from `components/care/helpers.ts`.
 *
 * No writes happen here — home widgets read existing API/DB only. The
 * numbers the widgets render are the real per-viewer booking aggregates;
 * nothing is fabricated.
 */

/* ------------------------------------------------------------------ *
 * Quick actions (shared by the command palette + deep links)
 * ------------------------------------------------------------------ */

/**
 * The palette groups a quick action may belong to. A strict subset of
 * the shell's `PaletteGroupLabel` so the module can map 1:1 without a
 * lossy cast.
 */
export type QuickActionGroup = "Open" | "Create" | "Search";

/**
 * One deep-linkable action the care module offers. Consumed by the
 * command palette so labels, hrefs, and keywords stay in one place.
 */
export type QuickAction = {
  /** Stable id, namespaced by module slug (e.g. `care.book`). */
  id: string;
  /** Visible label. */
  label: string;
  /** One-line description. */
  description: string;
  /** Destination — a real, live route in the account shell. */
  href: string;
  /** Which palette group this action sorts into. */
  group: QuickActionGroup;
  /** Fuzzy-match keywords. Label-first by convention. */
  keywords: ReadonlyArray<string>;
};

/** The live top-level surface this module routes to. */
export const CARE_HOME_HREF = "/care";

/**
 * The care module's quick actions. Every href points at the live
 * `/care` surface — the account shell renders booking, tracking, and
 * history there — so a clicked action never 404s.
 */
export function getCareQuickActions(): ReadonlyArray<QuickAction> {
  return [
    {
      id: "care.book",
      label: "Book a service",
      description: "Garment care, home or office cleaning with pickup.",
      href: CARE_HOME_HREF,
      group: "Create",
      keywords: ["book", "service", "cleaning", "laundry", "garment", "pickup"],
    },
    {
      id: "care.track",
      label: "Track an order",
      description: "See where your pickup or delivery is right now.",
      href: CARE_HOME_HREF,
      group: "Open",
      keywords: ["track", "order", "status", "pickup", "delivery"],
    },
    {
      id: "care.bookings",
      label: "My bookings",
      description: "Review your past and upcoming care bookings.",
      href: CARE_HOME_HREF,
      group: "Open",
      keywords: ["bookings", "history", "appointments", "orders"],
    },
  ];
}

/* ------------------------------------------------------------------ *
 * Booking aggregate types
 * ------------------------------------------------------------------ */

/**
 * The read-only projection of a linked care booking this module needs to
 * compute stats. A strict subset of `apps/account/lib/care-sync.ts`'s
 * `LinkedCareBooking` — only the fields `statusKind` / `careStats`
 * consume.
 */
export type CareBooking = {
  id: string;
  trackingCode: string | null;
  serviceType: string | null;
  status: string | null;
  updatedAt: string | null;
  createdAt: string | null;
  payment: {
    verificationStatus: string;
    balanceDue: number;
  };
};

/**
 * Per-viewer booking aggregate. 1:1 with `CareStats` in
 * `apps/account/components/care/helpers.ts`.
 *
 * NOTE: `outstandingBalanceKobo` is named for parity with the app's
 * helper, but `care_bookings.balance_due` is stored in **whole naira**
 * (the app's `formatNaira` formats it directly, with no `/100`). Render
 * it with {@link ../format!formatNaira}, never a kobo formatter.
 */
export type CareStats = {
  total: number;
  inFlight: number;
  scheduled: number;
  completed: number;
  needsPayment: number;
  needsAttention: number;
  outstandingBalanceKobo: number;
  topActiveBooking: CareBooking | null;
};

export type HeroState = "empty" | "calm" | "active" | "attention";

/** Status taxonomy bucket. Mirrors `helpers.ts:StatusKind`. */
export type StatusKind = "live" | "scheduled" | "completed" | "issue" | "payment";

/** A recent care activity row (mirrors `helpers.ts:CareActivityRow`). */
export type CareActivityRow = {
  id: string;
  activityType: string | null;
  title: string | null;
  description: string | null;
  status: string | null;
  occurredAt: string;
  actionUrl: string | null;
};

export type CareSnapshot = {
  stats: CareStats;
  hero: HeroState;
  /** Most recent care activity (newest first), capped for the widget. */
  recentActivity: ReadonlyArray<CareActivityRow>;
};

/* ------------------------------------------------------------------ *
 * Status taxonomy — verbatim from components/care/helpers.ts
 * ------------------------------------------------------------------ */

const COMPLETED_STATUSES = new Set([
  "delivered",
  "customer_confirmed",
  "inspection_completed",
  "service_completed",
  "supervisor_signoff",
]);

const ISSUE_STATUSES = new Set(["cancelled", "issue", "exception", "rejected"]);

const SCHEDULED_STATUSES = new Set(["booked", "scheduled", "confirmed"]);

const PAYMENT_STATUSES = new Set([
  "awaiting_payment",
  "receipt_submitted",
  "under_review",
  "awaiting_corrected_proof",
  "awaiting_receipt",
]);

function statusKind(booking: CareBooking): StatusKind {
  const verification = booking.payment.verificationStatus.toLowerCase();
  const status = String(booking.status || "").toLowerCase();
  if (booking.payment.balanceDue > 0 || PAYMENT_STATUSES.has(verification)) return "payment";
  if (ISSUE_STATUSES.has(status)) return "issue";
  if (COMPLETED_STATUSES.has(status)) return "completed";
  if (SCHEDULED_STATUSES.has(status)) return "scheduled";
  return "live";
}

/**
 * Aggregate a viewer's bookings into the care stat tiles. Verbatim
 * logic from `components/care/helpers.ts:careStats`.
 */
export function careStats(bookings: ReadonlyArray<CareBooking>): CareStats {
  let inFlight = 0;
  let scheduled = 0;
  let completed = 0;
  let needsPayment = 0;
  let needsAttention = 0;
  let outstandingBalanceKobo = 0;
  let topActiveBooking: CareBooking | null = null;

  for (const booking of bookings) {
    const kind = statusKind(booking);
    if (kind === "payment") {
      needsPayment += 1;
      outstandingBalanceKobo += booking.payment.balanceDue;
    } else if (kind === "issue") {
      needsAttention += 1;
    } else if (kind === "completed") {
      completed += 1;
    } else if (kind === "scheduled") {
      scheduled += 1;
    } else {
      inFlight += 1;
    }

    if (
      topActiveBooking === null &&
      (kind === "payment" || kind === "issue" || kind === "live" || kind === "scheduled")
    ) {
      topActiveBooking = booking;
    }
  }

  return {
    total: bookings.length,
    inFlight,
    scheduled,
    completed,
    needsPayment,
    needsAttention,
    outstandingBalanceKobo,
    topActiveBooking,
  };
}

/** Derive the hero mood from the stats. Verbatim from `helpers.ts:heroState`. */
export function heroState(stats: CareStats): HeroState {
  if (stats.total === 0) return "empty";
  if (stats.needsPayment > 0 || stats.needsAttention > 0) return "attention";
  if (stats.inFlight > 0) return "active";
  return "calm";
}

/* ------------------------------------------------------------------ *
 * Booking match + payment resolution (read-only port of care-sync.ts)
 * ------------------------------------------------------------------ */

type DataClient = ReturnType<typeof createDataAdminClient>;

type CareBookingRow = {
  id: string;
  tracking_code: string | null;
  service_type: string | null;
  email: string | null;
  phone: string | null;
  phone_normalized: string | null;
  status: string | null;
  balance_due: number | null;
  payment_status: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type CarePaymentRequestRow = {
  booking_id: string | null;
  status: string | null;
  payload: Record<string, unknown> | null;
};

const BOOKING_COLUMNS =
  "id, tracking_code, service_type, email, phone, phone_normalized, status, balance_due, payment_status, created_at, updated_at";

function cleanText(value: unknown): string | null {
  const text = typeof value === "string" ? value.trim() : "";
  return text || null;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function sanitizeAmount(value: unknown): number {
  const normalized = Number(value ?? 0);
  return Number.isFinite(normalized) ? Math.max(0, normalized) : 0;
}

/**
 * The latest verification status for a booking. Verbatim logic from
 * `care-sync.ts:latestVerificationStatus`.
 */
function latestVerificationStatus(
  balanceDue: number,
  request: CarePaymentRequestRow | null,
): string {
  const payload = asRecord(request?.payload);
  const explicit = cleanText(payload?.verification_status);
  if (cleanText(request?.status)?.toLowerCase() === "paid" || balanceDue <= 0) {
    return "approved";
  }
  return explicit || "awaiting_receipt";
}

async function getCareIdentity(client: DataClient, userId: string) {
  const { data: profile } = await client
    .from("customer_profiles")
    .select("email, full_name, phone")
    .eq("id", userId)
    .maybeSingle();

  return {
    userId,
    email: profile?.email ?? null,
    phone: profile?.phone ?? null,
  };
}

async function loadMappedBookingIds(client: DataClient, userId: string): Promise<string[]> {
  const { data } = await client
    .from("customer_activity")
    .select("reference_id")
    .eq("user_id", userId)
    .eq("division", "care")
    .eq("reference_type", "care_booking")
    .limit(200);

  return ((data ?? []) as Array<{ reference_id: string | null }>)
    .map((row) => cleanText(row.reference_id))
    .filter((id): id is string => Boolean(id));
}

async function loadBookingsByIds(client: DataClient, ids: string[]): Promise<CareBookingRow[]> {
  if (ids.length === 0) return [];
  const { data } = await client
    .from("care_bookings")
    .select(BOOKING_COLUMNS)
    .in("id", ids)
    .order("created_at", { ascending: false });
  return (data ?? []) as CareBookingRow[];
}

async function loadBookingsByEmail(client: DataClient, email: string | null): Promise<CareBookingRow[]> {
  if (!email) return [];
  const { data } = await client
    .from("care_bookings")
    .select(BOOKING_COLUMNS)
    .ilike("email", email)
    .order("created_at", { ascending: false })
    .limit(80);
  return (data ?? []) as CareBookingRow[];
}

async function loadBookingsByPhone(client: DataClient, phone: string | null): Promise<CareBookingRow[]> {
  const variants = phoneSearchVariants(phone);
  if (variants.length === 0) return [];

  const [normalizedResult, rawResult] = await Promise.all([
    client
      .from("care_bookings")
      .select(BOOKING_COLUMNS)
      .in("phone_normalized", variants)
      .order("created_at", { ascending: false })
      .limit(80),
    client
      .from("care_bookings")
      .select(BOOKING_COLUMNS)
      .in("phone", variants)
      .order("created_at", { ascending: false })
      .limit(80),
  ]);

  return [
    ...((normalizedResult.data ?? []) as CareBookingRow[]),
    ...((rawResult.data ?? []) as CareBookingRow[]),
  ];
}

/**
 * Read-only booking match. Mirrors `care-sync.ts:findMatchedCareBookings`
 * exactly — mapped ids are always trusted; email / phone matches are
 * filtered through the canonical `emailsMatch` / `phonesMatch` helpers.
 */
async function findMatchedCareBookings(
  client: DataClient,
  identity: { userId: string; email: string | null; phone: string | null },
): Promise<CareBookingRow[]> {
  const normalizedEmail = normalizeEmail(identity.email);
  const normalizedPhone = normalizePhone(identity.phone);

  const [mappedIds, bookingsByEmail, bookingsByPhone] = await Promise.all([
    loadMappedBookingIds(client, identity.userId),
    loadBookingsByEmail(client, normalizedEmail),
    loadBookingsByPhone(client, normalizedPhone),
  ]);
  const mappedBookings = await loadBookingsByIds(client, mappedIds);

  const bookingsById = new Map<string, CareBookingRow>();
  for (const booking of [...mappedBookings, ...bookingsByEmail, ...bookingsByPhone]) {
    bookingsById.set(booking.id, booking);
  }

  return [...bookingsById.values()]
    .filter((booking) => {
      if (mappedIds.includes(booking.id)) return true;
      return (
        emailsMatch(booking.email, normalizedEmail) ||
        phonesMatch(booking.phone_normalized || booking.phone, normalizedPhone)
      );
    })
    .sort(
      (left, right) =>
        new Date(right.updated_at || right.created_at || 0).getTime() -
        new Date(left.updated_at || left.created_at || 0).getTime(),
    );
}

async function loadLatestPaymentRequests(
  client: DataClient,
  bookingIds: string[],
): Promise<Map<string, CarePaymentRequestRow>> {
  if (bookingIds.length === 0) return new Map();

  const { data } = await client
    .from("care_payment_requests")
    .select("booking_id, status, payload, created_at")
    .in("booking_id", bookingIds)
    .order("created_at", { ascending: false });

  const latestByBooking = new Map<string, CarePaymentRequestRow>();
  for (const row of (data ?? []) as CarePaymentRequestRow[]) {
    if (!row.booking_id || latestByBooking.has(row.booking_id)) continue;
    latestByBooking.set(row.booking_id, row);
  }
  return latestByBooking;
}

async function loadRecentCareActivity(
  client: DataClient,
  userId: string,
  limit: number,
): Promise<CareActivityRow[]> {
  const { data } = await client
    .from("customer_activity")
    .select("id, activity_type, title, description, status, created_at, action_url")
    .eq("user_id", userId)
    .eq("division", "care")
    .order("created_at", { ascending: false })
    .limit(limit);

  const rows = (data ?? []) as Array<{
    id: string | null;
    activity_type: string | null;
    title: string | null;
    description: string | null;
    status: string | null;
    created_at: string | null;
    action_url: string | null;
  }>;

  return rows.map((row, idx) => ({
    id: String(row.id || `${row.activity_type || "care"}-${idx}`),
    activityType: row.activity_type ? String(row.activity_type) : null,
    title: row.title ? String(row.title) : null,
    description: row.description ? String(row.description) : null,
    status: row.status ? String(row.status) : null,
    occurredAt: String(row.created_at || ""),
    actionUrl: row.action_url ? String(row.action_url) : null,
  }));
}

/**
 * Build the care snapshot for the current viewer. Returns null when the
 * viewer is not a customer-context viewer (owner / staff lanes that don't
 * carry a customer booking surface). The eligibility gate in
 * `getRoleGate` is broader (any customer-surface viewer) — this null is
 * the data-layer guard, matching the wallet / marketplace modules.
 */
export async function loadCareSnapshot(viewer: UnifiedViewer): Promise<CareSnapshot | null> {
  if (viewer.kind !== "customer") return null;

  const client = createDataAdminClient();
  const userId = viewer.user.id;

  const identity = await getCareIdentity(client, userId);

  const [matched, recentActivity] = await Promise.all([
    findMatchedCareBookings(client, identity),
    loadRecentCareActivity(client, userId, 20),
  ]);

  const paymentRequests = await loadLatestPaymentRequests(
    client,
    matched.map((booking) => booking.id),
  );

  const bookings: CareBooking[] = matched.map((row) => {
    const balanceDue = sanitizeAmount(row.balance_due);
    const request = paymentRequests.get(row.id) ?? null;
    return {
      id: row.id,
      trackingCode: row.tracking_code,
      serviceType: row.service_type,
      status: row.status,
      updatedAt: row.updated_at,
      createdAt: row.created_at,
      payment: {
        balanceDue,
        verificationStatus: latestVerificationStatus(balanceDue, request),
      },
    };
  });

  const stats = careStats(bookings);

  return {
    stats,
    hero: heroState(stats),
    recentActivity,
  };
}
