#!/usr/bin/env node
// @ts-check
/**
 * SCHEMA-TRUTH-01 — classify every repo migration file against PROD-ACTUAL.
 *
 * Prod's migration HISTORY (supabase_migrations.schema_migrations, 75 rows) does
 * not map 1:1 to the 137 repo files: early files were applied via consolidated
 * dashboard runs under different names/versions, and some prod schema came from
 * out-of-band SQL with no history row at all. So membership in history is only
 * ONE signal; the decisive signal is OBJECT EVIDENCE — does prod actually hold
 * the tables/columns/functions/policies the file creates?
 *
 * Inputs (already captured read-only from prod):
 *   prod-migration-history.csv   version,name[,stmt_count]
 *   prod-columns.csv             table,column,…  (public schema inventory)
 *   ../../supabase/prod-actual/schema.sql  (functions/policies/triggers text)
 *
 * Output: classification.json + a human table on stdout.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..", "..");

const history = readFileSync(join(HERE, "prod-migration-history.csv"), "utf8")
  .split(/\r?\n/).slice(1).filter(Boolean)
  .map((l) => { const [version, name] = l.split(","); return { version, name }; });

const prodCols = new Map(); // table -> Set(cols)
for (const l of readFileSync(join(HERE, "prod-columns.csv"), "utf8").split(/\r?\n/).slice(1)) {
  if (!l) continue;
  const [t, c] = l.split(",");
  if (!prodCols.has(t)) prodCols.set(t, new Set());
  prodCols.get(t).add(c);
}

const snapshot = readFileSync(join(ROOT, "supabase", "prod-actual", "schema.sql"), "utf8");
const prodFunctions = new Set([...snapshot.matchAll(/CREATE OR REPLACE FUNCTION public\.([a-z_0-9]+)\(/gi)].map((m) => m[1].toLowerCase()));
const prodPolicies = new Set([...snapshot.matchAll(/^create policy (\S+) on ([a-z_.]+)/gim)].map((m) => `${m[2].replace(/^public\./, "")}.${m[1]}`));
const prodTriggers = new Set([...snapshot.matchAll(/CREATE TRIGGER (\S+)/g)].map((m) => m[1].toLowerCase()));

const files = execFileSync("git", ["ls-files"], { cwd: ROOT, encoding: "utf8" })
  .split(/\r?\n/).filter((f) => /supabase\/migrations\/.*\.sql$/.test(f));

const strip = (sql) => sql.replace(/--[^\n]*/g, "");

function classify(file) {
  const sql = strip(readFileSync(join(ROOT, file), "utf8"));
  const base = basename(file, ".sql");
  const version = base.match(/^(\d+)/)?.[1] ?? "";
  const slug = base.replace(/^\d+_/, "").toLowerCase();

  // history match: exact version, exact name, or slug containment either way
  const hist = history.find((h) =>
    h.version === version || h.name === slug ||
    h.name.toLowerCase().includes(slug) || slug.includes(h.name.toLowerCase()),
  );

  const evid = { present: [], absent: [] };
  for (const m of sql.matchAll(/create\s+table\s+(?:if\s+not\s+exists\s+)?(?:public\.)?"?([a-z_][a-z0-9_]*)"?/gi)) {
    (prodCols.has(m[1]) ? evid.present : evid.absent).push(`table:${m[1]}`);
  }
  for (const m of sql.matchAll(/alter\s+table\s+(?:only\s+)?(?:public\.)?"?([a-z_][a-z0-9_]*)"?\s+add\s+column\s+(?:if\s+not\s+exists\s+)?"?([a-z_][a-z0-9_]*)"?/gi)) {
    (prodCols.get(m[1])?.has(m[2]) ? evid.present : evid.absent).push(`col:${m[1]}.${m[2]}`);
  }
  for (const m of sql.matchAll(/create\s+(?:or\s+replace\s+)?function\s+(?:public\.)?"?([a-z_][a-z0-9_]*)"?\s*\(/gi)) {
    (prodFunctions.has(m[1].toLowerCase()) ? evid.present : evid.absent).push(`fn:${m[1]}`);
  }
  for (const m of sql.matchAll(/create\s+policy\s+"?([a-z_0-9]+)"?\s+on\s+(?:public\.)?"?([a-z_][a-z0-9_]*)"?/gi)) {
    (prodPolicies.has(`${m[2]}.${m[1]}`) ? evid.present : evid.absent).push(`policy:${m[2]}.${m[1]}`);
  }
  for (const m of sql.matchAll(/create\s+(?:constraint\s+)?trigger\s+"?([a-z_0-9]+)"?/gi)) {
    (prodTriggers.has(m[1].toLowerCase()) ? evid.present : evid.absent).push(`trg:${m[1]}`);
  }
  // payments_private objects can't exist in prod (schema absent) — count as absent automatically via fn: matcher (it only checks public.*)

  const p = evid.present.length, a = evid.absent.length;
  let verdict;
  if (p > 0 && a === 0) verdict = "applied-by-evidence";
  else if (p === 0 && a > 0) verdict = "absent-from-prod";
  else if (p > 0 && a > 0) verdict = "PARTIAL";
  else verdict = hist ? "applied-history-only" : "NO-EVIDENCE"; // e.g. pure grants/publication/drop files

  return { file, version, slug, history: hist ? `${hist.version}:${hist.name}` : null, verdict, present: p, absent: a, evid };
}

const rows = files.map(classify);
writeFileSync(join(HERE, "classification.json"), JSON.stringify(rows, null, 2));

const pad = (s, n) => String(s).padEnd(n);
for (const r of rows) {
  console.log(`${pad(r.verdict, 22)} hist=${pad(r.history ? "Y" : "-", 2)} +${pad(r.present, 3)} -${pad(r.absent, 3)} ${r.file}`);
}
console.log(`\ntotal=${rows.length}  ` +
  Object.entries(rows.reduce((m, r) => ((m[r.verdict] = (m[r.verdict] ?? 0) + 1), m), {}))
    .map(([k, v]) => `${k}=${v}`).join("  "));
