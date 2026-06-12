#!/usr/bin/env node
// @ts-check
/**
 * SCHEMA-TRUTH-01 — build + verify the SHADOW DB and generate the composite
 * database.types.ts from it.
 *
 * The shadow = PROD-ACTUAL (supabase/prod-actual/schema.sql, captured read-only
 * by scripts/db/introspect-prod-schema.mjs) + the FL2 committed-not-applied
 * migration set, applied in order, on a vanilla PostgreSQL 17 carrying the
 * Supabase platform stub (scripts/db/shadow-bootstrap.sql).
 *
 * FIDELITY GATE (the whole point): before the FL2 layer goes on, the shadow
 * must be provably identical to prod where it matters —
 *   1. `supabase gen types --db-url <shadow>` must MATCH the types generated
 *      straight from prod (`--project-id`),
 *   2. the information_schema.columns inventory must match prod's capture,
 *   3. the effective ACLs (has_table_privilege / has_function_privilege for
 *      anon/authenticated/service_role) must match prod's capture.
 * Only a shadow that passes all three is allowed to host the FL2 dress
 * rehearsal (apply in order, then re-apply to prove idempotency, then run the
 * repo's money invariant suites).
 *
 * Subcommands (run in this order; `all` chains them):
 *   reset | bootstrap | apply-prod | gate | apply-fl2 | gen-types
 *
 * Flags: --db-url <url>          (default postgresql://postgres:postgres@127.0.0.1:55432/shadow)
 *        --admin-db-url <url>    (default ...same host.../postgres — used by `reset`)
 *        --psql <path>           (default C:\pg17\bin\psql.exe, else PATH)
 *        --prod-types <file>     (gate: prod-generated types to diff against)
 *        --prod-columns <file>   (gate: prod columns CSV to diff against)
 *        --prod-acl <file>       (gate: prod ACL CSV to diff against; optional)
 *        --out <file>            (gen-types: where the composite types land)
 */

import { spawn, spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync, existsSync, mkdtempSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const SNAPSHOT = join(ROOT, "supabase", "prod-actual", "schema.sql");
const BOOTSTRAP = join(ROOT, "scripts", "db", "shadow-bootstrap.sql");

/**
 * The FL2 committed-not-applied set, in apply order, each with the invariant
 * suites CI runs at that exact position (the payments grant invariant asserts
 * on the PUBLIC money RPCs and must run BEFORE the isolation migration moves
 * them into payments_private — suite position is part of the contract).
 * See docs/v3/fl2-apply-manifest.md and .github/workflows/ci.yml.
 */
const FL2_SET = [
  {
    file: "apps/hub/supabase/migrations/20260529120000_payment_intents.sql",
    suites: ["apps/hub/supabase/tests/payments_grant_invariant.sql"],
  },
  {
    file: "apps/hub/supabase/migrations/20260605123000_payments_private_isolation.sql",
    suites: [],
  },
  {
    file: "apps/hub/supabase/migrations/20260607120000_double_entry_ledger.sql",
    suites: [
      "apps/hub/supabase/tests/ledger_invariants.sql",
      "apps/hub/supabase/tests/ledger_grant_invariant.sql",
    ],
  },
  {
    file: "apps/hub/supabase/migrations/20260607130000_v3_18_payment_documents.sql",
    suites: ["apps/hub/supabase/tests/payment_documents_invariants.sql"],
  },
  {
    file: "apps/hub/supabase/migrations/20260607140000_v3_vat_01_settlement_vat.sql",
    suites: [
      "apps/hub/supabase/tests/vat_invariants.sql",
      "apps/hub/supabase/tests/vat_grant_invariant.sql",
    ],
  },
  {
    // Wallet-rail dependency closure for the MERGED Job B surfaces (funding /
    // payout / withdrawal / idempotency / webhook-receipt tables that the
    // partially-applied April files never landed on prod).
    file: "apps/hub/supabase/migrations/20260611120000_fl2_wallet_rail_completion.sql",
    suites: [],
  },
  {
    // File 7 — V3-19 refunds & credit notes (PR #267). FOLDED INTO THE SHADOW
    // REHEARSAL by FL2-REHEARSE-01 (2026-06-12): it post-dated the SCHEMA-TRUTH-01
    // six-file rehearsal. Provider-confirmed refunds with proportional VAT
    // reversal + unfakeable credit-note binding; depends on the ledger (file 3),
    // payment documents (file 4), VAT split (file 5) and the wallet tables
    // (file 6), all of which precede it here.
    file: "apps/hub/supabase/migrations/20260611130000_v3_19_refunds.sql",
    suites: [
      "apps/hub/supabase/tests/refunds_invariants.sql",
      "apps/hub/supabase/tests/refunds_grant_invariant.sql",
    ],
  },
  {
    // File 8 — SEC-HARDEN-01 audit-grant + bucket lockdown (PR #269). FOLDED IN
    // by FL2-REHEARSE-01 (2026-06-12). Pure ACL + one storage-policy drop. On the
    // PROD-SHAPE shadow the two SECURITY DEFINER audit writers (add_audit_log,
    // add_audit_log_v2), is_staff_in_any, and the company-assets storage policy
    // already exist (captured in prod-actual), so the REVOKE/GRANT/DROP act on
    // real objects — no audit_fns_min CI stub is needed on this layer (that stub
    // only exists for the bare-PG CI chain, which lacks the out-of-band prod
    // objects).
    file: "apps/hub/supabase/migrations/20260612120000_sec_harden_01_audit_grants_and_bucket.sql",
    suites: ["apps/hub/supabase/tests/audit_grant_invariant.sql"],
  },
];

function arg(name, fallback) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : fallback;
}
const DB_URL = arg("--db-url", "postgresql://postgres:postgres@127.0.0.1:55432/shadow");
const ADMIN_DB_URL = arg("--admin-db-url", DB_URL.replace(/\/[^/]*$/, "/postgres"));
const PSQL = arg("--psql", existsSync("C:\\pg17\\bin\\psql.exe") ? "C:\\pg17\\bin\\psql.exe" : "psql");
const PROD_TYPES = arg("--prod-types", null);
const PROD_COLUMNS = arg("--prod-columns", null);
const PROD_ACL = arg("--prod-acl", null);
const OUT = arg("--out", join(ROOT, ".codex-temp", "schema-truth-01", "composite.types.ts"));

const TMP = mkdtempSync(join(tmpdir(), "shadow-"));

/** Run psql -f file against the shadow; throws on first error unless tolerant. */
function psqlFile(file, { tolerant = false, dbUrl = DB_URL } = {}) {
  const res = spawnSync(
    PSQL,
    ["-X", "-v", `ON_ERROR_STOP=${tolerant ? 0 : 1}`, "-q", "-d", dbUrl, "-f", file],
    { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 },
  );
  if (res.status !== 0 && !tolerant) {
    throw new Error(`psql failed on ${file}:\n${res.stderr?.slice(-4000)}`);
  }
  return res;
}

function psqlSql(sql, opts = {}) {
  const f = join(TMP, `s${Math.floor(sql.length * 7 + sql.charCodeAt(0))}-${sql.length}.sql`);
  writeFileSync(f, sql, "utf8");
  return psqlFile(f, opts);
}

/** Run a single-column query (`line`), returning trimmed lines. */
function psqlLines(sql, dbUrl = DB_URL) {
  const f = join(TMP, `q${sql.length}.sql`);
  writeFileSync(f, sql, "utf8");
  const res = spawnSync(PSQL, ["-X", "-v", "ON_ERROR_STOP=1", "-At", "-d", dbUrl, "-f", f], {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  if (res.status !== 0) throw new Error(`psql query failed:\n${res.stderr?.slice(-2000)}`);
  return res.stdout.split(/\r?\n/).filter((l) => l.length > 0);
}

const norm = (s) => s.replace(/\r\n/g, "\n").replace(/[ \t]+\n/g, "\n").trimEnd();

function diffArtifact(label, expected, actual) {
  if (norm(expected) === norm(actual)) {
    console.log(`  gate ✓ ${label} matches prod`);
    return true;
  }
  const dir = join(ROOT, ".codex-temp", "schema-truth-01");
  mkdirSync(dir, { recursive: true });
  const e = join(dir, `gate-${label}-prod.txt`);
  const a = join(dir, `gate-${label}-shadow.txt`);
  writeFileSync(e, norm(expected) + "\n");
  writeFileSync(a, norm(actual) + "\n");
  console.error(`  gate ✗ ${label} DIFFERS from prod — inspect:\n    ${e}\n    ${a}`);
  return false;
}

/**
 * Generate types for an arbitrary db-url WITHOUT Docker: `supabase gen types
 * --db-url` shells out to the dockerized postgres-meta image, but the same
 * engine ships on npm (@supabase/postgres-meta). We spawn its HTTP server and
 * hit /generators/typescript with the CLI's parameters. Output proven byte-
 * identical to the Management API generator except the `__InternalSupabase`
 * header block (platform-only knowledge — the deployed PostgREST version).
 */
const PGMETA_DIR = arg("--pgmeta", "C:\\Users\\HP VICTUS\\hc-st-scratch\\pgmeta");
async function genTypes(dbUrl) {
  const server = join(PGMETA_DIR, "node_modules", "@supabase", "postgres-meta", "dist", "server", "server.js");
  if (!existsSync(server)) {
    throw new Error(`postgres-meta not installed at ${PGMETA_DIR} — npm i @supabase/postgres-meta there, or pass --pgmeta`);
  }
  const port = 9000 + Math.floor(Math.random() * 800);
  const child = spawn(process.execPath, [server], {
    env: { ...process.env, PG_META_DB_URL: dbUrl, PG_META_PORT: String(port) },
    stdio: "ignore",
  });
  try {
    let lastErr;
    for (let i = 0; i < 60; i++) {
      await new Promise((r) => setTimeout(r, 500));
      try {
        const res = await fetch(
          `http://127.0.0.1:${port}/generators/typescript?included_schemas=public&detect_one_to_one_relationships=true`,
        );
        if (res.ok) return await res.text();
        lastErr = new Error(`typegen HTTP ${res.status}: ${await res.text()}`);
      } catch (e) {
        lastErr = e;
      }
    }
    throw lastErr ?? new Error("typegen never came up");
  } finally {
    child.kill();
  }
}

/** The Management-API generator prepends this platform-only block. */
const stripInternalSupabase = (types) =>
  types.replace(/^ {2}\/\/ Allows to automatically instantiate createClient[\s\S]*?__InternalSupabase: \{[\s\S]*?\r?\n {2}\}\r?\n/m, "");

const COLUMNS_SQL = `
  select format('%s,%s,%s,%s,"%s"', table_name, column_name, data_type, is_nullable,
                replace(coalesce(column_default,''), '"', '""'))
  from information_schema.columns
  where table_schema = 'public'
  order by table_name, ordinal_position;`;

const ACL_SQL = `
  select c.relname || ',' || r.rolname || ',' ||
         concat_ws('',
           case when has_table_privilege(r.rolname, c.oid, 'SELECT') then 'S' else '' end,
           case when has_table_privilege(r.rolname, c.oid, 'INSERT') then 'I' else '' end,
           case when has_table_privilege(r.rolname, c.oid, 'UPDATE') then 'U' else '' end,
           case when has_table_privilege(r.rolname, c.oid, 'DELETE') then 'D' else '' end)
  from pg_class c cross join (values ('anon'),('authenticated'),('service_role')) r(rolname)
  where c.relnamespace = 'public'::regnamespace and c.relkind in ('r','v')
  union all
  select p.oid::regprocedure::text || ',' || r.rolname || ',' ||
         case when has_function_privilege(r.rolname, p.oid, 'EXECUTE') then 'X' else '' end
  from pg_proc p cross join (values ('anon'),('authenticated'),('service_role')) r(rolname)
  where p.pronamespace = 'public'::regnamespace and p.prokind in ('f','p')
    and not exists (select 1 from pg_depend d where d.objid = p.oid and d.deptype = 'e')
  order by 1;`;

// ---------------------------------------------------------------------------

function reset() {
  console.log("reset: dropping + recreating the shadow database…");
  const dbName = DB_URL.split("/").pop();
  psqlSql(`drop database if exists ${dbName} with (force);`, { dbUrl: ADMIN_DB_URL });
  psqlSql(`create database ${dbName};`, { dbUrl: ADMIN_DB_URL });
}

function bootstrap() {
  console.log("bootstrap: applying the Supabase platform stub…");
  psqlFile(BOOTSTRAP);
}

function applyProd() {
  console.log("apply-prod: applying the PROD-ACTUAL snapshot section by section…");
  const raw = readFileSync(SNAPSHOT, "utf8");
  const parts = raw.split(/^-- ============ (.+?) ============$/m);
  // parts: [header, title1, body1, title2, body2, …]
  const sections = new Map();
  for (let i = 1; i < parts.length; i += 2) sections.set(parts[i], parts[i + 1]);

  // Section order with tolerant-then-strict retries to break the two circular
  // dependencies pg_dump resolves via its dependency graph:
  //   - functions ⇄ tables: table DEFAULTs may call functions, while functions
  //     may use table ROWTYPES (`returns setof profiles`) → tolerant pass before
  //     tables, strict re-run after (CREATE OR REPLACE is idempotent);
  //   - views → views: oid order usually suffices; tolerant + strict re-run.
  // §extensions tolerated: pg_stat_statements wants shared_preload_libraries on
  // a vanilla server; it installs nothing into public so typegen is unaffected.
  const plan = [
    ["extensions", { tolerant: true }],
    ["enum types", {}],
    ["sequences", {}],
    ["functions", { tolerant: true, label: "functions (pre-tables, tolerant)" }],
    ["tables", {}],
    ["constraints (pk/unique/check)", {}],
    ["foreign keys", {}],
    ["indexes", {}],
    ["functions", { label: "functions (strict re-run)" }],
    ["views", { tolerant: true, label: "views (tolerant)" }],
    ["views", { label: "views (strict re-run)" }],
    ["triggers", {}],
    ["row level security", {}],
    ["policies", {}],
    ["grants: tables and sequences", {}],
    ["grants: functions", {}],
    ["realtime publication", {}],
    ["sequence ownership", {}],
  ];
  const missing = plan.map(([t]) => t).filter((t) => !sections.has(t));
  if (missing.length) throw new Error(`snapshot is missing section(s): ${missing.join(", ")}`);

  let n = 0;
  for (const [title, { tolerant = false, label = title } = {}] of plan) {
    const f = join(TMP, `sec-${++n}.sql`);
    writeFileSync(
      f,
      `set check_function_bodies = off;\nset search_path = "$user", public, extensions;\n` + sections.get(title),
      "utf8",
    );
    const res = psqlFile(f, { tolerant });
    if (tolerant && res.status !== 0) {
      console.log(`  §${label}: tolerated errors (retried strictly later)`);
    } else {
      console.log(`  §${label}: ok`);
    }
  }
}

async function gate() {
  console.log("gate: fidelity checks (shadow must equal prod BEFORE the FL2 layer)…");
  let ok = true;
  if (PROD_TYPES) {
    ok = diffArtifact("types", stripInternalSupabase(readFileSync(PROD_TYPES, "utf8")), await genTypes(DB_URL)) && ok;
  } else console.log("  gate – skipped types diff (no --prod-types)");
  if (PROD_COLUMNS) {
    const shadowCols = "table,column,data_type,is_nullable,column_default\n" + psqlLines(COLUMNS_SQL).join("\n");
    ok = diffArtifact("columns", readFileSync(PROD_COLUMNS, "utf8"), shadowCols) && ok;
  } else console.log("  gate – skipped columns diff (no --prod-columns)");
  if (PROD_ACL) {
    ok = diffArtifact("acl", readFileSync(PROD_ACL, "utf8"), psqlLines(ACL_SQL).join("\n")) && ok;
  } else console.log("  gate – skipped ACL diff (no --prod-acl)");
  if (!ok) {
    console.error("gate: FAILED — the shadow does not faithfully reproduce prod. Fix the snapshot/introspection first.");
    process.exit(1);
  }
}

function applyFl2() {
  console.log("apply-fl2: dress rehearsal — pass 1 interleaves the CI invariant suites;");
  console.log("           pass 2 re-applies every migration (idempotency, with data present)…");
  for (const { file, suites } of FL2_SET) {
    psqlFile(join(ROOT, file));
    console.log(`  pass 1: ${file.split("/").pop()} ok`);
    for (const suite of suites) {
      psqlFile(join(ROOT, suite));
      console.log(`    suite ✓ ${suite.split("/").pop()}`);
    }
  }
  for (const { file } of FL2_SET) {
    psqlFile(join(ROOT, file));
    console.log(`  pass 2: ${file.split("/").pop()} ok`);
  }
}

async function genTypesOut() {
  console.log("gen-types: generating the COMPOSITE types from the shadow…");
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, await genTypes(DB_URL), "utf8");
  console.log(`  wrote ${OUT}`);
}

const STEPS = { reset, bootstrap, "apply-prod": applyProd, gate, "apply-fl2": applyFl2, "gen-types": genTypesOut };
const cmd = process.argv[2];
if (cmd === "all") {
  reset(); bootstrap(); applyProd(); await gate(); applyFl2(); await genTypesOut();
} else if (cmd && STEPS[cmd]) {
  await STEPS[cmd]();
} else {
  console.error(`usage: build-shadow-db.mjs <${Object.keys(STEPS).join("|")}|all> [flags]`);
  process.exit(2);
}

rmSync(TMP, { recursive: true, force: true });
console.log("ok.");
