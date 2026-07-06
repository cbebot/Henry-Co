// Post-login redirect contract: text-shape baseline for the URL helpers
// in `packages/config/company.ts`.
//
// Locks in the env-override + live-fallback design introduced to retire
// the dead `account.henrycogroup.com` redirect target. Any future change
// that drops a `NEXT_PUBLIC_<APP>_URL` env read, removes a live Vercel
// fallback constant, or omits one of the canonical-host exports fails
// CI before it reaches production sign-in flows again.
//
// Runs at `node --test` level (no TS loader) to stay dep-free, matching
// the `domain.test.mjs` + `security-headers.test.mjs` pattern.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SOURCE = await readFile(resolve(__dirname, "..", "company.ts"), "utf8");

test("getAccountUrl honors NEXT_PUBLIC_ACCOUNT_URL env override", () => {
  assert.match(SOURCE, /NEXT_PUBLIC_ACCOUNT_URL/);
  assert.match(SOURCE, /ACCOUNT_URL_OVERRIDE/);
});

test("getHubUrl honors NEXT_PUBLIC_HUB_URL env override", () => {
  assert.match(SOURCE, /NEXT_PUBLIC_HUB_URL/);
  assert.match(SOURCE, /HUB_URL_OVERRIDE/);
});

test("getHqUrl honors NEXT_PUBLIC_HQ_URL env override", () => {
  assert.match(SOURCE, /NEXT_PUBLIC_HQ_URL/);
  assert.match(SOURCE, /HQ_URL_OVERRIDE/);
});

test("getStaffHqUrl honors NEXT_PUBLIC_STAFF_HQ_URL env override", () => {
  assert.match(SOURCE, /NEXT_PUBLIC_STAFF_HQ_URL/);
  assert.match(SOURCE, /STAFF_HQ_URL_OVERRIDE/);
});

test("getWorkspaceUrl honors NEXT_PUBLIC_WORKSPACE_URL env override", () => {
  assert.match(SOURCE, /NEXT_PUBLIC_WORKSPACE_URL/);
  assert.match(SOURCE, /WORKSPACE_URL_OVERRIDE/);
});

test("env override is validated as an http(s) URL before use", () => {
  assert.match(SOURCE, /normalizeAppOriginEnv/);
  assert.match(SOURCE, /\^https\?:\$/);
});

test("live Vercel-alias fallback constants exist for every lane", () => {
  for (const constant of [
    "ACCOUNT_LIVE_FALLBACK_ORIGIN",
    "HUB_LIVE_FALLBACK_ORIGIN",
    "HQ_LIVE_FALLBACK_ORIGIN",
    "STAFF_HQ_LIVE_FALLBACK_ORIGIN",
    "WORKSPACE_LIVE_FALLBACK_ORIGIN",
  ]) {
    assert.match(SOURCE, new RegExp(`${constant}\\s*=\\s*"https://`));
  }
});

test("no helper falls back to the dead account.henrycogroup.com host", () => {
  // The legacy subdomain pattern is still constructible via
  // `https://account.${BASE_DOMAIN}` for the V3-DOMAIN-01 flip path, but
  // `BASE_DOMAIN === "henrycogroup.com"` must route to the live fallback
  // instead. The guard constant name is the easiest single-token check.
  assert.match(SOURCE, /BASE_DOMAIN_IS_LEGACY_HENRYCOGROUP/);
});

test("canonical-host exports widen the open-redirect allowlist", () => {
  assert.match(SOURCE, /export\s+function\s+getCanonicalAccountHosts/);
  assert.match(SOURCE, /export\s+function\s+getCanonicalHubHosts/);
  assert.match(SOURCE, /export\s+function\s+getCanonicalHqHosts/);
  assert.match(SOURCE, /export\s+function\s+getCanonicalStaffHqHosts/);
  assert.match(SOURCE, /export\s+function\s+getCanonicalWorkspaceHosts/);
  assert.match(SOURCE, /export\s+function\s+getTrustedAppHosts/);
});

test("legacy URL helpers remain exported (back-compat)", () => {
  for (const fn of [
    "getHubUrl",
    "getAccountUrl",
    "getHqUrl",
    "getStaffHqUrl",
    "getWorkspaceUrl",
    "getDivisionUrl",
    "getSharedCookieDomain",
  ]) {
    assert.match(SOURCE, new RegExp(`export\\s+function\\s+${fn}\\s*\\(`));
  }
});

test("Intelligence connect-src helper is exported and derived from getAccountUrl", () => {
  // The strict-CSP apps (hub, staff) splice this into connect-src so the launcher's
  // cross-subdomain fetch to the account /api/intelligence/* routes is not blocked by the
  // browser. Deriving it from getAccountUrl keeps the CSP allow-list and the fetch target from
  // ever drifting apart — the whole point of the helper.
  assert.match(SOURCE, /export\s+function\s+getIntelligenceConnectSrc\s*\(\s*\)\s*:\s*string\[\]/);
  const body = SOURCE.slice(SOURCE.indexOf("function getIntelligenceConnectSrc"));
  assert.match(body, /getAccountUrl\(/);
  assert.match(body, /\.origin/);
});
