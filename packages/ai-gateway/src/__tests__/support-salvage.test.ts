// The free support turn must NEVER stonewall a person with "couldn't format that" — the reply is
// the essential thing, the envelope is not. These lock in the two halves of the fix: the pure
// salvage that recovers a reply from prose/broken JSON, and the orchestrator degrading to it after
// validateOutput has failed twice (while a surface with no salvage still fails closed).

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { defaultAiUsageRules } from "@henryco/pricing";
import { runAiTaskWith, type AiTaskDeps } from "../orchestrator";
import { InMemoryBilling } from "../testing/in-memory-billing";
import { parseSupportAssistEnvelope, salvageSupportAssistEnvelope } from "../support-assist";
import type { AiProviderAdapter } from "../provider-types";
import type { AiTask } from "../contracts";

const NG_VAT = { standardRate: 0.075, rateVersion: "NG-VAT-7.5-2020-02-01" };
const USER = "user-salvage-1";

// The exact prose the owner saw the model produce when asked to actually book a shipment: a
// natural, conversational reply with no envelope — which fails the strict envelope validator.
const BOOKING_PROSE =
  "I'd be happy to help you book a logistics shipment. Tell me the pickup city and the delivery address, and roughly what you're sending, and I'll set it up.";

function proseAdapter(text: string): AiProviderAdapter & { calls: () => number } {
  let calls = 0;
  return {
    key: "test",
    calls: () => calls,
    async generate() {
      calls += 1;
      return {
        ok: true,
        value: {
          output: text,
          usage: { inputTokens: 500, outputTokens: 120, cacheReadTokens: 0, cacheWriteTokens: 0 },
          modelUsedInternal: "secret",
          finishReason: "stop",
        },
      };
    },
  };
}

function supportDeps(
  billing: InMemoryBilling,
  ad: AiProviderAdapter,
  withSalvage: boolean,
): AiTaskDeps {
  return {
    adapter: ad,
    billing,
    rules: defaultAiUsageRules(),
    vatPolicy: NG_VAT,
    killSwitchEnabled: true,
    now: () => new Date(0),
    promptBuilder: (_task, policy) => ({
      system: `system for ${policy.surface}`,
      messages: [{ role: "user", content: "book a shipment" }],
    }),
    newId: () => "evt-free",
    // Mirror the real server wiring: the support turn must carry a parseable envelope.
    validateOutput: (raw) => parseSupportAssistEnvelope(raw) != null,
    ...(withSalvage
      ? {
          salvageOutput: (raw: string, t: AiTask) =>
            t.surface === "support.message.assist" ? salvageSupportAssistEnvelope(raw) : null,
        }
      : {}),
  };
}

function supportTask(): AiTask {
  return {
    surface: "support.message.assist",
    actorId: USER,
    input: { text: "I want to send food from my location to no. 1 Emene road, Enugu" },
    idempotencyKey: "idem-salvage",
  };
}

describe("support salvage — the free turn never hard-stops on a formatting miss", () => {
  it("recovers a plain reply from the model's prose after validation fails twice", async () => {
    const ad = proseAdapter(BOOKING_PROSE);
    const billing = new InMemoryBilling({ balances: {} }); // free surface, no wallet
    const res = await runAiTaskWith(supportDeps(billing, ad, true), supportTask());

    assert.equal(res.ok, true, "the turn succeeds instead of schema_validation_failed");
    if (!res.ok) return;
    // The retry happened (a chance at structure) BEFORE salvage — two provider calls.
    assert.equal(ad.calls(), 2);

    const env = parseSupportAssistEnvelope(res.value.output);
    assert.ok(env, "the salvaged output is a valid envelope");
    assert.match(env!.reply, /book a logistics shipment/);
    // A format miss is a degrade, not misuse or an escalation, and offers nothing.
    assert.equal(env!.navigate.length, 0);
    assert.equal(env!.handoff, false);
    assert.equal(env!.offer, null);
    assert.equal(env!.abuse, false);
    // Free surface — still never billed.
    assert.equal(res.value.receipt.billed, false);
    assert.equal(billing.debitCount, 0);
  });

  it("without salvage wired, the same prose still fails closed", async () => {
    const ad = proseAdapter(BOOKING_PROSE);
    const billing = new InMemoryBilling({ balances: {} });
    const res = await runAiTaskWith(supportDeps(billing, ad, false), supportTask());

    assert.equal(res.ok, false);
    assert.equal(res.ok === false && res.error.code, "schema_validation_failed");
    assert.equal(ad.calls(), 2, "original + one retry, then the closed failure");
  });
});

describe("salvageSupportAssistEnvelope — pure recovery", () => {
  it("wraps plain prose into a valid, minimal envelope", () => {
    const out = salvageSupportAssistEnvelope(BOOKING_PROSE);
    assert.ok(out);
    const env = parseSupportAssistEnvelope(out!);
    assert.ok(env);
    assert.match(env!.reply, /book a logistics shipment/);
    assert.deepEqual(env!.navigate, []);
    assert.equal(env!.abuse, false);
  });

  it("recovers the reply from a broken envelope (unescaped newline that broke JSON.parse)", () => {
    const broken = '{"reply": "Line one\nline two about your shipment", "navigate": [';
    assert.equal(parseSupportAssistEnvelope(broken), null, "strict parse rejects it");
    const out = salvageSupportAssistEnvelope(broken);
    assert.ok(out);
    const env = parseSupportAssistEnvelope(out!);
    assert.match(env!.reply, /shipment/);
  });

  it("returns null for empty output (nothing safe to show)", () => {
    assert.equal(salvageSupportAssistEnvelope(""), null);
    assert.equal(salvageSupportAssistEnvelope("   "), null);
  });

  it("never surfaces raw JSON braces as a reply", () => {
    assert.equal(salvageSupportAssistEnvelope("{ }"), null);
    assert.equal(salvageSupportAssistEnvelope('{"nope": true}'), null);
  });
});
