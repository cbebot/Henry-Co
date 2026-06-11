#!/usr/bin/env node
// @ts-check
/**
 * SCHEMA-TRUTH-01 — read-only introspection of the production database into a
 * deterministic, re-applyable DDL snapshot (`supabase/prod-actual/schema.sql`).
 *
 * WHY THIS EXISTS: prod carries OUT-OF-BAND schema (applied via the dashboard,
 * never recorded as a migration file), so neither migration replay nor the
 * committed types describe the real database. This script captures PROD-ACTUAL
 * truth by catalog introspection ONLY — it issues exclusively read-only
 * SELECTs against pg_catalog through the Supabase Management API (the linked
 * `supabase db query --linked` path). It can not and does not run DDL on prod.
 *
 * The snapshot is the base layer of the SHADOW DB used to regenerate
 * packages/data/src/database.types.ts:  prod-actual (this file) + the FL2
 * committed-not-applied migration set, applied locally. Fidelity is gated by
 * scripts/db/build-shadow-db.mjs (types diff + catalog diff + ACL parity).
 *
 * DDL rendering leans on Postgres' own deparsers (pg_get_functiondef,
 * pg_get_constraintdef, pg_get_indexdef, pg_get_triggerdef, pg_get_viewdef) —
 * the same primitives pg_dump uses — so hand-rolled drift is minimized.
 *
 * GRANTS are captured for the request-path roles only (PUBLIC, anon,
 * authenticated, service_role) and normalized to EFFECTIVE parity: each object
 * gets a revoke-then-explicit-grant pair reproducing prod's ACL state for those
 * roles. Platform-internal roles (supabase_*_admin, dashboard_user, …) are
 * platform-managed on both sides and deliberately not replicated.
 *
 * Run:  node scripts/db/introspect-prod-schema.mjs --workdir <linked-supabase-dir>
 *       [--out supabase/prod-actual/schema.sql] [--columns-out <csv>]
 */

import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

function arg(name, fallback) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : fallback;
}
const WORKDIR = arg("--workdir", null);
const OUT = arg("--out", join(ROOT, "supabase", "prod-actual", "schema.sql"));
const COLUMNS_OUT = arg("--columns-out", null);
if (!WORKDIR) {
  console.error("usage: introspect-prod-schema.mjs --workdir <linked supabase project dir>");
  process.exit(2);
}

const TMP = mkdtempSync(join(tmpdir(), "schema-truth-"));
let calls = 0;

/** Run one read-only SQL text via the Management API; return rows. */
function q(sql) {
  const file = join(TMP, `q${++calls}.sql`);
  writeFileSync(file, sql, "utf8");
  // shell:false so paths with spaces survive as single argv entries (Windows).
  const out = execFileSync(
    "supabase",
    ["db", "query", "--linked", "--workdir", WORKDIR, "-o", "json", "-f", file],
    { encoding: "utf8", maxBuffer: 64 * 1024 * 1024, stdio: ["ignore", "pipe", "pipe"] },
  );
  const start = out.indexOf("{");
  if (start < 0) throw new Error(`no JSON in db query output:\n${out.slice(0, 400)}`);
  const parsed = JSON.parse(out.slice(start));
  if (!Array.isArray(parsed.rows)) throw new Error(`unexpected envelope keys: ${Object.keys(parsed)}`);
  return parsed.rows;
}

/**
 * Page a query template containing `$WHERE_RN` over row_number windows so a
 * single Management API response stays small. The template must compute
 * `rn` and expose it for the predicate.
 */
function paged(template, pageSize = 40) {
  const rows = [];
  for (let off = 0; ; off += pageSize) {
    const page = q(template.replaceAll("$WHERE_RN", `rn > ${off} and rn <= ${off + pageSize}`));
    rows.push(...page);
    if (page.length < pageSize) break;
  }
  return rows;
}

const sections = [];
function section(title, rows) {
  const body = rows.map((r) => r.ddl).filter(Boolean).join("\n");
  sections.push(`-- ============ ${title} ============\n${body}`);
  console.log(`  §${title}: ${rows.length} statement group(s)`);
}

console.log("introspect-prod-schema: capturing PROD-ACTUAL (read-only)…");

// §1 extensions (plpgsql/vault/graphql/etc. are platform-preinstalled both sides)
section("extensions", q(`
  select 'create extension if not exists "' || e.extname || '" with schema "' || n.nspname || '";' as ddl
  from pg_extension e join pg_namespace n on n.oid = e.extnamespace
  where e.extname not in ('plpgsql','supabase_vault','pg_graphql','pgsodium','pgjwt')
  order by e.extname`));

// §2 enum types
section("enum types", q(`
  select format('create type public.%I as enum (%s);', t.typname,
           (select string_agg(quote_literal(e.enumlabel), ', ' order by e.enumsortorder)
              from pg_enum e where e.enumtypid = t.oid)) as ddl
  from pg_type t
  where t.typnamespace = 'public'::regnamespace and t.typtype = 'e'
  order by t.typname`));

// §3 standalone + serial sequences (identity-owned sequences come with their column)
section("sequences", q(`
  select format('create sequence if not exists public.%I as %s increment by %s minvalue %s maxvalue %s start with %s cache %s%s;',
           s.sequencename, s.data_type, s.increment_by, s.min_value, s.max_value, s.start_value, s.cache_size,
           case when s.cycle then ' cycle' else '' end) as ddl
  from pg_sequences s
  join pg_class c on c.relname = s.sequencename and c.relkind = 'S' and c.relnamespace = 'public'::regnamespace
  where s.schemaname = 'public'
    and not exists (select 1 from pg_depend d where d.objid = c.oid and d.deptype = 'i')
  order by s.sequencename`));

// §4 functions — BEFORE tables (table defaults may call them); applied with
// check_function_bodies = off, exactly as pg_dump does.
section("functions", paged(`
  with f as (
    select p.oid, row_number() over (order by p.proname, p.oid) as rn
    from pg_proc p
    where p.pronamespace = 'public'::regnamespace and p.prokind in ('f','p')
      and not exists (select 1 from pg_depend d where d.objid = p.oid and d.deptype = 'e')
  )
  select pg_get_functiondef(f.oid) || ';' as ddl from f where $WHERE_RN order by rn`, 20));

// §5 tables (columns, defaults, identity, generated, collation, not null)
section("tables", paged(`
  with t as (
    select c.oid, c.relname, c.relpersistence, row_number() over (order by c.relname) as rn
    from pg_class c
    where c.relnamespace = 'public'::regnamespace and c.relkind = 'r'
  )
  select format(e'create %stable public.%I (\\n%s\\n);',
    case when t.relpersistence = 'u' then 'unlogged ' else '' end,
    t.relname,
    (select string_agg(
       '  ' || quote_ident(a.attname) || ' ' || format_type(a.atttypid, a.atttypmod)
       || case when a.attcollation <> 0 and a.attcollation is distinct from ty.typcollation
               then ' collate ' || quote_ident(co.collname) else '' end
       || case when a.attidentity = 'a' then ' generated always as identity'
               when a.attidentity = 'd' then ' generated by default as identity'
               else '' end
       || case when a.attgenerated = 's' then ' generated always as (' || pg_get_expr(ad.adbin, ad.adrelid) || ') stored'
               else '' end
       || case when ad.adbin is not null and a.attgenerated = '' and a.attidentity = ''
               then ' default ' || pg_get_expr(ad.adbin, ad.adrelid) else '' end
       || case when a.attnotnull then ' not null' else '' end,
       e',\\n' order by a.attnum)
     from pg_attribute a
     join pg_type ty on ty.oid = a.atttypid
     left join pg_attrdef ad on ad.adrelid = a.attrelid and ad.adnum = a.attnum
     left join pg_collation co on co.oid = a.attcollation
     where a.attrelid = t.oid and a.attnum > 0 and not a.attisdropped
    )) as ddl
  from t where $WHERE_RN order by rn`, 40));

// §6 primary key / unique / check / exclusion constraints
section("constraints (pk/unique/check)", paged(`
  with c as (
    select con.oid, con.conname, con.contype, cl.relname,
           row_number() over (order by case con.contype when 'p' then 1 when 'u' then 2 when 'x' then 3 else 4 end,
                              cl.relname, con.conname) as rn
    from pg_constraint con join pg_class cl on cl.oid = con.conrelid
    where cl.relnamespace = 'public'::regnamespace and con.contype in ('p','u','c','x') and con.conislocal
  )
  select format('alter table only public.%I add constraint %I %s;', c.relname, c.conname, pg_get_constraintdef(c.oid)) as ddl
  from c where $WHERE_RN order by rn`, 80));

// §7 foreign keys (after every PK/unique exists)
section("foreign keys", paged(`
  with c as (
    select con.oid, con.conname, cl.relname, row_number() over (order by cl.relname, con.conname) as rn
    from pg_constraint con join pg_class cl on cl.oid = con.conrelid
    where cl.relnamespace = 'public'::regnamespace and con.contype = 'f' and con.conislocal
  )
  select format('alter table only public.%I add constraint %I %s;', c.relname, c.conname, pg_get_constraintdef(c.oid)) as ddl
  from c where $WHERE_RN order by rn`, 80));

// §8 plain indexes (constraint-backing indexes already exist)
section("indexes", paged(`
  with i as (
    select ix.indexrelid, tc.relname, row_number() over (order by tc.relname, ix.indexrelid::regclass::text) as rn
    from pg_index ix
    join pg_class tc on tc.oid = ix.indrelid
    left join pg_constraint con on con.conindid = ix.indexrelid
    where tc.relnamespace = 'public'::regnamespace and tc.relkind = 'r' and con.oid is null
  )
  select pg_get_indexdef(i.indexrelid) || ';' as ddl from i where $WHERE_RN order by rn`, 80));

// §9 views (oid order ≈ creation order; reloptions keeps security_invoker)
section("views", q(`
  select format('create or replace view public.%I%s as %s', c.relname,
           case when c.reloptions is not null then ' with (' || array_to_string(c.reloptions, ', ') || ')' else '' end,
           pg_get_viewdef(c.oid, true)) as ddl
  from pg_class c
  where c.relnamespace = 'public'::regnamespace and c.relkind = 'v'
    and not exists (select 1 from pg_depend d where d.objid = c.oid and d.deptype = 'e')
  order by c.oid`));

// §10 triggers on public + auth tables (handle_new_customer lives on auth.users)
section("triggers", paged(`
  with t as (
    select tg.oid, tg.tgname, tg.tgenabled, tg.tgrelid, c.relname, n.nspname,
           row_number() over (order by n.nspname, c.relname, tg.tgname) as rn
    from pg_trigger tg
    join pg_class c on c.oid = tg.tgrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname in ('public','auth') and not tg.tgisinternal
      and not exists (select 1 from pg_depend d where d.objid = tg.oid and d.deptype = 'e')
  )
  select pg_get_triggerdef(t.oid, true) || ';'
         || case t.tgenabled
              when 'D' then format(e'\\nalter table %s disable trigger %I;', t.tgrelid::regclass::text, t.tgname)
              when 'A' then format(e'\\nalter table %s enable always trigger %I;', t.tgrelid::regclass::text, t.tgname)
              when 'R' then format(e'\\nalter table %s enable replica trigger %I;', t.tgrelid::regclass::text, t.tgname)
              else '' end as ddl
  from t where $WHERE_RN order by rn`, 60));

// §11 row level security switches
section("row level security", q(`
  select format('alter table public.%I enable row level security;', c.relname)
         || case when c.relforcerowsecurity
                 then format(e'\\nalter table public.%I force row level security;', c.relname) else '' end as ddl
  from pg_class c
  where c.relnamespace = 'public'::regnamespace and c.relkind = 'r' and c.relrowsecurity
  order by c.relname`));

// §12 policies (public + storage.objects bucket policies)
section("policies", paged(`
  with p as (
    select *, row_number() over (order by schemaname, tablename, policyname) as rn
    from pg_policies where schemaname in ('public','storage')
  )
  select format('create policy %I on %I.%I as %s for %s to %s%s%s;',
           p.policyname, p.schemaname, p.tablename, lower(p.permissive), lower(p.cmd),
           array_to_string(p.roles, ', '),
           coalesce(' using (' || p.qual || ')', ''),
           coalesce(' with check (' || p.with_check || ')', '')) as ddl
  from p where $WHERE_RN order by rn`, 60));

// §13 grants — EFFECTIVE parity for the request-path roles. Normalize (revoke)
// then explicitly grant what prod's ACL holds. NULL ACL semantics differ by
// object class: tables/sequences → owner-only; functions → owner + PUBLIC execute.
section("grants: tables and sequences", paged(`
  with rel as (
    select c.oid, c.relname, c.relkind, c.relacl, row_number() over (order by c.relname) as rn
    from pg_class c
    where c.relnamespace = 'public'::regnamespace and c.relkind in ('r','v','S')
  ),
  acl as (
    select rel.oid, rel.relname, rel.relkind, rel.rn, a.grantee, a.privilege_type, a.is_grantable
    from rel, lateral aclexplode(rel.relacl) a
    where rel.relacl is not null
  )
  select format(e'revoke all on %s public.%I from public, anon, authenticated, service_role;%s',
           case rel.relkind when 'S' then 'sequence' else 'table' end, rel.relname,
           coalesce((
             select string_agg(format(e'\\ngrant %s on %s public.%I to %s%s;',
                      g.privs, case rel.relkind when 'S' then 'sequence' else 'table' end, rel.relname, g.who,
                      case when g.grantable then ' with grant option' else '' end), '' order by g.who)
             from (
               select case when acl.grantee = 0 then 'public' else quote_ident(pg_get_userbyid(acl.grantee)) end as who,
                      string_agg(acl.privilege_type, ', ' order by acl.privilege_type) as privs,
                      bool_or(acl.is_grantable) as grantable
               from acl
               where acl.oid = rel.oid
                 and (acl.grantee = 0 or pg_get_userbyid(acl.grantee) in ('anon','authenticated','service_role'))
               group by 1
             ) g
           ), '')) as ddl
  from rel where $WHERE_RN order by rn`, 60));

section("grants: functions", paged(`
  with f as (
    select p.oid, p.proacl, p.proname,
           p.oid::regprocedure::text as sig,
           row_number() over (order by p.proname, p.oid) as rn
    from pg_proc p
    where p.pronamespace = 'public'::regnamespace and p.prokind in ('f','p')
      and not exists (select 1 from pg_depend d where d.objid = p.oid and d.deptype = 'e')
  )
  select format(e'revoke all on function public.%s from public, anon, authenticated, service_role;%s',
           f.sig,
           case when f.proacl is null
                then format(e'\\ngrant execute on function public.%s to public;', f.sig)
                else coalesce((
                  select string_agg(format(e'\\ngrant execute on function public.%s to %s;', f.sig, g.who), '' order by g.who)
                  from (
                    select distinct case when a.grantee = 0 then 'public'
                                         else quote_ident(pg_get_userbyid(a.grantee)) end as who
                    from aclexplode(f.proacl) a
                    where a.privilege_type = 'EXECUTE'
                      and (a.grantee = 0 or pg_get_userbyid(a.grantee) in ('anon','authenticated','service_role'))
                  ) g
                ), '') end) as ddl
  from f where $WHERE_RN order by rn`, 40));

// §14 realtime publication membership
section("realtime publication", q(`
  select format('alter publication supabase_realtime add table only %I.%I;', pt.schemaname, pt.tablename) as ddl
  from pg_publication_tables pt
  where pt.pubname = 'supabase_realtime'
  order by pt.schemaname, pt.tablename`));

// §15 serial sequence ownership (so drops cascade like prod)
section("sequence ownership", q(`
  select format('alter sequence public.%I owned by public.%I.%I;', sc.relname, tc.relname, a.attname) as ddl
  from pg_depend d
  join pg_class sc on sc.oid = d.objid and sc.relkind = 'S' and sc.relnamespace = 'public'::regnamespace
  join pg_class tc on tc.oid = d.refobjid
  join pg_attribute a on a.attrelid = tc.oid and a.attnum = d.refobjsubid
  where d.deptype = 'a' and d.classid = 'pg_class'::regclass and d.refclassid = 'pg_class'::regclass
  order by sc.relname`));

const meta = q(`select current_setting('server_version') as v, current_database() as db`)[0];

const header = `-- ============================================================================
-- PROD-ACTUAL SCHEMA SNAPSHOT — generated by scripts/db/introspect-prod-schema.mjs
-- (SCHEMA-TRUTH-01). Captured READ-ONLY from the production database via the
-- Supabase Management API (pg_catalog introspection; zero DDL touched prod).
--
-- Server: PostgreSQL ${meta.v}
--
-- This file is the DECLARED SCHEMA BASELINE: what production actually holds,
-- including out-of-band changes no migration file describes. It is NOT a
-- migration and must never be applied to prod — it exists to (re)build the
-- local SHADOW DB from which packages/data/src/database.types.ts is generated
-- (see scripts/db/build-shadow-db.mjs) and to classify migration files
-- (docs/v3/fl2-apply-manifest.md).
--
-- Apply context (shadow only): a Supabase local stack, as a superuser role,
-- with check_function_bodies = off. Functions precede tables deliberately.
-- ============================================================================

set check_function_bodies = off;
`;

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, header + "\n" + sections.join("\n\n") + "\n", "utf8");
console.log(`wrote ${OUT}`);

if (COLUMNS_OUT) {
  const cols = paged(`
    with c as (
      select table_name, column_name, data_type, is_nullable, coalesce(column_default,'') as column_default,
             row_number() over (order by table_name, ordinal_position) as rn
      from information_schema.columns
      where table_schema = 'public'
    )
    select format('%s,%s,%s,%s,"%s"', table_name, column_name, data_type, is_nullable,
                  replace(column_default, '"', '""')) as ddl
    from c where $WHERE_RN order by rn`, 400);
  mkdirSync(dirname(COLUMNS_OUT), { recursive: true });
  writeFileSync(COLUMNS_OUT, "table,column,data_type,is_nullable,column_default\n" + cols.map((r) => r.ddl).join("\n") + "\n", "utf8");
  console.log(`wrote ${COLUMNS_OUT}`);
}

rmSync(TMP, { recursive: true, force: true });
console.log(`done — ${calls} read-only Management API calls.`);
