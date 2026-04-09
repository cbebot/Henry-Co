import "server-only";

import { getDivisionConfig, getDivisionUrl } from "@henryco/config";
import { createAdminSupabase } from "@/app/lib/supabase-admin";
import { getPermissionsForFamilies } from "@/app/lib/workspace/roles";
import { workspaceHref } from "@/app/lib/workspace/runtime";
import type {
  DivisionRole,
  DivisionWorkspaceModule,
  PlatformRoleFamily,
  WorkspaceDivision,
  WorkspaceDivisionMembership,
  WorkspaceInboxItem,
  WorkspaceInsight,
  WorkspaceMetric,
  WorkspacePermission,
  WorkspaceQueueLane,
  WorkspaceSnapshot,
  WorkspaceTask,
  WorkspaceTrend,
  WorkspaceViewer,
} from "@/app/lib/workspace/types";

type NotificationRow = {
  id: string;
  title: string | null;
  body: string | null;
  category: string | null;
  priority: string | null;
  action_url: string | null;
  action_label: string | null;
  division: string | null;
  reference_type: string | null;
  reference_id: string | null;
  is_read: boolean | null;
  created_at: string | null;
};

type ThreadRow = {
  id: string;
  subject: string | null;
  division: string | null;
  category: string | null;
  status: string | null;
  priority: string | null;
  reference_type: string | null;
  reference_id: string | null;
  assigned_to: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type ActivityRow = {
  id: string;
  division: string | null;
  activity_type: string | null;
  title: string | null;
  description: string | null;
  status: string | null;
  reference_type: string | null;
  reference_id: string | null;
  amount_kobo: number | null;
  metadata: Record<string, unknown> | null;
  action_url: string | null;
  created_at: string | null;
};

type AuditRow = {
  id: string;
  actor_id: string | null;
  actor_role: string | null;
  action: string | null;
  entity_type: string | null;
  entity_id: string | null;
  reason: string | null;
  created_at: string | null;
};

type CareBookingRow = {
  id: string;
  tracking_code: string | null;
  customer_name: string | null;
  service_type: string | null;
  item_summary: string | null;
  pickup_address: string | null;
  pickup_date: string | null;
  pickup_slot: string | null;
  status: string | null;
  payment_status: string | null;
  quoted_total: number | null;
  balance_due: number | null;
  created_at: string | null;
  updated_at: string | null;
};

type MarketplaceApplicationRow = {
  id: string;
  store_name: string | null;
  legal_name: string | null;
  category_focus: string | null;
  status: string | null;
  review_note: string | null;
  created_at: string | null;
  submitted_at: string | null;
  updated_at: string | null;
};

type MarketplaceProductRow = {
  id: string;
  title: string | null;
  summary: string | null;
  approval_status: string | null;
  status: string | null;
  total_stock: number | null;
  created_at: string | null;
  updated_at: string | null;
};

type MarketplaceDisputeRow = {
  id: string;
  dispute_no: string | null;
  order_no: string | null;
  reason: string | null;
  details: string | null;
  status: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type MarketplacePayoutRow = {
  id: string;
  reference: string | null;
  amount: number | null;
  status: string | null;
  review_note: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type MarketplaceOrderRow = {
  id: string;
  order_no: string | null;
  status: string | null;
  payment_status: string | null;
  grand_total: number | null;
  shipping_city: string | null;
  shipping_region: string | null;
  placed_at: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type QueryBuilderShape = {
  order(column: string, options?: { ascending?: boolean }): QueryBuilderShape;
  limit(value: number): QueryBuilderShape;
};

type QueryMutator = (query: QueryBuilderShape) => QueryBuilderShape;

const currencyFormatter = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
});

const compactNumberFormatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

function cleanText(value: unknown, fallback = "") {
  const text = typeof value === "string" ? value.trim() : String(value ?? "").trim();
  return text || fallback;
}

function unique<T>(items: T[]) {
  return [...new Set(items)];
}

type ModuleAudience = {
  permissions: Set<WorkspacePermission>;
  families: Set<PlatformRoleFamily>;
  roles: Set<DivisionRole>;
};

function getModuleAudience(membership: WorkspaceDivisionMembership): ModuleAudience {
  return {
    permissions: new Set(getPermissionsForFamilies(membership.families)),
    families: new Set(membership.families),
    roles: new Set(membership.roles),
  };
}

function hasModulePermission(audience: ModuleAudience, permission: WorkspacePermission) {
  return audience.permissions.has(permission);
}

function hasAnyFamily(audience: ModuleAudience, families: PlatformRoleFamily[]) {
  return families.some((family) => audience.families.has(family));
}

function hasAnyRole(audience: ModuleAudience, roles: DivisionRole[]) {
  return roles.some((role) => audience.roles.has(role));
}

function formatCount(value: number | null | undefined) {
  if (typeof value !== "number" || Number.isNaN(value)) return "0";
  return value >= 1000 ? compactNumberFormatter.format(value) : String(value);
}

function formatMoney(value: number | null | undefined) {
  if (typeof value !== "number" || Number.isNaN(value)) return null;
  return currencyFormatter.format(value);
}

function toDate(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function hoursSince(value: string | null | undefined) {
  const date = toDate(value);
  if (!date) return 0;
  return Math.max(0, (Date.now() - date.getTime()) / 36e5);
}

function olderThanHours(value: string | null | undefined, hours: number) {
  return hoursSince(value) >= hours;
}

function formatTimestamp(value: string | null | undefined) {
  const date = toDate(value);
  if (!date) return null;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function formatRelativeAge(value: string | null | undefined) {
  const ageHours = hoursSince(value);
  if (ageHours < 1) return "moments ago";
  if (ageHours < 24) return `${Math.round(ageHours)}h ago`;
  return `${Math.round(ageHours / 24)}d ago`;
}

function humanize(value: string | null | undefined, fallback = "Update") {
  const text = cleanText(value);
  if (!text) return fallback;
  return text
    .replace(/[._-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function isWorkspaceDivision(value: string | null | undefined): value is WorkspaceDivision {
  return ["care", "marketplace", "studio", "jobs", "property", "learn", "logistics"].includes(
    cleanText(value).toLowerCase()
  );
}

function resolveActionUrl(
  division: WorkspaceDivision,
  actionUrl: string | null | undefined,
  fallbackHref: string
) {
  const normalized = cleanText(actionUrl);
  if (!normalized) return fallbackHref;
  if (/^https?:\/\//i.test(normalized)) return normalized;
  if (normalized.startsWith("/")) {
    return `${getDivisionUrl(division)}${normalized}`;
  }
  return fallbackHref;
}

function inferDivisionFromAudit(row: AuditRow): WorkspaceDivision {
  const action = cleanText(row.action).toLowerCase();
  const entityType = cleanText(row.entity_type).toLowerCase();

  if (entityType.includes("shipment") || action.includes("delivery") || action.includes("dispatch")) {
    return "logistics";
  }

  if (entityType.includes("listing") || action.includes("property")) {
    return "property";
  }

  if (entityType.includes("application") || action.includes("recruit")) {
    return "jobs";
  }

  return "care";
}

function sortTasks(tasks: WorkspaceTask[]) {
  return [...tasks].sort(
    (left, right) =>
      right.priority - left.priority ||
      new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
  );
}

function sortInbox(items: WorkspaceInboxItem[]) {
  const priorityWeight: Record<WorkspaceInboxItem["priority"], number> = {
    critical: 4,
    high: 3,
    normal: 2,
    low: 1,
  };

  return [...items].sort(
    (left, right) =>
      Number(right.unread) - Number(left.unread) ||
      priorityWeight[right.priority] - priorityWeight[left.priority] ||
      new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
  );
}

function buildTask(input: {
  id: string;
  division: WorkspaceDivision;
  title: string;
  summary: string;
  queue: string;
  href: string;
  status: WorkspaceTask["status"];
  priority: number;
  ownerLabel?: string | null;
  dueLabel?: string | null;
  suggestedAction: string;
  evidence: Array<string | null | undefined>;
  createdAt: string | null | undefined;
}) {
  return {
    id: input.id,
    division: input.division,
    title: input.title,
    summary: input.summary,
    queue: input.queue,
    href: input.href,
    status: input.status,
    priority: input.priority,
    ownerLabel: input.ownerLabel ?? null,
    dueLabel: input.dueLabel ?? null,
    suggestedAction: input.suggestedAction,
    evidence: input.evidence.filter(Boolean) as string[],
    createdAt: input.createdAt || new Date().toISOString(),
  } satisfies WorkspaceTask;
}

function buildInsight(input: {
  id: string;
  title: string;
  summary: string;
  tone: WorkspaceInsight["tone"];
  evidence: Array<string | null | undefined>;
  href?: string | null;
}) {
  return {
    id: input.id,
    title: input.title,
    summary: input.summary,
    tone: input.tone,
    evidence: input.evidence.filter(Boolean) as string[],
    href: input.href ?? null,
  } satisfies WorkspaceInsight;
}

async function safeSelect<T>(
  admin: ReturnType<typeof createAdminSupabase>,
  table: string,
  select: string,
  mutate?: QueryMutator
) {
  try {
    let query = admin.from(table).select(select) as unknown as QueryBuilderShape;
    if (mutate) {
      query = mutate(query);
    }
    const { data, error } = (await (query as unknown)) as {
      data: T[] | null;
      error: { message: string } | null;
    };
    if (error) return [] as T[];
    return (data ?? []) as T[];
  } catch {
    return [] as T[];
  }
}

async function safeCount(
  admin: ReturnType<typeof createAdminSupabase>,
  table: string,
  mutate?: QueryMutator
) {
  try {
    let query = admin.from(table).select("*", { count: "exact", head: true }) as unknown as QueryBuilderShape;
    if (mutate) {
      query = mutate(query);
    }
    const { count, error } = (await (query as unknown)) as {
      count: number | null;
      error: { message: string } | null;
    };
    if (error) return null;
    return count ?? 0;
  } catch {
    return null;
  }
}

function buildCareModule(
  membership: WorkspaceDivisionMembership,
  bookings: CareBookingRow[],
  threads: ThreadRow[],
  notifications: NotificationRow[],
  basePath: string
): DivisionWorkspaceModule {
  const audience = getModuleAudience(membership);
  const detailHref = workspaceHref(basePath, "/division/care");
  const openThreads = threads.filter((thread) => thread.status !== "closed");
  const unreadNotifications = notifications.filter((notification) => !notification.is_read);
  const unpaidBookings = bookings.filter(
    (booking) =>
      cleanText(booking.payment_status).toLowerCase() !== "paid" &&
      Number(booking.balance_due || 0) > 0
  );
  const staleBookings = bookings.filter((booking) => olderThanHours(booking.updated_at, 24));
  const bookingsNeedingAction = bookings.map((booking) => {
    const balanceDue = Number(booking.balance_due || 0);
    const ageHours = hoursSince(booking.updated_at || booking.created_at);
    const status = cleanText(booking.status, "booked").toLowerCase();
    const riskStatus: WorkspaceTask["status"] =
      balanceDue > 0 && ageHours >= 24 ? "at_risk" : ageHours >= 18 ? "stale" : "active";

    return buildTask({
      id: `care-booking-${booking.id}`,
      division: "care",
      title: `${cleanText(booking.tracking_code, "Booking")} ${balanceDue > 0 ? "needs payment follow-up" : "needs operator confirmation"}`,
      summary: `${cleanText(booking.customer_name, "Customer")} scheduled ${cleanText(
        booking.service_type,
        "service"
      )}.`,
      queue: balanceDue > 0 ? "Payment risk" : "Pickup coordination",
      href: detailHref,
      status: riskStatus,
      priority:
        balanceDue > 0 ? (ageHours >= 24 ? 95 : 80) : status === "booked" ? 72 : 58,
      ownerLabel: "Care operations",
      dueLabel: booking.pickup_date
        ? `${booking.pickup_date}${booking.pickup_slot ? ` • ${booking.pickup_slot}` : ""}`
        : null,
      suggestedAction:
        balanceDue > 0
          ? "Confirm payment request and assign a same-day follow-up."
          : "Assign pickup staff and confirm the route window.",
      evidence: [
        `Status: ${humanize(booking.status, "Booked")}`,
        booking.pickup_address ? `Pickup: ${booking.pickup_address}` : null,
        booking.item_summary ? `Items: ${booking.item_summary}` : null,
        balanceDue > 0 ? `Balance due: ${formatMoney(balanceDue)}` : null,
        `Updated ${formatRelativeAge(booking.updated_at || booking.created_at)}`,
      ],
      createdAt: booking.updated_at || booking.created_at,
    });
  });

  const supportTasks = openThreads.slice(0, 6).map((thread) =>
    buildTask({
      id: `care-thread-${thread.id}`,
      division: "care",
      title: cleanText(thread.subject, "Care support thread"),
      summary: `Customer thread in ${cleanText(thread.category, "support")} is ${cleanText(
        thread.status,
        "open"
      )}.`,
      queue: "Support follow-up",
      href: detailHref,
      status: olderThanHours(thread.updated_at || thread.created_at, 20) ? "stale" : "active",
      priority: olderThanHours(thread.updated_at || thread.created_at, 20) ? 82 : 65,
      ownerLabel: "Care support",
      dueLabel: formatTimestamp(thread.updated_at || thread.created_at),
      suggestedAction: "Reply, assign, or close the customer thread.",
      evidence: [
        `Priority: ${humanize(thread.priority, "Normal")}`,
        `Status: ${humanize(thread.status, "Open")}`,
        `Last update ${formatRelativeAge(thread.updated_at || thread.created_at)}`,
      ],
      createdAt: thread.updated_at || thread.created_at,
    })
  );

  const canSeeTasks = hasModulePermission(audience, "tasks.view");
  const canSeeQueues = hasModulePermission(audience, "queues.view");
  const canSeeFinance =
    hasModulePermission(audience, "division.finance") ||
    hasAnyFamily(audience, ["division_manager", "supervisor", "system_admin"]);
  const canSeeSupport =
    canSeeTasks &&
    (hasAnyFamily(audience, ["support_staff", "coordinator"]) ||
      hasAnyRole(audience, ["care_support", "care_manager"]));
  const canSeeOperations =
    canSeeTasks &&
    (hasAnyFamily(audience, ["operations_staff", "specialist", "division_manager", "supervisor"]) ||
      hasAnyRole(audience, ["care_ops", "care_rider", "service_staff", "care_manager"]));

  const visibleTasks = sortTasks([
    ...(canSeeOperations
      ? bookingsNeedingAction.filter((task) => task.queue === "Pickup coordination")
      : []),
    ...(canSeeFinance ? bookingsNeedingAction.filter((task) => task.queue === "Payment risk") : []),
    ...(canSeeSupport ? supportTasks : []),
  ]).slice(0, 8);

  const queueLanes: WorkspaceQueueLane[] = canSeeQueues
    ? [
        ...(canSeeOperations
          ? [
              {
                id: "care-pickup",
                title: "Pickup Coordination",
                description: "Fresh bookings that need assignment and dispatch confirmation.",
                tone: "info",
                items: sortTasks(
                  bookingsNeedingAction.filter((task) => task.queue === "Pickup coordination").slice(0, 6)
                ),
              } satisfies WorkspaceQueueLane,
            ]
          : []),
        ...(canSeeFinance
          ? [
              {
                id: "care-payment",
                title: "Payment Risk",
                description: "Booked services carrying unpaid balances or aging payment requests.",
                tone: unpaidBookings.length > 0 ? "warning" : "success",
                items: sortTasks(
                  bookingsNeedingAction.filter((task) => task.queue === "Payment risk").slice(0, 6)
                ),
              } satisfies WorkspaceQueueLane,
            ]
          : []),
        ...(canSeeSupport
          ? [
              {
                id: "care-support",
                title: "Care Support",
                description: "Customer conversations needing action from care support staff.",
                tone: openThreads.length > 0 ? "warning" : "success",
                items: sortTasks(supportTasks),
              } satisfies WorkspaceQueueLane,
            ]
          : []),
      ]
    : [];

  const totalUnpaidExposure = unpaidBookings.reduce(
    (sum, booking) => sum + Number(booking.balance_due || 0),
    0
  );

  const insights: WorkspaceInsight[] = [];
  if (canSeeFinance && unpaidBookings.length > 0) {
    insights.push(
      buildInsight({
        id: "care-unpaid-exposure",
        title: "Care bookings carrying unpaid exposure",
        summary: `${formatCount(unpaidBookings.length)} bookings are still unpaid across the care queue.`,
        tone: totalUnpaidExposure > 200000 ? "critical" : "warning",
        evidence: [
          totalUnpaidExposure > 0 ? `Outstanding balance: ${formatMoney(totalUnpaidExposure)}` : null,
          staleBookings.length > 0 ? `${formatCount(staleBookings.length)} bookings are older than 24 hours.` : null,
        ],
        href: detailHref,
        })
    );
  }
  if (canSeeSupport && openThreads.length > 0) {
    insights.push(
      buildInsight({
        id: "care-support-backlog",
        title: "Care support queue needs attention",
        summary: `${formatCount(openThreads.length)} open customer threads are visible to care staff.`,
        tone: openThreads.some((thread) => olderThanHours(thread.updated_at || thread.created_at, 24))
          ? "warning"
          : "info",
        evidence: [
          `${formatCount(unreadNotifications.length)} unread care alerts are waiting in the inbox.`,
          `${formatCount(
            openThreads.filter((thread) => olderThanHours(thread.updated_at || thread.created_at, 24))
              .length
          )} threads have gone more than 24 hours without closure.`,
        ],
        href: detailHref,
      })
    );
  }

  const metrics: WorkspaceMetric[] = [
    {
      label: "Active bookings",
      value: formatCount(bookings.length),
      hint: "Recent care bookings visible to the workspace.",
    },
    ...(canSeeFinance
      ? [
          {
            label: "Unpaid exposure",
            value: formatMoney(totalUnpaidExposure) || currencyFormatter.format(0),
            hint: "Open booking balances that still need staff follow-through.",
            tone:
              totalUnpaidExposure > 200000
                ? "critical"
                : totalUnpaidExposure > 0
                  ? "warning"
                  : "success",
          } satisfies WorkspaceMetric,
        ]
      : []),
    ...(canSeeSupport
      ? [
          {
            label: "Support queue",
            value: formatCount(openThreads.length),
            hint: "Customer threads still waiting for care staff attention.",
          } satisfies WorkspaceMetric,
        ]
      : []),
    ...(hasModulePermission(audience, "inbox.view")
      ? [
          {
            label: "Unread alerts",
            value: formatCount(unreadNotifications.length),
            hint: "Unread care notifications across the shared notification stream.",
          } satisfies WorkspaceMetric,
        ]
      : []),
  ];

  return {
    division: "care",
    label: getDivisionConfig("care").shortName,
    tagline: "Bookings, service execution, payment follow-through, and care support.",
    description:
      "Care operations are driven from live bookings plus shared support signals so pickup, cleaning, route timing, and payment pressure stay visible together.",
    readiness: "live",
    sourceMode: "structured",
    sourceSummary: "This module is operating on dedicated care booking records plus the shared support and notification streams.",
    roles: [],
    metrics,
    tasks: visibleTasks,
    approvals: [],
    queueLanes,
    insights,
    externalUrl: getDivisionUrl("care"),
  };
}

function buildMarketplaceModule(
  membership: WorkspaceDivisionMembership,
  applications: MarketplaceApplicationRow[],
  products: MarketplaceProductRow[],
  orders: MarketplaceOrderRow[],
  disputes: MarketplaceDisputeRow[],
  payoutRequests: MarketplacePayoutRow[],
  basePath: string
): DivisionWorkspaceModule {
  const audience = getModuleAudience(membership);
  const detailHref = workspaceHref(basePath, "/division/marketplace");
  const applicationApprovals = applications
    .filter((application) => !["approved", "rejected"].includes(cleanText(application.status).toLowerCase()))
    .map((application) =>
      buildTask({
        id: `marketplace-application-${application.id}`,
        division: "marketplace",
        title: `${cleanText(application.store_name, "Vendor")} needs onboarding review`,
        summary: `${cleanText(application.legal_name, "Applicant")} is waiting for marketplace approval.`,
        queue: "Seller onboarding",
        href: detailHref,
        status: olderThanHours(application.updated_at || application.submitted_at || application.created_at, 24)
          ? "stale"
          : "new",
        priority: olderThanHours(application.updated_at || application.submitted_at || application.created_at, 24)
          ? 88
          : 74,
        ownerLabel: "Marketplace admin",
        dueLabel: formatTimestamp(application.submitted_at || application.created_at),
        suggestedAction: "Review documents, confirm fit, and move the application forward.",
        evidence: [
          application.category_focus ? `Focus: ${application.category_focus}` : null,
          `Status: ${humanize(application.status, "Draft")}`,
          application.review_note ? `Review note: ${application.review_note}` : null,
        ],
        createdAt: application.updated_at || application.submitted_at || application.created_at,
      })
    );

  const productApprovals = products
    .filter((product) => cleanText(product.approval_status).toLowerCase() !== "approved")
    .map((product) =>
      buildTask({
        id: `marketplace-product-${product.id}`,
        division: "marketplace",
        title: `${cleanText(product.title, "Product")} needs catalog approval`,
        summary: cleanText(product.summary, "A marketplace listing is still waiting for moderation."),
        queue: "Catalog moderation",
        href: detailHref,
        status: olderThanHours(product.updated_at || product.created_at, 24) ? "stale" : "active",
        priority: olderThanHours(product.updated_at || product.created_at, 24) ? 84 : 68,
        ownerLabel: "Catalog manager",
        dueLabel: formatTimestamp(product.updated_at || product.created_at),
        suggestedAction: "Approve, reject, or return the product for changes.",
        evidence: [
          `Approval: ${humanize(product.approval_status, "Draft")}`,
          `Status: ${humanize(product.status, "Active")}`,
          typeof product.total_stock === "number" ? `Stock: ${product.total_stock}` : null,
        ],
        createdAt: product.updated_at || product.created_at,
      })
    );

  const disputeTasks = disputes
    .filter((dispute) => !["resolved", "closed"].includes(cleanText(dispute.status).toLowerCase()))
    .map((dispute) =>
      buildTask({
        id: `marketplace-dispute-${dispute.id}`,
        division: "marketplace",
        title: `${cleanText(dispute.dispute_no, "Dispute")} is still open`,
        summary: cleanText(dispute.reason, "A marketplace dispute needs staff review."),
        queue: "Dispute desk",
        href: detailHref,
        status: olderThanHours(dispute.updated_at || dispute.created_at, 18) ? "at_risk" : "active",
        priority: olderThanHours(dispute.updated_at || dispute.created_at, 18) ? 90 : 78,
        ownerLabel: "Marketplace support",
        dueLabel: formatTimestamp(dispute.updated_at || dispute.created_at),
        suggestedAction: "Assess the evidence and move the dispute toward resolution.",
        evidence: [
          dispute.order_no ? `Order: ${dispute.order_no}` : null,
          `Status: ${humanize(dispute.status, "Open")}`,
          dispute.details ? dispute.details : null,
        ],
        createdAt: dispute.updated_at || dispute.created_at,
      })
    );

  const payoutApprovals = payoutRequests
    .filter((request) => !["approved", "paid", "rejected"].includes(cleanText(request.status).toLowerCase()))
    .map((request) =>
      buildTask({
        id: `marketplace-payout-${request.id}`,
        division: "marketplace",
        title: `${cleanText(request.reference, "Payout request")} needs finance review`,
        summary: "A vendor payout request is waiting in the finance queue.",
        queue: "Finance review",
        href: detailHref,
        status: olderThanHours(request.updated_at || request.created_at, 24) ? "stale" : "active",
        priority: olderThanHours(request.updated_at || request.created_at, 24) ? 87 : 72,
        ownerLabel: "Marketplace finance",
        dueLabel: formatTimestamp(request.updated_at || request.created_at),
        suggestedAction: "Validate payout evidence and approve or decline the release.",
        evidence: [
          request.amount ? `Amount: ${formatMoney(request.amount)}` : null,
          `Status: ${humanize(request.status, "Requested")}`,
          request.review_note || null,
        ],
        createdAt: request.updated_at || request.created_at,
      })
    );

  const orderTasks = orders
    .filter((order) => {
      const status = cleanText(order.status).toLowerCase();
      const paymentStatus = cleanText(order.payment_status).toLowerCase();
      return !["delivered", "cancelled"].includes(status) || paymentStatus !== "paid";
    })
    .map((order) =>
      buildTask({
        id: `marketplace-order-${order.id}`,
        division: "marketplace",
        title: `${cleanText(order.order_no, "Order")} needs operator attention`,
        summary: `${humanize(order.status, "Placed")} order with ${humanize(
          order.payment_status,
          "pending"
        )} payment status.`,
        queue: "Order operations",
        href: detailHref,
        status:
          cleanText(order.payment_status).toLowerCase() !== "paid" &&
          olderThanHours(order.updated_at || order.created_at, 18)
            ? "at_risk"
            : "active",
        priority:
          cleanText(order.payment_status).toLowerCase() !== "paid"
            ? 81
            : olderThanHours(order.updated_at || order.created_at, 24)
              ? 69
              : 55,
        ownerLabel: "Marketplace ops",
        dueLabel: formatTimestamp(order.updated_at || order.placed_at || order.created_at),
        suggestedAction: "Confirm payment, fulfillment acceptance, and shipment timing.",
        evidence: [
          order.grand_total ? `Order value: ${formatMoney(order.grand_total)}` : null,
          order.shipping_city || order.shipping_region
            ? `Destination: ${[order.shipping_city, order.shipping_region].filter(Boolean).join(", ")}`
            : null,
        ],
        createdAt: order.updated_at || order.placed_at || order.created_at,
      })
    );

  const canSeeTasks = hasModulePermission(audience, "tasks.view");
  const canSeeQueues = hasModulePermission(audience, "queues.view");
  const canReviewApprovals =
    hasModulePermission(audience, "division.approve") ||
    hasModulePermission(audience, "division.moderate") ||
    hasAnyFamily(audience, ["division_manager", "supervisor", "system_admin", "content_staff"]);
  const canSeeFinance =
    hasModulePermission(audience, "division.finance") ||
    hasAnyFamily(audience, ["division_manager", "supervisor", "system_admin"]);
  const canSeeSupport =
    canSeeTasks &&
    (hasAnyFamily(audience, ["support_staff", "moderation_staff", "division_manager", "supervisor"]) ||
      hasAnyRole(audience, [
        "marketplace_support",
        "marketplace_moderator",
        "marketplace_admin",
        "seller_success",
      ]));
  const canSeeOperations =
    canSeeTasks &&
    (hasAnyFamily(audience, ["operations_staff", "support_staff", "coordinator", "division_manager", "supervisor"]) ||
      hasAnyRole(audience, ["marketplace_ops", "marketplace_admin", "seller_success", "catalog_manager"]));

  const approvals = canReviewApprovals || canSeeFinance
    ? sortTasks([
        ...(canReviewApprovals ? applicationApprovals : []),
        ...(canReviewApprovals ? productApprovals : []),
        ...(canSeeFinance ? payoutApprovals : []),
      ])
    : [];
  const tasks = sortTasks([
    ...(canSeeOperations ? orderTasks : []),
    ...(canSeeSupport ? disputeTasks : []),
  ]);

  const insights: WorkspaceInsight[] = [];
  if (approvals.length > 0) {
    insights.push(
      buildInsight({
        id: "marketplace-review-backlog",
        title: "Marketplace review backlog is visible",
        summary: `${formatCount(approvals.length)} approvals are queued across onboarding, catalog, and finance.`,
        tone: approvals.some((task) => task.status === "stale") ? "warning" : "info",
        evidence: [
          `${formatCount(applicationApprovals.length)} seller applications awaiting review.`,
          `${formatCount(productApprovals.length)} products still need moderation.`,
          `${formatCount(payoutApprovals.length)} payout requests are waiting on finance.`,
        ],
        href: detailHref,
        })
    );
  }
  if (canSeeSupport && disputeTasks.length > 0) {
    insights.push(
      buildInsight({
        id: "marketplace-disputes-open",
        title: "Disputes need marketplace attention",
        summary: `${formatCount(disputeTasks.length)} disputes remain open in the marketplace queue.`,
        tone: disputeTasks.some((task) => task.status === "at_risk") ? "critical" : "warning",
        evidence: [
          `${formatCount(orderTasks.length)} active orders remain in progress.`,
          `${formatCount(
            disputeTasks.filter((task) => task.status === "at_risk").length
          )} disputes have already crossed the 18-hour risk threshold.`,
        ],
        href: detailHref,
        })
    );
  }

  const queueLanes: WorkspaceQueueLane[] = canSeeQueues
    ? [
        ...(approvals.length > 0 || canReviewApprovals || canSeeFinance
          ? [
              {
                id: "marketplace-approvals",
                title: "Approvals",
                description: "Items waiting for seller, catalog, or payout decisions.",
                tone: approvals.length > 0 ? "warning" : "success",
                items: approvals.slice(0, 6),
              } satisfies WorkspaceQueueLane,
            ]
          : []),
        ...(canSeeOperations
          ? [
              {
                id: "marketplace-ops",
                title: "Order Operations",
                description: "Operational orders that still need payment or fulfillment work.",
                tone: orderTasks.length > 0 ? "info" : "success",
                items: orderTasks.slice(0, 6),
              } satisfies WorkspaceQueueLane,
            ]
          : []),
        ...(canSeeSupport
          ? [
              {
                id: "marketplace-disputes",
                title: "Disputes",
                description: "Buyer and seller issues requiring marketplace intervention.",
                tone: disputeTasks.length > 0 ? "critical" : "success",
                items: disputeTasks.slice(0, 6),
              } satisfies WorkspaceQueueLane,
            ]
          : []),
      ]
    : [];

  const metrics: WorkspaceMetric[] = [
    ...(hasModulePermission(audience, "approvals.view")
      ? [
          {
            label: "Approvals queued",
            value: formatCount(approvals.length),
            hint: "Open seller, catalog, and payout reviews.",
            tone: approvals.length > 0 ? "warning" : "success",
          } satisfies WorkspaceMetric,
        ]
      : []),
    ...(canSeeOperations
      ? [
          {
            label: "Active orders",
            value: formatCount(orderTasks.length),
            hint: "Orders still moving through payment or fulfillment.",
          } satisfies WorkspaceMetric,
        ]
      : []),
    ...(canSeeSupport
      ? [
          {
            label: "Open disputes",
            value: formatCount(disputeTasks.length),
            hint: "Disputes that still need marketplace support or moderation.",
            tone: disputeTasks.length > 0 ? "warning" : "success",
          } satisfies WorkspaceMetric,
        ]
      : []),
    {
      label: "Catalog records",
      value: formatCount(products.length),
      hint: "Marketplace product records visible in the shared schema.",
    },
  ];

  return {
    division: "marketplace",
    label: getDivisionConfig("marketplace").shortName,
    tagline: "Seller onboarding, catalog moderation, orders, disputes, and payout control.",
    description:
      "Marketplace surfaces staff work across onboarding, moderation, buyer support, finance release, and commerce execution from one shared queue model.",
    readiness: "live",
    sourceMode: "structured",
    sourceSummary: "Marketplace is operating on dedicated application, catalog, order, dispute, and payout records from the live shared database.",
    roles: [],
    metrics,
    tasks: tasks.slice(0, 8),
    approvals: approvals.slice(0, 8),
    queueLanes,
    insights,
    externalUrl: getDivisionUrl("marketplace"),
  };
}

function buildActivityModule(input: {
  membership: WorkspaceDivisionMembership;
  division: Extract<WorkspaceDivision, "studio" | "jobs" | "property" | "learn">;
  activities: ActivityRow[];
  threads: ThreadRow[];
  notifications: NotificationRow[];
  basePath: string;
  structuralCount: number | null;
}) {
  const audience = getModuleAudience(input.membership);
  const division = input.division;
  const detailHref = workspaceHref(input.basePath, `/division/${division}`);
  const openThreads = input.threads.filter((thread) => thread.status !== "closed");
  const unreadNotifications = input.notifications.filter((notification) => !notification.is_read);

  const threadTasks = openThreads.map((thread) => {
    const threadStatus = cleanText(thread.status).toLowerCase();
    const queue =
      thread.category && /application|submission|verification|approval/i.test(thread.category)
        ? "Approvals"
        : "Follow-up";

    return buildTask({
      id: `${division}-thread-${thread.id}`,
      division,
      title: cleanText(thread.subject, `${humanize(division)} thread`),
      summary: `${humanize(thread.category, "Support")} is ${humanize(threadStatus, "open")}.`,
      queue,
      href: detailHref,
      status:
        threadStatus === "awaiting_reply" || olderThanHours(thread.updated_at || thread.created_at, 18)
          ? "stale"
          : "active",
      priority:
        queue === "Approvals"
          ? olderThanHours(thread.updated_at || thread.created_at, 18)
            ? 84
            : 74
          : olderThanHours(thread.updated_at || thread.created_at, 18)
            ? 76
            : 62,
      ownerLabel: `${humanize(division)} ops`,
      dueLabel: formatTimestamp(thread.updated_at || thread.created_at),
      suggestedAction:
        queue === "Approvals"
          ? "Review the submission and route it to the correct approver."
          : "Reply, assign ownership, or close the thread.",
      evidence: [
        `Priority: ${humanize(thread.priority, "Normal")}`,
        `Reference: ${humanize(thread.reference_type, "General")}`,
        `Updated ${formatRelativeAge(thread.updated_at || thread.created_at)}`,
      ],
      createdAt: thread.updated_at || thread.created_at,
    });
  });

  const activityTasks = input.activities
    .filter((activity) => {
      const status = cleanText(activity.status).toLowerCase();
      return (
        ["new", "pending", "submitted", "under review", "under_review", "active"].includes(status) ||
        /submitted|verification|application|assignment|proposal|listing|certificate|payment/i.test(
          cleanText(activity.activity_type)
        )
      );
    })
    .map((activity) => {
      const status = cleanText(activity.status).toLowerCase();
      const risky = olderThanHours(activity.created_at, 24);
      const actionHref = resolveActionUrl(division, activity.action_url, detailHref);
      const isApproval =
        /submitted|verification|application|proposal|listing/i.test(cleanText(activity.activity_type)) ||
        ["submitted", "under review", "under_review"].includes(status);

      return buildTask({
        id: `${division}-activity-${activity.id}`,
        division,
        title: cleanText(activity.title, humanize(activity.activity_type, `${humanize(division)} activity`)),
        summary: cleanText(activity.description, "A shared operational signal needs review."),
        queue: isApproval ? "Approvals" : "Workload",
        href: actionHref,
        status: risky ? (isApproval ? "at_risk" : "stale") : "new",
        priority: isApproval ? (risky ? 82 : 72) : risky ? 68 : 56,
        ownerLabel: `${humanize(division)} team`,
        dueLabel: formatTimestamp(activity.created_at),
        suggestedAction: isApproval
          ? "Review the signal, confirm ownership, and clear the approval step."
          : "Triage the update and move the next action forward.",
        evidence: [
          `Signal: ${humanize(activity.activity_type, "Activity")}`,
          `Status: ${humanize(activity.status, "Active")}`,
          activity.amount_kobo ? `Value: ${formatMoney(activity.amount_kobo)}` : null,
        ],
        createdAt: activity.created_at,
      });
    });

  const inboxTasks = unreadNotifications.map((notification) =>
    buildTask({
      id: `${division}-notification-${notification.id}`,
      division,
      title: cleanText(notification.title, `${humanize(division)} notification`),
      summary: cleanText(notification.body, "A shared alert is waiting for staff review."),
      queue: "Alerts",
      href: resolveActionUrl(division, notification.action_url, detailHref),
      status:
        cleanText(notification.priority).toLowerCase() === "critical"
          ? "at_risk"
          : olderThanHours(notification.created_at, 24)
            ? "stale"
            : "new",
      priority:
        cleanText(notification.priority).toLowerCase() === "critical"
          ? 90
          : cleanText(notification.priority).toLowerCase() === "high"
            ? 80
            : 60,
      ownerLabel: `${humanize(division)} inbox`,
      dueLabel: formatTimestamp(notification.created_at),
      suggestedAction: "Acknowledge the alert and act on the linked item.",
      evidence: [
        `Category: ${humanize(notification.category, "General")}`,
        `Priority: ${humanize(notification.priority, "Normal")}`,
        `Raised ${formatRelativeAge(notification.created_at)}`,
      ],
      createdAt: notification.created_at,
    })
  );

  const canSeeTasks = hasModulePermission(audience, "tasks.view");
  const canSeeInbox = hasModulePermission(audience, "inbox.view");
  const canSeeQueues = hasModulePermission(audience, "queues.view");
  const approvalRolesByDivision: Record<typeof division, DivisionRole[]> = {
    studio: ["project_manager", "sales_consultant", "delivery_coordinator", "studio_finance"],
    jobs: ["recruiter", "internal_recruitment_coordinator", "jobs_moderator", "employer_success"],
    property: ["listings_manager", "viewing_coordinator", "property_moderator", "managed_property_ops"],
    learn: ["academy_admin", "content_manager", "certification_manager", "academy_ops", "instructor"],
  };
  const canSeeApprovals =
    hasModulePermission(audience, "division.approve") ||
    hasModulePermission(audience, "division.moderate") ||
    hasAnyFamily(audience, ["division_manager", "supervisor", "content_staff", "moderation_staff"]) ||
    hasAnyRole(audience, approvalRolesByDivision[division]);

  const approvals = canSeeApprovals
    ? sortTasks([...threadTasks, ...activityTasks].filter((task) => task.queue === "Approvals"))
    : [];
  const tasks = canSeeTasks
    ? sortTasks(
        [
          ...threadTasks.filter((task) => task.queue !== "Approvals"),
          ...activityTasks.filter((task) => task.queue !== "Approvals"),
          ...(canSeeInbox ? inboxTasks : []),
        ].filter((task) => task.queue !== "Approvals")
      )
    : [];
  const recentSignals = input.activities.filter(
    (activity) => olderThanHours(activity.created_at, 24 * 7) === false
  );
  const readiness: DivisionWorkspaceModule["readiness"] =
    input.structuralCount === null
      ? input.activities.length || input.threads.length || input.notifications.length
        ? "partial"
        : "planned"
      : "live";

  const insights: WorkspaceInsight[] = [];
  if (approvals.length > 0) {
    insights.push(
      buildInsight({
        id: `${division}-approvals`,
        title: `${humanize(division)} approvals are active`,
        summary: `${formatCount(approvals.length)} approvals are visible in ${humanize(
          division
        )}.`,
        tone: approvals.some((task) => task.status === "at_risk") ? "warning" : "info",
        evidence: [
          `${formatCount(openThreads.length)} open support threads contribute to the queue.`,
          `${formatCount(recentSignals.length)} fresh activity signals landed in the last 7 days.`,
        ],
        href: detailHref,
      })
    );
  }
  if (readiness !== "live") {
    insights.push(
      buildInsight({
        id: `${division}-readiness`,
        title: `${humanize(division)} is running in shared-signal mode`,
        summary:
          "Dedicated division tables are not fully active in the live workspace yet, so this module is aggregating shared activity, inbox, and support evidence.",
        tone: readiness === "partial" ? "warning" : "info",
        evidence: [
          input.structuralCount === null
            ? "No dedicated structural table count was available from the live schema."
            : null,
          `${formatCount(input.activities.length)} activity records are still available through shared workspace feeds.`,
        ],
        href: detailHref,
      })
    );
  }
  if (canSeeInbox && unreadNotifications.length > 0) {
    insights.push(
      buildInsight({
        id: `${division}-alerts`,
        title: `${humanize(division)} still has unread alerts`,
        summary: `${formatCount(unreadNotifications.length)} unread alerts are still open in the shared notification stream.`,
        tone: unreadNotifications.some(
          (notification) => cleanText(notification.priority).toLowerCase() === "critical"
        )
          ? "warning"
          : "info",
        evidence: [
          `${formatCount(
            unreadNotifications.filter((notification) => cleanText(notification.priority).toLowerCase() === "critical")
              .length
          )} alerts are marked critical.`,
        ],
        href: detailHref,
      })
    );
  }

  const metrics: WorkspaceMetric[] = [
    {
      label: "Signals (7d)",
      value: formatCount(recentSignals.length),
      hint: "Recent shared activity events for this division.",
    },
    ...((canSeeTasks || canSeeApprovals)
      ? [
          {
            label: "Open threads",
            value: formatCount(openThreads.length),
            hint: "Support or operational threads still waiting on staff action.",
            tone: openThreads.length > 0 ? "warning" : "success",
          } satisfies WorkspaceMetric,
        ]
      : []),
    ...(canSeeInbox
      ? [
          {
            label: "Unread alerts",
            value: formatCount(unreadNotifications.length),
            hint: "Unread notifications assigned to this division stream.",
          } satisfies WorkspaceMetric,
        ]
      : []),
    {
      label: "Structured records",
      value: input.structuralCount === null ? "Shared feed" : formatCount(input.structuralCount),
      hint:
        input.structuralCount === null
          ? "Running from shared activity until dedicated tables are fully live."
          : "Direct count from the dedicated division schema.",
      tone: input.structuralCount === null ? "warning" : "success",
    },
  ];

  const queueLanes: WorkspaceQueueLane[] = canSeeQueues
    ? [
        ...(canSeeTasks
          ? [
              {
                id: `${division}-follow-up`,
                title: "Follow-up",
                description: "Open conversations and operational signals that need a response.",
                tone: tasks.length > 0 ? "info" : "success",
                items: tasks
                  .filter((task) => task.queue === "Follow-up" || task.queue === "Workload")
                  .slice(0, 6),
              } satisfies WorkspaceQueueLane,
            ]
          : []),
        ...(canSeeApprovals
          ? [
              {
                id: `${division}-approvals-lane`,
                title: "Approvals",
                description: "Submissions, applications, or approvals that need staff review.",
                tone: approvals.length > 0 ? "warning" : "success",
                items: approvals.slice(0, 6),
              } satisfies WorkspaceQueueLane,
            ]
          : []),
        ...(canSeeInbox
          ? [
              {
                id: `${division}-alerts`,
                title: "Alerts",
                description: "Unread division alerts surfaced through the shared notification center.",
                tone: inboxTasks.length > 0 ? "warning" : "success",
                items: inboxTasks.slice(0, 6),
              } satisfies WorkspaceQueueLane,
            ]
          : []),
      ]
    : [];

  const sourceMode: DivisionWorkspaceModule["sourceMode"] =
    readiness === "live" ? "structured" : readiness === "partial" ? "shared-signals" : "planned";
  const sourceSummary =
    sourceMode === "structured"
      ? "This division is backed by dedicated live records in the shared HenryCo schema."
      : sourceMode === "shared-signals"
        ? "This division is currently running from shared activity, support, and notification signals because dedicated operational tables are not fully live yet."
        : "This division shell is registered, but it still needs live dedicated data structures before it can operate at full depth.";

  return {
    division,
    label: getDivisionConfig(division).shortName,
    tagline:
      {
        studio: "Leads, proposals, delivery coordination, and client-facing progress.",
        jobs: "Applicants, employer workflows, moderation, and internal recruitment flow.",
        property: "Listings, inquiries, submissions, viewings, and moderation control.",
        learn: "Courses, learner operations, certifications, and enablement signals.",
      }[division],
    description:
      "This module combines live shared signals from support, notifications, and activity streams so staff can operate cross-division work from one queue surface.",
    readiness,
    sourceMode,
    sourceSummary,
    roles: [],
    metrics,
    tasks: tasks.slice(0, 8),
    approvals: approvals.slice(0, 8),
    queueLanes,
    insights,
    externalUrl: getDivisionUrl(division),
  };
}

function buildLogisticsModule(
  membership: WorkspaceDivisionMembership,
  audits: AuditRow[],
  basePath: string
): DivisionWorkspaceModule {
  const audience = getModuleAudience(membership);
  const detailHref = workspaceHref(basePath, "/division/logistics");
  const dispatchSignals = audits.filter((audit) => inferDivisionFromAudit(audit) === "logistics");
  const rawTasks = dispatchSignals.map((audit) =>
    buildTask({
      id: `logistics-audit-${audit.id}`,
      division: "logistics",
      title: humanize(audit.action, "Dispatch update"),
      summary: `${humanize(audit.entity_type, "Order")} ${cleanText(
        audit.entity_id,
        "record"
      )} changed in the shared audit trail.`,
      queue: "Dispatch events",
      href: detailHref,
      status: olderThanHours(audit.created_at, 18) ? "stale" : "active",
      priority: olderThanHours(audit.created_at, 18) ? 70 : 58,
      ownerLabel: "Logistics ops",
      dueLabel: formatTimestamp(audit.created_at),
      suggestedAction: "Confirm that the dispatch chain has a clear next step and owner.",
      evidence: [
        `Actor role: ${humanize(audit.actor_role, "System")}`,
        audit.reason || null,
        `Logged ${formatRelativeAge(audit.created_at)}`,
      ],
      createdAt: audit.created_at,
    })
  );

  const readiness: DivisionWorkspaceModule["readiness"] = dispatchSignals.length ? "partial" : "planned";
  const canSeeTasks =
    hasModulePermission(audience, "tasks.view") ||
    hasAnyFamily(audience, ["finance_staff", "division_manager", "supervisor"]);
  const canSeeQueues = hasModulePermission(audience, "queues.view");
  const tasks = canSeeTasks ? sortTasks(rawTasks).slice(0, 8) : [];
  const queueLanes: WorkspaceQueueLane[] = canSeeQueues
    ? [
        {
          id: "logistics-dispatch-events",
          title: "Dispatch Events",
          description: "Shared operational events currently standing in for logistics queue data.",
          tone: tasks.length > 0 ? "info" : "warning",
          items: tasks.slice(0, 6),
        },
      ]
    : [];

  return {
    division: "logistics",
    label: getDivisionConfig("logistics").shortName,
    tagline: "Dispatch visibility, delivery pressure, and fleet-oriented operational follow-through.",
    description:
      "Logistics is prepared as a first-class module, but the live workspace is currently reading shared operational events until the dedicated logistics schema is activated.",
    readiness,
    sourceMode: readiness === "planned" ? "planned" : "shared-signals",
    sourceSummary:
      readiness === "planned"
        ? "The logistics workspace surface is staged, but the live shared database still needs dedicated logistics tables before the module can operate at full depth."
        : "This module is currently driven by shared audit and operational events until dedicated logistics queue storage goes live.",
    roles: [],
    metrics: [
      {
        label: "Dispatch events",
        value: formatCount(dispatchSignals.length),
        hint: "Shared operational events currently feeding the logistics surface.",
      },
      {
        label: "Dedicated schema",
        value: readiness === "planned" ? "Pending" : "Shared mode",
        hint: "Logistics-specific tables are not fully live yet in the shared database.",
        tone: readiness === "planned" ? "warning" : "info",
      },
      {
        label: "Escalations",
        value: formatCount(rawTasks.filter((task) => task.status === "stale").length),
        hint: "Dispatch events that have aged without a fresh update.",
      },
      {
        label: "Next step",
        value: "Schema rollout",
        hint: "Move logistics from shared event mode to dedicated queue storage.",
      },
    ],
    tasks,
    approvals: [],
    queueLanes,
    insights: [
      buildInsight({
        id: "logistics-shared-mode",
        title: "Logistics is staged but not fully modeled",
        summary:
          "The workspace is ready for logistics roles and routing, but the live company schema still exposes logistics mostly through shared audit events.",
        tone: readiness === "planned" ? "warning" : "info",
        evidence: [
          `${formatCount(dispatchSignals.length)} shared dispatch-like events were detected in the audit trail.`,
          "Dedicated logistics tables and assignment queues are defined as the next migration step.",
        ],
        href: detailHref,
      }),
    ],
    externalUrl: getDivisionUrl("logistics"),
  };
}

function buildInbox(
  notifications: NotificationRow[],
  threads: ThreadRow[],
  visibleDivisions: WorkspaceDivision[],
  basePath: string
) {
  const divisionSet = new Set(visibleDivisions);

  const notificationItems = notifications
    .filter(
      (
        notification
      ): notification is NotificationRow & { division: WorkspaceDivision } =>
        isWorkspaceDivision(notification.division) && divisionSet.has(notification.division)
    )
    .map((notification) => ({
      id: `notification-${notification.id}`,
      division: notification.division,
      kind: "notification" as const,
      title: cleanText(notification.title, `${humanize(notification.division)} notification`),
      summary: cleanText(notification.body, "A staff notification is waiting for review."),
      href: resolveActionUrl(
        notification.division,
        notification.action_url,
        workspaceHref(basePath, `/division/${notification.division}`)
      ),
      priority:
        cleanText(notification.priority).toLowerCase() === "critical"
          ? "critical"
          : cleanText(notification.priority).toLowerCase() === "high"
            ? "high"
            : cleanText(notification.priority).toLowerCase() === "low"
              ? "low"
              : "normal",
      unread: !notification.is_read,
      createdAt: notification.created_at || new Date().toISOString(),
    } satisfies WorkspaceInboxItem));

  const threadItems = threads
    .filter(
      (thread): thread is ThreadRow & { division: WorkspaceDivision } =>
        isWorkspaceDivision(thread.division) && divisionSet.has(thread.division)
    )
    .map((thread) => ({
      id: `thread-${thread.id}`,
      division: thread.division,
      kind: "thread" as const,
      title: cleanText(thread.subject, `${humanize(thread.division)} thread`),
      summary: `${humanize(thread.category, "Support")} thread is ${humanize(thread.status, "open")}.`,
      href: workspaceHref(basePath, `/division/${thread.division}`),
      priority:
        cleanText(thread.priority).toLowerCase() === "critical"
          ? "critical"
          : cleanText(thread.priority).toLowerCase() === "high"
            ? "high"
            : olderThanHours(thread.updated_at || thread.created_at, 24)
              ? "high"
              : "normal",
      unread: thread.status !== "closed",
      createdAt: thread.updated_at || thread.created_at || new Date().toISOString(),
    } satisfies WorkspaceInboxItem));

  return sortInbox([...notificationItems, ...threadItems]).slice(0, 24);
}

function buildHistory(audits: AuditRow[], visibleDivisions: WorkspaceDivision[], basePath: string) {
  const divisionSet = new Set(visibleDivisions);

  return sortTasks(
    audits
      .map((audit) => {
        const division = inferDivisionFromAudit(audit);
        if (!divisionSet.has(division)) return null;

        return buildTask({
          id: `history-${audit.id}`,
          division,
          title: humanize(audit.action, "Audit event"),
          summary: `${humanize(audit.entity_type, "Record")} ${cleanText(
            audit.entity_id,
            "item"
          )} changed in the shared audit trail.`,
          queue: "History",
          href: workspaceHref(basePath, `/division/${division}`),
          status: "resolved",
          priority: 40,
          ownerLabel: audit.actor_role ? humanize(audit.actor_role) : "System",
          dueLabel: formatTimestamp(audit.created_at),
          suggestedAction: "Inspect the audit trail for change details.",
          evidence: [audit.reason || null, `Captured ${formatRelativeAge(audit.created_at)}`],
          createdAt: audit.created_at,
        });
      })
      .filter(Boolean) as WorkspaceTask[]
  ).slice(0, 24);
}

function buildTrends(
  activities: ActivityRow[],
  threads: ThreadRow[],
  visibleDivisions: WorkspaceDivision[]
) {
  const currentWindow = 24 * 7;
  const previousWindow = currentWindow * 2;

  return visibleDivisions
    .map((division) => {
      const current =
        activities.filter(
          (activity) =>
            cleanText(activity.division).toLowerCase() === division &&
            hoursSince(activity.created_at) <= currentWindow
        ).length +
        threads.filter(
          (thread) =>
            cleanText(thread.division).toLowerCase() === division &&
            hoursSince(thread.updated_at || thread.created_at) <= currentWindow
        ).length;

      const previous =
        activities.filter((activity) => {
          const age = hoursSince(activity.created_at);
          return cleanText(activity.division).toLowerCase() === division && age > currentWindow && age <= previousWindow;
        }).length +
        threads.filter((thread) => {
          const age = hoursSince(thread.updated_at || thread.created_at);
          return cleanText(thread.division).toLowerCase() === division && age > currentWindow && age <= previousWindow;
        }).length;

      return {
        label: humanize(division),
        current,
        previous,
        delta: current - previous,
      } satisfies WorkspaceTrend;
    })
    .sort((left, right) => Math.abs(right.delta) - Math.abs(left.delta) || right.current - left.current);
}

function mergeReadiness(
  membershipReadiness: "live" | "partial" | "planned",
  moduleReadiness: "live" | "partial" | "planned"
) {
  const weight = { live: 3, partial: 2, planned: 1 };
  return weight[membershipReadiness] < weight[moduleReadiness] ? membershipReadiness : moduleReadiness;
}

export async function getWorkspaceSnapshot(
  viewer: WorkspaceViewer,
  basePath: string
): Promise<WorkspaceSnapshot> {
  const visibleDivisions = unique(viewer.divisions.map((membership) => membership.division));
  if (visibleDivisions.length === 0) {
    return {
      generatedAt: new Date().toISOString(),
      summaryMetrics: [],
      modules: [],
      tasks: [],
      approvals: [],
      inbox: [],
      insights: [],
      trends: [],
      history: [],
    };
  }

  const admin = createAdminSupabase();
  const [
    notifications,
    threads,
    activities,
    audits,
    careBookings,
    marketplaceApplications,
    marketplaceProducts,
    marketplaceOrders,
    marketplaceDisputes,
    marketplacePayoutRequests,
    studioProjectsCount,
    learnCoursesCount,
    propertyListingsCount,
  ] = await Promise.all([
    safeSelect<NotificationRow>(
      admin,
      "customer_notifications",
      "id, title, body, category, priority, action_url, action_label, division, reference_type, reference_id, is_read, created_at",
      (query) => query.order("created_at", { ascending: false }).limit(80)
    ),
    safeSelect<ThreadRow>(
      admin,
      "support_threads",
      "id, subject, division, category, status, priority, reference_type, reference_id, assigned_to, created_at, updated_at",
      (query) => query.order("updated_at", { ascending: false }).limit(80)
    ),
    safeSelect<ActivityRow>(
      admin,
      "customer_activity",
      "id, division, activity_type, title, description, status, reference_type, reference_id, amount_kobo, metadata, action_url, created_at",
      (query) => query.order("created_at", { ascending: false }).limit(120)
    ),
    safeSelect<AuditRow>(
      admin,
      "audit_logs",
      "id, actor_id, actor_role, action, entity_type, entity_id, reason, created_at",
      (query) => query.order("created_at", { ascending: false }).limit(120)
    ),
    safeSelect<CareBookingRow>(
      admin,
      "care_bookings",
      "id, tracking_code, customer_name, service_type, item_summary, pickup_address, pickup_date, pickup_slot, status, payment_status, quoted_total, balance_due, created_at, updated_at",
      (query) => query.order("updated_at", { ascending: false }).limit(40)
    ),
    safeSelect<MarketplaceApplicationRow>(
      admin,
      "marketplace_vendor_applications",
      "id, store_name, legal_name, category_focus, status, review_note, created_at, submitted_at, updated_at",
      (query) => query.order("updated_at", { ascending: false }).limit(40)
    ),
    safeSelect<MarketplaceProductRow>(
      admin,
      "marketplace_products",
      "id, title, summary, approval_status, status, total_stock, created_at, updated_at",
      (query) => query.order("updated_at", { ascending: false }).limit(40)
    ),
    safeSelect<MarketplaceOrderRow>(
      admin,
      "marketplace_orders",
      "id, order_no, status, payment_status, grand_total, shipping_city, shipping_region, placed_at, created_at, updated_at",
      (query) => query.order("updated_at", { ascending: false }).limit(40)
    ),
    safeSelect<MarketplaceDisputeRow>(
      admin,
      "marketplace_disputes",
      "id, dispute_no, order_no, reason, details, status, created_at, updated_at",
      (query) => query.order("updated_at", { ascending: false }).limit(40)
    ),
    safeSelect<MarketplacePayoutRow>(
      admin,
      "marketplace_payout_requests",
      "id, reference, amount, status, review_note, created_at, updated_at",
      (query) => query.order("updated_at", { ascending: false }).limit(40)
    ),
    safeCount(admin, "studio_projects"),
    safeCount(admin, "learn_courses"),
    safeCount(admin, "property_listings"),
  ]);

  const modules = viewer.divisions.map((membership) => {
    const divisionNotifications = notifications.filter(
      (notification) => cleanText(notification.division).toLowerCase() === membership.division
    );
    const divisionThreads = threads.filter(
      (thread) => cleanText(thread.division).toLowerCase() === membership.division
    );
    const divisionActivities = activities.filter(
      (activity) => cleanText(activity.division).toLowerCase() === membership.division
    );

    let workspaceModule: DivisionWorkspaceModule;
    switch (membership.division) {
      case "care":
        workspaceModule = buildCareModule(
          membership,
          careBookings,
          divisionThreads,
          divisionNotifications,
          basePath
        );
        break;
      case "marketplace":
        workspaceModule = buildMarketplaceModule(
          membership,
          marketplaceApplications,
          marketplaceProducts,
          marketplaceOrders,
          marketplaceDisputes,
          marketplacePayoutRequests,
          basePath
        );
        break;
      case "studio":
        workspaceModule = buildActivityModule({
          membership,
          division: "studio",
          activities: divisionActivities,
          threads: divisionThreads,
          notifications: divisionNotifications,
          basePath,
          structuralCount: studioProjectsCount,
        });
        break;
      case "jobs":
        workspaceModule = buildActivityModule({
          membership,
          division: "jobs",
          activities: divisionActivities,
          threads: divisionThreads,
          notifications: divisionNotifications,
          basePath,
          structuralCount: null,
        });
        break;
      case "property":
        workspaceModule = buildActivityModule({
          membership,
          division: "property",
          activities: divisionActivities,
          threads: divisionThreads,
          notifications: divisionNotifications,
          basePath,
          structuralCount: propertyListingsCount,
        });
        break;
      case "learn":
        workspaceModule = buildActivityModule({
          membership,
          division: "learn",
          activities: divisionActivities,
          threads: divisionThreads,
          notifications: divisionNotifications,
          basePath,
          structuralCount: learnCoursesCount,
        });
        break;
      case "logistics":
      default:
        workspaceModule = buildLogisticsModule(membership, audits, basePath);
        break;
    }

    return {
      ...workspaceModule,
      roles: membership.roles,
      readiness: mergeReadiness(membership.readiness, workspaceModule.readiness),
    };
  });

  const tasks = sortTasks(unique(modules.flatMap((module) => module.tasks))).slice(0, 24);
  const approvals = sortTasks(unique(modules.flatMap((module) => module.approvals))).slice(0, 24);
  const inbox = viewer.permissions.includes("inbox.view")
    ? buildInbox(notifications, threads, visibleDivisions, basePath)
    : [];
  const history = viewer.permissions.includes("archive.view")
    ? buildHistory(audits, visibleDivisions, basePath)
    : [];
  const trends = viewer.permissions.includes("reports.view")
    ? buildTrends(activities, threads, visibleDivisions).slice(0, 6)
    : [];

  const modulesWithRisk = modules.filter((module) =>
    module.tasks.some((task) => ["stale", "at_risk", "blocked"].includes(task.status))
  );
  const readinessGaps = modules.filter((module) => module.readiness !== "live");
  const unreadInboxCount = inbox.filter((item) => item.unread).length;

  const summaryMetrics: WorkspaceMetric[] = [
    {
      label: "Visible divisions",
      value: formatCount(modules.length),
      hint: "Division modules available to this staff viewer.",
      tone: "success",
    },
    ...(viewer.permissions.includes("tasks.view")
      ? [
          {
            label: "Active workload",
            value: formatCount(tasks.length),
            hint: "Prioritized tasks currently visible across all allowed modules.",
            tone: tasks.length > 12 ? "warning" : "info",
          } satisfies WorkspaceMetric,
        ]
      : []),
    ...(viewer.permissions.includes("approvals.view")
      ? [
          {
            label: "Approvals",
            value: formatCount(approvals.length),
            hint: "Approval items currently waiting in the workspace.",
            tone: approvals.length > 0 ? "warning" : "success",
          } satisfies WorkspaceMetric,
        ]
      : []),
    ...(viewer.permissions.includes("inbox.view")
      ? [
          {
            label: "Unread inbox",
            value: formatCount(unreadInboxCount),
            hint: "Unread alerts and open conversation threads.",
            tone: unreadInboxCount > 0 ? "info" : "success",
          } satisfies WorkspaceMetric,
        ]
      : []),
  ];

  const insights = unique([
    ...modules.flatMap((module) => module.insights),
    ...(modulesWithRisk.length
      ? [
          buildInsight({
            id: "workspace-risk",
            title: "Workload pressure is concentrating in a few modules",
            summary: `${formatCount(modulesWithRisk.length)} division modules currently contain stale or at-risk work.`,
            tone: modulesWithRisk.length >= 3 ? "critical" : "warning",
            evidence: modulesWithRisk.slice(0, 4).map((module) => {
              const riskyCount = module.tasks.filter((task) =>
                ["stale", "at_risk", "blocked"].includes(task.status)
              ).length;
              return `${module.label}: ${formatCount(riskyCount)} risk-weighted tasks`;
            }),
            href: workspaceHref(basePath, "/tasks"),
          }),
        ]
      : []),
    ...(readinessGaps.length
      ? [
          buildInsight({
            id: "workspace-readiness",
            title: "Some division modules are still maturing",
            summary: `${formatCount(readinessGaps.length)} modules are running in partial or planned mode and still rely on shared feeds or upcoming schema rollout.`,
            tone: "warning",
            evidence: readinessGaps.map(
              (module) => `${module.label}: ${humanize(module.readiness, "Partial")}`
            ),
            href: workspaceHref(basePath, "/reports"),
          }),
        ]
      : []),
    ...(approvals.length
      ? [
          buildInsight({
            id: "workspace-approvals",
            title: "Approval queues are active across the workspace",
            summary: `${formatCount(approvals.length)} approvals are visible across the currently permitted modules.`,
            tone: approvals.some((task) => task.status === "at_risk") ? "warning" : "info",
            evidence: approvals.slice(0, 3).map((task) => `${task.division}: ${task.title}`),
            href: workspaceHref(basePath, "/approvals"),
          }),
        ]
      : []),
  ]).slice(0, 8);

  return {
    generatedAt: new Date().toISOString(),
    summaryMetrics,
    modules,
    tasks,
    approvals,
    inbox,
    insights,
    trends,
    history,
  };
}
