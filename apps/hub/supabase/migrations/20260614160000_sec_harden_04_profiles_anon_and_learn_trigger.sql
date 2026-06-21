-- SEC-HARDEN-04 (part A) — close the vestigial `profiles` anon-insert hole and fix
-- the pre-existing learn_role_memberships updated_at trigger bug.
--
-- APPLIES TO PROD on the owner's go (owner-gated) — NOT an FL2 file. ZERO contact
-- with money tables / money functions / the FL2 8-file set / payments_private. Pure
-- RLS-policy + table-grant surgery (profiles) + one trigger drop (learn). Idempotent,
-- forward-safe, existence-guarded (runs identically on prod, the prod-actual shadow,
-- and the CI fixture chain; self-skips where an object is absent). Apply via
--   supabase db query --linked --workdir apps/hub -f <this file>
-- never `supabase db push`.
--
-- The MONEY-ADJACENT third deferral from SEC-HARDEN-03 — studio_payments — is closed
-- by its OWN dedicated, money-flagged file (…_sec_harden_04_studio_payments_money_safe_lockdown.sql),
-- which requires explicit owner money-approval before the prod apply (it is money-input:
-- studio_payments.amount sizes a real customer_wallets debit). See
-- .codex-temp/sec-harden-04/report.md for the determination.
--
-- ─────────────────────────────────────────────────────────────────────────────
-- (1) profiles — "anon can insert profiles" (INSERT to anon, with_check = true).
--
-- THE HOLE: this policy lets ANY anonymous PostgREST caller insert an arbitrary
-- public.profiles row — including role = 'owner'/'manager'/'staff' — a real
-- privilege-injection vector reachable via `POST /rest/v1/profiles`. public.profiles
-- is the STAFF/owner profile table (columns role, wallet_balance_ngn, is_frozen,
-- force_reauth_after, …), distinct from public.customer_profiles (the customer table
-- the signup trigger writes).
--
-- WHY IT IS VESTIGIAL (proven — see report §profiles): customer signup never inserts
-- public.profiles — handle_new_customer() (SECURITY DEFINER) writes customer_profiles
-- / customer_wallets / customer_preferences / customer_notifications / customer_activity.
-- Every write to public.profiles in the codebase resolves to the SERVICE-ROLE admin
-- client (createAdminSupabase, rolbypassrls): care/lib/auth/staff-identity.ts (staff
-- identity sync UPDATE + INSERT), care owner/actions.ts (staff-deletion DELETE),
-- learn/workflows.ts updateLearnerPreferences (UPSERT). There is NO anon-client and NO
-- authenticated-client insert to public.profiles anywhere. FORENSICS: 0 of 17 prod
-- rows lack a matching auth.users row (never exploited); role distribution is the
-- expected staff/owner set.
--
-- THE FIX: drop the anon-insert policy and revoke anon's table-level DML grant
-- (defense in depth — anon has no legitimate write to profiles). The authenticated
-- self-service path (profiles_insert_own / profiles_update_own, with_check id =
-- auth.uid()) and the service_role admin path are left fully intact.
do $$
begin
  if to_regclass('public.profiles') is null then
    return;
  end if;
  drop policy if exists "anon can insert profiles" on public.profiles;
  -- Revoke only from anon (the unauthenticated role) — authenticated keeps its
  -- self-service grant (gated by the id = auth.uid() policies) and service_role keeps
  -- the admin path. anon retains no SELECT-meaningful access either ("no anon select
  -- profiles" denies it), so removing anon writes closes the hole with no behavioural
  -- loss.
  revoke insert, update, delete, truncate on table public.profiles from anon;
end $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- (2) learn_role_memberships — the pre-existing broken updated_at trigger.
--
-- THE BUG (flagged by SEC-HARDEN-03, worked around there with DISABLE TRIGGER): the
-- BEFORE UPDATE trigger `learn_role_memberships_updated_at` runs learn_set_updated_at(),
-- which assigns NEW.updated_at — but public.learn_role_memberships has NO updated_at
-- column. So EVERY update to the table raises
--   record "new" has no field "updated_at"
-- which silently breaks re-seeding learn memberships and any future membership update.
--
-- THE CONVENTION (proven read-only across the learn schema): every learn_* table has
-- BOTH an updated_at column AND a `*_updated_at` trigger, or NEITHER.
-- learn_role_memberships is the LONE anomaly — it has the trigger but no column. Its
-- sibling membership/state tables (learn_enrollments, learn_progress,
-- learn_saved_courses, …) carry created_at only, no updated_at, no trigger. So the
-- trigger is the accident, and the convention-aligned fix is to SCOPE THE TRIGGER OFF
-- this table (drop the trigger), NOT add a column (which would diverge from how this
-- class of learn table is designed and would require a types/baseline change).
--
-- The shared learn_set_updated_at() function is left untouched — it is correctly used
-- by the 11 learn tables that DO have an updated_at column.
--
-- Guard: act only when the table exists, the trigger exists, and there is still NO
-- updated_at column (so if the learn team later adds the column + keeps the trigger,
-- this migration is a safe no-op rather than dropping a then-valid trigger).
do $$
begin
  if to_regclass('public.learn_role_memberships') is null then
    return;
  end if;
  if exists (
        select 1 from pg_trigger t
        join pg_class c on c.oid = t.tgrelid
        join pg_namespace n on n.oid = c.relnamespace
        where n.nspname = 'public' and c.relname = 'learn_role_memberships'
          and t.tgname = 'learn_role_memberships_updated_at')
     and not exists (
        select 1 from information_schema.columns
        where table_schema = 'public' and table_name = 'learn_role_memberships'
          and column_name = 'updated_at')
  then
    drop trigger learn_role_memberships_updated_at on public.learn_role_memberships;
  end if;
end $$;

-- end of migration --
