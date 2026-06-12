-- SEC-HARDEN-01 — pre-FL2 security hardening (FL2 apply list, file 8).
--
-- Closes two of the three advisor findings the FL2 cutover must clear before
-- money goes live. Both are pure ACL / policy changes — NO function body is
-- altered, NO table/column DDL — so this is the lowest-risk possible increment
-- and cannot regress any money-path behaviour. The third finding
-- (auth_leaked_password_protection) is an Auth-service config toggle, not DDL —
-- enabled out-of-band at cutover and documented in docs/v3/fl2-apply-manifest.md
-- and .codex-temp/sec-harden-01/report.md (Management API field
-- `password_hibp_enabled = true`).
--
-- ─────────────────────────────────────────────────────────────────────────────
-- FINDING 1 — audit-log SECURITY DEFINER grant hole (same class as the V3-15
-- payment self-confirm hole). `add_audit_log` and `add_audit_log_v2` are
-- SECURITY DEFINER and, because Supabase's project bootstrap runs
--   `alter default privileges in schema public grant execute on functions
--    to anon, authenticated`,
-- every function in `public` is auto-granted EXECUTE to anon + authenticated
-- DIRECTLY (a `revoke … from public` alone does NOT remove these direct grants —
-- the load-bearing lesson from V3-15-FIX-01). Both audit writers are therefore
-- callable by any signed-in user (and anon) via /rest/v1/rpc/.
--
-- Caller analysis (decides the per-function fix — see report §1):
--   • public.add_audit_log(text,text,text,uuid,jsonb)
--       - Guard: ONLY `if auth.uid() is null then raise` — i.e. ANY authenticated
--         user (a customer!) can forge/flood arbitrary audit_logs rows with an
--         arbitrary entity_type/entity_id/target_user_id/metadata. No staff gate.
--       - Application callers: ZERO (grep of *.ts/*.tsx/*.js/*.mjs finds only the
--         auto-generated database.types.ts entry; every real caller uses _v2).
--       - Verdict: a real forge hole with no legitimate non-server caller →
--         SERVICE-ROLE-ONLY. anon + authenticated EXECUTE goes dead.
--
--   • public.add_audit_log_v2(text,text,text,jsonb,jsonb,text,text,uuid)
--       - Guard: `if not public.is_staff_in_any() then raise` — a non-staff
--         signed-in user is already rejected; actor_id is FORCED to auth.uid()
--         (unfakeable — a caller cannot supply a false actor).
--       - Application callers: authenticated STAFF operators, via the SSR
--         (cookie/authenticated) client — apps/studio/* and apps/logistics/*
--         route handlers rely on auth.uid() resolving to the acting operator.
--       - Verdict: a real caller proves signed-in (staff) users legitimately
--         need it, and it is ALREADY scoped tightly (staff gate + actor =
--         auth.uid()). This is the "scope it tightly" branch, not the
--         service-role-only branch. Keep `authenticated`; kill the anon reach
--         (no legitimate anon caller — anon only ever reaches the guard-raise).
--
-- Net end-state: anon EXECUTE dead on BOTH writers; authenticated EXECUTE dead
-- on v1 (the unguarded forge hole) and retained on v2 (the guarded staff path).
-- Asserted by apps/hub/supabase/tests/audit_grant_invariant.sql at the CI
-- position that follows this migration.
--
-- These REVOKE/GRANT statements are intentionally UNGUARDED: where this migration
-- is ever applied the two writers MUST already exist (they are live on prod,
-- out-of-band-applied with the is_staff_in_any migration; present in the
-- prod-actual shadow; created by the CI fixture audit_fns_min.sql before this
-- file). If a writer is missing the statement RAISES — a loud failure is correct
-- here; a silent skip could leave the hole open.

revoke execute on function public.add_audit_log(text, text, text, uuid, jsonb)
  from public, anon, authenticated;
grant execute on function public.add_audit_log(text, text, text, uuid, jsonb)
  to service_role;

revoke execute on function public.add_audit_log_v2(text, text, text, jsonb, jsonb, text, text, uuid)
  from public, anon;
grant execute on function public.add_audit_log_v2(text, text, text, jsonb, jsonb, text, text, uuid)
  to authenticated, service_role;

-- FINDING 1b — the SAME forge hole, via the DIRECT TABLE path. Locking the RPCs
-- is theatre on its own: `public.audit_logs` also carries a table INSERT grant to
-- anon + authenticated AND a permissive `with check (true)` INSERT policy
-- (`"insert audit logs (auth)"`), so any signed-in user can
-- `POST /rest/v1/audit_logs` with a FULLY ARBITRARY `actor_id` (worse than the RPC,
-- which forces actor_id = auth.uid()) and forge/flood the forensic table without
-- ever touching a function. (Found by the SEC-HARDEN-01 adversarial verification.)
--
-- Every legitimate writer uses the service-role admin client
-- (apps/jobs/lib/jobs/{write,notifications}.ts, apps/hub/lib/owner-reporting.ts) or
-- the SECURITY DEFINER RPCs above — which run as the table owner and bypass table
-- RLS/grants, so the staff audit path keeps working. No authenticated client inserts
-- directly (grep of *.ts/*.tsx confirms every audit_logs write is createAdminSupabase()).
-- Lock the forensic table to service-role writes: drop the always-true forge policy
-- and revoke the write privileges from anon + authenticated (SELECT is retained — the
-- staff/owner/self read policies are legitimate). Guarded on the table's presence
-- because audit_logs is prod out-of-band, absent on the vanilla CI grant chain (the
-- CI fixture audit_fns_min.sql reproduces it there).
do $$
begin
  if exists (
    select 1 from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'audit_logs'
  ) then
    execute 'drop policy if exists "insert audit logs (auth)" on public.audit_logs';
    execute 'revoke insert, update, truncate on table public.audit_logs from anon, authenticated';
  end if;
end $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- FINDING 3 — public `company-assets` bucket allows listing. The
-- `company_assets_public_read` policy is `FOR SELECT TO public USING (bucket_id =
-- 'company-assets')`, which lets any client enumerate every object in the bucket
-- (storage.objects SELECT == list). A PUBLIC bucket does NOT need this for object
-- access: the public object endpoint (/storage/v1/object/public/company-assets/…)
-- serves bytes by the bucket's `public = true` flag and BYPASSES storage.objects
-- RLS entirely. Dropping the broad SELECT policy kills enumeration while leaving
-- object-URL access untouched. The owner-only INSERT/UPDATE/DELETE policies are
-- retained — only the public listing grant is removed. No application code lists
-- this bucket (grep of *.ts/*.tsx finds zero storage `.list()`/`.download()`
-- callers; consumption is via public URLs only).
--
-- Guarded on the storage schema because it is absent on the vanilla CI grant
-- chain (which has no Storage); on prod and the prod-actual shadow storage.objects
-- and the policy exist, so the DROP runs there.
do $$
begin
  if exists (
    select 1 from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'storage' and c.relname = 'objects'
  ) then
    execute 'drop policy if exists company_assets_public_read on storage.objects';
  end if;
end $$;

-- end of migration --
