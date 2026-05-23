-- DIAG-ACCOUNT-01: customer_preferences schema convergence.
--
-- Root cause: the production customer_preferences table is missing 9 columns
-- that production code paths reference. The customer dashboard's
-- /api/notifications/preferences GET selects an explicit list including
-- columns that do not exist, returning 500 on every authenticated session
-- (~50 logged 500s in the last 6 hours alone). The deferred profile-seed
-- (apps/account/lib/account-profile.ts ensureAccountProfileRecords)
-- INSERTs a default-row that mentions the same missing columns and is
-- silently failing inside Next.js `after()`, so signed-up users never get
-- a preferences row created.
--
-- The missing columns originated in three un-applied historical migrations:
--   - 20260403183000_account_integration_hardening.sql (notification_referrals)
--   - 20260406140000_wallet_withdrawals.sql            (withdrawal_pin_hash)
--   - 20260420160000_notification_signal_preferences.sql
--       (in_app_toast_enabled, notification_sound_enabled,
--        notification_vibration_enabled, high_priority_only,
--        quiet_hours_enabled, quiet_hours_start, quiet_hours_end)
--
-- Only the foundation-extensions migration (`20260508105640`) was applied;
-- the column-additions from these three predecessors never landed because
-- of an earlier history reset. This migration backfills ONLY the missing
-- columns; the broader sibling tables (referral_rewards, payout_methods,
-- interview_sessions, etc.) are out of scope here and tracked separately.
--
-- All ALTERs are idempotent (`add column if not exists`) so the migration
-- is safe to re-run, and the column shapes/defaults match the source-of-truth
-- migrations verbatim.
--
-- Applied to production via Supabase MCP at 2026-05-23T10:50Z. This file
-- mirrors that state so the source tree and the database agree.

set check_function_bodies = off;

alter table public.customer_preferences
  add column if not exists in_app_toast_enabled boolean not null default true,
  add column if not exists notification_sound_enabled boolean not null default false,
  add column if not exists notification_vibration_enabled boolean not null default false,
  add column if not exists high_priority_only boolean not null default false,
  add column if not exists quiet_hours_enabled boolean not null default false,
  add column if not exists quiet_hours_start time without time zone not null default '22:00:00'::time,
  add column if not exists quiet_hours_end time without time zone not null default '07:00:00'::time,
  add column if not exists notification_referrals boolean not null default true,
  add column if not exists withdrawal_pin_hash text;
