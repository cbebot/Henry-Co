#!/usr/bin/env node
// ---------------------------------------------------------------------------
// scripts/i18n-rtl-logical-utilities.mjs
//
// Mechanical RTL sweep: convert physical-direction Tailwind utility classes
// to their logical-property equivalents so the `ar` locale renders correctly
// when <html dir="rtl"> is set.
//
// Conversion table:
//   ml-* / -ml-*                     -> ms-* / -ms-*
//   mr-* / -mr-*                     -> me-* / -me-*
//   pl-*                             -> ps-*
//   pr-*                             -> pe-*
//   left-* / -left-*                 -> start-* / -start-*
//   right-* / -right-*               -> end-* / -end-*
//   border-l / border-l-*            -> border-s / border-s-*
//   border-r / border-r-*            -> border-e / border-e-*
//   rounded-l / rounded-l-*          -> rounded-s / rounded-s-*
//   rounded-r / rounded-r-*          -> rounded-e / rounded-e-*
//   rounded-tl / rounded-tl-*        -> rounded-ts / rounded-ts-*
//   rounded-tr / rounded-tr-*        -> rounded-te / rounded-te-*
//   rounded-bl / rounded-bl-*        -> rounded-bs / rounded-bs-*
//   rounded-br / rounded-br-*        -> rounded-be / rounded-be-*
//   text-left                        -> text-start
//   text-right                       -> text-end
//   float-left                       -> float-start
//   float-right                      -> float-end
//
// Replacement applies only inside class-string contexts:
//   - className="..."                (attribute string literal)
//   - className={`...`}              (attribute template literal)
//   - cn(`...`, "...", ...)          (cn/clsx/cva/twMerge call args)
//
// Files skipped:
//   - apps/super-app/**, apps/company-hub/**  (Expo)
//   - **/*-seed.ts, **/*-data.ts              (fixtures)
//   - **/node_modules/**, **/.next/**, **/dist/**, **/.codex-temp/**,
//     **/.claude/**
//
// Run from repo root:   node scripts/i18n-rtl-logical-utilities.mjs
// Dry-run:              node scripts/i18n-rtl-logical-utilities.mjs --dry
// Specific roots:       node scripts/i18n-rtl-logical-utilities.mjs apps/hub
// ---------------------------------------------------------------------------

import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative, sep, posix } from "node:path";

const DRY_RUN = process.argv.includes("--dry");
const ROOT_ARGS = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const ROOTS = ROOT_ARGS.length > 0 ? ROOT_ARGS : ["apps", "packages"];

const SKIP_DIR_NAMES = new Set([
  "node_modules",
  ".next",
  "dist",
  "build",
  ".codex-temp",
  ".claude",
  "out",
]);

const EXCLUDED_APP_PREFIXES = [
  "apps" + sep + "super-app" + sep,
  "apps" + sep + "company-hub" + sep,
  // Forward-slash variant for cross-platform safety
  "apps/super-app/",
  "apps/company-hub/",
];

const FIXTURE_SUFFIXES = ["-seed.ts", "-data.ts", "-seed.tsx", "-data.tsx"];

const EXT_WHITELIST = new Set([".ts", ".tsx"]);

// Token-level replacements. Each entry has a regex anchored to word
// boundaries and the rewritten token. The full classname rewriter walks
// each token in a class string and applies the first matching rule.
const TOKEN_RULES = [
  // Margins
  { from: /^(-)?ml-(.+)$/, to: (m) => `${m[1] ?? ""}ms-${m[2]}` },
  { from: /^(-)?mr-(.+)$/, to: (m) => `${m[1] ?? ""}me-${m[2]}` },

  // Padding
  { from: /^pl-(.+)$/, to: (m) => `ps-${m[1]}` },
  { from: /^pr-(.+)$/, to: (m) => `pe-${m[1]}` },

  // Positions
  { from: /^(-)?left-(.+)$/, to: (m) => `${m[1] ?? ""}start-${m[2]}` },
  { from: /^(-)?right-(.+)$/, to: (m) => `${m[1] ?? ""}end-${m[2]}` },

  // Border sides (must precede border-l-${color} catch-all — no such case here)
  { from: /^border-l$/, to: () => "border-s" },
  { from: /^border-l-(.+)$/, to: (m) => `border-s-${m[1]}` },
  { from: /^border-r$/, to: () => "border-e" },
  { from: /^border-r-(.+)$/, to: (m) => `border-e-${m[1]}` },

  // Rounded corners (multi-corner first)
  { from: /^rounded-tl$/, to: () => "rounded-ts" },
  { from: /^rounded-tl-(.+)$/, to: (m) => `rounded-ts-${m[1]}` },
  { from: /^rounded-tr$/, to: () => "rounded-te" },
  { from: /^rounded-tr-(.+)$/, to: (m) => `rounded-te-${m[1]}` },
  { from: /^rounded-bl$/, to: () => "rounded-bs" },
  { from: /^rounded-bl-(.+)$/, to: (m) => `rounded-bs-${m[1]}` },
  { from: /^rounded-br$/, to: () => "rounded-be" },
  { from: /^rounded-br-(.+)$/, to: (m) => `rounded-be-${m[1]}` },
  { from: /^rounded-l$/, to: () => "rounded-s" },
  { from: /^rounded-l-(.+)$/, to: (m) => `rounded-s-${m[1]}` },
  { from: /^rounded-r$/, to: () => "rounded-e" },
  { from: /^rounded-r-(.+)$/, to: (m) => `rounded-e-${m[1]}` },

  // Text/float alignment
  { from: /^text-left$/, to: () => "text-start" },
  { from: /^text-right$/, to: () => "text-end" },
  { from: /^float-left$/, to: () => "float-start" },
  { from: /^float-right$/, to: () => "float-end" },
];

/**
 * Rewrite a single Tailwind class token. Honours responsive/state prefixes
 * (sm:, md:, hover:, focus-visible:, group-hover:, dark:, etc.) by
 * splitting on the final ":" before applying the rule.
 *
 * Returns the original token if no rule matches.
 */
function rewriteToken(raw) {
  // Preserve negative-arbitrary tokens unchanged (very rare with `-`).
  const trimmed = raw.trim();
  if (!trimmed) return raw;

  // Skip arbitrary-property tokens like [&_p]:ml-4 — too risky to mangle
  // the bracketed selector. Detect by leading "[" before the colon.
  if (trimmed.startsWith("[")) return raw;

  // Split off Tailwind variant prefixes (sm:, md:, hover:, etc.).
  const parts = trimmed.split(":");
  const utility = parts[parts.length - 1];
  for (const rule of TOKEN_RULES) {
    const match = utility.match(rule.from);
    if (match) {
      parts[parts.length - 1] = rule.to(match);
      return parts.join(":");
    }
  }
  return raw;
}

/**
 * Rewrite a whitespace-separated class string. Preserves the exact
 * whitespace runs by replacing each non-whitespace token individually.
 */
function rewriteClassString(str) {
  // Split into [whitespace, token, whitespace, token, ...]
  const segments = str.split(/(\s+)/);
  let changed = false;
  for (let i = 0; i < segments.length; i++) {
    if (i % 2 === 0 && segments[i].length > 0) {
      const next = rewriteToken(segments[i]);
      if (next !== segments[i]) {
        changed = true;
        segments[i] = next;
      }
    }
  }
  return changed ? segments.join("") : str;
}

// Build a single regex that captures every class-string context we want to
// rewrite. Each match exposes the literal payload in named groups so we can
// pass it through `rewriteClassString` and reassemble.
const CLASS_CONTEXT_REGEX = new RegExp(
  [
    // className="..."
    String.raw`(className=")(?<dq>[^"]*)(")`,
    // className='...'
    String.raw`(className=')(?<sq>[^']*)(')`,
    // className={`...`}
    String.raw`(className=\{` + "`" + String.raw`)(?<tplCls>[^` + "`" + String.raw`]*)(` + "`" + String.raw`\})`,
    // class="..."  (just in case)
    String.raw`(class=")(?<cdq>[^"]*)(")`,
    // cn("..."), clsx("..."), cva("..."), twMerge("...")
    String.raw`(\b(?:cn|clsx|cva|twMerge|tv)\([^)]*?")(?<callDq>[^"]*?)(")`,
    // cn('...'), etc.
    String.raw`(\b(?:cn|clsx|cva|twMerge|tv)\([^)]*?')(?<callSq>[^']*?)(')`,
    // cn(`...`), etc. — single-line literal only
    String.raw`(\b(?:cn|clsx|cva|twMerge|tv)\([^)]*?` + "`" + String.raw`)(?<callTpl>[^` + "`" + String.raw`]*?)(` + "`" + String.raw`)`,
  ].join("|"),
  "g",
);

function rewriteFileContents(src) {
  let changed = false;
  const next = src.replace(CLASS_CONTEXT_REGEX, (...args) => {
    // Last positional arg is the groups object.
    const groups = args[args.length - 1] || {};
    const fullMatch = args[0];
    // Find which named group fired.
    const orderedGroupNames = [
      "dq",
      "sq",
      "tplCls",
      "cdq",
      "callDq",
      "callSq",
      "callTpl",
    ];
    let firedGroup = null;
    for (const name of orderedGroupNames) {
      if (groups[name] != null) {
        firedGroup = name;
        break;
      }
    }
    if (!firedGroup) return fullMatch;

    const payload = groups[firedGroup];
    const rewritten = rewriteClassString(payload);
    if (rewritten === payload) return fullMatch;
    changed = true;
    return fullMatch.replace(payload, rewritten);
  });
  return { changed, next };
}

function shouldSkipPath(absPath, repoRoot) {
  const rel = relative(repoRoot, absPath).split(sep).join("/");
  for (const prefix of ["apps/super-app/", "apps/company-hub/"]) {
    if (rel.startsWith(prefix)) return true;
  }
  for (const suffix of FIXTURE_SUFFIXES) {
    if (rel.endsWith(suffix)) return true;
  }
  return false;
}

function walk(repoRoot, dir, files) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (entry.name.startsWith(".") && entry.name !== ".") {
      // Skip dotfiles/dirs except the explicit roots.
      if (entry.isDirectory()) continue;
    }
    const abs = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (SKIP_DIR_NAMES.has(entry.name)) continue;
      walk(repoRoot, abs, files);
      continue;
    }
    if (!entry.isFile()) continue;
    const dot = entry.name.lastIndexOf(".");
    if (dot < 0) continue;
    const ext = entry.name.slice(dot);
    if (!EXT_WHITELIST.has(ext)) continue;
    if (shouldSkipPath(abs, repoRoot)) continue;
    files.push(abs);
  }
}

function main() {
  const repoRoot = process.cwd();
  const targets = [];
  for (const root of ROOTS) {
    const abs = join(repoRoot, root);
    try {
      statSync(abs);
    } catch {
      continue;
    }
    walk(repoRoot, abs, targets);
  }

  let touchedFiles = 0;
  let totalChanges = 0;
  for (const file of targets) {
    const src = readFileSync(file, "utf8");
    const { changed, next } = rewriteFileContents(src);
    if (!changed) continue;
    touchedFiles += 1;
    // Count token-level changes by diffing whitespace-separated tokens
    // across the file. Cheap approximation.
    const srcTokens = src.split(/[\s"'`{}]+/);
    const nextTokens = next.split(/[\s"'`{}]+/);
    let diff = 0;
    const maxLen = Math.max(srcTokens.length, nextTokens.length);
    for (let i = 0; i < maxLen; i++) {
      if (srcTokens[i] !== nextTokens[i]) diff += 1;
    }
    totalChanges += diff;
    if (DRY_RUN) {
      console.log("[dry] would rewrite", relative(repoRoot, file).split(sep).join("/"));
    } else {
      writeFileSync(file, next, "utf8");
    }
  }
  const verb = DRY_RUN ? "Would touch" : "Touched";
  console.log(`${verb} ${touchedFiles} file(s); approx ${totalChanges} token change(s).`);
}

main();
