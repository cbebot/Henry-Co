import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  splitVatInclusive,
  computeOutputVat,
  applyOutputVat,
  carveInclusiveVat,
  applyInclusiveVat,
  applyInclusiveVatByLine,
  buildSaleVatRecognition,
  buildSaleVatRecognitionByLine,
  type VatTreatment,
} from "../vat";
import { extractTaxFromBreakdown, type PricingBreakdown, type PricingBreakdownLine } from "../index";

// The Nigeria VAT policy, passed in by dependency injection (the canonical value
// lives in @henryco/config TAX.vat — pricing stays dependency-free).
const NG_VAT = { standardRate: 0.075, rateVersion: "NG-VAT-7.5-2020-02-01" };

describe("splitVatInclusive — decompose a VAT-INCLUSIVE kobo amount (used for processor fees)", () => {
  it("splits 1075 incl @ 7.5% into 1000 ex + 75 VAT", () => {
    assert.deepEqual(splitVatInclusive(1075, 0.075), { exVatMinor: 1000, vatMinor: 75 });
  });

  it("always reconciles (exVat + vat === total) with integer kobo, for any total", () => {
    for (const total of [1, 7, 99, 100, 2500, 10283, 40333, 999999]) {
      const { exVatMinor, vatMinor } = splitVatInclusive(total, 0.075);
      assert.equal(exVatMinor + vatMinor, total, `must reconcile for ${total}`);
      assert.ok(vatMinor >= 0 && exVatMinor >= 0, `non-negative parts for ${total}`);
    }
  });

  it("decomposes the REAL Paystack sample fee 10283 → 9566 ex + 717 VAT", () => {
    // From a real Paystack /transaction/verify payload: amount 40333, fees 10283.
    // 10283 / 1.075 = 9565.58 → round 9566 ex; VAT = 10283 − 9566 = 717 (reconciles).
    assert.deepEqual(splitVatInclusive(10283, 0.075), { exVatMinor: 9566, vatMinor: 717 });
  });

  it("rejects non-integer or negative kobo (no float, no ×100 drift)", () => {
    assert.throws(() => splitVatInclusive(100.5, 0.075));
    assert.throws(() => splitVatInclusive(-1, 0.075));
    assert.throws(() => splitVatInclusive(Number.NaN, 0.075));
  });
});

describe("computeOutputVat — output VAT computed on a VAT-EXCLUSIVE taxable base", () => {
  it("standard supply: 7.5% of the base, with rate + version recorded", () => {
    assert.deepEqual(computeOutputVat({ baseMinor: 1000, treatment: "standard" }, NG_VAT), {
      vatMinor: 75,
      rate: 0.075,
      version: "NG-VAT-7.5-2020-02-01",
    });
  });

  it("zero-rated supply: 0 VAT (still records the rate it was assessed under)", () => {
    assert.equal(computeOutputVat({ baseMinor: 1000, treatment: "zero_rated" }, NG_VAT).vatMinor, 0);
  });

  it("exempt supply: 0 VAT", () => {
    assert.equal(computeOutputVat({ baseMinor: 1000, treatment: "exempt" }, NG_VAT).vatMinor, 0);
  });

  it("rounds to whole kobo (7.5% of 333 = 24.975 → 25)", () => {
    assert.equal(computeOutputVat({ baseMinor: 333, treatment: "standard" }, NG_VAT).vatMinor, 25);
  });

  it("is the inverse of splitVatInclusive (add-then-split round-trips)", () => {
    const base = 1000;
    const { vatMinor } = computeOutputVat({ baseMinor: base, treatment: "standard" }, NG_VAT);
    assert.deepEqual(splitVatInclusive(base + vatMinor, 0.075), { exVatMinor: base, vatMinor });
  });
});

describe("applyOutputVat — append a config-driven `tax` line to a breakdown", () => {
  const base: PricingBreakdown = {
    currency: "NGN",
    lines: [{ code: "service_fee", label: "Listing service", amount: { currency: "NGN", amount: 1000 } }],
    totals: {
      customerTotal: { currency: "NGN", amount: 1000 },
      vendorGross: { currency: "NGN", amount: 0 },
      platformNet: { currency: "NGN", amount: 1000 },
      vendorNet: { currency: "NGN", amount: 0 },
    },
    meta: { division: "property", ruleBookKey: "k", ruleVersion: "v", computedAt: "t" },
  };

  it("standard: adds a 75-kobo tax line with meta.rate/version/treatment; total grows to 1075", () => {
    const out = applyOutputVat(base, { treatment: "standard" }, NG_VAT);
    const tax = extractTaxFromBreakdown(out);
    assert.equal(tax?.taxMinor, 75);
    assert.equal(tax?.rate, 0.075);
    assert.equal(out.totals.customerTotal.amount, 1075);
    const taxLine = out.lines.find((l) => l.code === "tax");
    assert.equal(taxLine?.meta?.version, "NG-VAT-7.5-2020-02-01");
    assert.equal(taxLine?.meta?.treatment, "standard");
  });

  it("zero-rated / exempt: no tax line, total unchanged", () => {
    for (const treatment of ["zero_rated", "exempt"] as VatTreatment[]) {
      const out = applyOutputVat(base, { treatment }, NG_VAT);
      assert.equal(extractTaxFromBreakdown(out), null, `${treatment} → no tax line`);
      assert.equal(out.totals.customerTotal.amount, 1000);
    }
  });

  it("does not mutate the input breakdown", () => {
    const before = JSON.stringify(base);
    applyOutputVat(base, { treatment: "standard" }, NG_VAT);
    assert.equal(JSON.stringify(base), before);
  });

  it("is idempotent: applying twice does not double the tax line", () => {
    const once = applyOutputVat(base, { treatment: "standard" }, NG_VAT);
    const twice = applyOutputVat(once, { treatment: "standard" }, NG_VAT);
    assert.equal(twice.lines.filter((l) => l.code === "tax").length, 1);
    assert.equal(extractTaxFromBreakdown(twice)?.taxMinor, 75);
  });

  it("out_of_scope: no tax line, total unchanged", () => {
    const out = applyOutputVat(base, { treatment: "out_of_scope" }, NG_VAT);
    assert.equal(extractTaxFromBreakdown(out), null);
    assert.equal(out.totals.customerTotal.amount, 1000);
  });
});

// V3-VAT-CLASSIFICATION-01 — INCLUSIVE output VAT (carved out of the full value)

describe("carveInclusiveVat — carve VAT OUT of a VAT-inclusive amount under a treatment", () => {
  it("standard: 1075 incl → 1000 ex + 75 VAT (reconciles exactly)", () => {
    const r = carveInclusiveVat({ inclusiveMinor: 1075, treatment: "standard" }, NG_VAT);
    assert.equal(r.exVatMinor, 1000);
    assert.equal(r.vatMinor, 75);
    assert.equal(r.exVatMinor + r.vatMinor, 1075);
    assert.equal(r.rate, 0.075);
    assert.equal(r.version, "NG-VAT-7.5-2020-02-01");
  });

  it("non-standard treatments carry 0 VAT and keep the whole amount as ex-VAT", () => {
    for (const treatment of ["zero_rated", "exempt", "out_of_scope"] as VatTreatment[]) {
      const r = carveInclusiveVat({ inclusiveMinor: 1075, treatment }, NG_VAT);
      assert.equal(r.vatMinor, 0, `${treatment} → 0 VAT`);
      assert.equal(r.exVatMinor, 1075, `${treatment} → whole amount ex-VAT`);
    }
  });

  it("always reconciles (exVat + vat === inclusive) for any whole-kobo total", () => {
    for (const total of [1, 7, 99, 100, 18500000, 2500, 10283, 999999, 40333]) {
      const r = carveInclusiveVat({ inclusiveMinor: total, treatment: "standard" }, NG_VAT);
      assert.equal(r.exVatMinor + r.vatMinor, total, `reconcile for ${total}`);
      assert.ok(r.vatMinor >= 0 && r.exVatMinor >= 0);
    }
  });

  it("rejects non-integer / negative kobo (no float, no ×100 drift)", () => {
    assert.throws(() => carveInclusiveVat({ inclusiveMinor: 100.5, treatment: "standard" }, NG_VAT));
    assert.throws(() => carveInclusiveVat({ inclusiveMinor: -1, treatment: "standard" }, NG_VAT));
  });
});

describe("applyInclusiveVat — VAT is WITHIN customerTotal (the consumer model)", () => {
  const cart = (amount: number): PricingBreakdown => ({
    currency: "NGN",
    lines: [{ code: "items_subtotal", label: "Items subtotal", amount: { currency: "NGN", amount } }],
    totals: {
      customerTotal: { currency: "NGN", amount },
      vendorGross: { currency: "NGN", amount },
      platformNet: { currency: "NGN", amount: 0 },
      vendorNet: { currency: "NGN", amount },
    },
    meta: { division: "marketplace", ruleBookKey: "k", ruleVersion: "v", computedAt: "t" },
  });

  it("standard: customerTotal UNCHANGED; tax line is informational (inclusive)", () => {
    const out = applyInclusiveVat(cart(1075), { treatment: "standard" }, NG_VAT);
    assert.equal(out.totals.customerTotal.amount, 1075, "total must NOT grow (VAT is inside it)");
    const tax = extractTaxFromBreakdown(out);
    assert.equal(tax?.taxMinor, 75);
    const taxLine = out.lines.find((l) => l.code === "tax");
    assert.equal(taxLine?.meta?.inclusive, true);
    assert.equal(taxLine?.meta?.unit, "minor");
    assert.equal(taxLine?.meta?.treatment, "standard");
    // VAT-exclusive base = total − VAT (the NRS base).
    assert.equal(out.totals.customerTotal.amount - (tax?.taxMinor ?? 0), 1000);
  });

  it("exempt: no tax line, total unchanged (the owner's test catalog case)", () => {
    const out = applyInclusiveVat(cart(1075), { treatment: "exempt" }, NG_VAT);
    assert.equal(extractTaxFromBreakdown(out), null);
    assert.equal(out.totals.customerTotal.amount, 1075);
  });

  it("does not mutate input and is idempotent", () => {
    const input = cart(1075);
    const before = JSON.stringify(input);
    const once = applyInclusiveVat(input, { treatment: "standard" }, NG_VAT);
    const twice = applyInclusiveVat(once, { treatment: "standard" }, NG_VAT);
    assert.equal(JSON.stringify(input), before, "input not mutated");
    assert.equal(twice.lines.filter((l) => l.code === "tax").length, 1, "no double tax line");
    assert.equal(twice.totals.customerTotal.amount, 1075);
  });
});

describe("applyInclusiveVatByLine — mixed cart, VAT only on the standard-rated lines", () => {
  const mixed: PricingBreakdown = {
    currency: "NGN",
    lines: [
      { code: "items_subtotal", label: "Standard goods", amount: { currency: "NGN", amount: 1075 } },
      { code: "other", label: "Exempt goods", amount: { currency: "NGN", amount: 500 } },
      { code: "delivery", label: "Delivery", amount: { currency: "NGN", amount: 1075 } },
    ],
    totals: {
      customerTotal: { currency: "NGN", amount: 2650 },
      vendorGross: { currency: "NGN", amount: 2650 },
      platformNet: { currency: "NGN", amount: 0 },
      vendorNet: { currency: "NGN", amount: 2650 },
    },
    meta: { division: "marketplace", ruleBookKey: "k", ruleVersion: "v", computedAt: "t" },
  };

  const treatmentByLabel = (line: PricingBreakdownLine): VatTreatment =>
    line.label === "Exempt goods" ? "exempt" : "standard";

  it("carves VAT from the standard lines only; customerTotal unchanged", () => {
    const out = applyInclusiveVatByLine(mixed, treatmentByLabel, NG_VAT);
    // standard base = 1075 (goods) + 1075 (delivery) = 2150 → VAT = 2150 − round(2150/1.075) = 150
    assert.equal(extractTaxFromBreakdown(out)?.taxMinor, 150);
    assert.equal(out.totals.customerTotal.amount, 2650, "total unchanged");
    assert.equal(out.lines.find((l) => l.code === "tax")?.meta?.basis, 2150);
  });

  it("all-exempt cart → no tax line, total unchanged (current seeded catalog)", () => {
    const out = applyInclusiveVatByLine(mixed, () => "exempt", NG_VAT);
    assert.equal(extractTaxFromBreakdown(out), null);
    assert.equal(out.totals.customerTotal.amount, 2650);
  });
});

describe("buildSaleVatRecognition — kobo-exact figures for post_sale_revenue", () => {
  it("standard sale: gross = revenue + outputVat, reconciles exactly (kobo)", () => {
    // ₦1,850.00 inclusive → 185000 kobo. revenue = round(185000/1.075) = 172093; vat = 12907.
    const r = buildSaleVatRecognition({ grossMinor: 185000, treatment: "standard" }, NG_VAT);
    assert.equal(r.grossMinor, 185000);
    assert.equal(r.outputVatMinor, 12907);
    assert.equal(r.revenueMinor, 172093);
    assert.equal(r.revenueMinor + r.outputVatMinor, r.grossMinor, "must reconcile to gross");
  });

  it("exempt / zero-rated / out_of_scope sale: 0 output VAT, full gross is revenue", () => {
    for (const treatment of ["exempt", "zero_rated", "out_of_scope"] as VatTreatment[]) {
      const r = buildSaleVatRecognition({ grossMinor: 185000, treatment }, NG_VAT);
      assert.equal(r.outputVatMinor, 0, `${treatment} → 0 VAT`);
      assert.equal(r.revenueMinor, 185000, `${treatment} → full gross is revenue`);
    }
  });

  it("reconciles for arbitrary kobo grosses (no drift)", () => {
    for (const gross of [1, 99, 100, 333, 185000, 999999, 250000000]) {
      const r = buildSaleVatRecognition({ grossMinor: gross, treatment: "standard" }, NG_VAT);
      assert.equal(r.revenueMinor + r.outputVatMinor, gross, `reconcile ${gross}`);
    }
  });
});

describe("buildSaleVatRecognitionByLine — mixed cart: ledger VAT === receipt VAT", () => {
  const mixed: PricingBreakdown = {
    currency: "NGN",
    lines: [
      { code: "items_subtotal", label: "Standard goods", amount: { currency: "NGN", amount: 1075 } },
      { code: "other", label: "Exempt goods", amount: { currency: "NGN", amount: 500 } },
      { code: "delivery", label: "Delivery", amount: { currency: "NGN", amount: 1075 } },
    ],
    totals: {
      customerTotal: { currency: "NGN", amount: 2650 },
      vendorGross: { currency: "NGN", amount: 2650 },
      platformNet: { currency: "NGN", amount: 0 },
      vendorNet: { currency: "NGN", amount: 2650 },
    },
    meta: { division: "marketplace", ruleBookKey: "k", ruleVersion: "v", computedAt: "t" },
  };
  const treatmentByLabel = (line: PricingBreakdownLine): VatTreatment =>
    line.label === "Exempt goods" ? "exempt" : "standard";

  it("the ledger output VAT equals the receipt's per-line tax line (no mismatch)", () => {
    const receipt = applyInclusiveVatByLine(mixed, treatmentByLabel, NG_VAT);
    const ledger = buildSaleVatRecognitionByLine(mixed, treatmentByLabel, NG_VAT);
    assert.equal(extractTaxFromBreakdown(receipt)?.taxMinor, ledger.outputVatMinor, "receipt VAT === ledger VAT");
    assert.equal(ledger.outputVatMinor, 150); // standard base 2150 → VAT 150
  });

  it("gross = revenue + outputVat; revenue carries the exempt portion", () => {
    const ledger = buildSaleVatRecognitionByLine(mixed, treatmentByLabel, NG_VAT);
    assert.equal(ledger.grossMinor, 2650);
    assert.equal(ledger.revenueMinor + ledger.outputVatMinor, ledger.grossMinor);
    assert.equal(ledger.revenueMinor, 2500); // 2650 − 150
  });

  it("contrasts with the WRONG single-treatment call on a mixed gross (the trap)", () => {
    // Feeding the whole gross under "standard" OVER-states VAT vs the per-line truth.
    const wrong = buildSaleVatRecognition({ grossMinor: 2650, treatment: "standard" }, NG_VAT);
    const right = buildSaleVatRecognitionByLine(mixed, treatmentByLabel, NG_VAT);
    assert.notEqual(wrong.outputVatMinor, right.outputVatMinor);
    assert.ok(wrong.outputVatMinor > right.outputVatMinor, "single-treatment over-states on a mixed cart");
  });
});
