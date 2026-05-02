#!/usr/bin/env node
// V2-A11Y-01 — aggregator.
//
// Reads every per-route JSON under .codex-temp/v2-a11y-01/<app>/ and writes:
//   .codex-temp/v2-a11y-01/summary.json — machine-readable counts + violation
//                                          fingerprints (used by gate.mjs and
//                                          diff.mjs).
//   .codex-temp/v2-a11y-01/report.md    — the brief's required persisted
//                                          report. Embeds headers.md and
//                                          contrast.md if present.

import { readdir, readFile, writeFile, stat, mkdir } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import pc from "picocolors";

const ROOT = resolve(process.cwd());
const OUT_DIR = join(ROOT, ".codex-temp/v2-a11y-01");
await mkdir(OUT_DIR, { recursive: true });

const summary = { generatedAt: new Date().toISOString(), totals: { critical: 0, serious: 0, moderate: 0, minor: 0 }, apps: {} };
const violationsTable = [];

for (const appDir of await safeReaddir(OUT_DIR)) {
  const full = join(OUT_DIR, appDir);
  if (!(await isDir(full))) continue;
  if (["auth", "sr-logs"].includes(appDir)) continue;
  summary.apps[appDir] = { routes: {}, totals: { critical: 0, serious: 0, moderate: 0, minor: 0 } };

  for (const file of await safeReaddir(full)) {
    if (!file.endsWith(".json")) continue;
    const p = join(full, file);
    let data;
    try {
      data = JSON.parse(await readFile(p, "utf8"));
    } catch {
      continue;
    }
    if (!data || !data.counts) continue;

    summary.apps[appDir].routes[data.name || file] = data.counts;
    for (const k of Object.keys(data.counts)) {
      summary.apps[appDir].totals[k] += data.counts[k];
      summary.totals[k] += data.counts[k];
    }

    for (const v of data.violations || []) {
      for (const node of v.nodes || []) {
        violationsTable.push({
          app: appDir,
          route: data.route,
          ruleId: v.id,
          impact: v.impact,
          target: (node.target || []).join(" "),
          help: v.help,
          helpUrl: v.helpUrl,
        });
      }
    }
  }
}

await writeFile(join(OUT_DIR, "summary.json"), JSON.stringify(summary, null, 2));

const md = renderReport(summary, violationsTable);
await writeFile(join(OUT_DIR, "report.md"), md);

console.log(
  pc.bold(
    `Aggregate: C:${summary.totals.critical} S:${summary.totals.serious} M:${summary.totals.moderate} m:${summary.totals.minor}`,
  ),
);
console.log(pc.gray(`  → ${join(OUT_DIR, "summary.json")}`));
console.log(pc.gray(`  → ${join(OUT_DIR, "report.md")}`));

async function safeReaddir(p) {
  try {
    return await readdir(p);
  } catch {
    return [];
  }
}

async function isDir(p) {
  try {
    return (await stat(p)).isDirectory();
  } catch {
    return false;
  }
}

function renderReport(summary, table) {
  let md = `# V2-A11Y-01 — WCAG 2.2 AA audit report\n\nGenerated: ${summary.generatedAt}\n\n`;
  md += `## Coverage\n\n- **In scope:** account, care, hub, jobs, learn, logistics, marketplace, property, staff, studio (10 web apps).\n`;
  md += `- **Out of scope:** company-hub (no app/ dir), super-app (Expo/React Native — separate a11y stack).\n`;
  md += `- **Screen-reader coverage:** NVDA + Narrator on Windows (this PR). VoiceOver on macOS scheduled as 2-week follow-up.\n\n`;

  md += `## Totals\n\n| Severity | Count |\n|---|---:|\n| Critical | ${summary.totals.critical} |\n| Serious | ${summary.totals.serious} |\n| Moderate | ${summary.totals.moderate} |\n| Minor | ${summary.totals.minor} |\n\n`;

  md += `## Per-app breakdown\n\n| App | Critical | Serious | Moderate | Minor |\n|---|---:|---:|---:|---:|\n`;
  for (const [app, data] of Object.entries(summary.apps)) {
    md += `| ${app} | ${data.totals.critical} | ${data.totals.serious} | ${data.totals.moderate} | ${data.totals.minor} |\n`;
  }
  md += "\n";

  md += `## Per-route breakdown\n\n`;
  for (const [app, data] of Object.entries(summary.apps)) {
    md += `### ${app}\n\n| Route | C | S | M | m |\n|---|---:|---:|---:|---:|\n`;
    for (const [route, c] of Object.entries(data.routes)) {
      md += `| ${route} | ${c.critical} | ${c.serious} | ${c.moderate} | ${c.minor} |\n`;
    }
    md += "\n";
  }

  if (table.length) {
    const top = table.filter((r) => r.impact === "critical" || r.impact === "serious").slice(0, 200);
    md += `## Top violations (critical + serious, capped at 200)\n\n| App | Route | Rule | Impact | Target |\n|---|---|---|---|---|\n`;
    for (const r of top) {
      md += `| ${r.app} | ${r.route} | [${r.ruleId}](${r.helpUrl}) | ${r.impact} | \`${truncate(r.target, 60)}\` |\n`;
    }
    md += "\n";
  }

  // Embed sidecar artefacts if present.
  for (const sidecar of ["contrast.md", "headers.md"]) {
    const p = join(OUT_DIR, sidecar);
    if (existsSync(p)) {
      md += `\n---\n\n`;
      try {
        md += readFileSync(p, "utf8") + "\n";
      } catch {
        /* ignore */
      }
    }
  }

  md += `\n---\n\n## Manual NVDA + Narrator sweeps\n\n_TODO: populate during Y3 manual pass. Each entry: flow → pass/fail → transcript path under sr-logs/._\n\n`;
  md += `## Keyboard-only walks (top 20 paths)\n\n| Path | Tab to CTA | Esc route | Result |\n|---|---:|---|---|\n| _TODO populate during Y3_ |  |  |  |\n\n`;
  md += `## Deferred — moderate items\n\nSee \`MODERATE-DEFERRED.md\` (consumed by V2-CLOSE-01).\n`;

  return md;
}

function truncate(s, n) {
  if (!s) return "";
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

