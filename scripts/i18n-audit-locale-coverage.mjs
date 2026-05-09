#!/usr/bin/env node
// ---------------------------------------------------------------------------
// scripts/i18n-audit-locale-coverage.mjs
//
// Diff every locale against the English baseline for every copy module in
// @henryco/i18n. Reports keys whose value is identical to the EN fallback
// (i.e. the deepMerge fell through to English) and keys that are missing
// outright. Prints a JSON report; --md flag also writes a Markdown summary.
//
// Usage:
//   pnpm exec tsx scripts/i18n-audit-locale-coverage.mjs           # JSON only
//   pnpm exec tsx scripts/i18n-audit-locale-coverage.mjs --md OUT  # JSON + md
// ---------------------------------------------------------------------------

import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { isIntentional } from "./i18n-intentional-echos.mjs";

const ROOT = process.cwd();
const I18N_SRC = path.join(ROOT, "packages", "i18n", "src");

const LOCALES = ["en", "fr", "es", "pt", "ar", "de", "it", "zh", "hi", "ig", "yo", "ha"];

// (modulePath, getterName, label, sourceFile)
const MODULES = [
  ["surface-copy.ts",          "getSurfaceCopy",     "surface",        "surface-copy.ts"],
  ["account-copy.ts",          "getAccountCopy",     "account",        "account-copy.ts"],
  ["hub-home-copy.ts",         "getHubHomeCopy",     "hubHome",        "hub-home-copy.ts"],
  ["marketplace-copy.ts",      "getMarketplaceCopy", "marketplace",    "marketplace-copy.ts"],
  ["jobs-copy.ts",             "getJobsCopy",        "jobs",           "jobs-copy.ts"],
  ["care-copy.ts",             "getCareCopy",        "care",           "care-copy.ts"],
  ["auth-copy.ts",             "getAuthCopy",        "auth",           "auth-copy.ts"],
  ["consent-copy.ts",          "getConsentCopy",     "consent",        "consent-copy.ts"],
  ["state-copy.ts",            "getStateCopy",       "state",          "state-copy.ts"],
];

function isPlainObject(v) {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/**
 * Walk EN baseline and a locale variant in lock-step. Returns:
 *   { totalLeaves, equalToEn, missing, sampleEqualPaths, sampleMissingPaths }
 */
function diffWalk(en, loc, moduleLabel, prefix = "", acc = null) {
  if (!acc) {
    acc = {
      totalLeaves: 0,
      equalToEn: 0,
      intentionalEcho: 0,
      actionableEqual: 0,
      missing: 0,
      sampleEqualPaths: [],
      sampleMissingPaths: [],
    };
  }
  if (Array.isArray(en)) {
    acc.totalLeaves += 1;
    if (loc === undefined) {
      acc.missing += 1;
      if (acc.sampleMissingPaths.length < 12) acc.sampleMissingPaths.push(prefix);
    } else if (JSON.stringify(loc) === JSON.stringify(en)) {
      acc.equalToEn += 1;
      if (isIntentional(moduleLabel, prefix)) acc.intentionalEcho += 1;
      else { acc.actionableEqual += 1; if (acc.sampleEqualPaths.length < 12) acc.sampleEqualPaths.push(prefix); }
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
  // Leaf primitive
  acc.totalLeaves += 1;
  if (loc === undefined) {
    acc.missing += 1;
    if (acc.sampleMissingPaths.length < 12) acc.sampleMissingPaths.push(prefix);
    return acc;
  }
  if (loc === en) {
    acc.equalToEn += 1;
    if (isIntentional(moduleLabel, prefix)) acc.intentionalEcho += 1;
    else { acc.actionableEqual += 1; if (acc.sampleEqualPaths.length < 12) acc.sampleEqualPaths.push(prefix); }
  }
  return acc;
}

async function loadModule(file) {
  const abs = path.join(I18N_SRC, file);
  const url = pathToFileURL(abs).href;
  return import(url);
}

async function main() {
  const args = process.argv.slice(2);
  const mdIndex = args.indexOf("--md");
  const mdOut = mdIndex >= 0 ? args[mdIndex + 1] : null;

  const report = {
    generatedAt: new Date().toISOString(),
    locales: LOCALES,
    modules: {},
  };

  for (const [file, getter, label] of MODULES) {
    const mod = await loadModule(file);
    const fn = mod[getter];
    if (typeof fn !== "function") {
      console.error(`! ${file}: ${getter} not exported`);
      continue;
    }
    const en = fn("en");
    const perLocale = {};
    for (const locale of LOCALES) {
      if (locale === "en") {
        const seed = diffWalk(en, en, label);
        perLocale[locale] = {
          totalLeaves: seed.totalLeaves,
          equalToEn: seed.totalLeaves,
          intentionalEcho: seed.totalLeaves,
          actionableEqual: 0,
          missing: 0,
        };
        continue;
      }
      const loc = fn(locale);
      const out = diffWalk(en, loc, label);
      perLocale[locale] = out;
    }
    report.modules[label] = perLocale;
  }

  console.log(JSON.stringify(report, null, 2));

  if (mdOut) {
    const md = renderMarkdown(report);
    await fs.writeFile(mdOut, md, "utf8");
    console.error(`\nWrote markdown summary → ${mdOut}`);
  }
}

function pct(n, total) {
  if (!total) return "0%";
  return `${((n / total) * 100).toFixed(1)}%`;
}

function renderMarkdown(report) {
  const lines = [];
  lines.push("# I18N Locale Coverage Audit");
  lines.push("");
  lines.push(`Generated: ${report.generatedAt}`);
  lines.push("");
  lines.push("Definitions:");
  lines.push("- **Leaves**: total translatable string slots in the English baseline for the module.");
  lines.push("- **Intentional echo**: leaf whose value matches EN by design (brand names, division names, near-universal cognates, static example data, acronyms). Tracked in `scripts/i18n-intentional-echos.mjs`.");
  lines.push("- **Actionable echo**: leaf that fell through to the EN fallback unintentionally — a real gap.");
  lines.push("- **Missing**: leaf absent in this locale (deepMerge serves EN, but the slot has no localized value).");
  lines.push("- **Localised %**: 100% − ((Actionable echo + Missing) / Leaves).");
  lines.push("");

  let totalActionable = 0;
  for (const byLocale of Object.values(report.modules)) {
    for (const [loc, r] of Object.entries(byLocale)) {
      if (loc === "en") continue;
      totalActionable += r.actionableEqual + r.missing;
    }
  }
  lines.push(`**Total actionable gaps across all modules and locales: ${totalActionable}**`);
  lines.push("");

  for (const [moduleLabel, byLocale] of Object.entries(report.modules)) {
    lines.push(`## \`${moduleLabel}\``);
    lines.push("");
    const enLeaves = byLocale.en?.totalLeaves ?? 0;
    lines.push(`Total EN leaves: **${enLeaves}**`);
    lines.push("");
    lines.push("| Locale | Intentional echo | Actionable echo | Missing | Localised % |");
    lines.push("|---|---:|---:|---:|---:|");
    for (const locale of report.locales) {
      if (locale === "en") continue;
      const r = byLocale[locale];
      if (!r) continue;
      const actionable = r.actionableEqual + r.missing;
      const localised = enLeaves - actionable;
      lines.push(
        `| ${locale} | ${r.intentionalEcho} | ${r.actionableEqual} | ${r.missing} | ${pct(localised, enLeaves)} |`,
      );
    }
    lines.push("");
  }
  return lines.join("\n") + "\n";
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
