-- ============================================================================
-- FAITHFUL PROD CAPTURE — V3-RECONCILE-01 (2026-06-21)
-- prod migration: version=20260409054419  name=create_referral_trust_and_support_read_columns
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

-- Referral programs (configurable per division)
CREATE TABLE IF NOT EXISTS referral_programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  division text NOT NULL,
  name text NOT NULL,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  referrer_reward_type text NOT NULL DEFAULT 'wallet_credit',
  referrer_reward_amount_kobo bigint NOT NULL DEFAULT 0,
  referee_reward_type text NOT NULL DEFAULT 'wallet_credit',
  referee_reward_amount_kobo bigint NOT NULL DEFAULT 0,
  conversion_event text NOT NULL DEFAULT 'first_purchase',
  max_referrals_per_user int DEFAULT 50,
  min_days_before_payout int DEFAULT 7,
  requires_verification boolean NOT NULL DEFAULT true,
  fraud_cooldown_hours int DEFAULT 24,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Referrals (individual referral records)
CREATE TABLE IF NOT EXISTS referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id uuid REFERENCES referral_programs(id),
  referrer_id uuid REFERENCES auth.users(id) NOT NULL,
  referee_id uuid REFERENCES auth.users(id),
  referee_email text,
  referral_code text NOT NULL UNIQUE,
  division text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  conversion_event text,
  converted_at timestamptz,
  referrer_reward_status text DEFAULT 'pending',
  referrer_reward_paid_at timestamptz,
  referee_reward_status text DEFAULT 'pending',
  referee_reward_paid_at timestamptz,
  fraud_score numeric(5,2) DEFAULT 0,
  fraud_flags jsonb DEFAULT '[]'::jsonb,
  ip_address text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Referral rewards ledger (auditable reward history)
CREATE TABLE IF NOT EXISTS referral_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_id uuid REFERENCES referrals(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  reward_type text NOT NULL,
  amount_kobo bigint NOT NULL DEFAULT 0,
  currency text DEFAULT 'NGN',
  status text NOT NULL DEFAULT 'pending',
  wallet_transaction_id uuid,
  reason text,
  approved_by uuid,
  approved_at timestamptz,
  paid_at timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Trust flags (cross-division trust signals)
CREATE TABLE IF NOT EXISTS trust_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  entity_type text NOT NULL,
  entity_id uuid,
  division text,
  flag_type text NOT NULL,
  severity text NOT NULL DEFAULT 'medium',
  reason text NOT NULL,
  evidence jsonb DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'active',
  flagged_by text DEFAULT 'system',
  flagged_by_user_id uuid,
  reviewed_by uuid,
  review_notes text,
  resolved_at timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Platform moderation queue (cross-division moderation)
CREATE TABLE IF NOT EXISTS platform_moderation_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  division text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  content_snapshot text,
  reason text NOT NULL,
  severity text NOT NULL DEFAULT 'medium',
  status text NOT NULL DEFAULT 'pending',
  flagged_by text DEFAULT 'system',
  flagged_by_user_id uuid,
  assigned_to uuid,
  reviewed_by uuid,
  review_action text,
  review_notes text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

-- Add is_read and read_at to support_messages
ALTER TABLE support_messages
  ADD COLUMN IF NOT EXISTS is_read boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS read_at timestamptz;

-- Add last_read_at per-user tracking on support_threads
ALTER TABLE support_threads
  ADD COLUMN IF NOT EXISTS customer_last_read_at timestamptz,
  ADD COLUMN IF NOT EXISTS staff_last_read_at timestamptz;

-- Country/locale support table
CREATE TABLE IF NOT EXISTS platform_countries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  currency_code text NOT NULL DEFAULT 'NGN',
  currency_symbol text NOT NULL DEFAULT '₦',
  phone_prefix text,
  timezone text NOT NULL DEFAULT 'Africa/Lagos',
  locale text NOT NULL DEFAULT 'en-NG',
  is_active boolean NOT NULL DEFAULT true,
  is_primary boolean NOT NULL DEFAULT false,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Seed primary countries
INSERT INTO platform_countries (code, name, currency_code, currency_symbol, phone_prefix, timezone, locale, is_active, is_primary)
VALUES
  ('NG', 'Nigeria', 'NGN', '₦', '+234', 'Africa/Lagos', 'en-NG', true, true),
  ('BJ', 'Benin Republic', 'XOF', 'CFA', '+229', 'Africa/Porto-Novo', 'fr-BJ', true, false),
  ('GB', 'United Kingdom', 'GBP', '£', '+44', 'Europe/London', 'en-GB', true, false),
  ('US', 'United States', 'USD', '$', '+1', 'America/New_York', 'en-US', true, false),
  ('GH', 'Ghana', 'GHS', 'GH₵', '+233', 'Africa/Accra', 'en-GH', true, false)
ON CONFLICT (code) DO NOTHING;

-- Enable RLS
ALTER TABLE referral_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE trust_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_moderation_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_countries ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Service role full access" ON referral_programs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON referrals FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON referral_rewards FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON trust_flags FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON platform_moderation_queue FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON platform_countries FOR ALL USING (true) WITH CHECK (true);
