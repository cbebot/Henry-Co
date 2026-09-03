-- SEC-HARDEN-03 — close the world-writable data-table class.
--
-- APPLIES TO PROD on the owner's go (owner-gated) — this is NOT an FL2 file. It
-- touches ZERO money tables / money functions / the FL2 8-file set; it is pure
-- RLS-policy and table-grant surgery + one brand-reconciliation data update, so it
-- cannot regress any money-path behaviour and is money-isolated. Idempotent +
-- forward-safe + existence-guarded (runs on prod, on the prod-actual shadow, and on
-- the CI fixture chain; self-skips where a table is absent). Apply via
--   supabase db query --linked --workdir apps/hub -f <this file>
-- never `supabase db push` (which would also push the FL2 money set).
--
-- ─────────────────────────────────────────────────────────────────────────────
-- THE CLASS (live on prod; confirmed read-only via pg_policies + per-table writer
-- analysis — .codex-temp/sec-harden-03/report.md). The same policy LITERALLY NAMED
-- "Service role full access" but authored
--   as permissive for all to PUBLIC using (true) with check (true)
-- exists on 40 non-membership data tables (SEC-HARDEN-02 closed the 4 membership
-- tables of the same shape). It is NOT scoped to service_role: it grants EVERY anon
-- / authenticated caller full INSERT/UPDATE/DELETE over the table. This is a data
-- integrity / confidentiality hole (a customer could clear their own trust_flags,
-- self-credit referral_rewards, tamper with jobs/logistics/studio records), NOT a
-- privilege escalation (that was SEC-HARDEN-02).
--
-- WHY THE POLICY IS PURE ACCIDENTAL DAMAGE: service_role carries `bypassrls`
-- (pg_roles.rolbypassrls = true), so the admin path never needed an RLS policy.
-- Every legitimate write in the monorepo goes through the service-role admin client
-- (createAdminSupabase()), applying ownership filters in application code; the few
-- genuine authenticated writes (studio project messages, deliverable approval) are
-- covered by their OWN scoped policies. The "Service role full access" policy's only
-- real effect was to grant the OPPOSITE of its name to anon + authenticated.
--
-- FORENSICS (read-only, pre-fix): every FK-orphan check across the live studio +
-- logistics tables returned ZERO; the prime abuse targets (trust_flags, referrals,
-- referral_rewards, all jobs_* PII) are ALL 0 rows — the hole was never exploited.
-- studio carries normal business volume written by the service-role app. See report.
--
-- PER-TABLE DISPOSITION (derived from the writer/reader analysis):
--  * Cat-1 service-role-only (no authenticated reader or writer): DROP the broad
--    policy + REVOKE writes from anon/authenticated/public. For studio Cat-1 tables
--    the existing scoped studio_member_* SELECT policies (+ the retained SELECT
--    grant) keep the customer portal reads working; for non-studio Cat-1 tables RLS
--    then denies request roles entirely (most secure) while service_role bypasses.
--  * Cat-2 public reference read (hub_homepage_content read by the anon client;
--    platform_countries reference data): DROP the broad policy, ADD a public SELECT,
--    REVOKE writes — preserve the read, close the write.
--  * Cat-3 legitimate authenticated writer (studio_deliverables: client approval +
--    staff; studio_project_messages: client insert + sender edit): DROP ONLY the
--    broad policy; the existing scoped write policies + grants remain the gate.
--  * DEFERRED (no change here): studio_payments (money-adjacent → dedicated
--    money-safe pass); audit_logs (owned by SEC-HARDEN-01 / FL2 file 8); profiles
--    "anon can insert profiles" (auth-core; proven vestigial — recommended for a
--    focused auth-safe follow-up, reported but not touched).

set check_function_bodies = off;

-- ── Category 1: full lockdown (service-role-only) ───────────────────────────
-- Drop the world-writable "Service role full access" policy and revoke the standing
-- write grant from the request roles. SELECT grant is retained (studio scoped-read
-- policies need it; for non-studio tables it is inert because no policy permits a
-- request-role read). service_role keeps every privilege and bypasses RLS.
do $$
declare
  t text;
  cat1 text[] := array[
    -- jobs (PII + hiring integrity)
    'jobs_applications','jobs_contact_masks','jobs_conversations','jobs_hiring_pipelines',
    'jobs_interviews','jobs_messages','jobs_moderation_queue',
    -- logistics (delivery + financial records)
    'logistics_addresses','logistics_assignments','logistics_events','logistics_expenses',
    'logistics_issues','logistics_notifications','logistics_proof_of_delivery','logistics_rate_cards',
    'logistics_settings','logistics_shipments','logistics_zones',
    -- referral (reward/self-credit fraud)
    'referral_programs','referral_rewards','referrals',
    -- trust (escalation-adjacent: self-clearing fraud flags)
    'trust_flags',
    -- platform (staff moderation queue; NOT public)
    'platform_moderation_queue',
    -- studio service-role-written tables (scoped studio_member_* SELECT policies survive)
    'studio_briefs','studio_custom_requests','studio_leads','studio_notifications',
    'studio_project_assignments','studio_project_files','studio_project_milestones',
    'studio_project_updates','studio_projects','studio_proposal_milestones','studio_proposals',
    'studio_reviews','studio_revisions'
  ];
begin
  foreach t in array cat1 loop
    if to_regclass('public.' || t) is not null then
      execute format('drop policy if exists "Service role full access" on public.%I', t);
      execute format('revoke insert, update, delete, truncate on table public.%I from anon, authenticated, public', t);
    end if;
  end loop;
end $$;

-- ── Category 2: public reference read preserved ─────────────────────────────
-- hub_homepage_content is read by the anonymous client (apps/hub homepage.ts);
-- platform_countries is non-confidential reference data. Replace the broad ALL
-- (which also conferred the write hole) with a read-only public SELECT, and revoke
-- the request-role write grant. Idempotent (drop the named read policy first).
do $$
declare
  t text;
  cat2 text[] := array['hub_homepage_content','platform_countries'];
begin
  foreach t in array cat2 loop
    if to_regclass('public.' || t) is not null then
      execute format('drop policy if exists "Service role full access" on public.%I', t);
      execute format('drop policy if exists %I on public.%I', t || ' public read', t);
      execute format('create policy %I on public.%I as permissive for select to public using (true)', t || ' public read', t);
      execute format('revoke insert, update, delete, truncate on table public.%I from anon, authenticated, public', t);
    end if;
  end loop;
end $$;

-- ── Category 3: legitimate authenticated writer — drop the broad policy only ──
-- studio_deliverables (studio_staff_deliverables_write ALL + studio_member_deliverables_approve
-- UPDATE) and studio_project_messages (studio_member_messages_insert + ..._update)
-- carry their own scoped write policies and a real authenticated write path. Dropping
-- the broad true policy closes the world-write while the scoped policies (which need
-- the retained grant) keep the legitimate client/staff writes working. RLS denies any
-- write that does not match a scoped policy. No grant change here.
do $$
declare
  t text;
  cat3 text[] := array['studio_deliverables','studio_project_messages'];
begin
  foreach t in array cat3 loop
    if to_regclass('public.' || t) is not null then
      execute format('drop policy if exists "Service role full access" on public.%I', t);
    end if;
  end loop;
end $$;

-- ── Academy seed brand reconciliation (service path; fold-in) ────────────────
-- learn_role_memberships holds the academy_owner platform seed (deterministic id
-- 0000…1601 = seedId(1601)) still bound to the RETIRED brand mailbox
-- academy@henrycogroup.com. The code seed (apps/learn/lib/learn/seed.ts) already
-- targets academy@henryonyx.com; prod simply never re-seeded after the Henry Onyx
-- brand migration. Re-point the mailbox to the current brand domain (a brand rename,
-- not an owner guess). user_id stays NULL (email-bound seed, as authored). Guarded by
-- the old email so it is idempotent and a no-op once reconciled. Reported for owner
-- awareness (.codex-temp/sec-harden-03/report.md); the user-bound instructor row is
-- the SEC-HARDEN-02 flagged row and is intentionally left untouched.
do $$
declare
  has_updated_at_trigger boolean;
begin
  if to_regclass('public.learn_role_memberships') is null then
    return;
  end if;
  -- Idempotent: act only while the stale row exists (no-op once reconciled).
  if not exists (
    select 1 from public.learn_role_memberships
    where id = '00000000-0000-4000-8000-000000001601'
      and normalized_email = 'academy@henrycogroup.com'
  ) then
    return;
  end if;
  -- ⚠️ PRE-EXISTING PROD BUG worked around here (reported for the learn team): the
  -- BEFORE UPDATE trigger learn_role_memberships_updated_at runs learn_set_updated_at(),
  -- which assigns NEW.updated_at — but public.learn_role_memberships has NO updated_at
  -- column, so EVERY update to this table currently raises
  -- `record "new" has no field "updated_at"` (re-seeding learn memberships is broken
  -- too). Root-cause fix is the learn team's call (add the column, or scope the trigger
  -- off this table) and is out of scope for this RLS pass. Suspend just that trigger for
  -- this single brand-reconciliation update, then restore it. Both ALTERs are
  -- transactional (a rollback restores the trigger); guarded by trigger existence so it
  -- is a plain update where the trigger is absent (the CI fixture chain). postgres is
  -- not a Supabase superuser, so session_replication_role is unavailable — DISABLE
  -- TRIGGER (table-owner privilege) is the portable mechanism.
  select exists (
    select 1 from pg_trigger t
    join pg_class c on c.oid = t.tgrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'learn_role_memberships'
      and t.tgname = 'learn_role_memberships_updated_at'
  ) into has_updated_at_trigger;

  if has_updated_at_trigger then
    execute 'alter table public.learn_role_memberships disable trigger learn_role_memberships_updated_at';
  end if;

  update public.learn_role_memberships
    set normalized_email = 'academy@henryonyx.com'
    where id = '00000000-0000-4000-8000-000000001601'
      and normalized_email = 'academy@henrycogroup.com';

  if has_updated_at_trigger then
    execute 'alter table public.learn_role_memberships enable trigger learn_role_memberships_updated_at';
  end if;
end $$;

-- end of migration --
