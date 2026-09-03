-- SEC-HARDEN-01 — faithful LOCAL replica of the three relevant Supabase advisor
-- lints (verbatim logic from supabase/splinter lints 0025, 0028, 0029). The
-- `supabase db advisors --db-url` CLI forces TLS and cannot reach a local
-- non-TLS Postgres, so we run the lint queries directly — the lints are pure
-- catalog SQL, so this is the same computation the hosted advisor performs.
--
-- Requires `pgrst.db_schemas` to name the exposed schema(s) (the hosted advisor
-- inherits this from PostgREST). The runner sets it at the database level.

\set ON_ERROR_STOP on
create schema if not exists lint;

create or replace view lint."0028_anon_security_definer_function_executable" as
  select n.nspname as schema_name, p.proname as function_name,
         pg_catalog.pg_get_function_identity_arguments(p.oid) as function_args
  from pg_catalog.pg_proc p
    join pg_catalog.pg_namespace n on p.pronamespace = n.oid
  where p.prosecdef = true
    and pg_catalog.has_function_privilege('anon', p.oid, 'EXECUTE')
    and n.nspname = any(array(select trim(unnest(string_to_array(current_setting('pgrst.db_schemas','t'), ',')))))
    and n.nspname not in ('auth','cron','extensions','graphql','graphql_public','information_schema','pg_catalog','realtime','storage','supabase_functions','supabase_migrations','vault');

create or replace view lint."0029_authenticated_security_definer_function_executable" as
  select n.nspname as schema_name, p.proname as function_name,
         pg_catalog.pg_get_function_identity_arguments(p.oid) as function_args
  from pg_catalog.pg_proc p
    join pg_catalog.pg_namespace n on p.pronamespace = n.oid
  where p.prosecdef = true
    and pg_catalog.has_function_privilege('authenticated', p.oid, 'EXECUTE')
    and n.nspname = any(array(select trim(unnest(string_to_array(current_setting('pgrst.db_schemas','t'), ',')))))
    and n.nspname not in ('auth','cron','extensions','graphql','graphql_public','information_schema','pg_catalog','realtime','storage','supabase_functions','supabase_migrations','vault');

create or replace view lint."0025_public_bucket_allows_listing" as
  with public_buckets as (
    select (xpath('/row/id/text()', bucket_xml))[1]::text as bucket_id,
           (xpath('/row/name/text()', bucket_xml))[1]::text as bucket_name
    from unnest(
      case when pg_catalog.to_regclass('storage.buckets') is not null
        then xpath('/table/row', pg_catalog.query_to_xml(
          'select id, name from storage.buckets where public = true order by id', false, false, ''))
        else array[]::xml[] end) as bucket_xml),
  matching_policies as (
    select b.bucket_id, b.bucket_name, p.policyname
    from public_buckets b
      join pg_catalog.pg_policies p
        on p.schemaname = 'storage' and p.tablename = 'objects'
        and p.cmd in ('SELECT','ALL') and p.permissive = 'PERMISSIVE'
        and p.roles && array['public'::name,'anon'::name,'authenticated'::name]
    where (
      p.qual is null
      or replace(replace(replace(lower(p.qual),' ',''),E'\n',''),E'\t','') in ('true','(true)','1=1','(1=1)')
      or exists (
        select 1 from pg_catalog.regexp_match(p.qual,
          $re$\A\s*\(*\s*bucket_id\s*=\s*('(?:[^']|'')*')(\s*::\s*[[:alnum:]_\.]+)?\s*\)*\s*\Z$re$, 'i') as bm(matches)
        where bm.matches[1] = '''' || replace(b.bucket_id,'''','''''') || '''')))
  select bucket_id, bucket_name, array_agg(policyname order by policyname) as policy_names
  from matching_policies group by bucket_id, bucket_name order by bucket_id;

\echo '--- lint 0028 (anon can EXECUTE SECURITY DEFINER fn) ---'
select function_name || '(' || function_args || ')' as anon_executable_definer_fn
from lint."0028_anon_security_definer_function_executable" order by 1;
\echo '--- lint 0029 (authenticated can EXECUTE SECURITY DEFINER fn) ---'
select function_name || '(' || function_args || ')' as authenticated_executable_definer_fn
from lint."0029_authenticated_security_definer_function_executable" order by 1;
\echo '--- lint 0025 (public bucket allows listing) ---'
select bucket_name, array_to_string(policy_names, ', ') as listing_policies
from lint."0025_public_bucket_allows_listing";
