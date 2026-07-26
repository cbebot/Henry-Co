import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { getSurfacePolicy } from "@henryco/ai-gateway";

/**
 * V3-36 invariant — the recommendation AI re-rank is PLATFORM-INVOKED and must
 * NEVER debit a customer wallet (E-D1: a person cannot be charged for a
 * suggestion they never asked for). This is the "no-wallet-debit proof" the
 * V3-34 test (personalization/no-wallet-debit.test.ts) said would be revisited
 * when the governed re-rank landed.
 *
 * Two structural guarantees:
 *   1. the surface is registered `billable: false` — the gateway never opens a
 *      wallet hold for it;
 *   2. the adapter drives it through `noBillingPort` and references NONE of the
 *      money-RPC / wallet-billing tokens.
 */

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..", "..", "..");
const ADAPTER = "apps/account/lib/smart-home/recommendations-adapter.ts";

const MONEY_TOKENS = [
  "payments_private",
  "reserve_wallet_for_ai",
  "post_ai_usage_charge",
  "release_wallet_ai_hold",
  "customer_wallet",
  "billing: metered",
];

describe("V3-36 recommendation re-rank never debits a wallet", () => {
  it("the re-rank surface is registered billable:false (no wallet hold ever)", () => {
    const policy = getSurfacePolicy("intelligence.recommendations.rerank");
    assert.ok(policy, "the surface must be registered");
    assert.equal(policy?.billable, false, "the platform-invoked re-rank must be non-billable");
    assert.ok((policy?.freeAllowancePerDay ?? 0) > 0, "a per-actor daily allowance must bound it");
  });

  it("the adapter uses noBillingPort and no money-RPC / wallet token", () => {
    const source = readFileSync(path.join(ROOT, ADAPTER), "utf8");
    assert.ok(source.includes("noBillingPort"), "the re-rank must run through noBillingPort");
    assert.ok(
      source.includes('"intelligence.recommendations.rerank"'),
      "the re-rank must ride the registered non-billable surface",
    );
    for (const token of MONEY_TOKENS) {
      assert.ok(!source.includes(token), `the adapter must not reference "${token}"`);
    }
  });

  it("the adapter bounds platform-invoked spend on the company free-AI budget", () => {
    const source = readFileSync(path.join(ROOT, ADAPTER), "utf8");
    assert.ok(source.includes("checkFreeBudget"), "must gate on the free-AI daily budget");
    assert.ok(source.includes("recordFreeSpend"), "must record the internal spend");
  });
});
