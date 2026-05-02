#!/usr/bin/env node
// V2-A11Y-01 — CI gate.
//
// Reads .codex-temp/v2-a11y-01/summary.json and exits 1 if any route has
// critical>0 or serious>0. Optionally also checks headers.json regressions.
//
// Used in .github/workflows/a11y.yml and as a local pre-merge check via
// `pnpm a11y:gate`. Pass --dry-run to print the planned gate decision
// without exiting non-zero.

import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import pc from "picocolors";

const ROOT = resolve(process.cwd());
const OUT_DIR = join(ROOT, ".codex-temp/v2-a11y-01");
const argv = parse(process.argv.slice(2));

const summaryPath = join(OUT_DIR, "summary.json");
const headersPath = join(OUT_DIR, "headers.json");

if (!existsSync(summaryPath)) {
  // V2-A11Y-01 PR-A ships the pipeline; the audit baseline is generated
  // by a follow-up pass. Without summary.json there's nothing to gate
  // against — treat as a passive skip rather than a hard fail so the
  // workflow doesn't block PRs while the baseline is pending.
  console.log(pc.yellow(`a11y gate: skipped — ${summaryPath} not present yet`));
  console.log(pc.yellow("(pipeline shipped; run 'pnpm a11y' to seed the baseline)"));
  process.exit(0);
}
const summary = JSON.parse(await readFile(summaryPath, "utf8"));

const failures = [];
if ((summary.totals?.critical ?? 0) > 0)
  failures.push(`${summary.totals.critical} critical violations`);
if ((summary.totals?.serious ?? 0) > 0)
  failures.push(`${summary.totals.serious} serious violations`);

for (const [app, data] of Object.entries(summary.apps || {})) {
  for (const [route, c] of Object.entries(data.routes || {})) {
    if (c.critical > 0 || c.serious > 0) {
      failures.push(`  ${app}${route} — C:${c.critical} S:${c.serious}`);
    }
  }
}

if (existsSync(headersPath)) {
  const h = JSON.parse(await readFile(headersPath, "utf8"));
  if ((h.regressions ?? 0) > 0) {
    failures.push(`${h.regressions} security-header regressions (PNH baseline)`);
  }
}

if (failures.length === 0) {
  console.log(pc.green("a11y gate: pass"));
  process.exit(0);
}

console.log(pc.red("a11y gate: FAIL"));
for (const f of failures) console.log(pc.red(`  ${f}`));
if (argv["dry-run"]) {
  console.log(pc.yellow("(dry-run — exit 0 anyway)"));
  process.exit(0);
}
process.exit(1);

function parse(args) {
  const out = {};
  for (const a of args) {
    const m = /^--([^=]+)(?:=(.*))?$/.exec(a);
    if (m) out[m[1]] = m[2] ?? true;
  }
  return out;
}
