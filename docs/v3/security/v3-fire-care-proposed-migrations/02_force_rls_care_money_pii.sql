-- CARE-4 — Add a DB backstop under the service_role app layer. All care writes flow through
-- service_role (bypasses RLS) and these money/PII tables are not FORCE-RLS'd, so a leaked key
-- or a forgotten owner-filter has no database-level safety net. FORCE subjects the table owner
-- to policies too (service_role keeps BYPASSRLS; this is defense-in-depth + a launch invariant).
-- Verify staff/service read paths (which use service_role) are unaffected before applying.

alter table public.care_bookings           force row level security;
alter table public.care_payments           force row level security;
alter table public.care_payment_requests   force row level security;
alter table public.care_finance_ledger     force row level security;
alter table public.care_expenses           force row level security;
alter table public.care_journal_entries    force row level security;
alter table public.care_journal_lines      force row level security;
alter table public.care_ledger_accounts    force row level security;
alter table public.care_order_items        force row level security;
alter table public.care_notification_queue force row level security;
alter table public.care_security_logs      force row level security;
