-- ============================================================================
-- FAITHFUL PROD CAPTURE — V3-RECONCILE-01 (2026-06-21)
-- prod migration: version=20260409054321  name=create_logistics_property_hub_tables
-- project: rzkbgwuznmdxnnhmjazy (HENRY ONYX)
-- classification: GENUINE_GAP (applied on prod; no app-folder migration file existed)
--
-- BYTE-FAITHFUL capture of the SQL prod actually applied for this migration
-- (supabase_migrations.schema_migrations.statements). Recorded so the repo
-- migration record mirrors prod. Like supabase/prod-actual/schema.sql this is a
-- REFERENCE capture: NOT part of any app auto-apply chain, and must NOT be
-- re-applied to prod (these objects already exist there). See
-- supabase/prod-actual/captured-migrations/README.md and
-- .codex-temp/v3-reconcile-01/report.md.
-- ============================================================================

-- Logistics role memberships
CREATE TABLE IF NOT EXISTS logistics_role_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  normalized_email text,
  is_active boolean NOT NULL DEFAULT true,
  role text NOT NULL DEFAULT 'viewer',
  scope_type text NOT NULL DEFAULT 'division',
  scope_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Logistics settings
CREATE TABLE IF NOT EXISTS logistics_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Logistics zones
CREATE TABLE IF NOT EXISTS logistics_zones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_key text NOT NULL UNIQUE,
  name text NOT NULL,
  summary text,
  city text,
  region text,
  base_fee bigint DEFAULT 0,
  same_day_multiplier numeric(5,2) DEFAULT 1.0,
  inter_city_multiplier numeric(5,2) DEFAULT 1.5,
  eta_hours_min int DEFAULT 1,
  eta_hours_max int DEFAULT 48,
  is_active boolean NOT NULL DEFAULT true,
  sort_order int DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Logistics rate cards
CREATE TABLE IF NOT EXISTS logistics_rate_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id uuid REFERENCES logistics_zones(id),
  service_type text NOT NULL,
  urgency text NOT NULL DEFAULT 'standard',
  base_amount bigint NOT NULL DEFAULT 0,
  weight_fee_per_kg bigint DEFAULT 0,
  fragile_fee bigint DEFAULT 0,
  size_surcharge bigint DEFAULT 0,
  manual_only boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Logistics shipments
CREATE TABLE IF NOT EXISTS logistics_shipments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tracking_code text UNIQUE,
  request_type text DEFAULT 'standard',
  service_type text,
  lifecycle_status text NOT NULL DEFAULT 'draft',
  payment_status text NOT NULL DEFAULT 'unpaid',
  pricing_status text NOT NULL DEFAULT 'pending',
  customer_user_id uuid REFERENCES auth.users(id),
  normalized_email text,
  sender_name text,
  sender_phone text,
  sender_email text,
  recipient_name text,
  recipient_phone text,
  recipient_email text,
  parcel_type text,
  parcel_description text,
  fragile boolean DEFAULT false,
  weight_kg numeric(10,2),
  size_tier text,
  urgency text DEFAULT 'standard',
  zone_id uuid REFERENCES logistics_zones(id),
  zone_label text,
  scheduled_pickup_at timestamptz,
  scheduled_delivery_at timestamptz,
  assigned_rider_user_id uuid,
  assigned_rider_name text,
  payment_reference text,
  amount_quoted bigint,
  amount_paid bigint,
  pricing_breakdown jsonb DEFAULT '{}'::jsonb,
  override_meta jsonb,
  support_summary text,
  requires_pod boolean DEFAULT false,
  last_event_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Logistics addresses
CREATE TABLE IF NOT EXISTS logistics_addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id uuid REFERENCES logistics_shipments(id) ON DELETE CASCADE,
  kind text NOT NULL,
  label text,
  contact_name text,
  phone text,
  email text,
  line1 text,
  line2 text,
  city text,
  region text,
  country text DEFAULT 'NG',
  landmark text,
  instructions text,
  latitude numeric(10,7),
  longitude numeric(10,7)
);

-- Logistics assignments
CREATE TABLE IF NOT EXISTS logistics_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id uuid REFERENCES logistics_shipments(id) ON DELETE CASCADE,
  rider_user_id uuid,
  rider_name text,
  rider_phone text,
  assigned_by_user_id uuid,
  assigned_by_name text,
  eta_committed_at timestamptz,
  status text NOT NULL DEFAULT 'assigned',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Logistics events
CREATE TABLE IF NOT EXISTS logistics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id uuid REFERENCES logistics_shipments(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  lifecycle_status text,
  title text,
  description text,
  actor_user_id uuid,
  actor_name text,
  actor_role text,
  meta jsonb DEFAULT '{}'::jsonb,
  customer_visible boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Logistics proof of delivery
CREATE TABLE IF NOT EXISTS logistics_proof_of_delivery (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id uuid REFERENCES logistics_shipments(id) ON DELETE CASCADE,
  recipient_name text,
  delivered_at timestamptz,
  proof_type text,
  note text,
  photo_path text,
  signature_path text,
  geo_lat numeric(10,7),
  geo_lng numeric(10,7),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Logistics issues
CREATE TABLE IF NOT EXISTS logistics_issues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id uuid REFERENCES logistics_shipments(id) ON DELETE CASCADE,
  severity text DEFAULT 'medium',
  status text NOT NULL DEFAULT 'open',
  issue_type text,
  summary text,
  details text,
  opened_by_user_id uuid,
  owner_user_id uuid,
  resolution text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Logistics expenses
CREATE TABLE IF NOT EXISTS logistics_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id uuid REFERENCES logistics_shipments(id),
  rider_user_id uuid,
  category text,
  amount bigint NOT NULL DEFAULT 0,
  currency text DEFAULT 'NGN',
  note text,
  receipt_path text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Logistics notifications
CREATE TABLE IF NOT EXISTS logistics_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id uuid REFERENCES logistics_shipments(id),
  channel text,
  template_key text,
  recipient text,
  subject text,
  status text NOT NULL DEFAULT 'queued',
  reason text,
  meta jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Property role memberships
CREATE TABLE IF NOT EXISTS property_role_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  normalized_email text,
  is_active boolean NOT NULL DEFAULT true,
  role text NOT NULL DEFAULT 'viewer',
  scope_type text NOT NULL DEFAULT 'division',
  scope_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Learn role memberships
CREATE TABLE IF NOT EXISTS learn_role_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  normalized_email text,
  is_active boolean NOT NULL DEFAULT true,
  role text NOT NULL DEFAULT 'viewer',
  scope_type text NOT NULL DEFAULT 'division',
  scope_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Hub homepage content
CREATE TABLE IF NOT EXISTS hub_homepage_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_key text NOT NULL UNIQUE DEFAULT 'home',
  hero_badge text,
  hero_title text,
  hero_highlight text,
  hero_description text,
  hero_image_url text,
  primary_cta_label text,
  primary_cta_href text,
  secondary_cta_label text,
  secondary_cta_href text,
  operating_title text,
  operating_body text,
  operating_points jsonb DEFAULT '[]'::jsonb,
  value_cards jsonb DEFAULT '[]'::jsonb,
  featured_title text,
  featured_body text,
  directory_title text,
  directory_body text,
  ecosystem_title text,
  ecosystem_body text,
  ecosystem_points jsonb DEFAULT '[]'::jsonb,
  owner_section_badge text,
  owner_section_title text,
  owner_name text,
  owner_role text,
  owner_message text,
  owner_image_url text,
  owner_signature text,
  faq_title text,
  faq_body text,
  faqs jsonb DEFAULT '[]'::jsonb,
  footer_blurb text,
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE logistics_role_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE logistics_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE logistics_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE logistics_rate_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE logistics_shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE logistics_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE logistics_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE logistics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE logistics_proof_of_delivery ENABLE ROW LEVEL SECURITY;
ALTER TABLE logistics_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE logistics_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE logistics_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_role_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE learn_role_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE hub_homepage_content ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Service role full access" ON logistics_role_memberships FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON logistics_settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON logistics_zones FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON logistics_rate_cards FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON logistics_shipments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON logistics_addresses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON logistics_assignments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON logistics_events FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON logistics_proof_of_delivery FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON logistics_issues FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON logistics_expenses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON logistics_notifications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON property_role_memberships FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON learn_role_memberships FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON hub_homepage_content FOR ALL USING (true) WITH CHECK (true);
