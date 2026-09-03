-- sec_harden_08: money-table grant lockdown (defense-in-depth)
--
-- Strips latent anon/authenticated mutation grants on money tables. RLS is ENABLED on
-- every table below; every grant revoked here has NO backing write policy, so the action
-- was already denied at the RLS layer. Revoking removes attack surface (notably TRUNCATE,
-- which bypasses RLS) without changing any legitimate flow.
--
--   * service_role keeps full DML (all server-side money writes use it) -> untouched.
--   * Preserved (policy-backed): payment_intents authenticated INSERT/SELECT (owner intent
--     creation); customer_payment_methods / learn_payments / marketplace_refunds
--     authenticated INSERT/UPDATE/DELETE (owner/staff ALL policies); all SELECT grants.
--
-- Applied to production (rzkbgwuznmdxnnhmjazy) 2026-06-27 as version 20260627213858,
-- then mirrored here. REVOKE is idempotent (revoking a privilege not held is a no-op).

-- GROUP A: no authenticated write policy -> revoke all writes from anon + authenticated
revoke insert, update, delete, truncate on table
  public.care_finance_ledger,
  public.care_payment_requests,
  public.customer_payout_methods,
  public.customer_wallet_funding_requests,
  public.customer_wallet_transactions,
  public.customer_wallet_withdrawal_requests,
  public.customer_wallets,
  public.marketplace_payment_records,
  public.marketplace_payout_requests,
  public.payment_attempts
from anon, authenticated;

-- GROUP B: payment_intents -> keep authenticated INSERT (owner intent creation) + SELECT
revoke insert, update, delete, truncate on table public.payment_intents from anon;
revoke update, delete, truncate on table public.payment_intents from authenticated;

-- GROUP C: owner/staff write policy exists -> keep authenticated writes; strip anon writes + authenticated TRUNCATE
revoke insert, update, delete, truncate on table
  public.customer_payment_methods,
  public.learn_payments,
  public.marketplace_refunds
from anon;
revoke truncate on table
  public.customer_payment_methods,
  public.learn_payments,
  public.marketplace_refunds
from authenticated;
