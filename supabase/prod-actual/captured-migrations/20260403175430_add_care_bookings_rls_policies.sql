-- ============================================================================
-- FAITHFUL PROD CAPTURE — V3-RECONCILE-01 (2026-06-21)
-- prod migration: version=20260403175430  name=add_care_bookings_rls_policies
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

-- Service role full access
CREATE POLICY "Service role full access to care_bookings"
  ON public.care_bookings
  FOR ALL
  USING (auth.role() = 'service_role');

-- Authenticated users can view their own bookings (linked via customer_id)
CREATE POLICY "Users can view own bookings"
  ON public.care_bookings
  FOR SELECT
  USING (auth.uid() = customer_id);

-- Authenticated users can view bookings by their email (fallback for unlinked)
CREATE POLICY "Users can view bookings by email"
  ON public.care_bookings
  FOR SELECT
  USING (
    lower(email) = lower(auth.jwt() ->> 'email')
  );
