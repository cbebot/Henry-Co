#!/usr/bin/env node
// V2-A11Y-01 — Y0 vs Y3 diff.
//
// Compares two summary.json files and emits a Markdown "Fix evidence"
// section. Usage:
//   node scripts/a11y/diff.mjs --baseline=<path> --current=<path>
// Defaults: baseline.json + summary.json under .codex-temp/v2-a11y-01.
//
// Anti-pattern guard: refuses to run if baseline and current share the same
// timestamp (hash) — proves the second audit actually executed.

import { readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { createHash } from "node:crypto";
import pc from "picocolors";

const ROOT = resolve(process.cwd());
const OUT_DIR = join(ROOT, ".codex-temp/v2-a11y-01");

const argv = parse(process.argv.slice(2));
const baselinePath = argv.baseline || join(OUT_DIR, "baseline.json");
const currentPath = argv.current || join(OUT_DIR, "summary.json");

const baselineRaw = await readFile(baselinePath, "utf8");
const currentRaw = await readFile(currentPath, "utf8");
if (sha(baselineRaw) === sha(currentRaw)) {
  console.error(pc.red("Baseline and current have identical hashes — re-run pnpm a11y before diffing."));
  process.exit(2);
}

const baseline = JSON.parse(baselineRaw);
const current = JSON.parse(currentRaw);

const md = renderDiff(baseline, current);
const outPath = argv.out || join(OUT_DIR, "fix-evidence.md");
await writeFile(outPath, md);
console.log(md);
console.log(pc.gray(`\n→ ${outPath}`));

function parse(args) {
  const out = {};
  for (const a of args) {
    const m = /^--([^=]+)(?:=(.*))?$/.exec(a);
    if (m) out[m[1]] = m[2] ?? true;
  }
  return out;
}

function sha(s) {
  return createHash("sha256").update(s).digest("hex");
}

function renderDiff(baseline, current) {
  const apps = new Set([...Object.keys(baseline.apps || {}), ...Object.keys(current.apps || {})]);
  let md = `# Fix evidence — Y0 → Y3\n\nBaseline: ${baseline.generatedAt}  \nCurrent:  ${current.generatedAt}\n\n`;
  md += `## Totals\n\n| Severity | Y0 | Y3 | Δ |\n|---|---:|---:|---:|\n`;
  for (const k of ["critical", "serious", "moderate", "minor"]) {
    const a = baseline.totals?.[k] ?? 0;
    const b = current.totals?.[k] ?? 0;
    const d = b - a;
    md += `| ${k} | ${a} | ${b} | ${d > 0 ? pc.dim(`+${d}`) : d} |\n`.replace(/\[[0-9;]*m/g, "");
  }
  md += "\n";

  md += `## Per-app deltas\n\n| App | Severity | Y0 | Y3 | Δ |\n|---|---|---:|---:|---:|\n`;
  for (const app of [...apps].sort()) {
    const a = baseline.apps?.[app]?.totals || {};
    const b = current.apps?.[app]?.totals || {};
    for (const sev of ["critical", "serious", "moderate", "minor"]) {
      const av = a[sev] ?? 0;
      const bv = b[sev] ?? 0;
      if (av === 0 && bv === 0) continue;
      md += `| ${app} | ${sev} | ${av} | ${bv} | ${bv - av} |\n`;
    }
  }
  md += "\n";

  const allClear =
    (current.totals?.critical ?? 0) === 0 && (current.totals?.serious ?? 0) === 0;
  md += allClear
    ? `## Result\n\n✓ All critical and serious violations resolved.\n`
    : `## Result\n\n✗ ${current.totals?.critical ?? 0} critical and ${current.totals?.serious ?? 0} serious violations remain.\n`;
  return md;
}
