// scripts/font/__tests__/token-integrity.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { analyzeFontTokens, collectDefined, collectRefs } from "../token-integrity.mjs";

test("an undefined --hc-font reference is flagged", () => {
  const seamCss = ":root { --hc-font-display: serif; --hc-font-body: sans-serif; }";
  const appFiles = [{ file: "studio.css", css: ":root { --x: var(--hc-font-serif); }" }];
  const { undefinedRefs } = analyzeFontTokens({ seamCss, appFiles });
  assert.equal(undefinedRefs.length, 1);
  assert.equal(undefinedRefs[0].token, "--hc-font-serif");
});

test("a defined --hc-font reference passes", () => {
  const seamCss = ":root { --hc-font-serif: var(--hc-font-display); --hc-font-display: serif; }";
  const appFiles = [{ file: "studio.css", css: "a { font-family: var(--hc-font-serif); }" }];
  assert.equal(analyzeFontTokens({ seamCss, appFiles }).undefinedRefs.length, 0);
});

test("collectDefined/collectRefs are pure across calls", () => {
  assert.deepEqual([...collectDefined("--hc-font-x: a; --hc-font-y: b;")], ["--hc-font-x", "--hc-font-y"]);
  assert.deepEqual(collectRefs("var(--hc-font-x) var(--hc-font-x)"), ["--hc-font-x", "--hc-font-x"]);
});
