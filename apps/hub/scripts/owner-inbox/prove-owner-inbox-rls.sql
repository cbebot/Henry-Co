-- prove-owner-inbox-rls.sql — RLS proof for the owner inbox.
-- Run AFTER applying 20260615103000_owner_inbox_foundation.sql, e.g.:
--   supabase db query --linked --file apps/hub/scripts/owner-inbox/prove-owner-inbox-rls.sql
-- or via the Supabase MCP execute_sql. Self-contained and rolls back (no residue).
--
-- Proves:
--   (1) a NON-owner authenticated session sees 0 owner-inbox rows;
--   (2) an active OWNER authenticated session sees the row;
--   (3) the owner_inbox_is_owner() predicate is SECURITY DEFINER + search_path-pinned.

begin;

-- Seed one row as the privileged (migration/service) role.
insert into public.received_emails (dedupe_key, to_address, from_address, subject)
values ('proof:rls:owner-inbox', 'support@henryonyx.com', 'rls-proof@example.com', 'RLS proof message')
on conflict (dedupe_key) do nothing;

do $$
declare
  owner_uid uuid;
  nonowner_uid uuid := '00000000-0000-0000-0000-0000000000ff';
  cnt int;
begin
  select user_id into owner_uid
  from public.owner_profiles
  where is_active and lower(trim(role)) in ('owner', 'admin') and user_id is not null
  limit 1;

  -- (1) NON-OWNER authenticated session must see 0 rows.
  set local role authenticated;
  perform set_config(
    'request.jwt.claims',
    json_build_object('sub', nonowner_uid, 'role', 'authenticated')::text,
    true
  );
  select count(*) into cnt from public.received_emails where dedupe_key = 'proof:rls:owner-inbox';
  if cnt <> 0 then
    raise exception 'FAIL: non-owner saw % owner-inbox rows (expected 0)', cnt;
  end if;
  raise notice 'PASS (1): non-owner authenticated session sees 0 rows';

  -- (2) OWNER authenticated session must see the row.
  if owner_uid is null then
    raise notice 'SKIP (2): no active owner in owner_profiles to assert the positive case';
  else
    perform set_config(
      'request.jwt.claims',
      json_build_object('sub', owner_uid, 'role', 'authenticated')::text,
      true
    );
    select count(*) into cnt from public.received_emails where dedupe_key = 'proof:rls:owner-inbox';
    if cnt < 1 then
      raise exception 'FAIL: owner saw % owner-inbox rows (expected >= 1)', cnt;
    end if;
    raise notice 'PASS (2): owner authenticated session sees the row';
  end if;

  reset role;
end $$;

-- (3) Predicate hardening: SECURITY DEFINER + a pinned search_path.
do $$
declare
  is_definer boolean;
  has_search_path boolean;
begin
  select p.prosecdef,
         coalesce(array_to_string(p.proconfig, ',') like '%search_path=%', false)
    into is_definer, has_search_path
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.proname = 'owner_inbox_is_owner';

  if not is_definer then raise exception 'FAIL: owner_inbox_is_owner is not SECURITY DEFINER'; end if;
  if not has_search_path then raise exception 'FAIL: owner_inbox_is_owner has no pinned search_path'; end if;
  raise notice 'PASS (3): owner_inbox_is_owner is SECURITY DEFINER with a pinned search_path';
end $$;

rollback;
