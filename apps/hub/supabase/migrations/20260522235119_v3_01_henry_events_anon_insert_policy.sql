-- V3-01 slice 5b — anon-system insert policy for henry_events.
--
-- The base migration (20260522103000_v3_01_henry_events.sql) granted
-- INSERT to anon/authenticated/service_role but the RLS INSERT policy
-- was scoped `to authenticated` only. The session-refresh failure
-- path runs under the anon JWT (the user is by definition no longer
-- authenticated — that's the failure case), so persistEvent calls
-- for `henry.auth.session.refresh_failed` were silently rejected by
-- RLS and never landed in the table.
--
-- Symptom: T2 reauth-roundtrip E2E asserts >=1 refresh_failed row;
-- received 0 across all reruns. The A4 rollback-gate denominator
-- (refreshed + refresh_failed) was missing every real reauth event,
-- so the gate misread "within-gate" by undercounting failures.
--
-- Fix: a second policy that allows anon inserts ONLY for system
-- events with no actor (actor_id IS NULL). Authenticated insertion
-- is still the dominant path -- this policy covers the narrow window
-- between "refresh fails" and "anon redirect to reauth" where the
-- proxy needs to persist a telemetry row without a usable session.
--
-- Scope guarantees preserved:
--   - Anon inserts CANNOT attribute events to other users
--     (actor_id IS NULL is the only check that passes).
--   - Select is still service_role only -- no anon read path.

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'henry_events'
      and policyname = 'henry_events_insert_anon_system'
  ) then
    create policy henry_events_insert_anon_system
      on public.henry_events
      for insert
      to anon
      with check (actor_id is null);
  end if;
end
$$;
