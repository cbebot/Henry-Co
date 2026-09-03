#!/usr/bin/env node
/**
 * TONE-01 — Company-voice tone gate.
 *
 * Henry Onyx speaks with calm authority. This gate fails CI when banned
 * hype/pressure phrasing enters any copy-bearing source file.
 *
 * SINGLE SOURCE OF TRUTH: the rule patterns are PARSED out of
 * `packages/newsletter/src/voice.ts` (DEFAULT_BANNED_PHRASES) — the one
 * canonical tone-rule store. Add or change rules THERE, never here; this
 * script is only the enforcement arm. (voice.ts documents this contract.)
 *
 * Scope: the typed copy modules, email templates, shared UI defaults, and
 * per-app source — i.e. everywhere user-facing English originates.
 * Excluded by design:
 *   - packages/search-ui            (owner-reserved, never modified)
 *   - packages/newsletter/src/voice.ts (it DEFINES the patterns)
 *   - tests, scripts, docs, build output
 *   - context-only rules that police newsletter STRUCTURE, not language
 *     (subject-line caps, unsubscribe footer), and the commerce exception
 *     below.
 *
 * Commerce exception: `no_buy_now_pressure` is excluded from the CODE gate.
 * "Buy now" as a newsletter subject is pressure; "Buy now" as the literal
 * action label on a product page is a functional control, not tone. The
 * newsletter guard still enforces it where it matters.
 *
 * Usage:  node scripts/v3/tone-gate.mjs            (gate — exit 1 on any hit)
 *         node scripts/v3/tone-gate.mjs --list     (show the active rules)
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

const ROOT = process.cwd();
const VOICE_TS = join(ROOT, "packages", "newsletter", "src", "voice.ts");

/** Rules that exist for newsletter structure/context, not platform language. */
const CODE_GATE_EXCLUDED_RULE_KEYS = new Set([
  "no_spammy_caps_in_subject", // subject-line heuristic; code is full of CAPS identifiers
  "required_unsubscribe_footer", // a required disclosure, not a banned phrase
  "no_buy_now_pressure", // commerce exception — see header
]);

/** Where user-facing copy originates. */
const INCLUDE_ROOTS = [
  "packages/i18n/src",
  "packages/email",
  "packages/ui/src",
  "packages/notifications-ui/src",
  "packages/dashboard-shell/src",
  "packages/workspace-shell/src",
  "packages/newsletter/src",
  "packages/branded-documents/src",
  "apps",
];

const EXCLUDE_SEGMENTS = new Set([
  "node_modules",
  ".next",
  "dist",
  "build",
  "coverage",
  "__tests__",
  ".codex-temp",
  "search-ui", // owner-reserved package
]);

const EXCLUDE_FILES = new Set([
  relative(ROOT, VOICE_TS), // defines the patterns
  join("packages", "newsletter", "src", "sanity.ts"), // fixture: feeds BAD copy to runVoiceGuard on purpose
  join("scripts", "v3", "tone-gate.mjs"), // this file
]);

const SOURCE_EXT = /\.(ts|tsx|js|jsx|mjs)$/;
const TEST_FILE = /\.(test|spec)\.[tj]sx?$/;

function parseVoiceRules() {
  const src = readFileSync(VOICE_TS, "utf8");
  const arrayStart = src.indexOf("DEFAULT_BANNED_PHRASES");
  if (arrayStart === -1) {
    console.error("[tone-gate] FATAL: DEFAULT_BANNED_PHRASES not found in voice.ts");
    process.exit(2);
  }
  const body = src.slice(arrayStart);
  const ruleRe =
    /ruleKey:\s*"([^"]+)"[\s\S]*?kind:\s*"([^"]+)"[\s\S]*?pattern:\s*("(?:[^"\\]|\\.)*")/g;
  const rules = [];
  let m;
  while ((m = ruleRe.exec(body)) !== null) {
    const [, ruleKey, kind, rawPattern] = m;
    if (CODE_GATE_EXCLUDED_RULE_KEYS.has(ruleKey)) continue;
    if (!["banned_phrase", "tone_rule", "truth_constraint"].includes(kind)) continue;
    let pattern;
    try {
      pattern = JSON.parse(rawPattern); // unescape the TS string literal
    } catch {
      console.error(`[tone-gate] FATAL: could not parse pattern for ${ruleKey}`);
      process.exit(2);
    }
    rules.push({ ruleKey, kind, regex: new RegExp(pattern, "gi") });
  }
  if (rules.length === 0) {
    console.error("[tone-gate] FATAL: parsed zero rules from voice.ts — parser drift?");
    process.exit(2);
  }
  return rules;
}

function* walk(dir) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }
  for (const name of entries) {
    if (EXCLUDE_SEGMENTS.has(name)) continue;
    const full = join(dir, name);
    let st;
    try {
      st = statSync(full);
    } catch {
      continue;
    }
    if (st.isDirectory()) yield* walk(full);
    else if (SOURCE_EXT.test(name) && !TEST_FILE.test(name)) yield full;
  }
}

const rules = parseVoiceRules();

if (process.argv.includes("--list")) {
  console.log(`[tone-gate] ${rules.length} active rules (from packages/newsletter/src/voice.ts):`);
  for (const r of rules) console.log(`  · ${r.ruleKey}  (${r.kind})  /${r.regex.source}/i`);
  process.exit(0);
}

const started = Date.now();
let scanned = 0;
const hits = [];

for (const root of INCLUDE_ROOTS) {
  for (const file of walk(join(ROOT, root))) {
    const rel = relative(ROOT, file);
    if (EXCLUDE_FILES.has(rel)) continue;
    const text = readFileSync(file, "utf8");
    scanned++;
    for (const rule of rules) {
      rule.regex.lastIndex = 0;
      let m;
      while ((m = rule.regex.exec(text)) !== null) {
        const line = text.slice(0, m.index).split("\n").length;
        hits.push({ rel, line, ruleKey: rule.ruleKey, match: m[0] });
      }
    }
  }
}

const ms = Date.now() - started;

if (hits.length === 0) {
  console.log(
    `[tone-gate] OK — ${scanned} files clean against ${rules.length} voice rules in ${ms}ms. The voice holds.`,
  );
  process.exit(0);
}

console.error(`[tone-gate] FAIL — ${hits.length} company-voice violation(s):\n`);
for (const h of hits) {
  console.error(`  ${h.rel.split(sep).join("/")}:${h.line}  [${h.ruleKey}]  "${h.match}"`);
}
console.error(
  [
    "",
    "Henry Onyx speaks with calm authority — it does not shout.",
    'Rewrite with plain, specific language ("Get started", "Manage your',
    'workspace", "Access additional capabilities").',
    "The rule store is packages/newsletter/src/voice.ts; the standard is",
    "docs/v3/public-voice-and-security.md (Part B) and CLAUDE.md.",
  ].join("\n"),
);
process.exit(1);
