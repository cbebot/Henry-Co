import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { defaultAiUsageRules } from "@henryco/pricing";

import { runAiTaskWith, type AiTaskDeps } from "../orchestrator";
import { InMemoryBilling } from "../testing/in-memory-billing";
import type { AiProviderAdapter, ProviderError, ProviderResult, ProviderUsage } from "../provider-types";
import type { AiTask } from "../contracts";

const NG_VAT = { standardRate: 0.075, rateVersion: "NG-VAT-7.5-2020-02-01" };
const VENDOR = "vendor-1";

// A recording fake adapter — exposes a call counter so a test can prove the provider was
// (or was NOT) dispatched. Returns the worked-example usage by default and a SECRET model
// id, so opacity tests can prove the model name never reaches the receipt.
function recordingAdapter(opts: {
  usage?: ProviderUsage;
  output?: string;
  error?: ProviderError;
  finishReason?: ProviderResult["finishReason"];
  outputs?: string[]; // successive outputs for retry tests
} = {}) {
  let calls = 0;
  const adapter: AiProviderAdapter & { calls: () => number } = {
    key: "test-provider",
    calls: () => calls,
    async generate() {
      const i = calls;
      calls += 1;
      if (opts.error) return { ok: false, error: opts.error };
      const output = opts.outputs ? opts.outputs[Math.min(i, opts.outputs.length - 1)] : opts.output ?? '{"summary":"ok"}';
      return {
        ok: true,
        value: {
          output,
          usage: opts.usage ?? { inputTokens: 1500, outputTokens: 600, cacheReadTokens: 0, cacheWriteTokens: 0 },
          modelUsedInternal: "claude-secret-model-xyz",
          finishReason: opts.finishReason ?? "stop",
        },
      };
    },
  };
  return adapter;
}

function makeDeps(overrides: Partial<AiTaskDeps> & { adapter: AiProviderAdapter; billing: InMemoryBilling }): AiTaskDeps {
  return {
    rules: defaultAiUsageRules(),
    vatPolicy: NG_VAT,
    killSwitchEnabled: true,
    now: () => new Date(1_700_000_000_000),
    promptBuilder: () => ({ system: "You are Henry Onyx Intelligence.", messages: [{ role: "user", content: "Draft a listing for a leather bag." }] }),
    ...overrides,
  };
}

function task(overrides: Partial<AiTask> = {}): AiTask {
  return { surface: "marketplace.listing.draft", actorId: VENDOR, input: { title: "Leather bag" }, idempotencyKey: "idem-1", ...overrides };
}

describe("runAiTaskWith — the prepaid gate (wallet-zero ⇒ provider never called)", () => {
  it("refuses a wallet-zero vendor BEFORE dispatching the provider", async () => {
    const adapter = recordingAdapter();
    const billing = new InMemoryBilling({ balances: { [VENDOR]: 0 } });
    const res = await runAiTaskWith(makeDeps({ adapter, billing }), task());

    assert.equal(res.ok, false);
    assert.equal(res.ok === false && res.error.code, "insufficient_funds");
    assert.equal(adapter.calls(), 0, "the model must NOT be called when the wallet can't cover the estimate");
    assert.equal(billing.debitCount, 0, "nothing is debited");
  });

  it("refuses instantly when the kill switch is off, without touching wallet or provider", async () => {
    const adapter = recordingAdapter();
    const billing = new InMemoryBilling({ balances: { [VENDOR]: 1_000_000 } });
    const res = await runAiTaskWith(makeDeps({ adapter, billing, killSwitchEnabled: false }), task());

    assert.equal(res.ok === false && res.error.code, "kill_switch_active");
    assert.equal(adapter.calls(), 0);
    assert.equal(billing.reserveCount, 0, "no reservation is made when paused");
  });
});

describe("runAiTaskWith — metered happy path", () => {
  it("meters, prices the worked example (₦25.54), debits once, and returns a redacted receipt", async () => {
    const adapter = recordingAdapter();
    const billing = new InMemoryBilling({ balances: { [VENDOR]: 1_000_000 } });
    const res = await runAiTaskWith(makeDeps({ adapter, billing }), task());

    assert.equal(res.ok, true);
    if (!res.ok) return;
    assert.equal(adapter.calls(), 1);
    assert.equal(billing.debitCount, 1);
    // standard tier, 1500 in / 600 out → 2,554 kobo incl 178 VAT
    assert.equal(res.value.receipt.totalKobo, 2_554);
    assert.equal(res.value.receipt.vatKobo, 178);
    assert.equal(res.value.receipt.tier, "standard");
    assert.equal(res.value.receipt.billed, true);
    assert.equal(billing.balanceOf(VENDOR), 1_000_000 - 2_554);
    // the over-estimate remainder is released → available is restored to balance
    assert.equal(billing.availableOf(VENDOR), 1_000_000 - 2_554);
  });

  it("NEVER leaks the provider or real model name into the receipt", async () => {
    const adapter = recordingAdapter();
    const billing = new InMemoryBilling({ balances: { [VENDOR]: 1_000_000 } });
    const res = await runAiTaskWith(makeDeps({ adapter, billing }), task());
    assert.equal(res.ok, true);
    if (!res.ok) return;
    const serialized = JSON.stringify(res.value.receipt);
    assert.ok(!serialized.includes("claude"), "no model family name");
    assert.ok(!serialized.includes("secret-model"), "no internal model id");
    assert.ok(!serialized.includes("anthropic"), "no provider name");
    assert.ok(!/cost|margin|provider|model/i.test(serialized), "no cost/margin/provider/model fields");
    assert.deepEqual(
      Object.keys(res.value.receipt).sort(),
      ["billed", "surface", "tier", "totalKobo", "usageEventId", "vatKobo"],
    );
  });
});

describe("runAiTaskWith — idempotency (replay ⇒ exactly one charge)", () => {
  it("debits exactly once across a replay of the same idempotency key", async () => {
    const billing = new InMemoryBilling({ balances: { [VENDOR]: 1_000_000 } });
    const deps = makeDeps({ adapter: recordingAdapter(), billing });

    const first = await runAiTaskWith(deps, task({ idempotencyKey: "idem-replay" }));
    const second = await runAiTaskWith(deps, task({ idempotencyKey: "idem-replay" }));

    assert.equal(first.ok, true);
    assert.equal(second.ok, true);
    assert.equal(billing.debitCount, 1, "a replay must NOT double-charge");
    assert.equal(billing.balanceOf(VENDOR), 1_000_000 - 2_554, "balance moved by exactly one charge");
  });
});

describe("runAiTaskWith — provider failures release the hold and charge nothing", () => {
  it("releases the hold and does not charge on a provider error", async () => {
    const adapter = recordingAdapter({ error: { code: "provider_error", message: "down", retryable: true, providerKey: "test-provider" } });
    const billing = new InMemoryBilling({ balances: { [VENDOR]: 1_000_000 } });
    const res = await runAiTaskWith(makeDeps({ adapter, billing }), task());

    assert.equal(res.ok === false && res.error.code, "provider_error");
    assert.equal(billing.debitCount, 0, "no charge on provider failure");
    assert.equal(billing.availableOf(VENDOR), 1_000_000, "the hold is released — available restored");
  });

  it("does not bill a model refusal", async () => {
    const adapter = recordingAdapter({ finishReason: "refusal" });
    const billing = new InMemoryBilling({ balances: { [VENDOR]: 1_000_000 } });
    const res = await runAiTaskWith(makeDeps({ adapter, billing }), task());
    assert.equal(res.ok === false && res.error.code, "provider_refusal");
    assert.equal(billing.debitCount, 0);
  });

  it("maps a timeout to provider_timeout and charges nothing", async () => {
    const adapter = recordingAdapter({ error: { code: "model_timeout", message: "slow", retryable: true, providerKey: "test-provider" } });
    const billing = new InMemoryBilling({ balances: { [VENDOR]: 1_000_000 } });
    const res = await runAiTaskWith(makeDeps({ adapter, billing }), task());
    assert.equal(res.ok === false && res.error.code, "provider_timeout");
    assert.equal(billing.debitCount, 0);
  });
});

describe("runAiTaskWith — caps and validation", () => {
  it("refuses (cap_exceeded) before dispatch when the estimate exceeds the per-call ceiling", async () => {
    const adapter = recordingAdapter();
    const billing = new InMemoryBilling({ balances: { [VENDOR]: 1_000_000 } });
    const rules = defaultAiUsageRules();
    rules.tiers.standard.maxCostKoboPerCall = 1; // any real estimate exceeds this
    const res = await runAiTaskWith(makeDeps({ adapter, billing, rules }), task());

    assert.equal(res.ok === false && res.error.code, "cap_exceeded");
    assert.equal(adapter.calls(), 0, "capped calls never reach the provider");
    assert.equal(billing.reserveCount, 0);
  });

  it("retries once then refuses (schema_validation_failed) on persistently invalid output", async () => {
    const adapter = recordingAdapter({ outputs: ["not json", "still not json"] });
    const billing = new InMemoryBilling({ balances: { [VENDOR]: 1_000_000 } });
    const validateOutput = (raw: string) => raw.trim().startsWith("{");
    const res = await runAiTaskWith(makeDeps({ adapter, billing, validateOutput }), task());

    assert.equal(res.ok === false && res.error.code, "schema_validation_failed");
    assert.equal(adapter.calls(), 2, "exactly one retry");
    assert.equal(billing.debitCount, 0, "an unusable result is not billed");
    assert.equal(billing.availableOf(VENDOR), 1_000_000, "hold released");
  });
});

describe("runAiTaskWith — the charge is hard-capped at the reservation (the universal guarantee)", () => {
  it("never settles above what was reserved, EVEN when actuals exceed the estimate (dense-tokenization / estimator-miss)", async () => {
    // Worst case for the char-based estimator: a tiny prompt (small reservation) but the
    // provider reports large actuals (as dense CJK/Arabic tokenization or any estimator
    // miss would). The structural cap must still protect the customer.
    const adapter = recordingAdapter({ usage: { inputTokens: 4096, outputTokens: 1024, cacheReadTokens: 0, cacheWriteTokens: 4096 } });
    const billing = new InMemoryBilling({ balances: { [VENDOR]: 1_000_000 } });
    let reservedKobo = 0;
    let cappedSignalled = false;
    const onSignal = (s: { kind: string; totalKobo?: number; cappedToReserve?: boolean }) => {
      if (s.kind === "estimated") reservedKobo = s.totalKobo ?? 0;
      if (s.kind === "metered" && s.cappedToReserve) cappedSignalled = true;
    };
    const res = await runAiTaskWith(makeDeps({ adapter, billing, onSignal }), task());
    assert.equal(res.ok, true);
    if (!res.ok) return;
    // The customer is charged EXACTLY the quoted reservation, never the higher actual.
    assert.equal(res.value.receipt.totalKobo, reservedKobo, "an over-run is capped to the quote");
    assert.equal(billing.balanceOf(VENDOR), 1_000_000 - reservedKobo, "wallet moved by the quote, never more");
    assert.ok(cappedSignalled, "the cap is surfaced via cappedToReserve for estimator tuning");
  });
});
