import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  computeVat,
  computeTax,
  describeTaxTelemetry,
  TAX_TELEMETRY,
  type ResolvedRate,
  type TaxConvention,
} from "../compute-tax";
import { applyVatToBreakdown } from "../apply";
import { InternalTaxAdapter } from "../adapter";
import { extractTaxFromBreakdown, type PricingBreakdown } from "../../index";

// The Nigeria VAT policy, injected (the canonical value lives in @henryco/config
// TAX.vat / the catalog — pricing stays dependency-free).
const NG_VAT = { standardRate: 0.075, rateVersion: "NG-VAT-7.5-2020-02-01" };

/** Exact integer rounded division for the float-free cross-check. */
function roundedDiv(a: number, b: number): number {
  return Math.floor((2 * a + b) / (2 * b));
}

describe("computeVat — inclusive (carve VAT OUT; the customer total never moves)", () => {
  it("base 1075 incl @ 7.5% → vat 75, net 1000, gross 1075", () => {
    assert.deepEqual(computeVat({ baseMinor: 1075, treatment: "standard", convention: "inclusive" }, NG_VAT), {
      vatMinor: 75,
      netMinor: 1000,
      grossMinor: 1075,
      rate: 0.075,
      version: "NG-VAT-7.5-2020-02-01",
      treatment: "standard",
      convention: "inclusive",
    });
  });

  it("net + vat === base ALWAYS (no rounding drift), and is kobo-exact vs integer basis-point math", () => {
    for (const base of [1, 7, 99, 100, 1075, 10750, 10283, 40333, 123457, 999999, 250000000]) {
      const r = computeVat({ baseMinor: base, treatment: "standard", convention: "inclusive" }, NG_VAT);
      assert.equal(r.netMinor + r.vatMinor, base, `reconciles for ${base}`);
      // Float path (round(base/1.075)) MUST equal the exact integer bp carve.
      const exExact = roundedDiv(base * 10000, 10750); // 750 bp → /1.075
      assert.equal(r.netMinor, exExact, `net is integer-exact bp carve for ${base}`);
      assert.equal(r.vatMinor, base - exExact, `vat is integer-exact bp carve for ${base}`);
      assert.ok(r.vatMinor >= 0 && r.netMinor >= 0);
    }
  });
});

describe("computeVat — exclusive (add VAT ON TOP; the total grows)", () => {
  it("base 1000 ex @ 7.5% → vat 75, net 1000, gross 1075", () => {
    assert.deepEqual(computeVat({ baseMinor: 1000, treatment: "standard", convention: "exclusive" }, NG_VAT), {
      vatMinor: 75,
      netMinor: 1000,
      grossMinor: 1075,
      rate: 0.075,
      version: "NG-VAT-7.5-2020-02-01",
      treatment: "standard",
      convention: "exclusive",
    });
  });

  it("rounds to whole kobo (7.5% of 333 = 24.975 → 25)", () => {
    assert.equal(computeVat({ baseMinor: 333, treatment: "standard", convention: "exclusive" }, NG_VAT).vatMinor, 25);
  });

  it("inclusive and exclusive are inverses (exclusive gross, carved back, yields the same VAT)", () => {
    for (const base of [1000, 9566, 50000, 123456]) {
      const ex = computeVat({ baseMinor: base, treatment: "standard", convention: "exclusive" }, NG_VAT);
      const back = computeVat({ baseMinor: ex.grossMinor, treatment: "standard", convention: "inclusive" }, NG_VAT);
      assert.equal(back.vatMinor, ex.vatMinor, `round-trips for ${base}`);
      assert.equal(back.netMinor, base);
    }
  });
});

describe("computeVat — zero-rated / exempt carry NO VAT under either convention", () => {
  for (const treatment of ["zero_rated", "exempt"] as const) {
    for (const convention of ["inclusive", "exclusive"] as TaxConvention[]) {
      it(`${treatment} / ${convention}: vat 0, net = gross = base (rate still recorded)`, () => {
        const r = computeVat({ baseMinor: 5000, treatment, convention }, NG_VAT);
        assert.equal(r.vatMinor, 0);
        assert.equal(r.netMinor, 5000);
        assert.equal(r.grossMinor, 5000);
        assert.equal(r.rate, 0.075); // recorded for the audit trail even though VAT is 0
      });
    }
  }
});

it("computeVat rejects a non-kobo base (programming error — never silently)", () => {
  assert.throws(() => computeVat({ baseMinor: 100.5, treatment: "standard", convention: "inclusive" }, NG_VAT));
  assert.throws(() => computeVat({ baseMinor: -1, treatment: "standard", convention: "exclusive" }, NG_VAT));
});

// --- applyVatToBreakdown ---

function marketplaceBreakdown(lines: Array<[PricingBreakdown["lines"][number]["code"], number]>): PricingBreakdown {
  const currency = "NGN";
  const built = lines.map(([code, amount]) => ({ code, label: code, amount: { currency, amount } }));
  const customerTotal = built.reduce((s, l) => s + l.amount.amount, 0);
  return {
    currency,
    lines: built,
    totals: {
      customerTotal: { currency, amount: customerTotal },
      vendorGross: { currency, amount: 0 },
      platformNet: { currency, amount: 0 },
      vendorNet: { currency, amount: 0 },
    },
    meta: { division: "marketplace", ruleBookKey: "k", ruleVersion: "v", computedAt: "t" },
  };
}

describe("applyVatToBreakdown — inclusive (the marketplace default): total UNCHANGED, VAT carved out", () => {
  const base = marketplaceBreakdown([
    ["items_subtotal", 10000],
    ["delivery", 750],
  ]); // total 10750

  it("carves 750 VAT out; customerTotal stays 10750; tax line is non-additive (meta.inclusive)", () => {
    const out = applyVatToBreakdown(base, { treatment: "standard", convention: "inclusive" }, NG_VAT);
    assert.equal(out.totals.customerTotal.amount, 10750, "customer pays the SAME total");
    const tax = extractTaxFromBreakdown(out);
    assert.equal(tax?.taxMinor, 750);
    assert.equal(tax?.rate, 0.075);
    const taxLine = out.lines.find((l) => l.code === "tax");
    assert.equal(taxLine?.meta?.inclusive, true);
    assert.equal(taxLine?.meta?.version, "NG-VAT-7.5-2020-02-01");
    assert.equal(taxLine?.meta?.treatment, "standard");
  });

  it("reconciles like the receipt: subtotal = total − fees − tax stays >= 0 and ties to the gross", () => {
    const withFee = marketplaceBreakdown([
      ["items_subtotal", 10000],
      ["delivery", 750],
      ["platform_fee", 500],
    ]); // total 11250
    const out = applyVatToBreakdown(withFee, { treatment: "standard", convention: "inclusive" }, NG_VAT);
    const total = out.totals.customerTotal.amount;
    const fees = out.lines.filter((l) => l.code === "platform_fee").reduce((s, l) => s + l.amount.amount, 0);
    const tax = extractTaxFromBreakdown(out)?.taxMinor ?? 0;
    assert.equal(total, 11250, "inclusive → unchanged");
    assert.ok(total - fees - tax >= 0, "receipt residual subtotal non-negative");
  });
});

describe("applyVatToBreakdown — exclusive (add on top): total grows by the VAT", () => {
  const base = marketplaceBreakdown([["service_fee", 1000]]);
  it("appends 75 VAT; customerTotal grows 1000 → 1075", () => {
    const out = applyVatToBreakdown(base, { treatment: "standard", convention: "exclusive" }, NG_VAT);
    assert.equal(out.totals.customerTotal.amount, 1075);
    assert.equal(extractTaxFromBreakdown(out)?.taxMinor, 75);
  });
});

describe("applyVatToBreakdown — facilitator base (VAT only on the platform fee)", () => {
  const base = marketplaceBreakdown([
    ["items_subtotal", 10000],
    ["delivery", 750],
    ["platform_fee", 1075],
  ]); // total 11825
  it("taxes ONLY platform_fee (carve 75); customerTotal still the full 11825", () => {
    const out = applyVatToBreakdown(
      base,
      { treatment: "standard", convention: "inclusive", taxableLineCodes: ["platform_fee"] },
      NG_VAT,
    );
    assert.equal(out.totals.customerTotal.amount, 11825);
    assert.equal(extractTaxFromBreakdown(out)?.taxMinor, 75, "VAT carved from the 1075 fee only");
  });
});

describe("applyVatToBreakdown — robustness", () => {
  const base = marketplaceBreakdown([["items_subtotal", 10750]]);

  it("exempt / zero-rated: NO tax line, total unchanged", () => {
    for (const treatment of ["exempt", "zero_rated"] as const) {
      const out = applyVatToBreakdown(base, { treatment, convention: "inclusive" }, NG_VAT);
      assert.equal(extractTaxFromBreakdown(out), null, `${treatment} → no line`);
      assert.equal(out.totals.customerTotal.amount, 10750);
    }
  });

  it("is idempotent (applying twice yields ONE tax line, same VAT, same total)", () => {
    const once = applyVatToBreakdown(base, { treatment: "standard", convention: "inclusive" }, NG_VAT);
    const twice = applyVatToBreakdown(once, { treatment: "standard", convention: "inclusive" }, NG_VAT);
    assert.equal(twice.lines.filter((l) => l.code === "tax").length, 1);
    assert.equal(extractTaxFromBreakdown(twice)?.taxMinor, 750);
    assert.equal(twice.totals.customerTotal.amount, 10750);
  });

  it("does not mutate the input breakdown", () => {
    const before = JSON.stringify(base);
    applyVatToBreakdown(base, { treatment: "standard", convention: "exclusive" }, NG_VAT);
    assert.equal(JSON.stringify(base), before);
  });
});

// --- computeTax (S3) + the adapter seam (S7), with injected resolved rates ---

const NG_RATE: ResolvedRate = {
  rate: 0.075,
  version: "NG-VAT-7.5-2020-02-01",
  treatment: "standard",
  basisPoints: 750,
  rateId: "ng-vat-standard-2020",
  authorityName: "Federal Inland Revenue Service (FIRS)",
  authorityRef: "VAT Act / Finance Act 2019",
  jurisdiction: "NG",
};

describe("computeTax — resolved-rate engine (degrades to zero, never throws)", () => {
  it("standard NG: 7.5% inclusive carve with authority recorded", () => {
    const r = computeTax({ subtotalMinor: 10750, currency: "NGN", convention: "inclusive" }, NG_RATE);
    assert.equal(r.vatMinor, 750);
    assert.equal(r.rateMissing, false);
    assert.equal(r.exemptApplied, false);
    assert.equal(r.authorityName, "Federal Inland Revenue Service (FIRS)");
    assert.equal(r.basisPoints, 750);
  });

  it("exempt category: vat 0, exemptApplied true (the supply was assessed, just not charged)", () => {
    const r = computeTax(
      { subtotalMinor: 10000, currency: "NGN", convention: "inclusive" },
      { ...NG_RATE, treatment: "exempt", basisPoints: 0, rateId: "ng-vat-food-exempt" },
    );
    assert.equal(r.vatMinor, 0);
    assert.equal(r.exemptApplied, true);
  });

  it("missing rate (unknown jurisdiction): vat 0, rateMissing true, NO throw", () => {
    const r = computeTax({ subtotalMinor: 10000, currency: "USD", convention: "exclusive" }, null);
    assert.equal(r.vatMinor, 0);
    assert.equal(r.rateMissing, true);
    assert.equal(r.grossMinor, 10000);
  });

  it("S6 — a new market is a DATA-only change: a hypothetical 20% UK rate computes with NO engine change", () => {
    const UK: ResolvedRate = { ...NG_RATE, rate: 0.2, version: "GB-VAT-20-2011", basisPoints: 2000, jurisdiction: "GB" };
    const r = computeTax({ subtotalMinor: 12000, currency: "NGN", convention: "inclusive" }, UK);
    // 12000 incl 20% → ex 10000, vat 2000.
    assert.equal(r.vatMinor, 2000);
    assert.equal(r.netMinor, 10000);
  });

  it("telemetry: completed / exemption / rate-missing classified with no raw PII", () => {
    assert.equal(describeTaxTelemetry(computeTax({ subtotalMinor: 10750, currency: "NGN", convention: "inclusive" }, NG_RATE)).name, TAX_TELEMETRY.computationCompleted);
    assert.equal(describeTaxTelemetry(computeTax({ subtotalMinor: 100, currency: "NGN", convention: "inclusive" }, { ...NG_RATE, treatment: "exempt" })).name, TAX_TELEMETRY.exemptionApplied);
    assert.equal(describeTaxTelemetry(computeTax({ subtotalMinor: 100, currency: "USD", convention: "inclusive" }, null)).name, TAX_TELEMETRY.rateMissing);
  });
});

describe("InternalTaxAdapter — the only wired implementation (vendor seam, S7)", () => {
  it("computes through the injected resolver", async () => {
    const adapter = new InternalTaxAdapter((input) => (input.currency === "NGN" ? NG_RATE : null));
    const ng = await adapter.compute({ subtotalMinor: 10750, currency: "NGN", convention: "inclusive" });
    assert.equal(ng.vatMinor, 750);
    const other = await adapter.compute({ subtotalMinor: 10750, currency: "USD", convention: "inclusive" });
    assert.equal(other.rateMissing, true);
  });
});
