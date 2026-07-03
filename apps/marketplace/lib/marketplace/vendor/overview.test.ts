import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildFirstRunChecklist,
  countPendingFulfillmentOrders,
  selectVendorNextAction,
} from "./overview";

const t = (label: string) => label;

describe("selectVendorNextAction — one action by precedence", () => {
  it("puts a releasable balance first", () => {
    const action = selectVendorNextAction(
      { releasable: 45000, productCount: 0, pendingOrderCount: 3 },
      t,
    );
    assert.equal(action.key, "request-payout");
    assert.equal(action.href, "/vendor/payouts");
    assert.equal(action.label, "Request payout");
  });

  it("sends an empty catalog to the first product", () => {
    const action = selectVendorNextAction(
      { releasable: 0, productCount: 0, pendingOrderCount: 2 },
      t,
    );
    assert.equal(action.key, "add-first-product");
    assert.equal(action.href, "/vendor/products/new");
  });

  it("sends pending orders to fulfilment", () => {
    const action = selectVendorNextAction(
      { releasable: 0, productCount: 4, pendingOrderCount: 2 },
      t,
    );
    assert.equal(action.key, "fulfil-orders");
    assert.equal(action.href, "/vendor/orders");
  });

  it("falls back to analytics when nothing is waiting", () => {
    const action = selectVendorNextAction(
      { releasable: 0, productCount: 4, pendingOrderCount: 0 },
      t,
    );
    assert.equal(action.key, "view-analytics");
    assert.equal(action.href, "/vendor/analytics");
  });
});

describe("countPendingFulfillmentOrders", () => {
  it("counts everything not yet delivered", () => {
    assert.equal(
      countPendingFulfillmentOrders([
        { fulfillmentStatus: "awaiting_acceptance" },
        { fulfillmentStatus: "packed" },
        { fulfillmentStatus: "delayed" },
        { fulfillmentStatus: "delivered" },
        { fulfillmentStatus: "delivered_pending_confirmation" },
      ]),
      3,
    );
  });

  it("returns zero for no orders", () => {
    assert.equal(countPendingFulfillmentOrders([]), 0);
  });
});

describe("buildFirstRunChecklist", () => {
  it("marks steps done from real workspace signals", () => {
    const items = buildFirstRunChecklist(
      { hasStoreStory: true, productCount: 0, fulfillmentReady: false },
      t,
    );
    assert.equal(items.length, 3);
    assert.deepEqual(
      items.map((item) => item.done),
      [true, false, false],
    );
  });

  it("translates every string through the injected t", () => {
    const seen: string[] = [];
    buildFirstRunChecklist(
      { hasStoreStory: false, productCount: 1, fulfillmentReady: true },
      (label) => {
        seen.push(label);
        return label;
      },
    );
    assert.equal(seen.length, 6, "3 titles + 3 bodies all pass through t");
  });
});
