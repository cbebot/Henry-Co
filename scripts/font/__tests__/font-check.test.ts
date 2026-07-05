// scripts/font/__tests__/font-check.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { scanSource, isAllowlisted } from "../font-check.mjs";

test("flags next/font/google", () => {
  const v = scanSource('import { Inter } from "next/font/google";', "apps/x/app/layout.tsx");
  assert.ok(v.some((x) => x.rule === "next-font-google"));
});

test("flags a Google Fonts @import", () => {
  const v = scanSource('@import url("https://fonts.googleapis.com/css2?family=Roboto");', "apps/x/app/globals.css");
  assert.ok(v.some((x) => x.rule === "google-import"));
});

test("flags a system-font stack", () => {
  const v = scanSource("body { font-family: Arial, Helvetica, sans-serif; }", "apps/x/app/globals.css");
  assert.ok(v.some((x) => x.rule === "system-stack"));
});

test("clean owned CSS produces no violations", () => {
  assert.equal(scanSource("a { font-family: var(--hc-font-sans); }", "apps/x/app/globals.css").length, 0);
});

test("the seam and font packages are allowlisted", () => {
  assert.equal(isAllowlisted("packages/ui/src/styles/globals.css"), true);
  assert.equal(isAllowlisted("packages/rn-type/index.ts"), true);
  assert.equal(isAllowlisted("packages/email/layout.ts"), true);
  assert.equal(isAllowlisted("apps/hub/app/layout.tsx"), false);
});
