#!/usr/bin/env node
/**
 * V3-07(S3) — Hardcoded-text scan.
 *
 * Walks `apps/` + `packages/` (Next.js + shared lib code) and flags JSX
 * text content + user-visible attributes + toast/alert messages that look
 * like hardcoded English copy. The goal is a single audit-ready JSON
 * dropped into `docs/v3/i18n-gaps/` that future passes (and CI in strict
 * mode — see V3-07 S8) can compare against.
 *
 * Classification (kept intentionally small + auditable):
 *   OK         — already a surface-label reference: <T label="..."/>,
 *                t("..."), translateSurfaceLabel(...), copy.X.Y, or a
 *                template literal that resolves to a typed copy module.
 *   GAP        — looks like hardcoded user-visible English copy.
 *   EXEMPT     — file is explicitly excluded by path or context
 *                (test files, scripts/, dev-only labels), or string
 *                matches the OWNER allow-list in docs/v3/i18n-gaps/exempt.json.
 *   AMBIGUOUS  — couldn't decide; needs manual review.
 *
 * Hard exclusions (NOT scanned, NOT emitted even as EXEMPT):
 *   - packages/search-ui/   — owner-reserved (memory:
 *     feedback_dashboard_search_engine_no_touch.md)
 *   - node_modules/, dist/, .next/, out/, .turbo/, build/
 *   - .codex-temp/, .worktree/, .claude/ (dev scaffolding)
 *
 * Usage:
 *   node scripts/v3/hardcoded-text-scan.mjs                 # write fresh report
 *   node scripts/v3/hardcoded-text-scan.mjs --check         # exit 1 on new GAPs
 *   node scripts/v3/hardcoded-text-scan.mjs --out=path.json # custom output path
 *
 * --check mode reads docs/v3/i18n-gaps/exempt.json + the latest
 * hardcoded-scan-*.json baseline and exits non-zero if a NEW GAP is
 * introduced that is not in the exempt list. Existing GAPs do not fail
 * CI — they are a backlog, not a regression bar.
 */

import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { resolve, relative, join, dirname, sep } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..", "..");

// ─── Hard skips (directories that MUST not even appear in EXEMPT output) ───
const HARD_SKIP_DIRS = new Set([
  "node_modules",
  ".next",
  ".turbo",
  "dist",
  "build",
  "out",
  ".vercel",
  ".codex-temp",
  ".worktree",
  ".claude",
  ".git",
  "__tests__",
  "__mocks__",
  "coverage",
]);

// search-ui is owner-reserved. SKIP entirely — do not even emit an EXEMPT entry.
const OWNER_RESERVED_PREFIXES = [
  ["packages", "search-ui"].join(sep),
];

// File suffixes we DO scan. Everything else is silently ignored.
const SCAN_EXTENSIONS = new Set([".tsx", ".jsx"]);

// Roots to walk (relative to repo root).
const SCAN_ROOTS = ["apps", "packages"];

// Attributes on JSX elements where a string literal IS user-visible.
// Anything else (id, name, className, data-*, etc.) is dev-facing — skip.
const USER_VISIBLE_ATTRS = new Set([
  "title",
  "alt",
  "placeholder",
  "label",
  "aria-label",
  "aria-description",
  "aria-roledescription",
  "aria-valuetext",
  "aria-placeholder",
]);

// Function names that wrap user-visible strings. A literal first-arg to any
// of these is a GAP unless it is itself a label key (snake_case / dotted).
const USER_VISIBLE_CALLS = [
  "toast.success",
  "toast.error",
  "toast.info",
  "toast.warning",
  "toast.loading",
  "toast.message",
  "toast.promise",
  "toast.custom",
  "alert",
  "window.alert",
];

// Markers in source that strongly suggest a file is already i18n-wired.
// We still scan such files, but we use these to bump OK confidence.
const I18N_MARKER_PATTERNS = [
  /import\s+[^;]*?from\s+["']@henryco\/i18n[^"']*["']/,
  /import\s+[^;]*?from\s+["']next-intl[^"']*["']/,
  /translateSurfaceLabel\s*\(/,
  /\bt\(["'`]/,
];

// Strings that LOOK like English copy but are EXEMPT (developer-facing,
// brand idioms, or one-word UI primitives whose i18n is handled at the
// surface-copy layer). Append to docs/v3/i18n-gaps/exempt.json for repo-wide
// overrides — this in-code allow-list is for universals only.
const BUILTIN_EXEMPT_STRINGS = new Set([
  "HenryCo",
  "Henry Onyx",
  "Henry Onyx Limited",
  "Henry & Co.",
  "Henry & Co",
  "HENRYCO",
  "henryco",
  "true",
  "false",
  "null",
  "undefined",
  "USD",
  "NGN",
  "EUR",
  "GBP",
  "—",
  "·",
  "•",
  "...",
  "—",
  // single-character punctuation passthroughs
]);

// Minimum length for a string to even be considered as a candidate.
const MIN_TEXT_LEN = 2;

// Maximum length we still scan (mostly a guard against minified chunks).
const MAX_TEXT_LEN = 800;

// ─── CLI args ──────────────────────────────────────────────────────────────
const ARGS = process.argv.slice(2);
const ARG = (name, fallback) => {
  const hit = ARGS.find((arg) => arg === `--${name}` || arg.startsWith(`--${name}=`));
  if (!hit) return fallback;
  const eq = hit.indexOf("=");
  return eq === -1 ? true : hit.slice(eq + 1);
};
const CHECK_MODE = ARG("check", false) === true;
const DATESTAMP = new Date().toISOString().slice(0, 10);
const OUT_PATH = String(
  ARG("out", join(REPO_ROOT, "docs", "v3", "i18n-gaps", `hardcoded-scan-${DATESTAMP}.json`)),
);
const EXEMPT_JSON_PATH = join(REPO_ROOT, "docs", "v3", "i18n-gaps", "exempt.json");

// ─── Helpers ───────────────────────────────────────────────────────────────
function isOwnerReserved(relPath) {
  return OWNER_RESERVED_PREFIXES.some((prefix) => relPath.startsWith(prefix));
}

function looksLikeLabelKey(text) {
  // Surface-copy keys are dotted (e.g. "account.savedItems.empty") or
  // snake_case ("ASK_FOR_HELP") or BEM-ish ("acct-button__primary").
  // None of these are user-visible English.
  if (/^[a-z][a-z0-9_]*(\.[a-z0-9_]+)+$/i.test(text)) return true; // dotted
  if (/^[a-z][a-z0-9_-]*$/i.test(text) && !/\s/.test(text) && text.length < 40) {
    // Single word — let the heuristic below disambiguate
    return false;
  }
  if (/^[A-Z][A-Z0-9_]+$/.test(text) && text.length > 2) return true; // SCREAMING_SNAKE
  return false;
}

function looksLikeCssClass(text) {
  // "rounded-full text-sm leading-relaxed" — tailwind-like utility lists.
  if (/^[a-z][a-z0-9:_-]*(\s+[a-z][a-z0-9:_-]*){1,}$/.test(text) && !/[.?!]/.test(text)) {
    return true;
  }
  if (/^[a-z][a-z0-9:_-]+$/.test(text) && /[-_]/.test(text)) return true; // single utility
  return false;
}

function looksLikeUrlOrPath(text) {
  if (/^https?:\/\//i.test(text)) return true;
  if (/^\/[a-z0-9_\-/?#.]+$/i.test(text) && text.length > 1) return true;
  if (/^[a-z0-9._-]+\.[a-z]{2,}/i.test(text) && !/\s/.test(text)) return true;
  return false;
}

function looksLikeIdentifier(text) {
  // camelCase, PascalCase single tokens, or snake_case identifiers.
  if (/^[a-zA-Z][a-zA-Z0-9_]*$/.test(text) && !/\s/.test(text)) {
    return text.length < 30 && !/[A-Z][a-z]+[A-Z]/.test(text);
  }
  return false;
}

function looksLikeColorOrUnit(text) {
  if (/^#[0-9a-f]{3,8}$/i.test(text)) return true;
  if (/^\d+(\.\d+)?(px|rem|em|vh|vw|%|s|ms|deg)$/i.test(text)) return true;
  if (/^[0-9.]+$/.test(text)) return true;
  return false;
}

function looksLikeEnglishCopy(text) {
  if (text.length < MIN_TEXT_LEN || text.length > MAX_TEXT_LEN) return false;
  if (BUILTIN_EXEMPT_STRINGS.has(text)) return false;
  if (looksLikeLabelKey(text)) return false;
  if (looksLikeCssClass(text)) return false;
  if (looksLikeUrlOrPath(text)) return false;
  if (looksLikeIdentifier(text)) return false;
  if (looksLikeColorOrUnit(text)) return false;
  // Must contain at least one ASCII letter and one whitespace OR end punctuation
  if (!/[A-Za-z]/.test(text)) return false;
  if (!/\s/.test(text)) {
    // Single word — only count if it's clearly a sentence-cased English word
    if (!/^[A-Z][a-z]{2,}$/.test(text)) return false;
  }
  return true;
}

function loadExemptList() {
  if (!existsSync(EXEMPT_JSON_PATH)) return { strings: new Set(), filePrefixes: [] };
  try {
    const raw = readFileSync(EXEMPT_JSON_PATH, "utf8");
    const parsed = JSON.parse(raw);
    return {
      strings: new Set(Array.isArray(parsed.strings) ? parsed.strings : []),
      filePrefixes: Array.isArray(parsed.filePrefixes) ? parsed.filePrefixes : [],
    };
  } catch (err) {
    console.warn(`[hardcoded-text-scan] failed to parse exempt.json: ${err.message}`);
    return { strings: new Set(), filePrefixes: [] };
  }
}

// ─── Walk ──────────────────────────────────────────────────────────────────
function walk(dirAbs, relSoFar, files) {
  let entries;
  try {
    entries = readdirSync(dirAbs);
  } catch {
    return;
  }
  for (const name of entries) {
    if (HARD_SKIP_DIRS.has(name)) continue;
    const childAbs = join(dirAbs, name);
    const childRel = relSoFar ? `${relSoFar}${sep}${name}` : name;

    if (isOwnerReserved(childRel)) continue;

    let st;
    try {
      st = statSync(childAbs);
    } catch {
      continue;
    }
    if (st.isDirectory()) {
      walk(childAbs, childRel, files);
      continue;
    }
    const ext = name.slice(name.lastIndexOf("."));
    if (!SCAN_EXTENSIONS.has(ext)) continue;
    files.push({ abs: childAbs, rel: childRel });
  }
}

function collectFiles() {
  const files = [];
  for (const root of SCAN_ROOTS) {
    const abs = join(REPO_ROOT, root);
    if (!existsSync(abs)) continue;
    walk(abs, root, files);
  }
  return files;
}

// ─── Scan single file ──────────────────────────────────────────────────────
function scanFile(file, exempt) {
  const text = readFileSync(file.abs, "utf8");
  const lines = text.split(/\r?\n/);
  const hits = [];

  const hasI18nMarker = I18N_MARKER_PATTERNS.some((re) => re.test(text));

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Skip pure-comment lines + JSDoc body lines.
    const trimmed = line.trim();
    if (trimmed.startsWith("//") || trimmed.startsWith("*") || trimmed.startsWith("/*")) {
      continue;
    }

    // 1) JSX TEXT CONTENT — >Text here<
    //    Matches: any literal that sits between a closing > and an opening <
    //    or {.  Strips JSX expressions ({...}) before testing.
    const jsxTextMatches = [...line.matchAll(/>([^<>{}\n]{2,})</g)];
    for (const m of jsxTextMatches) {
      const candidate = m[1].trim().replace(/\s+/g, " ");
      if (!candidate) continue;
      const classification = classify(candidate, "jsx_text", file.rel, hasI18nMarker, exempt);
      if (classification) {
        hits.push({
          line: i + 1,
          col: m.index + 1,
          kind: "jsx_text",
          text: candidate,
          classification: classification.label,
          reason: classification.reason,
        });
      }
    }

    // 2) JSX ATTRIBUTE strings on user-visible props.
    //    Matches: title="..." | placeholder="..." etc.
    //    Only literal strings — bracketed expressions ({...}) are i18n-safe.
    for (const attr of USER_VISIBLE_ATTRS) {
      const re = new RegExp(`\\b${attr}=("([^"]{2,})"|'([^']{2,})')`, "g");
      for (const m of [...line.matchAll(re)]) {
        const candidate = (m[2] ?? m[3] ?? "").trim();
        if (!candidate) continue;
        const classification = classify(
          candidate,
          `attr:${attr}`,
          file.rel,
          hasI18nMarker,
          exempt,
        );
        if (classification) {
          hits.push({
            line: i + 1,
            col: m.index + 1,
            kind: `attr:${attr}`,
            text: candidate,
            classification: classification.label,
            reason: classification.reason,
          });
        }
      }
    }

    // 3) Toast / alert calls — toast.error("...")
    for (const callName of USER_VISIBLE_CALLS) {
      const escName = callName.replace(/\./g, "\\.");
      const re = new RegExp(`\\b${escName}\\s*\\(\\s*("([^"]{2,})"|'([^']{2,})'|\`([^\`]{2,})\`)`, "g");
      for (const m of [...line.matchAll(re)]) {
        const candidate = (m[2] ?? m[3] ?? m[4] ?? "").trim().replace(/\s+/g, " ");
        if (!candidate) continue;
        const classification = classify(
          candidate,
          `call:${callName}`,
          file.rel,
          hasI18nMarker,
          exempt,
        );
        if (classification) {
          hits.push({
            line: i + 1,
            col: m.index + 1,
            kind: `call:${callName}`,
            text: candidate,
            classification: classification.label,
            reason: classification.reason,
          });
        }
      }
    }
  }

  return hits;
}

function classify(candidate, kind, relPath, hasI18nMarker, exempt) {
  if (exempt.strings.has(candidate)) {
    return { label: "EXEMPT", reason: "matches exempt.json strings allow-list" };
  }
  for (const prefix of exempt.filePrefixes) {
    if (relPath.startsWith(prefix)) {
      return { label: "EXEMPT", reason: `file under exempt prefix ${prefix}` };
    }
  }

  // Dev-only artefacts that show up inside JSX text/attrs but aren't UI copy.
  if (looksLikeLabelKey(candidate)) {
    return { label: "OK", reason: "looks like a surface-label key (snake/dotted)" };
  }
  if (looksLikeCssClass(candidate)) {
    return null; // pure noise — don't even emit
  }
  if (looksLikeUrlOrPath(candidate)) {
    return null; // URL/route — not text
  }
  if (looksLikeColorOrUnit(candidate)) {
    return null;
  }
  if (looksLikeIdentifier(candidate)) {
    return null;
  }
  if (!looksLikeEnglishCopy(candidate)) {
    return null;
  }

  // Surface-copy references inside JSX often appear as {copy.something.label}
  // — those don't string-match here because we only scan literal strings.
  // So if we got this far, this IS a literal that looks like English.

  // If the file is i18n-wired AND the kind is "jsx_text", lower confidence.
  // The author may have left a literal inside a wrap that the surface module
  // will eventually own. Mark AMBIGUOUS so it surfaces for review but doesn't
  // get auto-counted as a regression.
  if (hasI18nMarker && kind === "jsx_text") {
    return {
      label: "AMBIGUOUS",
      reason: "literal in i18n-wired file — likely missed during the wrap pass",
    };
  }

  return {
    label: "GAP",
    reason:
      kind === "jsx_text"
        ? "hardcoded JSX text content"
        : kind.startsWith("attr:")
          ? `hardcoded user-visible attribute (${kind})`
          : `hardcoded message argument to ${kind}`,
  };
}

// ─── Main ──────────────────────────────────────────────────────────────────
function main() {
  const startedAt = Date.now();
  const exempt = loadExemptList();
  const files = collectFiles();

  let scannedFiles = 0;
  const counts = { OK: 0, GAP: 0, EXEMPT: 0, AMBIGUOUS: 0 };
  const entriesByFile = {};

  for (const file of files) {
    scannedFiles++;
    const hits = scanFile(file, exempt);
    if (!hits.length) continue;
    entriesByFile[file.rel.replace(/\\/g, "/")] = hits.map((h) => ({
      ...h,
    }));
    for (const h of hits) counts[h.classification]++;
  }

  const totals = {
    scannedFiles,
    entries: Object.values(entriesByFile).reduce((a, b) => a + b.length, 0),
    counts,
    durationMs: Date.now() - startedAt,
  };

  const report = {
    schema: "v1",
    generatedAt: new Date().toISOString(),
    generator: "scripts/v3/hardcoded-text-scan.mjs",
    notes:
      "V3-07(S3) hardcoded-text scan. packages/search-ui/ is OWNER-RESERVED and excluded entirely (memory: feedback_dashboard_search_engine_no_touch.md). See exempt.json for repo-wide allow-list.",
    totals,
    entriesByFile,
  };

  // ─── CHECK mode: compare against baseline + exempt list ──────────────────
  if (CHECK_MODE) {
    const baselinePath = findLatestBaseline();
    if (!baselinePath) {
      console.log(
        "[hardcoded-text-scan] no baseline found in docs/v3/i18n-gaps/ — writing fresh scan",
      );
      writeFileSync(OUT_PATH, JSON.stringify(report, null, 2) + "\n");
      console.log(
        `[hardcoded-text-scan] wrote ${OUT_PATH} (GAP=${counts.GAP}, OK=${counts.OK}, EXEMPT=${counts.EXEMPT}, AMBIG=${counts.AMBIGUOUS})`,
      );
      return;
    }
    const baseline = JSON.parse(readFileSync(baselinePath, "utf8"));
    const baselineGapSet = collectGapSet(baseline);
    const currentGapSet = collectGapSet(report);
    const newGaps = [];
    for (const fingerprint of currentGapSet) {
      if (!baselineGapSet.has(fingerprint)) newGaps.push(fingerprint);
    }
    if (newGaps.length > 0) {
      console.error(
        `[hardcoded-text-scan] FAIL — ${newGaps.length} new hardcoded GAP(s) since ${relative(REPO_ROOT, baselinePath)}:`,
      );
      for (const g of newGaps.slice(0, 30)) console.error(`  ${g}`);
      if (newGaps.length > 30) {
        console.error(`  ...and ${newGaps.length - 30} more`);
      }
      console.error(
        `\nIf intentional, add to docs/v3/i18n-gaps/exempt.json under "strings" or "filePrefixes".`,
      );
      process.exit(1);
    }
    console.log(
      `[hardcoded-text-scan] OK — no new GAPs since ${relative(REPO_ROOT, baselinePath)} (GAP=${counts.GAP}, OK=${counts.OK}, EXEMPT=${counts.EXEMPT}, AMBIG=${counts.AMBIGUOUS})`,
    );
    return;
  }

  // ─── Default: write fresh report ─────────────────────────────────────────
  writeFileSync(OUT_PATH, JSON.stringify(report, null, 2) + "\n");
  console.log(
    `[hardcoded-text-scan] wrote ${OUT_PATH} — scanned ${scannedFiles} files in ${totals.durationMs}ms`,
  );
  console.log(
    `[hardcoded-text-scan] counts: GAP=${counts.GAP}  OK=${counts.OK}  EXEMPT=${counts.EXEMPT}  AMBIGUOUS=${counts.AMBIGUOUS}`,
  );
}

function findLatestBaseline() {
  const dir = join(REPO_ROOT, "docs", "v3", "i18n-gaps");
  if (!existsSync(dir)) return null;
  const entries = readdirSync(dir)
    .filter((n) => /^hardcoded-scan-\d{4}-\d{2}-\d{2}\.json$/.test(n))
    .sort()
    .map((n) => join(dir, n));
  return entries.length ? entries[entries.length - 1] : null;
}

function collectGapSet(report) {
  const set = new Set();
  for (const [file, hits] of Object.entries(report.entriesByFile || {})) {
    for (const h of hits) {
      if (h.classification === "GAP") {
        set.add(`${file}:${h.line}:${h.kind}:${h.text}`);
      }
    }
  }
  return set;
}

main();
