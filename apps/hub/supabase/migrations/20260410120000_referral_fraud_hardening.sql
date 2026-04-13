-- 20260410120000_referral_fraud_hardening.sql
-- Adds fraud-protection columns to the existing referral system.
--
-- Production tables: referrals, referral_rewards, referral_programs
-- This migration adds columns needed for the fraud guard pipeline
-- and per-user referral code storage on customer_profiles.

-- Add fraud + qualification columns to referrals.
alter table public.referrals
  add column if not exists qualified_at timestamptz,
  add column if not exists flag_reason text,
  add column if not exists referred_fingerprint text;

-- Per-user referral code on profiles (used for code lookup).
alter table public.customer_profiles
  add column if not exists referral_code text;

create unique index if not exists customer_profiles_referral_code_idx
  on public.customer_profiles(referral_code)
  where referral_code is not null;

-- Indices for the new lookup paths used by fraud guards.
create index if not exists referrals_referred_fingerprint_idx
  on public.referrals(referred_fingerprint)
  where referred_fingerprint is not null;

create index if not exists referrals_flag_status_idx
  on public.referrals(status, flag_reason)
  where status = 'flagged';

-- Support note on reward ledger for finance/support disputes.
alter table public.referral_rewards
  add column if not exists support_note text;
