-- ============================================================================
-- FAITHFUL PROD CAPTURE — V3-RECONCILE-01 (2026-06-21)
-- prod migration: version=20260416030628  name=verification_submissions_rls_policies
-- project: rzkbgwuznmdxnnhmjazy (HENRY ONYX)
-- classification: FOLLOWON_HARDEN (applied on prod; no app-folder migration file existed)
--
-- BYTE-FAITHFUL capture of the SQL prod actually applied for this migration
-- (supabase_migrations.schema_migrations.statements). Recorded so the repo
-- migration record mirrors prod. Like supabase/prod-actual/schema.sql this is a
-- REFERENCE capture: NOT part of any app auto-apply chain, and must NOT be
-- re-applied to prod (these objects already exist there). See
-- supabase/prod-actual/captured-migrations/README.md and
-- .codex-temp/v3-reconcile-01/report.md.
-- ============================================================================

-- Add explicit RLS policies to customer_verification_submissions
-- Currently RLS is enabled but no policies exist (service-role-only by accident)

-- Service role full access (staff/backend writes)
CREATE POLICY "Service role full access to customer_verification_submissions"
  ON public.customer_verification_submissions FOR ALL
  USING (auth.role() = 'service_role');

-- Users can view their own submissions (account portal reads)
CREATE POLICY "Users can view own verification submissions"
  ON public.customer_verification_submissions FOR SELECT
  USING (auth.uid() = user_id);
