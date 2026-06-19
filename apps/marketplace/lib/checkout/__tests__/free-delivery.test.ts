// V3-FREESHIP-CLOSE-01 — the free-shipping flag contract is strict + fail-closed.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  MARKETPLACE_FREE_DELIVERY_FLAG,
  isFreeDeliveryProduct,
  cartQualifiesForFreeDelivery,
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

  it("preserves the existing flagged test-product shape (other keys ignored)", () => {
    // The retired test product carried these alongside the flag.
    assert.equal(
      isFreeDeliveryProduct({ delivery: "Test item", codEligible: false, companyOwned: true, free_delivery: true }),
      true,
    );
  });

  it("flag key is the documented constant", () => {
    assert.equal(MARKETPLACE_FREE_DELIVERY_FLAG, "free_delivery");
  });
});

describe("cartQualifiesForFreeDelivery — every line must be flagged", () => {
  it("true only when the cart is non-empty and EVERY id is flagged", () => {
    assert.equal(cartQualifiesForFreeDelivery(["a", "b"], new Set(["a", "b"])), true);
    assert.equal(cartQualifiesForFreeDelivery(["a", "a"], new Set(["a"])), true); // deduped upstream
  });

  it("false when any cart id is unflagged or missing (never accidental free ship)", () => {
    assert.equal(cartQualifiesForFreeDelivery(["a", "b"], new Set(["a"])), false);
    assert.equal(cartQualifiesForFreeDelivery(["a", "missing"], new Set(["a"])), false);
  });

  it("false on empty cart or empty flagged set (safe default)", () => {
    assert.equal(cartQualifiesForFreeDelivery([], new Set(["a"])), false);
    assert.equal(cartQualifiesForFreeDelivery(["a"], new Set()), false);
  });
});
