// scripts/font/__tests__/font-coverage.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import fontkit from "fontkit";
import { blockCodePoints, missingCodePoints } from "../font-coverage.mjs";

test("blockCodePoints enumerates an inclusive range", () => {
  assert.deepEqual(blockCodePoints({ start: 0x41, end: 0x43 }), [0x41, 0x42, 0x43]);
});

test("the interim Latin serif covers Basic Latin and lacks Arabic", () => {
  const serif = fontkit.openSync("packages/ui/fonts/henryonyx-serif-interim.woff2");
  assert.equal(missingCodePoints(serif, blockCodePoints({ start: 0x41, end: 0x5a })).length, 0); // A-Z
  assert.ok(missingCodePoints(serif, blockCodePoints({ start: 0x0600, end: 0x0610 })).length > 0); // Arabic
});
