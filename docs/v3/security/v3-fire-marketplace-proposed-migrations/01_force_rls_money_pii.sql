-- F-08 — Add a database backstop under the service_role app layer.
-- Every marketplace write currently flows through service_role (bypasses RLS) and
-- NO table has FORCE ROW LEVEL SECURITY, so the app-layer IDORs (F-01..F-05) have no
-- DB-level safety net. FORCE RLS makes the table owner also subject to policies.
-- NOTE: this does NOT affect service_role itself (it has BYPASSRLS); FORCE protects
-- against the table owner / definer-context and is defense-in-depth + a launch invariant.
-- Verify staff/vendor read paths (which use service_role) are unaffected before applying.

alter table public.marketplace_orders               force row level security;
alter table public.marketplace_order_groups          force row level security;
alter table public.marketplace_order_items           force row level security;
alter table public.marketplace_payment_records       force row level security;
alter table public.marketplace_payout_requests       force row level security;
alter table public.marketplace_refunds               force row level security;
alter table public.marketplace_addresses             force row level security;
alter table public.marketplace_vendor_applications   force row level security;
alter table public.marketplace_disputes              force row level security;
alter table public.marketplace_user_notifications    force row level security;
