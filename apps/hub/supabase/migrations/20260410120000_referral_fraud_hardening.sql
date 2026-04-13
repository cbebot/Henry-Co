-- 20260410120000_referral_fraud_hardening.sql
-- Adds fraud-protection columns and state transitions to the referral system.
--
-- Context: The referral system's state machine needs to distinguish
--   pending -> converted -> qualified -> paid  (happy path)
--                      \-> flagged (fraud guard trip)
-- and store enough signal to catch self-referral, duplicate-email, and
-- device-fingerprint abuse BEFORE any cash leaves the wallet ledger.

-- Add fraud + qualification columns to customer_referrals.
alter table public.customer_referrals
  add column if not exists referred_fingerprint text,
  add column if not exists flag_reason text,
  add column if not exists qualified_at timestamptz;

-- Indices for the new lookup paths used by fraud guards.
create index if not exists customer_referrals_referred_fingerprint_idx
  on public.customer_referrals(referred_fingerprint)
  where referred_fingerprint is not null;

create index if not exists customer_referrals_flag_status_idx
  on public.customer_referrals(status, flag_reason)
  where status = 'flagged';

-- Reward ledger: a reason field makes every ledger row self-describing
-- so support and finance can tell why a payout fired without joining
-- back to the referral row.
alter table public.customer_referral_rewards
  add column if not exists reason text;

-- Optional: a human note for support / finance disputes.
alter table public.customer_referral_rewards
  add column if not exists support_note text;
