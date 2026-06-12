-- SEC-HARDEN-02 — close the world-writable role-membership privilege escalation.
--
-- APPLIES TO PROD NOW (owner-gated) — this is NOT an FL2 file. It touches ZERO
-- money tables / money functions / the FL2 8-file set; it is pure RLS-policy and
-- table-grant surgery, so it cannot regress any money-path behaviour and is safe
-- to apply ahead of the FL2 cutover. Idempotent + forward-safe + existence-guarded
-- (runs on prod, on the prod-actual shadow, and on the CI fixture chain; self-skips
-- where a table is absent).
--
-- ─────────────────────────────────────────────────────────────────────────────
-- THE HOLE (live on prod; confirmed read-only via pg_policies + forensics —
-- .codex-temp/sec-harden-02/report.md). Four membership tables carry a policy
-- LITERALLY NAMED "Service role full access" but authored
--   as permissive for all to PUBLIC using (true) with check (true)
-- i.e. it is NOT scoped to service_role at all — it grants EVERY anon /
-- authenticated caller full INSERT/UPDATE/DELETE over the table. Any signed-in
-- user can therefore `POST /rest/v1/{learn,logistics,property,studio}_role_memberships`
-- with `{ user_id: <self>, role: 'owner', is_active: true }` and instantly satisfy
-- the staff gate for that division — is_staff_in() / is_staff_in_any() /
-- learn_is_staff() / studio_is_staff() all read these tables — escalating a
-- customer to staff and bypassing the add_audit_log_v2 staff gate.
--
-- WHY THE POLICY IS PURE ACCIDENTAL DAMAGE: service_role carries the `bypassrls`
-- role attribute (verified: pg_roles.rolbypassrls = true), so the admin path never
-- needed an RLS policy in the first place — every legitimate membership read AND
-- write in the application goes through the service-role admin client
-- (createAdminSupabase(): apps/{learn,studio,property,logistics}/lib/*/auth.ts read;
-- apps/marketplace/app/api/* + seed scripts write). The "Service role full access"
-- policy's ONLY real effect was to grant the OPPOSITE of its name to anon +
-- authenticated. Dropping it removes the world-write and loses nothing.
--
-- THE FIX (per table): drop the world-writable policy + any authenticated
-- staff-WRITE policy (no authenticated write path to a membership table may exist,
-- by design — staff is granted ONLY via the owner/service-role path); replace with
-- a NON-RECURSIVE member self-read SELECT policy so the SECURITY INVOKER staff
-- gates (learn_is_staff / studio_is_staff read their table as the caller) keep
-- resolving the caller's own membership. is_staff_in() / is_staff_in_any() are
-- SECURITY DEFINER and bypass RLS, so the SSR staff gate is unaffected. Finally,
-- belt-and-suspenders, REVOKE the table-level write privileges from anon +
-- authenticated (the V3-15 / SEC-HARDEN-01 lesson: a permissive policy is not the
-- only attack surface; the standing grant is). SELECT is retained — the request
-- roles need the table privilege for the self-read policy and the INVOKER gates to
-- function. Asserted by apps/hub/supabase/tests/membership_grant_invariant.sql.
--
-- FORENSICS (read-only, pre-fix): logistics/property/studio membership tables hold
-- ZERO rows — the live hole was never used to plant staff there. marketplace holds
-- 7 internal-seed rows (single batch, @henrycogroup.com, email-bound; marketplace
-- was never RLS-exploitable — it has no permissive write policy). learn holds one
-- user-bound `instructor` row (chideraugwu124@gmail.com) that also carries
-- profiles.role='manager' — a value only an owner could set (the protect-profile
-- trigger blocks self-elevation), so it reads as manual admin onboarding, not
-- self-escalation. It is FLAGGED for the owner's confirmation and intentionally
-- left untouched here (a security migration must never silently mutate data).

set check_function_bodies = off;

-- ── learn_role_memberships ──────────────────────────────────────────────────
-- Drop: the world-writable "Service role full access"(true), and
-- "learn staff all role memberships" (FOR ALL using learn_is_staff()) — the latter
-- is BOTH an authenticated staff-write path (disallowed) AND would become an
-- infinite-recursion RLS qual once the broad true policy is gone (learn_is_staff()
-- SELECTs learn_role_memberships, which would re-enter this very policy). Replace
-- with a self-read that mirrors learn_is_staff()'s own predicate (user_id OR
-- normalized_email = learn_auth_email()) so both uid- and email-bound members
-- resolve their own staff status. learn_auth_email() reads the JWT (not the table)
-- → non-recursive.
do $$
begin
  if to_regclass('public.learn_role_memberships') is not null then
    execute 'drop policy if exists "Service role full access" on public.learn_role_memberships';
    execute 'drop policy if exists "learn staff all role memberships" on public.learn_role_memberships';
    execute 'drop policy if exists "learn own role memberships" on public.learn_role_memberships';
    execute $pol$
      create policy "learn own role memberships" on public.learn_role_memberships
        as permissive for select to public
        using (
          user_id = (select auth.uid())
          or (normalized_email is not null and normalized_email = public.learn_auth_email())
        )
    $pol$;
    execute 'revoke insert, update, delete, truncate on table public.learn_role_memberships from anon, authenticated, public';
  end if;
end $$;

-- ── studio_role_memberships ─────────────────────────────────────────────────
-- Drop only the world-writable broad policy. The existing self-read
-- "studio_member_roles" (user_id OR normalized_email = studio_auth_email()) already
-- covers studio_is_staff() (SECURITY INVOKER) and is non-recursive — keep it.
do $$
begin
  if to_regclass('public.studio_role_memberships') is not null then
    execute 'drop policy if exists "Service role full access" on public.studio_role_memberships';
    execute 'revoke insert, update, delete, truncate on table public.studio_role_memberships from anon, authenticated, public';
  end if;
end $$;

-- ── property_role_memberships ───────────────────────────────────────────────
-- Drop: the world-writable broad policy AND "staff can manage role memberships"
-- (FOR ALL using is_property_staff()) — an authenticated staff-WRITE path, which is
-- disallowed (is_property_staff() reads profiles, not this table, so there is no
-- recursion concern, but the write capability must still go). Add a self-read.
-- The staff gate for 'property' is is_staff_in() (SECURITY DEFINER) which bypasses
-- RLS, so staff resolution is unaffected; the app reads via the admin client.
do $$
begin
  if to_regclass('public.property_role_memberships') is not null then
    execute 'drop policy if exists "Service role full access" on public.property_role_memberships';
    execute 'drop policy if exists "staff can manage role memberships" on public.property_role_memberships';
    execute 'drop policy if exists "property own role memberships" on public.property_role_memberships';
    execute $pol$
      create policy "property own role memberships" on public.property_role_memberships
        as permissive for select to public
        using (user_id = (select auth.uid()))
    $pol$;
    execute 'revoke insert, update, delete, truncate on table public.property_role_memberships from anon, authenticated, public';
  end if;
end $$;

-- ── logistics_role_memberships ──────────────────────────────────────────────
-- Drop the world-writable broad policy (the table's only policy). No staff gate
-- reads this table (is_staff_in() resolves logistics via the legacy profiles
-- fallback, not a logistics membership union), and the app reads via the admin
-- client — so a self-read SELECT is added purely for least-surprise parity.
do $$
begin
  if to_regclass('public.logistics_role_memberships') is not null then
    execute 'drop policy if exists "Service role full access" on public.logistics_role_memberships';
    execute 'drop policy if exists "logistics own role memberships" on public.logistics_role_memberships';
    execute $pol$
      create policy "logistics own role memberships" on public.logistics_role_memberships
        as permissive for select to public
        using (user_id = (select auth.uid()))
    $pol$;
    execute 'revoke insert, update, delete, truncate on table public.logistics_role_memberships from anon, authenticated, public';
  end if;
end $$;

-- ── marketplace_role_memberships ────────────────────────────────────────────
-- Already safe at the policy layer: its only policy is the self-read
-- "marketplace_member_roles" (no permissive write policy → RLS already denies
-- authenticated/anon writes). But it still carries the standing anon/authenticated
-- write GRANT, which the membership-grant invariant forbids uniformly and which is
-- a latent hole if a permissive write policy is ever added. Revoke it for parity.
do $$
begin
  if to_regclass('public.marketplace_role_memberships') is not null then
    execute 'revoke insert, update, delete, truncate on table public.marketplace_role_memberships from anon, authenticated, public';
  end if;
end $$;

-- ── company_pages (escalation-adjacent class member, verified-safe) ──────────
-- Swept in the same class pass. "Authenticated users can manage company pages" is
-- FOR ALL TO authenticated using (true) with check (true) — it lets ANY signed-in
-- user rewrite the company's published legal/marketing pages (Terms, Privacy,
-- About). It is not privilege escalation but it is escalation-adjacent: an
-- integrity hole over legal content. It is also pure redundant danger — every
-- legitimate company_pages write in the monorepo goes through the service-role
-- admin client behind requireOwner() (apps/hub/app/api/owner/pages/route.ts,
-- apps/hub/lib/owner-actions.ts); the only authenticated-client access is a SELECT
-- in CompanyPageClient.tsx; apps/cms does not touch the table. The owner-scoped
-- policies (company_pages_owner_write using is_owner(), company_pages_owner_all)
-- and the public read policies remain and cover all real access. Drop the broad
-- write policy only.
do $$
begin
  if to_regclass('public.company_pages') is not null then
    execute 'drop policy if exists "Authenticated users can manage company pages" on public.company_pages';
  end if;
end $$;

-- end of migration --
