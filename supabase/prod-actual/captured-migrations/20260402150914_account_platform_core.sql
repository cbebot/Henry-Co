-- ============================================================================
-- FAITHFUL PROD CAPTURE — V3-RECONCILE-01 (2026-06-21)
-- prod migration: version=20260402150914  name=account_platform_core
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

-- ============================================================
-- HenryCo Unified Account Platform - Core Schema
-- ============================================================

-- 1. Customer Profiles (extends auth.users for customer-facing data)
CREATE TABLE IF NOT EXISTS customer_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  phone text,
  avatar_url text,
  date_of_birth date,
  gender text CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
  language text DEFAULT 'en',
  currency text DEFAULT 'NGN',
  timezone text DEFAULT 'Africa/Lagos',
  is_verified boolean DEFAULT false,
  is_active boolean DEFAULT true,
  last_seen_at timestamptz,
  onboarded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE customer_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON customer_profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON customer_profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Service role full access to customer_profiles" ON customer_profiles
  FOR ALL USING (auth.role() = 'service_role');

-- 2. Customer Preferences
CREATE TABLE IF NOT EXISTS customer_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  email_marketing boolean DEFAULT true,
  email_transactional boolean DEFAULT true,
  email_digest boolean DEFAULT false,
  push_enabled boolean DEFAULT true,
  sms_enabled boolean DEFAULT false,
  notification_care boolean DEFAULT true,
  notification_marketplace boolean DEFAULT true,
  notification_studio boolean DEFAULT true,
  notification_wallet boolean DEFAULT true,
  notification_security boolean DEFAULT true,
  theme text DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
  default_division text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE customer_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own preferences" ON customer_preferences
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own preferences" ON customer_preferences
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own preferences" ON customer_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Service role full access to customer_preferences" ON customer_preferences
  FOR ALL USING (auth.role() = 'service_role');

-- 3. Customer Wallets (ecosystem wallet)
CREATE TABLE IF NOT EXISTS customer_wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  balance_kobo bigint NOT NULL DEFAULT 0 CHECK (balance_kobo >= 0),
  currency text NOT NULL DEFAULT 'NGN',
  is_active boolean DEFAULT true,
  frozen_at timestamptz,
  frozen_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE customer_wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own wallet" ON customer_wallets
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role full access to customer_wallets" ON customer_wallets
  FOR ALL USING (auth.role() = 'service_role');

-- 4. Customer Wallet Transactions
CREATE TABLE IF NOT EXISTS customer_wallet_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id uuid NOT NULL REFERENCES customer_wallets(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('credit', 'debit', 'refund', 'transfer', 'bonus', 'cashback')),
  amount_kobo bigint NOT NULL CHECK (amount_kobo > 0),
  balance_after_kobo bigint NOT NULL,
  division text,
  reference_type text,
  reference_id text,
  description text NOT NULL,
  metadata jsonb DEFAULT '{}',
  status text NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'reversed')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE customer_wallet_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own wallet transactions" ON customer_wallet_transactions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role full access to customer_wallet_transactions" ON customer_wallet_transactions
  FOR ALL USING (auth.role() = 'service_role');

CREATE INDEX idx_cwt_wallet ON customer_wallet_transactions(wallet_id);
CREATE INDEX idx_cwt_user ON customer_wallet_transactions(user_id);
CREATE INDEX idx_cwt_created ON customer_wallet_transactions(created_at DESC);

-- 5. Customer Notifications
CREATE TABLE IF NOT EXISTS customer_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text NOT NULL,
  category text NOT NULL DEFAULT 'general' CHECK (category IN ('general', 'care', 'marketplace', 'studio', 'wallet', 'security', 'support', 'account', 'promotion')),
  priority text NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  action_url text,
  action_label text,
  division text,
  reference_type text,
  reference_id text,
  is_read boolean DEFAULT false,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE customer_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications" ON customer_notifications
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON customer_notifications
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Service role full access to customer_notifications" ON customer_notifications
  FOR ALL USING (auth.role() = 'service_role');

CREATE INDEX idx_cn_user ON customer_notifications(user_id);
CREATE INDEX idx_cn_unread ON customer_notifications(user_id, is_read) WHERE NOT is_read;
CREATE INDEX idx_cn_created ON customer_notifications(created_at DESC);

-- 6. Customer Addresses (extend existing pattern)
CREATE TABLE IF NOT EXISTS customer_addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label text NOT NULL DEFAULT 'Home',
  full_name text,
  phone text,
  address_line1 text NOT NULL,
  address_line2 text,
  city text NOT NULL,
  state text NOT NULL,
  postal_code text,
  country text NOT NULL DEFAULT 'NG',
  landmark text,
  lat double precision,
  lng double precision,
  is_default boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE customer_addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own addresses" ON customer_addresses
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Service role full access to customer_addresses" ON customer_addresses
  FOR ALL USING (auth.role() = 'service_role');

CREATE INDEX idx_ca_user ON customer_addresses(user_id);

-- 7. Cross-Division Activity Log
CREATE TABLE IF NOT EXISTS customer_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  division text NOT NULL,
  activity_type text NOT NULL,
  title text NOT NULL,
  description text,
  status text,
  reference_type text,
  reference_id text,
  amount_kobo bigint,
  metadata jsonb DEFAULT '{}',
  action_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE customer_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own activity" ON customer_activity
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role full access to customer_activity" ON customer_activity
  FOR ALL USING (auth.role() = 'service_role');

CREATE INDEX idx_activity_user ON customer_activity(user_id);
CREATE INDEX idx_activity_division ON customer_activity(user_id, division);
CREATE INDEX idx_activity_created ON customer_activity(created_at DESC);

-- 8. Support Threads
CREATE TABLE IF NOT EXISTS support_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject text NOT NULL,
  division text,
  category text DEFAULT 'general',
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'awaiting_reply', 'in_progress', 'resolved', 'closed')),
  priority text DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  reference_type text,
  reference_id text,
  assigned_to uuid,
  resolved_at timestamptz,
  closed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE support_threads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own support threads" ON support_threads
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create support threads" ON support_threads
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own support threads" ON support_threads
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Service role full access to support_threads" ON support_threads
  FOR ALL USING (auth.role() = 'service_role');

CREATE INDEX idx_st_user ON support_threads(user_id);
CREATE INDEX idx_st_status ON support_threads(status);

-- 9. Support Messages
CREATE TABLE IF NOT EXISTS support_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES support_threads(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id),
  sender_type text NOT NULL DEFAULT 'customer' CHECK (sender_type IN ('customer', 'agent', 'system')),
  body text NOT NULL,
  attachments jsonb DEFAULT '[]',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages in own threads" ON support_messages
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM support_threads WHERE id = support_messages.thread_id AND user_id = auth.uid())
  );
CREATE POLICY "Users can create messages in own threads" ON support_messages
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM support_threads WHERE id = support_messages.thread_id AND user_id = auth.uid())
  );
CREATE POLICY "Service role full access to support_messages" ON support_messages
  FOR ALL USING (auth.role() = 'service_role');

CREATE INDEX idx_sm_thread ON support_messages(thread_id);

-- 10. Customer Subscriptions
CREATE TABLE IF NOT EXISTS customer_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  division text NOT NULL,
  plan_name text NOT NULL,
  plan_tier text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled', 'expired', 'past_due')),
  amount_kobo bigint NOT NULL,
  currency text DEFAULT 'NGN',
  billing_cycle text DEFAULT 'monthly' CHECK (billing_cycle IN ('weekly', 'monthly', 'quarterly', 'yearly')),
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancelled_at timestamptz,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE customer_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscriptions" ON customer_subscriptions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role full access to customer_subscriptions" ON customer_subscriptions
  FOR ALL USING (auth.role() = 'service_role');

-- 11. Customer Invoices / Receipts
CREATE TABLE IF NOT EXISTS customer_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invoice_no text NOT NULL UNIQUE,
  division text NOT NULL,
  status text NOT NULL DEFAULT 'paid' CHECK (status IN ('draft', 'pending', 'paid', 'overdue', 'cancelled', 'refunded')),
  subtotal_kobo bigint NOT NULL,
  tax_kobo bigint DEFAULT 0,
  total_kobo bigint NOT NULL,
  currency text DEFAULT 'NGN',
  description text,
  line_items jsonb DEFAULT '[]',
  payment_method text,
  payment_reference text,
  reference_type text,
  reference_id text,
  due_date timestamptz,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE customer_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own invoices" ON customer_invoices
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role full access to customer_invoices" ON customer_invoices
  FOR ALL USING (auth.role() = 'service_role');

CREATE INDEX idx_ci_user ON customer_invoices(user_id);
CREATE INDEX idx_ci_created ON customer_invoices(created_at DESC);

-- 12. Customer Documents / Files
CREATE TABLE IF NOT EXISTS customer_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL DEFAULT 'document' CHECK (type IN ('document', 'receipt', 'certificate', 'id_document', 'contract', 'other')),
  division text,
  file_url text NOT NULL,
  file_size bigint,
  mime_type text,
  reference_type text,
  reference_id text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE customer_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own documents" ON customer_documents
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Service role full access to customer_documents" ON customer_documents
  FOR ALL USING (auth.role() = 'service_role');

CREATE INDEX idx_cd_user ON customer_documents(user_id);

-- 13. Customer Payment Methods
CREATE TABLE IF NOT EXISTS customer_payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('card', 'bank_account', 'wallet', 'ussd')),
  label text NOT NULL,
  last_four text,
  bank_name text,
  is_default boolean DEFAULT false,
  provider text,
  provider_token text,
  expires_at timestamptz,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE customer_payment_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own payment methods" ON customer_payment_methods
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Service role full access to customer_payment_methods" ON customer_payment_methods
  FOR ALL USING (auth.role() = 'service_role');

-- 14. Security Audit Log (customer-facing)
CREATE TABLE IF NOT EXISTS customer_security_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  ip_address text,
  user_agent text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE customer_security_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own security log" ON customer_security_log
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role full access to customer_security_log" ON customer_security_log
  FOR ALL USING (auth.role() = 'service_role');

CREATE INDEX idx_csl_user ON customer_security_log(user_id);

-- 15. Auto-create customer profile + wallet on signup
CREATE OR REPLACE FUNCTION handle_new_customer()
RETURNS trigger AS $$
BEGIN
  INSERT INTO customer_profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));

  INSERT INTO customer_wallets (user_id)
  VALUES (NEW.id);

  INSERT INTO customer_preferences (user_id)
  VALUES (NEW.id);

  INSERT INTO customer_notifications (user_id, title, body, category, action_url)
  VALUES (NEW.id, 'Welcome to HenryCo', 'Your account is ready. Explore our services and manage everything from your dashboard.', 'account', '/');

  INSERT INTO customer_activity (user_id, division, activity_type, title, description)
  VALUES (NEW.id, 'account', 'account_created', 'Account Created', 'Welcome to HenryCo! Your unified account has been set up.');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if any
DROP TRIGGER IF EXISTS on_auth_user_created_customer ON auth.users;
CREATE TRIGGER on_auth_user_created_customer
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_customer();

-- 16. Auto-update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER customer_profiles_updated_at BEFORE UPDATE ON customer_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER customer_preferences_updated_at BEFORE UPDATE ON customer_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER customer_wallets_updated_at BEFORE UPDATE ON customer_wallets FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER customer_addresses_updated_at BEFORE UPDATE ON customer_addresses FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER support_threads_updated_at BEFORE UPDATE ON support_threads FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER customer_subscriptions_updated_at BEFORE UPDATE ON customer_subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER customer_payment_methods_updated_at BEFORE UPDATE ON customer_payment_methods FOR EACH ROW EXECUTE FUNCTION update_updated_at();
