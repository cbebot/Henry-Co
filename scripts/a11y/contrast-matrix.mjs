#!/usr/bin/env node
// V2-A11Y-01 — contrast matrix generator.
//
// Reads brand accents from packages/config/company.ts (DivisionConfig.accent
// and accentStrong) and computes WCAG contrast ratios against common
// surfaces. Writes machine-readable JSON + a Markdown table appended to
// .codex-temp/v2-a11y-01/contrast.json and report.md.
//
// Source-of-truth: regex-extracts hex values from company.ts so the script
// stays in sync without runtime TypeScript.

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join, resolve } from "node:path";
import * as wcag from "wcag-contrast";
import pc from "picocolors";

const ROOT = resolve(process.cwd());
const OUT_DIR = join(ROOT, ".codex-temp/v2-a11y-01");
const COMPANY_TS = join(ROOT, "packages/config/company.ts");

await mkdir(OUT_DIR, { recursive: true });

const src = await readFile(COMPANY_TS, "utf8");
const divisions = parseDivisions(src);

// Backgrounds we care about. Light surfaces dominate the public sites.
const BACKGROUNDS = {
  white: "#FFFFFF",
  nearWhite: "#FAFAFA",
  surfaceLight: "#F5F4EE",
  dark: "#0B0F1A",
};

// Plus a few neutral text foregrounds we want to verify pair with each accent
// background (icon-on-accent style).
const FOREGROUNDS_ON_ACCENT = {
  white: "#FFFFFF",
  black: "#000000",
};

const rows = [];
const advisories = [];

for (const d of divisions) {
  for (const [bgName, bgHex] of Object.entries(BACKGROUNDS)) {
    for (const [fgKey, fgHex] of [
      [`${d.key}.accent`, d.accent],
      [`${d.key}.accentStrong`, d.accentStrong],
      [`${d.key}.accentText`, d.accentText],
    ]) {
      if (!fgHex) continue;
      const ratio = round(wcag.hex(fgHex, bgHex));
      const row = {
        fg: fgKey,
        fgHex,
        bg: bgName,
        bgHex,
        ratio,
        passBody: ratio >= 4.5,
        passLarge: ratio >= 3,
        passUI: ratio >= 3,
      };
      rows.push(row);
      if (!row.passBody) {
        advisories.push(
          `${fgKey} (${fgHex}) on ${bgName} — ratio ${ratio} (FAIL body 4.5:1${row.passLarge ? ", passes large" : ", FAIL large 3:1"})`,
        );
      }
    }
  }

  // Reverse: accents as backgrounds with white/black text on top.
  for (const [bgKey, bgHex] of [
    [`${d.key}.accent`, d.accent],
    [`${d.key}.accentStrong`, d.accentStrong],
  ]) {
    if (!bgHex) continue;
    for (const [fgName, fgHex] of Object.entries(FOREGROUNDS_ON_ACCENT)) {
      const ratio = round(wcag.hex(fgHex, bgHex));
      rows.push({
        fg: fgName,
        fgHex,
        bg: bgKey,
        bgHex,
        ratio,
        passBody: ratio >= 4.5,
        passLarge: ratio >= 3,
        passUI: ratio >= 3,
      });
    }
  }
}

await writeFile(
  join(OUT_DIR, "contrast.json"),
  JSON.stringify({ generatedAt: new Date().toISOString(), rows }, null, 2),
);

const md = renderMarkdown(rows, advisories);
await writeFile(join(OUT_DIR, "contrast.md"), md);

const failBody = rows.filter((r) => !r.passBody).length;
const tone = failBody > 0 ? pc.yellow : pc.green;
console.log(
  tone(
    `Contrast matrix: ${rows.length} pairs, ${failBody} fail body 4.5:1, ${rows.filter((r) => !r.passLarge).length} fail large 3:1`,
  ),
);
console.log(pc.gray(`  → ${join(OUT_DIR, "contrast.json")}`));
console.log(pc.gray(`  → ${join(OUT_DIR, "contrast.md")}`));

function parseDivisions(source) {
  // Match each division block. accentText is V2-A11Y-01's WCAG-AA sibling
  // (≥4.5:1 on white) — scan it too so the matrix shows it actually clears.
  const blocks = [];
  const blockRe = /(\w+):\s*\{[\s\S]*?accent:\s*"(#[0-9A-Fa-f]+)"[\s\S]*?accentStrong:\s*"(#[0-9A-Fa-f]+)"[\s\S]*?accentText:\s*"(#[0-9A-Fa-f]+)"[\s\S]*?\}/g;
  let m;
  while ((m = blockRe.exec(source))) {
    blocks.push({
      key: m[1],
      accent: m[2],
      accentStrong: m[3],
      accentText: m[4],
    });
  }
  return blocks.filter(
    (b) => !["divisions"].includes(b.key) && b.key !== "group",
  );
}

function round(n) {
  return Math.round(n * 100) / 100;
}

function renderMarkdown(rows, advisories) {
  const head = "| FG | FG hex | BG | BG hex | Ratio | Body 4.5:1 | Large 3:1 | UI 3:1 |\n|---|---|---|---|---:|---|---|---|\n";
  const body = rows
    .map(
      (r) =>
        `| \`${r.fg}\` | ${r.fgHex} | \`${r.bg}\` | ${r.bgHex} | ${r.ratio} | ${r.passBody ? "✓" : "✗"} | ${r.passLarge ? "✓" : "✗"} | ${r.passUI ? "✓" : "✗"} |`,
    )
    .join("\n");
  const advBlock = advisories.length
    ? `\n### Advisories — body text ratio fails\n\n${advisories.map((a) => `- ${a}`).join("\n")}\n`
    : "\n_All pairs meet WCAG body text minimum._\n";
  return `# Contrast matrix — V2-A11Y-01\n\nGenerated: ${new Date().toISOString()}\n\n${head}${body}\n${advBlock}`;
}
