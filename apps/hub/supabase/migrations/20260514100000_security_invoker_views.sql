-- Fix Supabase advisor ERROR `security_definer_view` on 5 public views.
--
-- Default-permission views in Postgres execute with the view OWNER's
-- privileges (effectively SECURITY DEFINER), which bypasses RLS for the
-- calling user. Switching to `security_invoker = on` (Postgres 15+) makes
-- the view honour the invoker's RLS policies — the safer default for any
-- view that exposes RLS-protected data to anon/authenticated.
--
-- Affected views (advisor output 2026-05-14, project rzkbgwuznmdxnnhmjazy):
--   • public.studio_client_invoices_v
--   • public.care_staff_expense_monthly_summary
--   • public.care_category_expense_monthly_summary
--   • public.care_finance_summary
--   • public.care_finance_monthly_summary
--
-- Remediation: https://supabase.com/docs/guides/database/database-linter?lint=0010_security_definer_view
--
-- Idempotent: `alter view if exists ... set` is safe to re-run and tolerant
-- of environments where a view has not yet been created (preview branches,
-- fresh setups).

alter view if exists public.studio_client_invoices_v
  set (security_invoker = on);

alter view if exists public.care_staff_expense_monthly_summary
  set (security_invoker = on);

alter view if exists public.care_category_expense_monthly_summary
  set (security_invoker = on);

alter view if exists public.care_finance_summary
  set (security_invoker = on);

alter view if exists public.care_finance_monthly_summary
  set (security_invoker = on);
