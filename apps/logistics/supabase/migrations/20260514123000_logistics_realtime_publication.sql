-- V3 PASS 21 — Logistics: register operator tables to the Supabase
-- Realtime publication so /track + rider workspace can subscribe.
--
-- WHY:
--   /track and rider/active need realtime updates on shipment status
--   transitions and leg progression. The publication is the
--   per-database object Realtime listens on; rows not on the
--   publication never broadcast.
--
-- TABLES JOINED:
--   - public.logistics_shipments
--   - public.logistics_shipment_legs
--   - public.logistics_pod_records
--   - public.logistics_claims
--
-- IDEMPOTENT: yes — `create publication if not exists` + a defensive
-- "do nothing if already member" loop via pg_publication_tables.
--
-- DOWN:
--   alter publication supabase_realtime drop table public.logistics_shipments;
--   ...

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
    'logistics_shipments',
    'logistics_shipment_legs',
    'logistics_pod_records',
    'logistics_claims'
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
