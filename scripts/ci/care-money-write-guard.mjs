#!/usr/bin/env node
// @ts-check
/**
 * CI guard — SEC-HARDEN-05: no raw Care money writes from app code.
 *
 * WHY THIS EXISTS (load-bearing): care's manual payment completion was a
 * free-mark-paid hole — app code (service-role) raw-INSERTed `care_payments` with
 * an arbitrary amount and raw-flipped `care_payment_requests.status='paid'`, with no
 * guard, no validation, no balanced ledger. SEC-HARDEN-05 routes ALL care payment
 * recording through the guarded `care_record_manual_payment` RPC (validated,
 * idempotent, balanced double-entry) and locks the raw paths at the DB (revoked
 * write grants on care_payments + a status='paid' guard trigger). This static guard
 * is the fast-feedback half: it fails the build the moment a raw care money write is
 * reintroduced in TypeScript, before it can ever reach the DB.
 *
 * WHAT IT FORBIDS (precise — does NOT touch the legitimate, out-of-scope care
 * expense ledger flow):
 *   1. ANY write to `care_payments`: `.from("care_payments").insert/update/upsert/delete`.
 *      Every payment fact must go through care_record_manual_payment.
 *   2. Setting `care_payment_requests.status` to 'paid' in app code: a
 *      `.from("care_payment_requests").update(...)` chain containing a
 *      `status: "paid"` literal. The 'paid' transition belongs to the guarded RPC
 *      (the DB trigger rejects it anyway). Non-paid status writes (delivery state:
 *      sent/queued/failed) are allowed.
 *
 * The DB-level invariant (apps/hub/supabase/tests/care_payment_guard_invariant.sql)
 * is the hard guarantee; this is the developer-facing tripwire.
 *
 * Run:  node scripts/ci/care-money-write-guard.mjs
 *       pnpm run care-money:check
 */

import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, relative, sep } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

/** Dirs never scanned (build output, deps, other git worktrees, generated). */
const SKIP_DIRS = new Set([
  "node_modules", ".next", ".turbo", "dist", "build", "out", ".git",
  ".claude", ".codex", ".codex-temp", ".worktree", ".worktrees",
  ".worktree-conductor-closure", "coverage", "playwright-report",
  "test-results", ".vercel", ".expo",
]);

/**
 * Documented exceptions: "relative/path.ts": "reason". Keep SHORT and justified.
 * (empty — the guarded RPC is the only sanctioned writer.)
 */
const ALLOWLIST = new Map([]);

const WINDOW = 30; // a .from() builder chain is assumed to span at most this many lines

/**
 * Replace comment content with spaces (preserving newlines so line numbers stay
 * accurate), string-aware, so a comment mentioning `.from("care_payments")` cannot
 * trip the guard. Mirrors scripts/ci/schema-drift-check.mjs.
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

const FROM_RE = /\.from\(\s*(["'`])([a-z_][a-z0-9_]*)\1\s*\)/;
const WRITE_RE = /\.(insert|update|upsert|delete)\(/;
const PAID_RE = /status\s*:\s*(["'`])paid\1/;

/** @type {{file:string,line:number,table:string,kind:string}[]} */
const violations = [];

/** @param {string} file */
function scanFile(file) {
  const raw = readFileSync(file, "utf8");
  if (!raw.includes(".from(")) return;
  const rel = relative(ROOT, file).split(sep).join("/");
  if (ALLOWLIST.has(rel)) return;
  const lines = stripComments(raw).split(/\r?\n/);

  let table = null;       // table opened by the nearest preceding .from("literal")
  let fromLine = -1;
  let chainText = "";     // accumulated text of the current chain
  let chainStart = -1;

  const flushChain = () => {
    if (table === "care_payments" && WRITE_RE.test(chainText)) {
      violations.push({ file: rel, line: chainStart + 1, table, kind: "care_payments write" });
    }
    if (table === "care_payment_requests" && /\.update\(/.test(chainText) && PAID_RE.test(chainText)) {
      violations.push({ file: rel, line: chainStart + 1, table, kind: "care_payment_requests status='paid' write" });
    }
    table = null; chainText = ""; chainStart = -1;
  };

  for (let n = 0; n < lines.length; n++) {
    const line = lines[n];
    if (table && line.trim() === "") { flushChain(); continue; }      // blank line ends a chain

    if (line.includes(".from(")) {
      if (table) flushChain();
      const m = line.match(FROM_RE);
      table = m ? m[2] : null;
      fromLine = n;
      chainStart = n;
      chainText = line;
    } else if (table) {
      if (n - fromLine > WINDOW) { flushChain(); }                    // backstop
      else chainText += "\n" + line;
    }

    if (table && line.includes(";")) flushChain();                    // statement terminator ends the chain
  }
  if (table) flushChain();
}

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
      if (e.name.endsWith(".d.ts")) continue;
      if (/\.(test|spec)\.(ts|tsx)$/.test(e.name)) continue;
      scanFile(p);
    }
  }
}

walk(join(ROOT, "apps"));
walk(join(ROOT, "packages"));

if (violations.length === 0) {
  console.log("care-money-write-guard: OK — no raw care_payments / care_payment_requests='paid' writes in app code.");
  process.exit(0);
}

console.error(`\ncare-money-write-guard: ${violations.length} forbidden raw care money write(s):\n`);
for (const v of violations) {
  console.error(`  ✗ ${v.file}:${v.line} — ${v.kind}`);
}
console.error(
  `\nCare payment recording MUST go through the guarded RPC care_record_manual_payment\n` +
    `(SEC-HARDEN-05): it validates the amount, is idempotent, posts the balanced\n` +
    `double-entry ledger, and flips the request to 'paid' atomically. Do not raw-write\n` +
    `care_payments or set care_payment_requests.status='paid' from app code — the DB\n` +
    `revokes those writes and the status guard trigger rejects them.\n`,
);
process.exit(1);
