import { test } from "node:test";
import assert from "node:assert/strict";
import { screenMessageBody } from "../screen-message";
import { maskContactsForDisplay } from "@henryco/trust/detect";

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
// Defense-in-depth display masking (used by both studio row→message mappers for
// already-stored legacy rows). Proves the masking primitive studio now depends on.
test("display-mask strips contact details from a stored body at render", () => {
  const masked = maskContactsForDisplay("ping me on whatsapp 0801 234 5678");
  assert.ok(!masked.includes("0801 234 5678"));
  assert.ok(!/whatsapp/i.test(masked));
});
