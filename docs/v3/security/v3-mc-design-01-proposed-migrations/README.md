# V3-MC-DESIGN-01 — proposed (held) hardening migrations

**Status: PROPOSED — NOT APPLIED, NOT IN CI.** These files are held here, in the same convention as
the FIRE audit folders, until the owner reviews them. They are the M-NOW step of
`docs/v3/money/2026-10-01-multi-currency-architecture-design.md` (§1.5, §5.4, §11) and address a
live finding on `main` (LF-1), not a multi-currency feature. When adopted they move to
`apps/hub/supabase/migrations/` with a fresh timestamp, the proof moves to `apps/hub/supabase/tests/`
and both are wired into the `Payments money-RPC grant invariant` job after the refunds step
(`ci.yml:211` — the trigger touches only `payment_intents`, which exists there; the multi-currency
proofs of design §10 are appended after `payout_ledger_invariants.sql`, `ci.yml:249`, because they need
the whole chain).

| File | What it does |
|---|---|
| `01_payment_intents_birth_guard.sql` | Drops the `authenticated` INSERT policy and grant on `public.payment_intents`; adds a BEFORE INSERT trigger (SECURITY INVOKER) that refuses any insert by the PostgREST request roles and forces `status = 'pending'` and `provider_reference is null` for `service_role` inserts. True superuser sessions are exempt, which is how the existing CI fixtures seed captured intents (CI runs psql as the `postgres` superuser). There is no GUC or role escape hatch; a non-superuser rehearsal that must seed a captured intent disables the trigger explicitly inside its own transaction (documented in the file). The one script that seeds a captured intent outside CI, `apps/account/scripts/prove-refund-seam.mts:64`, keeps working on its local superuser PG17; against the Supabase shadow its step 1 gets that transaction wrapper in the hardening PR. |
| `02_payment_intents_birth_guard_invariant.sql` | Self-asserting proof for the fresh CI database. It first grants `service_role` SELECT/INSERT on `payment_intents` (prod's platform default table grant, which the CI bootstrap does not reproduce — without it the `service_role` insert dies on the grant before the trigger runs). Then: the trigger exists and is enabled (b0); `authenticated` has no INSERT privilege and the policy is gone (b1 — on the CI DB the grant assertion is vacuous because no table grant ever existed there, so the policy assertion is the discriminating check; to exercise the revoke itself, seed `grant insert, select on table public.payment_intents to authenticated;` in a `_min` step before 01); a `service_role` insert of a `succeeded` intent or one with a `provider_reference` raises and a `pending` insert succeeds (b2); with INSERT re-granted, an `authenticated` insert is refused **by the trigger's own message**, not merely by RLS (b3). |

Not included here (they span TypeScript and SQL and belong to the hardening PR itself): the
`apply_payment_webhook` confirmed-amount parameters and the `pending → processing` advance (LF-5),
`payment_exceptions`, the intents-route replay fix, the settlement-entry requirement in the
reconcilers, the one-allocation guard with the new `customer_wallet_funding_requests.payment_intent_id`
column (LF-7), the no-allocation-after-refund rule (LF-8), the `:failed` dedup keys (LF-9) and the
`post_sale_revenue` catch-up (LF-6) — design §6.3, §7.1, §5.2, §4.3 and §11 M-NOW. Sequencing note: this migration redefines nothing the two July
money files (`20260706120000`, `20260706130000`) also define, so it cannot be clobbered by them;
every later RPC hardening must be timestamped after the file that last defined the function (design
§7.1), and the M1 currency guard is a **separate** trigger function (`enforce_payment_intent_currency`,
design §5.4) precisely so that the lock migration, which sorts before this file by version, never
redefines `enforce_payment_intent_birth` — a shared function would be silently clobbered on any
version-ordered rebuild. Design §10 MC-CI-12 adds a version-order replay step that would catch it.
Both reviewers who executed the CI money chain with these two files inserted after the refunds step
(`ci.yml:211`) report every suite green through the payout proof and the SEC-HARDEN tail.
