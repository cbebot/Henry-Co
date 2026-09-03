import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { defaultAiUsageRules } from "@henryco/pricing";

import { runAiTaskWith, type AiTaskDeps } from "../orchestrator";
import { AI_SURFACES } from "../surfaces";
import type { AiBillingPort } from "../billing-port";
import type { AiProviderAdapter, ProviderResult, ProviderUsage } from "../provider-types";
import type { AiTask } from "../contracts";

/**
 * V3-40 — the platform-invoked risk advisory surface, adversarially proven:
 *   1. `risk.entity.assist` is billable:false in the registry (a policy flip to
 *      billable is a reviewed diff, not a runtime possibility);
 *   2. a billing port whose EVERY method THROWS never gets invoked — the task
 *      completes with totalKobo 0 (structural no-wallet-debit, stronger than
 *      noBillingPort's typed refusal);
 *   3. the receipt crossing the boundary never carries provider/model/cost
 *      vocabulary (assertClientSafe runs inside the orchestrator).
 */

const NG_VAT = { standardRate: 0.075, rateVersion: "NG-VAT-7.5-2020-02-01" };

const explodingBilling: AiBillingPort & { touches: () => number } = (() => {
  let touches = 0;
  return {
    touches: () => touches,
    async reserve(): Promise<never> {
      touches += 1;
      throw new Error("BILLING PORT TOUCHED — wallet debit path reached from a platform-invoked surface");
    },
    async settle(): Promise<never> {
      touches += 1;
      throw new Error("BILLING PORT TOUCHED — settle reached");
    },
    async release(): Promise<never> {
      touches += 1;
      throw new Error("BILLING PORT TOUCHED — release reached");
    },
  };
})();

function adapter(): AiProviderAdapter & { calls: () => number } {
  let calls = 0;
  return {
    key: "test-provider",
    calls: () => calls,
    async generate() {
      calls += 1;
      return {
        ok: true,
        value: {
          output: '{"adjustmentPoints": 4, "noteKey": "corroborating_pattern"}',
          usage: { inputTokens: 400, outputTokens: 40, cacheReadTokens: 0, cacheWriteTokens: 0 } satisfies ProviderUsage,
          modelUsedInternal: "claude-secret-model-xyz",
          finishReason: "stop" as ProviderResult["finishReason"],
        },
      };
    },
  };
}

function deps(a: AiProviderAdapter): AiTaskDeps {
  return {
    adapter: a,
    billing: explodingBilling,
    rules: defaultAiUsageRules(),
    vatPolicy: NG_VAT,
    killSwitchEnabled: true,
    now: () => new Date(1_700_000_000_000),
    promptBuilder: (task) => ({
      system: "You assist a fraud-review team.",
      messages: [{ role: "user", content: String((task.input as { prompt?: string }).prompt ?? "evidence") }],
    }),
  };
}

function task(): AiTask {
  return {
    surface: "risk.entity.assist",
    actorId: "system:risk-batch",
    input: { prompt: "factors: [signal.wallet_velocity_anomaly +22]" },
    idempotencyKey: "risk-assist:account:acct-1:2026-07-25:1.0.0",
  };
}

describe("risk.entity.assist — platform-invoked, never a wallet", () => {
  it("is registered billable:false with a bounded daily allowance", () => {
    const policy = AI_SURFACES["risk.entity.assist"];
    assert.equal(policy.billable, false);
    assert.ok((policy.freeAllowancePerDay ?? 0) > 0, "even free surfaces are rate-limited");
    assert.equal(policy.maxCalls, 1);
  });

  it("completes WITHOUT touching a billing port whose every method throws", async () => {
    const a = adapter();
    const res = await runAiTaskWith(deps(a), task());
    assert.equal(res.ok, true, res.ok ? "" : JSON.stringify(res));
    assert.equal(a.calls(), 1, "the provider ran once");
    assert.equal(explodingBilling.touches(), 0, "NO billing-port method was ever invoked");
    if (res.ok) {
      assert.equal(res.value.receipt.totalKobo, 0, "a platform-invoked call charges nobody");
      assert.equal(res.value.receipt.billed, false);
    }
  });

  it("the receipt never leaks provider/model/cost vocabulary", async () => {
    const res = await runAiTaskWith(deps(adapter()), task());
    assert.equal(res.ok, true);
    if (res.ok) {
      const serialized = JSON.stringify(res.value.receipt);
      for (const forbidden of ["provider", "model", "claude", "secret", "cost", "margin"]) {
        assert.equal(
          serialized.toLowerCase().includes(forbidden),
          false,
          `receipt must not contain "${forbidden}"`,
        );
      }
    }
  });
});
