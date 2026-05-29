#!/usr/bin/env node
/**
 * V3-11 S1 — One-job-per-card inventory.
 *
 * Walks `apps/**` + `packages/**` (excluding node_modules, dist, .next,
 * build artefacts, test/spec/fixture files, and the OWNER-RESERVED
 * `packages/search-ui/` quality-reference tree) for "card-like" surfaces
 * and classifies each against the owner's literal question:
 *
 *   "For every card, button, and summary module, ask: Does this open the
 *    exact next step, or does it just show more text?"
 *
 * What counts as a "card-like" surface (S1 scope):
 *   - Components whose file name matches *Card.tsx / *Tile.tsx /
 *     *Module.tsx / *Panel.tsx / *Summary.tsx.
 *   - JSX with `role="article"`.
 *   - JSX with a className token matching `card-*` or `tile-*`.
 *   - Exported `dashboard-modules-*` component symbols.
 *
 * Classification (per S2):
 *   A — Opens the exact next step (has a real href/onClick navigation or
 *       mutation). GOOD.
 *   B — Opens a generic listing/hub, not the exact next step. DEMOTE/add
 *       a precise next-step CTA.
 *   C — Information only, no action. Sub-split:
 *       C1 — critical info, should PAIR an implied action.
 *       C2 — nice-to-have info, lower visual priority.
 *       C3 — decorative; REMOVE.
 *   D — Looks actionable but does nothing. REMOVE or FIX.
 *
 * The script CANNOT infer "exact next step vs generic hub" or "critical vs
 * decorative" with certainty from static analysis. It therefore reports a
 * BEST-EFFORT signal class plus the evidence (does it link? where? is it a
 * primitive that always links?) and flags genuinely-ambiguous surfaces as
 * `needs-review` so a human (this pass's author) resolves them. The D-gate
 * (validation gate #4) keys off the machine-detectable D pattern only:
 * an interactive-looking card primitive with NO href/onClick AND NO
 * child interactive element.
 *
 * Output: `docs/v3/one-job-per-card-inventory.md`.
 *
 * This script is also the enforcement gate: run with `--check` to fail
 * (exit 1) if any machine-detectable D card is found outside the
 * allow-list. CI may wire this later; the pass runs it to prove "no D
 * cards remain".
 */

import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const APPS_DIR = path.join(ROOT, "apps");
const PACKAGES_DIR = path.join(ROOT, "packages");
const OUT_FILE = path.join(ROOT, "docs", "v3", "one-job-per-card-inventory.md");

const CHECK_MODE = process.argv.includes("--check");

const SKIP_DIRS = new Set([
  "node_modules",
  ".next",
  "dist",
  "build",
  ".turbo",
  ".vercel",
  ".git",
  "coverage",
  "__tests__",
  "__fixtures__",
]);

// Owner-reserved tree: quality reference only, NEVER modify or audit.
const OWNER_RESERVED_PREFIX = path.join(PACKAGES_DIR, "search-ui");

// Test/spec/fixture files — exempt (not shipped UI).
const TEST_PATH_RE = /(\.test\.|\.spec\.|__tests__|__fixtures__|\.stories\.)/i;

const FILE_EXT_RE = /\.(tsx|jsx)$/;

// File-name patterns that mark a module as a "card-like" component file.
const CARD_FILE_RE = /(Card|Tile|Module|Panel|Summary)\.(tsx|jsx)$/;

// dashboard-modules-* packages — every exported component is a module
// surface; the file already lives under such a package.
const DASHBOARD_MODULE_PKG_RE = /packages[\\/]dashboard-modules-/;

/**
 * Heuristics — does a chunk of source contain a real navigation or
 * mutation affordance? These are deliberately broad: a single hit means
 * "this surface is interactive" (candidate Class A/B), no hit + a
 * card-primitive usage means "candidate Class C/D".
 */
const NAV_CUES = [
  /\bhref\s*[=:]/, // href="..."  or  href: "..."
  /<Link\b/, // next/link
  /\brouter\.(push|replace)\b/, // programmatic nav
  /\brouter\.push\b/, // expo-router
  /\bredirect\(/, // next/navigation redirect
  /\bonClick\s*=/, // click handler (web)
  /\bonPress\s*=/, // Pressable / TouchableOpacity (React Native / Expo)
  /\bonActivate\s*=/, // queue-shell row activation
  /\btype\s*=\s*["']submit["']/, // form submit button
  /\baction\s*[=:]/, // server action / form action
  /\bonSubmit\s*=/, // form submit handler
  /<CopyButton\b/, // copy-to-clipboard mutation (studio portal)
  /<CopyValueButton\b/, // copy-to-clipboard mutation (account)
];

// Card primitives that are interactive ONLY when given an href/onClick.
// A usage of these with NO href/onClick nearby is a candidate D (looks
// like a card but may do nothing) UNLESS it wraps its own interactive
// child.
const INTERACTIVE_PRIMITIVES = [
  "HenryCoTactileCard",
  "PublicCard", // interactive only with href / interactive prop
];

/**
 * Cues that a "summary/panel/card" is purely informational (Class C
 * candidate): metric strips, KPI tiles, read-only stat displays.
 */
const INFO_CUES = [
  /\bMetricCard\b/,
  /\bMetricStrip\b/,
  /\bStatCard\b/,
  /\bKpi\b/i,
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

function rel(file) {
  return path.relative(ROOT, file).replace(/\\/g, "/");
}

function appOrPkg(relPath) {
  const parts = relPath.split("/");
  if (parts[0] === "apps") return `app:${parts[1]}`;
  if (parts[0] === "packages") return `pkg:${parts[1]}`;
  return "other";
}

/**
 * Find every "card-like" JSX occurrence inside a file's source, plus
 * file-level classification when the FILE itself is a card component.
 *
 * Returns an array of hit objects.
 */
function scanSource(file, raw) {
  const relPath = rel(file);
  const hits = [];
  const isCardFile = CARD_FILE_RE.test(relPath);
  const isDashboardModulePkg = DASHBOARD_MODULE_PKG_RE.test(file);

  // Whole-file signals.
  const hasNav = NAV_CUES.some((re) => re.test(raw));
  const usesInteractivePrimitive = INTERACTIVE_PRIMITIVES.some((p) =>
    new RegExp(`<${p}\\b`).test(raw),
  );
  const isInfoOnly = INFO_CUES.some((re) => re.test(raw)) && !hasNav;

  // role="article" / className card-* tile-* occurrences (line-level).
  const lines = raw.split(/\r?\n/);
  const jsxRoleHits = [];
  const classNameHits = [];
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (!line) continue;
    if (/role\s*=\s*["']article["']/.test(line)) {
      jsxRoleHits.push(i + 1);
    }
    if (/className\s*=\s*["'`][^"'`]*\b(card|tile)-[a-z0-9-]+/i.test(line)) {
      classNameHits.push(i + 1);
    }
  }

  // Detect a machine-detectable D candidate: an interactive primitive
  // usage with NO nearby href / onClick. We do a per-occurrence scan so a
  // file that has SOME interactive cards and SOME dead ones is reported
  // precisely.
  const dCandidates = [];
  for (const primitive of INTERACTIVE_PRIMITIVES) {
    const openRe = new RegExp(`<${primitive}\\b`, "g");
    let m;
    while ((m = openRe.exec(raw)) !== null) {
      // Look at the ~600 chars following the open tag (the props + a bit
      // of the first child) for an href / onClick / interactive.
      const window = raw.slice(m.index, m.index + 600);
      const hasOwnNav =
        /\bhref\s*[=]/.test(window) ||
        /\bonClick\s*=/.test(window) ||
        /\bonPress\s*=/.test(window) ||
        /\binteractive\b/.test(window) ||
        /\bas(Child)?\s*=/.test(window); // asChild defers interactivity to child
      if (!hasOwnNav) {
        const lineNo = raw.slice(0, m.index).split(/\r?\n/).length;
        dCandidates.push({ primitive, line: lineNo });
      }
    }
  }

  // Build the per-file record when the file is a card component OR has any
  // card-like JSX inside it.
  const hasCardJsx =
    jsxRoleHits.length > 0 || classNameHits.length > 0 || usesInteractivePrimitive;

  if (isCardFile || isDashboardModulePkg || hasCardJsx) {
    let signalClass;
    let rationale;
    if (dCandidates.length > 0 && !hasNav) {
      signalClass = "D";
      rationale =
        "Interactive card primitive used with no href/onClick and no detectable nav cue anywhere in file.";
    } else if (isInfoOnly) {
      signalClass = "C";
      rationale =
        "Reads as informational (MetricCard/StatCard/KPI) with no navigation cue. Needs human C1/C2/C3 split.";
    } else if (hasNav) {
      signalClass = "A";
      rationale =
        "Has a navigation or mutation affordance (href / Link / router / onClick / submit / action).";
    } else {
      signalClass = "needs-review";
      rationale =
        "Card-like file with no clear navigation cue and no clear info-only marker. Human classify.";
    }

    hits.push({
      file: relPath,
      scope: appOrPkg(relPath),
      isCardFile,
      isDashboardModulePkg,
      roleArticleLines: jsxRoleHits,
      classNameLines: classNameHits,
      usesInteractivePrimitive,
      hasNav,
      dCandidates,
      signalClass,
      rationale,
    });
  }

  return hits;
}

async function scanFile(file, hits) {
  let raw;
  try {
    raw = await fs.readFile(file, "utf8");
  } catch {
    return;
  }
  for (const h of scanSource(file, raw)) hits.push(h);
}

function classCounts(hits) {
  const acc = { A: 0, B: 0, C: 0, D: 0, "needs-review": 0 };
  for (const h of hits) acc[h.signalClass] = (acc[h.signalClass] || 0) + 1;
  return acc;
}

function groupByScope(hits) {
  const m = new Map();
  for (const h of hits) {
    if (!m.has(h.scope)) m.set(h.scope, []);
    m.get(h.scope).push(h);
  }
  return m;
}

function renderMd(hits) {
  const c = classCounts(hits);
  const out = [];
  out.push("# V3-11 — One-job-per-card inventory");
  out.push("");
  out.push("_Generated by `scripts/v3/card-inventory.mjs`._");
  out.push("");
  out.push(
    "Owner's question this answers: _\"For every card, button, and summary " +
      "module, ask: Does this open the exact next step, or does it just show " +
      'more text?"_',
  );
  out.push("");
  out.push(
    "Scope: every `apps/**` + `packages/**` `.tsx`/`.jsx` file that is a " +
      "`*Card`/`*Tile`/`*Module`/`*Panel`/`*Summary` component, lives under a " +
      "`dashboard-modules-*` package, or contains `role=\"article\"` / a " +
      "`card-*`/`tile-*` className / an interactive card primitive.",
  );
  out.push(
    "Excluded: `node_modules/`, `.next/`, `dist/`, `build/`, `.turbo/`, " +
      "`.vercel/`, test/spec/fixture files, `packages/search-ui/` (OWNER-RESERVED).",
  );
  out.push("");
  out.push(
    "**Static-analysis caveat:** the script reports a best-effort SIGNAL " +
      "class plus evidence. The A/B and C1/C2/C3 distinctions require human " +
      "judgement (is the link the *exact* next step? is the info critical or " +
      "decorative?). The machine-enforced gate (`--check`) only fails on " +
      "machine-detectable **D** cards (interactive primitive, no affordance).",
  );
  out.push("");
  out.push("## Counts (signal class)");
  out.push("");
  out.push(`- **A — opens a next step (has nav/mutation):** ${c.A}`);
  out.push(`- **B — generic hub, not exact next step (human-tagged):** ${c.B}`);
  out.push(`- **C — information only (needs C1/C2/C3 split):** ${c.C}`);
  out.push(`- **D — looks actionable, does nothing (machine-detected):** ${c.D}`);
  out.push(`- **needs-review (ambiguous):** ${c["needs-review"]}`);
  out.push(`- **Total card-like surfaces:** ${hits.length}`);
  out.push("");

  // D section first — these are the gate failures.
  out.push("## Class D — looks actionable but does nothing (FIX or REMOVE)");
  out.push("");
  const dHits = hits.filter((h) => h.signalClass === "D");
  if (dHits.length === 0) {
    out.push("_(none — gate green)_");
  } else {
    for (const h of dHits) {
      out.push(`### \`${h.file}\``);
      out.push(`- Signal: **D** — ${h.rationale}`);
      for (const d of h.dCandidates) {
        out.push(`- L${d.line}: \`<${d.primitive}>\` with no href/onClick`);
      }
      out.push("");
    }
  }
  out.push("");

  // Per-scope breakdown for everything else.
  out.push("## Inventory by app / package");
  out.push("");
  const byScope = groupByScope(hits);
  for (const [scope, list] of [...byScope.entries()].sort((a, b) =>
    a[0].localeCompare(b[0]),
  )) {
    const sc = classCounts(list);
    out.push(
      `### \`${scope}\` — ${list.length} surfaces ` +
        `(A:${sc.A} B:${sc.B} C:${sc.C} D:${sc.D} review:${sc["needs-review"]})`,
    );
    out.push("");
    for (const h of [...list].sort((a, b) => a.file.localeCompare(b.file))) {
      const tags = [];
      if (h.isCardFile) tags.push("card-file");
      if (h.isDashboardModulePkg) tags.push("dashboard-module");
      if (h.roleArticleLines.length) tags.push(`role=article×${h.roleArticleLines.length}`);
      if (h.classNameLines.length) tags.push(`card/tile-class×${h.classNameLines.length}`);
      if (h.usesInteractivePrimitive) tags.push("interactive-primitive");
      if (h.hasNav) tags.push("has-nav");
      out.push(
        `- **[${h.signalClass}]** \`${h.file}\`${tags.length ? ` — _${tags.join(", ")}_` : ""}`,
      );
    }
    out.push("");
  }

  return out.join("\n") + "\n";
}

async function main() {
  const files = [];
  await walk(APPS_DIR, files);
  await walk(PACKAGES_DIR, files);
  const hits = [];
  for (const f of files) {
    // Skip owner-reserved + test paths up front.
    if (f.startsWith(OWNER_RESERVED_PREFIX)) continue;
    if (TEST_PATH_RE.test(f)) continue;
    await scanFile(f, hits);
  }

  const c = classCounts(hits);

  if (CHECK_MODE) {
    const dHits = hits.filter((h) => h.signalClass === "D");
    if (dHits.length > 0) {
      // eslint-disable-next-line no-console
      console.error(
        `card-inventory --check FAILED: ${dHits.length} machine-detectable D card(s):`,
      );
      for (const h of dHits) {
        // eslint-disable-next-line no-console
        console.error(`  - ${h.file}: ${h.rationale}`);
      }
      process.exit(1);
    }
    // eslint-disable-next-line no-console
    console.log("card-inventory --check OK: no machine-detectable D cards.");
    return;
  }

  const md = renderMd(hits);
  await fs.mkdir(path.dirname(OUT_FILE), { recursive: true });
  await fs.writeFile(OUT_FILE, md, "utf8");
  // eslint-disable-next-line no-console
  console.log(
    `card-inventory: total=${hits.length}, A=${c.A}, B=${c.B}, C=${c.C}, ` +
      `D=${c.D}, needs-review=${c["needs-review"]}`,
  );
  // eslint-disable-next-line no-console
  console.log(`Wrote ${rel(OUT_FILE)}`);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
