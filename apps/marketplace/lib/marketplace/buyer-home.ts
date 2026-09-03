// V3-INNER-L-MARKETPLACE — the buyer-home editorial masthead model.
//
// Pure derivation of the buyer dashboard's above-the-fold answer:
//   Q1 "what's happening with my stuff?" → the HeroCard tiles + side breakdown
//   Q2 "what should I do next?"          → the hero CTA + a single NextStepRow
//
// Keeping this logic out of the page body means the state→copy contract is
// testable (see __tests__/buyer-home.test.ts) and the page stays a thin
// compose. All user-visible copy flows through an injected translator `t`
// (the page passes `(s) => translateSurfaceLabel(locale, s)`), so this module
// holds zero JSX and zero hardcoded surface strings of its own — the strict
// i18n gate never sees a literal here, and the surface stays English-first
// exactly like the rest of the marketplace customer area.

import type {
  MarketplaceNotification,
  MarketplaceOrder,
  MarketplaceProduct,
  MarketplaceVendor,
  MarketplaceVendorApplication,
} from "./types";

export type BuyerDashboardInput = {
  orders: MarketplaceOrder[];
  wishlist: MarketplaceProduct[];
  follows: MarketplaceVendor[];
  notifications: MarketplaceNotification[];
  application: MarketplaceVendorApplication | null;
};

export type BuyerHomeState = "empty" | "calm" | "active" | "attention";

export type BuyerStats = {
  totalOrders: number;
  /** In-flight orders (placed → shipped) — the "active" set. */
  activeOrders: number;
  /** A subset of active: physically moving (shipped / partially shipped). */
  inTransit: number;
  /** Delivered + delivered-pending-confirmation. */
  delivered: number;
  awaitingPayment: number;
  awaitingConfirmation: number;
  /** Orders that need the buyer to act: pay, or confirm receipt. */
  needsAction: number;
  saved: number;
  following: number;
  unread: number;
  hasApplication: boolean;
  applicationStatus: string | null;
  sellerActive: boolean;
};

export type Translate = (value: string) => string;

// ── Status sets (kept aligned with app/account/page.tsx ordering) ───────────
const ACTIVE_STATUSES = new Set<MarketplaceOrder["status"]>([
  "placed",
  "awaiting_payment",
  "paid_held",
  "payment_verified",
  "fulfillment_in_progress",
  "processing",
  "partially_shipped",
  "shipped",
]);
const IN_TRANSIT_STATUSES = new Set<MarketplaceOrder["status"]>(["shipped", "partially_shipped"]);
const DELIVERED_STATUSES = new Set<MarketplaceOrder["status"]>([
  "delivered",
  "delivered_pending_confirmation",
]);

export function buyerDashboardStats(input: BuyerDashboardInput): BuyerStats {
  const orders = input.orders ?? [];
  const countBy = (predicate: (o: MarketplaceOrder) => boolean) =>
    orders.reduce((n, o) => (predicate(o) ? n + 1 : n), 0);

  const awaitingPayment = countBy((o) => o.status === "awaiting_payment");
  const awaitingConfirmation = countBy((o) => o.status === "delivered_pending_confirmation");
  const applicationStatus = input.application?.status
    ? String(input.application.status).toLowerCase()
    : null;

  return {
    totalOrders: orders.length,
    activeOrders: countBy((o) => ACTIVE_STATUSES.has(o.status)),
    inTransit: countBy((o) => IN_TRANSIT_STATUSES.has(o.status)),
    delivered: countBy((o) => DELIVERED_STATUSES.has(o.status)),
    awaitingPayment,
    awaitingConfirmation,
    needsAction: awaitingPayment + awaitingConfirmation,
    saved: (input.wishlist ?? []).length,
    following: (input.follows ?? []).length,
    unread: (input.notifications ?? []).filter((n) => !n.readAt).length,
    hasApplication: Boolean(input.application),
    applicationStatus,
    sellerActive: applicationStatus === "approved",
  };
}

export function buyerHomeState(stats: BuyerStats): BuyerHomeState {
  if (stats.totalOrders === 0 && stats.saved === 0 && stats.following === 0) return "empty";
  if (stats.needsAction > 0) return "attention";
  if (stats.activeOrders > 0) return "active";
  return "calm";
}

// ── Hero model ──────────────────────────────────────────────────────────────
export type BuyerHeroTile = {
  label: string;
  value: string | number;
  foot?: string | null;
  tone?: "default" | "accent" | "active" | "warning";
};

export type BuyerHeroBreakdownRow = { label: string; count: number; color: string };

export type BuyerHeroModel = {
  tone: BuyerHomeState;
  eyebrow: string;
  headline: string;
  blurb: string;
  ariaLabel: string;
  ariaTilesLabel: string;
  ctaPrimary: { label: string; href: string };
  ctaSecondary?: { label: string; href: string };
  tiles: BuyerHeroTile[];
  side: {
    kicker: string;
    title: string;
    body: string;
    breakdown?: { label: string; ariaLabel: string; rows: BuyerHeroBreakdownRow[] };
  };
};

function sellerCta(stats: BuyerStats, t: Translate): { label: string; href: string } {
  if (stats.sellerActive) return { label: t("Open vendor workspace"), href: "/vendor" };
  if (stats.hasApplication) {
    return { label: t("Continue your seller application"), href: "/account/seller-application/review" };
  }
  return { label: t("Apply to sell"), href: "/account/seller-application/start" };
}

export function buildBuyerHero(stats: BuyerStats, t: Translate): BuyerHeroModel {
  const tone = buyerHomeState(stats);

  let eyebrowState: string;
  let headline: string;
  let blurb: string;
  let ctaPrimary: { label: string; href: string };

  if (tone === "empty") {
    eyebrowState = t("start here");
    headline = t("Your marketplace, kept on one record");
    blurb = t(
      "Orders, saved pieces, store follows, and delivery — every signal from across Henry Onyx, attached to one account.",
    );
    ctaPrimary = { label: t("Browse the marketplace"), href: "/search" };
  } else if (tone === "attention") {
    eyebrowState = t("needs you");
    headline = `${stats.needsAction} ${t(stats.needsAction === 1 ? "order needs you" : "orders need you")}`;
    blurb = t("A couple of things are waiting on you. Clear them and your record is calm again.");
    ctaPrimary = { label: t("Resolve now"), href: "/account/orders" };
  } else if (tone === "active") {
    eyebrowState = t("live");
    headline = `${stats.activeOrders} ${t(stats.activeOrders === 1 ? "order in motion" : "orders in motion")}`;
    blurb = t(
      "We're tracking your orders across every store, so the trail stays in one place. Follow them through to your door.",
    );
    ctaPrimary = { label: t("Track your orders"), href: "/account/orders" };
  } else {
    eyebrowState = t("your record");
    headline = `${stats.totalOrders} ${t(stats.totalOrders === 1 ? "order on your record" : "orders on your record")}`;
    blurb = t("Everything you've bought and saved, on one calm record. Pick up where you left off.");
    ctaPrimary = { label: t("Continue shopping"), href: "/search" };
  }

  const tiles: BuyerHeroTile[] = [
    {
      label: t("Active orders"),
      value: stats.activeOrders,
      foot:
        stats.delivered > 0
          ? `${stats.delivered} ${t("delivered")}`
          : stats.totalOrders === 0
            ? t("Your purchases live here")
            : null,
      tone: stats.needsAction > 0 ? "warning" : stats.activeOrders > 0 ? "active" : "default",
    },
    {
      label: t("In transit"),
      value: stats.inTransit,
      foot: stats.inTransit > 0 ? t("on the way to you") : null,
      tone: stats.inTransit > 0 ? "active" : "default",
    },
    { label: t("Saved"), value: stats.saved, foot: null },
    { label: t("Following"), value: stats.following, foot: null },
  ];

  const breakdownRows: BuyerHeroBreakdownRow[] = [
    { label: t("In motion"), count: stats.activeOrders - stats.needsAction > 0 ? stats.activeOrders - stats.needsAction : 0, color: "var(--acct-gold)" },
    { label: t("Delivered"), count: stats.delivered, color: "var(--acct-green)" },
    { label: t("Needs you"), count: stats.needsAction, color: "var(--acct-red)" },
  ].filter((row) => row.count > 0);

  return {
    tone,
    eyebrow: `${t("Marketplace")} · ${eyebrowState}`,
    headline,
    blurb,
    ariaLabel: t("Marketplace account overview"),
    ariaTilesLabel: t("Account snapshot"),
    ctaPrimary,
    ctaSecondary: sellerCta(stats, t),
    tiles,
    side: {
      kicker: t("Your trail"),
      title: t("One record, every store"),
      body: t(
        "Buy from many stores; keep one trail. Henry Onyx threads orders, delivery, and disputes onto the same account.",
      ),
      breakdown:
        breakdownRows.length > 0
          ? { label: t("Right now"), ariaLabel: t("Order trail breakdown"), rows: breakdownRows }
          : undefined,
    },
  };
}

// ── Next-step model ──────────────────────────────────────────────────────────
export type BuyerNextStepModel = {
  tone: "neutral" | "attention" | "success";
  kicker: string;
  title: string;
  detail?: string;
  cta: { label: string; href: string };
  iconKey: "confirm" | "track" | "pay" | "seller";
};

function firstWithStatus(
  orders: MarketplaceOrder[],
  statuses: ReadonlyArray<MarketplaceOrder["status"]>,
): MarketplaceOrder | undefined {
  const set = new Set(statuses);
  return orders.find((o) => set.has(o.status));
}

export function buildBuyerNextStep(
  input: BuyerDashboardInput,
  stats: BuyerStats,
  t: Translate,
): BuyerNextStepModel | null {
  const orders = input.orders ?? [];

  if (stats.awaitingConfirmation > 0) {
    const o = firstWithStatus(orders, ["delivered_pending_confirmation"]);
    const orderNo = o?.orderNo ?? "";
    return {
      tone: "attention",
      kicker: t("Next step · confirm receipt"),
      title: `${t("Confirm you received order")} ${orderNo}`.trim(),
      detail: t("Confirming releases the seller's payout and closes the order on your record."),
      cta: { label: t("Confirm receipt"), href: `/account/orders/${orderNo}` },
      iconKey: "confirm",
    };
  }

  if (stats.awaitingPayment > 0) {
    const o = firstWithStatus(orders, ["awaiting_payment"]);
    const orderNo = o?.orderNo ?? "";
    return {
      tone: "attention",
      kicker: t("Next step · payment"),
      title: `${t("Complete payment for order")} ${orderNo}`.trim(),
      detail: t("Your items are held. Finish payment to move the order into fulfilment."),
      cta: { label: t("Complete payment"), href: `/account/orders/${orderNo}` },
      iconKey: "pay",
    };
  }

  const moving = firstWithStatus(orders, ["shipped", "partially_shipped"]);
  if (moving) {
    return {
      tone: "neutral",
      kicker: t("Next step · in transit"),
      title: `${t("Track order")} ${moving.orderNo ?? ""}`.trim(),
      detail: t("Your order is on the way. Follow it from dispatch to your door."),
      cta: { label: t("Track it"), href: `/account/orders/${moving.orderNo ?? ""}` },
      iconKey: "track",
    };
  }

  if (stats.activeOrders > 0) {
    const o = firstWithStatus(orders, [
      "placed",
      "paid_held",
      "payment_verified",
      "fulfillment_in_progress",
      "processing",
    ]);
    return {
      tone: "neutral",
      kicker: t("Next step · in progress"),
      title: `${t("Track order")} ${o?.orderNo ?? ""}`.trim(),
      detail: t("Your order is being prepared. We'll keep its status here."),
      cta: { label: t("View order"), href: `/account/orders/${o?.orderNo ?? ""}` },
      iconKey: "track",
    };
  }

  return null;
}
