import "server-only";

import { getDivisionUrl, getHqUrl } from "@henryco/config";
import { divisionLabel } from "@/lib/format";
import { createStaffAdminSupabase } from "@/lib/supabase/admin";
import type {
  WorkspaceDivision,
  WorkspaceInsight,
  WorkspaceListFilters,
  WorkspaceMetric,
  WorkspaceQueueOption,
  WorkspaceRecord,
  WorkspaceViewer,
} from "@/lib/types";

type JsonRecord = Record<string, unknown>;

type QueryOptions = {
  orderBy?: string;
  ascending?: boolean;
  limit?: number;
};

type BaseDataset = {
  supportThreads: JsonRecord[];
  customerNotifications: JsonRecord[];
  customerActivity: JsonRecord[];
  careBookings: JsonRecord[];
  marketplaceVendorApplications: JsonRecord[];
  marketplaceDisputes: JsonRecord[];
  marketplacePayoutRequests: JsonRecord[];
  marketplaceNotificationQueue: JsonRecord[];
  careNotificationQueue: JsonRecord[];
  customerInvoices: JsonRecord[];
  studioLeads: JsonRecord[];
  studioProjects: JsonRecord[];
  staffAuditLogs: JsonRecord[];
  auditLogs: JsonRecord[];
  customerSecurityLog: JsonRecord[];
};

type WorkspacePageData = {
  metrics: WorkspaceMetric[];
  insights: WorkspaceInsight[];
  records: WorkspaceRecord[];
  queues: WorkspaceQueueOption[];
  focusNote?: string;
  emptyTitle: string;
  emptyDescription: string;
};

type StaffDashboardData = WorkspacePageData & {
  workspaceCards: Array<{
    division: WorkspaceDivision;
    count: number;
  }>;
};

type WorkforceAuthUser = {
  id: string;
  email: string | null;
  created_at: string | null;
  last_sign_in_at: string | null;
  banned_until?: string | null;
  user_metadata?: JsonRecord | null;
  app_metadata?: JsonRecord | null;
};

function toText(value: unknown) {
  return String(value ?? "").trim();
}

function toNullableText(value: unknown) {
  const text = toText(value);
  return text || null;
}

function toNumber(value: unknown) {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number : 0;
}

function toDate(value: unknown) {
  const text = toNullableText(value);
  if (!text) return null;
  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? null : date;
}

function hoursSince(value: unknown) {
  const date = toDate(value);
  if (!date) return Number.POSITIVE_INFINITY;
  return (Date.now() - date.getTime()) / 36e5;
}

function daysSince(value: unknown) {
  const date = toDate(value);
  if (!date) return Number.POSITIVE_INFINITY;
  return (Date.now() - date.getTime()) / 864e5;
}

function formatCurrencyAmount(amountNaira: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amountNaira);
}

function formatCount(value: number) {
  return new Intl.NumberFormat("en-NG", {
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: unknown) {
  const date = toDate(value);
  if (!date) return "Not scheduled";
  return date.toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function normalizeDivision(value: unknown): string | null {
  const division = toText(value).toLowerCase();
  if (!division) return null;
  if (division === "academy" || division === "learning") return "learn";
  return division;
}

function isOpenStatus(value: unknown) {
  const status = toText(value).toLowerCase();
  return !["closed", "resolved", "delivered", "completed", "paid", "cancelled", "rejected"].includes(
    status
  );
}

function isPaymentOpen(value: unknown) {
  const status = toText(value).toLowerCase();
  return !["paid", "settled", "released", "refunded", "waived", "cancelled"].includes(status);
}

function titleCase(value: string) {
  if (!value) return "Unknown";
  return value
    .replaceAll("_", " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function isMissingTableError(error: { message?: string } | null | undefined) {
  const message = String(error?.message || "");
  return (
    message.includes("Could not find the table") ||
    message.includes("relation") ||
    message.includes("does not exist")
  );
}

async function safeSelect(
  table: string,
  admin = createStaffAdminSupabase(),
  options?: QueryOptions
) {
  try {
    let query = admin.from(table).select("*");
    if (options?.orderBy) {
      query = query.order(options.orderBy, { ascending: options.ascending ?? false });
    }
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    const { data, error } = await query;
    if (error) {
      if (isMissingTableError(error)) return [] as JsonRecord[];
      throw error;
    }
    return ((data ?? []) as unknown[]) as JsonRecord[];
  } catch {
    return [] as JsonRecord[];
  }
}

async function loadBaseDataset(): Promise<BaseDataset> {
  const admin = createStaffAdminSupabase();
  const [
    supportThreads,
    customerNotifications,
    customerActivity,
    careBookings,
    marketplaceVendorApplications,
    marketplaceDisputes,
    marketplacePayoutRequests,
    marketplaceNotificationQueue,
    careNotificationQueue,
    customerInvoices,
    studioLeads,
    studioProjects,
    staffAuditLogs,
    auditLogs,
    customerSecurityLog,
  ] = await Promise.all([
    safeSelect("support_threads", admin, { orderBy: "updated_at", limit: 160 }),
    safeSelect("customer_notifications", admin, { orderBy: "created_at", limit: 400 }),
    safeSelect("customer_activity", admin, { orderBy: "created_at", limit: 400 }),
    safeSelect("care_bookings", admin, { orderBy: "updated_at", limit: 180 }),
    safeSelect("marketplace_vendor_applications", admin, {
      orderBy: "submitted_at",
      limit: 80,
    }),
    safeSelect("marketplace_disputes", admin, { orderBy: "updated_at", limit: 80 }),
    safeSelect("marketplace_payout_requests", admin, { orderBy: "updated_at", limit: 80 }),
    safeSelect("marketplace_notification_queue", admin, {
      orderBy: "updated_at",
      limit: 120,
    }),
    safeSelect("care_notification_queue", admin, { orderBy: "created_at", limit: 120 }),
    safeSelect("customer_invoices", admin, { orderBy: "created_at", limit: 120 }),
    safeSelect("studio_leads", admin, { orderBy: "updated_at", limit: 80 }),
    safeSelect("studio_projects", admin, { orderBy: "updated_at", limit: 80 }),
    safeSelect("staff_audit_logs", admin, { orderBy: "created_at", limit: 200 }),
    safeSelect("audit_logs", admin, { orderBy: "created_at", limit: 220 }),
    safeSelect("customer_security_log", admin, { orderBy: "created_at", limit: 160 }),
  ]);

  return {
    supportThreads,
    customerNotifications,
    customerActivity,
    careBookings,
    marketplaceVendorApplications,
    marketplaceDisputes,
    marketplacePayoutRequests,
    marketplaceNotificationQueue,
    careNotificationQueue,
    customerInvoices,
    studioLeads,
    studioProjects,
    staffAuditLogs,
    auditLogs,
    customerSecurityLog,
  };
}

function canAccessDivision(viewer: WorkspaceViewer, division: string | null) {
  if (!division || ["account", "shared", "wallet", "cross"].includes(division)) {
    return true;
  }
  return viewer.divisions.some((item) => item.division === division);
}

function getVisibleDivisions(viewer: WorkspaceViewer) {
  return new Set(viewer.divisions.map((item) => item.division));
}

function makeAction(
  label: string,
  href: string,
  tone: WorkspaceRecord["actions"][number]["tone"] = "secondary"
) {
  return {
    label,
    href,
    tone,
    external: /^https?:\/\//i.test(href),
  } satisfies WorkspaceRecord["actions"][number];
}

function makeRecord(input: Omit<WorkspaceRecord, "notes" | "evidence" | "details" | "actions"> & {
  notes?: string[];
  evidence?: string[];
  details?: WorkspaceRecord["details"];
  actions?: WorkspaceRecord["actions"];
}) {
  return {
    ...input,
    notes: input.notes ?? [],
    evidence: input.evidence ?? [],
    details: input.details ?? [],
    actions: input.actions ?? [],
  } satisfies WorkspaceRecord;
}

function summarizeQueueOptions(records: WorkspaceRecord[]) {
  const counts = new Map<string, { label: string; count: number }>();
  for (const record of records) {
    const existing = counts.get(record.queue) ?? { label: record.queueLabel, count: 0 };
    existing.count += 1;
    counts.set(record.queue, existing);
  }

  return [
    {
      value: "all",
      label: "All queues",
      count: records.length,
    },
    ...[...counts.entries()]
      .map(([value, entry]) => ({
        value,
        label: entry.label,
        count: entry.count,
      }))
      .sort((left, right) => right.count - left.count),
  ] satisfies WorkspaceQueueOption[];
}

export function parseWorkspaceFilters(
  searchParams?:
    | Promise<Record<string, string | string[] | undefined>>
    | Record<string, string | string[] | undefined>
) {
  const read = (value: string | string[] | undefined) =>
    Array.isArray(value) ? value[0] ?? "" : value ?? "";

  return Promise.resolve(searchParams ?? {}).then((params) => ({
    q: toText(read(params.q)),
    queue: toText(read(params.queue)) || "all",
    record: toText(read(params.record)),
  }));
}

export function filterWorkspaceRecords(records: WorkspaceRecord[], filters: WorkspaceListFilters) {
  const query = filters.q.toLowerCase();

  return records.filter((record) => {
    if (filters.queue !== "all" && record.queue !== filters.queue) {
      return false;
    }

    if (!query) {
      return true;
    }

    return [
      record.title,
      record.summary,
      record.queueLabel,
      record.statusLabel,
      record.priorityLabel,
      record.division,
      record.ownerLabel,
      record.amountLabel,
      record.sourceLabel,
      ...record.evidence,
      ...record.notes,
      ...record.details.map((detail) => `${detail.label} ${detail.value} ${detail.note || ""}`),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(query);
  });
}

function firstSelectedRecord(records: WorkspaceRecord[], requestedId: string) {
  return records.find((record) => record.id === requestedId)?.id ?? records[0]?.id ?? "";
}

function supportRecordsForDivision(
  dataset: BaseDataset,
  viewer: WorkspaceViewer,
  division: WorkspaceDivision
) {
  return dataset.supportThreads
    .filter((thread) => normalizeDivision(thread.division) === division)
    .filter(() => canAccessDivision(viewer, division))
    .filter((thread) => isOpenStatus(thread.status))
    .sort((left, right) => hoursSince(right.updated_at) - hoursSince(left.updated_at))
    .map((thread) => {
      const threadId = toText(thread.id);
      const stale = hoursSince(thread.updated_at) >= 12;
      const priority = toText(thread.priority).toLowerCase();
      const statusLabel = titleCase(toText(thread.status) || "open");
      const supportHref = `/support?division=${division}&thread=${encodeURIComponent(threadId)}`;
      return makeRecord({
        id: `support:${threadId}`,
        division,
        queue: "support-escalations",
        queueLabel: "Support escalations",
        title: toText(thread.subject) || `${divisionLabel(division)} support thread`,
        summary: `${titleCase(toText(thread.category) || "general")} conversation still needs operator movement.`,
        statusLabel,
        statusTone: stale ? "warning" : "info",
        priorityLabel: priority === "urgent" || priority === "high" ? "Escalated" : "Open",
        priorityTone: priority === "urgent" ? "critical" : priority === "high" ? "warning" : "info",
        updatedAt: toNullableText(thread.updated_at),
        ownerLabel: toNullableText(thread.assigned_to) ? "Assigned" : "Unassigned",
        sourceLabel: "Staff support desk",
        sourceHref: supportHref,
        evidence: [
          `${statusLabel} thread`,
          stale ? "No movement for 12+ hours." : "Recently active support conversation.",
        ],
        notes: [
          "Reply, assign, escalate, and resolve actions stay inside the shared staff support desk.",
        ],
        details: [
          { label: "Division", value: divisionLabel(division) },
          { label: "Category", value: titleCase(toText(thread.category) || "general") },
          { label: "Thread status", value: statusLabel, note: `Updated ${formatDate(thread.updated_at)}` },
          {
            label: "Assignee",
            value: toNullableText(thread.assigned_to) ? "Assigned" : "Unassigned",
            note: stale ? "SLA is now at risk." : "Conversation is still within the active window.",
          },
        ],
        actions: [
          makeAction("Open thread detail", supportHref, "primary"),
          makeAction(
            "Open division support surface",
            `${getDivisionUrl(division)}/support`,
            "secondary"
          ),
        ],
      });
    });
}

function careRecords(dataset: BaseDataset, viewer: WorkspaceViewer) {
  const division = "care";
  const careUrl = getDivisionUrl(division);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const bookingRecords = dataset.careBookings
    .filter(() => canAccessDivision(viewer, division))
    .filter((booking) => isOpenStatus(booking.status) || toNumber(booking.balance_due) > 0)
    .map((booking) => {
      const pickupDate = toDate(booking.pickup_date);
      if (pickupDate) pickupDate.setHours(0, 0, 0, 0);
      const overdue = Boolean(pickupDate && pickupDate.getTime() < today.getTime() && isOpenStatus(booking.status));
      const balanceDue = toNumber(booking.balance_due);
      const paymentOpen = balanceDue > 0 && isPaymentOpen(booking.payment_status);
      const priorityTone = overdue ? "critical" : paymentOpen ? "warning" : "info";
      const queue = overdue ? "overdue-bookings" : paymentOpen ? "payment-recovery" : "booking-control";
      const trackingCode = toText(booking.tracking_code) || toText(booking.id);
      return makeRecord({
        id: `care-booking:${toText(booking.id)}`,
        division,
        queue,
        queueLabel:
          queue === "overdue-bookings"
            ? "Overdue bookings"
            : queue === "payment-recovery"
              ? "Payment recovery"
              : "Booking control",
        title: `${toText(booking.customer_name) || "Care customer"} · ${trackingCode}`,
        summary: `${toText(booking.service_type) || "Care booking"} scheduled for ${formatDate(
          booking.pickup_date
        )}.`,
        statusLabel: titleCase(toText(booking.status) || "open"),
        statusTone: overdue ? "critical" : paymentOpen ? "warning" : "info",
        priorityLabel: overdue ? "Overdue" : paymentOpen ? "Payment due" : "Active",
        priorityTone,
        updatedAt: toNullableText(booking.updated_at || booking.created_at),
        ownerLabel: toText(booking.payment_status) ? titleCase(toText(booking.payment_status)) : null,
        amountLabel: balanceDue > 0 ? `Balance ${formatCurrencyAmount(balanceDue)}` : null,
        sourceLabel: "HenryCare booking rail",
        sourceHref: `${careUrl}/owner/bookings?booking=${encodeURIComponent(trackingCode)}`,
        evidence: [
          `${titleCase(toText(booking.status) || "open")} booking`,
          `Pickup ${formatDate(booking.pickup_date)}`,
          paymentOpen ? `${formatCurrencyAmount(balanceDue)} is still outstanding.` : "Payment is not blocking the workflow right now.",
        ],
        notes: [
          overdue
            ? "Owner oversight and manager intake control should move this booking immediately."
            : "Use the owner booking rail for status truth and the manager lane for day-of-service control.",
        ],
        details: [
          { label: "Tracking code", value: trackingCode },
          {
            label: "Pickup window",
            value: formatDate(booking.pickup_date),
            note: toText(booking.pickup_slot) || "Slot not recorded",
          },
          {
            label: "Payment",
            value: titleCase(toText(booking.payment_status) || "unpaid"),
            note:
              balanceDue > 0
                ? `Outstanding ${formatCurrencyAmount(balanceDue)}`
                : "No open balance on the record.",
          },
          {
            label: "Customer",
            value: toText(booking.customer_name) || "Care customer",
            note: toText(booking.phone || booking.email) || "No customer contact saved",
          },
        ],
        actions: [
          makeAction(
            "Open booking rail",
            `${careUrl}/owner/bookings?booking=${encodeURIComponent(trackingCode)}`,
            "primary"
          ),
          makeAction(
            "Open intake ops",
            `${careUrl}/manager/operations?booking=${encodeURIComponent(trackingCode)}`,
            "secondary"
          ),
          makeAction(
            paymentOpen ? "Open finance lane" : "Open support lane",
            paymentOpen ? `${careUrl}/owner/finance` : `${careUrl}/support/inbox`,
            paymentOpen ? "warning" : "secondary"
          ),
        ],
      });
    });

  return [...bookingRecords, ...supportRecordsForDivision(dataset, viewer, division)].sort(
    (left, right) => hoursSince(left.updatedAt) - hoursSince(right.updatedAt)
  );
}

function marketplaceRecords(dataset: BaseDataset, viewer: WorkspaceViewer) {
  const division = "marketplace";
  const marketplaceUrl = getDivisionUrl(division);

  const applicationRecords = dataset.marketplaceVendorApplications
    .filter(() => canAccessDivision(viewer, division))
    .filter((row) =>
      ["submitted", "review", "pending", "under_review", "changes_requested"].includes(
        toText(row.status).toLowerCase()
      )
    )
    .map((row) =>
      makeRecord({
        id: `marketplace-application:${toText(row.id)}`,
        division,
        queue: "vendor-review",
        queueLabel: "Vendor review",
        title: toText(row.store_name || row.proposed_store_slug) || "Marketplace seller application",
        summary: `${toText(row.category_focus) || "Marketplace seller"} is still waiting for onboarding review.`,
        statusLabel: titleCase(toText(row.status) || "submitted"),
        statusTone: "warning",
        priorityLabel: "Needs decision",
        priorityTone: "warning",
        updatedAt: toNullableText(row.updated_at || row.submitted_at || row.created_at),
        ownerLabel: toNullableText(row.reviewed_by) ? "Under review" : "Unassigned",
        sourceLabel: "Marketplace seller applications",
        sourceHref: `${marketplaceUrl}/admin/seller-applications`,
        evidence: [
          `Submitted ${formatDate(row.submitted_at || row.created_at)}`,
          toText(row.legal_name) || "Legal entity still needs staff review.",
        ],
        notes: [
          toNullableText(row.review_note) || "Use the seller applications lane to approve, reject, or request changes.",
        ],
        details: [
          { label: "Store name", value: toText(row.store_name || row.proposed_store_slug) || "Pending" },
          { label: "Review state", value: titleCase(toText(row.status) || "submitted") },
          { label: "Category focus", value: toText(row.category_focus) || "Not supplied" },
          {
            label: "Contact",
            value: toText(row.normalized_email || row.contact_phone) || "No seller contact saved",
            note: toText(row.contact_phone) || null,
          },
        ],
        actions: [
          makeAction("Open seller review", `${marketplaceUrl}/admin/seller-applications`, "primary"),
          makeAction("Open moderation queue", `${marketplaceUrl}/moderation`, "secondary"),
        ],
      })
    );

  const disputeRecords = dataset.marketplaceDisputes
    .filter(() => canAccessDivision(viewer, division))
    .filter((row) => isOpenStatus(row.status))
    .map((row) =>
      makeRecord({
        id: `marketplace-dispute:${toText(row.id)}`,
        division,
        queue: "disputes",
        queueLabel: "Disputes",
        title: toText(row.dispute_no) || "Marketplace dispute",
        summary: toText(row.reason) || "Marketplace support dispute still needs resolution.",
        statusLabel: titleCase(toText(row.status) || "investigating"),
        statusTone: "critical",
        priorityLabel: toNullableText(row.refund_amount) ? "Refund risk" : "Open dispute",
        priorityTone: toNullableText(row.refund_amount) ? "critical" : "warning",
        updatedAt: toNullableText(row.updated_at || row.created_at),
        ownerLabel: toNullableText(row.assigned_to) ? "Assigned" : "Unassigned",
        amountLabel:
          toNumber(row.refund_amount) > 0
            ? `Refund ${formatCurrencyAmount(toNumber(row.refund_amount))}`
            : null,
        sourceLabel: "Marketplace dispute desk",
        sourceHref: `${marketplaceUrl}/support/disputes`,
        evidence: [
          `Order ${toText(row.order_no) || "pending lookup"}`,
          toNullableText(row.resolution_type)
            ? `Resolution path: ${titleCase(toText(row.resolution_type))}`
            : "Resolution path is not set yet.",
        ],
        notes: [
          toNullableText(row.details) || "Support and finance should align before closing a payout-affecting dispute.",
        ],
        details: [
          { label: "Dispute", value: toText(row.dispute_no) || "Marketplace dispute" },
          { label: "Order", value: toText(row.order_no) || "Pending order lookup" },
          {
            label: "Resolution path",
            value: titleCase(toText(row.resolution_type) || "manual_review"),
            note: toNullableText(row.assigned_to) ? "An assignee is already attached." : "Nobody owns the dispute yet.",
          },
          {
            label: "Opened by",
            value: toText(row.normalized_email) || "Buyer email not captured",
            note: toText(row.reason) || null,
          },
        ],
        actions: [
          makeAction("Open dispute queue", `${marketplaceUrl}/support/disputes`, "primary"),
          makeAction("Open finance payouts", `${marketplaceUrl}/finance/payouts`, "warning"),
        ],
      })
    );

  const payoutRecords = dataset.marketplacePayoutRequests
    .filter(() => canAccessDivision(viewer, division))
    .filter((row) =>
      ["requested", "review", "pending", "frozen"].includes(toText(row.status).toLowerCase())
    )
    .map((row) =>
      makeRecord({
        id: `marketplace-payout:${toText(row.id)}`,
        division,
        queue: "marketplace-payouts",
        queueLabel: "Marketplace payouts",
        title: toText(row.reference) || "Marketplace payout",
        summary: "Seller payout is still waiting for finance release or review.",
        statusLabel: titleCase(toText(row.status) || "requested"),
        statusTone: "warning",
        priorityLabel: "Finance hold",
        priorityTone: "warning",
        updatedAt: toNullableText(row.updated_at || row.created_at),
        amountLabel: formatCurrencyAmount(toNumber(row.amount)),
        sourceLabel: "Marketplace payouts",
        sourceHref: `${marketplaceUrl}/finance/payouts`,
        evidence: [
          `Requested ${formatDate(row.created_at)}`,
          toNullableText(row.review_note) || "No finance note has been left yet.",
        ],
        notes: [
          "Use the payout lane to approve, release, freeze, or reject the transfer with an audit note.",
        ],
        details: [
          { label: "Reference", value: toText(row.reference) || "Marketplace payout" },
          { label: "Amount", value: formatCurrencyAmount(toNumber(row.amount)) },
          {
            label: "Review note",
            value: toNullableText(row.review_note) || "No note yet",
            note: toNullableText(row.reviewed_at) ? `Reviewed ${formatDate(row.reviewed_at)}` : "No review time recorded",
          },
        ],
        actions: [
          makeAction("Open payout review", `${marketplaceUrl}/finance/payouts`, "primary"),
          makeAction("Open finance audit", `${marketplaceUrl}/finance/audit`, "secondary"),
        ],
      })
    );

  const queueFailureRecords = dataset.marketplaceNotificationQueue
    .filter(() => canAccessDivision(viewer, division))
    .filter((row) =>
      ["failed", "skipped"].includes(toText(row.status).toLowerCase())
    )
    .slice(0, 6)
    .map((row) =>
      makeRecord({
        id: `marketplace-notification:${toText(row.id)}`,
        division,
        queue: "delivery-failures",
        queueLabel: "Delivery failures",
        title: toText(row.subject || row.template_key) || "Marketplace notification failure",
        summary:
          toText(row.last_error || row.skipped_reason) ||
          "Marketplace notification delivery failed and needs operator attention.",
        statusLabel: titleCase(toText(row.status) || "failed"),
        statusTone: "critical",
        priorityLabel: "Provider failure",
        priorityTone: "critical",
        updatedAt: toNullableText(row.updated_at || row.created_at),
        ownerLabel: toText(row.channel) || null,
        sourceLabel: "Marketplace notification queue",
        sourceHref: `${marketplaceUrl}/operations/notifications`,
        evidence: [
          `Template ${toText(row.template_key) || "unknown"}`,
          `Attempts ${formatCount(toNumber(row.delivery_attempts))}`,
        ],
        notes: [
          toNullableText(row.last_error || row.skipped_reason) ||
            "Open the notification queue for provider diagnostics and retry posture.",
        ],
        details: [
          { label: "Channel", value: titleCase(toText(row.channel) || "notification") },
          { label: "Recipient", value: toText(row.recipient) || "Unknown recipient" },
          {
            label: "Provider",
            value: toText(row.provider) || "No provider saved",
            note: toNullableText(row.last_attempted_at) ? `Last attempt ${formatDate(row.last_attempted_at)}` : null,
          },
        ],
        actions: [
          makeAction("Open notification queue", `${marketplaceUrl}/operations/notifications`, "primary"),
          makeAction("Open email logs", `${marketplaceUrl}/admin/email-logs`, "secondary"),
        ],
      })
    );

  return [...applicationRecords, ...disputeRecords, ...payoutRecords, ...queueFailureRecords];
}

function studioRecords(dataset: BaseDataset, viewer: WorkspaceViewer) {
  const division = "studio";
  const studioUrl = getDivisionUrl(division);

  const projectRecords = dataset.studioProjects
    .filter(() => canAccessDivision(viewer, division))
    .filter((row) => !["completed", "delivered", "archived"].includes(toText(row.status).toLowerCase()))
    .map((row) =>
      makeRecord({
        id: `studio-project:${toText(row.id)}`,
        division,
        queue: "project-delivery",
        queueLabel: "Project delivery",
        title: toText(row.title) || "Studio project",
        summary: toNullableText(row.description) || "Project delivery still needs active management.",
        statusLabel: titleCase(toText(row.status) || "active"),
        statusTone: ["blocked", "at_risk"].includes(toText(row.status).toLowerCase()) ? "critical" : "info",
        priorityLabel:
          toText(row.status).toLowerCase() === "blocked" ? "Blocked" : "Active project",
        priorityTone:
          toText(row.status).toLowerCase() === "blocked" ? "critical" : "info",
        updatedAt: toNullableText(row.updated_at || row.created_at),
        amountLabel:
          toNumber(row.budget_kobo) > 0
            ? formatCurrencyAmount(toNumber(row.budget_kobo) / 100)
            : null,
        sourceLabel: "Studio project workspace",
        sourceHref: `${studioUrl}/project/${encodeURIComponent(toText(row.id))}`,
        evidence: [
          toNullableText((row.metadata as JsonRecord | null)?.next_action) ||
            "Project next action is not documented in metadata yet.",
        ],
        notes: [
          "Project, milestone, deliverable, and client communication actions stay inside the studio project workspace.",
        ],
        details: [
          { label: "Project", value: toText(row.title) || "Studio project" },
          {
            label: "Status",
            value: titleCase(toText(row.status) || "active"),
            note: `Updated ${formatDate(row.updated_at || row.created_at)}`,
          },
          {
            label: "Budget",
            value:
              toNumber(row.budget_kobo) > 0
                ? formatCurrencyAmount(toNumber(row.budget_kobo) / 100)
                : "Not recorded",
            note: toNullableText((row.metadata as JsonRecord | null)?.confidence)
              ? `Confidence ${toText((row.metadata as JsonRecord | null)?.confidence)}`
              : null,
          },
        ],
        actions: [
          makeAction(
            "Open project workspace",
            `${studioUrl}/project/${encodeURIComponent(toText(row.id))}`,
            "primary"
          ),
          makeAction("Open PM board", `${studioUrl}/pm/projects`, "secondary"),
        ],
      })
    );

  const leadRecords = dataset.studioLeads
    .filter(() => canAccessDivision(viewer, division))
    .filter((row) => !["won", "lost", "archived"].includes(toText(row.status).toLowerCase()))
    .map((row) =>
      makeRecord({
        id: `studio-lead:${toText(row.id)}`,
        division,
        queue: "lead-qualification",
        queueLabel: "Lead qualification",
        title: toText(row.full_name || row.normalized_email) || "Studio lead",
        summary:
          toNullableText(row.description) ||
          `${toText(row.service_type) || "Studio inquiry"} still needs qualification.`,
        statusLabel: titleCase(toText(row.status) || "new"),
        statusTone: "warning",
        priorityLabel: "Lead decision",
        priorityTone: "warning",
        updatedAt: toNullableText(row.updated_at || row.created_at),
        sourceLabel: "Studio sales leads",
        sourceHref: `${studioUrl}/sales/leads`,
        evidence: [
          toNullableText((row.metadata as JsonRecord | null)?.budget_band) ||
            "Budget band is not stored yet.",
        ],
        notes: [
          "Lead status changes and proposal generation stay inside the studio sales workspace.",
        ],
        details: [
          { label: "Lead", value: toText(row.full_name || row.normalized_email) || "Studio lead" },
          {
            label: "Service type",
            value: toText(row.service_type) || "Not supplied",
            note: toText(row.phone || row.email) || "No direct lead contact saved",
          },
          {
            label: "Status",
            value: titleCase(toText(row.status) || "new"),
            note: `Updated ${formatDate(row.updated_at || row.created_at)}`,
          },
        ],
        actions: [
          makeAction("Open lead queue", `${studioUrl}/sales/leads`, "primary"),
          makeAction("Open proposal board", `${studioUrl}/sales/proposals`, "secondary"),
        ],
      })
    );

  const depositRecords = dataset.customerActivity
    .filter((row) => normalizeDivision(row.division) === division)
    .filter(() => canAccessDivision(viewer, division))
    .filter((row) =>
      ["requested", "pending_deposit", "awaiting_deposit"].includes(
        toText(row.status).toLowerCase()
      )
    )
    .slice(0, 8)
    .map((row) =>
      makeRecord({
        id: `studio-deposit:${toText(row.id)}`,
        division,
        queue: "deposit-control",
        queueLabel: "Deposit control",
        title: toText(row.title) || "Studio deposit review",
        summary:
          toText(row.description || row.body) ||
          "Commercial deposit confirmation is still blocking studio delivery or kickoff.",
        statusLabel: titleCase(toText(row.status) || "pending_deposit"),
        statusTone: "warning",
        priorityLabel: "Commercial hold",
        priorityTone: "warning",
        updatedAt: toNullableText(row.created_at),
        amountLabel:
          toNumber(row.amount_kobo) > 0
            ? formatCurrencyAmount(toNumber(row.amount_kobo) / 100)
            : null,
        sourceLabel: "Studio commercial pipeline",
        sourceHref: `${studioUrl}/finance/invoices`,
        evidence: [
          `Reference ${toText(row.reference_type) || "studio_activity"}`,
          toText(row.reference_id) || "No reference id saved",
        ],
        notes: [
          "Use the studio finance lane to confirm deposits before project work advances on assumption instead of payment truth.",
        ],
        details: [
          { label: "Commercial item", value: toText(row.title) || "Studio deposit review" },
          {
            label: "Status",
            value: titleCase(toText(row.status) || "pending_deposit"),
            note: `Created ${formatDate(row.created_at)}`,
          },
          {
            label: "Reference",
            value: titleCase(toText(row.reference_type) || "studio_activity"),
            note: toText(row.reference_id) || "No reference id saved",
          },
        ],
        actions: [
          makeAction("Open finance invoices", `${studioUrl}/finance/invoices`, "primary"),
          makeAction("Open lead queue", `${studioUrl}/sales/leads`, "secondary"),
        ],
      })
    );

  const notificationRecords = dataset.customerNotifications
    .filter((row) => normalizeDivision(row.division) === division)
    .filter(() => canAccessDivision(viewer, division))
    .filter(
      (row) =>
        toText(row.priority).toLowerCase() === "high" ||
        /quota|failed/i.test(`${toText(row.title)} ${toText(row.body)}`)
    )
    .slice(0, 8)
    .map((row) =>
      makeRecord({
        id: `studio-notification:${toText(row.id)}`,
        division,
        queue: "payment-failures",
        queueLabel: "Payment and delivery failures",
        title: toText(row.title) || "Studio alert",
        summary: toText(row.body) || "Studio delivery or payment communication failed.",
        statusLabel: Boolean(row.is_read) ? "Seen" : "Unread",
        statusTone: Boolean(row.is_read) ? "info" : "critical",
        priorityLabel: titleCase(toText(row.priority) || "normal"),
        priorityTone: Boolean(row.is_read) ? "warning" : "critical",
        updatedAt: toNullableText(row.created_at),
        sourceLabel: "Studio finance and support surfaces",
        sourceHref: `${studioUrl}/finance/invoices`,
        evidence: [
          `Reference ${toText(row.reference_type) || "studio_notification"}`,
          Boolean(row.is_read) ? "An operator has already seen this alert." : "This alert is still unread.",
        ],
        notes: [
          "Email quota failures and payment reminders should be cleared before client trust erodes.",
        ],
        details: [
          { label: "Alert", value: toText(row.title) || "Studio alert" },
          { label: "Priority", value: titleCase(toText(row.priority) || "normal") },
          {
            label: "Read state",
            value: Boolean(row.is_read) ? "Read" : "Unread",
            note: `Created ${formatDate(row.created_at)}`,
          },
        ],
        actions: [
          makeAction("Open finance invoices", `${studioUrl}/finance/invoices`, "warning"),
          makeAction("Open support desk", `${studioUrl}/support`, "secondary"),
        ],
      })
    );

  return [...projectRecords, ...leadRecords, ...depositRecords, ...notificationRecords];
}

function jobsRecords(dataset: BaseDataset, viewer: WorkspaceViewer) {
  const division = "jobs";
  const jobsUrl = getDivisionUrl(division);

  const supportRecords = supportRecordsForDivision(dataset, viewer, division);
  const emailFailures = dataset.auditLogs.filter((row) => toText(row.action) === "jobs_email_failed");
  const unreadAlerts = dataset.customerNotifications.filter(
    (row) => normalizeDivision(row.division) === division && !Boolean(row.is_read)
  );

  const aggregateRecords: WorkspaceRecord[] = [];

  if (emailFailures.length > 0) {
    const latest = emailFailures[0] ?? {};
    aggregateRecords.push(
      makeRecord({
        id: "jobs-email-failures",
        division,
        queue: "delivery-failures",
        queueLabel: "Delivery failures",
        title: "Jobs alert delivery quota is failing",
        summary: `${emailFailures.length} jobs alert send attempts failed in the recent audit window.`,
        statusLabel: "Failed",
        statusTone: "critical",
        priorityLabel: "Immediate fix",
        priorityTone: "critical",
        updatedAt: toNullableText(latest.created_at),
        sourceLabel: "Jobs recruiter and moderation lanes",
        sourceHref: `${jobsUrl}/recruiter/pipeline`,
        evidence: [
          toText(latest.reason) || "Recent jobs alert sends are failing.",
          `${formatCount(unreadAlerts.length)} unread jobs alerts are now piling up behind delivery failures.`,
        ],
        notes: [
          "This is deterministic queue neglect: the alert system is generating events faster than delivery can clear them.",
        ],
        details: [
          { label: "Failed alerts", value: formatCount(emailFailures.length) },
          { label: "Unread jobs notifications", value: formatCount(unreadAlerts.length) },
          {
            label: "Latest reason",
            value: toText(latest.reason) || "No provider reason recorded",
            note: `Latest event ${formatDate(latest.created_at)}`,
          },
        ],
        actions: [
          makeAction("Open recruiter pipeline", `${jobsUrl}/recruiter/pipeline`, "primary"),
          makeAction("Open moderation queue", `${jobsUrl}/moderation`, "secondary"),
        ],
      })
    );
  }

  if (unreadAlerts.length > 0) {
    aggregateRecords.push(
      makeRecord({
        id: "jobs-alert-backlog",
        division,
        queue: "unread-alerts",
        queueLabel: "Unread alerts",
        title: "Jobs operational alerts are unread",
        summary: `${unreadAlerts.length} jobs notifications remain unread, which weakens moderation and recruiter responsiveness.`,
        statusLabel: "Unread",
        statusTone: unreadAlerts.length >= 25 ? "critical" : "warning",
        priorityLabel: unreadAlerts.length >= 25 ? "Queue neglect" : "Review backlog",
        priorityTone: unreadAlerts.length >= 25 ? "critical" : "warning",
        updatedAt: toNullableText(unreadAlerts[0]?.created_at),
        sourceLabel: "Jobs recruiter pipeline",
        sourceHref: `${jobsUrl}/recruiter/pipeline`,
        evidence: [
          `Latest alert: ${toText(unreadAlerts[0]?.title) || "Jobs alert"}`,
          "Unread alerts are usually a downstream symptom of delivery or moderation friction.",
        ],
        notes: [
          "Prioritize the recruiter pipeline and moderation queue until the alert backlog drops.",
        ],
        details: [
          { label: "Unread alerts", value: formatCount(unreadAlerts.length) },
          {
            label: "Reference type",
            value: titleCase(toText(unreadAlerts[0]?.reference_type) || "jobs_alert"),
            note: `Latest alert ${formatDate(unreadAlerts[0]?.created_at)}`,
          },
        ],
        actions: [
          makeAction("Open recruiter pipeline", `${jobsUrl}/recruiter/pipeline`, "primary"),
          makeAction("Open candidate review", `${jobsUrl}/recruiter/candidates`, "secondary"),
        ],
      })
    );
  }

  return [...aggregateRecords, ...supportRecords];
}

function learnRecords(dataset: BaseDataset, viewer: WorkspaceViewer) {
  const division = "learn";
  const learnUrl = getDivisionUrl(division);

  const invoiceRecords = dataset.customerInvoices
    .filter((row) => normalizeDivision(row.division) === division)
    .filter((row) => ["pending", "overdue"].includes(toText(row.status).toLowerCase()))
    .map((row) =>
      makeRecord({
        id: `learn-invoice:${toText(row.id)}`,
        division,
        queue: "pending-invoices",
        queueLabel: "Pending invoices",
        title: toText(row.invoice_no) || "Learn invoice",
        summary: toText(row.description) || "Academy invoice is still unpaid or unresolved.",
        statusLabel: titleCase(toText(row.status) || "pending"),
        statusTone: toText(row.status).toLowerCase() === "overdue" ? "critical" : "warning",
        priorityLabel: toText(row.status).toLowerCase() === "overdue" ? "Overdue" : "Awaiting payment",
        priorityTone: toText(row.status).toLowerCase() === "overdue" ? "critical" : "warning",
        updatedAt: toNullableText(row.paid_at || row.created_at),
        amountLabel: formatCurrencyAmount(toNumber(row.total_kobo) / 100),
        sourceLabel: "Learn owner workspace",
        sourceHref: `${learnUrl}/owner`,
        evidence: [
          `Reference ${toText(row.reference_type) || "learn record"}`,
          `Due ${formatDate(row.due_date || row.created_at)}`,
        ],
        notes: [
          "Invoice resolution is still routed through the owner and learner support surfaces in Learn.",
        ],
        details: [
          { label: "Invoice", value: toText(row.invoice_no) || "Learn invoice" },
          { label: "Amount", value: formatCurrencyAmount(toNumber(row.total_kobo) / 100) },
          {
            label: "Reference",
            value: titleCase(toText(row.reference_type) || "learn_enrollment"),
            note: toText(row.reference_id) || "No reference id saved",
          },
        ],
        actions: [
          makeAction("Open owner workspace", `${learnUrl}/owner`, "primary"),
          makeAction("Open learner support", `${learnUrl}/support`, "secondary"),
        ],
      })
    );

  const instructorReviewRecords = dataset.customerNotifications
    .filter((row) => normalizeDivision(row.division) === division)
    .filter((row) => toText(row.reference_type) === "learn_teacher_application")
    .map((row) =>
      makeRecord({
        id: `learn-instructor:${toText(row.id)}`,
        division,
        queue: "instructor-review",
        queueLabel: "Instructor review",
        title: toText(row.title) || "Instructor application update",
        summary: toText(row.body) || "Instructor onboarding is still moving through review.",
        statusLabel: Boolean(row.is_read) ? "Seen" : "Unread",
        statusTone: Boolean(row.is_read) ? "info" : "warning",
        priorityLabel: "Teaching workflow",
        priorityTone: "warning",
        updatedAt: toNullableText(row.created_at),
        sourceLabel: "Learn instructor approvals",
        sourceHref: `${learnUrl}/owner/instructors`,
        evidence: [
          `Reference ${toText(row.reference_id) || "teacher application"}`,
          Boolean(row.is_read) ? "Someone has opened the notification." : "No read receipt yet.",
        ],
        notes: [
          "Approvals, change requests, and payout model decisions stay inside the instructor approvals surface.",
        ],
        details: [
          { label: "Notification", value: toText(row.title) || "Instructor application update" },
          {
            label: "Read state",
            value: Boolean(row.is_read) ? "Read" : "Unread",
            note: `Created ${formatDate(row.created_at)}`,
          },
        ],
        actions: [
          makeAction("Open instructor approvals", `${learnUrl}/owner/instructors`, "primary"),
          makeAction("Open academy owner", `${learnUrl}/owner`, "secondary"),
        ],
      })
    );

  return [...invoiceRecords, ...instructorReviewRecords, ...supportRecordsForDivision(dataset, viewer, division)];
}

function propertyRecords(dataset: BaseDataset, viewer: WorkspaceViewer) {
  const division = "property";
  const propertyUrl = getDivisionUrl(division);

  const eventRows = [
    ...dataset.customerNotifications.filter((row) => normalizeDivision(row.division) === division),
    ...dataset.customerActivity.filter((row) => normalizeDivision(row.division) === division),
  ];

  const queueRecords = eventRows.slice(0, 10).map((row) => {
    const referenceType = toText(row.reference_type || "property");
    const listing = referenceType === "property_listing";
    return makeRecord({
      id: `property-event:${toText(row.id)}`,
      division,
      queue: listing ? "listing-review" : "inquiries",
      queueLabel: listing ? "Listing review" : "Inquiry handling",
      title: toText(row.title) || "Property operational event",
      summary: toText(row.description || row.body) || "Property workflow still needs staff follow-through.",
      statusLabel: titleCase(toText(row.status) || (Boolean(row.is_read) ? "read" : "open")),
      statusTone: listing && !Boolean(row.is_read) ? "warning" : "info",
      priorityLabel: titleCase(toText(row.priority) || "active"),
      priorityTone: listing ? "warning" : "info",
      updatedAt: toNullableText(row.created_at),
      sourceLabel: listing ? "Property moderation" : "Property operations",
      sourceHref: listing ? `${propertyUrl}/moderation` : `${propertyUrl}/operations`,
      evidence: [
        `Reference ${referenceType}`,
        toText(row.action_url) || "Customer-side action url not provided.",
      ],
      notes: [
        listing
          ? "Listing approval and trust enforcement live in the moderation route."
          : "Inquiry handling and viewing coordination live in the operations route.",
      ],
      details: [
        { label: "Reference", value: titleCase(referenceType) },
        {
          label: "Status",
          value: titleCase(toText(row.status) || (Boolean(row.is_read) ? "read" : "open")),
          note: `Created ${formatDate(row.created_at)}`,
        },
      ],
      actions: [
        makeAction(listing ? "Open moderation" : "Open operations", listing ? `${propertyUrl}/moderation` : `${propertyUrl}/operations`, "primary"),
        makeAction("Open owner view", `${propertyUrl}/owner`, "secondary"),
      ],
    });
  });

  return [...queueRecords, ...supportRecordsForDivision(dataset, viewer, division)];
}

function logisticsRecords(dataset: BaseDataset, viewer: WorkspaceViewer) {
  const division = "logistics";
  const logisticsUrl = getDivisionUrl(division);
  const supportRecords = supportRecordsForDivision(dataset, viewer, division);

  if (supportRecords.length > 0) {
    return supportRecords;
  }

  return [
    makeRecord({
      id: "logistics-dispatch-gap",
      division,
      queue: "dispatch-gaps",
      queueLabel: "Dispatch gaps",
      title: "Dedicated logistics dispatch tooling is still incomplete",
      summary: "There is no live dispatch backoffice table or queue in this environment yet, so staff should work from support and customer-facing tracking routes.",
      statusLabel: "Partial readiness",
      statusTone: "warning",
      priorityLabel: "Platform gap",
      priorityTone: "warning",
      updatedAt: null,
      sourceLabel: "Shared logistics fallback routes",
      sourceHref: `${logisticsUrl}/support`,
      evidence: [
        "No logistics shipment queue rows were detected in the current live workspace data slice.",
        "Support and public tracking remain the truthful fallback surfaces today.",
      ],
      notes: [
        "The Supabase handoff documents the missing dispatch queue, audit, and escalation structures for the dedicated logistics pass.",
      ],
      details: [
        { label: "Current fallback", value: "Support desk and public tracking" },
        { label: "Owner visibility", value: "Needs dedicated dispatch telemetry", note: "Documented for the DB/RLS pass." },
      ],
      actions: [
        makeAction("Open shared support", "/support?division=logistics", "primary"),
        makeAction("Open tracking flow", `${logisticsUrl}/track`, "secondary"),
      ],
    }),
  ];
}

function buildUnreadBacklogRecords(dataset: BaseDataset, viewer: WorkspaceViewer) {
  const counts = new Map<string, number>();
  for (const row of dataset.customerNotifications) {
    const division = normalizeDivision(row.division) || "account";
    if (!canAccessDivision(viewer, division)) continue;
    if (!Boolean(row.is_read)) {
      counts.set(division, (counts.get(division) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .filter(([, count]) => count >= 5)
    .map(([division, count]) =>
      makeRecord({
        id: `backlog:${division}`,
        division,
        queue: "queue-neglect",
        queueLabel: "Queue neglect",
        title: `${divisionLabel(division)} unread backlog`,
        summary: `${count} unread customer-facing notifications are still sitting in the queue.`,
        statusLabel: "Backlog",
        statusTone: count >= 20 ? "critical" : "warning",
        priorityLabel: count >= 20 ? "Severe" : "Needs review",
        priorityTone: count >= 20 ? "critical" : "warning",
        updatedAt:
          toNullableText(
            dataset.customerNotifications.find(
              (row) => normalizeDivision(row.division) === division && !Boolean(row.is_read)
            )?.created_at
          ),
        sourceLabel: `${divisionLabel(division)} workspace`,
        sourceHref: division === "account" ? "/support" : `/${division}`,
        evidence: [
          `${count} unread items are still visible in the live notification table.`,
          "Unread counts are deterministic queue-health signals, not vanity cards.",
        ],
        notes: [
          "Open the division workspace and clear the oldest unresolved records first.",
        ],
        details: [
          { label: "Division", value: divisionLabel(division) },
          { label: "Unread items", value: formatCount(count) },
        ],
        actions: [
          makeAction(
            division === "account" ? "Open support desk" : `Open ${divisionLabel(division)} workspace`,
            division === "account" ? "/support" : `/${division}`,
            "primary"
          ),
        ],
      })
    );
}

function buildGovernanceRiskRecords(dataset: BaseDataset) {
  const roleChanges = dataset.staffAuditLogs.filter((row) => toText(row.action) === "staff.update");
  const byActor = new Map<string, JsonRecord[]>();
  for (const row of roleChanges) {
    const actor = toText(row.actor_id) || "unknown";
    const current = byActor.get(actor) ?? [];
    current.push(row);
    byActor.set(actor, current);
  }

  return [...byActor.entries()]
    .filter(([, rows]) => rows.length >= 3)
    .map(([actor, rows]) => {
      const latest = rows[0] ?? {};
      return makeRecord({
        id: `governance:${actor}`,
        division: "shared",
        queue: "governance-risk",
        queueLabel: "Governance risk",
        title: "Repeated staff role changes need oversight",
        summary: `${rows.length} workforce update actions were logged for the same actor in the recent audit window.`,
        statusLabel: "Review needed",
        statusTone: rows.length >= 5 ? "critical" : "warning",
        priorityLabel: rows.length >= 5 ? "Suspicious pattern" : "Governance review",
        priorityTone: rows.length >= 5 ? "critical" : "warning",
        updatedAt: toNullableText(latest.created_at),
        sourceLabel: "Owner staff governance",
        sourceHref: getHqUrl("/owner/staff/roles"),
        evidence: [
          `${rows.length} staff.update actions recorded by the same actor.`,
          "This is a deterministic pattern-based alert, not an inferred model score.",
        ],
        notes: [
          "Open the owner staff roles and audit surfaces to confirm whether these were legitimate batch changes or governance churn.",
        ],
        details: [
          { label: "Actor id", value: actor },
          { label: "Repeated changes", value: formatCount(rows.length) },
          {
            label: "Latest entity",
            value: toText(latest.entity_id) || "No entity id saved",
            note: titleCase(toText(latest.entity) || "staff"),
          },
        ],
        actions: [
          makeAction("Open role governance", getHqUrl("/owner/staff/roles"), "primary"),
          makeAction("Open audit trail", getHqUrl("/owner/settings/audit"), "secondary"),
        ],
      });
    });
}

function buildDeliveryFailureRecords(dataset: BaseDataset) {
  const records: WorkspaceRecord[] = [];
  const careFailures = dataset.careNotificationQueue.filter((row) =>
    ["failed", "queued"].includes(toText(row.status).toLowerCase())
  );
  const marketplaceFailures = dataset.marketplaceNotificationQueue.filter((row) =>
    ["failed", "skipped"].includes(toText(row.status).toLowerCase())
  );
  const jobsFailures = dataset.auditLogs.filter((row) => toText(row.action) === "jobs_email_failed");

  if (careFailures.length > 0) {
    const latest = careFailures[0] ?? {};
    records.push(
      makeRecord({
        id: "care-delivery-failures",
        division: "care",
        queue: "delivery-failures",
        queueLabel: "Delivery failures",
        title: "Care notification delivery needs intervention",
        summary: `${careFailures.length} care notification queue rows are still queued or failed.`,
        statusLabel: titleCase(toText(latest.status) || "queued"),
        statusTone: toText(latest.status).toLowerCase() === "failed" ? "critical" : "warning",
        priorityLabel: "Comms pressure",
        priorityTone: toText(latest.status).toLowerCase() === "failed" ? "critical" : "warning",
        updatedAt: toNullableText(latest.failed_at || latest.sent_at || latest.created_at),
        sourceLabel: "HenryCare notification queue",
        sourceHref: `${getDivisionUrl("care")}/owner/notifications`,
        evidence: [
          `Template ${toText(latest.template_key) || "unknown"}`,
          toNullableText(latest.error_message) || "Provider config is incomplete for some care messages.",
        ],
        notes: [
          "Delivery failures should be fixed at the queue/provider layer instead of being hidden behind summary cards.",
        ],
        details: [
          { label: "Queued or failed rows", value: formatCount(careFailures.length) },
          {
            label: "Latest template",
            value: titleCase(toText(latest.template_key) || "notification"),
            note: toText(latest.subject) || null,
          },
        ],
        actions: [
          makeAction("Open care notifications", `${getDivisionUrl("care")}/owner/notifications`, "primary"),
          makeAction("Open support desk", "/operations?queue=delivery-failures", "secondary"),
        ],
      })
    );
  }

  if (marketplaceFailures.length > 0) {
    const latest = marketplaceFailures[0] ?? {};
    records.push(
      makeRecord({
        id: "marketplace-delivery-failures",
        division: "marketplace",
        queue: "delivery-failures",
        queueLabel: "Delivery failures",
        title: "Marketplace notification retries are failing",
        summary: `${marketplaceFailures.length} marketplace queue rows are failed or skipped.`,
        statusLabel: titleCase(toText(latest.status) || "failed"),
        statusTone: "critical",
        priorityLabel: "Provider failure",
        priorityTone: "critical",
        updatedAt: toNullableText(latest.updated_at || latest.created_at),
        sourceLabel: "Marketplace notification queue",
        sourceHref: `${getDivisionUrl("marketplace")}/operations/notifications`,
        evidence: [
          `Template ${toText(latest.template_key) || "unknown"}`,
          toNullableText(latest.last_error || latest.skipped_reason) ||
            "Retry failures were reported in the marketplace queue.",
        ],
        notes: [
          "A failed queue is an operational incident because staff and customers stop receiving state changes.",
        ],
        details: [
          { label: "Failed or skipped rows", value: formatCount(marketplaceFailures.length) },
          {
            label: "Last error",
            value: toText(latest.last_error || latest.skipped_reason) || "No provider reason saved",
          },
        ],
        actions: [
          makeAction("Open notification queue", `${getDivisionUrl("marketplace")}/operations/notifications`, "primary"),
          makeAction("Open email logs", `${getDivisionUrl("marketplace")}/admin/email-logs`, "secondary"),
        ],
      })
    );
  }

  if (jobsFailures.length > 0) {
    const latest = jobsFailures[0] ?? {};
    records.push(
      makeRecord({
        id: "jobs-delivery-failures",
        division: "jobs",
        queue: "delivery-failures",
        queueLabel: "Delivery failures",
        title: "Jobs alert email quota has been exhausted",
        summary: `${jobsFailures.length} recent jobs alert sends failed in audit logs.`,
        statusLabel: "Failed",
        statusTone: "critical",
        priorityLabel: "Quota breach",
        priorityTone: "critical",
        updatedAt: toNullableText(latest.created_at),
        sourceLabel: "Jobs recruiter pipeline",
        sourceHref: `${getDivisionUrl("jobs")}/recruiter/pipeline`,
        evidence: [
          toText(latest.reason) || "Jobs alert sends are failing.",
          "Quota-driven failures should be treated as a service incident until the queue clears.",
        ],
        notes: [
          "Use the recruiter and moderation surfaces to reconcile any alert-driven work that was missed.",
        ],
        details: [
          { label: "Failed sends", value: formatCount(jobsFailures.length) },
          { label: "Latest reason", value: toText(latest.reason) || "No reason logged" },
        ],
        actions: [
          makeAction("Open recruiter pipeline", `${getDivisionUrl("jobs")}/recruiter/pipeline`, "primary"),
          makeAction("Open jobs workspace", "/jobs?queue=delivery-failures", "secondary"),
        ],
      })
    );
  }

  return records;
}

function buildSystemAuditRecords(dataset: BaseDataset) {
  const recentRoleChanges = dataset.staffAuditLogs.filter((row) => toText(row.action) === "staff.update");
  const recentInvites = dataset.staffAuditLogs.filter((row) => toText(row.action) === "staff.invite");
  const records: WorkspaceRecord[] = [];

  if (recentRoleChanges.length > 0) {
    const latest = recentRoleChanges[0] ?? {};
    records.push(
      makeRecord({
        id: "settings-role-audit",
        division: "shared",
        queue: "audit-watch",
        queueLabel: "Audit watch",
        title: "Recent workforce access changes need audit visibility",
        summary: `${recentRoleChanges.length} staff role or access updates were logged in the recent audit window.`,
        statusLabel: "Logged",
        statusTone: recentRoleChanges.length >= 10 ? "warning" : "info",
        priorityLabel: recentRoleChanges.length >= 10 ? "High activity" : "Review window",
        priorityTone: recentRoleChanges.length >= 10 ? "warning" : "info",
        updatedAt: toNullableText(latest.created_at),
        sourceLabel: "Owner audit trail",
        sourceHref: getHqUrl("/owner/settings/audit"),
        evidence: [
          `${formatCount(recentRoleChanges.length)} staff.update event(s) were recorded.`,
          toText(latest.entity_id) ? `Latest entity ${toText(latest.entity_id)}` : "Latest entity id was not recorded.",
        ],
        notes: [
          "Role change volume is not automatically suspicious, but it should stay visible to system administrators and workforce leads.",
        ],
        details: [
          { label: "Action", value: "Staff update" },
          { label: "Volume", value: formatCount(recentRoleChanges.length) },
          {
            label: "Latest event",
            value: formatDate(latest.created_at),
            note: titleCase(toText(latest.entity) || "staff"),
          },
        ],
        actions: [
          makeAction("Open audit trail", getHqUrl("/owner/settings/audit"), "primary"),
          makeAction("Open workforce controls", "/workforce?queue=role-coverage", "secondary"),
        ],
      })
    );
  }

  if (recentInvites.length > 0) {
    const latest = recentInvites[0] ?? {};
    records.push(
      makeRecord({
        id: "settings-invite-audit",
        division: "shared",
        queue: "audit-watch",
        queueLabel: "Audit watch",
        title: "Staff invite activity is still flowing through the system layer",
        summary: `${recentInvites.length} staff invitation event(s) were logged and should stay tied to explicit onboarding follow-through.`,
        statusLabel: "Open loop",
        statusTone: "warning",
        priorityLabel: "Onboarding control",
        priorityTone: "warning",
        updatedAt: toNullableText(latest.created_at),
        sourceLabel: "Owner staff governance",
        sourceHref: getHqUrl("/owner/staff"),
        evidence: [
          `${formatCount(recentInvites.length)} staff.invite event(s) were recorded.`,
          toText(latest.entity_id) ? `Latest invite target ${toText(latest.entity_id)}` : "Latest invite target id was not recorded.",
        ],
        notes: [
          "Every staff invite should resolve into an active, explicit role assignment or be cleaned up before it becomes access drift.",
        ],
        details: [
          { label: "Action", value: "Staff invite" },
          { label: "Volume", value: formatCount(recentInvites.length) },
          {
            label: "Latest event",
            value: formatDate(latest.created_at),
            note: titleCase(toText(latest.entity) || "staff"),
          },
        ],
        actions: [
          makeAction("Open workforce controls", "/workforce?queue=pending-onboarding", "primary"),
          makeAction("Open owner staff", getHqUrl("/owner/staff"), "secondary"),
        ],
      })
    );
  }

  return records;
}

function buildOperationsRecords(dataset: BaseDataset, viewer: WorkspaceViewer) {
  const visibleSupport = dataset.supportThreads
    .filter((row) => canAccessDivision(viewer, normalizeDivision(row.division)))
    .filter((row) => isOpenStatus(row.status))
    .filter((row) => hoursSince(row.updated_at) >= 12 || ["high", "urgent"].includes(toText(row.priority).toLowerCase()))
    .slice(0, 12)
    .map((row) => {
      const division = normalizeDivision(row.division) || "account";
      const threadId = toText(row.id);
      const stale = hoursSince(row.updated_at) >= 12;
      return makeRecord({
        id: `ops-support:${threadId}`,
        division,
        queue: "sla-watch",
        queueLabel: "SLA watch",
        title: toText(row.subject) || "Support thread",
        summary: `${titleCase(toText(row.category) || "general")} thread in ${divisionLabel(
          division
        )} still needs movement.`,
        statusLabel: titleCase(toText(row.status) || "open"),
        statusTone: stale ? "critical" : "warning",
        priorityLabel: stale ? "Stale" : "Priority queue",
        priorityTone: stale ? "critical" : "warning",
        updatedAt: toNullableText(row.updated_at),
        ownerLabel: toNullableText(row.assigned_to) ? "Assigned" : "Unassigned",
        sourceLabel: "Staff support desk",
        sourceHref: `/support?thread=${encodeURIComponent(threadId)}`,
        evidence: [
          stale ? "No movement for 12+ hours." : "Priority was raised on this thread.",
          `Division ${divisionLabel(division)}`,
        ],
        notes: [
          "Operations should move the record into a real owner lane immediately instead of leaving it as a passive metric.",
        ],
        details: [
          { label: "Division", value: divisionLabel(division) },
          { label: "Category", value: titleCase(toText(row.category) || "general") },
          {
            label: "Ownership",
            value: toNullableText(row.assigned_to) ? "Assigned" : "Unassigned",
            note: `Updated ${formatDate(row.updated_at)}`,
          },
        ],
        actions: [
          makeAction("Open thread", `/support?thread=${encodeURIComponent(threadId)}`, "primary"),
          makeAction(`Open ${divisionLabel(division)} workspace`, division === "account" ? "/support" : `/${division}`, "secondary"),
        ],
      });
    });

  return [
    ...buildDeliveryFailureRecords(dataset).filter((record) => canAccessDivision(viewer, record.division)),
    ...buildGovernanceRiskRecords(dataset),
    ...buildUnreadBacklogRecords(dataset, viewer),
    ...visibleSupport,
  ];
}

function financeRecords(dataset: BaseDataset, viewer: WorkspaceViewer) {
  const careFinance = careRecords(dataset, viewer).filter((record) =>
    ["payment-recovery", "overdue-bookings"].includes(record.queue)
  );
  const marketplaceFinance = marketplaceRecords(dataset, viewer).filter((record) =>
    ["marketplace-payouts", "disputes", "delivery-failures"].includes(record.queue)
  );
  const learnFinance = learnRecords(dataset, viewer).filter((record) => record.queue === "pending-invoices");
  const studioFinance = studioRecords(dataset, viewer).filter((record) => record.queue === "payment-failures");

  return [...learnFinance, ...careFinance, ...marketplaceFinance, ...studioFinance];
}

async function listWorkforceUsers() {
  const admin = createStaffAdminSupabase();
  const users: WorkforceAuthUser[] = [];
  let page = 1;

  while (page <= 5) {
    try {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
      if (error) break;
      const batch = ((data?.users as WorkforceAuthUser[] | undefined) ?? []).map((user) => ({
        id: user.id,
        email: toNullableText(user.email),
        created_at: toNullableText(user.created_at),
        last_sign_in_at: toNullableText(user.last_sign_in_at),
        banned_until: toNullableText(user.banned_until),
        user_metadata:
          user.user_metadata && typeof user.user_metadata === "object"
            ? (user.user_metadata as JsonRecord)
            : null,
        app_metadata:
          user.app_metadata && typeof user.app_metadata === "object"
            ? (user.app_metadata as JsonRecord)
            : null,
      }));

      users.push(...batch);
      if (batch.length < 200) break;
      page += 1;
    } catch {
      break;
    }
  }

  return users;
}

async function listRoleMembershipSummary() {
  const admin = createStaffAdminSupabase();
  const membershipTables: Array<{ division: WorkspaceDivision; table: string }> = [
    { division: "marketplace", table: "marketplace_role_memberships" },
    { division: "studio", table: "studio_role_memberships" },
    { division: "property", table: "property_role_memberships" },
    { division: "learn", table: "learn_role_memberships" },
    { division: "logistics", table: "logistics_role_memberships" },
  ];

  const results = await Promise.all(
    membershipTables.map(async ({ division, table }) => {
      const rows = await safeSelect(table, admin, { limit: 400 });
      const active = rows.filter((row) => row.is_active !== false);
      return {
        division,
        count: active.length,
        roles: [...new Set(active.map((row) => toText(row.role)).filter(Boolean))].slice(0, 5),
      };
    })
  );

  return results;
}

function workspaceMetricsFromRecords(records: WorkspaceRecord[]) {
  return {
    total: records.length,
    critical: records.filter((record) => record.priorityTone === "critical").length,
    warnings: records.filter((record) => record.priorityTone === "warning").length,
    stale: records.filter((record) => record.queue === "sla-watch").length,
  };
}

export async function getDivisionWorkspaceData(
  viewer: WorkspaceViewer,
  division: WorkspaceDivision
) {
  const dataset = await loadBaseDataset();

  const recordsByDivision: Record<WorkspaceDivision, WorkspaceRecord[]> = {
    care: careRecords(dataset, viewer),
    marketplace: marketplaceRecords(dataset, viewer),
    studio: studioRecords(dataset, viewer),
    jobs: jobsRecords(dataset, viewer),
    learn: learnRecords(dataset, viewer),
    property: propertyRecords(dataset, viewer),
    logistics: logisticsRecords(dataset, viewer),
  };

  const records = recordsByDivision[division];
  const metricsState = workspaceMetricsFromRecords(records);
  const unreadCount = dataset.customerNotifications.filter(
    (row) => normalizeDivision(row.division) === division && !Boolean(row.is_read)
  ).length;
  const openSupport = dataset.supportThreads.filter(
    (row) => normalizeDivision(row.division) === division && isOpenStatus(row.status)
  ).length;

  const focusByDivision: Record<WorkspaceDivision, string> = {
    care: "Recover overdue bookings first, then close open balances, then drain support escalations tied to live service work.",
    marketplace:
      "Handle seller onboarding, disputes, payout review, and delivery failures in that order so trust and money movement do not drift apart.",
    studio:
      "Clear project blockers and payment communication failures before sales keeps feeding more work into a brittle delivery lane.",
    jobs:
      "Treat alert delivery failures and unread recruiter backlog as operational debt, then work the trust and support queue behind them.",
    learn:
      "Clear unpaid academy invoices and instructor decisions before support conversations start absorbing finance and onboarding confusion.",
    property:
      "Move listing moderation and inquiry handling before unread support threads turn into stale, unowned property promises.",
    logistics:
      "Use shared support and public tracking truthfully while the dedicated dispatch backoffice remains a documented platform gap.",
  };

  const insights: WorkspaceInsight[] = [
    {
      id: `${division}-queue-health`,
      title: `${divisionLabel(division)} queue health`,
      summary: `${records.length} live records are actionable in this workspace right now.`,
      tone: metricsState.critical > 0 ? "warning" : "info",
      evidence: [
        `${formatCount(openSupport)} open support thread(s)`,
        `${formatCount(unreadCount)} unread customer notification(s)`,
      ],
      href: records[0]?.sourceHref || null,
    },
  ];

  if (division === "logistics") {
    insights.push({
      id: "logistics-platform-gap",
      title: "Dispatch console still needs the dedicated backend pass",
      summary:
        "This workspace is truthful about the current platform gap instead of pretending a shipment queue exists when it does not.",
      tone: "warning",
      evidence: [
        "No logistics shipment queue surfaced in the current live dataset.",
        "Dedicated queue, audit, and escalation structures are documented for the Supabase pass.",
      ],
      href: null,
    });
  }

  return {
    metrics: [
      {
        label: "Live records",
        value: formatCount(records.length),
        hint: `Actionable ${divisionLabel(division)} items visible to this role right now.`,
        tone: "info",
      },
      {
        label: "Critical pressure",
        value: formatCount(metricsState.critical),
        hint: "Items with immediate trust, delivery, or payment risk.",
        tone: metricsState.critical > 0 ? "critical" : "success",
      },
      {
        label: "Open support",
        value: formatCount(openSupport),
        hint: "Unresolved support work still attached to this division.",
        tone: openSupport > 0 ? "warning" : "success",
      },
      {
        label: "Unread notifications",
        value: formatCount(unreadCount),
        hint: "Customer-visible events not yet absorbed into the staff workflow.",
        tone: unreadCount >= 10 ? "warning" : "info",
      },
    ],
    insights,
    records,
    queues: summarizeQueueOptions(records),
    focusNote: focusByDivision[division],
    emptyTitle: `${divisionLabel(division)} has no live queue pressure right now`,
    emptyDescription:
      division === "logistics"
        ? "Use the support desk and tracking route while the dedicated dispatch backend is still pending."
        : `As new ${divisionLabel(division).toLowerCase()} records arrive, they will appear here with exact workflow actions.`,
  } satisfies WorkspacePageData;
}

export async function getOperationsWorkspaceData(viewer: WorkspaceViewer) {
  const dataset = await loadBaseDataset();
  const records = buildOperationsRecords(dataset, viewer)
    .filter((record) => canAccessDivision(viewer, record.division))
    .sort((left, right) => hoursSince(left.updatedAt) - hoursSince(right.updatedAt));
  const metricsState = workspaceMetricsFromRecords(records);
  const failedComms = records.filter((record) => record.queue === "delivery-failures").length;
  const governanceRisk = records.filter((record) => record.queue === "governance-risk").length;
  const queueNeglect = records.filter((record) => record.queue === "queue-neglect").length;

  return {
    metrics: [
      {
        label: "Critical queue items",
        value: formatCount(metricsState.critical),
        hint: "Immediate incidents or stale escalations requiring action now.",
        tone: metricsState.critical > 0 ? "critical" : "success",
      },
      {
        label: "Delivery failures",
        value: formatCount(failedComms),
        hint: "Provider, queue, or quota incidents currently visible in live records.",
        tone: failedComms > 0 ? "critical" : "success",
      },
      {
        label: "Governance risk",
        value: formatCount(governanceRisk),
        hint: "Repeated staff role changes or other suspicious admin churn.",
        tone: governanceRisk > 0 ? "warning" : "success",
      },
      {
        label: "Queue neglect",
        value: formatCount(queueNeglect),
        hint: "Unread backlogs and unattended queues detected deterministically.",
        tone: queueNeglect > 0 ? "warning" : "success",
      },
    ],
    insights: [
      {
        id: "ops-deterministic-alerting",
        title: "Internal oversight is deterministic",
        summary:
          "This surface only raises explainable signals from stale queues, unread backlogs, repeated governance changes, and real delivery failures.",
        tone: "info",
        evidence: [
          "No heuristic ML or fake AI scoring is used here.",
          "Every alert can be traced back to a concrete table row or audit event.",
        ],
        href: records[0]?.sourceHref || null,
      },
    ],
    records,
    queues: summarizeQueueOptions(records),
    focusNote:
      "Move critical delivery failures and governance anomalies first, then drain stale support and unread backlog so owner summaries remain truthful.",
    emptyTitle: "No operational pressure is currently above threshold",
    emptyDescription:
      "This center only shows explainable incidents. When a queue or control lane drifts, it will appear here with the exact drill-down.",
  } satisfies WorkspacePageData;
}

export async function getFinanceWorkspaceData(viewer: WorkspaceViewer) {
  const dataset = await loadBaseDataset();
  const records = financeRecords(dataset, viewer)
    .filter((record) => canAccessDivision(viewer, record.division))
    .sort((left, right) => hoursSince(left.updatedAt) - hoursSince(right.updatedAt));
  const pendingInvoices = records.filter((record) => record.queue === "pending-invoices").length;
  const payoutPressure = records.filter((record) => record.queue === "marketplace-payouts").length;
  const paymentRecovery = records.filter((record) =>
    ["payment-recovery", "overdue-bookings", "payment-failures"].includes(record.queue)
  ).length;

  return {
    metrics: [
      {
        label: "Finance-sensitive records",
        value: formatCount(records.length),
        hint: "Cross-division money movement or unresolved commercial pressure.",
        tone: "info",
      },
      {
        label: "Pending invoices",
        value: formatCount(pendingInvoices),
        hint: "Shared invoices still waiting for settlement.",
        tone: pendingInvoices > 0 ? "warning" : "success",
      },
      {
        label: "Marketplace payouts",
        value: formatCount(payoutPressure),
        hint: "Seller payout reviews still sitting in the queue.",
        tone: payoutPressure > 0 ? "warning" : "success",
      },
      {
        label: "Payment recovery",
        value: formatCount(paymentRecovery),
        hint: "Bookings, projects, or payment reminders that can still block delivery quality.",
        tone: paymentRecovery > 0 ? "critical" : "success",
      },
    ],
    insights: [
      {
        id: "finance-truth",
        title: "Finance follows workflow truth, not vanity totals",
        summary:
          "Every card here opens a real workflow lane where a staff member can verify, release, recover, or escalate money-linked exceptions.",
        tone: "info",
        evidence: [
          "Open balances, payout holds, invoice backlog, and payment failures are derived from live rows.",
        ],
        href: records[0]?.sourceHref || null,
      },
    ],
    records,
    queues: summarizeQueueOptions(records),
    focusNote:
      "Clear overdue money movement before it spills into trust, support, and delivery deterioration across the divisions.",
    emptyTitle: "No finance-sensitive backlog is currently visible",
    emptyDescription:
      "Pending invoices, payout holds, and payment recovery issues will appear here as soon as live records require staff intervention.",
  } satisfies WorkspacePageData;
}

export async function getWorkforceWorkspaceData(viewer: WorkspaceViewer) {
  const [dataset, users, memberships] = await Promise.all([
    loadBaseDataset(),
    listWorkforceUsers(),
    listRoleMembershipSummary(),
  ]);

  const pendingUsers = users.filter((user) => !user.last_sign_in_at);
  const suspendedUsers = users.filter((user) => {
    const banned = toDate(user.banned_until);
    return Boolean(banned && banned.getTime() > Date.now());
  });
  const governanceRecords = buildGovernanceRiskRecords(dataset);
  const membershipRecords = memberships
    .filter((item) => item.count > 0)
    .filter((item) => canAccessDivision(viewer, item.division))
    .map((item) =>
      makeRecord({
        id: `roles:${item.division}`,
        division: item.division,
        queue: "role-coverage",
        queueLabel: "Role coverage",
        title: `${divisionLabel(item.division)} membership coverage`,
        summary: `${item.count} active role membership row(s) currently back this division's explicit staff scope.`,
        statusLabel: "Mapped",
        statusTone: "info",
        priorityLabel: item.count < 2 ? "Thin coverage" : "Staffed",
        priorityTone: item.count < 2 ? "warning" : "success",
        updatedAt: null,
        sourceLabel: "Owner role governance",
        sourceHref: getHqUrl("/owner/staff/roles"),
        evidence: item.roles.length > 0 ? item.roles.map((role) => titleCase(role)) : ["No explicit roles found."],
        notes: [
          "If a division is missing explicit membership rows, Staff HQ may still be relying on fallback or activity-based access.",
        ],
        details: [
          { label: "Division", value: divisionLabel(item.division) },
          { label: "Membership rows", value: formatCount(item.count) },
          { label: "Sample roles", value: item.roles.length ? item.roles.map(titleCase).join(", ") : "None" },
        ],
        actions: [
          makeAction("Open role governance", getHqUrl("/owner/staff/roles"), "primary"),
          makeAction("Open audit history", getHqUrl("/owner/settings/audit"), "secondary"),
        ],
      })
    );

  const inviteRecords = pendingUsers.slice(0, 10).map((user) =>
    makeRecord({
      id: `invite:${user.id}`,
      division: "shared",
      queue: "pending-onboarding",
      queueLabel: "Pending onboarding",
      title:
        toText(user.user_metadata?.full_name || user.user_metadata?.name) ||
        toText(user.email) ||
        "Pending staff account",
      summary: "This staff account has not completed its first sign-in yet.",
      statusLabel: "Pending",
      statusTone: "warning",
      priorityLabel: daysSince(user.created_at) >= 7 ? "Dormant invite" : "Fresh invite",
      priorityTone: daysSince(user.created_at) >= 7 ? "critical" : "warning",
      updatedAt: toNullableText(user.created_at),
      sourceLabel: "Owner staff directory",
      sourceHref: getHqUrl("/owner/staff"),
      evidence: [
        `Created ${formatDate(user.created_at)}`,
        toText(user.app_metadata?.role || user.user_metadata?.role) || "No role metadata saved yet.",
      ],
      notes: [
        "Dormant invites weaken accountability because access expectations and real usage drift apart.",
      ],
      details: [
        { label: "Email", value: toText(user.email) || "No email saved" },
        {
          label: "Last sign-in",
          value: "Never",
          note: daysSince(user.created_at) >= 7 ? "This invite has gone dormant." : "Still within the normal activation window.",
        },
      ],
      actions: [
        makeAction("Open staff directory", getHqUrl("/owner/staff"), "primary"),
        makeAction("Open role governance", getHqUrl("/owner/staff/roles"), "secondary"),
      ],
    })
  );

  const records = [...governanceRecords, ...inviteRecords, ...membershipRecords];

  return {
    metrics: [
      {
        label: "Total accounts",
        value: formatCount(users.length),
        hint: "Auth-backed workforce accounts currently visible to the platform.",
        tone: "info",
      },
      {
        label: "Pending onboarding",
        value: formatCount(pendingUsers.length),
        hint: "Accounts that still have not completed the first sign-in.",
        tone: pendingUsers.length > 0 ? "warning" : "success",
      },
      {
        label: "Suspended",
        value: formatCount(suspendedUsers.length),
        hint: "Accounts with an active suspension window in auth.",
        tone: suspendedUsers.length > 0 ? "warning" : "info",
      },
      {
        label: "Governance alerts",
        value: formatCount(governanceRecords.length),
        hint: "Repeated role-change patterns and other workforce control issues.",
        tone: governanceRecords.length > 0 ? "critical" : "success",
      },
    ],
    insights: [
      {
        id: "workforce-governance",
        title: "RBAC integrity is enforced in the server layer",
        summary:
          "This workspace tracks membership coverage, dormant invites, and governance churn so owner-level access control remains auditable.",
        tone: "info",
        evidence: [
          "Staff HQ still hides unsafe actions in the UI, but these routes are also server-gated by role and division checks.",
        ],
        href: getHqUrl("/owner/staff/roles"),
      },
    ],
    records,
    queues: summarizeQueueOptions(records),
    focusNote:
      "Clear suspicious governance churn first, then close dormant invites and thin membership coverage before role leakage turns into silent operational debt.",
    emptyTitle: "No workforce governance pressure is currently visible",
    emptyDescription:
      "When invite drift, role churn, or membership gaps surface in live records, they will appear here with audit-backed drill-downs.",
  } satisfies WorkspacePageData;
}

export async function getSettingsWorkspaceData(viewer: WorkspaceViewer) {
  const dataset = await loadBaseDataset();
  const canReviewWorkforce = viewer.permissions.includes("staff.directory.view");
  const deliveryRecords = buildDeliveryFailureRecords(dataset).filter((record) =>
    canAccessDivision(viewer, record.division)
  );
  const governanceRecords = canReviewWorkforce ? buildGovernanceRiskRecords(dataset) : [];
  const auditRecords = buildSystemAuditRecords(dataset);
  const records = [...deliveryRecords, ...governanceRecords, ...auditRecords]
    .filter((record, index, list) => list.findIndex((item) => item.id === record.id) === index)
    .sort((left, right) => hoursSince(left.updatedAt) - hoursSince(right.updatedAt));
  const metricsState = workspaceMetricsFromRecords(records);
  const deliveryCount = deliveryRecords.length;
  const auditCount = auditRecords.length + governanceRecords.length;

  return {
    metrics: [
      {
        label: "System incidents",
        value: formatCount(records.length),
        hint: "Deterministic comms, audit, and governance signals exposed to this role.",
        tone: "info",
      },
      {
        label: "Delivery failures",
        value: formatCount(deliveryCount),
        hint: "Provider or queue failures that still need configuration or workflow action.",
        tone: deliveryCount > 0 ? "critical" : "success",
      },
      {
        label: "Audit watch",
        value: formatCount(auditCount),
        hint: "Recent access-change activity and governance alerts requiring deliberate review.",
        tone: auditCount > 0 ? "warning" : "success",
      },
      {
        label: "Critical pressure",
        value: formatCount(metricsState.critical),
        hint: "Records that should move before routine configuration or reporting work.",
        tone: metricsState.critical > 0 ? "critical" : "info",
      },
    ],
    insights: [
      {
        id: "settings-surface-truth",
        title: "This route is a control surface, not a launcher",
        summary:
          "System settings now surface queue-backed delivery incidents and audit-backed governance pressure before linking out to deeper owner controls.",
        tone: deliveryCount > 0 ? "warning" : "info",
        evidence: [
          "Sensitive actions remain server-validated in the underlying routes.",
          canReviewWorkforce
            ? "Workforce governance evidence is visible because this role can already access staff directory controls."
            : "Workforce governance details stay hidden until staff-directory permission is granted.",
        ],
        href: records[0]?.sourceHref || null,
      },
    ],
    records,
    queues: summarizeQueueOptions(records),
    focusNote:
      "Clear delivery failures first, then review access-control churn and invite activity so system health stays audit-ready instead of drifting behind the scenes.",
    emptyTitle: "No system control pressure is currently visible",
    emptyDescription:
      "When queue delivery failures, access churn, or audit-backed admin activity surfaces again, it will land here with exact workflow drill-downs.",
  } satisfies WorkspacePageData;
}

export async function getStaffDashboardData(viewer: WorkspaceViewer) {
  const dataset = await loadBaseDataset();
  const visibleDivisions = [...getVisibleDivisions(viewer)];

  const divisionCounts = new Map<string, number>();
  const records = visibleDivisions.flatMap((division) => {
    const divisionRecordMap: Record<WorkspaceDivision, WorkspaceRecord[]> = {
      care: careRecords(dataset, viewer),
      marketplace: marketplaceRecords(dataset, viewer),
      studio: studioRecords(dataset, viewer),
      jobs: jobsRecords(dataset, viewer),
      learn: learnRecords(dataset, viewer),
      property: propertyRecords(dataset, viewer),
      logistics: logisticsRecords(dataset, viewer),
    };
    const items = divisionRecordMap[division];
    divisionCounts.set(division, items.length);
    return items.slice(0, 4);
  });

  const operationAlerts = buildOperationsRecords(dataset, viewer).slice(0, 6);
  const topRecords = [...operationAlerts, ...records]
    .filter((record, index, list) => list.findIndex((item) => item.id === record.id) === index)
    .sort((left, right) => hoursSince(left.updatedAt) - hoursSince(right.updatedAt))
    .slice(0, 14);

  const workspaceCards = visibleDivisions.map((division) => ({
    division,
    count: divisionCounts.get(division) ?? 0,
  }));

  return {
    metrics: [
      {
        label: "Accessible divisions",
        value: formatCount(visibleDivisions.length),
        hint: "Role-scoped divisions visible to this staff member.",
        tone: "info",
      },
      {
        label: "Live queue items",
        value: formatCount(topRecords.length),
        hint: "Actionable records flowing into this dashboard right now.",
        tone: "info",
      },
      {
        label: "Critical alerts",
        value: formatCount(topRecords.filter((record) => record.priorityTone === "critical").length),
        hint: "Signals that should move before anything decorative.",
        tone:
          topRecords.filter((record) => record.priorityTone === "critical").length > 0
            ? "critical"
            : "success",
      },
      {
        label: "Unread customer events",
        value: formatCount(
          dataset.customerNotifications.filter(
            (row) =>
              canAccessDivision(viewer, normalizeDivision(row.division)) && !Boolean(row.is_read)
          ).length
        ),
        hint: "Customer-visible movement still waiting for staff absorption.",
        tone: "warning",
      },
    ],
    insights: [
      {
        id: "dashboard-truth",
        title: "This dashboard only surfaces work",
        summary:
          "Every card below is a real queue or escalation entry with a direct route into the workflow that actually moves the record.",
        tone: "info",
        evidence: [
          "No placeholder counts or static action buttons are used in this view.",
          "Role scope still applies: you only see divisions and alerts available to your server-side membership.",
        ],
        href: topRecords[0]?.sourceHref || null,
      },
    ],
    records: topRecords,
    queues: summarizeQueueOptions(topRecords),
    focusNote:
      "Start with critical delivery failures, stale support, and governance risk. Then work down into division queues with the highest unread or finance pressure.",
    emptyTitle: "No live workload is visible on this dashboard right now",
    emptyDescription:
      "As soon as queue-backed work lands in one of your divisions, it will appear here with a real drill-down instead of a passive dashboard tile.",
    workspaceCards,
  } satisfies StaffDashboardData;
}

export function getSelectedRecordId(records: WorkspaceRecord[], filters: WorkspaceListFilters) {
  return firstSelectedRecord(records, filters.record);
}
