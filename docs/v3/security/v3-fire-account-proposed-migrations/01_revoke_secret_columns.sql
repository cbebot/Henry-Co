-- ACC-6 — RLS is row-level, not column-level. The owner-scoped SELECT/ALL policies on
-- customer_payment_methods and customer_preferences return ALL columns to the authenticated owner
-- via PostgREST — including the secret `provider_token` (live: 7/7 rows populated) and
-- `withdrawal_pin_hash`. A hijacked session / phished JWT can read these directly; the pin-hash plus
-- a 4-digit PIN (ACC-9) is an offline crack. The app reads these columns server-side (service_role),
-- so remove them from the anon/authenticated column grant. Postgres supports column-level REVOKE.

revoke select (provider_token) on public.customer_payment_methods from anon, authenticated;
revoke select (withdrawal_pin_hash) on public.customer_preferences from anon, authenticated;

-- service_role retains full access (BYPASSRLS + base grant). Verify no browser/client code selects
-- these columns via the anon Data API before applying (it should not — they are server-only secrets).
-- If the client currently does an unscoped `select *`, switch it to an explicit column list first.
