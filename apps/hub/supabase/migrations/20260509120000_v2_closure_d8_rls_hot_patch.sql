-- V2 closure D8 hot-patch — enable RLS + revoke anon grants on the 4 public-schema
-- tables that the V5-4 audit (2026-05-09 second pass) flagged as RLS-off with
-- anon SELECT/INSERT/UPDATE/DELETE/TRUNCATE grants.
--
-- Tables locked down:
--   public.wallets
--   public.wallet_transactions
--   public.care_pricing_items
--   public.care_site_settings
--
-- Why this is safe:
--   - All app-side wallet access is via createAdminSupabase() (service-role),
--     which bypasses RLS by design. Server-side flows continue working.
--   - care_pricing_items + care_site_settings have no app-route consumers in
--     the current monorepo (apps/care/**); admin writes go through staff
--     tooling on service-role.
--   - REVOKE on anon/authenticated is defense-in-depth: even if a future
--     migration accidentally re-disables RLS, PostgREST still cannot read.
--   - Grants are restored explicitly to authenticated for table reads where
--     the app legitimately needs them (none of these four — but the SELECT
--     policies below give authenticated owner-scoped access for the wallet
--     tables so the customer wallet UI keeps working if it ever uses the
--     anon client to read the user's own row).
--
-- This migration is idempotent — every step uses IF EXISTS / IF NOT EXISTS
-- guards or guarded DO blocks so re-running is a no-op.

DO $migration$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'wallets',
    'wallet_transactions',
    'care_pricing_items',
    'care_site_settings'
  ]
  LOOP
    -- 1. Enable RLS (idempotent: ALTER TABLE … ENABLE RLS is safe to re-run).
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);

    -- 2. Force RLS so that even table owners and superusers go through policies
    -- when not running as service_role. Service-role bypasses both ENABLE and
    -- FORCE, so app server actions are unaffected. This catches accidental
    -- queries from `postgres` / `authenticator` roles too.
    EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', t);

    -- 3. Revoke all from anon + authenticated. Defense-in-depth: prevents
    -- PostgREST from exposing the table even if RLS is later disabled.
    EXECUTE format('REVOKE ALL ON public.%I FROM anon', t);
    EXECUTE format('REVOKE ALL ON public.%I FROM authenticated', t);
    -- service_role keeps full access.
  END LOOP;
END
$migration$;

-- 4. Grant authenticated SELECT back on wallet tables only, scoped by RLS
--    policy below. The customer-facing wallet UI may, in some flows, read
--    the user's own wallet via the cookie-bound supabase client; the policy
--    ensures that read is row-scoped.
GRANT SELECT ON public.wallets TO authenticated;
GRANT SELECT ON public.wallet_transactions TO authenticated;

-- 5. RLS policies — owner-scoped reads for wallets.
DO $policies$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'wallets' AND policyname = 'wallets_select_own_v2_d8'
  ) THEN
    CREATE POLICY wallets_select_own_v2_d8
      ON public.wallets
      FOR SELECT
      TO authenticated
      USING (user_id = (SELECT auth.uid()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'wallet_transactions' AND policyname = 'wallet_tx_select_own_v2_d8'
  ) THEN
    -- wallet_transactions joins via wallet_id → wallets.user_id. Inline the join via subquery.
    CREATE POLICY wallet_tx_select_own_v2_d8
      ON public.wallet_transactions
      FOR SELECT
      TO authenticated
      USING (
        wallet_id IN (
          SELECT id FROM public.wallets WHERE user_id = (SELECT auth.uid())
        )
      );
  END IF;

  -- care_pricing_items + care_site_settings: no policies. Default-deny under
  -- RLS means PostgREST cannot read or write. Server-side admin flows on
  -- service-role bypass RLS and continue working. If a public read flow is
  -- ever needed (e.g., showing care pricing to anonymous visitors), add a
  -- specific SELECT policy in a follow-up migration with the right column-
  -- level scope.
END
$policies$;

-- 6. Comment the lockdown so future audits can find the rationale.
COMMENT ON TABLE public.wallets IS
  'Locked down 2026-05-09 V2-closure D8: RLS enabled + forced; anon/authenticated REVOKED; authenticated owner-scoped SELECT only.';
COMMENT ON TABLE public.wallet_transactions IS
  'Locked down 2026-05-09 V2-closure D8: RLS enabled + forced; anon/authenticated REVOKED; authenticated owner-scoped SELECT (via wallet_id) only.';
COMMENT ON TABLE public.care_pricing_items IS
  'Locked down 2026-05-09 V2-closure D8: RLS enabled + forced; anon/authenticated REVOKED. Service-role only until a public-read policy is added.';
COMMENT ON TABLE public.care_site_settings IS
  'Locked down 2026-05-09 V2-closure D8: RLS enabled + forced; anon/authenticated REVOKED. Service-role only until a public-read policy is added.';
