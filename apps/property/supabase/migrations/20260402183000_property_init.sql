create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.property_role_memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null,
  normalized_email text null,
  role text not null check (
    role in (
      'property_owner',
      'listing_manager',
      'relationship_manager',
      'moderation',
      'support',
      'managed_ops',
      'property_admin'
    )
  ),
  scope_type text not null default 'platform',
  scope_id text null,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.property_agents (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  label text not null,
  phone text null,
  whatsapp text null,
  email text not null,
  photo_url text null,
  territories text[] not null default '{}',
  badges text[] not null default '{}',
  bio text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.property_listings (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  summary text not null default '',
  description text not null default '',
  kind text not null check (kind in ('rent', 'sale', 'commercial', 'managed', 'shortlet')),
  status text not null default 'draft' check (
    status in ('draft', 'submitted', 'changes_requested', 'approved', 'rejected', 'archived')
  ),
  visibility text not null default 'private' check (visibility in ('public', 'private')),
  location_slug text not null,
  location_label text not null,
  district text not null default '',
  address_line text not null default '',
  price numeric(14,2) not null default 0,
  currency text not null default 'NGN',
  price_interval text not null default 'per year',
  bedrooms integer null,
  bathrooms integer null,
  size_sqm integer null,
  parking_spaces integer null,
  furnished boolean not null default false,
  pet_friendly boolean not null default false,
  shortlet_ready boolean not null default false,
  managed_by_henryco boolean not null default false,
  featured boolean not null default false,
  promoted boolean not null default false,
  hero_image text null,
  gallery text[] not null default '{}',
  floor_plan_url text null,
  amenities text[] not null default '{}',
  trust_badges text[] not null default '{}',
  headline_metrics text[] not null default '{}',
  verification_notes text[] not null default '{}',
  available_from timestamptz null,
  available_now boolean not null default false,
  owner_user_id uuid null,
  normalized_email text null,
  owner_name text null,
  owner_phone text null,
  owner_email text null,
  agent_id uuid null references public.property_agents(id) on delete set null,
  listed_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.property_listing_media (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.property_listings(id) on delete cascade,
  media_url text not null,
  media_kind text not null default 'image',
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.property_amenities (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.property_listings(id) on delete cascade,
  label text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.property_inquiries (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.property_listings(id) on delete cascade,
  user_id uuid null,
  normalized_email text null,
  name text not null,
  email text not null,
  phone text null,
  message text not null default '',
  status text not null default 'new' check (
    status in ('new', 'acknowledged', 'assigned', 'in_progress', 'closed')
  ),
  assigned_agent_id uuid null references public.property_agents(id) on delete set null,
  source text not null default 'property_platform',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.property_viewing_requests (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.property_listings(id) on delete cascade,
  inquiry_id uuid null references public.property_inquiries(id) on delete set null,
  user_id uuid null,
  normalized_email text null,
  attendee_name text not null,
  attendee_phone text null,
  attendee_email text not null,
  preferred_date timestamptz not null,
  backup_date timestamptz null,
  scheduled_for timestamptz null,
  reminder_at timestamptz null,
  notes text not null default '',
  status text not null default 'requested' check (
    status in ('requested', 'scheduled', 'confirmed', 'completed', 'cancelled')
  ),
  assigned_agent_id uuid null references public.property_agents(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.property_listing_applications (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.property_listings(id) on delete cascade,
  user_id uuid null,
  normalized_email text null,
  applicant_name text not null,
  company_name text null,
  phone text null,
  email text not null,
  verification_docs jsonb not null default '[]'::jsonb,
  status text not null default 'submitted' check (
    status in ('submitted', 'under_review', 'approved', 'rejected')
  ),
  review_note text null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.property_managed_records (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  service_type text not null,
  status text not null default 'pipeline' check (status in ('active', 'pipeline', 'archived')),
  owner_name text not null,
  owner_email text null,
  location_label text not null,
  portfolio_value numeric(14,2) not null default 0,
  service_lines text[] not null default '{}',
  narrative text not null default '',
  assigned_manager_id uuid null references public.property_agents(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.property_featured_campaigns (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  surface text not null check (surface in ('hero', 'featured', 'managed', 'trust')),
  title text not null,
  description text not null default '',
  cta_label text not null,
  cta_href text not null,
  accent text null,
  listing_ids text[] not null default '{}',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.property_notifications (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id text null,
  channel text not null check (channel in ('email', 'whatsapp', 'in_app')),
  template_key text not null,
  recipient text not null,
  subject text not null,
  status text not null check (status in ('queued', 'sent', 'skipped', 'failed')),
  reason text null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.property_settings (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  value jsonb not null default '{}'::jsonb,
  updated_by uuid null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.property_saved_listings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  normalized_email text null,
  listing_id uuid not null references public.property_listings(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  unique (user_id, listing_id)
);

create index if not exists idx_property_listings_status on public.property_listings(status);
create index if not exists idx_property_listings_location on public.property_listings(location_slug);
create index if not exists idx_property_listings_owner on public.property_listings(owner_user_id, normalized_email);
create index if not exists idx_property_inquiries_listing on public.property_inquiries(listing_id);
create index if not exists idx_property_viewings_listing on public.property_viewing_requests(listing_id);
create index if not exists idx_property_notifications_entity on public.property_notifications(entity_type, entity_id);

drop trigger if exists trg_property_role_memberships_updated_at on public.property_role_memberships;
create trigger trg_property_role_memberships_updated_at
before update on public.property_role_memberships
for each row execute function public.set_updated_at();

drop trigger if exists trg_property_agents_updated_at on public.property_agents;
create trigger trg_property_agents_updated_at
before update on public.property_agents
for each row execute function public.set_updated_at();

drop trigger if exists trg_property_listings_updated_at on public.property_listings;
create trigger trg_property_listings_updated_at
before update on public.property_listings
for each row execute function public.set_updated_at();

drop trigger if exists trg_property_inquiries_updated_at on public.property_inquiries;
create trigger trg_property_inquiries_updated_at
before update on public.property_inquiries
for each row execute function public.set_updated_at();

drop trigger if exists trg_property_viewings_updated_at on public.property_viewing_requests;
create trigger trg_property_viewings_updated_at
before update on public.property_viewing_requests
for each row execute function public.set_updated_at();

drop trigger if exists trg_property_applications_updated_at on public.property_listing_applications;
create trigger trg_property_applications_updated_at
before update on public.property_listing_applications
for each row execute function public.set_updated_at();

drop trigger if exists trg_property_managed_records_updated_at on public.property_managed_records;
create trigger trg_property_managed_records_updated_at
before update on public.property_managed_records
for each row execute function public.set_updated_at();

drop trigger if exists trg_property_campaigns_updated_at on public.property_featured_campaigns;
create trigger trg_property_campaigns_updated_at
before update on public.property_featured_campaigns
for each row execute function public.set_updated_at();

drop trigger if exists trg_property_settings_updated_at on public.property_settings;
create trigger trg_property_settings_updated_at
before update on public.property_settings
for each row execute function public.set_updated_at();
