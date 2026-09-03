// V3-DELIVERY-COMPLETE-01 — the unified-model proof.
//
// Two delivery-zeroing mechanisms ride ONE cart delivery line:
//   (A) the manual owner override `filter_data.free_delivery` (#309/CLOSE-01), and
//   (B) the seller's tier-clamped Delivery Promise covering the buyer's state (#314).
// They are OR-combined per line and AND-combined across the cart by
// `cartQualifiesForFreeDelivery` — so they decide ONE boolean, never two
// subtractions. This test reproduces the route's exact decision→pricing chain
// (route.ts 609-644) and pins the delivery line AND the kobo-exact output VAT in
// all four combinations: free via A only / via B only / via both / neither.
//
// The money invariant being defended: a waiver removes delivery from BOTH the gross
// and the composite VAT base together, so `outputVat + revenue === gross` holds with
// delivery simply absent — and a second mechanism can never carve it twice.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { cartQualifiesForFreeDelivery, type FreeDeliveryCartInput } from "../free-delivery";
import { clampCoveredStatesToTier } from "../delivery-reach";
import { resolveOrderOutputVat } from "../order-vat";

const NG = { standardRate: 0.075, rateVersion: "NG-VAT-7.5-2020-02-01" };

// A realistic, tier-clamped Gold promise: origin Enugu, nationwide reach → covers
// every state incl. the buyer's. Built through the SAME clamp the checkout applies,
// so the fixture cannot encode an over-reach the live path would reject.
const GOLD_COVERED = clampCoveredStatesToTier(
  // a deliberately-wide stored set; the clamp is what the checkout trusts
  ["enugu", "lagos", "kano", "rivers", "fct"],
  "enugu",
  "gold",
);

const SKU = "sku-standard-1500";
const VENDOR = "vendor-1";

/** The route's pricing chain for a single ₦1,500 standard-rated good. */
function priceFor(decision: boolean) {
  const deliveryNaira = decision ? 0 : 18000; // breakdown waives → 0, else default ₦180
  const goodsNaira = 1500;
  const grandTotalNaira = goodsNaira + deliveryNaira; // platform fee 0 here
  const grossMinor = Math.round(grandTotalNaira * 100);
  const vat = resolveOrderOutputVat(
    {
      items: [{ categoryKey: "everyday-tech", lineNaira: goodsNaira }],
      shippingNaira: deliveryNaira, // 0 when waived — the carve never sees phantom delivery
      platformFeeNaira: 0,
      grossMinor,
    },
    NG,
  );
  return { deliveryNaira, grossMinor, vat };
}

function cart(over: Partial<FreeDeliveryCartInput>): FreeDeliveryCartInput {
  return {
    cartProductIds: [SKU],
    buyerState: "enugu",
    vendorByProduct: new Map([[SKU, VENDOR]]),
    activePromiseByVendor: new Map(),
    manualFreeProductIds: new Set<string>(),
    goodsSubtotalMinor: 150_000,
    ...over,
  };
}

// Goods-only carve (delivery waived): 150,000 − round(150,000 / 1.075) = 150,000 − 139,535 = 10,465.
const VAT_GOODS_ONLY = 10_465;
// Goods + ₦18,000 delivery (the live-sale proof): 1,950,000 − 1,813,953 = 136,047.
const VAT_WITH_DELIVERY = 136_047;

describe("V3-DELIVERY-COMPLETE-01 — unified delivery+VAT across all four combos", () => {
  it("(A) free via the manual override only → delivery 0, VAT from goods only", () => {
    const decision = cartQualifiesForFreeDelivery(
      cart({ manualFreeProductIds: new Set([SKU]) }),
    );
    assert.equal(decision, true);
    const { deliveryNaira, grossMinor, vat } = priceFor(decision);
    assert.equal(deliveryNaira, 0);
    assert.equal(grossMinor, 150_000);
    assert.equal(vat.standardBaseMinor, 150_000); // base excludes the (absent) delivery
    assert.equal(vat.outputVatMinor, VAT_GOODS_ONLY);
  });

  it("(B) free via the seller promise only → delivery 0, VAT from goods only", () => {
    const decision = cartQualifiesForFreeDelivery(
      cart({ activePromiseByVendor: new Map([[VENDOR, { coveredStates: GOLD_COVERED, minOrderMinor: null }]]) }),
    );
    assert.equal(decision, true);
    const { deliveryNaira, vat } = priceFor(decision);
    assert.equal(deliveryNaira, 0);
    assert.equal(vat.outputVatMinor, VAT_GOODS_ONLY);
  });

  it("(A+B) free via BOTH → still ONE waiver, no double-zero (VAT identical to A-only / B-only)", () => {
    const decision = cartQualifiesForFreeDelivery(
      cart({
        manualFreeProductIds: new Set([SKU]),
        activePromiseByVendor: new Map([[VENDOR, { coveredStates: GOLD_COVERED, minOrderMinor: null }]]),
      }),
    );
    assert.equal(decision, true);
    const { deliveryNaira, vat } = priceFor(decision);
    assert.equal(deliveryNaira, 0);
    // The proof that the two mechanisms cannot double-zero: the VAT base is the SAME
    // goods-only figure whether one mechanism fires or both. A second waiver subtracts
    // nothing further — delivery is a single line, already at 0.
    assert.equal(vat.standardBaseMinor, 150_000);
    assert.equal(vat.outputVatMinor, VAT_GOODS_ONLY);
  });

  it("(neither) no override and promise does not cover the buyer's state → normal delivery, VAT includes delivery", () => {
    const decision = cartQualifiesForFreeDelivery(
      cart({
        buyerState: "kano", // promise origin Enugu, gold; but we give it no promise here
        activePromiseByVendor: new Map(), // no promise at all
      }),
    );
    assert.equal(decision, false);
    const { deliveryNaira, grossMinor, vat } = priceFor(decision);
    assert.equal(deliveryNaira, 18_000);
    assert.equal(grossMinor, 1_950_000);
    assert.equal(vat.standardBaseMinor, 1_950_000); // goods + delivery in the composite base
    assert.equal(vat.outputVatMinor, VAT_WITH_DELIVERY);
  });

  it("(neither, by reach) an active promise that does NOT cover the buyer's state → normal delivery", () => {
    // Promise covers only the seller's own state (bronze-clamped to enugu); buyer in Kano.
    const bronzeCovered = clampCoveredStatesToTier(["enugu", "lagos"], "enugu", "bronze");
    const decision = cartQualifiesForFreeDelivery(
      cart({
        buyerState: "kano",
        activePromiseByVendor: new Map([[VENDOR, { coveredStates: bronzeCovered, minOrderMinor: null }]]),
      }),
    );
    assert.equal(decision, false); // kano not in {enugu}
    const { deliveryNaira, vat } = priceFor(decision);
    assert.equal(deliveryNaira, 18_000);
    assert.equal(vat.outputVatMinor, VAT_WITH_DELIVERY);
  });

  it("exempt goods stay 0 VAT in every delivery combo (composite rides the exempt supply)", () => {
    for (const decision of [true, false]) {
      const deliveryNaira = decision ? 0 : 18000;
      const vat = resolveOrderOutputVat(
        {
          items: [{ categoryKey: "food", lineNaira: 1500 }], // exempt
          shippingNaira: deliveryNaira,
          platformFeeNaira: 0,
          grossMinor: Math.round((1500 + deliveryNaira) * 100),
        },
        NG,
      );
      assert.equal(vat.outputVatMinor, 0, `exempt cart must post 0 VAT (free=${decision})`);
    }
  });
});
