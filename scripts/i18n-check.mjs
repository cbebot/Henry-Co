#!/usr/bin/env node
// ---------------------------------------------------------------------------
// scripts/i18n-check.mjs — V3-07(S8) lightweight i18n gate.
//
// What this gate guarantees:
//   1. `scripts/v3/hardcoded-text-scan.mjs --check` — no NEW JSX-text or
//      user-visible-attr GAPs since the last baseline in
//      docs/v3/i18n-gaps/hardcoded-scan-<YYYY-MM-DD>.json. Exemptions
//      live in docs/v3/i18n-gaps/exempt.json.
//
// What it intentionally does NOT do (deferred to a future foundation pass):
//   - Re-run the deep extra-labels coverage audit. Those scripts
//     (i18n-audit-locale-coverage.mjs, i18n-extra-labels-audit.mjs) need a
//     TypeScript loader (tsx) that is not installed in this branch. The
//     coverage state is otherwise frozen via the manifests in
//     docs/v3/i18n-gaps/{summary,module-gaps,extra-label-gaps,work-units}.json
//     captured 2026-05-17.
//
// Usage:
//   node scripts/i18n-check.mjs            # baseline scan + write fresh report
//   node scripts/i18n-check.mjs --strict   # fail on NEW hardcoded GAPs
//   pnpm i18n:check                        # alias of `node scripts/i18n-check.mjs`
//   pnpm i18n:check --strict               # CI-strict (used by GitHub Actions)
// ---------------------------------------------------------------------------
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

const STRICT = process.argv.includes("--strict") || process.argv.includes("--check");

function run(label, cmd, args) {
  process.stdout.write(`\n[i18n:check] ${label}\n`);
  const result = spawnSync(cmd, args, { cwd: ROOT, stdio: "inherit" });
  if (result.status !== 0) {
    process.stdout.write(`[i18n:check] ${label} FAILED with exit ${result.status}\n`);
    process.exit(result.status ?? 1);
  }
}

const scanArgs = ["scripts/v3/hardcoded-text-scan.mjs"];
if (STRICT) scanArgs.push("--check");
run("hardcoded-text scan", process.execPath, scanArgs);

process.stdout.write("\n[i18n:check] OK — all checks passed.\n");
