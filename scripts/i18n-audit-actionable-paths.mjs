#!/usr/bin/env node
// Emit the full actionable equal-paths and missing-paths for every (module, locale)
// after subtracting the intentional-echo allow-list. Replaces the per-module
// TEMP scripts. Output: stable JSON to stdout, suitable for downstream slicing.
//
// Usage:
//   pnpm exec tsx scripts/i18n-audit-actionable-paths.mjs                 # all modules+locales
//   pnpm exec tsx scripts/i18n-audit-actionable-paths.mjs --module jobs   # one module
//   pnpm exec tsx scripts/i18n-audit-actionable-paths.mjs --locale de,it  # filter locales

import path from "node:path";
import { pathToFileURL } from "node:url";
import { isIntentional } from "./i18n-intentional-echos.mjs";

const ROOT = process.cwd();
const I18N_SRC = path.join(ROOT, "packages", "i18n", "src");
const LOCALES = ["fr", "es", "pt", "ar", "de", "it", "zh", "hi", "ig", "yo", "ha"];

const MODULES = [
  ["surface-copy.ts",     "getSurfaceCopy",     "surface"],
  ["account-copy.ts",     "getAccountCopy",     "account"],
  ["hub-home-copy.ts",    "getHubHomeCopy",     "hubHome"],
  ["marketplace-copy.ts", "getMarketplaceCopy", "marketplace"],
  ["jobs-copy.ts",        "getJobsCopy",        "jobs"],
  ["care-copy.ts",        "getCareCopy",        "care"],
  ["auth-copy.ts",        "getAuthCopy",        "auth"],
  ["consent-copy.ts",     "getConsentCopy",     "consent"],
  ["state-copy.ts",       "getStateCopy",       "state"],
];

function isPlainObject(v) {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function diffWalk(en, loc, moduleLabel, prefix = "", acc = null) {
  if (!acc) acc = { equalPaths: [], missingPaths: [] };
  if (Array.isArray(en)) {
    if (loc === undefined) acc.missingPaths.push(prefix);
    else if (JSON.stringify(loc) === JSON.stringify(en)) {
      if (!isIntentional(moduleLabel, prefix)) acc.equalPaths.push(prefix);
    }
    return acc;
  }
  if (isPlainObject(en)) {
    if (loc === undefined || !isPlainObject(loc)) {
      for (const [k, v] of Object.entries(en)) {
        diffWalk(v, undefined, moduleLabel, prefix ? `${prefix}.${k}` : k, acc);
      }
      return acc;
    }
    for (const [k, v] of Object.entries(en)) {
      diffWalk(v, loc[k], moduleLabel, prefix ? `${prefix}.${k}` : k, acc);
    }
    return acc;
  }
  if (loc === undefined) {
    acc.missingPaths.push(prefix);
    return acc;
  }
  if (loc === en) {
    if (!isIntentional(moduleLabel, prefix)) acc.equalPaths.push(prefix);
  }
  return acc;
}

function getAtPath(obj, dotted) {
  const parts = dotted.split(".");
  let v = obj;
  for (const p of parts) {
    if (v == null) return undefined;
    v = v[p];
  }
  return v;
}

async function main() {
  const args = process.argv.slice(2);
  const moduleArg = args.indexOf("--module") >= 0 ? args[args.indexOf("--module") + 1] : null;
  const localeArg = args.indexOf("--locale") >= 0 ? args[args.indexOf("--locale") + 1] : null;
  const wantLocales = localeArg ? localeArg.split(",").map(s => s.trim()) : LOCALES;

  const result = {};
  for (const [file, getter, label] of MODULES) {
    if (moduleArg && moduleArg !== label) continue;
    const mod = await import(pathToFileURL(path.join(I18N_SRC, file)).href);
    const fn = mod[getter];
    const en = fn("en");
    result[label] = {};
    for (const locale of wantLocales) {
      const loc = fn(locale);
      const out = diffWalk(en, loc, label);
      const entries = [];
      for (const p of out.equalPaths) {
        entries.push({ path: p, en: getAtPath(en, p), kind: "echo" });
      }
      for (const p of out.missingPaths) {
        entries.push({ path: p, en: getAtPath(en, p), kind: "missing" });
      }
      result[label][locale] = {
        actionable: entries.length,
        equalCount: out.equalPaths.length,
        missingCount: out.missingPaths.length,
        entries,
      };
    }
  }
  console.log(JSON.stringify(result, null, 2));
}

main().catch(err => { console.error(err); process.exit(1); });
