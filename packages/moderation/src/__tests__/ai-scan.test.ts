import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { runAiScan } from "../ai/ai-scan";
import type { AiScanRequest, AiScanResult, ModerationAiRouter, ModerationInput } from "../types";

const input: ModerationInput = {
  contentType: "job_post",
  contentId: "j1",
  text: "great opportunity",
  locale: "en",
};

const router = (fn: (req: AiScanRequest) => Promise<AiScanResult | null>): ModerationAiRouter => ({
  scan: fn,
});

describe("runAiScan — degrade-not-fail-open", () => {
  it("returns null when no router is injected", async () => {
    assert.equal(await runAiScan(null, input), null);
    assert.equal(await runAiScan(undefined, input), null);
  });
  it("returns null when the router throws", async () => {
    const r = router(async () => {
      throw new Error("router down");
    });
    assert.equal(await runAiScan(r, input), null);
  });
  it("returns null when the router resolves null", async () => {
    assert.equal(await runAiScan(router(async () => null), input), null);
  });
  it("returns null on timeout", async () => {
    const slow = router(() => new Promise((res) => setTimeout(() => res({ recommendation: "hold", reasons: [], confidence: 1 }), 50)));
    assert.equal(await runAiScan(slow, input, { timeoutMs: 10 }), null);
  });
  it("downgrades an AI reject to hold", async () => {
    const r = router(async () => ({ recommendation: "reject", reasons: ["ai_flagged_nsfw"], confidence: 1 }));
    const out = await runAiScan(r, input);
    assert.equal(out?.recommendation, "hold");
  });
  it("passes through an AI hold", async () => {
    const r = router(async () => ({ recommendation: "hold", reasons: ["ai_flagged_scam"], confidence: 0.7 }));
    const out = await runAiScan(r, input);
    assert.equal(out?.recommendation, "hold");
    assert.equal(out?.confidence, 0.7);
  });
});
