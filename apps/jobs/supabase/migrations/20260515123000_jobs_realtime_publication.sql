-- V3 PASS 21 — Jobs realtime publication for the new V3 tables.
--
-- WHY:
--   Phase 7b activated the realtime spine across jobs pages. The new V3
--   tables added by this pass (interview rooms, offer letters, application
--   notes) need realtime broadcast so candidate / employer surfaces update
--   when state changes — e.g. offer signed, interview started, room
--   recording ready.
--
--   Verification ledgers (skill/experience/reference) opt in so the
--   candidate badge UI rerenders the moment a verifier decides.
--
-- IDEMPOTENT: yes — guarded by pg_publication_tables check.

do $$
declare
  pub_name text := 'supabase_realtime';
  candidate_tables text[] := array[
    'jobs_interview_rooms',
    'jobs_interview_room_events',
    'jobs_offer_letters',
    'jobs_offer_letter_events',
    'jobs_skill_verifications',
    'jobs_experience_verifications',
    'jobs_reference_checks',
    'jobs_application_notes',
    'jobs_pipeline_stages'
  ];
  t text;
begin
  if not exists (select 1 from pg_publication where pubname = pub_name) then
    raise notice 'publication % missing — skipping realtime adds', pub_name;
    return;
  end if;

  foreach t in array candidate_tables loop
    if exists (
      select 1 from information_schema.tables
      where table_schema = 'public' and table_name = t
    ) and not exists (
      select 1 from pg_publication_tables
      where pubname = pub_name and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication %I add table public.%I', pub_name, t);
      raise notice 'added %.% to %', 'public', t, pub_name;
    end if;
  end loop;
end $$;

-- end of migration --
