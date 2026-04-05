-- HenryCo Logistics: customer shipments, tracking events, and ops primitives.
-- Service-role access from the logistics app; no direct anon reads on these tables.

create table if not exists public.logistics_settings (
  id uuid primary key default gen_random_uuid(),
  key text not null,
  value jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists logistics_settings_key_uidx on public.logistics_settings (key);

create table if not exists public.logistics_zones (
  id uuid primary key default gen_random_uuid(),
  zone_key text not null unique,
  name text not null,
  summary text not null default '',
  city text not null default 'Enugu',
  region text not null default 'Enugu',
  base_fee numeric not null default 0,
  same_day_multiplier numeric not null default 1.25,
  inter_city_multiplier numeric not null default 1,
  eta_hours_min numeric not null default 2,
  eta_hours_max numeric not null default 8,
  is_active boolean not null default true,
  sort_order int not null default 100,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.logistics_rate_cards (
  id uuid primary key default gen_random_uuid(),
  zone_id uuid references public.logistics_zones(id) on delete set null,
  service_type text not null,
  urgency text not null,
  base_amount numeric not null default 0,
  weight_fee_per_kg numeric not null default 0,
  fragile_fee numeric not null default 0,
  size_surcharge numeric not null default 0,
  manual_only boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.logistics_shipments (
  id uuid primary key default gen_random_uuid(),
  tracking_code text not null unique,
  request_type text not null default 'booking',
  service_type text not null default 'scheduled',
  lifecycle_status text not null default 'quote_requested',
  payment_status text not null default 'not_required',
  pricing_status text not null default 'draft',
  customer_user_id uuid references auth.users(id) on delete set null,
  normalized_email text,
  sender_name text not null,
  sender_phone text,
  sender_email text,
  recipient_name text not null,
  recipient_phone text,
  recipient_email text,
  parcel_type text not null default 'Parcel',
  parcel_description text,
  fragile boolean not null default false,
  weight_kg numeric not null default 0,
  size_tier text not null default 'small',
  urgency text not null default 'standard',
  zone_id uuid references public.logistics_zones(id) on delete set null,
  zone_label text,
  scheduled_pickup_at timestamptz,
  scheduled_delivery_at timestamptz,
  assigned_rider_user_id uuid references auth.users(id) on delete set null,
  assigned_rider_name text,
  payment_reference text,
  amount_quoted numeric not null default 0,
  amount_paid numeric not null default 0,
  pricing_breakdown jsonb not null default '{}'::jsonb,
  override_meta jsonb not null default '{}'::jsonb,
  support_summary text,
  requires_pod boolean not null default true,
  last_event_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists logistics_shipments_customer_uidx on public.logistics_shipments (customer_user_id);
create index if not exists logistics_shipments_email_idx on public.logistics_shipments (normalized_email);
create index if not exists logistics_shipments_lifecycle_idx on public.logistics_shipments (lifecycle_status);

create table if not exists public.logistics_addresses (
  id uuid primary key default gen_random_uuid(),
  shipment_id uuid not null references public.logistics_shipments(id) on delete cascade,
  kind text not null,
  label text not null default '',
  contact_name text not null,
  phone text,
  email text,
  line1 text not null,
  line2 text,
  city text not null,
  region text not null,
  country text not null default 'Nigeria',
  landmark text,
  instructions text,
  latitude double precision,
  longitude double precision,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists logistics_addresses_shipment_idx on public.logistics_addresses (shipment_id);

create table if not exists public.logistics_assignments (
  id uuid primary key default gen_random_uuid(),
  shipment_id uuid not null references public.logistics_shipments(id) on delete cascade,
  rider_user_id uuid references auth.users(id) on delete set null,
  rider_name text,
  rider_phone text,
  assigned_by_user_id uuid references auth.users(id) on delete set null,
  assigned_by_name text,
  eta_committed_at timestamptz,
  status text not null default 'assigned',
  notes text,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.logistics_events (
  id uuid primary key default gen_random_uuid(),
  shipment_id uuid not null references public.logistics_shipments(id) on delete cascade,
  event_type text not null,
  lifecycle_status text,
  title text not null,
  description text not null default '',
  actor_user_id uuid references auth.users(id) on delete set null,
  actor_name text,
  actor_role text,
  meta jsonb not null default '{}'::jsonb,
  customer_visible boolean not null default true,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists logistics_events_shipment_idx on public.logistics_events (shipment_id);

create table if not exists public.logistics_proof_of_delivery (
  id uuid primary key default gen_random_uuid(),
  shipment_id uuid not null references public.logistics_shipments(id) on delete cascade,
  recipient_name text not null,
  delivered_at timestamptz not null,
  proof_type text not null default 'photo',
  note text,
  photo_path text,
  signature_path text,
  geo_lat double precision,
  geo_lng double precision,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.logistics_issues (
  id uuid primary key default gen_random_uuid(),
  shipment_id uuid not null references public.logistics_shipments(id) on delete cascade,
  severity text not null default 'medium',
  status text not null default 'open',
  issue_type text not null,
  summary text not null,
  details text not null default '',
  opened_by_user_id uuid references auth.users(id) on delete set null,
  owner_user_id uuid references auth.users(id) on delete set null,
  resolution text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.logistics_expenses (
  id uuid primary key default gen_random_uuid(),
  shipment_id uuid references public.logistics_shipments(id) on delete set null,
  rider_user_id uuid references auth.users(id) on delete set null,
  category text not null,
  amount numeric not null default 0,
  currency text not null default 'NGN',
  note text,
  receipt_path text,
  status text not null default 'submitted',
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.logistics_notifications (
  id uuid primary key default gen_random_uuid(),
  shipment_id uuid references public.logistics_shipments(id) on delete set null,
  channel text not null,
  template_key text not null,
  recipient text not null,
  subject text not null default '',
  status text not null default 'queued',
  reason text,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

-- Optional rider GPS breadcrumbs (populated only by real rider/dispatch sources).
create table if not exists public.logistics_tracking_points (
  id uuid primary key default gen_random_uuid(),
  shipment_id uuid not null references public.logistics_shipments(id) on delete cascade,
  latitude double precision not null,
  longitude double precision not null,
  accuracy_meters int,
  source text not null default 'rider_app',
  recorded_at timestamptz not null default timezone('utc', now())
);

create index if not exists logistics_tracking_points_shipment_idx on public.logistics_tracking_points (shipment_id, recorded_at desc);

alter table public.logistics_zones enable row level security;
alter table public.logistics_rate_cards enable row level security;
alter table public.logistics_shipments enable row level security;
alter table public.logistics_addresses enable row level security;
alter table public.logistics_assignments enable row level security;
alter table public.logistics_events enable row level security;
alter table public.logistics_proof_of_delivery enable row level security;
alter table public.logistics_issues enable row level security;
alter table public.logistics_expenses enable row level security;
alter table public.logistics_notifications enable row level security;
alter table public.logistics_settings enable row level security;
alter table public.logistics_tracking_points enable row level security;

insert into public.logistics_zones (zone_key, name, summary, city, region, base_fee, same_day_multiplier, inter_city_multiplier, eta_hours_min, eta_hours_max, is_active, sort_order)
values
  ('enugu_urban', 'Enugu Urban', 'Fast inner-city pickups and drops within the core urban delivery ring.', 'Enugu', 'Enugu', 3000, 1.25, 1, 2, 6, true, 10),
  ('enugu_outskirts', 'Enugu Outskirts', 'Extended metro edges and longer in-state dispatch lanes.', 'Enugu', 'Enugu', 4500, 1.35, 1.1, 4, 10, true, 20),
  ('other_igbo_states', 'Other Igbo States', 'Governed inter-city movement across nearby regional lanes.', 'Regional', 'South East', 8500, 1.5, 1.45, 8, 24, true, 30),
  ('intercity_priority', 'Inter-city Priority', 'Priority lane for governed same-day or next-window inter-city fulfillment.', 'Regional', 'Nigeria', 12000, 1.75, 1.65, 10, 36, true, 40)
on conflict (zone_key) do nothing;
