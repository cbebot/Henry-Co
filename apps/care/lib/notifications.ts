import "server-only";

import { createAdminSupabase } from "@/lib/supabase";
import {
  getAdminBookings,
  getAdminReviews,
  getExpenses,
  getFinanceSummary,
  type AdminBookingRow,
} from "@/lib/admin/care-admin";
import { type StaffRole } from "@/lib/auth/roles";
import {
  inferCareServiceFamily,
  isRecurringService,
  parseServiceBookingSummary,
} from "@/lib/care-tracking";
import { getOperationsIntelligenceSnapshot } from "@/lib/operations-intelligence";
import { getPaymentReviewQueue } from "@/lib/payments/verification";
import {
  getSupportInfrastructureStatus,
  getSupportThreads,
} from "@/lib/support/data";
import { getWhatsAppHealthStatus } from "@/lib/support/whatsapp-health";

export type RoleNotificationTone = "critical" | "warning" | "info" | "success";
export type RoleNotificationKind =
  | "operations"
  | "finance"
  | "support"
  | "payments"
  | "messaging"
  | "reviews"
  | "growth"
  | "execution"
  | "routing";

export type RoleNotificationItem = {
  id: string;
  title: string;
  body: string;
  href: string;
  group: string;
  tone: RoleNotificationTone;
  kind: RoleNotificationKind;
  createdAt: string;
  actionLabel?: string;
  isUnread?: boolean;
};

export type RoleNotificationCenter = {
  role: StaffRole;
  unreadCount: number;
  lastReadAt: string | null;
  items: RoleNotificationItem[];
};

type NotificationQueueRow = {
  id: string;
  status: string | null;
  subject: string | null;
  created_at: string | null;
};

function cleanText(value?: string | null) {
  return String(value || "").trim();
}

function pluralize(count: number, singular: string, plural?: string) {
  return `${count} ${count === 1 ? singular : plural || `${singular}s`}`;
}

function sortKeyForTone(tone: RoleNotificationTone) {
  if (tone === "critical") return 4;
  if (tone === "warning") return 3;
  if (tone === "info") return 2;
  return 1;
}

function compareNotifications(left: RoleNotificationItem, right: RoleNotificationItem) {
  const toneGap = sortKeyForTone(right.tone) - sortKeyForTone(left.tone);
  if (toneGap !== 0) return toneGap;
  return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
}

function toNotification(
  item: Omit<RoleNotificationItem, "createdAt"> & { createdAt?: string | null }
) {
  return {
    ...item,
    createdAt: cleanText(item.createdAt) || new Date().toISOString(),
  } satisfies RoleNotificationItem;
}

async function getLastReadAt(userId: string, role: StaffRole) {
  const supabase = createAdminSupabase();
  const { data } = await supabase
    .from("care_security_logs")
    .select("created_at, details")
    .eq("event_type", "notification_center_read")
    .eq("actor_user_id", userId)
    .order("created_at", { ascending: false })
    .limit(30);

  for (const row of (data ?? []) as Array<Record<string, unknown>>) {
    const details =
      row.details && typeof row.details === "object" && !Array.isArray(row.details)
        ? (row.details as Record<string, unknown>)
        : null;

    if (cleanText(String(details?.role || "")).toLowerCase() === role) {
      return cleanText(String(row.created_at || "")) || null;
    }
  }

  return null;
}

async function getReadNotificationItemIds(userId: string, role: StaffRole) {
  const supabase = createAdminSupabase();
  const { data } = await supabase
    .from("care_security_logs")
    .select("details")
    .eq("event_type", "notification_item_read")
    .eq("actor_user_id", userId)
    .order("created_at", { ascending: false })
    .limit(160);

  const ids = new Set<string>();

  for (const row of (data ?? []) as Array<Record<string, unknown>>) {
    const details =
      row.details && typeof row.details === "object" && !Array.isArray(row.details)
        ? (row.details as Record<string, unknown>)
        : null;

    if (cleanText(String(details?.role || "")).toLowerCase() !== role) continue;

    const itemId = cleanText(String(details?.item_id || ""));
    if (itemId) ids.add(itemId);
  }

  return ids;
}

async function getNotificationTransportRows(limit = 30) {
  const supabase = createAdminSupabase();
  const { data } = await supabase
    .from("care_notification_queue")
    .select("id, status, subject, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  return ((data ?? []) as Array<Record<string, unknown>>).map((row) => ({
    id: String(row.id || ""),
    status: cleanText(row.status as string | null),
    subject: cleanText(row.subject as string | null),
    created_at: cleanText(row.created_at as string | null),
  })) satisfies NotificationQueueRow[];
}

function overdueBookings(rows: AdminBookingRow[]) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return rows.filter((row) => {
    if (!row.pickup_date) return false;
    const date = new Date(row.pickup_date);
    if (Number.isNaN(date.getTime())) return false;
    date.setHours(0, 0, 0, 0);

    const status = cleanText(row.status).toLowerCase();
    return date < today && !["delivered", "cancelled"].includes(status);
  });
}

function startOfTodayIso() {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now.toISOString();
}

async function buildOwnerNotifications() {
  const [finance, expenses, reviews, queueRows, whatsapp, intelligence] = await Promise.all([
    getFinanceSummary(),
    getExpenses({ scope: "active", limit: 120 }),
    getAdminReviews(40),
    getNotificationTransportRows(30),
    getWhatsAppHealthStatus(),
    getOperationsIntelligenceSnapshot(),
  ]);

  const now = new Date().toISOString();
  const items: RoleNotificationItem[] = intelligence.signals.map((signal) =>
    toNotification({
      id: signal.id,
      title: signal.title,
      body: signal.summary,
      href: signal.href,
      group: signal.group,
      tone: signal.tone,
      kind:
        signal.group === "Payments"
          ? "payments"
          : signal.group === "Support"
            ? "support"
            : signal.group === "Growth"
              ? "growth"
              : signal.group === "Reviews" || signal.group === "Brand trust"
                ? "reviews"
                : "operations",
      actionLabel: "Open insight",
      createdAt: signal.createdAt,
    })
  );

  const failedEmails = queueRows.filter((row) => cleanText(row.status).toLowerCase() === "failed");
  const queuedEmails = queueRows.filter((row) => cleanText(row.status).toLowerCase() === "queued");
  const recordedExpenses = expenses.filter(
    (row) => cleanText(row.approval_status).toLowerCase() === "recorded"
  );
  const pendingReviews = reviews.filter((review) => !review.is_approved);

  if (finance.balance < 0 || finance.total_outflow > finance.total_inflow) {
    items.push(
      toNotification({
        id: "owner-finance-pressure",
        title: "Finance pressure needs owner attention",
        body: `Tracked outflow is above inflow. Current balance is ₦${Number(
          finance.balance || 0
        ).toLocaleString()}.`,
        href: "/owner/finance",
        group: "Finance",
        tone: "critical",
        kind: "finance",
        actionLabel: "Open finance",
        createdAt: now,
      })
    );
  }

  if (whatsapp.readiness !== "ready") {
    items.push(
      toNotification({
        id: "owner-whatsapp-readiness",
        title: "WhatsApp Cloud delivery still needs intervention",
        body:
          whatsapp.blockers[0] ||
          "The Cloud API sender still needs a final Meta-side fix before live delivery can succeed.",
        href: "/owner/security",
        group: "Messaging",
        tone: "critical",
        kind: "messaging",
        actionLabel: "Check sender",
        createdAt: now,
      })
    );
  }

  if (failedEmails.length > 0) {
    items.push(
      toNotification({
        id: "owner-email-failures",
        title: "Transactional email failures were detected",
        body: `${pluralize(failedEmails.length, "notification")} failed recently and should be reviewed before customer follow-up slips.`,
        href: "/owner/security",
        group: "Messaging",
        tone: "critical",
        kind: "messaging",
        actionLabel: "Inspect transport",
        createdAt: failedEmails[0]?.created_at || now,
      })
    );
  }

  if (recordedExpenses.length > 0) {
    items.push(
      toNotification({
        id: "owner-expense-approvals",
        title: "Expense approvals are waiting",
        body: `${pluralize(recordedExpenses.length, "expense")} is still recorded and awaiting approval or voiding.`,
        href: "/owner/finance",
        group: "Finance",
        tone: "warning",
        kind: "finance",
        actionLabel: "Review approvals",
        createdAt: recordedExpenses[0]?.created_at || now,
      })
    );
  }

  if (pendingReviews.length > 0) {
    items.push(
      toNotification({
        id: "owner-review-moderation",
        title: "New reviews are waiting for moderation",
        body: `${pluralize(pendingReviews.length, "review")} is still pending approval on the public trust surface.`,
        href: "/owner/reviews",
        group: "Brand trust",
        tone: "info",
        kind: "reviews",
        actionLabel: "Open reviews",
        createdAt: cleanText(pendingReviews[0]?.created_at) || now,
      })
    );
  }

  if (queuedEmails.length > 0 && failedEmails.length === 0) {
    items.push(
      toNotification({
        id: "owner-queued-email-watch",
        title: "Queued notifications are still draining",
        body: `${pluralize(queuedEmails.length, "email")} is queued and should be watched until transport catches up.`,
        href: "/owner/security",
        group: "Messaging",
        tone: "info",
        kind: "messaging",
        actionLabel: "Inspect queue",
        createdAt: queuedEmails[0]?.created_at || now,
      })
    );
  }

  return items;
}

async function buildManagerNotifications() {
  const [bookings, expenses, threads, intelligence] = await Promise.all([
    getAdminBookings({ scope: "active", limit: 320 }),
    getExpenses({ scope: "active", limit: 120 }),
    getSupportThreads({ status: "all", limit: 120 }),
    getOperationsIntelligenceSnapshot(),
  ]);

  const now = new Date().toISOString();
  const items: RoleNotificationItem[] = intelligence.signals
    .filter((signal) => ["Operations", "Intake", "Support", "Payments"].includes(signal.group))
    .map((signal) =>
      toNotification({
        id: `manager-${signal.id}`,
        title: signal.title,
        body: signal.summary,
        href: signal.href.startsWith("/owner") ? "/manager/operations" : signal.href,
        group: signal.group,
        tone: signal.tone,
        kind:
          signal.group === "Payments"
            ? "payments"
            : signal.group === "Support"
              ? "support"
              : "operations",
        actionLabel: "Open queue",
        createdAt: signal.createdAt,
      })
    );

  const recordedExpenses = expenses.filter(
    (row) => cleanText(row.approval_status).toLowerCase() === "recorded"
  );
  const unassignedThreads = threads.filter((thread) => !thread.assignedTo?.userId);
  const overdue = overdueBookings(bookings);

  if (recordedExpenses.length > 0) {
    items.push(
      toNotification({
        id: "manager-expense-followup",
        title: "Recorded expenses need follow-through",
        body: `${pluralize(recordedExpenses.length, "expense")} is waiting to be cleaned up or escalated to owner review.`,
        href: "/manager/expenses",
        group: "Finance",
        tone: "info",
        kind: "finance",
        actionLabel: "Open expenses",
        createdAt: cleanText(recordedExpenses[0]?.created_at) || now,
      })
    );
  }

  if (unassignedThreads.length > 0) {
    items.push(
      toNotification({
        id: "manager-unassigned-support",
        title: "Customer issues need staffing decisions",
        body: `${pluralize(unassignedThreads.length, "support thread")} is unassigned and may need escalation or staffing help.`,
        href: "/support/inbox?assignee=unassigned",
        group: "Support",
        tone: "warning",
        kind: "support",
        actionLabel: "Assign inbox",
        createdAt: unassignedThreads[0]?.lastActivityAt || now,
      })
    );
  }

  if (overdue.length === 0 && intelligence.signals.length === 0) {
    items.push(
      toNotification({
        id: "manager-queue-steady",
        title: "Operations queue is moving cleanly",
        body: "No overdue booking pressure or major queue bottleneck is visible right now.",
        href: "/manager",
        group: "Operations",
        tone: "success",
        kind: "operations",
        actionLabel: "Open overview",
        createdAt: now,
      })
    );
  }

  return items;
}

async function buildSupportNotifications() {
  const [threads, paymentQueue, reviews, infrastructure, whatsapp] = await Promise.all([
    getSupportThreads({ status: "all", limit: 180 }),
    getPaymentReviewQueue(120),
    getAdminReviews(100),
    getSupportInfrastructureStatus(),
    getWhatsAppHealthStatus(),
  ]);

  const now = new Date().toISOString();
  const items: RoleNotificationItem[] = [];
  const urgentThreads = threads.filter((thread) => cleanText(thread.urgency).toLowerCase() === "urgent");
  const staleThreads = threads.filter((thread) => {
    if (thread.status === "resolved") return false;
    const last = new Date(thread.lastActivityAt);
    if (Number.isNaN(last.getTime())) return false;
    return Date.now() - last.getTime() >= 12 * 3_600_000;
  });
  const unassignedThreads = threads.filter((thread) => !thread.assignedTo?.userId);
  const reviewPayments = paymentQueue.filter((item) =>
    ["receipt_submitted", "under_review", "awaiting_corrected_proof", "rejected"].includes(
      cleanText(item.verificationStatus).toLowerCase()
    )
  );
  const pendingReviews = reviews.filter((review) => !review.is_approved);

  if (urgentThreads.length > 0) {
    items.push(
      toNotification({
        id: "support-urgent-threads",
        title: "Urgent customer conversations are open",
        body: `${pluralize(urgentThreads.length, "urgent thread")} needs immediate support attention.`,
        href: "/support/inbox",
        group: "Inbox",
        tone: "critical",
        kind: "support",
        actionLabel: "Open inbox",
        createdAt: urgentThreads[0]?.lastActivityAt || now,
      })
    );
  }

  if (staleThreads.length > 0) {
    items.push(
      toNotification({
        id: "support-stale-threads",
        title: "Some support conversations need a fresh move",
        body: `${pluralize(staleThreads.length, "thread")} has been quiet for at least 12 hours while still active.`,
        href: "/support/inbox",
        group: "Inbox",
        tone: staleThreads.length >= 6 ? "critical" : "warning",
        kind: "support",
        actionLabel: "Reopen queue",
        createdAt: staleThreads[0]?.lastActivityAt || now,
      })
    );
  }

  if (reviewPayments.length > 0) {
    items.push(
      toNotification({
        id: "support-payment-queue",
        title: "Receipt verification queue is active",
        body: `${pluralize(reviewPayments.length, "payment proof")} is waiting on support review or a customer follow-up.`,
        href: "/support/payments",
        group: "Payments",
        tone: "warning",
        kind: "payments",
        actionLabel: "Review receipts",
        createdAt: reviewPayments[0]?.lastSubmittedAt || reviewPayments[0]?.requestedAt || now,
      })
    );
  }

  if (unassignedThreads.length > 0) {
    items.push(
      toNotification({
        id: "support-unassigned-threads",
        title: "Some support work has no owner yet",
        body: `${pluralize(unassignedThreads.length, "thread")} is visible without an assignee.`,
        href: "/support/inbox?assignee=unassigned",
        group: "Inbox",
        tone: "warning",
        kind: "support",
        actionLabel: "Assign threads",
        createdAt: unassignedThreads[0]?.lastActivityAt || now,
      })
    );
  }

  if (pendingReviews.length > 0) {
    items.push(
      toNotification({
        id: "support-review-moderation",
        title: "New review moderation work is waiting",
        body: `${pluralize(pendingReviews.length, "review")} is still pending moderation or approval.`,
        href: "/support/reviews",
        group: "Reviews",
        tone: "info",
        kind: "reviews",
        actionLabel: "Moderate reviews",
        createdAt: cleanText(pendingReviews[0]?.created_at) || now,
      })
    );
  }

  if (!infrastructure.inboundEmail.configured || !infrastructure.whatsapp.configured) {
    items.push(
      toNotification({
        id: "support-messaging-config",
        title: "Support messaging transport is only partially armed",
        body:
          infrastructure.whatsapp.reason ||
          infrastructure.inboundEmail.reason ||
          "One or more support communication channels still needs configuration.",
        href: "/support",
        group: "Messaging",
        tone: "warning",
        kind: "messaging",
        actionLabel: "Check channels",
        createdAt: now,
      })
    );
  }

  if (whatsapp.readiness !== "ready") {
    items.push(
      toNotification({
        id: "support-whatsapp-readiness",
        title: "WhatsApp support replies are not fully ready",
        body:
          whatsapp.blockers[0] ||
          "The configured WhatsApp sender still needs a Meta-side fix before reliable support delivery.",
        href: "/support",
        group: "Messaging",
        tone: "warning",
        kind: "messaging",
        actionLabel: "See diagnostics",
        createdAt: now,
      })
    );
  }

  return items;
}

async function buildRiderNotifications() {
  const bookings = await getAdminBookings({ scope: "active", limit: 320 });
  const now = new Date();
  const todayIso = startOfTodayIso();
  const items: RoleNotificationItem[] = [];
  const garmentBookings = bookings.filter(
    (booking) => inferCareServiceFamily(booking) === "garment"
  );

  const pickupQueue = garmentBookings.filter((booking) =>
    ["confirmed", "booked"].includes(cleanText(booking.status).toLowerCase())
  );
  const deliveryQueue = garmentBookings.filter((booking) =>
    ["picked_up", "quality_check", "out_for_delivery"].includes(
      cleanText(booking.status).toLowerCase()
    )
  );
  const overduePickups = pickupQueue.filter((booking) => {
    if (!booking.pickup_date) return false;
    const pickup = new Date(booking.pickup_date);
    pickup.setHours(0, 0, 0, 0);
    return pickup.getTime() < new Date(todayIso).getTime();
  });

  if (overduePickups.length > 0) {
    items.push(
      toNotification({
        id: "rider-overdue-pickups",
        title: "Pickup commitments are overdue",
        body: `${pluralize(overduePickups.length, "pickup")} is still open past its scheduled day.`,
        href: "/rider/pickups",
        group: "Pickups",
        tone: "critical",
        kind: "routing",
        actionLabel: "Open pickups",
        createdAt: cleanText(overduePickups[0]?.pickup_date) || now.toISOString(),
      })
    );
  }

  if (pickupQueue.length > 0) {
    items.push(
      toNotification({
        id: "rider-ready-pickups",
        title: "Pickup queue is ready",
        body: `${pluralize(pickupQueue.length, "garment request")} is waiting for rider collection.`,
        href: "/rider/pickups",
        group: "Pickups",
        tone: "warning",
        kind: "routing",
        actionLabel: "Start routes",
        createdAt: cleanText(pickupQueue[0]?.pickup_date) || now.toISOString(),
      })
    );
  }

  if (deliveryQueue.length > 0) {
    items.push(
      toNotification({
        id: "rider-delivery-queue",
        title: "Return deliveries are in motion",
        body: `${pluralize(deliveryQueue.length, "item")} is in a delivery-ready stage and should stay route-visible.`,
        href: "/rider/deliveries",
        group: "Deliveries",
        tone: "info",
        kind: "routing",
        actionLabel: "Open deliveries",
        createdAt: cleanText(deliveryQueue[0]?.updated_at) || now.toISOString(),
      })
    );
  }

  return items;
}

async function buildStaffNotifications() {
  const bookings = await getAdminBookings({ scope: "active", limit: 320 });
  const now = new Date().toISOString();
  const items: RoleNotificationItem[] = [];
  const serviceBookings = bookings.filter(
    (booking) => inferCareServiceFamily(booking) !== "garment"
  );
  const overdue = overdueBookings(serviceBookings);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayVisits = serviceBookings.filter((booking) => {
    if (!booking.pickup_date) return false;
    const date = new Date(booking.pickup_date);
    date.setHours(0, 0, 0, 0);
    return date.getTime() === today.getTime();
  });
  const recurring = serviceBookings.filter((booking) =>
    isRecurringService(parseServiceBookingSummary(booking.item_summary))
  );

  if (overdue.length > 0) {
    items.push(
      toNotification({
        id: "staff-overdue-visits",
        title: "Service visits are running behind",
        body: `${pluralize(overdue.length, "service visit")} is already past its scheduled day and still active.`,
        href: "/staff/assignments",
        group: "Execution",
        tone: "critical",
        kind: "execution",
        actionLabel: "Review visits",
        createdAt: cleanText(overdue[0]?.updated_at) || now,
      })
    );
  }

  if (todayVisits.length > 0) {
    items.push(
      toNotification({
        id: "staff-today-visits",
        title: "Today's field queue is active",
        body: `${pluralize(todayVisits.length, "visit")} is scheduled for today across home and office service execution.`,
        href: "/staff/assignments",
        group: "Execution",
        tone: "warning",
        kind: "execution",
        actionLabel: "Open assignments",
        createdAt: cleanText(todayVisits[0]?.pickup_date) || now,
      })
    );
  }

  if (recurring.length > 0) {
    items.push(
      toNotification({
        id: "staff-recurring-plans",
        title: "Recurring service plans are in the live queue",
        body: `${pluralize(recurring.length, "recurring plan")} is currently part of the staff execution workload.`,
        href: "/staff/history",
        group: "Planning",
        tone: "info",
        kind: "execution",
        actionLabel: "Review cadence",
        createdAt: cleanText(recurring[0]?.pickup_date) || now,
      })
    );
  }

  return items;
}

async function buildNotificationsForRole(role: StaffRole) {
  if (role === "owner") return buildOwnerNotifications();
  if (role === "manager") return buildManagerNotifications();
  if (role === "support") return buildSupportNotifications();
  if (role === "rider") return buildRiderNotifications();
  return buildStaffNotifications();
}

export async function getRoleNotificationCenter(input: {
  role: StaffRole;
  userId: string;
}) {
  const [items, lastReadAt, readItemIds] = await Promise.all([
    buildNotificationsForRole(input.role),
    getLastReadAt(input.userId, input.role),
    getReadNotificationItemIds(input.userId, input.role),
  ]);

  const sorted = [...items].sort(compareNotifications).map((item) => {
    const unreadByTime = lastReadAt
      ? new Date(item.createdAt).getTime() > new Date(lastReadAt).getTime()
      : true;
    const isUnread = unreadByTime && !readItemIds.has(item.id);

    return {
      ...item,
      isUnread,
    } satisfies RoleNotificationItem;
  });

  const unreadCount = sorted.filter((item) => item.isUnread).length;

  return {
    role: input.role,
    unreadCount,
    lastReadAt,
    items: sorted,
  } satisfies RoleNotificationCenter;
}
