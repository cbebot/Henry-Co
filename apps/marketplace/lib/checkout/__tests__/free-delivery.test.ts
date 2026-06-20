// V3-FREESHIP-02 — the free-delivery contract: strict manual-override flag +
// location-aware seller-promise waiver. Both fail closed.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  MARKETPLACE_FREE_DELIVERY_FLAG,
  isFreeDeliveryProduct,
  cartQualifiesForFreeDelivery,
  type FreeDeliveryCartInput,
} from "../free-delivery";

describe("isFreeDeliveryProduct — strict boolean, fail-closed", () => {
  it("qualifies ONLY on boolean true", () => {
    assert.equal(isFreeDeliveryProduct({ free_delivery: true }), true);
  });

  it("rejects truthy-but-not-boolean values (no accidental free ship from jsonb)", () => {
    for (const v of ["true", 1, "on", "yes", {}, []]) {
      assert.equal(isFreeDeliveryProduct({ free_delivery: v }), false, `value ${JSON.stringify(v)} must not qualify`);
    }
  });

  it("rejects false / missing / null / non-object filter_data", () => {
    assert.equal(isFreeDeliveryProduct({ free_delivery: false }), false);
    assert.equal(isFreeDeliveryProduct({ other: true }), false);
    assert.equal(isFreeDeliveryProduct({}), false);
    assert.equal(isFreeDeliveryProduct(null), false);
    assert.equal(isFreeDeliveryProduct(undefined), false);
    assert.equal(isFreeDeliveryProduct("free_delivery"), false);
    assert.equal(isFreeDeliveryProduct(true), false);
  });

  it("flag key is the documented constant", () => {
    assert.equal(MARKETPLACE_FREE_DELIVERY_FLAG, "free_delivery");
  });
});

describe("cartQualifiesForFreeDelivery — seller promise covering the buyer's state, or manual override", () => {
  const build = (over: Partial<FreeDeliveryCartInput> = {}): FreeDeliveryCartInput => ({
    cartProductIds: ["p1"],
    buyerState: "enugu",
    vendorByProduct: new Map<string, string | null>([["p1", "v1"]]),
    activePromiseByVendor: new Map([["v1", { coveredStates: ["enugu", "lagos"], minOrderMinor: null }]]),
    manualFreeProductIds: new Set<string>(),
    goodsSubtotalMinor: 500_000,
    ...over,
  });

  it("waives when the seller's promise covers the buyer's state", () => {
    assert.equal(cartQualifiesForFreeDelivery(build()), true);
  });

  it("does NOT waive when the buyer's state is outside the promise", () => {
    assert.equal(cartQualifiesForFreeDelivery(build({ buyerState: "kano" })), false);
  });

  it("does NOT waive when the buyer's state is unknown (null)", () => {
    assert.equal(cartQualifiesForFreeDelivery(build({ buyerState: null })), false);
  });

  it("multi-vendor cart: EVERY vendor must cover the state", () => {
    const input = build({
      cartProductIds: ["p1", "p2"],
      vendorByProduct: new Map<string, string | null>([["p1", "v1"], ["p2", "v2"]]),
      // v2 has NO promise → its line fails → whole cart pays delivery
      activePromiseByVendor: new Map([["v1", { coveredStates: ["enugu"], minOrderMinor: null }]]),
    });
    assert.equal(cartQualifiesForFreeDelivery(input), false);
  });

  it("respects the minimum-order floor (kobo)", () => {
    const activePromiseByVendor = new Map([["v1", { coveredStates: ["enugu"], minOrderMinor: 1_000_000 }]]);
    assert.equal(cartQualifiesForFreeDelivery(build({ activePromiseByVendor, goodsSubtotalMinor: 999_999 })), false);
    assert.equal(cartQualifiesForFreeDelivery(build({ activePromiseByVendor, goodsSubtotalMinor: 1_000_000 })), true);
  });

  it("an absent (inactive) promise → no waiver", () => {
    assert.equal(cartQualifiesForFreeDelivery(build({ activePromiseByVendor: new Map() })), false);
  });

  it("a line with no known vendor → no waiver", () => {
    assert.equal(cartQualifiesForFreeDelivery(build({ vendorByProduct: new Map<string, string | null>([["p1", null]]) })), false);
  });

  it("the manual owner override waives a line regardless of state/promise", () => {
    assert.equal(
      cartQualifiesForFreeDelivery(
        build({ buyerState: null, activePromiseByVendor: new Map(), manualFreeProductIds: new Set(["p1"]) }),
      ),
      true,
    );
  });

  it("mixed cart: a promise-covered line + a manual-override line both qualify", () => {
    const input = build({
      cartProductIds: ["p1", "p2"],
      vendorByProduct: new Map<string, string | null>([["p1", "v1"], ["p2", "v2"]]),
      activePromiseByVendor: new Map([["v1", { coveredStates: ["enugu"], minOrderMinor: null }]]),
      manualFreeProductIds: new Set(["p2"]),
    });
    assert.equal(cartQualifiesForFreeDelivery(input), true);
  });

  it("empty cart never waives", () => {
    assert.equal(cartQualifiesForFreeDelivery(build({ cartProductIds: [] })), false);
  });
});
