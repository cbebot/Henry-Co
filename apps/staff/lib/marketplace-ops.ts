import "server-only";

import { getDivisionUrl } from "@henryco/config";
import { createStaffAdminSupabase } from "@/lib/supabase/admin";
import type { OpsLink, OpsMetric, OpsQueueItem, OpsTone } from "@/lib/ops-types";

type VendorApplicationRow = {
  id: string;
  store_name: string | null;
  status: string | null;
  category_focus: string | null;
  submitted_at: string | null;
  updated_at: string | null;
};

type ProductRow = {
  id: string;
  title: string | null;
  approval_status: string | null;
  total_stock: number | null;
  currency: string | null;
  updated_at: string | null;
};

type DisputeRow = {
  id: string;
  dispute_no: string | null;
  status: string | null;
  reason: string | null;
  refund_amount: number | null;
  updated_at: string | null;
};

type PayoutRow = {
  id: string;
  reference: string | null;
  status: string | null;
  amount: number | null;
  created_at: string | null;
  updated_at: string | null;
  reviewed_at: string | null;
};

type OrderRow = {
  id: string;
  order_no: string | null;
  status: string | null;
  payment_status: string | null;
  placed_at: string | null;
};

type PaymentRow = {
  id: string;
  order_no: string | null;
  status: string | null;
  method: string | null;
  amount: number | null;
  created_at: string | null;
};

type ReviewRow = {
  id: string;
  status: string | null;
  is_verified_purchase: boolean | null;
  rating: number | null;
  title: string | null;
  created_at: string | null;
};

type NotificationRow = {
  id: string;
  channel: string | null;
  status: string | null;
  template_key: string | null;
  last_error: string | null;
  created_at: string | null;
};

export type MarketplaceOpsSnapshot = {
  summary: string;
  metrics: OpsMetric[];
  sellerQueue: OpsQueueItem[];
  financeQueue: OpsQueueItem[];
  alerts: OpsQueueItem[];
  dailyBriefs: string[];
  weeklyBriefs: string[];
  links: OpsLink[];
};

function asText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function asNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function hoursSince(value: string | null | undefined) {
  const parsed = new Date(String(value || ""));
  if (Number.isNaN(parsed.getTime())) return Number.POSITIVE_INFINITY;
  return (Date.now() - parsed.getTime()) / 36e5;
}

function humanize(value: string | null | undefined, fallback: string) {
  const normalized = asText(value);
  if (!normalized) return fallback;
  return normalized
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function toneForStatus(status: string) {
  const normalized = asText(status).toLowerCase();
  if (["failed", "rejected", "frozen", "investigating", "disputed"].includes(normalized)) {
    return "critical" as const;
  }
  if (["submitted", "under_review", "requested", "receipt_submitted", "queued"].includes(normalized)) {
    return "warning" as const;
  }
  if (["approved", "published", "released", "verified", "resolved"].includes(normalized)) {
    return "success" as const;
  }
  return "info" as const;
}

function buildQueueItem(input: {
  id: string;
  title: string;
  detail: string;
  href: string;
  actionLabel: string;
  ownerRole: string;
  statusLabel: string;
  tone: OpsTone;
  meta?: string | null;
}) {
  return input satisfies OpsQueueItem;
}

export async function getMarketplaceOpsSnapshot(): Promise<MarketplaceOpsSnapshot> {
  const admin = createStaffAdminSupabase();
  const marketRoot = getDivisionUrl("marketplace");
  const [
    applicationsRes,
    productsRes,
    disputesRes,
    payoutsRes,
    ordersRes,
    paymentsRes,
    reviewsRes,
    notificationsRes,
  ] = await Promise.all([
    admin
      .from("marketplace_vendor_applications")
      .select("id, store_name, status, category_focus, submitted_at, updated_at")
      .order("updated_at", { ascending: false })
      .limit(80),
    admin
      .from("marketplace_products")
      .select("id, title, approval_status, total_stock, currency, updated_at")
      .order("updated_at", { ascending: false })
      .limit(120),
    admin
      .from("marketplace_disputes")
      .select("id, dispute_no, status, reason, refund_amount, updated_at")
      .order("updated_at", { ascending: false })
      .limit(80),
    admin
      .from("marketplace_payout_requests")
      .select("id, reference, status, amount, created_at, updated_at, reviewed_at")
      .order("created_at", { ascending: false })
      .limit(80),
    admin
      .from("marketplace_orders")
      .select("id, order_no, status, payment_status, placed_at")
      .order("placed_at", { ascending: false })
      .limit(120),
    admin
      .from("marketplace_payment_records")
      .select("id, order_no, status, method, amount, created_at")
      .order("created_at", { ascending: false })
      .limit(80),
    admin
      .from("marketplace_reviews")
      .select("id, status, is_verified_purchase, rating, title, created_at")
      .order("created_at", { ascending: false })
      .limit(80),
    admin
      .from("marketplace_notification_queue")
      .select("id, channel, status, template_key, last_error, created_at")
      .order("created_at", { ascending: false })
      .limit(120),
  ]);

  const applications = (applicationsRes.data ?? []) as VendorApplicationRow[];
  const products = (productsRes.data ?? []) as ProductRow[];
  const disputes = (disputesRes.data ?? []) as DisputeRow[];
  const payouts = (payoutsRes.data ?? []) as PayoutRow[];
  const orders = (ordersRes.data ?? []) as OrderRow[];
  const payments = (paymentsRes.data ?? []) as PaymentRow[];
  const reviews = (reviewsRes.data ?? []) as ReviewRow[];
  const notifications = (notificationsRes.data ?? []) as NotificationRow[];

  const sellerQueue = [
    ...applications
      .filter((row) => ["submitted", "under_review", "changes_requested"].includes(asText(row.status).toLowerCase()))
      .map((row) =>
        buildQueueItem({
          id: `application-${row.id}`,
          title: asText(row.store_name) || "Seller application",
          detail:
            asText(row.category_focus) ||
            `${humanize(row.status, "Submitted")} seller onboarding request still needs operator action.`,
          href: `${marketRoot}/admin/seller-applications`,
          actionLabel: "Review seller",
          ownerRole: "Marketplace admin",
          statusLabel: humanize(row.status, "Submitted"),
          tone: toneForStatus(asText(row.status)),
          meta: `${Math.round(hoursSince(row.updated_at || row.submitted_at))}h in queue`,
        })
      ),
    ...products
      .filter((row) => ["submitted", "under_review", "changes_requested"].includes(asText(row.approval_status).toLowerCase()))
      .map((row) =>
        buildQueueItem({
          id: `product-${row.id}`,
          title: asText(row.title) || "Listing review",
          detail: `Catalog approval state is ${humanize(row.approval_status, "Under review")} and still needs moderation action.`,
          href: `${marketRoot}/moderation/product-approvals`,
          actionLabel: "Review listing",
          ownerRole: "Catalog moderation",
          statusLabel: humanize(row.approval_status, "Under review"),
          tone: toneForStatus(asText(row.approval_status)),
          meta: `${Math.round(hoursSince(row.updated_at))}h in current approval state`,
        })
      ),
  ]
    .sort((left, right) => {
      const leftCritical = left.tone === "critical" ? 1 : 0;
      const rightCritical = right.tone === "critical" ? 1 : 0;
      return rightCritical - leftCritical;
    })
    .slice(0, 10);

  const financeQueue = [
    ...payments
      .filter((row) => ["pending", "receipt_submitted"].includes(asText(row.status).toLowerCase()))
      .map((row) =>
        buildQueueItem({
          id: `payment-${row.id}`,
          title: asText(row.order_no) || "Payment verification",
          detail: `${humanize(row.method, "Payment")} proof still needs finance confirmation before order confidence improves.`,
          href: `${marketRoot}/finance/payment-verification`,
          actionLabel: "Verify payment",
          ownerRole: "Finance",
          statusLabel: humanize(row.status, "Pending"),
          tone: toneForStatus(asText(row.status)),
          meta: `NGN ${asNumber(row.amount).toLocaleString()} · ${Math.round(hoursSince(row.created_at))}h old`,
        })
      ),
    ...payouts
      .filter((row) => ["requested", "approved"].includes(asText(row.status).toLowerCase()))
      .map((row) =>
        buildQueueItem({
          id: `payout-${row.id}`,
          title: asText(row.reference) || "Payout request",
          detail: `${humanize(row.status, "Requested")} payout still needs explicit finance handling.`,
          href: `${marketRoot}/finance/payouts`,
          actionLabel: "Review payout",
          ownerRole: "Finance",
          statusLabel: humanize(row.status, "Requested"),
          tone: toneForStatus(asText(row.status)),
          meta: `NGN ${asNumber(row.amount).toLocaleString()} · ${Math.round(hoursSince(row.updated_at || row.created_at))}h old`,
        })
      ),
    ...disputes
      .filter((row) => ["open", "investigating"].includes(asText(row.status).toLowerCase()))
      .map((row) =>
        buildQueueItem({
          id: `dispute-${row.id}`,
          title: asText(row.dispute_no) || "Dispute case",
          detail: asText(row.reason) || "Dispute case still needs a support or finance resolution path.",
          href: `${marketRoot}/support/disputes`,
          actionLabel: "Resolve dispute",
          ownerRole: "Support / finance",
          statusLabel: humanize(row.status, "Open"),
          tone: toneForStatus(asText(row.status)),
          meta: `${Math.round(hoursSince(row.updated_at))}h since dispute movement`,
        })
      ),
  ].slice(0, 10);

  const failedNotifications = notifications.filter((row) => asText(row.status).toLowerCase() === "failed");
  const staleOrders = orders.filter((row) =>
    ["placed", "awaiting_payment", "processing"].includes(asText(row.status).toLowerCase())
  );
  const pendingReviews = reviews.filter((row) => asText(row.status).toLowerCase() === "pending");
  const unverifiedPendingReviews = pendingReviews.filter((row) => !row.is_verified_purchase);
  const lowStockProducts = products.filter((row) => asNumber(row.total_stock) <= 5);

  const alerts: OpsQueueItem[] = [
    ...failedNotifications.slice(0, 3).map((row) =>
      buildQueueItem({
        id: `notification-${row.id}`,
        title: asText(row.template_key) || "Failed marketplace notification",
        detail: asText(row.last_error) || "Notification delivery failed and now needs owner-visible recovery.",
        href: `${marketRoot}/owner/alerts`,
        actionLabel: "Open owner alerts",
        ownerRole: "Owner / operations",
        statusLabel: "Delivery failed",
        tone: "critical",
        meta: `${humanize(row.channel, "Notification")} · ${Math.round(hoursSince(row.created_at))}h old`,
      })
    ),
    ...(unverifiedPendingReviews.length
      ? [
          buildQueueItem({
            id: "pending-review-authenticity",
            title: `${unverifiedPendingReviews.length} pending unverified reviews`,
            detail: "Review authenticity is waiting on moderation and should not flow into seller trust until verified or approved deliberately.",
            href: `${marketRoot}/moderation/reviews`,
            actionLabel: "Review authenticity queue",
            ownerRole: "Moderation",
            statusLabel: "Authenticity risk",
            tone: "warning",
          }),
        ]
      : []),
    ...(staleOrders.length
      ? [
          buildQueueItem({
            id: "stalled-order-pressure",
            title: `${staleOrders.length} stalled order states`,
            detail: "Orders are still sitting in placed/awaiting-payment/processing states and should stay owner-visible before buyer trust degrades.",
            href: `${marketRoot}/owner/alerts`,
            actionLabel: "Inspect order pressure",
            ownerRole: "Operations / owner",
            statusLabel: "Queue age risk",
            tone: "warning",
          }),
        ]
      : []),
    ...(lowStockProducts.length
      ? [
          buildQueueItem({
            id: "low-stock-watch",
            title: `${lowStockProducts.length} low-stock listings`,
            detail: "Low stock is not a trust incident by itself, but it becomes one when oversell or delayed fulfillment starts to spill into disputes.",
            href: `${marketRoot}/operations/orders`,
            actionLabel: "Inspect operations lane",
            ownerRole: "Operations",
            statusLabel: "Capacity watch",
            tone: "info",
          }),
        ]
      : []),
  ].slice(0, 8);

  const metrics: OpsMetric[] = [
    {
      label: "Seller queue",
      value: String(sellerQueue.length),
      hint: "Seller applications and listing approvals still requiring action.",
    },
    {
      label: "Finance queue",
      value: String(financeQueue.length),
      hint: "Payment verification, disputes, and payout decisions still pending.",
    },
    {
      label: "Owner alerts",
      value: String(alerts.length),
      hint: "Notification failures, review-authenticity risk, and stale order pressure.",
    },
    {
      label: "Pending review authenticity",
      value: String(unverifiedPendingReviews.length),
      hint: "Unverified reviews waiting for moderation rather than inflating trust instantly.",
    },
  ];

  const dailyBriefs = [
    `${applications.filter((row) => ["submitted", "under_review", "changes_requested"].includes(asText(row.status).toLowerCase())).length} seller applications still need review.`,
    `${payments.filter((row) => ["pending", "receipt_submitted"].includes(asText(row.status).toLowerCase())).length} payment records are waiting for finance confirmation.`,
    failedNotifications.length
      ? `${failedNotifications.length} marketplace notifications failed and are now owner-visible.`
      : "No failed marketplace notification was visible in the latest queue slice.",
  ];

  const weeklyBriefs = [
    `${pendingReviews.length} review rows remain pending; ${unverifiedPendingReviews.length} of them are still unverified and should stay outside seller-score lift until moderation clears them.`,
    staleOrders.length
      ? `${staleOrders.length} orders are still parked in pre-fulfillment states and should stay under operations watch.`
      : "No order sat in a visible stalled state in the latest snapshot.",
    lowStockProducts.length
      ? `${lowStockProducts.length} listings are running low on stock and may create avoidable support pressure if operators ignore them.`
      : "Low-stock exposure is currently low in the latest product slice.",
  ];

  return {
    summary:
      "Marketplace HQ now surfaces the real seller, moderation, finance, dispute, and owner-alert queues that already exist in production. The goal is direct actionability and trust visibility, not another passive admin shell.",
    metrics,
    sellerQueue,
    financeQueue,
    alerts,
    dailyBriefs,
    weeklyBriefs,
    links: [
      {
        href: `${marketRoot}/admin/seller-applications`,
        label: "Seller applications",
        description: "Approve, request changes, or reject seller onboarding.",
      },
      {
        href: `${marketRoot}/moderation/product-approvals`,
        label: "Product approvals",
        description: "Review listing quality, catalog safety, and publication state.",
      },
      {
        href: `${marketRoot}/support/disputes`,
        label: "Dispute desk",
        description: "Resolve buyer and seller disputes with a logged outcome.",
      },
      {
        href: `${marketRoot}/finance/payment-verification`,
        label: "Payment verification",
        description: "Confirm payment proofs before orders move forward.",
      },
      {
        href: `${marketRoot}/finance/payouts`,
        label: "Payout review",
        description: "Approve, freeze, release, or reject payout requests.",
      },
      {
        href: `${marketRoot}/owner/alerts`,
        label: "Owner alerts",
        description: "Review failed notifications, stalled orders, and trust anomalies.",
      },
    ],
  };
}
