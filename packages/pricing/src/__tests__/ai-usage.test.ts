import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  computeAiUsageBreakdown,
  meterAiCostKobo,
  defaultAiUsageRules,
  extractTaxFromBreakdown,
  type AiUsageRuleSet,
  type MeteredUsage,
} from "../index";

// Dependency-injected VAT policy — pricing stays a leaf package; the canonical
// value is @henryco/config TAX.vat (7.5%). Mirrors vat.test.ts:18.
const NG_VAT = { standardRate: 0.075, rateVersion: "NG-VAT-7.5-2020-02-01" };

// The D4 LAUNCH rate card (owner-reconciled 2026-07-03): per-token kobo rates equal the
// live provider list price per tier at ~₦1,600/USD (fast $1/$5, standard $3/$15,
// deep $5/$25) so the ai_compute line is TRUE cost. Margin: fast/standard 10%,
// deep 35% (the deliberate premium). Floor 500 kobo.
const RULES: AiUsageRuleSet = {
  key: "ai-usage-rate-card-test",
  version: "test-2026-06-27",
  currency: "NGN",
  tiers: {
    fast: {
      rate: { in: 0.16, out: 0.8, cacheRead: 0.016, cacheWrite: 0.2 },
      marginRate: 0.1,
      minChargeableKobo: 500,
      maxCostKoboPerCall: 50_000,
    },
    standard: {
      rate: { in: 0.48, out: 2.4, cacheRead: 0.048, cacheWrite: 0.6 },
      marginRate: 0.1,
      minChargeableKobo: 500,
      maxCostKoboPerCall: 100_000,
    },
    deep: {
      rate: { in: 0.8, out: 4, cacheRead: 0.08, cacheWrite: 1 },
      marginRate: 0.35,
      minChargeableKobo: 500,
      maxCostKoboPerCall: 200_000,
    },
  },
};

// The actual metered usage from the worked example: 1,500 input + 600 output,
// no cache, one call.
const WORKED_USAGE: MeteredUsage = {
  inputTokens: 1_500,
  outputTokens: 600,
  cacheReadTokens: 0,
  cacheWriteTokens: 0,
  calls: 1,
};

function lineAmount(breakdown: ReturnType<typeof computeAiUsageBreakdown>, code: string): number | undefined {
  return breakdown.lines.find((l) => l.code === code)?.amount.amount;
}

describe("computeAiUsageBreakdown — the worked example reproduces and balances", () => {
  it("standard tier bills ₦25.54 (2,554 kobo) incl ₦1.78 VAT", () => {
    const b = computeAiUsageBreakdown({
      rules: RULES,
      tier: "standard",
      usage: WORKED_USAGE,
      vat: { policy: NG_VAT },
    });

    // cost = round(1500*0.48 + 600*2.40) = 720 + 1440 = 2160
    assert.equal(lineAmount(b, "ai_compute"), 2_160);
    // margin = round(2160 * 0.10) = 216 ; net = max(500, 2376) = 2376
    assert.equal(lineAmount(b, "ai_margin"), 216);
    // VAT = round(2376 * 0.075) = round(178.2) = 178
    assert.equal(lineAmount(b, "tax"), 178);
    // customerTotal = 2376 + 178 = 2554
    assert.equal(b.totals.customerTotal.amount, 2_554);
    assert.equal(b.meta.division, "ai");
    assert.equal((b.meta as { tier?: string }).tier, "standard");
  });

  it("deep tier bills ₦52.25 (5,225 kobo) for the identical question", () => {
    const b = computeAiUsageBreakdown({
      rules: RULES,
      tier: "deep",
      usage: WORKED_USAGE,
      vat: { policy: NG_VAT },
    });

    // cost = round(1500*0.80 + 600*4.00) = 1200 + 2400 = 3600 (true Opus-class list price)
    assert.equal(lineAmount(b, "ai_compute"), 3_600);
    // margin = round(3600 * 0.35) = 1260 ; net = 4860 (the deliberate deep premium)
    assert.equal(lineAmount(b, "ai_margin"), 1_260);
    // VAT = round(4860 * 0.075) = round(364.5) = 365
    assert.equal(lineAmount(b, "tax"), 365);
    assert.equal(b.totals.customerTotal.amount, 5_225);
  });

  it("the breakdown balances: customerTotal = cost + margin + VAT", () => {
    for (const tier of ["fast", "standard", "deep"] as const) {
      const b = computeAiUsageBreakdown({ rules: RULES, tier, usage: WORKED_USAGE, vat: { policy: NG_VAT } });
      const cost = lineAmount(b, "ai_compute") ?? 0;
      const margin = lineAmount(b, "ai_margin") ?? 0;
      const vat = lineAmount(b, "tax") ?? 0;
      assert.equal(b.totals.customerTotal.amount, cost + margin + vat, `tier ${tier} must balance`);
      // platformNet = the margin over COGS (net − cost = the ai_margin line);
      // vendorGross = the provider cost (COGS). The ledger recognises cost+margin as
      // revenue separately — that is the settle RPC's job, not the breakdown's.
      assert.equal(b.totals.platformNet.amount, margin);
      assert.equal(b.totals.vendorGross.amount, cost);
    }
  });
});

describe("computeAiUsageBreakdown — money discipline", () => {
  it("every amount is a whole, non-negative integer kobo", () => {
    const b = computeAiUsageBreakdown({ rules: RULES, tier: "standard", usage: WORKED_USAGE, vat: { policy: NG_VAT } });
    for (const line of b.lines) {
      assert.ok(Number.isInteger(line.amount.amount), `${line.code} amount must be integer kobo`);
      assert.ok(line.amount.amount >= 0, `${line.code} amount must be >= 0`);
    }
    for (const total of Object.values(b.totals)) {
      assert.ok(Number.isInteger(total.amount), "totals must be integer kobo");
    }
  });

  it("applies the per-tier minimum charge floor to net (cost + margin)", () => {
    // A near-zero call: 1 input + 1 output on standard → cost = round(0.48 + 2.40) = 3,
    // margin = round(3*0.10) = 0, raw net = 3, floored up to 500.
    const tiny: MeteredUsage = { inputTokens: 1, outputTokens: 1, cacheReadTokens: 0, cacheWriteTokens: 0, calls: 1 };
    const b = computeAiUsageBreakdown({ rules: RULES, tier: "standard", usage: tiny, vat: { policy: NG_VAT } });
    assert.equal(lineAmount(b, "ai_compute"), 3);
    // the floored remainder is attributed to the margin line so lines sum to net=500
    assert.equal(lineAmount(b, "ai_margin"), 497);
    // VAT = round(500 * 0.075) = round(37.5) = 38 ; total = 538
    assert.equal(lineAmount(b, "tax"), 38);
    assert.equal(b.totals.customerTotal.amount, 538);
  });

  it("stamps meta.vat with the authoritative kobo output VAT", () => {
    const b = computeAiUsageBreakdown({ rules: RULES, tier: "standard", usage: WORKED_USAGE, vat: { policy: NG_VAT } });
    assert.equal(b.meta.vat?.outputVatMinor, 178);
    assert.equal(b.meta.vat?.standardBaseMinor, 2_376);
    assert.equal(b.meta.vat?.rateVersion, NG_VAT.rateVersion);
    // and extractTaxFromBreakdown (the receipt's only VAT source) agrees
    assert.equal(extractTaxFromBreakdown(b)?.taxMinor, 178);
  });

  it("defers VAT when the treatment is non-standard (charges cost+margin only)", () => {
    const b = computeAiUsageBreakdown({
      rules: RULES,
      tier: "standard",
      usage: WORKED_USAGE,
      vat: { policy: NG_VAT, treatment: "exempt" },
    });
    assert.equal(lineAmount(b, "tax"), undefined, "no tax line when deferred");
    assert.equal(b.totals.customerTotal.amount, 2_376, "total is net only");
    assert.equal(extractTaxFromBreakdown(b), null);
  });

  it("prices cache tokens at their own per-tier rates", () => {
    const usage: MeteredUsage = {
      inputTokens: 1_000,
      outputTokens: 200,
      cacheReadTokens: 500,
      cacheWriteTokens: 400,
      calls: 1,
    };
    // standard cost = round(1000*0.48 + 200*2.40 + 500*0.048 + 400*0.60)
    //              = 480 + 480 + 24 + 240 = 1224
    assert.equal(meterAiCostKobo(usage, RULES.tiers.standard.rate), 1_224);
  });
});

describe("meterAiCostKobo — the provable upper-bound foundation", () => {
  it("is monotonic non-decreasing in every token count (all rates >= 0)", () => {
    const rate = RULES.tiers.deep.rate;
    const base: MeteredUsage = { inputTokens: 100, outputTokens: 50, cacheReadTokens: 10, cacheWriteTokens: 5, calls: 1 };
    const baseCost = meterAiCostKobo(base, rate);
    for (const key of ["inputTokens", "outputTokens", "cacheReadTokens", "cacheWriteTokens"] as const) {
      const more = { ...base, [key]: base[key] + 250 };
      assert.ok(meterAiCostKobo(more, rate) >= baseCost, `increasing ${key} must not lower cost`);
    }
  });

  it("treats cache-read as never more expensive than full input (estimate>=actual holds)", () => {
    const rate = RULES.tiers.standard.rate;
    const prompt = 2_000;
    // ESTIMATE counts ALL prompt tokens at full input rate, cacheRead = 0.
    const estimate: MeteredUsage = { inputTokens: prompt, outputTokens: 1_024, cacheReadTokens: 0, cacheWriteTokens: prompt, calls: 1 };
    // ACTUAL moves some prompt tokens to the cheaper cache-read bucket and emits less output.
    const actual: MeteredUsage = { inputTokens: prompt - 1_500, outputTokens: 600, cacheReadTokens: 1_500, cacheWriteTokens: 0, calls: 1 };
    assert.ok(
      meterAiCostKobo(estimate, rate) >= meterAiCostKobo(actual, rate),
      "the worst-case estimate must never be undercharged by the actual",
    );
  });
});

describe("defaultAiUsageRules — the shipped launch baseline", () => {
  it("reproduces the worked example end to end (₦25.54 standard / ₦52.25 deep)", () => {
    const rules = defaultAiUsageRules();
    const std = computeAiUsageBreakdown({ rules, tier: "standard", usage: WORKED_USAGE, vat: { policy: NG_VAT } });
    const deep = computeAiUsageBreakdown({ rules, tier: "deep", usage: WORKED_USAGE, vat: { policy: NG_VAT } });
    assert.equal(std.totals.customerTotal.amount, 2_554);
    assert.equal(deep.totals.customerTotal.amount, 5_225);
  });
});
