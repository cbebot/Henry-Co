import { test } from "node:test";
import assert from "node:assert/strict";
import { screenReplyBody } from "../screen-reply";

test("clean body passes through unchanged", () => {
  assert.deepEqual(screenReplyBody("is it available?"), { action: "allow", body: "is it available?" });
});
test("a phone number is blocked (never persisted)", () => {
  assert.equal(screenReplyBody("call 0801 234 5678").action, "block");
});
test("a handle is masked in the persisted body", () => {
  const r = screenReplyBody("follow @jane_doe");
  assert.equal(r.action, "mask");
  assert.ok(!r.body.includes("@jane_doe"));
});
