-- V3 PASS 21 — Studio: register operator + client portal tables to the
-- Supabase Realtime publication.
--
-- WHY:
--   Studio /client + /pm + /sales need realtime updates on:
--     * project state transitions (status, milestone, owner)
--     * project_updates feed (new posts)
--     * messages thread (Phase 2 already wires this; ensure idempotent)
--     * revisions queue (PM sees client requests live; client sees
--       PM approvals live)
--     * proposal signatures (sales sees signed proposals appear live)
--     * asset pack status (client sees ready/expired transitions)
--   The publication is the per-database object Realtime listens on;
--   rows not on the publication never broadcast. Idempotent: no-op if
--   the table is already on the publication.
--
-- IDEMPOTENT: yes — `create publication if not exists` + a defensive
-- "do nothing if already member" loop via pg_publication_tables.
--
-- DOWN:
--   alter publication supabase_realtime drop table public.studio_projects;
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
    'studio_projects',
    'studio_project_updates',
    'studio_project_messages',
    'studio_project_milestones',
    'studio_revisions',
    'studio_proposal_signatures',
    'studio_asset_packs',
    'studio_payment_plans',
    'studio_payment_plan_releases',
    'studio_resource_allocations'
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
