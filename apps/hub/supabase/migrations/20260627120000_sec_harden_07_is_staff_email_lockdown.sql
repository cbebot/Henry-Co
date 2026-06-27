-- SEC-HARDEN-07 — DB-layer counterpart of the email-OR app fix (PR #349).
--
-- ┌────────────────────────────────────────────────────────────────────────┐
-- │ STATUS: HELD / SCHEDULED — NOT launch-blocking. Belt-and-suspenders.    │
-- │ Apply after owner review during a normal migration window. Safe to sit  │
-- │ in the chain committed-not-applied until then (idempotent + guarded).   │
-- └────────────────────────────────────────────────────────────────────────┘
--
-- WHY IT IS NOT URGENT:
--   * The LIVE exploit path was the service-role app resolvers — fixed in
--     PR #349 (shared `membershipGrantsViewer` predicate; email branch now
--     requires user_id-null + a VERIFIED, matching mailbox).
--   * The cross-division SECDEF gates is_staff_in() / is_staff_in_any() —
--     which back the SSR staff gate — ALREADY match by user_id only.
--   * SEC-HARDEN-02 made the membership tables RLS deny-write + self-read only;
--     SEC-HARDEN-06 locked the public SECDEF surface; stranger reads are 0.
--   * Zero email-claimable (user_id IS NULL) seeds remain on prod.
--
-- THE RESIDUE THIS CLOSES:
--   learn_is_staff() and studio_is_staff() are SECURITY INVOKER and still grant
--   staff status when `membership.normalized_email = <jwt email>` with NO
--   user_id requirement — the same email-claimable seed shape. Their SEC-HARDEN-02
--   self-read policies ("learn own role memberships", "studio_member_roles")
--   expose the matching row to the caller. The database cannot verify mailbox
--   ownership (email-confirmation is not a JWT claim), so — unlike the app layer,
--   which gates on email_confirmed_at — the correct DB hardening is to REQUIRE
--   user_id binding: drop the email branch everywhere it grants staff. Any
--   email-bound (user_id-null) member must be (re)bound to a user_id; there are
--   none active on prod today, so this is behaviour-neutral now.
--
-- SCOPE: the two SECURITY INVOKER predicates + their self-read policies. The
-- SECDEF gates need no change. A broader sweep of any other `*_auth_email()`
-- consumers (e.g. learn_matches_identity / pass-21 policies) should ride a
-- follow-up; this file is intentionally limited to the is_staff() predicates the
-- hardening note called out.
--
-- Idempotent + existence-guarded (self-skips where a table is absent), so it is
-- safe on prod, on the prod-actual shadow, and on the CI fixture chain.

set check_function_bodies = off;

-- ── learn_is_staff(): require user_id binding (drop the email branch) ────────
create or replace function public.learn_is_staff()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.learn_role_memberships membership
    where membership.is_active = true
      and membership.user_id = auth.uid()
  );
$$;

-- ── studio_is_staff(): require user_id binding (keep the table guard) ────────
create or replace function public.studio_is_staff()
returns boolean
language plpgsql
stable
as $$
begin
  if to_regclass('public.studio_role_memberships') is null then
    return false;
  end if;

  return exists (
    select 1
    from public.studio_role_memberships membership
    where membership.is_active = true
      and membership.user_id = auth.uid()
  );
end;
$$;

-- ── learn self-read policy: drop the email branch ───────────────────────────
-- Mirrors learn_is_staff()'s new predicate so the INVOKER gate keeps resolving
-- the caller's own (user_id-bound) membership without re-entry recursion.
do $$
begin
  if to_regclass('public.learn_role_memberships') is not null then
    execute 'drop policy if exists "learn own role memberships" on public.learn_role_memberships';
    execute $pol$
      create policy "learn own role memberships" on public.learn_role_memberships
        as permissive for select to public
        using (user_id = (select auth.uid()))
    $pol$;
  end if;
end $$;

-- ── studio self-read policy: drop the email branch ──────────────────────────
do $$
begin
  if to_regclass('public.studio_role_memberships') is not null then
    execute 'drop policy if exists "studio_member_roles" on public.studio_role_memberships';
    execute $pol$
      create policy "studio_member_roles" on public.studio_role_memberships
        as permissive for select to public
        using (user_id = (select auth.uid()))
    $pol$;
  end if;
end $$;

-- end of migration --
