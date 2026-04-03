import "server-only";

import { getDivisionConfig, getDivisionUrl } from "@henryco/config";
import type {
  DivisionWorkspaceModule,
  WorkspaceDivision,
  WorkspaceInboxItem,
  WorkspaceInsight,
  WorkspaceQueueLane,
  WorkspaceSnapshot,
  WorkspaceTask,
  WorkspaceTrend,
  WorkspaceViewer,
} from "@/app/lib/workspace/types";
import { createAdminSupabase } from "@/app/lib/supabase-admin";
import { workspaceHref } from "@/app/lib/workspace/runtime";

type NotificationRow = {
  id: string;
  title: string;
  body: string;
  priority: string | null;
  action_url: string | null;
  division: string | null;
  is_read: boolean | null;
  created_at: string;
};

type ThreadRow = {
  id: string;
  subject: string;
  division: string | null;
  category: string | null;
  status: string | null;
  priority: string | null;
  reference_type: string | null;
  reference_id: string | null;
  created_at: string;
  updated_at: string;
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
  action_url: string | null;
  created_at: string;
};

type AuditRow = {
  id: string;
  action: string | null;
  entity_type: string | null;
  entity_id: string | null;
  actor_role: string | null;
  reason: string | null;
  created_at: string;
};

type CareBookingRow = {
  id: string;
  tracking_code: string | null;
  customer_name: string | null;
  status: string | null;
  pickup_date: string | null;
  payment_status: string | null;
  created_at: string;
  updated_at: string | null;
};

type MarketplaceApplicationRow = {
  id: string;
  store_name: string | null;
  status: string | null;
  submitted_at: string | null;
  updated_at: string | null;
};

type MarketplaceProductRow = {
  id: string;
  title: string | null;
  approval_status: string | null;
  total_stock: number | null;
  updated_at: string | null;
};

type MarketplaceDisputeRow = {
  id: string;
  dispute_no: string | null;
  status: string | null;
  reason: string | null;
  updated_at: string | null;
};

type MarketplacePayoutRow = {
  id: string;
  reference: string | null;
  status: string | null;
  amount: number | null;
  created_at: string | null;
};

type MarketplaceOrderRow = {
  id: string;
  order_no: string | null;
  status: string | null;
  payment_status: string | null;
  placed_at: string | null;
};

function cleanText(value?: string | null) {
  return String(value || "").trim();
}

function unique<T>(items: T[]) {
  return [...new Set(items)];
}

function formatCount(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function isWorkspaceDivision(value: string | null | undefined): value is WorkspaceDivision {
  return ["care", "marketplace", "studio", "jobs", "property", "learn", "logistics"].includes(
    String(value || "").trim().toLowerCase()
  );
}

function inferPriority(value: string | null | undefined) {
  const normalized = cleanText(value).toLowerCase();
  if (normalized === "urgent" || normalized === "critical") return "critical";
  if (normalized === "high") return "high";
  if (normalized === "low") return "low";
  return "normal";
}

function inferDivisionFromAudit(row: AuditRow): WorkspaceDivision | null {
  const joined = `${cleanText(row.action)} ${cleanText(row.entity_type)}`.toLowerCase();
  if (joined.includes("marketplace")) return "marketplace";
  if (joined.includes("jobs")) return "jobs";
  if (joined.includes("property")) return "property";
  if (joined.includes("learn")) return "learn";
  if (joined.includes("studio")) return "studio";
  if (joined.includes("logistics")) return "logistics";
  return "care";
}

function olderThanHours(value: string | null | undefined, hours: number) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return false;
  return Date.now() - date.getTime() >= hours * 3_600_000;
}

function buildTask(input: WorkspaceTask) {
  return input;
}

function buildModuleInsight(
  id: string,
  title: string,
  summary: string,
  tone: WorkspaceInsight["tone"],
  evidence: string[],
  href?: string
) {
  return {
    id,
    title,
    summary,
    tone,
    evidence,
    href: href || null,
  } satisfies WorkspaceInsight;
}

async function safeSelect<T>(
  table: string,
  select: string,
  options?: {
    limit?: number;
    orderBy?: string;
    ascending?: boolean;
  }
) {
  try {
    const admin = createAdminSupabase();
    let query = admin.from(table).select(select);
    if (options?.orderBy) {
      query = query.order(options.orderBy, { ascending: options.ascending ?? false });
    }
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    const { data, error } = await query;
    if (error) return [] as T[];
    return (data ?? []) as T[];
  } catch {
    return [] as T[];
  }
}

async function safeCount(table: string) {
  try {
    const admin = createAdminSupabase();
    const { count, error } = await admin.from(table).select("*", { count: "exact", head: true });
    if (error) return null;
    return count ?? 0;
  } catch {
    return null;
  }
}

function buildCareModule(basePath: string, bookings: CareBookingRow[], inbox: ThreadRow[]) {
  const unresolved = bookings.filter((booking) => {
    const status = cleanText(booking.status).toLowerCase();
    return !["delivered", "cancelled", "archived"].includes(status);
  });
  const overdue = unresolved.filter(
    (booking) => booking.pickup_date && new Date(booking.pickup_date).getTime() < Date.now()
  );
  const stale = unresolved.filter((booking) => olderThanHours(booking.updated_at || booking.created_at, 24));
  const paymentReview = unresolved.filter((booking) =>
    ["pending", "receipt_submitted", "under_review"].includes(cleanText(booking.payment_status).toLowerCase())
  );
  const tasks = unique([
    ...overdue.map((booking) =>
      buildTask({
        id: `care-overdue-${booking.id}`,
        division: "care",
        title: booking.customer_name || booking.tracking_code || "Care booking needs intervention",
        summary: "Pickup or completion date has passed without a resolved service state.",
        queue: "Overdue bookings",
        href: workspaceHref(basePath, "/division/care"),
        status: "at_risk",
        priority: 98,
        dueLabel: booking.pickup_date,
        suggestedAction: "Reassign the booking owner, confirm pickup status, and update the customer timeline.",
        evidence: [booking.tracking_code ? `Tracking ${booking.tracking_code}` : "Missing tracking code"],
        createdAt: booking.updated_at || booking.created_at,
      })
    ),
    ...stale.slice(0, 4).map((booking) =>
      buildTask({
        id: `care-stale-${booking.id}`,
        division: "care",
        title: booking.customer_name || booking.tracking_code || "Care booking went quiet",
        summary: "No meaningful service movement has been recorded in the last 24 hours.",
        queue: "Stale care work",
        href: workspaceHref(basePath, "/division/care"),
        status: "stale",
        priority: 86,
        dueLabel: booking.pickup_date,
        suggestedAction: "Check route execution, confirm intake state, and log the next service step immediately.",
        evidence: [cleanText(booking.status) || "Unknown status"],
        createdAt: booking.updated_at || booking.created_at,
      })
    ),
  ]).slice(0, 8);
  const approvals = paymentReview.slice(0, 4).map((booking) =>
    buildTask({
      id: `care-payment-${booking.id}`,
      division: "care",
      title: booking.customer_name || booking.tracking_code || "Payment verification pending",
      summary: "Payment proof or booking payment status is still waiting for operator review.",
      queue: "Care finance review",
      href: workspaceHref(basePath, "/approvals"),
      status: "active",
      priority: 76,
      suggestedAction: "Validate payment proof and unlock the next service stage.",
      evidence: [cleanText(booking.payment_status) || "Payment status unavailable"],
      createdAt: booking.updated_at || booking.created_at,
    })
  );

  const queueLanes: WorkspaceQueueLane[] = [
    {
      id: "care-overdue",
      title: "Overdue",
      description: "Bookings past their promise window and still unresolved.",
      tone: "critical",
      items: tasks.filter((task) => task.id.startsWith("care-overdue")),
    },
    {
      id: "care-stale",
      title: "Stale",
      description: "Bookings with no fresh operational movement.",
      tone: "warning",
      items: tasks.filter((task) => task.id.startsWith("care-stale")),
    },
    {
      id: "care-payments",
      title: "Payment review",
      description: "Bookings waiting on payment confirmation before the next handoff.",
      tone: "info",
      items: approvals,
    },
  ];

  return {
    division: "care",
    label: "Care",
    tagline: "Bookings, assignments, support, and finance readiness.",
    description: "Premium garment and service operations with queue clarity across bookings, pickups, payments, and support.",
    readiness: "live",
    roles: [],
    metrics: [
      { label: "Active bookings", value: formatCount(unresolved.length), hint: "Care jobs still moving through execution." },
      { label: "Overdue", value: formatCount(overdue.length), hint: "Bookings that have breached their service date.", tone: overdue.length ? "warning" : "success" },
      { label: "Stale", value: formatCount(stale.length), hint: "Bookings without an update for 24h.", tone: stale.length ? "warning" : "success" },
      { label: "Payment review", value: formatCount(paymentReview.length), hint: "Bookings blocked on payment verification." },
    ],
    tasks,
    approvals,
    queueLanes,
    insights: [
      buildModuleInsight(
        "care-pressure",
        overdue.length > 0 ? "Care service pressure is elevated" : "Care queues are steady",
        overdue.length > 0
          ? `${formatCount(overdue.length)} overdue booking${overdue.length === 1 ? "" : "s"} need direct manager action.`
          : "No overdue care jobs are currently visible in the shared workspace.",
        overdue.length > 0 ? "warning" : "success",
        [
          `${formatCount(inbox.filter((thread) => cleanText(thread.division) === "care").length)} care support thread${
            inbox.filter((thread) => cleanText(thread.division) === "care").length === 1 ? "" : "s"
          } in the inbox`,
        ],
        workspaceHref(basePath, "/division/care")
      ),
    ],
    externalUrl: getDivisionUrl("care"),
  } satisfies DivisionWorkspaceModule;
}

function buildMarketplaceModule(
  basePath: string,
  applications: MarketplaceApplicationRow[],
  products: MarketplaceProductRow[],
  disputes: MarketplaceDisputeRow[],
  payouts: MarketplacePayoutRow[],
  orders: MarketplaceOrderRow[]
) {
  const pendingApplications = applications.filter((row) =>
    ["submitted", "under_review", "changes_requested"].includes(cleanText(row.status).toLowerCase())
  );
  const pendingProducts = products.filter((row) =>
    ["submitted", "under_review", "changes_requested"].includes(
      cleanText(row.approval_status).toLowerCase()
    )
  );
  const lowStock = products.filter((row) => Number(row.total_stock || 0) <= 5);
  const openDisputes = disputes.filter((row) => cleanText(row.status).toLowerCase() !== "resolved");
  const pendingPayouts = payouts.filter((row) => cleanText(row.status).toLowerCase() === "requested");
  const stalledOrders = orders.filter((row) =>
    ["placed", "awaiting_payment", "processing"].includes(cleanText(row.status).toLowerCase())
  );

  const tasks = [
    ...pendingApplications.slice(0, 3).map((row) =>
      buildTask({
        id: `marketplace-application-${row.id}`,
        division: "marketplace",
        title: row.store_name || "Seller application pending",
        summary: "A seller application still needs review or a clear decision.",
        queue: "Seller applications",
        href: workspaceHref(basePath, "/division/marketplace"),
        status: "active",
        priority: 82,
        suggestedAction: "Review trust notes, document gaps, and either approve or request targeted changes.",
        evidence: [cleanText(row.status) || "Unknown status"],
        createdAt: row.updated_at || row.submitted_at || new Date().toISOString(),
      })
    ),
    ...pendingProducts.slice(0, 3).map((row) =>
      buildTask({
        id: `marketplace-product-${row.id}`,
        division: "marketplace",
        title: row.title || "Catalog approval required",
        summary: "A product is waiting for moderation or merchandising review.",
        queue: "Product approvals",
        href: workspaceHref(basePath, "/approvals"),
        status: "active",
        priority: 80,
        suggestedAction: "Check listing clarity, trust signals, and stock readiness before approval.",
        evidence: [cleanText(row.approval_status) || "Unknown approval state"],
        createdAt: row.updated_at || new Date().toISOString(),
      })
    ),
    ...openDisputes.slice(0, 2).map((row) =>
      buildTask({
        id: `marketplace-dispute-${row.id}`,
        division: "marketplace",
        title: row.dispute_no || "Marketplace dispute open",
        summary: cleanText(row.reason) || "A dispute needs support and finance coordination.",
        queue: "Disputes",
        href: workspaceHref(basePath, "/inbox"),
        status: "at_risk",
        priority: 90,
        suggestedAction: "Check order evidence, confirm the resolution path, and align support with finance.",
        evidence: [cleanText(row.status) || "Unknown dispute state"],
        createdAt: row.updated_at || new Date().toISOString(),
      })
    ),
    ...pendingPayouts.slice(0, 2).map((row) =>
      buildTask({
        id: `marketplace-payout-${row.id}`,
        division: "marketplace",
        title: row.reference || "Vendor payout review",
        summary: "A vendor payout is queued for finance verification.",
        queue: "Payouts",
        href: workspaceHref(basePath, "/approvals"),
        status: "active",
        priority: 74,
        suggestedAction: "Verify settlement conditions, fraud flags, and release the decision.",
        evidence: [`Amount ${formatCount(Number(row.amount || 0))}`],
        createdAt: row.created_at || new Date().toISOString(),
      })
    ),
  ].slice(0, 10);

  const approvals = tasks.filter((task) =>
    ["marketplace-application", "marketplace-product", "marketplace-payout"].some((prefix) =>
      task.id.startsWith(prefix)
    )
  );

  return {
    division: "marketplace",
    label: "Marketplace",
    tagline: "Seller approvals, catalog control, disputes, and payouts.",
    description: "Operations across vendors, products, disputes, order pressure, and finance settlement.",
    readiness: "live",
    roles: [],
    metrics: [
      { label: "Pending sellers", value: formatCount(pendingApplications.length), hint: "Seller applications still awaiting review." },
      { label: "Pending products", value: formatCount(pendingProducts.length), hint: "Listings still in moderation or changes requested." },
      { label: "Open disputes", value: formatCount(openDisputes.length), hint: "Disputes requiring support or finance action.", tone: openDisputes.length ? "warning" : "success" },
      { label: "Low stock", value: formatCount(lowStock.length), hint: "Products that may create service or demand pressure." },
    ],
    tasks,
    approvals,
    queueLanes: [
      {
        id: "marketplace-approvals",
        title: "Approvals",
        description: "Seller, catalog, and payout approvals waiting on staff action.",
        tone: approvals.length ? "warning" : "success",
        items: approvals,
      },
      {
        id: "marketplace-orders",
        title: "Stalled orders",
        description: "Orders still sitting in payment or processing states.",
        tone: stalledOrders.length ? "warning" : "info",
        items: stalledOrders.slice(0, 4).map((row) =>
          buildTask({
            id: `marketplace-order-${row.id}`,
            division: "marketplace",
            title: row.order_no || "Marketplace order",
            summary: "The order still needs payment or fulfillment movement.",
            queue: "Orders",
            href: workspaceHref(basePath, "/queues"),
            status: "active",
            priority: 68,
            suggestedAction: "Confirm payment status, vendor handoff, and shipment readiness.",
            evidence: [cleanText(row.status) || "Unknown order status", cleanText(row.payment_status) || "Unknown payment status"],
            createdAt: row.placed_at || new Date().toISOString(),
          })
        ),
      },
      {
        id: "marketplace-disputes",
        title: "Risk",
        description: "Open disputes and support pressure that can hurt trust.",
        tone: openDisputes.length ? "critical" : "success",
        items: tasks.filter((task) => task.id.startsWith("marketplace-dispute")),
      },
    ],
    insights: [
      buildModuleInsight(
        "marketplace-bottleneck",
        approvals.length > 0 ? "Marketplace approvals are the bottleneck" : "Marketplace approvals are calm",
        approvals.length > 0
          ? `${formatCount(approvals.length)} approval decision${approvals.length === 1 ? "" : "s"} are sitting in the workflow.`
          : "No seller, catalog, or payout approvals are currently backlogged.",
        approvals.length > 0 ? "warning" : "success",
        [
          `${formatCount(openDisputes.length)} open dispute${openDisputes.length === 1 ? "" : "s"}`,
          `${formatCount(stalledOrders.length)} stalled order${stalledOrders.length === 1 ? "" : "s"}`,
        ],
        workspaceHref(basePath, "/division/marketplace")
      ),
    ],
    externalUrl: getDivisionUrl("marketplace"),
  } satisfies DivisionWorkspaceModule;
}

function buildActivityModule(
  division: WorkspaceDivision,
  basePath: string,
  activities: ActivityRow[],
  threads: ThreadRow[],
  notifications: NotificationRow[],
  readiness: DivisionWorkspaceModule["readiness"]
) {
  const config = getDivisionConfig(division);
  const openThreads = threads.filter((row) => cleanText(row.status).toLowerCase() !== "closed");
  const pendingActivities = activities.filter((row) =>
    !["completed", "closed", "resolved", "verified", "paid"].includes(cleanText(row.status).toLowerCase())
  );

  const tasks = [
    ...openThreads.slice(0, 4).map((row) =>
      buildTask({
        id: `${division}-thread-${row.id}`,
        division,
        title: row.subject,
        summary: cleanText(row.category) || "A shared support thread still needs a response.",
        queue: "Inbox",
        href: workspaceHref(basePath, "/inbox"),
        status: olderThanHours(row.updated_at, 24) ? "stale" : "active",
        priority: inferPriority(row.priority) === "critical" ? 92 : 70,
        suggestedAction: "Assign ownership, answer the open question, and move the thread to the next explicit state.",
        evidence: [cleanText(row.status) || "Unknown thread state"],
        createdAt: row.updated_at || row.created_at,
      })
    ),
    ...pendingActivities.slice(0, 4).map((row) =>
      buildTask({
        id: `${division}-activity-${row.id}`,
        division,
        title: cleanText(row.title) || `${config.name} activity`,
        summary: cleanText(row.description) || "A division workflow recorded activity that still needs attention.",
        queue: "Operations",
        href: workspaceHref(basePath, `/division/${division}`),
        status: olderThanHours(row.created_at, 48) ? "stale" : "active",
        priority: 66,
        suggestedAction: "Check the originating workflow, confirm ownership, and clear the next action.",
        evidence: [cleanText(row.activity_type) || "Unknown activity type", cleanText(row.status) || "Unknown status"],
        createdAt: row.created_at,
      })
    ),
  ].slice(0, 8);

  const approvals = pendingActivities
    .filter((row) =>
      ["proposal_ready", "verification", "submitted", "assigned"].some((key) =>
        cleanText(row.activity_type).toLowerCase().includes(key)
      )
    )
    .slice(0, 4)
    .map((row) =>
      buildTask({
        id: `${division}-approval-${row.id}`,
        division,
        title: cleanText(row.title) || `${config.shortName} review item`,
        summary: "A division workflow is waiting for a decision, assignment, or validation.",
        queue: "Approvals",
        href: workspaceHref(basePath, "/approvals"),
        status: "active",
        priority: 72,
        suggestedAction: "Review the evidence on the originating workflow and record the decision cleanly.",
        evidence: [cleanText(row.activity_type) || "Unknown activity type"],
        createdAt: row.created_at,
      })
    );

  const recentUnread = notifications.filter((row) => !row.is_read).length;
  const labels: Record<WorkspaceDivision, string> = {
    jobs: "recruitment threads",
    property: "listing and inquiry threads",
    learn: "academy signals",
    studio: "lead and proposal signals",
    logistics: "dispatch signals",
    care: "care signals",
    marketplace: "marketplace signals",
  };

  return {
    division,
    label: config.shortName,
    tagline: config.tagline,
    description: config.description,
    readiness,
    roles: [],
    metrics: [
      { label: "Workflow activity", value: formatCount(activities.length), hint: "Recorded operational events flowing through the shared platform." },
      { label: "Open threads", value: formatCount(openThreads.length), hint: `Unread or unresolved ${labels[division]}.` },
      { label: "Unread alerts", value: formatCount(recentUnread), hint: "Notifications still waiting on staff attention." },
      { label: "Pending actions", value: formatCount(tasks.length), hint: "Evidence-based next steps derived from activity and support state." },
    ],
    tasks,
    approvals,
    queueLanes: [
      {
        id: `${division}-inbox`,
        title: "Inbox",
        description: "Open support and coordination items tied to the division.",
        tone: openThreads.length ? "warning" : "success",
        items: tasks.filter((task) => task.id.includes("-thread-")),
      },
      {
        id: `${division}-ops`,
        title: "Operations",
        description: "Recent activity that still needs staff closure or follow-up.",
        tone: pendingActivities.length ? "info" : "success",
        items: tasks.filter((task) => task.id.includes("-activity-")),
      },
      {
        id: `${division}-approvals`,
        title: "Approvals",
        description: "Decision points, validations, or assignments queued inside the division.",
        tone: approvals.length ? "warning" : "success",
        items: approvals,
      },
    ],
    insights: [
      buildModuleInsight(
        `${division}-activity-health`,
        tasks.length > 0 ? `${config.shortName} has actionable work` : `${config.shortName} is calm`,
        tasks.length > 0
          ? `${formatCount(tasks.length)} next action${tasks.length === 1 ? "" : "s"} surfaced from live activity and support evidence.`
          : "No unresolved activity or thread pressure is currently visible for this division.",
        tasks.length > 0 ? "info" : "success",
        [
          `${formatCount(openThreads.length)} open thread${openThreads.length === 1 ? "" : "s"}`,
          `${formatCount(recentUnread)} unread notification${recentUnread === 1 ? "" : "s"}`,
        ],
        workspaceHref(basePath, `/division/${division}`)
      ),
    ],
    externalUrl: getDivisionUrl(division),
  } satisfies DivisionWorkspaceModule;
}

function buildLogisticsModule(basePath: string) {
  return {
    division: "logistics",
    label: "Logistics",
    tagline: "Dispatch, fleet, rider, support, and finance lanes are registered.",
    description: "The logistics workspace surface is registered centrally, but the shared shipment schema is not yet live in this Supabase project.",
    readiness: "planned",
    roles: [],
    metrics: [
      { label: "Dispatch queues", value: "0", hint: "No live logistics shipment schema detected yet." },
      { label: "Driver workload", value: "0", hint: "Driver/rider views are scaffolded but waiting on live data." },
      { label: "Finance review", value: "0", hint: "No live payout or expense feeds detected yet." },
      { label: "Support backlog", value: "0", hint: "Support lanes will light up once logistics events are flowing." },
    ],
    tasks: [],
    approvals: [],
    queueLanes: [
      {
        id: "logistics-planned",
        title: "Readiness",
        description: "The division module is pre-registered for dispatch, fleet, driver, support, and finance roles.",
        tone: "info",
        items: [],
      },
    ],
    insights: [
      buildModuleInsight(
        "logistics-readiness",
        "Logistics is registered but not hydrated",
        "The workspace can route logistics roles and navigation, but the live shipment tables are not present in the current shared Supabase project.",
        "warning",
        ["Create or apply the logistics migration set before expecting operational queues."],
        workspaceHref(basePath, "/division/logistics")
      ),
    ],
    externalUrl: getDivisionUrl("logistics"),
  } satisfies DivisionWorkspaceModule;
}

function buildInbox(
  viewer: WorkspaceViewer,
  basePath: string,
  notifications: NotificationRow[],
  threads: ThreadRow[]
) {
  const visible = new Set(viewer.divisions.map((membership) => membership.division));

  return [
    ...notifications
      .filter((row) => isWorkspaceDivision(row.division) && visible.has(row.division))
      .map(
        (row) =>
          ({
            id: `notification-${row.id}`,
            division: row.division as WorkspaceDivision,
            kind: "notification",
            title: row.title,
            summary: row.body,
            href: row.action_url || workspaceHref(basePath, `/division/${row.division}`),
            priority: inferPriority(row.priority),
            unread: !row.is_read,
            createdAt: row.created_at,
          }) satisfies WorkspaceInboxItem
      ),
    ...threads
      .filter((row) => isWorkspaceDivision(row.division) && visible.has(row.division))
      .map(
        (row) =>
          ({
            id: `thread-${row.id}`,
            division: row.division as WorkspaceDivision,
            kind: "thread",
            title: row.subject,
            summary: cleanText(row.category) || "Shared support thread",
            href: workspaceHref(basePath, "/inbox"),
            priority: inferPriority(row.priority),
            unread: cleanText(row.status).toLowerCase() !== "closed",
            createdAt: row.updated_at || row.created_at,
          }) satisfies WorkspaceInboxItem
      ),
  ]
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
    .slice(0, 24);
}

function buildHistory(basePath: string, audits: AuditRow[]) {
  return audits.slice(0, 20).map((row) =>
    buildTask({
      id: `audit-${row.id}`,
      division: inferDivisionFromAudit(row) || "care",
      title: cleanText(row.action) || "Audit event",
      summary: cleanText(row.reason) || cleanText(row.entity_type) || "Recorded audit trail",
      queue: "History",
      href: workspaceHref(basePath, "/archive"),
      status: "resolved",
      priority: 10,
      suggestedAction: "Review the audit trail if you need the exact before/after change context.",
      evidence: [cleanText(row.entity_type) || "Unknown entity", cleanText(row.actor_role) || "Unknown actor role"],
      createdAt: row.created_at,
    })
  );
}

function buildTrends(activities: ActivityRow[]) {
  const now = Date.now();
  const windowMs = 7 * 24 * 3_600_000;
  const divisions: WorkspaceDivision[] = ["care", "marketplace", "studio", "jobs", "property", "learn", "logistics"];

  return divisions
    .map((division) => {
      const current = activities.filter(
        (row) =>
          row.division === division &&
          now - new Date(row.created_at).getTime() <= windowMs
      ).length;
      const previous = activities.filter((row) => {
        if (row.division !== division) return false;
        const age = now - new Date(row.created_at).getTime();
        return age > windowMs && age <= windowMs * 2;
      }).length;
      return {
        label: getDivisionConfig(division).shortName,
        current,
        previous,
        delta: current - previous,
      } satisfies WorkspaceTrend;
    })
    .filter((trend) => trend.current > 0 || trend.previous > 0);
}

export async function getWorkspaceSnapshot(
  viewer: WorkspaceViewer,
  basePath: string
): Promise<WorkspaceSnapshot> {
  const visibleDivisions = unique(viewer.divisions.map((membership) => membership.division));
  const [
    notifications,
    threads,
    activities,
    audits,
    careBookings,
    marketplaceApplications,
    marketplaceProducts,
    marketplaceDisputes,
    marketplacePayouts,
    marketplaceOrders,
    studioProjectsCount,
    learnCoursesCount,
    propertyListingsCount,
  ] = await Promise.all([
    safeSelect<NotificationRow>(
      "customer_notifications",
      "id, title, body, priority, action_url, division, is_read, created_at",
      { orderBy: "created_at", limit: 80 }
    ),
    safeSelect<ThreadRow>(
      "support_threads",
      "id, subject, division, category, status, priority, reference_type, reference_id, created_at, updated_at",
      { orderBy: "updated_at", limit: 80 }
    ),
    safeSelect<ActivityRow>(
      "customer_activity",
      "id, division, activity_type, title, description, status, reference_type, reference_id, action_url, created_at",
      { orderBy: "created_at", limit: 220 }
    ),
    safeSelect<AuditRow>(
      "audit_logs",
      "id, action, entity_type, entity_id, actor_role, reason, created_at",
      { orderBy: "created_at", limit: 80 }
    ),
    safeSelect<CareBookingRow>(
      "care_bookings",
      "id, tracking_code, customer_name, status, pickup_date, payment_status, created_at, updated_at",
      { orderBy: "created_at", limit: 120 }
    ),
    safeSelect<MarketplaceApplicationRow>(
      "marketplace_vendor_applications",
      "id, store_name, status, submitted_at, updated_at",
      { orderBy: "updated_at", limit: 80 }
    ),
    safeSelect<MarketplaceProductRow>(
      "marketplace_products",
      "id, title, approval_status, total_stock, updated_at",
      { orderBy: "updated_at", limit: 120 }
    ),
    safeSelect<MarketplaceDisputeRow>(
      "marketplace_disputes",
      "id, dispute_no, status, reason, updated_at",
      { orderBy: "updated_at", limit: 60 }
    ),
    safeSelect<MarketplacePayoutRow>(
      "marketplace_payout_requests",
      "id, reference, status, amount, created_at",
      { orderBy: "created_at", limit: 60 }
    ),
    safeSelect<MarketplaceOrderRow>(
      "marketplace_orders",
      "id, order_no, status, payment_status, placed_at",
      { orderBy: "placed_at", limit: 80 }
    ),
    safeCount("studio_projects"),
    safeCount("learn_courses"),
    safeCount("property_listings"),
  ]);

  const divisionActivity = (division: WorkspaceDivision) =>
    activities.filter((row) => cleanText(row.division).toLowerCase() === division);
  const divisionThreads = (division: WorkspaceDivision) =>
    threads.filter((row) => cleanText(row.division).toLowerCase() === division);
  const divisionNotifications = (division: WorkspaceDivision) =>
    notifications.filter((row) => cleanText(row.division).toLowerCase() === division);

  const moduleMap = new Map<WorkspaceDivision, DivisionWorkspaceModule>();

  if (visibleDivisions.includes("care")) {
    moduleMap.set("care", buildCareModule(basePath, careBookings, threads));
  }

  if (visibleDivisions.includes("marketplace")) {
    moduleMap.set(
      "marketplace",
      buildMarketplaceModule(
        basePath,
        marketplaceApplications,
        marketplaceProducts,
        marketplaceDisputes,
        marketplacePayouts,
        marketplaceOrders
      )
    );
  }

  if (visibleDivisions.includes("studio")) {
    moduleMap.set(
      "studio",
      buildActivityModule(
        "studio",
        basePath,
        divisionActivity("studio"),
        divisionThreads("studio"),
        divisionNotifications("studio"),
        studioProjectsCount == null ? "partial" : "live"
      )
    );
  }

  if (visibleDivisions.includes("jobs")) {
    moduleMap.set(
      "jobs",
      buildActivityModule(
        "jobs",
        basePath,
        divisionActivity("jobs"),
        divisionThreads("jobs"),
        divisionNotifications("jobs"),
        "live"
      )
    );
  }

  if (visibleDivisions.includes("property")) {
    moduleMap.set(
      "property",
      buildActivityModule(
        "property",
        basePath,
        divisionActivity("property"),
        divisionThreads("property"),
        divisionNotifications("property"),
        propertyListingsCount == null ? "partial" : "live"
      )
    );
  }

  if (visibleDivisions.includes("learn")) {
    moduleMap.set(
      "learn",
      buildActivityModule(
        "learn",
        basePath,
        divisionActivity("learn"),
        divisionThreads("learn"),
        divisionNotifications("learn"),
        learnCoursesCount == null ? "partial" : "live"
      )
    );
  }

  if (visibleDivisions.includes("logistics")) {
    moduleMap.set("logistics", buildLogisticsModule(basePath));
  }

  const modules = visibleDivisions
    .map((division) => moduleMap.get(division))
    .filter(Boolean) as DivisionWorkspaceModule[];

  for (const module of modules) {
    module.roles =
      viewer.divisions.find((membership) => membership.division === module.division)?.roles ?? [];
  }

  const tasks = modules
    .flatMap((module) => module.tasks)
    .sort((left, right) => right.priority - left.priority);
  const approvals = modules
    .flatMap((module) => module.approvals)
    .sort((left, right) => right.priority - left.priority);
  const inbox = buildInbox(viewer, basePath, notifications, threads);
  const trends = buildTrends(activities.filter((row) => isWorkspaceDivision(row.division)));
  const history = buildHistory(basePath, audits);
  const insights = [
    ...modules.flatMap((module) => module.insights),
    buildModuleInsight(
      "workspace-next",
      tasks.length > 0 ? "Recommended next actions are grounded in live queues" : "The workspace is calm",
      tasks.length > 0
        ? `Top priority right now: ${tasks[0].title}.`
        : "No unresolved queue pressure, approvals, or critical inbox items are currently surfaced.",
      tasks.length > 0 ? "info" : "success",
      tasks.slice(0, 3).map((task) => `${getDivisionConfig(task.division).shortName}: ${task.queue}`)
    ),
    buildModuleInsight(
      "workspace-bottleneck",
      approvals.length > 0 ? "Approval queues are the main bottleneck" : "Approval queues are controlled",
      approvals.length > 0
        ? `${formatCount(approvals.length)} approval decision${approvals.length === 1 ? "" : "s"} still need staff action.`
        : "No major cross-division approval bottleneck is currently visible.",
      approvals.length > 0 ? "warning" : "success",
      approvals.slice(0, 3).map((task) => task.title)
    ),
  ];

  return {
    generatedAt: new Date().toISOString(),
    summaryMetrics: [
      { label: "Assigned divisions", value: formatCount(modules.length), hint: "Role-aware division modules currently visible to this staff member." },
      { label: "Active workload", value: formatCount(tasks.length), hint: "Evidence-based next actions across visible divisions." },
      { label: "Pending approvals", value: formatCount(approvals.length), hint: "Decision points waiting for review or release." },
      { label: "Unread inbox", value: formatCount(inbox.filter((item) => item.unread).length), hint: "Notifications and threads still awaiting a pass." },
    ],
    modules,
    tasks,
    approvals,
    inbox,
    insights,
    trends,
    history,
  };
}
