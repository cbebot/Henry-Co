import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { deriveVendorAnalytics } from "./analytics";

describe("deriveVendorAnalytics — honest numbers from loaded data only", () => {
  it("sums net settlements and counts orders", () => {
    const summary = deriveVendorAnalytics({
      orders: [
        { netVendorAmount: 45000 },
        { netVendorAmount: 12500 },
        { netVendorAmount: 0 },
      ],
      disputeCount: 1,
      items: [],
    });
    assert.equal(summary.ordersCount, 3);
    assert.equal(summary.netSettlementTotal, 57500);
  });

  it("clamps negative or junk settlement values to zero, like computePayoutBalance", () => {
    const summary = deriveVendorAnalytics({
      orders: [{ netVendorAmount: -500 }, { netVendorAmount: Number.NaN }, { netVendorAmount: 100 }],
      disputeCount: 0,
      items: [],
    });
    assert.equal(summary.netSettlementTotal, 100);
  });

  it("guards the dispute rate against divide-by-zero", () => {
    assert.equal(
      deriveVendorAnalytics({ orders: [], disputeCount: 2, items: [] }).disputeRate,
      null,
    );
    assert.equal(
      deriveVendorAnalytics({
        orders: [{ netVendorAmount: 1 }, { netVendorAmount: 1 }, { netVendorAmount: 1 }, { netVendorAmount: 1 }],
        disputeCount: 1,
        items: [],
      }).disputeRate,
      0.25,
    );
  });

  it("picks the top product by DISTINCT order frequency, not line count", () => {
    const summary = deriveVendorAnalytics({
      orders: [{ netVendorAmount: 1 }, { netVendorAmount: 1 }, { netVendorAmount: 1 }],
      disputeCount: 0,
      items: [
        // product A: two lines in ONE order group
        { productId: "a", title: "Aso Oke Throw", orderGroupId: "g1" },
        { productId: "a", title: "Aso Oke Throw", orderGroupId: "g1" },
        // product B: one line in each of two order groups
        { productId: "b", title: "Brass Tray", orderGroupId: "g1" },
        { productId: "b", title: "Brass Tray", orderGroupId: "g2" },
      ],
    });
    assert.deepEqual(summary.topProduct, { title: "Brass Tray", orderCount: 2 });
  });

  it("returns no top product when items are unknown", () => {
    const summary = deriveVendorAnalytics({
      orders: [{ netVendorAmount: 1 }],
      disputeCount: 0,
      items: [],
    });
    assert.equal(summary.topProduct, null);
  });
});
