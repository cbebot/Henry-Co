#!/usr/bin/env node
// Summarize the hardcoded-string audit by app and write a markdown digest.
import { spawnSync } from "node:child_process";
import fs from "node:fs/promises";

const out = spawnSync("node", ["scripts/i18n-audit-visible-strings.mjs"], {
  cwd: process.cwd(),
  maxBuffer: 64 * 1024 * 1024,
  encoding: "utf8",
});
const j = JSON.parse(out.stdout);

const byApp = {};
let total = 0;
for (const f of j.files) {
  total += f.findings.length;
  const parts = f.file.split(/[\\/]/);
  const app = parts.slice(0, 2).join("/");
  byApp[app] = (byApp[app] || 0) + f.findings.length;
}

const sorted = Object.entries(byApp).sort((x, y) => y[1] - x[1]);

const lines = [];
lines.push("# Hardcoded-string audit (Pass 18 baseline)");
lines.push("");
lines.push(`Files scanned: **${j.scanned}**`);
lines.push(`Total user-visible hardcoded strings flagged: **${total}**`);
lines.push("");
lines.push("These are JSX text, attribute values (placeholder/title/aria-label/alt), and object-literal copy fields that bypass the i18n system.");
lines.push("");
lines.push("Note: This audit produces false positives for proper nouns, file paths, single-letter labels, and identifier-shaped strings; treat the count as an upper bound.");
lines.push("");
lines.push("## By target directory");
lines.push("");
lines.push("| Directory | Findings |");
lines.push("|---|---:|");
for (const [a, n] of sorted) lines.push(`| \`${a}\` | ${n} |`);

await fs.writeFile("docs/v3/I18N-PASS-18-HARDCODED-AUDIT.md", lines.join("\n") + "\n");
console.log(`Total: ${total}`);
console.log(`Wrote → docs/v3/I18N-PASS-18-HARDCODED-AUDIT.md`);
