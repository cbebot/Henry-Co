// Vendor overview models — pure and testable, copy via injected `t`
// (the page owns its translateSurfaceLabel). Powers the overview hero's
// single next action and the first-run checklist (absorbed from the retired
// /vendor/onboarding route).

type Translate = (label: string) => string;

export type VendorNextAction = {
  key: "request-payout" | "add-first-product" | "fulfil-orders" | "view-analytics";
  href: string;
  label: string;
};

/**
 * ONE next action for the overview hero, by simple precedence:
 * releasable money waiting → request a payout; empty catalog → first product;
 * undelivered orders → fulfil them; otherwise → review analytics.
 */
export function selectVendorNextAction(
  input: { releasable: number; productCount: number; pendingOrderCount: number },
  t: Translate,
): VendorNextAction {
  if (input.releasable > 0) {
    return { key: "request-payout", href: "/vendor/payouts", label: t("Request payout") };
  }
  if (input.productCount === 0) {
    return { key: "add-first-product", href: "/vendor/products/new", label: t("Add your first product") };
  }
  if (input.pendingOrderCount > 0) {
    return { key: "fulfil-orders", href: "/vendor/orders", label: t("Fulfil orders") };
  }
  return { key: "view-analytics", href: "/vendor/analytics", label: t("View analytics") };
}

/**
 * Orders still needing the vendor's hand. Delivered orders (including those
 * awaiting buyer confirmation) are done; everything else — acceptance,
 * packing, shipping, delays, returns — is pending fulfilment work.
 */
export function countPendingFulfillmentOrders(
  orders: Array<{ fulfillmentStatus: string }>,
): number {
  return orders.filter(
    (order) =>
      order.fulfillmentStatus !== "delivered" &&
      order.fulfillmentStatus !== "delivered_pending_confirmation",
  ).length;
}

export type FirstRunChecklistItem = {
  title: string;
  body: string;
  done: boolean;
};

/**
 * First-run checklist for vendors with no products yet — the content of the
 * retired /vendor/onboarding page, rendered on the overview instead.
 */
export function buildFirstRunChecklist(
  input: { hasStoreStory: boolean; productCount: number; fulfillmentReady: boolean },
  t: Translate,
): FirstRunChecklistItem[] {
  return [
    {
      title: t("Complete your storefront trust profile"),
      body: t(
        "Keep your description, support channels, and lead times clear before scaling catalog volume.",
      ),
      done: input.hasStoreStory,
    },
    {
      title: t("Submit your first product for moderation"),
      body: t(
        "A real product submission unlocks moderation feedback, trust review, and search placement.",
      ),
      done: input.productCount > 0,
    },
    {
      title: t("Confirm fulfilment readiness"),
      body: t(
        "Stable lead times, payout details, and stock discipline come before promotions or campaigns.",
      ),
      done: input.fulfillmentReady,
    },
  ];
}
