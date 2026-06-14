-- SEC-HARDEN-03 CI fixture — minimal world-writable data-table surface.
--
-- The 40 non-membership data tables + their "Service role full access"(true)
-- world-writable policies live on prod out-of-band (division feature migrations +
-- dashboard edits), NOT in any FL2 migration, so the vanilla CI chain has nothing
-- for 20260614120000_sec_harden_03_world_writable_lockdown.sql to act on. This
-- fixture reproduces a FAITHFUL, representative slice of the prod pre-fix state —
-- one or two tables per disposition category — so the migration has real objects to
-- lock down and the invariant can assert the end-state.
--
-- Run AFTER _bootstrap_supabase_env.sql AND membership_min.sql (which create
-- auth.uid()/auth.jwt(), the request roles, studio_auth_email(), studio_is_staff(),
-- public.profiles, and public.learn_role_memberships). Idempotent.

set check_function_bodies = off;

-- ── representative tables (real-ish columns) ─────────────────────────────────
-- Cat-1 non-studio (no scoped policy): the broad ALL is their only policy.
create table if not exists public.trust_flags (
  id uuid primary key default gen_random_uuid(), user_id uuid, reason text,
  created_at timestamptz not null default now());
create table if not exists public.jobs_applications (
  id uuid primary key default gen_random_uuid(), applicant_user_id uuid, status text,
  created_at timestamptz not null default now());
-- Cat-1 studio (scoped studio_member_* SELECT survives the broad-policy drop):
create table if not exists public.studio_leads (
  id uuid primary key default gen_random_uuid(), user_id uuid, normalized_email text,
  created_at timestamptz not null default now());
-- Cat-2 public reference read (anon read preserved via a public SELECT policy):
create table if not exists public.hub_homepage_content (
  id uuid primary key default gen_random_uuid(), page_key text, created_at timestamptz not null default now());
create table if not exists public.platform_countries (
  code text primary key, name text);
-- Cat-3 legitimate authenticated writer (scoped write policies are the gate):
create table if not exists public.studio_deliverables (
  id uuid primary key default gen_random_uuid(), project_id uuid, status text,
  approved_by uuid, created_at timestamptz not null default now());
create table if not exists public.studio_project_messages (
  id uuid primary key default gen_random_uuid(), project_id uuid, sender_id uuid,
  is_internal boolean not null default false, created_at timestamptz not null default now());
-- Deferred money-adjacent (keeps the broad hole here on purpose — proves the
-- generic class guard's allowlist tolerates the documented deferral):
create table if not exists public.studio_payments (
  id uuid primary key default gen_random_uuid(), project_id uuid, client_user_id uuid,
  status text, created_at timestamptz not null default now());

alter table public.trust_flags             enable row level security;
alter table public.jobs_applications        enable row level security;
alter table public.studio_leads             enable row level security;
alter table public.hub_homepage_content     enable row level security;
alter table public.platform_countries       enable row level security;
alter table public.studio_deliverables      enable row level security;
alter table public.studio_project_messages  enable row level security;
alter table public.studio_payments          enable row level security;

-- The standing prod write grant to the request roles (latent half of the hole).
grant select, insert, update, delete, truncate on table
  public.trust_flags, public.jobs_applications, public.studio_leads,
  public.hub_homepage_content, public.platform_countries, public.studio_deliverables,
  public.studio_project_messages, public.studio_payments
  to anon, authenticated;
grant select, insert, update, delete, truncate on table
  public.trust_flags, public.jobs_applications, public.studio_leads,
  public.hub_homepage_content, public.platform_countries, public.studio_deliverables,
  public.studio_project_messages, public.studio_payments
  to service_role;

-- The world-writable "Service role full access" FOR ALL TO public USING(true) policy
-- (the hole) on every table.
do $$
declare t text;
  tbls text[] := array['trust_flags','jobs_applications','studio_leads','hub_homepage_content',
    'platform_countries','studio_deliverables','studio_project_messages','studio_payments'];
begin
  foreach t in array tbls loop
    execute format('drop policy if exists "Service role full access" on public.%I', t);
    execute format('create policy "Service role full access" on public.%I as permissive for all to public using (true) with check (true)', t);
  end loop;
end $$;

-- The scoped studio policies that already coexist on prod and must survive
-- (studio_member_* SELECT for the portal reads; the Cat-3 scoped write policies).
drop policy if exists studio_member_leads on public.studio_leads;
create policy studio_member_leads on public.studio_leads as permissive for select to public
  using (studio_is_staff() or user_id = (select auth.uid())
    or (normalized_email is not null and normalized_email = studio_auth_email()));

drop policy if exists studio_member_deliverables on public.studio_deliverables;
create policy studio_member_deliverables on public.studio_deliverables as permissive for select to public
  using (studio_is_staff());
drop policy if exists studio_staff_deliverables_write on public.studio_deliverables;
create policy studio_staff_deliverables_write on public.studio_deliverables as permissive for all to public
  using (studio_is_staff()) with check (studio_is_staff());
drop policy if exists studio_member_deliverables_approve on public.studio_deliverables;
create policy studio_member_deliverables_approve on public.studio_deliverables as permissive for update to public
  using (approved_by = (select auth.uid())) with check (approved_by = (select auth.uid()));

drop policy if exists studio_member_project_messages on public.studio_project_messages;
create policy studio_member_project_messages on public.studio_project_messages as permissive for select to public
  using (studio_is_staff());
drop policy if exists studio_member_messages_insert on public.studio_project_messages;
create policy studio_member_messages_insert on public.studio_project_messages as permissive for insert to public
  with check (sender_id = (select auth.uid()));
drop policy if exists studio_member_messages_update on public.studio_project_messages;
create policy studio_member_messages_update on public.studio_project_messages as permissive for update to public
  using (sender_id = (select auth.uid())) with check (sender_id = (select auth.uid()));

-- studio_payments scoped policies (mirror prod) — the deferred table keeps its hole.
drop policy if exists studio_member_payments_insert on public.studio_payments;
create policy studio_member_payments_insert on public.studio_payments as permissive for insert to public
  with check (client_user_id = (select auth.uid()));

-- The academy seed row, still bound to the RETIRED brand mailbox (pre-fix state).
-- learn_role_memberships exists from membership_min.sql; insert the stale seed row.
insert into public.learn_role_memberships (id, user_id, normalized_email, role, scope_type, is_active)
  values ('00000000-0000-4000-8000-000000001601', null, 'academy@henrycogroup.com', 'academy_owner', 'platform', true)
  on conflict (id) do update set normalized_email = excluded.normalized_email;

select 'world-writable data surface ready (broad policy + standing anon/authenticated write grant reproduce the prod hole; scoped studio policies + deferred studio_payments present)' as status;
