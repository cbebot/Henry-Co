-- V3 PASS 21 — Property: viewing reminder cycle + waitlist.
--
-- WHY:
--   The original property_viewing_requests has a single `reminder_at`.
--   The rebuild contract requires a 24h + 1h reminder cycle plus a
--   waitlist position for popular listings.
--
--   This migration:
--     - Adds reminder_24h_at, reminder_24h_sent_at, reminder_1h_at,
--       reminder_1h_sent_at columns.
--     - Adds waitlist_position (null for confirmed/scheduled viewings,
--       integer rank for waitlisted ones).
--     - Adds cancellation_reason, confirmed_at.
--     - Adds the matching index for the waitlist queue.
--
-- IDEMPOTENT: yes.

alter table public.property_viewing_requests
  add column if not exists reminder_24h_at timestamptz,
  add column if not exists reminder_24h_sent_at timestamptz,
  add column if not exists reminder_1h_at timestamptz,
  add column if not exists reminder_1h_sent_at timestamptz,
  add column if not exists confirmed_at timestamptz,
  add column if not exists cancellation_reason text,
  add column if not exists waitlist_position integer;

-- Expand the status enum to support waitlist + no_show.
do $$
begin
  if not exists (
    select 1
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    where t.relname = 'property_viewing_requests'
      and c.conname like 'property_viewing_requests_status_check%'
  ) then
    -- No-op; the original check constraint name varies between Supabase
    -- migrations. We still try to drop it conservatively below.
    null;
  end if;
end;
$$;

alter table public.property_viewing_requests
  drop constraint if exists property_viewing_requests_status_check;

alter table public.property_viewing_requests
  add constraint property_viewing_requests_status_check
  check (
    status in (
      'requested',
      'scheduled',
      'confirmed',
      'completed',
      'cancelled',
      'waitlisted',
      'no_show'
    )
  );

create index if not exists idx_property_viewings_reminder_24h
  on public.property_viewing_requests (reminder_24h_at)
  where reminder_24h_sent_at is null and status in ('scheduled', 'confirmed');

create index if not exists idx_property_viewings_reminder_1h
  on public.property_viewing_requests (reminder_1h_at)
  where reminder_1h_sent_at is null and status in ('scheduled', 'confirmed');

create index if not exists idx_property_viewings_waitlist
  on public.property_viewing_requests (listing_id, waitlist_position)
  where waitlist_position is not null;
