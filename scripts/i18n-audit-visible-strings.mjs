import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const DEFAULT_TARGETS = [
  "apps/account",
  "apps/marketplace",
  "apps/jobs",
  "apps/care",
  "apps/learn",
  "apps/logistics",
  "apps/property",
  "apps/studio",
  "packages/ui",
];

const INCLUDE_EXT = new Set([".ts", ".tsx"]);
const IGNORE_DIRS = new Set([
  ".git",
  ".next",
  "coverage",
  "dist",
  "node_modules",
  "storybook-static",
  "tests",
  "__tests__",
]);

const ATTRIBUTE_PATTERN =
  /\b(?:placeholder|title|aria-label|aria-description|alt)\s*=\s*"([^"]*[A-Za-z][^"]*)"/g;
const OBJECT_PATTERN =
  /\b(?:label|title|description|helperText|emptyTitle|emptyBody|headline|subheading)\s*:\s*"([^"]*[A-Za-z][^"]*)"/g;
const JSX_TEXT_PATTERN = />([^<>{]*[A-Za-z][^<>{]*)</g;

function looksUserVisible(text) {
  const value = text.trim();
  if (!value) return false;
  if (value.length < 2) return false;
  if (/^(https?:|\/|[A-Z0-9_:-]+)$/.test(value)) return false;
  if (/^[\d\s.,:%+-]+$/.test(value)) return false;
  if (value.includes("className") || value.includes("var(--")) return false;
  return /[A-Za-z]/.test(value);
}

function shouldSkipLine(line) {
  return /copy\.|authCopy|surfaceCopy|translateSurfaceLabel|getSurfaceCopy|getAuthCopy/.test(line);
}

function lineNumberForIndex(source, index) {
  return source.slice(0, index).split("\n").length;
}

async function walk(dir, files = []) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (IGNORE_DIRS.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(fullPath, files);
      continue;
    }
    if (!INCLUDE_EXT.has(path.extname(entry.name))) continue;
    files.push(fullPath);
  }
  return files;
}

async function auditFile(filePath) {
  const source = await fs.readFile(filePath, "utf8");
  const findings = [];

  for (const pattern of [ATTRIBUTE_PATTERN, OBJECT_PATTERN, JSX_TEXT_PATTERN]) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(source)) !== null) {
      const raw = (match[1] || "").replace(/\s+/g, " ").trim();
      if (!looksUserVisible(raw)) continue;
      const line = lineNumberForIndex(source, match.index);
      const lineText = source.split("\n")[line - 1] || "";
      if (shouldSkipLine(lineText)) continue;
      findings.push({ line, text: raw });
    }
  }

  return findings;
}

async function main() {
  const requested = process.argv.slice(2);
  const targets = (requested.length ? requested : DEFAULT_TARGETS).map((target) =>
    path.resolve(ROOT, target),
  );

  const allFiles = [];
  for (const target of targets) {
    await walk(target, allFiles);
  }

  const report = [];
  for (const filePath of allFiles) {
    const findings = await auditFile(filePath);
    if (!findings.length) continue;
    report.push({
      file: path.relative(ROOT, filePath),
      findings,
    });
  }

  console.log(JSON.stringify({ scanned: allFiles.length, files: report }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
