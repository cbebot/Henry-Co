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
-- deactivated row. Make role + is_active service-role write-only.
--
-- CRITICAL (verified on prod 2026-07-11): a plain `revoke update (role, ...)`
-- is a NO-OP here because `authenticated` holds a TABLE-level UPDATE grant that
-- implicitly covers every column. The correct pattern is: revoke the
-- table-level grant, then re-grant UPDATE on the non-privileged columns only.
-- service_role keeps its own full grant, so the app (which writes owner_profiles
-- via service-role) is unaffected.
revoke update on public.owner_profiles from anon, authenticated;
grant update (email, full_name, updated_at) on public.owner_profiles to authenticated;

-- ── HUB-3 — hq internal-comms self-elevation ────────────────────────────────
-- `hq_ic_members_insert`/`_update` let a user who can read a thread self-insert
-- or self-update their membership with an unconstrained `role` — so an active
-- owner/admin could self-join an all_owners thread as role='owner'/'admin' and
-- gain write/pin rights they were not granted. Same table-grant caveat as
-- HUB-2: revoke the table INSERT/UPDATE, re-grant the non-`role` columns. A
-- self-insert then takes the safe 'member' column default; a self-update
-- touches only participant-preference columns. App writes (service-role) are
-- unaffected.
revoke insert on public.hq_internal_comm_thread_members from anon, authenticated;
grant insert (thread_id, user_id, last_read_at, pinned, muted, joined_at)
  on public.hq_internal_comm_thread_members to authenticated;
revoke update on public.hq_internal_comm_thread_members from anon, authenticated;
grant update (last_read_at, pinned, muted)
  on public.hq_internal_comm_thread_members to authenticated;

-- HUB-4 (the requireOwner email-fallback) is a code-layer fix in the four owner
-- gates (email match honored only when the auth email is verified) — see the
-- accompanying app changes; no SQL is involved.
