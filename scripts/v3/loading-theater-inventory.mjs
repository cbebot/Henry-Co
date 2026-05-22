#!/usr/bin/env node
/**
 * V3-05 S1 — Loading-theater inventory.
 *
 * Greps `apps/` + `packages/` (excluding node_modules, dist, .next, and the
 * OWNER-RESERVED `packages/search-ui/` quality-reference tree) for warmup
 * placeholder copy: "Loading X", "Preparing X", "Warming up", "Just a moment",
 * "One moment please", "Getting things ready", "Working on it".
 *
 * Each hit is classified A / B / C:
 *   - A — real loading state. Acceptable; replace with plain "Loading" or a
 *         structured skeleton if the wait is unavoidable.
 *   - B — fake first-render placeholder. The page should SSR the real
 *         content; remove the theater copy. ANTI-PATTERN.
 *   - C — error or empty state miscoded as loading. FIX the state branching.
 *
 * Heuristics for classification (best-effort; the report flags uncertain
 * matches as "needs-review" rather than silently picking a class):
 *   - "Preparing the public X experience" / "Preparing X..." -> Class B
 *     (these are the named PRODUCT-GAP-LEDGER warmup surfaces).
 *   - "Loading X" inside a `loading.tsx` file with no SSR content nearby ->
 *     Class B (the file itself is the loading boundary; the copy is theater).
 *   - "Loading X" inside a Suspense fallback prop -> Class B (S6 sweep).
 *   - "Loading X" inside a component that consumes useState `isLoading` and
 *     renders alongside real fetched content -> Class A (genuine).
 *   - "Working on it" alone is too ambiguous -> "needs-review".
 *   - All `.test.` / `.spec.` / `__tests__` files -> EXEMPT (test fixtures).
 *   - All paths under `packages/search-ui/` -> EXEMPT (owner-reserved).
 *
 * Output: `docs/v3/loading-theater-inventory.md` with per-file:line entries
 * grouped by class. Counts at the top.
 */

import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const APPS_DIR = path.join(ROOT, "apps");
const PACKAGES_DIR = path.join(ROOT, "packages");
const OUT_FILE = path.join(ROOT, "docs", "v3", "loading-theater-inventory.md");

const SKIP_DIRS = new Set([
  "node_modules",
  ".next",
  "dist",
  "build",
  ".turbo",
  ".vercel",
  ".git",
  "coverage",
]);

// Owner-reserved tree: quality reference only, NEVER modify.
const OWNER_RESERVED_PREFIX = path.join(PACKAGES_DIR, "search-ui");

// Test/spec/fixture files — exempt from cleanup (matches are test data).
const TEST_PATH_RE = /(\.test\.|\.spec\.|__tests__|__fixtures__|\.stories\.)/i;

const FILE_EXT_RE = /\.(tsx?|jsx?|mjs|cjs)$/;

// Patterns we hunt. Each entry: { pattern: RegExp, label: string }.
// The capture group, when present, captures the "noun" after the warmup verb.
const PATTERNS = [
  { label: "Loading X", pattern: /Loading\s+([A-Za-z][A-Za-z0-9 _'\-]{1,60})/g },
  { label: "Preparing X", pattern: /Preparing\s+([A-Za-z][A-Za-z0-9 _'\-]{1,80})/g },
  { label: "Warming up", pattern: /Warming up([^"'`<\n]{0,80})/g },
  { label: "Just a moment", pattern: /Just a moment([^"'`<\n]{0,80})/g },
  { label: "One moment please", pattern: /One moment please/g },
  { label: "Getting things ready", pattern: /Getting things ready/g },
  { label: "Working on it", pattern: /Working on it/g },
];

// Phrases we always treat as Class B (decorative theater).
const ALWAYS_B = [
  /Preparing the public/i,
  /Preparing your creative workspace/i,
  /Preparing shipping, tracking/i,
  /Preparing products, stores/i,
  /Loading your learning experience/i,
  /Loading HenryCo Studio/i,
  /Loading marketplace/i,
  /Loading logistics/i,
];

// Phrases we always treat as needs-review (too generic to classify).
const NEEDS_REVIEW = [/Working on it/i];

// Phrases that legitimately describe loading inside in-flight fetch UI.
// These are Class A — keep, but consider replacing with structured skeletons.
const LIKELY_A_CONTEXT = [
  "isLoading",
  "isPending",
  "isFetching",
  "useTransition",
  "loading:",
  "state.loading",
  "Suspense",
];

async function walk(dir, out) {
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const ent of entries) {
    if (SKIP_DIRS.has(ent.name)) continue;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      await walk(full, out);
    } else if (ent.isFile() && FILE_EXT_RE.test(ent.name)) {
      out.push(full);
    }
  }
}

function classify(filePath, line, snippet) {
  // Owner-reserved tree — exempt.
  if (filePath.startsWith(OWNER_RESERVED_PREFIX)) return "EXEMPT";
  // Test fixtures — exempt.
  if (TEST_PATH_RE.test(filePath)) return "EXEMPT";
  // Always-B (the named theater phrases).
  if (ALWAYS_B.some((re) => re.test(snippet))) return "B";
  // Always-needs-review.
  if (NEEDS_REVIEW.some((re) => re.test(snippet))) return "needs-review";
  // If the file path is a loading.tsx and the match is the body text — Class B.
  if (/[\\/](loading)\.tsx$/.test(filePath)) return "B";
  // If the file context cues a real in-flight fetch — Class A.
  if (LIKELY_A_CONTEXT.some((cue) => snippet.includes(cue))) return "A";
  // Suspense fallback theater — Class B (S6).
  if (/fallback\s*=\s*\{[^}]*Loading/.test(snippet)) return "B";
  // Default: needs-review.
  return "needs-review";
}

/**
 * A match on a line that is part of a JS/TS comment (line-comment `//`,
 * block-comment `*`, or markdown-style doc comment) is not visible UI
 * copy. We exclude these from classification so the inventory reports
 * the surfaces that actually render the strings.
 */
function isCommentLine(line) {
  const trimmed = line.trim();
  if (trimmed.startsWith("//")) return true;
  if (trimmed.startsWith("*")) return true;
  if (trimmed.startsWith("/*")) return true;
  if (trimmed.startsWith("#")) return true; // markdown headings / shell
  return false;
}

/**
 * Some matches are syntactic noise — JS import statements ("Loading from"
 * matches `import X from ...`), JSX prop names ("Loading title" matches
 * `title="..."`), and `<span className="sr-only">Loading content.</span>`
 * which is an a11y screen-reader announcement (REQUIRED, not theater).
 * Skip them so the inventory shows real user-facing strings only.
 */
function isNoise(line, match) {
  // `import X from "..."` — JS module import.
  if (/^\s*import\b.*from\s+["']/.test(line)) return true;
  // `<Component title="..." />` — JSX prop name picked up by the loose
  // regex when the prop value starts inside a Loading-prefix string.
  if (/title=/.test(line) && match.startsWith("Loading title")) return true;
  // `<span className="sr-only">Loading...</span>` — required a11y label.
  if (/sr-only/.test(line)) return true;
  return false;
}

async function scanFile(file, hits) {
  let raw;
  try {
    raw = await fs.readFile(file, "utf8");
  } catch {
    return;
  }
  const lines = raw.split(/\r?\n/);
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (!line) continue;
    if (isCommentLine(line)) continue;
    for (const { label, pattern } of PATTERNS) {
      pattern.lastIndex = 0;
      let m;
      while ((m = pattern.exec(line)) !== null) {
        if (isNoise(line, m[0])) continue;
        const snippet = lines
          .slice(Math.max(0, i - 1), Math.min(lines.length, i + 2))
          .join("\n");
        const cls = classify(file, i + 1, snippet);
        hits.push({
          file: path.relative(ROOT, file).replace(/\\/g, "/"),
          line: i + 1,
          pattern: label,
          match: m[0],
          noun: m[1] ? m[1].trim().replace(/[.,:;].*$/, "").trim() : "",
          class: cls,
          context: line.trim().slice(0, 200),
        });
      }
    }
  }
}

function counts(hits) {
  const acc = { A: 0, B: 0, C: 0, "needs-review": 0, EXEMPT: 0 };
  for (const h of hits) acc[h.class] = (acc[h.class] || 0) + 1;
  return acc;
}

function groupBy(hits, fn) {
  const m = new Map();
  for (const h of hits) {
    const k = fn(h);
    if (!m.has(k)) m.set(k, []);
    m.get(k).push(h);
  }
  return m;
}

function renderMd(hits) {
  const c = counts(hits);
  const lines = [];
  lines.push("# V3-05 — Loading-theater inventory");
  lines.push("");
  lines.push("_Generated by `scripts/v3/loading-theater-inventory.mjs`._");
  lines.push("");
  lines.push("Scope: every `apps/**` and `packages/**` source file (TS/JS/TSX/JSX).");
  lines.push(
    "Excluded: `node_modules/`, `.next/`, `dist/`, `build/`, `.turbo/`, `.vercel/`, "
      + "`packages/search-ui/` (OWNER-RESERVED — quality reference only), test/spec/fixture files."
  );
  lines.push("");
  lines.push("## Counts");
  lines.push("");
  lines.push(`- **Class A — real loading state (keep / migrate to skeleton):** ${c.A}`);
  lines.push(`- **Class B — fake/decorative theater (REMOVE):** ${c.B}`);
  lines.push(`- **Class C — empty/error miscoded as loading (FIX):** ${c.C}`);
  lines.push(`- **Needs review (ambiguous context):** ${c["needs-review"]}`);
  lines.push(`- **Exempt (search-ui / tests):** ${c.EXEMPT}`);
  lines.push(`- **Total matches:** ${hits.length}`);
  lines.push("");
  lines.push("## Class B — fake/decorative (replace with real SSR content or structured skeleton)");
  lines.push("");
  const B = hits.filter((h) => h.class === "B");
  const byFileB = groupBy(B, (h) => h.file);
  for (const [file, list] of [...byFileB.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    lines.push(`### \`${file}\``);
    lines.push("");
    for (const h of list) {
      lines.push(`- **L${h.line}** — \`${h.match}\` — _${h.context}_`);
    }
    lines.push("");
  }
  lines.push("## Class A — real in-flight loading (keep; consider StructuredSkeleton)");
  lines.push("");
  const A = hits.filter((h) => h.class === "A");
  const byFileA = groupBy(A, (h) => h.file);
  for (const [file, list] of [...byFileA.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    lines.push(`### \`${file}\``);
    lines.push("");
    for (const h of list) {
      lines.push(`- **L${h.line}** — \`${h.match}\` — _${h.context}_`);
    }
    lines.push("");
  }
  lines.push("## Needs review");
  lines.push("");
  const R = hits.filter((h) => h.class === "needs-review");
  const byFileR = groupBy(R, (h) => h.file);
  for (const [file, list] of [...byFileR.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    lines.push(`### \`${file}\``);
    lines.push("");
    for (const h of list) {
      lines.push(`- **L${h.line}** — \`${h.match}\` — _${h.context}_`);
    }
    lines.push("");
  }
  lines.push("## Exempt (informational only — do not touch)");
  lines.push("");
  const EX = hits.filter((h) => h.class === "EXEMPT");
  if (EX.length === 0) {
    lines.push("_(none)_");
  } else {
    const byFileE = groupBy(EX, (h) => h.file);
    for (const [file, list] of [...byFileE.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
      lines.push(`### \`${file}\` (exempt)`);
      for (const h of list) {
        lines.push(`- **L${h.line}** — \`${h.match}\``);
      }
      lines.push("");
    }
  }
  return lines.join("\n") + "\n";
}

async function main() {
  const files = [];
  await walk(APPS_DIR, files);
  await walk(PACKAGES_DIR, files);
  const hits = [];
  for (const f of files) {
    await scanFile(f, hits);
  }
  const md = renderMd(hits);
  await fs.mkdir(path.dirname(OUT_FILE), { recursive: true });
  await fs.writeFile(OUT_FILE, md, "utf8");
  const c = counts(hits);
  // eslint-disable-next-line no-console
  console.log(
    `Loading-theater inventory: total=${hits.length}, A=${c.A}, B=${c.B}, C=${c.C}, `
      + `needs-review=${c["needs-review"]}, exempt=${c.EXEMPT}`
  );
  // eslint-disable-next-line no-console
  console.log(`Wrote ${path.relative(ROOT, OUT_FILE).replace(/\\/g, "/")}`);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
