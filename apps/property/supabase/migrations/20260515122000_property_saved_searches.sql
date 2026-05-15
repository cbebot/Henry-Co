-- V3 PASS 21 — Property: saved searches + alert cadence.
--
-- WHY:
--   Saved-search alerts are a property-specific primitive
--   (per /docs/rebuild-prompts/property.md §DISTINCTIVE RULES item 2).
--   A user picks an area/price/bedroom filter and asks HenryCo Property
--   to ping when new listings match, when prices drop, or when a new
--   verified listing lands.
--
-- CRITERIA SHAPE (jsonb):
--   { "q"?: string, "kind"?: string, "area"?: string,
--     "managed"?: "1", "furnished"?: "1",
--     "minBeds"?: number, "maxBeds"?: number,
--     "minPrice"?: number, "maxPrice"?: number,
--     "verifiedOnly"?: boolean }
--
-- ALERT CADENCE:
--   instant — fire on first match (within the cron window)
--   daily   — at most one alert per 24h per saved search
--   weekly  — at most one alert per 7d per saved search
--   off     — paused; no alerts
--
-- RLS:
--   - User can read + manage own saved searches.
--   - Property staff can read all (for support).
--
-- IDEMPOTENT: yes.

create table if not exists public.property_saved_searches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  normalized_email text,
  name text not null default '',
  criteria jsonb not null default '{}'::jsonb,
  alert_cadence text not null default 'daily' check (
    alert_cadence in ('instant', 'daily', 'weekly', 'off')
  ),
  last_alert_at timestamptz,
  last_alert_count integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_property_saved_searches_user
  on public.property_saved_searches (user_id, is_active);

create index if not exists idx_property_saved_searches_due
  on public.property_saved_searches (alert_cadence, last_alert_at)
  where is_active;

alter table public.property_saved_searches enable row level security;

drop policy if exists "users can read own saved searches"
  on public.property_saved_searches;
create policy "users can read own saved searches"
on public.property_saved_searches
for select
using (auth.uid() = user_id or public.is_property_staff());

drop policy if exists "users can insert own saved searches"
  on public.property_saved_searches;
create policy "users can insert own saved searches"
on public.property_saved_searches
for insert
with check (auth.uid() = user_id);

drop policy if exists "users can update own saved searches"
  on public.property_saved_searches;
create policy "users can update own saved searches"
on public.property_saved_searches
for update
using (auth.uid() = user_id or public.is_property_staff())
with check (auth.uid() = user_id or public.is_property_staff());

drop policy if exists "users can delete own saved searches"
  on public.property_saved_searches;
create policy "users can delete own saved searches"
on public.property_saved_searches
for delete
using (auth.uid() = user_id or public.is_property_staff());

drop trigger if exists trg_property_saved_searches_updated_at
  on public.property_saved_searches;
create trigger trg_property_saved_searches_updated_at
before update on public.property_saved_searches
for each row execute function public.set_updated_at();
