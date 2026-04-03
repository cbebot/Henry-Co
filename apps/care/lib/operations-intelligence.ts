import "server-only";

import {
  getAdminBookings,
  getAdminReviews,
  getOrderItems,
  type AdminBookingRow,
  type AdminReviewRow,
} from "@/lib/admin/care-admin";
import { inferCareServiceFamily } from "@/lib/care-tracking";
import { getPaymentReviewQueue } from "@/lib/payments/verification";
import { getSupportThreads } from "@/lib/support/data";

export type OperationalSignalTone = "critical" | "warning" | "info" | "success";

export type OperationalSignal = {
  id: string;
  title: string;
  summary: string;
  href: string;
  group: string;
  tone: OperationalSignalTone;
  createdAt: string;
};

export type OperationsIntelligenceSnapshot = {
  generatedAt: string;
  activeBookingCount: number;
  overdueBookings: AdminBookingRow[];
  staleBookings: AdminBookingRow[];
  garmentBookingsMissingIntake: AdminBookingRow[];
  staleSupportThreadCount: number;
  urgentSupportThreadCount: number;
  repeatComplaintCount: number;
  unresolvedPaymentProofCount: number;
  pendingReviewCount: number;
  lowBookingFlowDeltaPercent: number;
  recentBookingCount: number;
  previousBookingCount: number;
  lowReviewAverage: number | null;
  signals: OperationalSignal[];
};

function cleanText(value?: string | null) {
  return String(value || "").trim();
}

function pluralize(count: number, singular: string, plural?: string) {
  return `${count} ${count === 1 ? singular : plural || `${singular}s`}`;
}

function startOfToday() {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now;
}

function daysAgo(days: number) {
  const value = new Date();
  value.setDate(value.getDate() - days);
  return value;
}

function hoursBetween(from?: string | null, to = Date.now()) {
  const date = from ? new Date(from) : null;
  if (!date || Number.isNaN(date.getTime())) return null;
  return Math.floor((to - date.getTime()) / 3_600_000);
}

function isActiveStatus(status?: string | null) {
  const normalized = cleanText(status).toLowerCase();
  return !["delivered", "cancelled"].includes(normalized);
}

function getOverdueBookings(rows: AdminBookingRow[]) {
  const today = startOfToday();

  return rows.filter((booking) => {
    if (!isActiveStatus(booking.status) || !booking.pickup_date) return false;
    const pickup = new Date(booking.pickup_date);
    if (Number.isNaN(pickup.getTime())) return false;
    pickup.setHours(0, 0, 0, 0);
    return pickup.getTime() < today.getTime();
  });
}

function getStaleBookings(rows: AdminBookingRow[]) {
  return rows.filter((booking) => {
    if (!isActiveStatus(booking.status)) return false;
    const staleHours = hoursBetween(booking.updated_at || booking.created_at);
    return staleHours !== null && staleHours >= 24;
  });
}

function getRecentApprovedAverage(reviews: AdminReviewRow[]) {
  const approved = reviews.filter((review) => review.is_approved).slice(0, 8);
  if (approved.length === 0) return null;
  const total = approved.reduce((sum, review) => sum + Number(review.rating || 0), 0);
  return total / approved.length;
}

function toSignal(input: Omit<OperationalSignal, "createdAt"> & { createdAt?: string | null }) {
  return {
    ...input,
    createdAt: cleanText(input.createdAt) || new Date().toISOString(),
  } satisfies OperationalSignal;
}

export async function getOperationsIntelligenceSnapshot() {
  const [bookings, orderItems, threads, paymentQueue, reviews] = await Promise.all([
    getAdminBookings({ scope: "active", limit: 500 }),
    getOrderItems({ scope: "active", limit: 700 }),
    getSupportThreads({ status: "all", limit: 220 }),
    getPaymentReviewQueue(180),
    getAdminReviews(120),
  ]);

  const generatedAt = new Date().toISOString();
  const now = Date.now();
  const overdueBookings = getOverdueBookings(bookings);
  const staleBookings = getStaleBookings(bookings);
  const garmentBookingsMissingIntake = bookings
    .filter((booking) => inferCareServiceFamily(booking) === "garment")
    .filter((booking) => isActiveStatus(booking.status))
    .filter((booking) => !orderItems.some((item) => item.booking_id === booking.id));

  const activeSupportThreads = threads.filter((thread) => thread.status !== "resolved");
  const staleSupportThreads = activeSupportThreads.filter((thread) => {
    const ageHours = hoursBetween(thread.lastActivityAt, now);
    return ageHours !== null && ageHours >= 12;
  });
  const urgentSupportThreads = activeSupportThreads.filter(
    (thread) => cleanText(thread.urgency).toLowerCase() === "urgent"
  );

  const repeatComplaintKeys = new Set(
    activeSupportThreads
      .filter((thread) => {
        const createdAt = thread.createdAt ? new Date(thread.createdAt) : null;
        if (!createdAt || Number.isNaN(createdAt.getTime())) return false;
        return createdAt >= daysAgo(30);
      })
      .map((thread) => cleanText(thread.customerEmail || thread.customerPhone))
      .filter(Boolean)
      .filter((value, _index, items) => items.filter((item) => item === value).length >= 2)
  );

  const unresolvedPaymentProofs = paymentQueue.filter((item) =>
    ["receipt_submitted", "under_review", "awaiting_corrected_proof", "rejected"].includes(
      cleanText(item.verificationStatus).toLowerCase()
    )
  );

  const pendingReviews = reviews.filter((review) => !review.is_approved);
  const lowReviewAverage = getRecentApprovedAverage(reviews);

  const sevenDaysAgo = daysAgo(7);
  const fourteenDaysAgo = daysAgo(14);
  const recentBookingCount = bookings.filter((booking) => {
    const createdAt = new Date(booking.created_at);
    return !Number.isNaN(createdAt.getTime()) && createdAt >= sevenDaysAgo;
  }).length;
  const previousBookingCount = bookings.filter((booking) => {
    const createdAt = new Date(booking.created_at);
    return !Number.isNaN(createdAt.getTime()) && createdAt < sevenDaysAgo && createdAt >= fourteenDaysAgo;
  }).length;
  const lowBookingFlowDeltaPercent =
    previousBookingCount <= 0
      ? recentBookingCount > 0
        ? 100
        : 0
      : ((recentBookingCount - previousBookingCount) / previousBookingCount) * 100;

  const signals: OperationalSignal[] = [];

  if (overdueBookings.length > 0) {
    signals.push(
      toSignal({
        id: "ops-overdue-bookings",
        title: "Bookings are overdue",
        summary: `${pluralize(overdueBookings.length, "booking")} has moved past the promised day without reaching a resolved state.`,
        href: "/owner/bookings",
        group: "Operations",
        tone: overdueBookings.length >= 6 ? "critical" : "warning",
        createdAt: overdueBookings[0]?.updated_at || overdueBookings[0]?.created_at,
      })
    );
  }

  if (staleBookings.length > 0) {
    signals.push(
      toSignal({
        id: "ops-stale-bookings",
        title: "Active bookings have gone quiet",
        summary: `${pluralize(staleBookings.length, "booking")} has no fresh status movement in the last 24 hours.`,
        href: "/manager/operations",
        group: "Operations",
        tone: staleBookings.length >= 8 ? "critical" : "warning",
        createdAt: staleBookings[0]?.updated_at || staleBookings[0]?.created_at,
      })
    );
  }

  if (garmentBookingsMissingIntake.length > 0) {
    signals.push(
      toSignal({
        id: "ops-garment-intake-gap",
        title: "Garment intake records are missing",
        summary: `${pluralize(garmentBookingsMissingIntake.length, "garment booking")} has no registered line items yet.`,
        href: "/manager/operations",
        group: "Intake",
        tone: garmentBookingsMissingIntake.length >= 4 ? "critical" : "warning",
        createdAt:
          garmentBookingsMissingIntake[0]?.updated_at || garmentBookingsMissingIntake[0]?.created_at,
      })
    );
  }

  if (staleSupportThreads.length > 0) {
    signals.push(
      toSignal({
        id: "ops-stale-support",
        title: "Customer follow-up is going stale",
        summary: `${pluralize(staleSupportThreads.length, "support thread")} has waited at least 12 hours without a fresh move.`,
        href: "/support/inbox",
        group: "Support",
        tone: staleSupportThreads.length >= 6 ? "critical" : "warning",
        createdAt: staleSupportThreads[0]?.lastActivityAt,
      })
    );
  }

  if (urgentSupportThreads.length > 0) {
    signals.push(
      toSignal({
        id: "ops-urgent-support",
        title: "Urgent customer issues are open",
        summary: `${pluralize(urgentSupportThreads.length, "urgent thread")} needs fast intervention from support or management.`,
        href: "/support/inbox",
        group: "Support",
        tone: "critical",
        createdAt: urgentSupportThreads[0]?.lastActivityAt,
      })
    );
  }

  if (unresolvedPaymentProofs.length > 0) {
    signals.push(
      toSignal({
        id: "ops-payment-proof-backlog",
        title: "Payment proof review is backing up",
        summary: `${pluralize(unresolvedPaymentProofs.length, "payment proof")} is still waiting for a decision.`,
        href: "/support/payments",
        group: "Payments",
        tone: unresolvedPaymentProofs.length >= 5 ? "critical" : "warning",
        createdAt:
          unresolvedPaymentProofs[0]?.lastSubmittedAt || unresolvedPaymentProofs[0]?.requestedAt,
      })
    );
  }

  if (repeatComplaintKeys.size > 0) {
    signals.push(
      toSignal({
        id: "ops-repeat-complaints",
        title: "Repeat complaint risk is visible",
        summary: `${pluralize(repeatComplaintKeys.size, "customer")} has opened multiple support threads in the last 30 days.`,
        href: "/owner/insights",
        group: "Retention",
        tone: repeatComplaintKeys.size >= 3 ? "critical" : "warning",
      })
    );
  }

  if (pendingReviews.length > 0) {
    signals.push(
      toSignal({
        id: "ops-review-moderation",
        title: "Review moderation is waiting",
        summary: `${pluralize(pendingReviews.length, "review")} is still pending approval or rejection.`,
        href: "/support/reviews",
        group: "Reviews",
        tone: "info",
        createdAt: pendingReviews[0]?.created_at,
      })
    );
  }

  if (lowReviewAverage !== null && lowReviewAverage < 4) {
    signals.push(
      toSignal({
        id: "ops-review-average",
        title: "Recent review quality has softened",
        summary: `The latest approved review average is ${lowReviewAverage.toFixed(1)} out of 5.`,
        href: "/owner/reviews",
        group: "Brand trust",
        tone: lowReviewAverage < 3.5 ? "critical" : "warning",
        createdAt: reviews[0]?.created_at,
      })
    );
  }

  if (previousBookingCount >= 4 && lowBookingFlowDeltaPercent <= -30) {
    signals.push(
      toSignal({
        id: "ops-booking-dropoff",
        title: "Booking flow is down versus the prior week",
        summary: `New requests are down ${Math.abs(lowBookingFlowDeltaPercent).toFixed(0)}% compared with the previous seven-day window.`,
        href: "/owner/insights",
        group: "Growth",
        tone: "warning",
      })
    );
  }

  return {
    generatedAt,
    activeBookingCount: bookings.length,
    overdueBookings,
    staleBookings,
    garmentBookingsMissingIntake,
    staleSupportThreadCount: staleSupportThreads.length,
    urgentSupportThreadCount: urgentSupportThreads.length,
    repeatComplaintCount: repeatComplaintKeys.size,
    unresolvedPaymentProofCount: unresolvedPaymentProofs.length,
    pendingReviewCount: pendingReviews.length,
    lowBookingFlowDeltaPercent,
    recentBookingCount,
    previousBookingCount,
    lowReviewAverage,
    signals,
  } satisfies OperationsIntelligenceSnapshot;
}
