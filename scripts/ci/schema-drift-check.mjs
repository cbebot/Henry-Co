#!/usr/bin/env node
// @ts-check
/**
 * CI schema-drift guard — DRIFT-SWEEP-02.
 *
 * WHY THIS EXISTS (load-bearing): this is the 4th production incident of the
 * same class — code shipped a Supabase query referencing a table COLUMN that
 * does not exist in the database, throwing a live 500 / corrupting a read.
 * Prior victims: `profiles.user_id`→`id`, `customer_profiles.kyc_completed_at`,
 * `henry_events.outcome`, `studio_settings.id`. TypeScript does NOT catch these
 * because the runtime queries are strings and most admin clients are loosely
 * typed (`SupabaseClient` without the `Database` generic, or `as never` casts).
 *
 * WHAT IT DOES: statically scans the codebase for Supabase column references
 *   - `.from("table").select("a, b, c")`
 *   - `.from("table")...eq/neq/gt/gte/lt/lte/like/ilike/is/in/contains/order("col" ...)`
 * and asserts every referenced column exists in the CANONICAL committed schema,
 * which is the UNION of two sources kept in the repo:
 *   1. packages/data/src/database.types.ts  (generated Supabase types; 249 tables)
 *   2. every supabase/migrations SQL file under apps, packages, and root (DDL)
 * The union is required because NEITHER source alone is complete — the types
 * file lags behind some migration-added tables (e.g. henry_events), and some
 * tables/columns live only in types. A reference that is in NEITHER, on a table
 * that IS known to at least one source, is a drift violation → exit 1.
 *
 * DESIGN BIAS: precision over recall. Unknown tables (e.g. `.from(variable)`,
 * or tables absent from both sources) are SKIPPED, never flagged — a guard that
 * false-reds and blocks every merge is worse than one that misses an edge case.
 * Residual false positives go in ALLOWLIST below with a documented reason.
 *
 * Run:  node scripts/ci/schema-drift-check.mjs [--verbose]
 *       pnpm run schema-drift:check
 */

import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, relative, sep } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const VERBOSE = process.argv.includes("--verbose");

/**
 * Columns the scanner cannot see in either committed source but which are known
 * to be valid (e.g. created out-of-band, or a known scanner blind spot). Format:
 * "table.column": "reason". Keep this list SHORT and justified — every entry is
 * a small hole in the guard.
 */
const ALLOWLIST = new Map([
  // (empty — all current references resolve against types ∪ migrations)
]);

/** Dirs never scanned (build output, deps, other git worktrees, generated). */
const SKIP_DIRS = new Set([
  "node_modules", ".next", ".turbo", "dist", "build", "out", ".git",
  ".claude", ".codex", ".codex-temp", ".worktree", ".worktrees",
  ".worktree-conductor-closure", "coverage", "playwright-report",
  "test-results", ".vercel", ".expo",
]);

/** Postgres column types we recognise when parsing CREATE TABLE bodies. */
const PG_TYPE = new RegExp(
  "^(uuid|text|citext|varchar|char|character(\\s+varying)?|" +
    "smallint|int|int2|int4|int8|integer|bigint|serial|bigserial|smallserial|" +
    "numeric|decimal|real|double(\\s+precision)?|float|money|" +
    "bool|boolean|json|jsonb|date|time|timestamp|timestamptz|" +
    "timestamp(\\s+with(out)?\\s+time\\s+zone)?|interval|bytea|inet|cidr|" +
    "macaddr|uuid\\[\\]|text\\[\\]|jsonb\\[\\]|[a-z_]+\\[\\]|tsvector|vector)",
  "i",
);

// ---------------------------------------------------------------------------
// 1. Build the canonical schema: Map<table, Set<column>>
// ---------------------------------------------------------------------------

/** @type {Map<string, Set<string>>} */
const schema = new Map();
/** @param {string} table @param {string} col */
function addCol(table, col) {
  if (!schema.has(table)) schema.set(table, new Set());
  schema.get(table).add(col);
}
/** @param {string} table @param {string} col */
function dropCol(table, col) {
  schema.get(table)?.delete(col);
}

// --- 1a. From database.types.ts (the generated types — most complete) -------
function loadTypes() {
  const file = join(ROOT, "packages", "data", "src", "database.types.ts");
  const lines = readFileSync(file, "utf8").split(/\r?\n/);
  let table = null;
  let inRow = false;
  for (const line of lines) {
    // Table header at the `Tables: { <name>: {` level — 6-space indent.
    const t = line.match(/^ {6}([a-z_][a-z0-9_]*): \{$/);
    if (t) { table = t[1]; inRow = false; continue; }
    if (!table) continue;
    if (/^ {8}Row: \{$/.test(line)) { inRow = true; continue; }
    if (inRow) {
      if (/^ {8}\}$/.test(line)) { inRow = false; continue; }
      const c = line.match(/^ {10}([a-z_][a-z0-9_]*)\??: /);
      if (c) addCol(table, c[1]);
    }
  }
}

// --- 1b. From all migration .sql files, applied in version (filename) order -
/** @returns {string[]} absolute paths sorted by leading version number */
function findMigrations() {
  /** @type {string[]} */
  const out = [];
  /** @param {string} dir */
  function walk(dir) {
    let entries;
    try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      if (e.isDirectory()) {
        if (SKIP_DIRS.has(e.name)) continue;
        walk(join(dir, e.name));
      } else if (
        e.isFile() &&
        e.name.endsWith(".sql") &&
        dir.split(sep).includes("migrations") &&
        dir.split(sep).includes("supabase")
      ) {
        out.push(join(dir, e.name));
      }
    }
  }
  walk(ROOT);
  // Sort by the leading timestamp in the basename so cross-app migrations
  // apply in the same global order Supabase applied them in prod.
  const ver = (p) => (p.split(sep).pop().match(/^(\d+)/)?.[1] ?? "0");
  return out.sort((a, b) => ver(a).localeCompare(ver(b)) || a.localeCompare(b));
}

/** Extract column names from a CREATE TABLE column-list body. @param {string} body */
function parseCreateBody(body, table) {
  // Split top-level commas (depth 0 only — ignore commas inside type/() args).
  let depth = 0, buf = "";
  const defs = [];
  for (const ch of body) {
    if (ch === "(") depth++;
    else if (ch === ")") depth--;
    if (ch === "," && depth === 0) { defs.push(buf); buf = ""; }
    else buf += ch;
  }
  if (buf.trim()) defs.push(buf);
  for (let def of defs) {
    def = def.trim();
    if (!def) continue;
    // Skip table-level constraints.
    if (/^(constraint|primary\s+key|foreign\s+key|unique|check|exclude|like)\b/i.test(def)) continue;
    const m = def.match(/^"?([a-z_][a-z0-9_]*)"?\s+(.+)$/i);
    if (m && PG_TYPE.test(m[2].trim())) addCol(table, m[1]);
  }
}

function loadMigrations() {
  for (const path of findMigrations()) {
    let sql;
    try { sql = readFileSync(path, "utf8"); } catch { continue; }
    // Strip line comments to avoid matching DDL inside `-- ...`.
    const clean = sql.replace(/--[^\n]*/g, "");

    // CREATE TABLE [IF NOT EXISTS] [public.]name ( ...body... )
    const createRe = /create\s+table\s+(?:if\s+not\s+exists\s+)?(?:public\.)?"?([a-z_][a-z0-9_]*)"?\s*\(/gi;
    let cm;
    while ((cm = createRe.exec(clean))) {
      const table = cm[1];
      // Capture balanced parens for the column list.
      let i = createRe.lastIndex - 1, depth = 0, start = i;
      for (; i < clean.length; i++) {
        if (clean[i] === "(") depth++;
        else if (clean[i] === ")") { depth--; if (depth === 0) break; }
      }
      parseCreateBody(clean.slice(start + 1, i), table);
    }

    // ALTER TABLE [ONLY] [public.]name ADD COLUMN [IF NOT EXISTS] col
    for (const m of clean.matchAll(
      /alter\s+table\s+(?:only\s+)?(?:public\.)?"?([a-z_][a-z0-9_]*)"?\s+add\s+column\s+(?:if\s+not\s+exists\s+)?"?([a-z_][a-z0-9_]*)"?/gi,
    )) addCol(m[1], m[2]);

    // ALTER TABLE name RENAME COLUMN a TO b
    for (const m of clean.matchAll(
      /alter\s+table\s+(?:only\s+)?(?:public\.)?"?([a-z_][a-z0-9_]*)"?\s+rename\s+column\s+"?([a-z_][a-z0-9_]*)"?\s+to\s+"?([a-z_][a-z0-9_]*)"?/gi,
    )) { dropCol(m[1], m[2]); addCol(m[1], m[3]); }

    // ALTER TABLE name DROP COLUMN [IF EXISTS] col
    for (const m of clean.matchAll(
      /alter\s+table\s+(?:only\s+)?(?:public\.)?"?([a-z_][a-z0-9_]*)"?\s+drop\s+column\s+(?:if\s+exists\s+)?"?([a-z_][a-z0-9_]*)"?/gi,
    )) dropCol(m[1], m[2]);
  }
}

// ---------------------------------------------------------------------------
// 2. Scan the codebase for static Supabase column references
// ---------------------------------------------------------------------------

const FILTER_METHODS =
  "eq|neq|gt|gte|lt|lte|like|ilike|is|in|contains|containedBy|overlaps|order|filter";
const FROM_RE = /\.from\(\s*(["'`])([a-z_][a-z0-9_]*)\1\s*\)/;
const SELECT_RE = /\.select\(\s*(["'`])([^"'`]*)\1/g;
const FILTER_RE = new RegExp(`\\.(?:${FILTER_METHODS})\\(\\s*(["'\`])([^"'\`]+)\\1`, "g");

/** A token is a checkable bare column iff it is a lone snake_case identifier. */
const BARE_COL = /^[a-z_][a-z0-9_]*$/;

const WINDOW = 25; // lines a .from() chain is assumed to span

/**
 * Replace comment content with spaces (preserving line breaks → line numbers
 * stay accurate) so a comment that mentions `.from("x")` / `.select("col")`
 * cannot set table context or be scanned as a real reference. String-aware:
 * line and block comment markers inside string/template literals are left intact.
 * @param {string} src
 */
function stripComments(src) {
  let out = "";
  let i = 0;
  const blank = (s) => s.replace(/[^\n]/g, " ");
  while (i < src.length) {
    const c = src[i];
    const c2 = src[i + 1];
    if (c === '"' || c === "'" || c === "`") {
      // Consume a string/template literal verbatim (with escapes).
      const q = c;
      out += c; i++;
      while (i < src.length) {
        out += src[i];
        if (src[i] === "\\") { out += src[i + 1] ?? ""; i += 2; continue; }
        if (src[i] === q) { i++; break; }
        i++;
      }
      continue;
    }
    if (c === "/" && c2 === "/") {
      let j = i; while (j < src.length && src[j] !== "\n") j++;
      out += blank(src.slice(i, j)); i = j; continue;
    }
    if (c === "/" && c2 === "*") {
      let j = i + 2; while (j < src.length && !(src[j] === "*" && src[j + 1] === "/")) j++;
      j = Math.min(j + 2, src.length);
      out += blank(src.slice(i, j)); i = j; continue;
    }
    out += c; i++;
  }
  return out;
}

/** @type {{file:string,line:number,table:string,column:string}[]} */
const violations = [];

/**
 * Attribute a column ref to the table opened by the nearest preceding
 * `.from("literal")` in the SAME builder chain. The chain is bounded by
 * statement boundaries (blank line or `;`) so an unrelated `.order("x")` in a
 * later statement is NOT mis-attributed (window-bleed false positive). `WINDOW`
 * is only a backstop. `.from(variable)` resets — a dynamic table can't resolve.
 * @param {string} file
 */
function scanFile(file) {
  const raw = readFileSync(file, "utf8");
  if (!raw.includes(".from(")) return;
  const text = stripComments(raw); // comments can't set table context or be scanned
  const lines = text.split(/\r?\n/);
  const rel = relative(ROOT, file);
  let table = null;
  let fromLine = -1;

  /** @param {string} col @param {number} n */
  const check = (col, n) => {
    if (!table) return;
    if (!BARE_COL.test(col)) return; // skip *, json paths, embeds, aliases
    if (!schema.has(table)) return; // unknown table → skip (precision bias)
    if (schema.get(table).has(col)) return;
    if (ALLOWLIST.has(`${table}.${col}`)) return;
    violations.push({ file: rel, line: n + 1, table, column: col });
  };

  for (let n = 0; n < lines.length; n++) {
    const line = lines[n];

    // A blank line ends any open builder chain (statements are separated by it).
    if (table && line.trim() === "") { table = null; continue; }

    if (line.includes(".from(")) {
      const m = line.match(FROM_RE);
      table = m ? m[2] : null; // quoted literal → track; dynamic → reset
      fromLine = m ? n : -1;
    } else if (table && n - fromLine > WINDOW) {
      table = null; // backstop: chain can't reasonably span more than WINDOW lines
    }

    if (table) {
      for (const m of line.matchAll(SELECT_RE)) {
        for (const tok of m[2].split(",")) check(tok.trim(), n);
      }
      for (const m of line.matchAll(FILTER_RE)) check(m[2].trim(), n);
    }

    // A statement terminator on this line closes the chain (refs already counted).
    if (table && line.includes(";")) table = null;
  }
}

function scanCodebase() {
  /** @param {string} dir */
  function walk(dir) {
    let entries;
    try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      const p = join(dir, e.name);
      if (e.isDirectory()) {
        if (SKIP_DIRS.has(e.name)) continue;
        walk(p);
      } else if (/\.(ts|tsx)$/.test(e.name)) {
        // Skip type defs, declaration files, tests, and the migrations.
        if (e.name.endsWith(".d.ts")) continue;
        if (/database\.types\.ts$/.test(e.name)) continue;
        if (/\.(test|spec)\.(ts|tsx)$/.test(e.name)) continue;
        if (p.split(sep).includes("tests")) continue;
        scanFile(p);
      }
    }
  }
  walk(join(ROOT, "apps"));
  walk(join(ROOT, "packages"));
}

// ---------------------------------------------------------------------------
// 3. Baseline — fail only on NEW drift (repo convention: dead-link / i18n).
// ---------------------------------------------------------------------------
//
// The committed schema sources (database.types.ts + migration DDL) are
// themselves partially stale vs the live prod schema (DRIFT-SWEEP-02 finding:
// e.g. prod has customer_notifications.email_dispatched_at and
// marketplace_product_variants.sort_order that neither source carries). So a
// fresh scan reports a backlog of pre-existing mismatches. We record that
// backlog in a baseline and gate ONLY on NEW references — this ends the drift
// class for all new code immediately while the backlog is burned down
// separately (see .codex-temp/drift-sweep-02/report.md). The durable systemic
// fix is to regenerate database.types.ts from prod so the baseline can shrink.
//
// Baseline key is `file::table.column` (NOT line) so it survives line shifts.

const BASELINE_PATH = join(ROOT, "scripts", "ci", "schema-drift-baseline.json");
const WRITE_BASELINE = process.argv.includes("--write-baseline");

/** @param {{file:string,table:string,column:string}} v */
const keyOf = (v) => `${v.file.split(sep).join("/")}::${v.table}.${v.column}`;

function loadBaseline() {
  try {
    const parsed = JSON.parse(readFileSync(BASELINE_PATH, "utf8"));
    return new Set(parsed.entries ?? []);
  } catch {
    return new Set();
  }
}

// ---------------------------------------------------------------------------
// 4. Run
// ---------------------------------------------------------------------------

loadTypes();
loadMigrations();
scanCodebase();

const tableCount = schema.size;
const colCount = [...schema.values()].reduce((a, s) => a + s.size, 0);
console.log(
  `schema-drift: canonical schema = ${tableCount} tables / ${colCount} columns ` +
    `(database.types.ts ∪ migration DDL)`,
);

if (VERBOSE) {
  for (const t of ["henry_events", "customer_profiles", "studio_settings"]) {
    console.log(`  ${t}: ${schema.has(t) ? [...schema.get(t)].sort().join(", ") : "(unknown)"}`);
  }
}

const currentKeys = [...new Set(violations.map(keyOf))].sort();

if (WRITE_BASELINE) {
  const body = {
    _README:
      "Pre-existing schema-drift backlog (DRIFT-SWEEP-02). Each entry is a " +
      "code reference to a column absent from the committed schema sources " +
      "(packages/data/src/database.types.ts + migration DDL). CI fails only on " +
      "NEW entries. To shrink: fix the query OR add the migration+regenerate " +
      "database.types.ts, then re-run with --write-baseline. Do NOT add new " +
      "entries by hand to silence a failure — fix the drift.",
    generatedBy: "node scripts/ci/schema-drift-check.mjs --write-baseline",
    count: currentKeys.length,
    entries: currentKeys,
  };
  // Deterministic write (no Date.now) so re-runs produce identical files.
  const out = JSON.stringify(body, null, 2) + "\n";
  writeFileSync(BASELINE_PATH, out);
  console.log(`schema-drift: wrote baseline with ${currentKeys.length} entr(ies) → ${relative(ROOT, BASELINE_PATH)}`);
  process.exit(0);
}

const baseline = loadBaseline();
const newViolations = violations.filter((v) => !baseline.has(keyOf(v)));
const resolved = [...baseline].filter((k) => !currentKeys.includes(k));

if (resolved.length) {
  console.log(
    `schema-drift: ${resolved.length} baselined entr(ies) no longer present — ` +
      `run \`pnpm run schema-drift:baseline\` to prune them.`,
  );
}

if (newViolations.length === 0) {
  console.log(
    `schema-drift: OK — no NEW column drift (${baseline.size} known in baseline).`,
  );
  process.exit(0);
}

console.error(`\nschema-drift: ${newViolations.length} NEW drift violation(s):\n`);
for (const v of newViolations) {
  const known = [...(schema.get(v.table) ?? [])].sort();
  console.error(`  ✗ ${v.file}:${v.line}`);
  console.error(`    ${v.table}.${v.column} — no such column on "${v.table}".`);
  const near = known.filter(
    (c) => c.includes(v.column) || v.column.includes(c) || c.slice(0, 4) === v.column.slice(0, 4),
  );
  if (near.length) console.error(`    did you mean: ${near.join(", ")}?`);
}
console.error(
  `\nA query references a column that does not exist in the committed schema.\n` +
    `Fix the query to use a real column, OR add the column in a migration AND\n` +
    `regenerate packages/data/src/database.types.ts. If it is a genuine false\n` +
    `positive (dynamic/external table), add "table.column" to ALLOWLIST in\n` +
    `scripts/ci/schema-drift-check.mjs. Do NOT silence it by editing the baseline.\n`,
);
process.exit(1);
