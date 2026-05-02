// V2-A11Y-01 — V2-PNH-04 baseline snapshot.
//
// Static-text snapshot of packages/config/security-headers.ts: any change
// that weakens a header (missing key, dropped HSTS preload, loosened CSP
// frame-ancestors, removal of nosniff/Referrer-Policy) fails CI.
//
// This is intentionally NOT a runtime import — keeping it free of TypeScript
// loaders means it runs cleanly via `node --test` with no extra deps.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SOURCE = await readFile(
  resolve(__dirname, "..", "security-headers.ts"),
  "utf8",
);

const REQUIRED_HEADERS = [
  ["Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload"],
  ["X-Content-Type-Options", "nosniff"],
  ["Referrer-Policy", "strict-origin-when-cross-origin"],
  ["X-DNS-Prefetch-Control", "on"],
  ["Permissions-Policy", null],
  ["Cross-Origin-Opener-Policy", "same-origin"],
  ["X-Frame-Options", "DENY"],
  ["Content-Security-Policy", "frame-ancestors 'none'"],
];

for (const [name, value] of REQUIRED_HEADERS) {
  test(`${name} header is defined in baseline`, () => {
    assert.match(
      SOURCE,
      new RegExp(`key:\\s*"${name}"`),
      `${name} header missing from buildSecurityHeaders defaults`,
    );
    if (value !== null) {
      assert.ok(
        SOURCE.includes(value),
        `${name} value "${value}" missing — V2-PNH-04 regression`,
      );
    }
  });
}

test("Permissions-Policy retains restrictive defaults", () => {
  for (const directive of [
    "camera",
    "microphone",
    "geolocation",
    "interest-cohort",
    "browsing-topics",
    "payment",
  ]) {
    // Match both bareword and quoted property keys.
    assert.match(
      SOURCE,
      new RegExp(`(?:"${directive}"|${directive}):\\s*"\\(\\)"`),
      `${directive} permission no longer restrictive — V2-PNH-04 regression`,
    );
  }
});

test("CSP retains frame-ancestors 'none' (no relaxation)", () => {
  assert.match(SOURCE, /frame-ancestors\s+'none'/);
});

test("No unsafe-inline or unsafe-eval introduced", () => {
  assert.doesNotMatch(SOURCE, /unsafe-inline|unsafe-eval/);
});
