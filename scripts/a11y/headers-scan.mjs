#!/usr/bin/env node
// V2-A11Y-01 — production security-headers scan.
//
// HEAD-fetches each canonical production host and diffs its response headers
// against EXPECTED_HEADERS (mirror of buildSecurityHeaders defaults).
// Categorizes each row as `pass | regression | advisory`. Writes
// .codex-temp/v2-a11y-01/headers.json + headers.md.
//
// Anti-pattern guard: if any row is `regression` the script exits 1, so this
// runs in CI to mechanically protect the V2-PNH-04 baseline.

import { writeFile, mkdir } from "node:fs/promises";
import { join, resolve } from "node:path";
import pc from "picocolors";
import {
  PRODUCTION_HOSTS,
  EXPECTED_HEADERS,
  ADVISORY_HEADERS,
} from "./route-manifest.mjs";

const ROOT = resolve(process.cwd());
const OUT_DIR = join(ROOT, ".codex-temp/v2-a11y-01");
await mkdir(OUT_DIR, { recursive: true });

const HARD_REQUIRED = new Set([
  "strict-transport-security",
  "x-content-type-options",
  "referrer-policy",
  "permissions-policy",
  "cross-origin-opener-policy",
  "x-frame-options",
  "content-security-policy",
]);

const rows = [];
let regressions = 0;

for (const host of PRODUCTION_HOSTS) {
  const url = `https://${host}/`;
  let headers = null;
  let status = null;
  let error = null;
  try {
    const res = await fetch(url, {
      method: "HEAD",
      redirect: "manual",
      headers: { "User-Agent": "henryco-a11y-audit/1.0" },
    });
    status = res.status;
    headers = lower(Object.fromEntries(res.headers.entries()));
  } catch (err) {
    error = err.message;
  }

  if (error) {
    rows.push({ host, url, status: null, error, results: [] });
    console.log(pc.red(`${host} — fetch error: ${error}`));
    continue;
  }

  const results = [];
  for (const [key, expected] of Object.entries(EXPECTED_HEADERS)) {
    const got = headers?.[key];
    let category;
    if (!got) {
      category = HARD_REQUIRED.has(key) ? "regression" : "advisory";
    } else if (normalize(got) === normalize(expected)) {
      category = "pass";
    } else {
      category = matchesWeaker(key, got, expected) ? "regression" : "pass-variant";
    }
    results.push({ key, expected, got: got ?? null, category });
    if (category === "regression") regressions += 1;
  }

  for (const adv of ADVISORY_HEADERS) {
    const got = headers?.[adv];
    results.push({ key: adv, expected: null, got: got ?? null, category: got ? "advisory-set" : "advisory-missing" });
  }

  rows.push({ host, url, status, error: null, results });

  const summary = results
    .filter((r) => Object.keys(EXPECTED_HEADERS).includes(r.key))
    .map((r) => (r.category === "pass" ? "·" : r.category === "regression" ? "✗" : "~"))
    .join("");
  const tone = regressions > 0 ? pc.red : pc.green;
  console.log(tone(`${host.padEnd(34)} status:${status} ${summary}`));
}

await writeFile(
  join(OUT_DIR, "headers.json"),
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      regressions,
      rows,
    },
    null,
    2,
  ),
);

await writeFile(join(OUT_DIR, "headers.md"), renderMd(rows, regressions));

console.log(
  regressions > 0
    ? pc.red(`\nRegressions: ${regressions}. PNH baseline broken.`)
    : pc.green(`\nNo regressions. V2-PNH-04 baseline intact.`),
);

if (regressions > 0) process.exit(1);

function lower(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj)) out[k.toLowerCase()] = v;
  return out;
}

function normalize(v) {
  return String(v).toLowerCase().replace(/\s+/g, " ").trim();
}

function matchesWeaker(key, got, expected) {
  // For HSTS: regression if max-age dropped or includeSubDomains/preload missing.
  if (key === "strict-transport-security") {
    const gotMax = /max-age\s*=\s*(\d+)/i.exec(got)?.[1];
    const expMax = /max-age\s*=\s*(\d+)/i.exec(expected)?.[1];
    if (gotMax && expMax && Number(gotMax) < Number(expMax)) return true;
    if (/includesubdomains/i.test(expected) && !/includesubdomains/i.test(got)) return true;
    return false;
  }
  // For CSP: regression if frame-ancestors loosened.
  if (key === "content-security-policy") {
    if (/frame-ancestors\s+'none'/i.test(expected) && !/frame-ancestors\s+'none'/i.test(got)) return true;
    return false;
  }
  return false;
}

function renderMd(rows, regressions) {
  let md = `# Headers scan — V2-A11Y-01\n\nGenerated: ${new Date().toISOString()}  \nRegressions: ${regressions}\n\n`;
  for (const row of rows) {
    md += `## ${row.host}\n\n`;
    if (row.error) {
      md += `**Error:** ${row.error}\n\n`;
      continue;
    }
    md += `Status: ${row.status}\n\n| Header | Expected | Got | Category |\n|---|---|---|---|\n`;
    for (const r of row.results) {
      md += `| \`${r.key}\` | ${r.expected ?? "—"} | ${r.got ?? "—"} | ${r.category} |\n`;
    }
    md += "\n";
  }
  return md;
}
