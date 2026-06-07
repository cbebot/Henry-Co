import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  splitVatInclusive,
  computeOutputVat,
  applyOutputVat,
  type VatTreatment,
} from "../vat";
import { extractTaxFromBreakdown, type PricingBreakdown } from "../index";

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
});
