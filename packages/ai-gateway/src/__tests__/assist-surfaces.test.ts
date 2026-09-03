import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { defaultAiUsageRules } from "@henryco/pricing";
import { runAiTaskWith, type AiTaskDeps } from "../orchestrator";
import { InMemoryBilling } from "../testing/in-memory-billing";
import { AI_SURFACES, type AiSurfaceKey } from "../surfaces";
import type { AiProviderAdapter } from "../provider-types";
import type { AiTask } from "../contracts";

const NG_VAT = { standardRate: 0.075, rateVersion: "NG-VAT-7.5-2020-02-01" };
const USER = "user-assist-1";

function adapter(): AiProviderAdapter & { calls: () => number } {
  let calls = 0;
  return {
    key: "test",
    calls: () => calls,
    async generate() {
      calls += 1;
      return {
        ok: true,
        value: { output: "Here is a calm, helpful reply.", usage: { inputTokens: 800, outputTokens: 200, cacheReadTokens: 0, cacheWriteTokens: 0 }, modelUsedInternal: "secret", finishReason: "stop" },
      };
    },
  };
}

function deps(billing: InMemoryBilling, ad: AiProviderAdapter): AiTaskDeps {
  return {
    adapter: ad,
    billing,
    rules: defaultAiUsageRules(),
    vatPolicy: NG_VAT,
    killSwitchEnabled: true,
    now: () => new Date(0),
    promptBuilder: (_task, policy) => ({ system: `system for ${policy.surface}`, messages: [{ role: "user", content: "help" }] }),
    newId: () => "evt-free",
  };
}

function task(surface: AiSurfaceKey): AiTask {
  return { surface, actorId: USER, input: { text: "help me" }, idempotencyKey: `idem-${surface}` };
}

describe("assist surfaces — FREE vs METERED policy", () => {
  it("support.message.assist is FREE — runs without touching the wallet, receipt unbilled", async () => {
    const ad = adapter();
    const billing = new InMemoryBilling({ balances: {} }); // no wallet at all
    const res = await runAiTaskWith(deps(billing, ad), task("support.message.assist"));
    assert.equal(res.ok, true);
    if (!res.ok) return;
    assert.equal(res.value.receipt.billed, false);
    assert.equal(res.value.receipt.totalKobo, 0);
    assert.equal(ad.calls(), 1);
    assert.equal(billing.reserveCount, 0, "FREE surface never reserves");
    assert.equal(billing.debitCount, 0, "FREE surface never debits");
  });

  it("account.check.assist is FREE", async () => {
    const ad = adapter();
    const billing = new InMemoryBilling({ balances: {} });
    const res = await runAiTaskWith(deps(billing, ad), task("account.check.assist"));
    assert.equal(res.ok, true);
    if (res.ok) assert.equal(res.value.receipt.billed, false);
    assert.equal(billing.debitCount, 0);
  });

  it("studio.brief.staff is FREE/internal", () => {
    assert.equal(AI_SURFACES["studio.brief.staff"].billable, false);
  });

  it("studio.brief.coach is FREE/internal (multi-turn coach, not billed)", () => {
    assert.equal(AI_SURFACES["studio.brief.coach"].billable, false);
    assert.equal(AI_SURFACES["studio.brief.coach"].modelTier, "fast");
  });

  it("business.message.assist is METERED — reserves + debits the wallet", async () => {
    const ad = adapter();
    const billing = new InMemoryBilling({ balances: { [USER]: 1_000_000 } });
    const res = await runAiTaskWith(deps(billing, ad), task("business.message.assist"));
    assert.equal(res.ok, true);
    if (!res.ok) return;
    assert.equal(res.value.receipt.billed, true);
    assert.ok(res.value.receipt.totalKobo > 0);
    assert.equal(billing.debitCount, 1, "METERED surface debits once");
  });

  it("studio.brief.client is METERED", () => {
    assert.equal(AI_SURFACES["studio.brief.client"].billable, true);
  });

  it("a METERED assist with a zero wallet is refused before the provider call", async () => {
    const ad = adapter();
    const billing = new InMemoryBilling({ balances: { [USER]: 0 } });
    const res = await runAiTaskWith(deps(billing, ad), task("business.message.assist"));
    assert.equal(res.ok === false && res.error.code, "insufficient_funds");
    assert.equal(ad.calls(), 0);
  });
});
