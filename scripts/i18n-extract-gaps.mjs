#!/usr/bin/env node
// Extract every gap (missing key OR value === EN) from EXTRA_SURFACE_LABELS
// and from each *-copy module. Writes JSON manifests to docs/v3/i18n-gaps/.

import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = process.cwd();
const SRC = path.join(ROOT, "packages", "i18n", "src");
const OUT = path.join(ROOT, "docs", "v3", "i18n-gaps");

const LOCS = ["fr", "es", "pt", "ar", "de", "it", "zh", "hi", "ig", "yo", "ha"];

const MODULES = [
  ["surface-copy.ts", "getSurfaceCopy", "surface"],
  ["account-copy.ts", "getAccountCopy", "account"],
  ["hub-home-copy.ts", "getHubHomeCopy", "hubHome"],
  ["marketplace-copy.ts", "getMarketplaceCopy", "marketplace"],
  ["jobs-copy.ts", "getJobsCopy", "jobs"],
  ["care-copy.ts", "getCareCopy", "care"],
  ["auth-copy.ts", "getAuthCopy", "auth"],
  ["consent-copy.ts", "getConsentCopy", "consent"],
  ["state-copy.ts", "getStateCopy", "state"],
];

function isPlainObject(v) {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function walk(en, loc, prefix = "", out = []) {
  if (Array.isArray(en)) {
    if (loc === undefined || JSON.stringify(loc) === JSON.stringify(en)) {
      out.push({ path: prefix, en, gap: loc === undefined ? "missing" : "echo" });
    }
    return out;
  }
  if (isPlainObject(en)) {
    if (loc === undefined || !isPlainObject(loc)) {
      for (const [k, v] of Object.entries(en)) {
        walk(v, undefined, prefix ? `${prefix}.${k}` : k, out);
      }
      return out;
    }
    for (const [k, v] of Object.entries(en)) {
      walk(v, loc[k], prefix ? `${prefix}.${k}` : k, out);
    }
    return out;
  }
  // primitive
  if (loc === undefined) {
    out.push({ path: prefix, en, gap: "missing" });
  } else if (loc === en) {
    out.push({ path: prefix, en, gap: "echo" });
  }
  return out;
}

await fs.mkdir(OUT, { recursive: true });

// 1) Per-module structured gaps
const moduleGaps = {};
for (const [file, getter, label] of MODULES) {
  const mod = await import(pathToFileURL(path.join(SRC, file)).href);
  const fn = mod[getter];
  const en = fn("en");
  moduleGaps[label] = {};
  for (const loc of LOCS) {
    const gaps = walk(en, fn(loc));
    moduleGaps[label][loc] = gaps;
  }
}
await fs.writeFile(path.join(OUT, "module-gaps.json"), JSON.stringify(moduleGaps, null, 2));

// 2) EXTRA_SURFACE_LABELS asymmetry
const extras = await import(pathToFileURL(path.join(SRC, "surface-extra-labels.ts")).href);
const all = {};
for (const loc of LOCS) {
  all[loc] = extras[`EXTRA_SURFACE_LABELS_${loc.toUpperCase()}`];
}
const universe = new Set();
for (const m of Object.values(all)) for (const k of Object.keys(m)) universe.add(k);
const universeArr = [...universe].sort();

const extraGaps = {};
for (const loc of LOCS) {
  const m = all[loc];
  const missing = universeArr.filter(k => !(k in m));
  const echo = Object.entries(m).filter(([k, v]) => v === k).map(([k]) => k);
  extraGaps[loc] = { missing, echo };
}
await fs.writeFile(path.join(OUT, "extra-label-gaps.json"), JSON.stringify(extraGaps, null, 2));
await fs.writeFile(path.join(OUT, "extra-label-universe.json"), JSON.stringify(universeArr, null, 2));

// 3) Summary
const summary = {
  generatedAt: new Date().toISOString(),
  modules: {},
  extras: {},
};
for (const [label, byLoc] of Object.entries(moduleGaps)) {
  summary.modules[label] = {};
  for (const [loc, gaps] of Object.entries(byLoc)) {
    summary.modules[label][loc] = gaps.length;
  }
}
for (const [loc, g] of Object.entries(extraGaps)) {
  summary.extras[loc] = { missing: g.missing.length, echo: g.echo.length };
}
await fs.writeFile(path.join(OUT, "summary.json"), JSON.stringify(summary, null, 2));

console.log(JSON.stringify(summary, null, 2));
console.log(`\nWrote: ${OUT}/`);
