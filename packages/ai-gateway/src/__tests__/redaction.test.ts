import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { redactReceipt, assertClientSafe, AI_LOG_REDACT_KEYS } from "../redaction";

describe("redactReceipt — whitelist construction", () => {
  it("emits exactly the six safe fields and nothing else", () => {
    const receipt = redactReceipt({ surface: "marketplace.listing.draft", tier: "standard", totalKobo: 2554, vatKobo: 178, usageEventId: "evt-1", billed: true });
    assert.deepEqual(Object.keys(receipt).sort(), ["billed", "surface", "tier", "totalKobo", "usageEventId", "vatKobo"]);
  });
});

describe("assertClientSafe — defence-in-depth leak scanner", () => {
  it("passes a clean receipt", () => {
    assert.doesNotThrow(() => assertClientSafe({ totalKobo: 2554, vatKobo: 178, surface: "x", tier: "standard", usageEventId: "e", billed: true }));
  });

  for (const key of ["provider", "providerKey", "model", "modelUsedInternal", "apiKey", "cost", "costKobo", "margin", "marginKobo", "system", "prompt"]) {
    it(`throws when a forbidden key "${key}" appears (even nested)`, () => {
      assert.throws(() => assertClientSafe({ totalKobo: 1, nested: { [key]: "leak" } }), /leak/i);
    });
  }

  it("handles cycles without infinite recursion", () => {
    const a: Record<string, unknown> = { totalKobo: 1 };
    a.self = a;
    assert.doesNotThrow(() => assertClientSafe(a));
  });
});

describe("AI_LOG_REDACT_KEYS — covers the LLM/provider fields the default redactor misses", () => {
  it("includes provider/model/prompt/completion/apiKey", () => {
    for (const k of ["provider", "model", "modelUsedInternal", "prompt", "completion", "apiKey"]) {
      assert.ok(AI_LOG_REDACT_KEYS.includes(k as (typeof AI_LOG_REDACT_KEYS)[number]), `${k} must be redacted in logs`);
    }
  });
});
