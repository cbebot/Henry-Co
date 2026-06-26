import { test } from "node:test";
import assert from "node:assert/strict";
import { getMessagingCopy } from "../messaging-copy";

test("EN baseline is present and non-empty", () => {
  const en = getMessagingCopy("en");
  assert.ok(en.contactSafety.reassurance.length > 0);
  assert.ok(en.contactSafety.blockedTitle.length > 0);
});

test("ar resolves native (differs from EN) — RTL native copy present", () => {
  const ar = getMessagingCopy("ar");
  assert.notEqual(ar.contactSafety.reassurance, getMessagingCopy("en").contactSafety.reassurance);
});

test("ig is EN-fallback by omission — byte-identical to EN, never machine-translated", () => {
  assert.deepEqual(getMessagingCopy("ig"), getMessagingCopy("en"));
  assert.deepEqual(getMessagingCopy("yo"), getMessagingCopy("en"));
  assert.deepEqual(getMessagingCopy("ha"), getMessagingCopy("en"));
  assert.deepEqual(getMessagingCopy("hi"), getMessagingCopy("en"));
});
