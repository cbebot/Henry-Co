-- HUB security hardening (2026-07-10) — closes the four FIRE-HUB findings that
-- the F3 money-tranche audit named as prerequisites (HUB-1 + HUB-4 especially).
-- Verified against supabase/prod-actual/schema.sql: both owner_profiles and
-- hq_internal_comm_thread_members grant full CRUD to anon + authenticated, so
-- RLS is the ONLY gate today — these fixes tighten that gate. The app writes
-- both tables via service-role (createAdminSupabase), which is unaffected by
-- every change below.
--
-- Idempotent + safe to apply while live: no table rewrite, no data change.

-- ── HUB-1 — is_owner() recursion ────────────────────────────────────────────
-- is_owner() is SQL STABLE with a pinned search_path but NOT SECURITY DEFINER.
-- The owner_profiles policy `owner_profiles_owner_write ... using (is_owner())`
-- makes is_owner() read owner_profiles, which re-triggers owner_profiles RLS,
-- which calls is_owner() again → "stack depth limit exceeded" for any non-owner
-- Data-API read/write (masked today only because the app uses service-role).
-- SECURITY DEFINER makes the self-check read owner_profiles as the definer,
-- bypassing RLS and breaking the recursion — the exact idiom already used by
-- public.owner_inbox_is_owner() and public.founder_intelligence_is_owner().
-- The function is a boolean self-check on auth.uid(); it leaks no rows, so
-- keeping the default PUBLIC execute (required by the `to public` policies that
-- call it) is safe.
create or replace function public.is_owner()
returns boolean
language sql
stable
security definer
set search_path to 'public', 'pg_catalog'
as $function$
  select exists (
    select 1
    from public.owner_profiles op
    where op.user_id = auth.uid()
      and op.is_active = true
      and op.role in ('owner', 'admin')
  );
$function$;

-- ── HUB-2 — owner_profiles self-escalation ──────────────────────────────────
-- `owner_profiles_update_own` lets a row-owner UPDATE their own row with a
-- WITH CHECK that pins only auth.uid()=user_id — NOT role or is_active. Since
-- owner_profiles_role_check admits ('owner','editor','viewer'), an editor/viewer
-- row-owner could self-escalate to 'owner' (→ is_owner()=true) or reactivate a
-- deactivated row. Revoke UPDATE on exactly those two columns from the
-- Data-API roles: a self-update can still touch its other fields, but role and
-- is_active become service-role-only (the app already writes them that way).
revoke update (role, is_active) on public.owner_profiles from anon, authenticated;

-- ── HUB-3 — hq internal-comms self-elevation ────────────────────────────────
-- `hq_ic_members_insert`/`_update` let a user who can read a thread self-insert
-- or self-update their membership with an unconstrained `role` — so an active
-- owner/admin could self-join an all_owners thread as role='owner'/'admin' and
-- gain write/pin rights they were not granted. Make `role` service-role-write
-- only: a self-insert takes the safe column default ('member'); a self-update
-- cannot change role at all. Legitimate privileged members are created by the
-- app via service-role, which is unaffected.
revoke insert (role), update (role)
  on public.hq_internal_comm_thread_members
  from anon, authenticated;

-- HUB-4 (the requireOwner email-fallback) is a code-layer fix in the four owner
-- gates (email match honored only when the auth email is verified) — see the
-- accompanying app changes; no SQL is involved.
