# FL2 Money Go-Live — Status & Verification Report

**Date:** 2026-06-27
**Prod project:** `rzkbgwuznmdxnnhmjazy` ("HENRY ONYX")
**Prepared for:** the team — verification that FL2 (real-money payments) is cleanly live and complete.

---

## Executive summary

**FL2 is live, complete, and sound.** The real-money payment rail is in production on
**Flutterwave**, the double-entry ledger **balances to zero**, and every money table is
RLS-protected. There was **no pending FL2 migration** — the money spine is already applied.
This session added one **defense-in-depth** hardening migration and verified the whole rail.

| Area | Result |
|------|--------|
| Live payment provider | **Flutterwave** — 39/39 succeeded attempts |
| Succeeded payments | 12 intents, ₦22,475 (41 intents total) |
| Double-entry ledger | **Balanced**: DR ₦44,950 = CR ₦44,950, imbalance 0, 0 unbalanced entries |
| Money migrations | `payment_intents`, `payments_private_isolation`, `double_entry_ledger`, `v3_vat_01_settlement_vat`, `v3_18_payment_documents`, `fl2_wallet_rail_completion`, `v3_19_refunds` — **all applied** |
| Money-table RLS | Sound — owner/staff-scoped or service-role-only deny-all lockboxes |
| Security advisors (money) | **0 ERROR** on money objects |
| Hardening applied this session | `sec_harden_08_money_table_grant_lockdown` ✅ |
| Code suite (`@henryco/payment-router`) | **207/207 pass, 0 fail** on clean `main` |
| Only open money item | AI billing (#352) — separate feature, gated on rate-card decision (D4) |

---

## 1. Live-money evidence (prod, read-only verification)

- **Provider:** `payment_attempts.provider` = `flutterwave` for **all 39** succeeded attempts.
- **Volume:** `payment_intents` = 41 (12 succeeded / 21 pending / 7 failed / 1 processing);
  `studio_payments` = 139; `marketplace_payment_records` = 19; `customer_wallets` = 15.
- **Ledger integrity:** `public.journal_entries` (24) + `public.journal_lines` (65) +
  `ledger_accounts` (8). Total debits = total credits = ₦44,950; **imbalance 0; zero unbalanced
  entries** (each entry independently balances).
- **VAT + refunds:** `v3_vat_01_settlement_vat` and `v3_19_refunds` applied; `vat_output_payable`
  in the chart of accounts.

## 2. Security posture (money tables)

- RLS **enabled on every money table.**
- `payment_intents`: owner-scoped (`auth.uid() = user_id` insert/select) + finance-staff read;
  **anon denied**.
- `journal_entries / journal_lines / ledger_accounts`: staff-read-only; writes only via the
  SECURITY DEFINER ledger RPCs / service-role.
- Payout / wallet-funding / withdrawal / care-ledger tables: **deny-all lockboxes** (service-role only).
- Supabase advisors: **0 ERROR on any money object** (the single advisor ERROR is an unrelated
  Learn quiz view).

## 3. Change applied this session — `sec_harden_08_money_table_grant_lockdown`

**Type:** defense-in-depth. **Prod version:** `20260627213858`. Mirrored to repo at
`apps/hub/supabase/migrations/20260627213858_sec_harden_08_money_table_grant_lockdown.sql`.

**What:** revoked latent `anon`/`authenticated` `INSERT/UPDATE/DELETE/TRUNCATE` grants on 14
money tables. Every revoked grant had **no backing RLS policy** → it was already denied →
removing it changes no legitimate behavior and closes attack surface (notably `TRUNCATE`, which
bypasses RLS).

**Preserved (policy-backed):** `service_role` full DML (all server-side money writes);
`payment_intents` authenticated INSERT+SELECT (owner intent creation);
`customer_payment_methods` / `learn_payments` / `marketplace_refunds` authenticated writes
(owner/staff policies); all SELECT grants.

**Post-change verification:** `payment_intents` rows unchanged (41), succeeded unchanged (12),
ledger imbalance still 0, all 25 money policies intact, `payment_intents` authenticated INSERT
grant + policy present, anon write grants on `payment_intents` = 0. **No data touched.**

## 4. Code verification

`@henryco/payment-router` suite on clean `main`: **207 tests, 207 pass, 0 fail** (45 suites) —
covers provider HTTP normalization, ISO-4217 minor-unit handling, kobo-exact amounts, the VAT
chart, sale-revenue recognition, and V3-19 refund / proportional-reversal math.

## 5. Only open money item — AI billing (#352), NOT FL2

`v3_ai_01_metered_billing` (the metered AI usage-billing engine) is committed on `main`, **not
applied**, flag **dark**. All its prod schema prerequisites are present (verified), so it is
technically apply-ready; the sole blocker is the **rate-card decision (D4)** — the seeded `deep`
tier underprices real Opus 4.8. See `docs/v3/AI-BILLING-ACTIVATION-RUNBOOK-2026-06-27.md`. It does
**not** affect FL2 and nothing about it was activated.

## 6. Notes / boundaries

- The active Flutterwave key (`sk_live` vs `sk_test`) lives in Vercel env (not visible from the DB);
  the owner confirms the live key is set, so new payments settle as real money.
- The committed-not-applied migration set (logistics, rooms, super-app, studio-suite, property
  extensions, Pass-21, etc.) is **dormant by design** and was intentionally left untouched.

---

**Bottom line:** FL2 is cleanly done and in production. The rail is verified end to end
(live payments → balanced ledger → RLS-locked → code green), and it is now additionally hardened.
The next money decision (AI billing) is documented and waiting on the rate card — nothing is broken
or half-finished.
