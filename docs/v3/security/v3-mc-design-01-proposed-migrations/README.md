# V3-MC-DESIGN-01 — proposed (held) hardening migrations

**Status: PROPOSED — NOT APPLIED, NOT IN CI.** These files are held here, in the same convention as
the FIRE audit folders, until the owner reviews them. They are the M-NOW step of
`docs/v3/money/2026-10-01-multi-currency-architecture-design.md` (§1.5, §5.4, §11) and address a
live finding on `main` (LF-1), not a multi-currency feature. When adopted they move to
`apps/hub/supabase/migrations/` with a fresh timestamp, the proof moves to `apps/hub/supabase/tests/`
and both are wired into the `Payments money-RPC grant invariant` job after the refunds step.

| File | What it does |
|---|---|
| `01_payment_intents_birth_guard.sql` | Drops the `authenticated` INSERT policy and grant on `public.payment_intents`; adds a BEFORE INSERT trigger that refuses any insert by the PostgREST request roles and forces `status = 'pending'` and `provider_reference is null` for `service_role` inserts. Superuser-run proofs and migrations are exempt so the existing fixtures that seed captured intents keep working. |
| `02_payment_intents_birth_guard_invariant.sql` | Self-asserting proof for the fresh CI database: a `service_role` insert of a `succeeded` intent raises; a `pending` insert succeeds; `authenticated` has no INSERT privilege and the policy is gone. |

Not included here (they span TypeScript and SQL and belong to the hardening PR itself): the
`apply_payment_webhook` confirmed-amount parameters, the intents-route replay fix, and the
settlement-entry requirement in the reconcilers (design §6.3, §11 M-NOW items 2 and 3).
