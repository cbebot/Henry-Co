-- V3 PASS 21 — Property: realtime publication.
--
-- WHY:
--   Realtime channels power "your inquiry status changed", "your viewing
--   was confirmed", "new listing in your saved-area" in the account
--   dashboard. Add the property tables to the `supabase_realtime`
--   publication so the postgres-changes channel can stream them.
--
--   This migration is idempotent: it only attempts to add tables that
--   aren't yet in the publication.
--
-- IDEMPOTENT: yes (guarded with `do $$` block).

do $$
begin
  if exists (
    select 1 from pg_publication where pubname = 'supabase_realtime'
  ) then
    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'property_listings'
    ) then
      execute 'alter publication supabase_realtime add table public.property_listings';
    end if;

    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'property_inquiries'
    ) then
      execute 'alter publication supabase_realtime add table public.property_inquiries';
    end if;

    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'property_viewing_requests'
    ) then
      execute 'alter publication supabase_realtime add table public.property_viewing_requests';
    end if;

    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'property_saved_searches'
    ) then
      execute 'alter publication supabase_realtime add table public.property_saved_searches';
    end if;

    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'property_maintenance_tickets'
    ) then
      execute 'alter publication supabase_realtime add table public.property_maintenance_tickets';
    end if;
  end if;
end;
$$;
