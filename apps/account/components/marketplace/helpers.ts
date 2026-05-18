import { translateSurfaceLabel, type AppLocale } from "@henryco/i18n";

const SHORT_MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export function formatStamp(iso: string | null | undefined, dash: string = "—"): string {
  if (!iso) return dash;
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return dash;
  const d = new Date(ms);
  return `${d.getUTCDate().toString().padStart(2, "0")} ${SHORT_MONTHS[d.getUTCMonth()]}`;
}

const NF = new Intl.NumberFormat("en-NG", { maximumFractionDigits: 0 });

export function formatNaira(amount: number | null | undefined): string {
  const n = Number(amount);
  if (!Number.isFinite(n) || n <= 0) return "—";
  return `₦${NF.format(n)}`;
}

/* ---- Domain rows -------------------------------------------------- */

export type OrderRow = {
  id: string;
  orderNo: string | null;
  status: string | null;
  paymentStatus: string | null;
  grandTotal: number;
  placedAt: string | null;
};

export type DisputeRow = {
  id: string;
  disputeNo: string | null;
  status: string | null;
  orderNo: string | null;
  updatedAt: string | null;
};

export type ApplicationRow = {
  id: string | null;
  status: string | null;
  storeName: string | null;
  submittedAt: string | null;
  reviewNote: string | null;
} | null;

export type MembershipRow = {
  role: string | null;
  scopeType: string | null;
  scopeId: string | null;
  isActive: boolean;
};

export type PayoutRow = {
  id: string;
  reference: string | null;
  amount: number;
  status: string | null;
  createdAt: string | null;
};

/* Status kind for visual tinting */
export type OrderKind = "in-flight" | "delivered" | "issue" | "scheduled" | "draft";

const COMPLETED_ORDER = new Set(["delivered", "completed", "customer_confirmed", "fulfilled"]);
const ISSUE_ORDER = new Set(["cancelled", "refunded", "disputed", "exception"]);
const SCHEDULED_ORDER = new Set(["placed", "paid", "awaiting_fulfilment", "confirmed", "queued"]);

export function orderKind(order: OrderRow): OrderKind {
  const s = String(order.status || "").toLowerCase();
  if (COMPLETED_ORDER.has(s)) return "delivered";
  if (ISSUE_ORDER.has(s)) return "issue";
  if (SCHEDULED_ORDER.has(s)) return "scheduled";
  if (!s) return "draft";
  return "in-flight";
}

export function orderStatusLabel(
  order: OrderRow,
  opts?: {
    statusValueLabels?: Record<string, string>;
    fallbackDraft?: string;
    locale?: AppLocale;
  },
): string {
  const s = String(order.status || "").trim();
  if (!s) {
    const fallback = opts?.fallbackDraft ?? "Draft";
    return opts?.locale ? translateSurfaceLabel(opts.locale, fallback) : fallback;
  }
  const key = s.toLowerCase();
  const mapped = opts?.statusValueLabels?.[key];
  if (mapped) return opts?.locale ? translateSurfaceLabel(opts.locale, mapped) : mapped;
  const titled = s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return opts?.locale ? translateSurfaceLabel(opts.locale, titled) : titled;
}

export type DisputeKind = "open" | "resolving" | "resolved";

export function disputeKind(d: DisputeRow): DisputeKind {
  const s = String(d.status || "").toLowerCase();
  if (["open", "filed", "evidence_required"].includes(s)) return "open";
  if (["under_review", "in_review", "investigating", "responded"].includes(s)) return "resolving";
  return "resolved";
}

export type PayoutKind = "pending" | "paid" | "rejected";

export function payoutKind(p: PayoutRow): PayoutKind {
  const s = String(p.status || "").toLowerCase();
  if (["paid", "settled", "completed"].includes(s)) return "paid";
  if (["rejected", "cancelled", "failed"].includes(s)) return "rejected";
  return "pending";
}

/* ---- Aggregate stats --------------------------------------------- */

export type MarketStats = {
  totalOrders: number;
  inFlight: number;
  delivered: number;
  issueOrders: number;
  openDisputes: number;
  resolvingDisputes: number;
  payoutsPending: number;
  payoutsPaid: number;
  payoutsPendingKobo: number;
  sellerActive: boolean;
  applicationStatus: string | null;
  storeName: string | null;
  totalSpentKobo: number;
};

export function marketStats(args: {
  orders: ReadonlyArray<OrderRow>;
  disputes: ReadonlyArray<DisputeRow>;
  application: ApplicationRow;
  memberships: ReadonlyArray<MembershipRow>;
  payouts: ReadonlyArray<PayoutRow>;
}): MarketStats {
  let inFlight = 0;
  let delivered = 0;
  let issueOrders = 0;
  let totalSpentKobo = 0;
  for (const order of args.orders) {
    const k = orderKind(order);
    if (k === "delivered") delivered += 1;
    else if (k === "issue") issueOrders += 1;
    else inFlight += 1;
    if (k === "delivered" || k === "in-flight" || k === "scheduled") {
      totalSpentKobo += Math.max(0, order.grandTotal);
    }
  }

  let openDisputes = 0;
  let resolvingDisputes = 0;
  for (const d of args.disputes) {
    const k = disputeKind(d);
    if (k === "open") openDisputes += 1;
    else if (k === "resolving") resolvingDisputes += 1;
  }

  let payoutsPending = 0;
  let payoutsPaid = 0;
  let payoutsPendingKobo = 0;
  for (const p of args.payouts) {
    const k = payoutKind(p);
    if (k === "pending") {
      payoutsPending += 1;
      payoutsPendingKobo += Math.max(0, p.amount);
    } else if (k === "paid") payoutsPaid += 1;
  }

  const sellerActive = args.memberships.some(
    (m) => String(m.role || "").toLowerCase() === "vendor" && m.isActive,
  );
  const application = args.application;

  return {
    totalOrders: args.orders.length,
    inFlight,
    delivered,
    issueOrders,
    openDisputes,
    resolvingDisputes,
    payoutsPending,
    payoutsPaid,
    payoutsPendingKobo,
    sellerActive,
    applicationStatus: application ? application.status : null,
    storeName: application ? application.storeName : null,
    totalSpentKobo,
  };
}

/* ---- Hero state + copy -------------------------------------------- */

export type HeroState = "empty" | "calm" | "active" | "attention";

export function heroState(stats: MarketStats): HeroState {
  if (stats.totalOrders === 0 && !stats.sellerActive && !stats.applicationStatus) return "empty";
  if (stats.openDisputes > 0 || stats.issueOrders > 0) return "attention";
  if (stats.inFlight > 0 || stats.payoutsPending > 0) return "active";
  return "calm";
}

export type HeroCopy = {
  headline: string;
  blurb: string;
  ctaPrimary: { label: string; href: string };
  ctaSecondary: { label: string; href: string };
};

export function buildHeroCopy(
  state: HeroState,
  stats: MarketStats,
  marketplaceOrigin: string,
  locale?: AppLocale,
): HeroCopy {
  const t = (text: string) => (locale ? translateSurfaceLabel(locale, text) : text);
  if (state === "empty") {
    return {
      headline: t("Start shopping on HenryCo Marketplace."),
      blurb: t("Orders, disputes, seller activity, and payouts mirror into this room as soon as you transact. Browse the marketplace to get the first one rolling."),
      ctaPrimary: { label: t("Open marketplace"), href: marketplaceOrigin },
      ctaSecondary: { label: t("Apply to sell"), href: `${marketplaceOrigin}/sell` },
    };
  }
  if (state === "attention") {
    const n = stats.openDisputes + stats.issueOrders;
    return {
      headline: `${n} ${n === 1 ? t("matter") : t("matters")} ${t("need attention.")}`,
      blurb: t("Disputes and exception orders sit at the top of the queue. Open the case to add evidence or accept resolution."),
      ctaPrimary: { label: t("Review matters"), href: "#marketplace-matters" },
      ctaSecondary: { label: t("Open marketplace"), href: marketplaceOrigin },
    };
  }
  if (state === "active") {
    if (stats.payoutsPending > 0 && stats.inFlight === 0) {
      return {
        headline: `${stats.payoutsPending} ${stats.payoutsPending === 1 ? t("payout") : t("payouts")} ${t("in review.")}`,
        blurb: t("Vendor payout requests are moving through finance verification. Status updates appear here as the team progresses each request."),
        ctaPrimary: { label: t("Open seller workspace"), href: `${marketplaceOrigin}/seller` },
        ctaSecondary: { label: t("Open marketplace"), href: marketplaceOrigin },
      };
    }
    return {
      headline: `${stats.inFlight} ${stats.inFlight === 1 ? t("order") : t("orders")} ${t("in motion.")}`,
      blurb: t("Live order status, payment state, and seller follow-up mirror into this room from HenryCo Marketplace in real time."),
      ctaPrimary: { label: t("Open marketplace"), href: marketplaceOrigin },
      ctaSecondary: { label: t("Apply to sell"), href: `${marketplaceOrigin}/sell` },
    };
  }
  return {
    headline: stats.sellerActive
      ? `${stats.totalOrders} ${stats.totalOrders === 1 ? t("order") : t("orders")} ${t("· seller active.")}`
      : `${stats.totalOrders} ${stats.totalOrders === 1 ? t("order") : t("orders")} ${t("on record.")}`,
    blurb: t("All your marketplace activity in one room — buyer orders, seller payouts, dispute outcomes, and the latest status from every store."),
    ctaPrimary: { label: t("Open marketplace"), href: marketplaceOrigin },
    ctaSecondary: stats.sellerActive
      ? { label: t("Open seller workspace"), href: `${marketplaceOrigin}/seller` }
      : { label: t("Apply to sell"), href: `${marketplaceOrigin}/sell` },
  };
}

/* ---- Activity rows ------------------------------------------------ */

export type MarketActivityRow = {
  id: string;
  activityType: string | null;
  title: string | null;
  description: string | null;
  status: string | null;
  occurredAt: string;
  actionUrl: string | null;
};

export function toMarketActivityRows(
  raw: ReadonlyArray<Record<string, unknown>>,
): MarketActivityRow[] {
  return raw.map((row, idx) => ({
    id: String(row.id || `${row.activity_type || "mkt"}-${idx}`),
    activityType: row.activity_type ? String(row.activity_type) : null,
    title: row.title ? String(row.title) : null,
    description: row.description ? String(row.description) : null,
    status: row.status ? String(row.status) : null,
    occurredAt: String(row.created_at || ""),
    actionUrl: row.action_url ? String(row.action_url) : null,
  }));
}

/* ---- Row mappers from raw Supabase shape -------------------------- */

export function toOrderRows(raw: ReadonlyArray<Record<string, unknown>>): OrderRow[] {
  return raw.map((row, idx) => ({
    id: String(row.id || `order-${idx}`),
    orderNo: row.order_no ? String(row.order_no) : null,
    status: row.status ? String(row.status) : null,
    paymentStatus: row.payment_status ? String(row.payment_status) : null,
    grandTotal: Number(row.grand_total) || 0,
    placedAt: row.placed_at ? String(row.placed_at) : null,
  }));
}

export function toDisputeRows(raw: ReadonlyArray<Record<string, unknown>>): DisputeRow[] {
  return raw.map((row, idx) => ({
    id: String(row.id || `dispute-${idx}`),
    disputeNo: row.dispute_no ? String(row.dispute_no) : null,
    status: row.status ? String(row.status) : null,
    orderNo: row.order_no ? String(row.order_no) : null,
    updatedAt: row.updated_at ? String(row.updated_at) : null,
  }));
}

export function toApplicationRow(raw: Record<string, unknown> | null): ApplicationRow {
  if (!raw) return null;
  return {
    id: raw.id ? String(raw.id) : null,
    status: raw.status ? String(raw.status) : null,
    storeName: raw.store_name ? String(raw.store_name) : null,
    submittedAt: raw.submitted_at ? String(raw.submitted_at) : null,
    reviewNote: raw.review_note ? String(raw.review_note) : null,
  };
}

export function toMembershipRows(raw: ReadonlyArray<Record<string, unknown>>): MembershipRow[] {
  return raw.map((row) => ({
    role: row.role ? String(row.role) : null,
    scopeType: row.scope_type ? String(row.scope_type) : null,
    scopeId: row.scope_id ? String(row.scope_id) : null,
    isActive: Boolean(row.is_active),
  }));
}

export function toPayoutRows(raw: ReadonlyArray<Record<string, unknown>>): PayoutRow[] {
  return raw.map((row, idx) => ({
    id: String(row.id || `payout-${idx}`),
    reference: row.reference ? String(row.reference) : null,
    amount: Number(row.amount) || 0,
    status: row.status ? String(row.status) : null,
    createdAt: row.created_at ? String(row.created_at) : null,
  }));
}
