import { test } from "node:test";
import assert from "node:assert/strict";
import { contactSafety } from "../../index";

test("a clean message is allowed unchanged", () => {
  const r = contactSafety("Hi, is the blue one still available?");
  assert.equal(r.action, "allow");
  assert.equal(r.maskedText, "Hi, is the blue one still available?");
  assert.equal(r.severity, "low");
});

test("a phone number is blocked (high) and never returned as-is", () => {
  const r = contactSafety("call me on 0801 234 5678");
  assert.equal(r.action, "block");
  assert.equal(r.severity, "high");
});

test("an obfuscated phone is still blocked via normalization", () => {
  const r = contactSafety("reach me at zero eight zero one two three four five six seven eight");
  assert.equal(r.action, "block");
});

test("a bare social handle is masked (medium), not blocked", () => {
  const r = contactSafety("follow @jane_doe for more");
  assert.equal(r.action, "mask");
  assert.ok(!r.maskedText.includes("@jane_doe"));
});

test("a shortener link is caught and masked", () => {
  const r = contactSafety("here bit.ly/deal");
  assert.notEqual(r.action, "allow");
  assert.ok(!r.maskedText.includes("bit.ly/deal"));
});
