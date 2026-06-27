-- The Onyx Line WS-5 — Jobs candidate<->employer messaging goes realtime.
--
-- WHY:
--   The hiring DM thread (jobs_conversations / jobs_messages) is a live,
--   sanctioned channel but its surface is refresh-driven: new messages,
--   read-receipts and moderation flags only appear when the page reloads.
--   Bringing both tables onto the supabase_realtime publication lets the
--   shared messaging-thread engine stream inserts/updates the instant they
--   land — candidate and employer see each other's messages, read state and
--   flag changes without a refresh.
--
--   The base tables already carry live RLS (participant-scoped SELECT). We do
--   NOT redefine RLS here: realtime re-applies each table's SELECT policy, so
--   the stream stays participant-scoped automatically.
--
--   replica identity full makes UPDATE/DELETE payloads carry the whole row
--   (Postgres default ships only the primary key). The thread relies on
--   UPDATE broadcasts for read-receipts (is_read / read_at) and moderation
--   flags (is_flagged / flag_reason), so subscribers need the full new row.
--
--   Mirrors the existing apps/jobs/.../20260515123000_jobs_realtime_publication.sql
--   guarded foreach block. No table is created or altered in shape; no money
--   table is referenced.
--
-- IDEMPOTENT: yes — publication is created only if missing, each table is
--   added only when it exists and is not already a publication member, and
--   replica identity is set only when the table exists. Re-running is a no-op.

do $$
declare
  pub_name text := 'supabase_realtime';
  candidate_tables text[] := array[
    'jobs_conversations',
    'jobs_messages'
  ];
  t text;
begin
  -- Create the publication if Phase-7b realtime activation has not yet run on
  -- this database, so the thread tables can always be registered.
  if not exists (select 1 from pg_publication where pubname = pub_name) then
    execute format('create publication %I', pub_name);
    raise notice 'created publication %', pub_name;
  end if;

  foreach t in array candidate_tables loop
    if exists (
      select 1 from pg_tables
      where schemaname = 'public' and tablename = t
    ) and not exists (
      select 1 from pg_publication_tables
      where pubname = pub_name and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication %I add table public.%I', pub_name, t);
      raise notice 'added %.% to %', 'public', t, pub_name;
    end if;
  end loop;
end $$;

-- Full row images for UPDATE/DELETE so read-receipt and flag updates carry the
-- changed row to subscribers. Guarded by a table-exists check so the migration
-- is safe to run before the base schema lands.
do $$
declare
  identity_tables text[] := array[
    'jobs_conversations',
    'jobs_messages'
  ];
  t text;
begin
  foreach t in array identity_tables loop
    if exists (
      select 1 from pg_tables
      where schemaname = 'public' and tablename = t
    ) then
      execute format('alter table public.%I replica identity full', t);
      raise notice 'set replica identity full on %.%', 'public', t;
    end if;
  end loop;
end $$;

-- end of migration --
