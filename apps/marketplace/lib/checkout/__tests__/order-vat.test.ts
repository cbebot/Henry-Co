// V3-VAT-WIRING-01 — proof that a standard-rated marketplace sale computes the
// correct KOBO-EXACT output VAT, an exempt sale posts 0, and revenue+VAT===gross.
// Classification is by CATEGORY (+ an explicit per-row itemTreatment override) — NOT
// by inventory ownership (the bug the review caught: company stock isn't "exempt").
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { resolveOrderOutputVat } from "../order-vat";

const NG = { standardRate: 0.075, rateVersion: "NG-VAT-7.5-2020-02-01" };

describe("resolveOrderOutputVat — kobo-exact marketplace output VAT", () => {
  it("STANDARD-category item: carves 7.5% inclusive from the full kobo gross (the live-sale proof)", () => {
    // ₦1,500 standard good (everyday-tech) + ₦18,000 delivery = ₦19,500 → 1,950,000 kobo (the live test order)
    const r = resolveOrderOutputVat(
      {
        items: [{ categoryKey: "everyday-tech", lineNaira: 1500 }],
        shippingNaira: 18000,
        platformFeeNaira: 0,
        grossMinor: 1_950_000,
      },
      NG,
    );
    assert.equal(r.treatments[0], "standard");
    assert.equal(r.standardBaseMinor, 1_950_000);
    // 1,950,000 − round(1,950,000/1.075) = 1,950,000 − 1,813,953 = 136,047 kobo (₦1,360.47)
    assert.equal(r.outputVatMinor, 136_047);
    assert.equal(r.reviewStatus, "pending_review"); // VATable → flagged for accountant
    assert.equal(r.rateVersion, "NG-VAT-7.5-2020-02-01");
  });

  // ── V3-FREESHIP-CLOSE-01 — money-safety of free shipping (delivery waived) × VAT ──
  // When a product is flagged `filter_data.free_delivery`, the checkout passes
  // deliveryAmount:0, so shippingNaira reaches the carve as 0 and the gross is goods-only.
  // The composite base must then be the GOODS alone — no phantom delivery (over-remit),
  // no shrunk base (under-remit). These cases pin that, incl. the exact live-proof figure.
  it("FREE SHIPPING + standard goods: VAT carved from goods only — the live ₦1,075 → ₦75.00 proof", () => {
    // The retired test product: ₦1,075 standard good, delivery waived → gross 107,500 kobo.
    const r = resolveOrderOutputVat(
      { items: [{ categoryKey: "everyday-tech", lineNaira: 1075 }], shippingNaira: 0, platformFeeNaira: 0, grossMinor: 107_500 },
      NG,
    );
    assert.equal(r.treatments[0], "standard"); // free delivery does NOT change the goods treatment
    assert.equal(r.standardBaseMinor, 107_500); // base = goods only (no delivery added/removed)
    // 107,500 − round(107,500/1.075) = 107,500 − 100,000 = 7,500 kobo (₦75.00); net ₦1,000
    assert.equal(r.outputVatMinor, 7_500);
    assert.equal(r.reviewStatus, "pending_review");
  });

  it("FREE SHIPPING + exempt goods: still 0 — no spurious VAT when delivery is waived", () => {
    const r = resolveOrderOutputVat(
      { items: [{ categoryKey: "food", lineNaira: 1075 }], shippingNaira: 0, platformFeeNaira: 0, grossMinor: 107_500 },
      NG,
    );
    assert.equal(r.treatments[0], "exempt");
    assert.equal(r.standardBaseMinor, 0);
    assert.equal(r.outputVatMinor, 0);
  });

  it("EXEMPT category (food): posts 0 (delivery rides the exempt supply → composite 0)", () => {
    const r = resolveOrderOutputVat(
      {
        items: [{ categoryKey: "food", lineNaira: 1500 }], // food → exempt
        shippingNaira: 18000,
        platformFeeNaira: 0,
        grossMinor: 1_950_000,
      },
      NG,
    );
    assert.equal(r.treatments[0], "exempt");
    assert.equal(r.standardBaseMinor, 0);
    assert.equal(r.outputVatMinor, 0);
    assert.equal(r.reviewStatus, "confirmed"); // 0 is unambiguous
  });

  it("explicit per-row itemTreatment override beats the category (mark a product exempt)", () => {
    const r = resolveOrderOutputVat(
      {
        items: [{ categoryKey: "everyday-tech", itemTreatment: "exempt", lineNaira: 1500 }],
        shippingNaira: 18000,
        platformFeeNaira: 0,
        grossMinor: 1_950_000,
      },
      NG,
    );
    assert.equal(r.treatments[0], "exempt");
    assert.equal(r.outputVatMinor, 0);
  });

  it("company-owned standard goods compute VAT (ownership is NOT a tax marker — the HIGH fix)", () => {
    // No isSeededTestItem path: an everyday-tech good resolves to STANDARD regardless of who owns it.
    const r = resolveOrderOutputVat(
      { items: [{ categoryKey: "everyday-tech", lineNaira: 10000 }], shippingNaira: 0, platformFeeNaira: 0, grossMinor: 1_000_000 },
      NG,
    );
    assert.equal(r.treatments[0], "standard");
    assert.ok(r.outputVatMinor > 0);
  });

  it("MIXED cart: VAT only on the standard portion (+ delivery/fee ride the standard goods)", () => {
    // standard ₦2,000 + exempt ₦1,000, no delivery = ₦3,000 → 300,000 kobo
    const r = resolveOrderOutputVat(
      {
        items: [
          { categoryKey: "everyday-tech", lineNaira: 2000 }, // standard
          { categoryKey: "food", lineNaira: 1000 }, // exempt
        ],
        shippingNaira: 0,
        platformFeeNaira: 0,
        grossMinor: 300_000,
      },
      NG,
    );
    assert.deepEqual(r.treatments, ["standard", "exempt"]);
    assert.equal(r.standardBaseMinor, 200_000); // only the ₦2,000 standard item
    // 200,000 − round(200,000/1.075) = 200,000 − 186,047 = 13,953
    assert.equal(r.outputVatMinor, 13_953);
  });

  it("books → zero-rated → 0 output VAT", () => {
    const r = resolveOrderOutputVat(
      { items: [{ categoryKey: "books", lineNaira: 5000 }], shippingNaira: 0, platformFeeNaira: 0, grossMinor: 500_000 },
      NG,
    );
    assert.equal(r.treatments[0], "zero_rated");
    assert.equal(r.outputVatMinor, 0);
  });

  it("unknown / null category → marketplace standard default (conservative, never under-remits)", () => {
    const r = resolveOrderOutputVat(
      { items: [{ categoryKey: null, lineNaira: 1000 }], shippingNaira: 0, platformFeeNaira: 0, grossMinor: 100_000 },
      NG,
    );
    assert.equal(r.treatments[0], "standard");
    assert.ok(r.outputVatMinor > 0);
  });

  it("invariant: outputVat in [0, gross), kobo-exact, for arbitrary standard grosses", () => {
    for (const gross of [100, 333, 1_950_000, 999_999, 50_000_000]) {
      const r = resolveOrderOutputVat(
        { items: [{ categoryKey: "everyday-tech", lineNaira: gross / 100 }], shippingNaira: 0, platformFeeNaira: 0, grossMinor: gross },
        NG,
      );
      assert.ok(r.outputVatMinor >= 0 && r.outputVatMinor < gross, `vat strictly < gross for ${gross}`);
    }
  });

  it("clamps the standard base to the kobo gross — never carves more than was charged", () => {
    const r = resolveOrderOutputVat(
      { items: [{ categoryKey: "everyday-tech", lineNaira: 100000 }], shippingNaira: 0, platformFeeNaira: 0, grossMinor: 50 },
      NG,
    );
    assert.ok(r.standardBaseMinor <= 50);
    assert.ok(r.outputVatMinor <= 50);
  });
});
