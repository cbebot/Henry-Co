import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { computeAiUsageBreakdown, defaultAiUsageRules, type MeteredUsage } from "@henryco/pricing";
import { estimateInputTokens, estimateUsageUpperBound } from "../metering";
import { getSurfacePolicy } from "../surfaces";

const NG_VAT = { standardRate: 0.075, rateVersion: "NG-VAT-7.5-2020-02-01" };

describe("estimateInputTokens", () => {
  it("returns a positive count for empty text and grows with length", () => {
    assert.ok(estimateInputTokens("") > 0);
    assert.ok(estimateInputTokens("a".repeat(300)) > estimateInputTokens("a".repeat(30)));
  });
});

describe("estimateUsageUpperBound", () => {
  it("counts the prompt as both full input and worst-case cache-write, output at the cap", () => {
    const policy = getSurfacePolicy("marketplace.listing.draft")!;
    const usage = estimateUsageUpperBound({ promptTokens: 200, policy });
    assert.equal(usage.inputTokens, 200);
    assert.equal(usage.cacheWriteTokens, 200);
    assert.equal(usage.cacheReadTokens, 0);
    assert.equal(usage.outputTokens, policy.maxOutputTokens);
    assert.equal(usage.calls, policy.maxCalls);
  });

  // Given a CORRECT prompt-token count, the reservation dominates any actual whose prompt
  // tokens stay within it and whose output stays within the cap (the in-domain case — the
  // common one). It does NOT prove the char-based `estimateInputTokens` is a cross-script
  // upper bound (it isn't, for dense CJK/Arabic): the UNIVERSAL customer protection when an
  // estimate under-counts is the structural settle-cap, proven in
  // orchestrator.test.ts ("never settles above what was reserved").
  it("a correct prompt-token reservation dominates any in-bound actual usage", () => {
    const policy = getSurfacePolicy("marketplace.listing.draft")!;
    const rules = defaultAiUsageRules();
    const promptTokens = 400;
    const estimate = estimateUsageUpperBound({ promptTokens, policy });
    const estimateBreakdown = computeAiUsageBreakdown({ rules, tier: "standard", usage: estimate, vat: { policy: NG_VAT } });

    const actuals: MeteredUsage[] = [
      { inputTokens: promptTokens, outputTokens: policy.maxOutputTokens, cacheReadTokens: 0, cacheWriteTokens: 0, calls: 1 },
      { inputTokens: 0, outputTokens: policy.maxOutputTokens, cacheReadTokens: promptTokens, cacheWriteTokens: 0, calls: 1 },
      { inputTokens: 100, outputTokens: 50, cacheReadTokens: 50, cacheWriteTokens: 100, calls: 1 },
    ];
    for (const actual of actuals) {
      const ab = computeAiUsageBreakdown({ rules, tier: "standard", usage: actual, vat: { policy: NG_VAT } });
      assert.ok(
        ab.totals.customerTotal.amount <= estimateBreakdown.totals.customerTotal.amount,
        `actual ${ab.totals.customerTotal.amount} must be <= estimate ${estimateBreakdown.totals.customerTotal.amount}`,
      );
    }
  });
});
