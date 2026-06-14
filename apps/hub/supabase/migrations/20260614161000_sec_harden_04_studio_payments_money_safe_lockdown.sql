-- SEC-HARDEN-04 (part B) — MONEY-FLAGGED: close the world-writable hole on
-- public.studio_payments (a MONEY-INPUT table).
--
-- ⛔ DO NOT APPLY TO PROD WITHOUT EXPLICIT OWNER MONEY-APPROVAL. ⛔
-- studio_payments is money-INPUT (its `amount` sizes a real customer_wallets debit,
-- and its `status` gates payment), so SEC-HARDEN-04 ESCALATES it rather than locking
-- it unilaterally. This file IS the verified money-safe plan; the prod apply is the
-- single owner-gated, money-sign-off step. It applies via
--   supabase db query --linked --workdir apps/hub -f <this file>
-- never `supabase db push`. It is committed + CI-proven + shadow-rehearsed so that the
-- moment the owner approves, the fix is known-correct. It touches ZERO money-spine
-- objects (no payments_private, no FL2 set) — it is pure RLS-policy + table-grant
-- surgery on one public table.
--
-- ─────────────────────────────────────────────────────────────────────────────
-- THE TABLE'S MONEY ROLE (determined read-only + by full code inventory — report §1):
--   studio_payments is the studio-portal milestone/payment-request RECORD table
--   (amount_kobo, amount, status requested→paid, proof_url, milestone_id, invoice_id,
--   verified_at/by, …). It is NOT the money-truth ledger — the double-entry ledger
--   (payments_private, V3-17/V3-22) is fed by the wallet funding / top-up path, NOT by
--   studio_payments. BUT it is money-INPUT on the balance axis:
--   apps/account/app/api/studio/payments/[id]/wallet/route.ts reads
--   studio_payments.amount (via the SERVICE-ROLE admin client) and applies it as a
--   real customer_wallets.balance_kobo DEBIT (+ a customer_wallet_transactions debit).
--   Its `status` also gates whether that checkout runs.
--
-- THE HOLE (live on prod): the policy literally named "Service role full access" is
-- authored `as permissive for all to public using (true) with check (true)` — it is
-- NOT scoped to service_role; it grants EVERY anon/authenticated PostgREST caller full
-- INSERT/UPDATE/DELETE. Combined with the standing anon/authenticated DML grant, any
-- logged-in user can today run `PATCH /rest/v1/studio_payments?id=eq.<id>` to set
-- status='paid' for free (bypassing finance verification) or lower `amount` to underpay
-- via wallet checkout — a reachable money exploit. (service_role carries rolbypassrls,
-- so the admin app NEVER needed this policy; its only real effect is the opposite of
-- its name.)
--
-- WHY THE LOCK IS MONEY-SAFE (every write path verified — report §1):
--   EVERY write to studio_payments goes through the SERVICE-ROLE admin client
--   (createAdminSupabase, rolbypassrls — unaffected by RLS/grants):
--     • apps/studio/lib/studio/store.ts          upsertPayment  (service-role)
--     • apps/studio/lib/portal/actions.ts:160/191 insert+update  (service-role)
--     • apps/account/app/api/studio/payments/[id]/wallet/route.ts:132 status update (service-role)
--   The ONLY request-role access is a READ in apps/studio/lib/portal/data.ts (the
--   customer portal), gated by the scoped SELECT policy `studio_member_payments` —
--   which this file PRESERVES (with the SELECT grant). The two scoped WRITE policies
--   (studio_member_payments_insert, studio_staff_payments_update) are PROVABLY UNUSED:
--   no code writes studio_payments via a request-role client, and all 136 prod rows
--   have client_user_id IS NULL (the scoped client-insert path, with_check
--   client_user_id = auth.uid(), was never the write path). FORENSICS: the hole was
--   never exploited (no tamper signature; the 7 'paid' rows are legitimate legacy; the
--   wallet money path has 0 production debits so far — the exposure is forward-looking).
--
-- THE FIX (SEC-HARDEN-03 Cat-1 studio mechanism, money-safe): drop the broad policy,
-- revoke ALL request-role DML, and drop the two unused scoped write policies (removes
-- the latent re-opening surface on a money table); KEEP the scoped SELECT + the SELECT
-- grant so the customer portal read keeps working; service_role keeps every privilege.
-- If a genuine client-self-pay flow is ever built, re-add a scoped INSERT policy + a
-- targeted authenticated INSERT grant in that feature's own migration.
set check_function_bodies = off;

do $$
begin
  if to_regclass('public.studio_payments') is null then
    return;
  end if;

  -- Close the world-write: drop the broad ALL(true) policy.
  drop policy if exists "Service role full access" on public.studio_payments;

  -- Drop the two PROVABLY-UNUSED scoped request-role WRITE policies (no code path
  -- uses them; zero rows ever inserted via the client path). Leaving them would be a
  -- latent re-opening surface on a money-input table.
  drop policy if exists studio_member_payments_insert on public.studio_payments;
  drop policy if exists studio_staff_payments_update on public.studio_payments;

  -- Revoke the standing request-role DML grant (the latent half of the hole).
  -- SELECT is retained for the scoped customer-portal read; service_role is untouched.
  revoke insert, update, delete, truncate on table public.studio_payments
    from anon, authenticated, public;
end $$;

-- end of migration --
