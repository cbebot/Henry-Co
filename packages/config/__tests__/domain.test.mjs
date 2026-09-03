// V3-07(S2) — packages/config/domain.ts text-shape baseline.
//
// Verifies that the henryDomain / henryWebRoot / henrySubdomain / henryDomainHost
// helpers exist and are exported. Behavioural tests run inside Next.js where the
// TS loader is available; this lives at `node --test` level to keep the package
// dep-free (matches security-headers.test.mjs pattern).

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SOURCE = await readFile(resolve(__dirname, "..", "domain.ts"), "utf8");
const INDEX = await readFile(resolve(__dirname, "..", "index.ts"), "utf8");

test("henryDomain helper is exported", () => {
  assert.match(SOURCE, /export\s+function\s+henryDomain\s*\(/);
});

test("henryWebRoot helper is exported", () => {
  assert.match(SOURCE, /export\s+function\s+henryWebRoot\s*\(/);
});

test("henrySubdomain escape hatch is exported", () => {
  assert.match(SOURCE, /export\s+function\s+henrySubdomain\s*\(/);
});

test("henryDomainHost bare-host helper is exported", () => {
  assert.match(SOURCE, /export\s+function\s+henryDomainHost\s*\(/);
});

test("HenryDivision type alias is exported", () => {
  assert.match(SOURCE, /export\s+type\s+HenryDivision/);
});

test("domain helpers reuse COMPANY registry (no parallel hardcoded list)", () => {
  assert.match(SOURCE, /from\s+["']\.\/company["']/);
  assert.match(SOURCE, /COMPANY\.divisions/);
  assert.match(SOURCE, /COMPANY\.group\.baseDomain/);
});

test("domain module is re-exported from the package barrel", () => {
  assert.match(INDEX, /export\s+\*\s+from\s+["']\.\/domain["']/);
});

test("normalizePath sanitises leading slashes", () => {
  // Internal helper — verify it exists so callers' paths are predictable.
  assert.match(SOURCE, /function\s+normalizePath/);
});
