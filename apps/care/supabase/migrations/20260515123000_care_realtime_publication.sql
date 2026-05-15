-- V3 PASS 21 — Care: register operator tables to the Supabase Realtime
-- publication so /track + rider/staff workspaces can subscribe.
--
-- WHY:
--   /track and operator surfaces need realtime updates on booking
--   status transitions and POD captures. The publication is the
--   per-database object Realtime listens on; rows not on the
--   publication never broadcast.
--
-- TABLES JOINED:
--   - public.care_bookings (status + payment_status changes)
--   - public.care_pod_records (rider POD captures)
--   - public.care_booking_garments (per-garment status)
--   - public.care_claims (claim status transitions)
--   - public.care_recurring_schedules (status + paused_until)
--
-- IDEMPOTENT: yes.

do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
end$$;

do $$
declare
  v_table text;
  v_tables text[] := array[
    'care_bookings',
    'care_pod_records',
    'care_booking_garments',
    'care_claims',
    'care_recurring_schedules'
  ];
begin
  foreach v_table in array v_tables loop
    if exists (select 1 from pg_tables where schemaname = 'public' and tablename = v_table) then
      if not exists (
        select 1
        from pg_publication_tables
        where pubname = 'supabase_realtime'
          and schemaname = 'public'
          and tablename = v_table
      ) then
        execute format('alter publication supabase_realtime add table public.%I', v_table);
      end if;
    end if;
  end loop;
end$$;

-- end of migration --
