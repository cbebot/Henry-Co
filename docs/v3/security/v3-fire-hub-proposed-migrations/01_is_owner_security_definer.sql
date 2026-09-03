-- V3-FIRE-HUB · HELD MIGRATION 01 (HUB-1)
-- Finding: public.is_owner() is LANGUAGE sql STABLE + SECURITY INVOKER. Its body reads
--   public.owner_profiles, whose RLS policy `owner_profiles_select_self_or_owner`
--   (auth.uid() = user_id OR is_owner()) re-invokes is_owner() for any NON-owner reader,
--   causing infinite RLS recursion -> "stack depth limit exceeded" (reproduced live
--   during the FIRE-HUB authenticated-stranger probe of owner_profiles).
--
-- Today this is masked because the application reads owner_profiles through the
-- service-role client (RLS bypassed). But any authenticated Data-API read of
-- owner_profiles errors (500) instead of returning an empty set, and the bug is a
-- latent DoS for any future RLS path that depends on owner_profiles for authenticated
-- users.
--
-- Fix: make is_owner() SECURITY DEFINER so the inner read runs as the function owner
-- and RLS is not re-applied (canonical Supabase membership-helper pattern). Body and
-- pinned search_path are preserved byte-for-byte from prod. EXECUTE is locked down.
--
-- POSTURE: READ-ONLY audit deliverable. DO NOT APPLY until architect re-verification.
-- Verify in a throwaway environment that authenticated reads of owner_profiles return
-- 0 rows (not an error) after this change, and that the single owner row still resolves.

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

-- SECURITY DEFINER functions must not be broadly executable.
revoke all on function public.is_owner() from public;
grant execute on function public.is_owner() to authenticated, service_role;
