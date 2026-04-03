create extension if not exists pgcrypto;

create or replace function public.marketplace_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.marketplace_role_memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  normalized_email text,
  scope_type text not null default 'platform',
  scope_id uuid,
  role text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.marketplace_settings (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  value jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.marketplace_categories (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.marketplace_categories(id) on delete set null,
  slug text not null unique,
  name text not null,
  description text,
  hero_copy text,
  sort_order integer not null default 100,
  is_featured boolean not null default false,
  product_count integer not null default 0,
  filter_presets text[] not null default '{}',
  trust_notes text[] not null default '{}',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.marketplace_brands (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  accent text default '#B2863B',
  logo_url text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.marketplace_vendors (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  owner_user_id uuid references auth.users(id) on delete set null,
  owner_type text not null default 'vendor',
  status text not null default 'pending',
  verification_level text not null default 'bronze',
  trust_score numeric(5,2) not null default 0,
  response_sla_hours integer not null default 24,
  fulfillment_rate numeric(5,2) not null default 0,
  dispute_rate numeric(5,2) not null default 0,
  review_score numeric(4,2) not null default 0,
  followers_count integer not null default 0,
  accent text default '#B2863B',
  hero_image_url text,
  badges text[] not null default '{}',
  support_email text,
  support_phone text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.marketplace_vendor_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  normalized_email text,
  store_name text not null,
  proposed_store_slug text not null,
  legal_name text not null,
  contact_phone text,
  category_focus text,
  story text,
  status text not null default 'draft',
  review_note text,
  reviewed_by uuid references auth.users(id) on delete set null,
  submitted_at timestamptz,
  reviewed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.marketplace_products (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid references public.marketplace_vendors(id) on delete set null,
  category_id uuid references public.marketplace_categories(id) on delete set null,
  brand_id uuid references public.marketplace_brands(id) on delete set null,
  slug text not null unique,
  title text not null,
  summary text,
  description text,
  inventory_owner_type text not null default 'vendor',
  base_price integer not null default 0,
  compare_at_price integer,
  currency text not null default 'NGN',
  total_stock integer not null default 0,
  sku text not null,
  rating numeric(4,2) not null default 0,
  review_count integer not null default 0,
  featured boolean not null default false,
  approval_status text not null default 'draft',
  status text not null default 'active',
  trust_badges text[] not null default '{}',
  filter_data jsonb not null default '{}'::jsonb,
  specifications jsonb not null default '{}'::jsonb,
  delivery_note text,
  lead_time text,
  cod_eligible boolean not null default false,
  moderation_note text,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.marketplace_product_media (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.marketplace_products(id) on delete cascade,
  variant_id uuid,
  kind text not null default 'image',
  url text not null,
  public_id text,
  is_primary boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.marketplace_product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.marketplace_products(id) on delete cascade,
  sku text not null,
  options jsonb not null default '{}'::jsonb,
  price integer not null default 0,
  compare_at_price integer,
  stock integer not null default 0,
  status text not null default 'active',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.marketplace_collections (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text,
  kicker text,
  highlight text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.marketplace_collection_items (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid not null references public.marketplace_collections(id) on delete cascade,
  product_id uuid not null references public.marketplace_products(id) on delete cascade,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.marketplace_campaigns (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text,
  surface text not null default 'hero',
  accent text default '#B2863B',
  cta_label text,
  cta_href text,
  countdown_text text,
  status text not null default 'draft',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.marketplace_carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  normalized_email text,
  session_token text,
  status text not null default 'active',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.marketplace_cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.marketplace_carts(id) on delete cascade,
  product_id uuid not null references public.marketplace_products(id) on delete cascade,
  vendor_id uuid references public.marketplace_vendors(id) on delete set null,
  quantity integer not null default 1,
  price integer not null default 0,
  compare_at_price integer,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.marketplace_orders (
  id uuid primary key default gen_random_uuid(),
  order_no text not null unique,
  user_id uuid references auth.users(id) on delete set null,
  normalized_email text,
  status text not null default 'placed',
  payment_status text not null default 'pending',
  payment_method text not null default 'bank_transfer',
  currency text not null default 'NGN',
  subtotal integer not null default 0,
  shipping_total integer not null default 0,
  discount_total integer not null default 0,
  grand_total integer not null default 0,
  buyer_name text,
  buyer_email text,
  buyer_phone text,
  shipping_city text,
  shipping_region text,
  timeline jsonb not null default '[]'::jsonb,
  placed_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.marketplace_order_groups (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.marketplace_orders(id) on delete cascade,
  order_no text not null,
  vendor_id uuid references public.marketplace_vendors(id) on delete set null,
  owner_type text not null default 'vendor',
  fulfillment_status text not null default 'awaiting_acceptance',
  payment_status text not null default 'pending',
  payout_status text not null default 'eligible',
  subtotal integer not null default 0,
  commission_amount integer not null default 0,
  net_vendor_amount integer not null default 0,
  shipment_code text,
  shipment_carrier text,
  shipment_tracking_code text,
  delivered_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.marketplace_order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.marketplace_orders(id) on delete cascade,
  order_no text not null,
  order_group_id uuid references public.marketplace_order_groups(id) on delete cascade,
  product_id uuid references public.marketplace_products(id) on delete set null,
  vendor_id uuid references public.marketplace_vendors(id) on delete set null,
  quantity integer not null default 1,
  unit_price integer not null default 0,
  line_total integer not null default 0,
  title_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.marketplace_payment_records (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.marketplace_orders(id) on delete cascade,
  order_no text not null,
  provider text not null default 'manual',
  method text not null default 'bank_transfer',
  status text not null default 'pending',
  reference text not null unique,
  amount integer not null default 0,
  evidence_note text,
  verified_by uuid references auth.users(id) on delete set null,
  verified_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.marketplace_shipments (
  id uuid primary key default gen_random_uuid(),
  order_group_id uuid not null references public.marketplace_order_groups(id) on delete cascade,
  order_no text not null,
  shipment_no text not null unique,
  carrier text,
  tracking_code text,
  status text not null default 'pending',
  shipped_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.marketplace_discount_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  description text,
  discount_type text not null default 'fixed',
  discount_value integer not null default 0,
  min_order_total integer not null default 0,
  usage_limit integer,
  used_count integer not null default 0,
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.marketplace_addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  normalized_email text,
  label text,
  recipient_name text,
  phone text,
  line1 text not null,
  line2 text,
  city text not null,
  region text not null,
  country text not null default 'Nigeria',
  is_default boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.marketplace_wishlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  normalized_email text,
  product_id uuid references public.marketplace_products(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.marketplace_vendor_follows (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  normalized_email text,
  vendor_id uuid references public.marketplace_vendors(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.marketplace_recently_viewed (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  normalized_email text,
  product_id uuid references public.marketplace_products(id) on delete cascade,
  last_viewed_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.marketplace_user_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  normalized_email text,
  channel text not null default 'in_app',
  title text not null,
  body text not null,
  payload jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.marketplace_behavior_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  normalized_email text,
  event_type text not null,
  subject_type text,
  subject_id text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.marketplace_reviews (
  id uuid primary key default gen_random_uuid(),
  order_item_id uuid references public.marketplace_order_items(id) on delete set null,
  product_id uuid references public.marketplace_products(id) on delete cascade,
  vendor_id uuid references public.marketplace_vendors(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,
  buyer_name text,
  rating integer not null default 0,
  title text,
  body text,
  media jsonb not null default '[]'::jsonb,
  is_verified_purchase boolean not null default false,
  status text not null default 'pending',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.marketplace_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_user_id uuid references auth.users(id) on delete set null,
  subject_type text not null,
  subject_id text not null,
  reason text not null,
  details text,
  status text not null default 'open',
  assigned_to uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.marketplace_returns (
  id uuid primary key default gen_random_uuid(),
  order_item_id uuid references public.marketplace_order_items(id) on delete set null,
  reason text not null,
  details text,
  status text not null default 'requested',
  requested_at timestamptz not null default timezone('utc', now()),
  resolved_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.marketplace_disputes (
  id uuid primary key default gen_random_uuid(),
  dispute_no text not null unique,
  order_id uuid references public.marketplace_orders(id) on delete set null,
  order_no text not null,
  opened_by_user_id uuid references auth.users(id) on delete set null,
  normalized_email text,
  vendor_id uuid references public.marketplace_vendors(id) on delete set null,
  reason text not null,
  details text,
  status text not null default 'open',
  resolution_type text,
  refund_amount integer,
  assigned_to uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.marketplace_moderation_cases (
  id uuid primary key default gen_random_uuid(),
  subject_type text not null,
  subject_id text not null,
  queue text not null default 'general',
  status text not null default 'open',
  decision text,
  note text,
  assigned_to uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.marketplace_payout_requests (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  vendor_id uuid references public.marketplace_vendors(id) on delete cascade,
  amount integer not null default 0,
  status text not null default 'requested',
  requested_by uuid references auth.users(id) on delete set null,
  reviewed_by uuid references auth.users(id) on delete set null,
  review_note text,
  reviewed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.marketplace_notification_queue (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  normalized_email text,
  channel text not null,
  template_key text not null,
  recipient text not null,
  subject text,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'queued',
  entity_type text,
  entity_id text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.marketplace_audit_logs (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  actor_user_id uuid references auth.users(id) on delete set null,
  actor_email text,
  entity_type text,
  entity_id text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.marketplace_support_threads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  normalized_email text,
  subject text not null,
  status text not null default 'open',
  channel text not null default 'email',
  last_message text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.marketplace_support_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.marketplace_support_threads(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  normalized_email text,
  sender_type text not null default 'buyer',
  body text not null,
  attachment_url text,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists marketplace_role_memberships_user_idx on public.marketplace_role_memberships(user_id);
create index if not exists marketplace_role_memberships_email_idx on public.marketplace_role_memberships(normalized_email);
create index if not exists marketplace_products_vendor_idx on public.marketplace_products(vendor_id);
create index if not exists marketplace_products_category_idx on public.marketplace_products(category_id);
create index if not exists marketplace_orders_user_idx on public.marketplace_orders(user_id);
create index if not exists marketplace_orders_email_idx on public.marketplace_orders(normalized_email);
create index if not exists marketplace_disputes_user_idx on public.marketplace_disputes(opened_by_user_id);
create index if not exists marketplace_notifications_user_idx on public.marketplace_user_notifications(user_id);
create index if not exists marketplace_product_variants_product_idx on public.marketplace_product_variants(product_id);
create index if not exists marketplace_cart_items_cart_idx on public.marketplace_cart_items(cart_id);
create index if not exists marketplace_order_groups_order_idx on public.marketplace_order_groups(order_id);
create index if not exists marketplace_order_items_group_idx on public.marketplace_order_items(order_group_id);
create index if not exists marketplace_shipments_group_idx on public.marketplace_shipments(order_group_id);
create index if not exists marketplace_support_messages_thread_idx on public.marketplace_support_messages(thread_id);
create unique index if not exists marketplace_wishlist_unique_idx on public.marketplace_wishlists(user_id, product_id);
create unique index if not exists marketplace_follow_unique_idx on public.marketplace_vendor_follows(user_id, vendor_id);
create unique index if not exists marketplace_recent_unique_idx on public.marketplace_recently_viewed(user_id, product_id);
create unique index if not exists marketplace_role_memberships_scope_role_idx on public.marketplace_role_memberships(user_id, normalized_email, scope_type, coalesce(scope_id, '00000000-0000-0000-0000-000000000000'::uuid), role);

drop trigger if exists marketplace_role_memberships_updated_at on public.marketplace_role_memberships;
create trigger marketplace_role_memberships_updated_at before update on public.marketplace_role_memberships
for each row execute function public.marketplace_set_updated_at();

drop trigger if exists marketplace_settings_updated_at on public.marketplace_settings;
create trigger marketplace_settings_updated_at before update on public.marketplace_settings
for each row execute function public.marketplace_set_updated_at();

drop trigger if exists marketplace_categories_updated_at on public.marketplace_categories;
create trigger marketplace_categories_updated_at before update on public.marketplace_categories
for each row execute function public.marketplace_set_updated_at();

drop trigger if exists marketplace_brands_updated_at on public.marketplace_brands;
create trigger marketplace_brands_updated_at before update on public.marketplace_brands
for each row execute function public.marketplace_set_updated_at();

drop trigger if exists marketplace_vendors_updated_at on public.marketplace_vendors;
create trigger marketplace_vendors_updated_at before update on public.marketplace_vendors
for each row execute function public.marketplace_set_updated_at();

drop trigger if exists marketplace_vendor_applications_updated_at on public.marketplace_vendor_applications;
create trigger marketplace_vendor_applications_updated_at before update on public.marketplace_vendor_applications
for each row execute function public.marketplace_set_updated_at();

drop trigger if exists marketplace_products_updated_at on public.marketplace_products;
create trigger marketplace_products_updated_at before update on public.marketplace_products
for each row execute function public.marketplace_set_updated_at();

drop trigger if exists marketplace_collections_updated_at on public.marketplace_collections;
create trigger marketplace_collections_updated_at before update on public.marketplace_collections
for each row execute function public.marketplace_set_updated_at();

drop trigger if exists marketplace_product_variants_updated_at on public.marketplace_product_variants;
create trigger marketplace_product_variants_updated_at before update on public.marketplace_product_variants
for each row execute function public.marketplace_set_updated_at();

drop trigger if exists marketplace_campaigns_updated_at on public.marketplace_campaigns;
create trigger marketplace_campaigns_updated_at before update on public.marketplace_campaigns
for each row execute function public.marketplace_set_updated_at();

drop trigger if exists marketplace_carts_updated_at on public.marketplace_carts;
create trigger marketplace_carts_updated_at before update on public.marketplace_carts
for each row execute function public.marketplace_set_updated_at();

drop trigger if exists marketplace_cart_items_updated_at on public.marketplace_cart_items;
create trigger marketplace_cart_items_updated_at before update on public.marketplace_cart_items
for each row execute function public.marketplace_set_updated_at();

drop trigger if exists marketplace_orders_updated_at on public.marketplace_orders;
create trigger marketplace_orders_updated_at before update on public.marketplace_orders
for each row execute function public.marketplace_set_updated_at();

drop trigger if exists marketplace_order_groups_updated_at on public.marketplace_order_groups;
create trigger marketplace_order_groups_updated_at before update on public.marketplace_order_groups
for each row execute function public.marketplace_set_updated_at();

drop trigger if exists marketplace_payment_records_updated_at on public.marketplace_payment_records;
create trigger marketplace_payment_records_updated_at before update on public.marketplace_payment_records
for each row execute function public.marketplace_set_updated_at();

drop trigger if exists marketplace_shipments_updated_at on public.marketplace_shipments;
create trigger marketplace_shipments_updated_at before update on public.marketplace_shipments
for each row execute function public.marketplace_set_updated_at();

drop trigger if exists marketplace_discount_codes_updated_at on public.marketplace_discount_codes;
create trigger marketplace_discount_codes_updated_at before update on public.marketplace_discount_codes
for each row execute function public.marketplace_set_updated_at();

drop trigger if exists marketplace_addresses_updated_at on public.marketplace_addresses;
create trigger marketplace_addresses_updated_at before update on public.marketplace_addresses
for each row execute function public.marketplace_set_updated_at();

drop trigger if exists marketplace_reviews_updated_at on public.marketplace_reviews;
create trigger marketplace_reviews_updated_at before update on public.marketplace_reviews
for each row execute function public.marketplace_set_updated_at();

drop trigger if exists marketplace_reports_updated_at on public.marketplace_reports;
create trigger marketplace_reports_updated_at before update on public.marketplace_reports
for each row execute function public.marketplace_set_updated_at();

drop trigger if exists marketplace_returns_updated_at on public.marketplace_returns;
create trigger marketplace_returns_updated_at before update on public.marketplace_returns
for each row execute function public.marketplace_set_updated_at();

drop trigger if exists marketplace_disputes_updated_at on public.marketplace_disputes;
create trigger marketplace_disputes_updated_at before update on public.marketplace_disputes
for each row execute function public.marketplace_set_updated_at();

drop trigger if exists marketplace_moderation_cases_updated_at on public.marketplace_moderation_cases;
create trigger marketplace_moderation_cases_updated_at before update on public.marketplace_moderation_cases
for each row execute function public.marketplace_set_updated_at();

drop trigger if exists marketplace_payout_requests_updated_at on public.marketplace_payout_requests;
create trigger marketplace_payout_requests_updated_at before update on public.marketplace_payout_requests
for each row execute function public.marketplace_set_updated_at();

drop trigger if exists marketplace_notification_queue_updated_at on public.marketplace_notification_queue;
create trigger marketplace_notification_queue_updated_at before update on public.marketplace_notification_queue
for each row execute function public.marketplace_set_updated_at();

drop trigger if exists marketplace_support_threads_updated_at on public.marketplace_support_threads;
create trigger marketplace_support_threads_updated_at before update on public.marketplace_support_threads
for each row execute function public.marketplace_set_updated_at();
