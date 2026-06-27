import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { InMemoryRateLimiter } from "../rate-limit";
import { defaultAiUsageRules } from "@henryco/pricing";
import { runAiTaskWith, type AiTaskDeps } from "../orchestrator";
import { InMemoryBilling } from "../testing/in-memory-billing";
import type { AiProviderAdapter } from "../provider-types";
import type { AiTask } from "../contracts";
import type { AiSurfaceKey } from "../surfaces";

const NG_VAT = { standardRate: 0.075, rateVersion: "NG-VAT-7.5-2020-02-01" };

describe("InMemoryRateLimiter — windowed check-and-increment", () => {
  it("allows up to the cap then blocks within the window", async () => {
    let now = 1_000_000;
    const rl = new InMemoryRateLimiter(() => now);
    const key = { actorId: "u1", surface: "support.message.assist" as AiSurfaceKey, maxPerWindow: 3, windowMs: 1000 };
    assert.equal((await rl.consume(key)).allowed, true); // 1
    assert.equal((await rl.consume(key)).allowed, true); // 2
    assert.equal((await rl.consume(key)).allowed, true); // 3
    assert.equal((await rl.consume(key)).allowed, false); // 4 — blocked
  });

  it("resets after the window elapses", async () => {
    let now = 0;
    const rl = new InMemoryRateLimiter(() => now);
    const key = { actorId: "u1", surface: "support.message.assist" as AiSurfaceKey, maxPerWindow: 1, windowMs: 1000 };
    assert.equal((await rl.consume(key)).allowed, true);
    assert.equal((await rl.consume(key)).allowed, false);
    now = 1001;
    assert.equal((await rl.consume(key)).allowed, true, "new window allows again");
  });

  it("scopes the count per actor AND per surface", async () => {
    const now = 5;
    const rl = new InMemoryRateLimiter(() => now);
    const a = { actorId: "u1", surface: "support.message.assist" as AiSurfaceKey, maxPerWindow: 1, windowMs: 1000 };
    const b = { actorId: "u2", surface: "support.message.assist" as AiSurfaceKey, maxPerWindow: 1, windowMs: 1000 };
    const c = { actorId: "u1", surface: "account.check.assist" as AiSurfaceKey, maxPerWindow: 1, windowMs: 1000 };
    assert.equal((await rl.consume(a)).allowed, true);
    assert.equal((await rl.consume(a)).allowed, false, "same actor+surface blocked");
    assert.equal((await rl.consume(b)).allowed, true, "different actor independent");
    assert.equal((await rl.consume(c)).allowed, true, "different surface independent");
  });

  it("treats an undefined cap as unlimited", async () => {
    const rl = new InMemoryRateLimiter(() => 0);
    const key = { actorId: "u1", surface: "support.message.assist" as AiSurfaceKey, maxPerWindow: undefined, windowMs: 1000 };
    for (let i = 0; i < 100; i++) assert.equal((await rl.consume(key)).allowed, true);
  });
});

function adapter(): AiProviderAdapter & { calls: () => number } {
  let calls = 0;
  return {
    key: "test",
    calls: () => calls,
    async generate() {
      calls += 1;
      return { ok: true, value: { output: "ok", usage: { inputTokens: 100, outputTokens: 50, cacheReadTokens: 0, cacheWriteTokens: 0 }, modelUsedInternal: "secret", finishReason: "stop" } };
    },
  };
}

function deps(over: Partial<AiTaskDeps> & { adapter: AiProviderAdapter; billing: InMemoryBilling }): AiTaskDeps {
  return {
    rules: defaultAiUsageRules(),
    vatPolicy: NG_VAT,
    killSwitchEnabled: true,
    now: () => new Date(0),
    promptBuilder: () => ({ system: "s", messages: [{ role: "user", content: "help" }] }),
    newId: () => "evt",
    ...over,
  };
}

function task(surface: AiSurfaceKey, idem: string): AiTask {
  return { surface, actorId: "user-rl", input: {}, idempotencyKey: idem };
}

describe("orchestrator — FREE-surface rate limiting", () => {
  it("blocks a FREE surface once freeAllowancePerDay is exhausted (provider not called)", async () => {
    const ad = adapter();
    const billing = new InMemoryBilling({ balances: {} });
    // Tight limit via a tiny limiter window is awkward; instead use a limiter and a policy
    // override surface with freeAllowancePerDay. support.message.assist has freeAllowancePerDay=20.
    const rateLimiter = new InMemoryRateLimiter(() => 0);
    const d = deps({ adapter: ad, billing, rateLimiter });

    // Override the policy's allowance to 2 for a fast test via a custom surfaces map.
    const surfaces = {
      "support.message.assist": { surface: "support.message.assist" as AiSurfaceKey, billable: false, ruleBookKey: "k", modelTier: "fast" as const, maxOutputTokens: 256, maxCalls: 1, freeAllowancePerDay: 2 },
    } as AiTaskDeps["surfaces"];

    const d2 = { ...d, surfaces };
    assert.equal((await runAiTaskWith(d2, task("support.message.assist", "i1"))).ok, true);
    assert.equal((await runAiTaskWith(d2, task("support.message.assist", "i2"))).ok, true);
    const third = await runAiTaskWith(d2, task("support.message.assist", "i3"));
    assert.equal(third.ok === false && third.error.code, "rate_limited");
    assert.equal(ad.calls(), 2, "the blocked call never reaches the provider");
  });

  it("does NOT rate-limit a surface with no freeAllowancePerDay when no per-call cap applies", async () => {
    const ad = adapter();
    const billing = new InMemoryBilling({ balances: { "user-rl": 1_000_000 } });
    const rateLimiter = new InMemoryRateLimiter(() => 0);
    const d = deps({ adapter: ad, billing, rateLimiter });
    // marketplace.listing.draft has no freeAllowancePerDay → not limited by the free allowance.
    for (let i = 0; i < 5; i++) {
      const r = await runAiTaskWith(d, task("marketplace.listing.draft", `idem-${i}`));
      assert.equal(r.ok, true, `call ${i} should succeed`);
    }
  });

  it("rate-limit is enforced AFTER the auth gate (anonymous still fails auth_required first)", async () => {
    const ad = adapter();
    const billing = new InMemoryBilling({ balances: {} });
    const rateLimiter = new InMemoryRateLimiter(() => 0);
    const d = deps({ adapter: ad, billing, rateLimiter });
    const res = await runAiTaskWith(d, { surface: "support.message.assist", actorId: "", input: {}, idempotencyKey: "x" });
    assert.equal(res.ok === false && res.error.code, "auth_required");
  });
});
