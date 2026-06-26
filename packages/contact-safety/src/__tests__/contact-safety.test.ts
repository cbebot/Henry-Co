import { test } from "node:test";
import assert from "node:assert/strict";
import { contactSafety } from "../../index";

test("a clean message is allowed unchanged", () => {
  const r = contactSafety("Hi, is the blue one still available?");
  assert.equal(r.action, "allow");
  assert.equal(r.maskedText, "Hi, is the blue one still available?");
  assert.equal(r.severity, "low");
});
