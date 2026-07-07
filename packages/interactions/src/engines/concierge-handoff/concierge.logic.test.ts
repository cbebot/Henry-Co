import { test } from "node:test";
import assert from "node:assert/strict";
import { resolveHandoffTrigger, LINGER_MS, BOUNCE_THRESHOLD } from "./concierge.logic";

test("45s linger on a decision page without action → linger trigger", () => {
  assert.equal(resolveHandoffTrigger(LINGER_MS, 0, false), "linger");
  assert.equal(resolveHandoffTrigger(LINGER_MS - 1, 0, false), null);
});

test("bouncing between two listings 3+ times → bounce trigger", () => {
  assert.equal(resolveHandoffTrigger(0, BOUNCE_THRESHOLD, false), "bounce");
  assert.equal(resolveHandoffTrigger(0, BOUNCE_THRESHOLD - 1, false), null);
});

test("post-success surface → post_success trigger (the Joy Engine's single next action)", () => {
  assert.equal(resolveHandoffTrigger(0, 0, true), "post_success");
});

test("post-success wins over linger/bounce (it is the calmest entry)", () => {
  assert.equal(resolveHandoffTrigger(LINGER_MS, BOUNCE_THRESHOLD, true), "post_success");
});
