-- SEC-HARDEN-01 — AFTER assertions (run after the migration is applied).
\set ON_ERROR_STOP on

do $$
declare v int := 0;
begin
  raise notice '=== AFTER migration ===';

  -- Finding 1 — add_audit_log (v1): SERVICE-ROLE-ONLY. anon + authenticated DEAD.
  if has_function_privilege('anon','public.add_audit_log(text,text,text,uuid,jsonb)','EXECUTE')          then raise warning 'FAIL: anon can still EXECUTE v1';          v:=v+1; end if;
  if has_function_privilege('authenticated','public.add_audit_log(text,text,text,uuid,jsonb)','EXECUTE') then raise warning 'FAIL: authenticated can still EXECUTE v1'; v:=v+1; end if;
  if not has_function_privilege('service_role','public.add_audit_log(text,text,text,uuid,jsonb)','EXECUTE') then raise warning 'FAIL: service_role lost EXECUTE on v1'; v:=v+1; end if;

  -- Finding 1 — add_audit_log_v2: SCOPED TIGHTLY. anon DEAD; authenticated (staff
  -- path) + service_role retained.
  if has_function_privilege('anon','public.add_audit_log_v2(text,text,text,jsonb,jsonb,text,text,uuid)','EXECUTE')          then raise warning 'FAIL: anon can still EXECUTE v2';          v:=v+1; end if;
  if not has_function_privilege('authenticated','public.add_audit_log_v2(text,text,text,jsonb,jsonb,text,text,uuid)','EXECUTE') then raise warning 'FAIL: authenticated lost EXECUTE on v2 (staff path broken)'; v:=v+1; end if;
  if not has_function_privilege('service_role','public.add_audit_log_v2(text,text,text,jsonb,jsonb,text,text,uuid)','EXECUTE') then raise warning 'FAIL: service_role lost EXECUTE on v2'; v:=v+1; end if;

  -- Finding 1b — direct-table forge path dead: anon + authenticated cannot INSERT
  -- audit_logs; service_role retains INSERT; the always-true forge policy is gone.
  if has_table_privilege('anon','public.audit_logs','INSERT')          then raise warning 'FAIL: anon can still INSERT audit_logs';          v:=v+1; end if;
  if has_table_privilege('authenticated','public.audit_logs','INSERT') then raise warning 'FAIL: authenticated can still INSERT audit_logs (direct forge)'; v:=v+1; end if;
  if not has_table_privilege('service_role','public.audit_logs','INSERT') then raise warning 'FAIL: service_role lost INSERT on audit_logs'; v:=v+1; end if;
  if exists (select 1 from pg_policies where schemaname='public' and tablename='audit_logs' and policyname='insert audit logs (auth)') then raise warning 'FAIL: always-true forge policy still present'; v:=v+1; end if;

  -- Finding 3 — listing killed, object access (owner writers) preserved.
  if exists (select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='company_assets_public_read') then raise warning 'FAIL: public listing policy still present'; v:=v+1; end if;
  if not exists (select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='company_assets_owner_insert') then raise warning 'FAIL: owner_insert policy was lost'; v:=v+1; end if;
  if not exists (select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='company_assets_owner_update') then raise warning 'FAIL: owner_update policy was lost'; v:=v+1; end if;
  if not exists (select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='company_assets_owner_delete') then raise warning 'FAIL: owner_delete policy was lost'; v:=v+1; end if;
  -- The bucket stays public (object-URL access path is the bucket flag, not RLS).
  if not exists (select 1 from storage.buckets where id='company-assets' and public) then raise warning 'FAIL: bucket no longer public'; v:=v+1; end if;

  if v > 0 then raise exception 'AFTER state FAILED (% checks) — the lockdown did not produce the intended end-state', v; end if;
  raise notice 'AFTER: EXPLOIT DEAD — v1 service-role-only; v2 staff-scoped (anon dead); audit_logs direct-table write service-role-only (forge policy dropped); company-assets listing removed, owner writers + public flag intact.';
end $$;
