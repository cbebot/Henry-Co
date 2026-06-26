import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeForDetection } from "../detect.ts";

test("normalizeForDetection collapses spoken/obfuscated contact details", () => {
  assert.equal(normalizeForDetection("call me on zero eight zero one"), "call me on 0801");
  assert.equal(normalizeForDetection("0 8 0 - 1 2 3"), "0801 23".replace(" ", "")); // digits collapse
  assert.equal(normalizeForDetection("name at gmail dot com"), "name@gmail.com");
});
