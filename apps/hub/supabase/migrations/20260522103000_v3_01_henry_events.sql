-- V3-01 slice 5b — henry_events telemetry sink.
--
-- Owner-workspace session-health tile (slice 5) needs a queryable
-- table for the 5 V3-01 emit-event names. The existing
-- @henryco/observability/events.ts emitter writes to pino logs +
-- Sentry breadcrumbs only — neither is queryable from a Next.js
-- server component for owner UI.
--
-- This migration adds the minimal table the prompt's "henry_events
-- event sink" referenced. The naming, single-event-name index, and
-- nullable actor_id are deliberately conservative — the goal is a
-- queryable sink, not a competing analytics warehouse.
--
-- Scope contract:
--   - Insert: any authenticated user can insert events where actor_id
--     is null OR actor_id = auth.uid(). Application-side helper
--     (@henryco/observability/persistEvent) supplies actor_id when
--     known.
--   - Select: service_role only. Customers and staff cannot read each
--     other's session telemetry; the owner tile uses the admin
--     supabase client (createAdminSupabase) which bypasses RLS.
--
-- Retention: not enforced here. A separate retention pass (V3-90 /
-- V3-92 observability slices) can ship a cron prune.

create table if not exists public.henry_events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  actor_id uuid references auth.users (id) on delete set null,
  payload jsonb,
  created_at timestamptz not null default now()
);

-- Hot path: tile reads filtered by `name` over a 24h or 7d window.
create index if not exists henry_events_name_created_at_idx
  on public.henry_events (name, created_at desc);

-- Cold path: per-user telemetry inspection.
create index if not exists henry_events_actor_id_idx
  on public.henry_events (actor_id);

alter table public.henry_events enable row level security;

grant insert on table public.henry_events to authenticated;
grant select on table public.henry_events to service_role;

-- Authenticated users insert their own events (or anonymous ones
-- where actor_id is null). The writer must not be able to attribute
-- events to other users.
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'henry_events'
      and policyname = 'henry_events_insert_own'
  ) then
    create policy henry_events_insert_own
      on public.henry_events
      for insert
      to authenticated
      with check (actor_id is null or actor_id = auth.uid());
  end if;
end
$$;

-- Service-role-only read. The owner tile reads via the admin client.
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'henry_events'
      and policyname = 'henry_events_select_service_role'
  ) then
    create policy henry_events_select_service_role
      on public.henry_events
      for select
      to service_role
      using (true);
  end if;
end
$$;

comment on table public.henry_events is
  'V3-01 session-persistence telemetry sink. Backs the owner session-health tile. RLS: insert own; select service_role only.';
