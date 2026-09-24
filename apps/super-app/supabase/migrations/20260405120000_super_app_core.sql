-- HenryCo Super App — core public schema (staging-first)
-- Apply one file at a time (MCP apply_migration / SQL editor); never `supabase db push`
-- (docs/v3/ACTIVATION-RUNBOOK-2026-09-24.md §2).
--
-- V3-ACTIVATION-RUNBOOK-FIX-01 (2026-09-24) — repaired against prod-actual:
--   * REMOVED the public.profiles table/policies, handle_new_user() and the
--     on_auth_user_created trigger. Those are PLATFORM-owned and already live on
--     prod (supabase/prod-actual/schema.sql: profiles + its RLS policies,
--     handle_new_user() inserting id/role='customer'/full_name/phone/is_active,
--     trigger on auth.users). The old two-column body here would have REPLACED
--     the live signup function, and because profiles.role is NOT NULL with no
--     default, every signup would have failed (shadow-proven:
--     `null value in column "role" of relation "profiles"`). The super-app
--     client never reads profiles through this file (it uses divisions +
--     contact_submissions only), so nothing is lost.
--   * REMOVED `create extension pgcrypto`: gen_random_uuid() is core since PG13,
--     and on Supabase the extension lives in the `extensions` schema.
--   * Policies are drop-if-exists + create, so the file is re-runnable.
--   * contact_submissions is bounded rather than `with check (true)`: raw
--     char_length caps + non-whitespace content, enforced both as table CHECKs
--     (covers service-role writes too) and in the insert policy.
--   * Grants are explicit: anon/authenticated get divisions SELECT and a
--     COLUMN-level contact_submissions INSERT (name, email, topic, message,
--     division_slug) — clients cannot choose id or backdate created_at.
--   * The division seed is insert-if-missing (`on conflict do nothing`), so a
--     re-apply never overwrites operator edits to existing divisions.

create table if not exists public.divisions (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  status text not null default 'active',
  featured boolean not null default false,
  summary text,
  accent_hex text,
  destination_url text,
  sectors text[] default '{}',
  updated_at timestamptz not null default now()
);

create table if not exists public.contact_submissions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null
    constraint contact_submissions_name_bounded
    check (char_length(name) between 1 and 200 and btrim(name, E' \t\r\n') <> ''),
  email text not null
    constraint contact_submissions_email_shape
    check (char_length(email) between 3 and 320 and position('@' in email) > 1),
  topic text not null
    constraint contact_submissions_topic_bounded
    check (char_length(topic) between 1 and 200 and btrim(topic, E' \t\r\n') <> ''),
  message text not null
    constraint contact_submissions_message_bounded
    check (char_length(message) between 1 and 5000 and btrim(message, E' \t\r\n') <> ''),
  division_slug text
    constraint contact_submissions_division_slug_bounded
    check (division_slug is null or char_length(division_slug) <= 64)
);

alter table public.divisions enable row level security;
alter table public.contact_submissions enable row level security;

revoke all on table public.divisions from anon, authenticated;
revoke all on table public.contact_submissions from anon, authenticated;
grant select on table public.divisions to anon, authenticated;
grant insert (name, email, topic, message, division_slug)
  on table public.contact_submissions to anon, authenticated;

drop policy if exists "divisions_select_public" on public.divisions;
create policy "divisions_select_public" on public.divisions
  for select to anon, authenticated
  using (true);

drop policy if exists "contact_insert_clients" on public.contact_submissions;
create policy "contact_insert_clients" on public.contact_submissions
  for insert to anon, authenticated
  with check (
    char_length(name) between 1 and 200 and btrim(name, E' \t\r\n') <> ''
    and char_length(email) between 3 and 320 and position('@' in email) > 1
    and char_length(topic) between 1 and 200 and btrim(topic, E' \t\r\n') <> ''
    and char_length(message) between 1 and 5000 and btrim(message, E' \t\r\n') <> ''
    and (division_slug is null or char_length(division_slug) <= 64)
  );

-- Service role bypasses RLS for operational tooling.

insert into public.divisions (slug, name, status, featured, summary, accent_hex, destination_url, sectors)
values
  ('fabric-care', 'Henry Onyx Fabric Care', 'active', true,
   'Premium dry-cleaning and laundry with pickup, tracking and polished garment care.',
   '#6B7CFF', 'https://care.henryonyx.com', array['fabric_care']::text[]),
  ('studio', 'Henry Onyx Studio', 'active', true,
   'Websites, mobile apps, UI systems, branding, e-commerce, and custom software.',
   '#C9A227', 'https://studio.henryonyx.com', array['technology','design']::text[]),
  ('marketplace', 'Henry Onyx Marketplace', 'active', true,
   'Premium multi-vendor commerce with trust signals and split-order clarity.',
   '#B2863B', 'https://marketplace.henryonyx.com',
   array['commerce','marketplace','premium_retail','vendor_platforms']::text[]),
  ('jobs', 'Henry Onyx Jobs', 'active', true,
   'Hiring operating system for Henry Onyx and verified external employers.',
   '#2DD4BF', 'https://jobs.henryonyx.com', array['general']::text[]),
  ('property', 'Henry Onyx Property', 'active', true,
   'Listings, viewing coordination, owner submissions, and managed-property services.',
   '#A78BFA', 'https://property.henryonyx.com', array['property','real_estate']::text[]),
  ('learn', 'Henry Onyx Learn', 'active', true,
   'Public courses, internal training, certifications, and partner enablement.',
   '#38BDF8', 'https://learn.henryonyx.com',
   array['education','academy','internal_training','certification']::text[]),
  ('logistics', 'Henry Onyx Logistics', 'active', true,
   'Pickup, dispatch, same-day and scheduled delivery with proof of delivery.',
   '#D06F32', 'https://logistics.henryonyx.com', array['logistics','delivery']::text[]),
  ('buildings-interiors', 'Henry Onyx Buildings & Interiors', 'coming_soon', true,
   'Building materials, interior finishes, procurement, and engineering support — launching soon.',
   '#4F46E5', 'https://building.henryonyx.com',
   array['building_materials','interior_finishes','construction_supply']::text[])
on conflict (slug) do nothing;
