import { test } from "node:test";
import assert from "node:assert/strict";
import { screenMessageBody } from "../screen-message";

test("clean body passes through unchanged", () => {
  assert.deepEqual(screenMessageBody("is the homepage draft ready?"), {
    action: "allow",
    body: "is the homepage draft ready?",
  });
});
test("a phone number is blocked (never persisted)", () => {
  assert.equal(screenMessageBody("call me on 0801 234 5678").action, "block");
});
test("an email is blocked", () => {
  assert.equal(screenMessageBody("reach me at jane.doe@gmail.com").action, "block");
});
test("a bare handle is masked in the persisted body", () => {
  const r = screenMessageBody("follow @jane_doe");
  assert.equal(r.action, "mask");
  assert.ok(!r.body.includes("@jane_doe"));
});
