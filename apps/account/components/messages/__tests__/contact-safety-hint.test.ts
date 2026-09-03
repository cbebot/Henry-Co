import { test } from "node:test";
import assert from "node:assert/strict";
import { contactSafetyHintState } from "../contact-safety-hint";
import { getMessagingCopy } from "@henryco/i18n";

const copy = getMessagingCopy("en").contactSafety;

test("clean text shows no hint", () => {
  assert.equal(contactSafetyHintState("is the blue one available?", copy), null);
});
test("a phone number shows the BLOCK hint", () => {
  const s = contactSafetyHintState("call me on 0801 234 5678", copy);
  assert.ok(s);
  assert.equal(s!.tone, "block");
  assert.equal(s!.title, copy.blockedTitle);
  assert.equal(s!.body, copy.blockedBody); // body maps to the block copy, not a swap
});
test("a bare handle shows the MASK hint", () => {
  const s = contactSafetyHintState("follow @jane_doe", copy);
  assert.ok(s);
  assert.equal(s!.tone, "mask");
  assert.equal(s!.title, copy.maskedTitle);
  assert.equal(s!.body, copy.maskedBody); // body maps to the mask copy, not a swap
});
