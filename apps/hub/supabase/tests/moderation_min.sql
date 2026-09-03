-- V3-25 prerequisite seed — reproduce, on a vanilla Postgres, the prod
-- out-of-band objects the moderation migration's RLS references, so the
-- moderation grant invariant is provable on a fresh DB.
--
-- Run AFTER _bootstrap_supabase_env.sql and BEFORE 20260616120000_v3_25_moderation.sql.
-- Creates faithful stubs ONLY if absent (so it composes after the full money/
-- audit chain too, where is_staff_in_any already exists).

-- auth.role() — Supabase returns the JWT role; here current_user is faithful
-- (under `set local role authenticated` it returns 'authenticated').
create or replace function auth.role() returns text language sql stable as $$
  select current_user::text
$$;

-- is_staff_in_any() — staff predicate the moderation policies gate on. Stub to
-- FALSE so the behavioural test (authenticated → no read, insert rejected) is
-- meaningful; only created when a real definition isn't already present.
do $$
begin
  if not exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'is_staff_in_any'
  ) then
    create function public.is_staff_in_any() returns boolean
      language sql stable security definer set search_path = public
      as $f$ select false $f$;
    revoke all on function public.is_staff_in_any() from public;
    grant execute on function public.is_staff_in_any() to authenticated, service_role;
  end if;
end $$;

select 'moderation prerequisite seed ready' as status;
