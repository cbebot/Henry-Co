// Vendor analytics derivations — pure and testable. Every number here is
// derived from data the workspace already loads (order groups, disputes,
// order items); nothing is estimated or invented. Amounts stay in the same
// whole-naira unit the settlement rows carry (mirrors computePayoutBalance).

export type VendorOrderItemRollup = {
  productId: string;
  title: string;
  orderGroupId: string;
};

export type VendorAnalyticsSummary = {
  /** Vendor order groups in the workspace. */
  ordersCount: number;
  /** Sum of net vendor settlements (naira) across all order groups, before payout timing. */
  netSettlementTotal: number;
  /** Disputes over orders as a ratio (0.25 = 25%); null when there are no orders yet. */
  disputeRate: number | null;
  /** The product appearing in the most distinct orders; null when no items are known. */
  topProduct: { title: string; orderCount: number } | null;
};

export function deriveVendorAnalytics(input: {
  orders: Array<{ netVendorAmount: number }>;
  disputeCount: number;
  items: VendorOrderItemRollup[];
}): VendorAnalyticsSummary {
  const ordersCount = input.orders.length;

  // Same clamping computePayoutBalance applies: whole naira, never negative.
  const netSettlementTotal = input.orders.reduce(
    (sum, order) => sum + Math.max(0, Math.round(Number(order.netVendorAmount || 0))),
    0,
  );

  const disputeRate =
    ordersCount === 0 ? null : Math.max(0, input.disputeCount) / ordersCount;

  const groupsByProduct = new Map<string, { title: string; groups: Set<string> }>();
  for (const item of input.items) {
    if (!item.productId || !item.orderGroupId) continue;
    const entry =
      groupsByProduct.get(item.productId) ?? { title: item.title, groups: new Set<string>() };
    if (!entry.title && item.title) entry.title = item.title;
    entry.groups.add(item.orderGroupId);
    groupsByProduct.set(item.productId, entry);
  }

  let topProduct: VendorAnalyticsSummary["topProduct"] = null;
  for (const { title, groups } of groupsByProduct.values()) {
    if (!title) continue;
    if (!topProduct || groups.size > topProduct.orderCount) {
      topProduct = { title, orderCount: groups.size };
    }
  }

  return { ordersCount, netSettlementTotal, disputeRate, topProduct };
}
