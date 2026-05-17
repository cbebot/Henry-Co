import type { LinkedCareBooking } from "@/lib/care-sync";

/**
 * Locale tag kept loose so the page can pass any AppLocale.
 * String formatters in this module no longer bake locale-specific
 * labels — pass localized labels via the consuming components instead.
 */
export type CareLocale = string;

export type ShortMonths = readonly [
  string, string, string, string, string, string,
  string, string, string, string, string, string,
];

export function formatStamp(
  iso: string | null | undefined,
  shortMonths: ShortMonths,
): string {
  if (!iso) return "—";
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return "—";
  const d = new Date(ms);
  return `${d.getUTCDate().toString().padStart(2, "0")} ${shortMonths[d.getUTCMonth()]}`;
}

export function formatBookingWhen(
  date: string | null | undefined,
  slot: string | null | undefined,
  shortMonths: ShortMonths,
  toBeScheduledLabel: string,
): string {
  if (!date) return toBeScheduledLabel;
  const stamp = formatStamp(date, shortMonths);
  if (!slot) return stamp;
  return `${stamp} · ${slot}`;
}

const NF_NGN = new Intl.NumberFormat("en-NG", { maximumFractionDigits: 0 });

export function formatNaira(amount: number | null | undefined): string {
  const n = Number(amount);
  if (!Number.isFinite(n) || n <= 0) return "—";
  return `₦${NF_NGN.format(n)}`;
}

/* ---- Status taxonomy ------------------------------------------------ */

export type StatusKind = "live" | "scheduled" | "completed" | "issue" | "payment";

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

export function statusKind(booking: LinkedCareBooking): StatusKind {
  const verification = booking.payment.verificationStatus.toLowerCase();
  const status = String(booking.status || "").toLowerCase();
  if (booking.payment.balanceDue > 0 || PAYMENT_STATUSES.has(verification)) return "payment";
  if (ISSUE_STATUSES.has(status)) return "issue";
  if (COMPLETED_STATUSES.has(status)) return "completed";
  if (SCHEDULED_STATUSES.has(status)) return "scheduled";
  return "live";
}

export type StatusLabels = {
  live: string;
  scheduled: string;
  completed: string;
  issue: string;
  payment: string;
};

export function statusLabel(booking: LinkedCareBooking, labels: StatusLabels): string {
  const kind = statusKind(booking);
  return labels[kind];
}

/* ---- Aggregate stats ----------------------------------------------- */

export type CareStats = {
  total: number;
  inFlight: number;
  scheduled: number;
  completed: number;
  needsPayment: number;
  needsAttention: number;
  outstandingBalanceKobo: number;
  topActiveBooking: LinkedCareBooking | null;
};

export function careStats(bookings: ReadonlyArray<LinkedCareBooking>): CareStats {
  let inFlight = 0;
  let scheduled = 0;
  let completed = 0;
  let needsPayment = 0;
  let needsAttention = 0;
  let outstandingBalanceKobo = 0;
  let topActiveBooking: LinkedCareBooking | null = null;

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

    if (topActiveBooking === null && (kind === "payment" || kind === "issue" || kind === "live" || kind === "scheduled")) {
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

/* ---- Hero state ---------------------------------------------------- */

export type HeroState = "empty" | "calm" | "active" | "attention";

export function heroState(stats: CareStats): HeroState {
  if (stats.total === 0) return "empty";
  if (stats.needsPayment > 0 || stats.needsAttention > 0) return "attention";
  if (stats.inFlight > 0) return "active";
  return "calm";
}

/* ---- Activity helpers (mirror property pattern) -------------------- */

export type CareActivityRow = {
  id: string;
  activityType: string | null;
  title: string | null;
  description: string | null;
  status: string | null;
  occurredAt: string;
  actionUrl: string | null;
};

export function toCareActivityRows(
  raw: ReadonlyArray<Record<string, unknown>>,
): CareActivityRow[] {
  return raw.map((row, idx) => ({
    id: String(row.id || `${row.activity_type || "care"}-${idx}`),
    activityType: row.activity_type ? String(row.activity_type) : null,
    title: row.title ? String(row.title) : null,
    description: row.description ? String(row.description) : null,
    status: row.status ? String(row.status) : null,
    occurredAt: String(row.created_at || ""),
    actionUrl: row.action_url ? String(row.action_url) : null,
  }));
}
