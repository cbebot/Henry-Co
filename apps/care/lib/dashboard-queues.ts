import "server-only";

import type { AdminBookingRow } from "@/lib/admin/care-admin";
import {
  getServiceFamilyLabel,
  getTrackingStatusLabel,
  inferCareServiceFamily,
  normalizeTrackingStatus,
} from "@/lib/care-tracking";

export type DashboardQueueGroup = {
  id: string;
  title: string;
  description: string;
  tone: "critical" | "warning" | "info" | "success";
  bookings: AdminBookingRow[];
};

function cleanText(value?: string | null) {
  return String(value || "").trim();
}

function isResolved(booking: AdminBookingRow) {
  const family = inferCareServiceFamily(booking);
  const status = normalizeTrackingStatus(cleanText(booking.status), family);

  if (status === "cancelled") return true;
  if (family === "garment") return status === "delivered";
  if (family === "home") {
    return ["inspection_completed", "customer_confirmed"].includes(status);
  }
  return ["supervisor_signoff", "service_completed"].includes(status);
}

function isOverdue(booking: AdminBookingRow) {
  if (!booking.pickup_date || isResolved(booking)) return false;
  const pickup = new Date(booking.pickup_date);
  if (Number.isNaN(pickup.getTime())) return false;
  pickup.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return pickup.getTime() < today.getTime();
}

function isStale(booking: AdminBookingRow, hours = 24) {
  if (isResolved(booking)) return false;
  const updated = new Date(booking.updated_at || booking.created_at);
  if (Number.isNaN(updated.getTime())) return false;
  return Date.now() - updated.getTime() >= hours * 3_600_000;
}

function isUpcoming(booking: AdminBookingRow) {
  if (!booking.pickup_date || isResolved(booking)) return false;
  const pickup = new Date(booking.pickup_date);
  if (Number.isNaN(pickup.getTime())) return false;
  pickup.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = pickup.getTime() - today.getTime();
  return diff >= 0 && diff <= 2 * 86_400_000;
}

function isInProgress(booking: AdminBookingRow) {
  const family = inferCareServiceFamily(booking);
  const status = normalizeTrackingStatus(cleanText(booking.status), family);

  if (isResolved(booking)) return false;
  if (family === "garment") {
    return !["booked"].includes(status);
  }
  if (family === "home") {
    return !["booked", "team_scheduled", "team_assigned"].includes(status);
  }
  return !["booked", "schedule_confirmed", "team_assigned", "access_confirmed"].includes(status);
}

function sortByRecent(left: AdminBookingRow, right: AdminBookingRow) {
  return (
    new Date(right.updated_at || right.created_at).getTime() -
    new Date(left.updated_at || left.created_at).getTime()
  );
}

export function groupBookingsForOperations(bookings: AdminBookingRow[]) {
  const needsAttention = bookings.filter((booking) => isOverdue(booking) || isStale(booking, 24));
  const upcoming = bookings.filter(
    (booking) => !needsAttention.some((item) => item.id === booking.id) && isUpcoming(booking)
  );
  const inProgress = bookings.filter(
    (booking) =>
      !needsAttention.some((item) => item.id === booking.id) &&
      !upcoming.some((item) => item.id === booking.id) &&
      isInProgress(booking)
  );
  const resolved = bookings.filter((booking) => isResolved(booking));

  return [
    {
      id: "needs-attention",
      title: "Needs attention",
      description: "Overdue or quiet bookings that should be checked first.",
      tone: "critical",
      bookings: needsAttention.sort(sortByRecent),
    },
    {
      id: "upcoming",
      title: "Today and upcoming",
      description: "Bookings scheduled for today or the next two days.",
      tone: "warning",
      bookings: upcoming.sort(sortByRecent),
    },
    {
      id: "in-progress",
      title: "In progress",
      description: "Bookings already moving through live execution.",
      tone: "info",
      bookings: inProgress.sort(sortByRecent),
    },
    {
      id: "resolved",
      title: "Resolved or archived",
      description: "Recently completed or cancelled items kept for context.",
      tone: "success",
      bookings: resolved.sort(sortByRecent),
    },
  ] satisfies DashboardQueueGroup[];
}

export function findSelectedBooking(
  bookings: AdminBookingRow[],
  lookup?: string | null
) {
  const needle = cleanText(lookup).toLowerCase();
  if (!needle) return bookings[0] ?? null;

  return (
    bookings.find(
      (booking) =>
        booking.id === needle ||
        cleanText(booking.tracking_code).toLowerCase() === needle
    ) ?? bookings[0] ?? null
  );
}

export function bookingStatusSummary(booking: AdminBookingRow) {
  const family = inferCareServiceFamily(booking);
  return {
    family,
    familyLabel: getServiceFamilyLabel(family),
    statusLabel: getTrackingStatusLabel(booking.status, family),
    isOverdue: isOverdue(booking),
    isStale: isStale(booking, 24),
  };
}
