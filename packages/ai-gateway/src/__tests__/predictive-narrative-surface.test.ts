import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { defaultAiUsageRules } from "@henryco/pricing";
import { runAiTaskWith, type AiTaskDeps } from "../orchestrator";
import { AI_SURFACES, getSurfacePolicy } from "../surfaces";
import type { AiBillingPort } from "../billing-port";
import type { AiProviderAdapter } from "../provider-types";
import type { AiTask } from "../contracts";

/**
 * V3-41 — the ZERO-WALLET-DEBIT proof for the platform-invoked staff narrative.
 *
 * The technique is an EXPLODING BILLING PORT: every method throws and counts its
 * own invocation. If any wallet path were reachable from `predictive.narrative`,
 * the task would fail loudly and `touches()` would be non-zero. A green run is
 * therefore positive evidence that no wallet was opened — not merely the absence
 * of an assertion that one was.
 *
 * (E-D1: a person can never be billed for work the PLATFORM asked for.)
 */

const NG_VAT = { standardRate: 0.075, rateVersion: "NG-VAT-7.5-2020-02-01" };

function explodingBilling(): AiBillingPort & { touches: () => number } {
  let touches = 0;
  return {
    touches: () => touches,
    async reserve(): Promise<never> {
      touches += 1;
      throw new Error("BILLING PORT TOUCHED — a wallet debit path was reached from a platform-invoked surface");
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
}

function adapter(): AiProviderAdapter & { calls: () => number } {
  let calls = 0;
  return {
    key: "test",
    calls: () => calls,
    async generate() {
      calls += 1;
      return {
        ok: true,
        value: {
          output: "Support volume next week is close to the last three weeks.",
          usage: { inputTokens: 300, outputTokens: 40, cacheReadTokens: 0, cacheWriteTokens: 0 },
          // Deliberately provider-shaped so the opacity assertion is load-bearing.
          modelUsedInternal: "claude-secret-model-xyz",
          finishReason: "stop",
        },
      };
    },
  };
}

function deps(billing: AiBillingPort, ad: AiProviderAdapter): AiTaskDeps {
  return {
    adapter: ad,
    billing,
    rules: defaultAiUsageRules(),
    vatPolicy: NG_VAT,
    killSwitchEnabled: true,
    now: () => new Date(0),
    promptBuilder: (_task, policy) => ({
      system: `system for ${policy.surface}`,
      messages: [{ role: "user", content: "describe the forecast" }],
    }),
    newId: () => "evt-predictive",
  };
}

function task(): AiTask {
  return {
    surface: "predictive.narrative",
    actorId: "system:predictive-batch",
    input: { messages: [{ role: "user", content: "queue=support total=120" }] },
    idempotencyKey: "idem-predictive-narrative",
  };
}

describe("predictive.narrative — platform-invoked, never a wallet", () => {
  it("is registered billable:false with a bounded daily allowance", () => {
    const policy = getSurfacePolicy("predictive.narrative");
    assert.ok(policy, "the surface must be registered");
    assert.equal(policy?.billable, false, "a platform-invoked narrative must be non-billable");
    assert.ok((policy?.freeAllowancePerDay ?? 0) > 0, "even free surfaces are rate-limited");
    assert.equal(policy?.maxCalls, 1, "one provider round-trip per narrative");
    assert.equal(policy?.modelTier, "fast", "prose about a number does not need the deep tier");
  });

  it("completes WITHOUT touching a billing port whose every method throws", async () => {
    const ad = adapter();
    const billing = explodingBilling();
    const res = await runAiTaskWith(deps(billing, ad), task());
    assert.equal(res.ok, true, res.ok ? "" : JSON.stringify(res));
    assert.equal(ad.calls(), 1, "the provider ran exactly once");
    assert.equal(billing.touches(), 0, "NO billing-port method was ever invoked");
    if (res.ok) {
      assert.equal(res.value.receipt.totalKobo, 0, "a platform-invoked call charges nobody");
      assert.equal(res.value.receipt.billed, false);
    }
  });

  it("the receipt never leaks provider, model or cost vocabulary", async () => {
    const res = await runAiTaskWith(deps(explodingBilling(), adapter()), task());
    assert.equal(res.ok, true);
    if (!res.ok) return;
    const serialized = JSON.stringify(res.value.receipt).toLowerCase();
    for (const forbidden of ["provider", "model", "claude", "secret", "cost", "margin"]) {
      assert.equal(serialized.includes(forbidden), false, `receipt must not contain "${forbidden}"`);
    }
  });

  it("every non-billable surface in the registry carries a daily allowance", () => {
    for (const [key, policy] of Object.entries(AI_SURFACES)) {
      if (policy.billable) continue;
      assert.ok(
        (policy.freeAllowancePerDay ?? 0) > 0,
        `${key} is non-billable but unbounded — an anti-abuse hole`,
      );
    }
  });
});
