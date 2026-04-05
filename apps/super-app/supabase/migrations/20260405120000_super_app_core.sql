-- HenryCo Super App — core public schema (staging-first)
-- Apply with Supabase CLI: `supabase db push` against a staging project only.

create extension if not exists "pgcrypto";

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

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  phone text,
  country text,
  preferred_contact text,
  updated_at timestamptz not null default now()
);

create table if not exists public.contact_submissions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  email text not null,
  topic text not null,
  message text not null,
  division_slug text
);

alter table public.divisions enable row level security;
alter table public.profiles enable row level security;
alter table public.contact_submissions enable row level security;

create policy "divisions_select_public" on public.divisions
  for select using (true);

create policy "profiles_select_self" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles_update_self" on public.profiles
  for update using (auth.uid() = id);

create policy "profiles_insert_self" on public.profiles
  for insert with check (auth.uid() = id);

create policy "contact_insert_clients" on public.contact_submissions
  for insert to anon, authenticated
  with check (true);

-- Service role bypasses RLS for operational tooling.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

insert into public.divisions (slug, name, status, featured, summary, accent_hex, destination_url, sectors)
values
  ('fabric-care', 'Henry & Co. Fabric Care', 'active', true,
   'Premium dry-cleaning and laundry with pickup, tracking and polished garment care.',
   '#6B7CFF', 'https://care.henrycogroup.com', array['fabric_care']::text[]),
  ('studio', 'HenryCo Studio', 'active', true,
   'Websites, mobile apps, UI systems, branding, e-commerce, and custom software.',
   '#C9A227', 'https://studio.henrycogroup.com', array['technology','design']::text[]),
  ('marketplace', 'Henry & Co. Marketplace', 'active', true,
   'Premium multi-vendor commerce with trust signals and split-order clarity.',
   '#B2863B', 'https://marketplace.henrycogroup.com',
   array['commerce','marketplace','premium_retail','vendor_platforms']::text[]),
  ('jobs', 'HenryCo Jobs', 'active', true,
   'Hiring operating system for HenryCo and verified external employers.',
   '#2DD4BF', 'https://jobs.henrycogroup.com', array['general']::text[]),
  ('property', 'HenryCo Property', 'active', true,
   'Listings, viewing coordination, owner submissions, and managed-property services.',
   '#A78BFA', 'https://property.henrycogroup.com', array['property','real_estate']::text[]),
  ('learn', 'HenryCo Learn', 'active', true,
   'Public courses, internal training, certifications, and partner enablement.',
   '#38BDF8', 'https://learn.henrycogroup.com',
   array['education','academy','internal_training','certification']::text[]),
  ('logistics', 'HenryCo Logistics', 'active', true,
   'Pickup, dispatch, same-day and scheduled delivery with proof of delivery.',
   '#D06F32', 'https://logistics.henrycogroup.com', array['logistics','delivery']::text[]),
  ('buildings-interiors', 'Henry & Co. Buildings & Interiors', 'coming_soon', true,
   'Building materials, interior finishes, procurement, and engineering support — launching soon.',
   '#4F46E5', 'https://building.henrycogroup.com',
   array['building_materials','interior_finishes','construction_supply']::text[])
on conflict (slug) do update set
  name = excluded.name,
  status = excluded.status,
  featured = excluded.featured,
  summary = excluded.summary,
  accent_hex = excluded.accent_hex,
  destination_url = excluded.destination_url,
  sectors = excluded.sectors,
  updated_at = now();
