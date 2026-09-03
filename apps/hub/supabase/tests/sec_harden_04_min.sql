-- SEC-HARDEN-04 CI fixture — reproduce the three deferred holes SEC-HARDEN-04 closes.
--
-- Run AFTER _bootstrap_supabase_env.sql, membership_min.sql, sec_harden_03_min.sql and
-- the SEC-HARDEN-02/03 migrations + invariants. Those create public.profiles(id, role),
-- public.learn_role_memberships (NO updated_at column), public.studio_payments (+ the
-- broad "Service role full access" policy + studio_member_payments_insert + the standing
-- request-role write grant), and the academy seed row. This fixture adds the remaining
-- prod-faithful pre-fix state so 20260614160000_sec_harden_04_*.sql (part A) and
-- 20260614161000_sec_harden_04_studio_payments_money_safe_lockdown.sql (part B) have
-- real objects to act on. Idempotent.

set check_function_bodies = off;

-- ── (1) profiles: the anon-insert hole + the authenticated self-service path ──
-- membership_min.sql created public.profiles(id, role) but without RLS, grants, or any
-- policy. Reproduce the prod surface: RLS on, the standing request-role DML grant (the
-- latent half), the "anon can insert profiles"(true) hole, the authenticated
-- self-service insert policy that must SURVIVE, and the anon read-denial.
alter table public.profiles enable row level security;

grant select, insert, update, delete, truncate on table public.profiles to anon, authenticated;
grant select, insert, update, delete, truncate on table public.profiles to service_role;

drop policy if exists "anon can insert profiles" on public.profiles;
create policy "anon can insert profiles" on public.profiles
  as permissive for insert to anon with check (true);          -- THE HOLE

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles
  as permissive for insert to authenticated with check (id = (select auth.uid()));  -- must survive

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  as permissive for select to authenticated using (id = (select auth.uid()));

drop policy if exists "no anon select profiles" on public.profiles;
create policy "no anon select profiles" on public.profiles
  as permissive for select to anon using (false);

-- ── (2) learn_role_memberships: the pre-existing broken updated_at trigger ────
-- The table (no updated_at column) exists from membership_min.sql. Reproduce the prod
-- bug: a BEFORE UPDATE trigger that sets NEW.updated_at on the column-less table, so
-- every UPDATE raises `record "new" has no field "updated_at"`.
create or replace function public.learn_set_updated_at() returns trigger
  language plpgsql set search_path = public, pg_catalog as $fn$
begin
  new.updated_at = timezone('utc', now());   -- references a column that doesn't exist here
  return new;
end $fn$;

drop trigger if exists learn_role_memberships_updated_at on public.learn_role_memberships;
create trigger learn_role_memberships_updated_at
  before update on public.learn_role_memberships
  for each row execute function public.learn_set_updated_at();

-- Ensure a row exists to UPDATE in the invariant (the academy seed from sec_harden_03_min
-- already exists; this is a guarded backstop).
insert into public.learn_role_memberships (id, user_id, normalized_email, role, scope_type, is_active)
  values ('00000000-0000-4000-8000-000000001601', null, 'academy@henryonyx.com', 'academy_owner', 'platform', true)
  on conflict (id) do nothing;

-- ── (3) studio_payments: the scoped SELECT + staff-UPDATE policies ───────────
-- sec_harden_03_min.sql created studio_payments + the broad policy + the scoped
-- studio_member_payments_insert. Add an `amount` column (money-input) and the other two
-- scoped policies so part B can prove the SELECT survives and the write policies are
-- removed. studio_is_staff()/studio_auth_email() exist from membership_min.sql.
alter table public.studio_payments add column if not exists amount integer;

-- (CI fixture simplification: prod's studio_member_payments qual also joins
-- studio_projects, which the fixture chain does not create. The invariant only needs
-- the SELECT policy to EXIST and SURVIVE the lockdown — the qual content is irrelevant
-- to that — so we use the dependency-free studio_is_staff() gate here.)
drop policy if exists studio_member_payments on public.studio_payments;
create policy studio_member_payments on public.studio_payments
  as permissive for select to public using (studio_is_staff());

drop policy if exists studio_staff_payments_update on public.studio_payments;
create policy studio_staff_payments_update on public.studio_payments
  as permissive for update to public using (studio_is_staff()) with check (studio_is_staff());

select 'sec-harden-04 pre-fix surface ready (profiles anon-insert hole + standing grant; broken learn updated_at trigger; studio_payments scoped SELECT + staff UPDATE + broad hole)' as status;
