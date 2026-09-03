-- ACC-10 — Defense-in-depth. Every account route reads/writes customer_* via the service-role admin
-- client (bypasses RLS), so the in-code `.eq("user_id", …)` filters are the only tenant boundary;
-- the owner RLS policies are a backstop only if FORCE'd against the table owner too. FORCE the
-- money/PII/KYC tables (service_role keeps BYPASSRLS). Verify staff/service read paths first.

alter table public.customer_wallets                  force row level security;
alter table public.customer_wallet_transactions      force row level security;
alter table public.customer_payment_methods          force row level security;
alter table public.customer_payout_methods           force row level security;
alter table public.customer_wallet_funding_requests  force row level security;
alter table public.customer_wallet_withdrawal_requests force row level security;
alter table public.customer_documents                force row level security;
alter table public.customer_verification_submissions force row level security;
alter table public.customer_profiles                 force row level security;
alter table public.customer_preferences              force row level security;
alter table public.customer_notifications            force row level security;
alter table public.customer_security_log             force row level security;
