-- Wrap raw `auth.<fn>()` calls in 6 storage.objects RLS policies that
-- the earlier `20260514140000_auth_rls_initplan_wrap` migration did not
-- touch (it targeted `schemaname = 'public'` only).
--
-- These 6 policies live in the `storage` schema:
--   • storage.objects / company_assets_owner_delete  (qual)
--   • storage.objects / company_assets_owner_insert  (with_check)
--   • storage.objects / company_assets_owner_update  (qual + with_check)
--   • storage.objects / hq_ic_storage_delete         (qual)
--   • storage.objects / hq_ic_storage_insert         (with_check)
--   • storage.objects / hq_ic_storage_update         (qual + with_check)
--
-- This migration has already been applied directly to production via
-- Supabase MCP on 2026-05-15. The file exists in the repo so that
-- preview branches, fresh setups, and `supabase db reset` flows reach
-- the same end-state.
--
-- Safety properties match the parent migration:
--   • Single transaction; partial failure rolls back ALL drops + creates.
--   • Idempotent: collapse-then-wrap handles re-runs cleanly.
--   • format(%I, ...) for every identifier — injection-safe.
--   • Skip if policy missing or already wrapped.

do $$
declare
  pol record;
  new_qual text;
  new_check text;
  collapse_rx constant text := '\(\s*[Ss][Ee][Ll][Ee][Cc][Tt]\s+(auth\.(?:uid|role|email|jwt|claims)\(\s*\))\s*\)';
  wrap_rx     constant text := '(auth\.(?:uid|role|email|jwt|claims)\(\s*\))';
  any_auth_rx constant text := 'auth\.(?:uid|role|email|jwt|claims)\(';
  pair text[];
  roles_str text;
  rewritten int := 0;
  not_found int := 0;
  skipped_no_auth int := 0;
  targets text[][] := array[
    array['company_assets_owner_delete'],
    array['company_assets_owner_insert'],
    array['company_assets_owner_update'],
    array['hq_ic_storage_delete'],
    array['hq_ic_storage_insert'],
    array['hq_ic_storage_update']
  ];
begin
  foreach pair slice 1 in array targets
  loop
    select *
      into pol
      from pg_policies
     where schemaname = 'storage'
       and tablename = 'objects'
       and policyname = pair[1]
     limit 1;

    if not found then
      not_found := not_found + 1;
      continue;
    end if;

    if  (pol.qual is null or pol.qual !~ any_auth_rx)
    and (pol.with_check is null or pol.with_check !~ any_auth_rx)
    then
      skipped_no_auth := skipped_no_auth + 1;
      continue;
    end if;

    new_qual := pol.qual;
    if new_qual is not null then
      new_qual := regexp_replace(new_qual, collapse_rx, '\1', 'g');
      new_qual := regexp_replace(new_qual, wrap_rx, '(SELECT \1)', 'g');
    end if;

    new_check := pol.with_check;
    if new_check is not null then
      new_check := regexp_replace(new_check, collapse_rx, '\1', 'g');
      new_check := regexp_replace(new_check, wrap_rx, '(SELECT \1)', 'g');
    end if;

    if new_qual is not distinct from pol.qual
       and new_check is not distinct from pol.with_check
    then
      continue;
    end if;

    select string_agg(quote_ident(r), ', ') into roles_str
      from unnest(pol.roles) r;

    execute format('drop policy if exists %I on storage.objects', pair[1]);

    execute format(
      'create policy %I on storage.objects as %s for %s%s%s%s',
      pair[1],
      pol.permissive,
      pol.cmd,
      case when roles_str is not null and roles_str <> '' then ' to ' || roles_str else '' end,
      case when new_qual is not null then ' using (' || new_qual || ')' else '' end,
      case when new_check is not null then ' with check (' || new_check || ')' else '' end
    );

    rewritten := rewritten + 1;
  end loop;

  raise notice 'auth_rls_initplan storage wrap: rewrote=%, not_found=%, skipped_no_auth=%',
    rewritten, not_found, skipped_no_auth;
end $$;
