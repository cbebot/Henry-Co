# Multi-currency architecture — ledger, FX, provider, wallet, refund, receipt (V3-MC-DESIGN-01)

**Status:** DESIGN DRAFT for owner review, revision 2 (after adversarial round 1). Nothing in this
document changes production. Every stage below is additive, flag-dark, and gated on a per-currency
live settle test the owner runs. **Date:** 2026-10-01. **Base:** `origin/main` @ `b1efffe`.

**Builds on:** `2026-07-05-multi-currency-in-currency-ledger-design.md` (owner-approved in-currency
ledger; its M1a migration `20260706120000_v3_money_mc_multicurrency_ledger.sql` is on `main`) and
`2026-07-06-automatic-withdrawal-payout-rail-design.md` (payout rail; W1–W3 on `main`, flag-dark).
It completes what those deferred — FX at the charge seam, provider currency capability, per-currency
wallets, in-currency refunds, credit notes and receipts, and the reporting layer — and it fixes every
reader that would mix currencies the moment a second currency posts.

**Owner framing (binding, unchanged):** Henry Onyx is a global company. Money is charged, settled,
posted, refunded and documented in the payer's currency. FX appears only at the charge quote and at
reporting. It never appears inside a posting, a reconcile, a refund or a receipt.

**What this supersedes.** The program spec `docs/superpowers/specs/2026-07-04-multi-currency-charge-program.md`
§2 invariant 1 ("the ledger keeps ONE accounting base (NGN)") and stage M2 ("post base-currency
entries derived from the snapshot") are superseded by the owner's 2026-07-05 in-currency decision and
the shipped migration. Its §2 invariant 5 and the 07-05 design's §3.6/§7, which name a
`CHARGE_CURRENCIES` env var as the interlock, are superseded by §5.4 here: the interlock is a
database policy table, and there is no env var. Everything else in both documents stands.

**Two live findings on `main` (§1.5).** Grounding this design found two money holes that exist
today, outside the multi-currency scope. They are listed first in the build plan (M-NOW, §11) and in
the report, and a held hardening migration for the first is proposed at
`docs/v3/security/v3-mc-design-01-proposed-migrations/`.

---

## 0. Reading guide

| Section | What it settles |
|---|---|
| §1 | The spine as it exists on `main` — every claim carries a file and line; §1.5 the live findings |
| §2 | The NGN-lock inventory: every place NGN (or a single-currency assumption) is hard-wired, and which build step widens it |
| §3 | Principles — the money invariants, each with its CI rule id |
| §4 | Ledger design (per-currency books, chart, reconciliation readers, VAT, reporting base) |
| §5 | FX design (one conversion seam, rate freshness, capture window, spread, rounding, snapshot, the DB policy table and birth guard) |
| §6 | Provider design (currency capability, routing, confirmed-amount check, settlement proof, fees, chargebacks) |
| §7 | Wallet design (NGN wallets stay; currency assertions on the NGN RPCs; per-currency wallets as separate tables) |
| §8 | Refund and credit-note design (in-currency, never re-converted, dispatched by row currency) |
| §9 | Receipt design (in-currency documents, a real issuance path, exponent-correct rendering) |
| §10 | Invariants as CI rules (what goes red, and how) |
| §11 | Build plan ordered by money risk, with gates |
| §12 | Owner decisions required before each gate |
| §13 | Hazard register: the money-losing paths this design closes, and how |

Line anchors are against `main` @ `b1efffe`. Migration files are under
`apps/hub/supabase/migrations/` and are cited by timestamp prefix. "Last definition" means the
definition in the latest migration that redefines the function.

---

## 1. The spine on `main` (grounded)

"Prod" means the production database as last captured (`supabase/prod-actual/schema.sql`,
2026-06-11) plus the FL2 go-live verification (`docs/v3/FL2-GO-LIVE-STATUS-REPORT-2026-06-27.md`).
Anything after 2026-06-27 is "on main, prod state unverified" and is listed as such.

### 1.1 Money tables and their currency posture

| Object | Where | Posture today |
|---|---|---|
| `public.payment_intents` (`amount_minor bigint`, `currency text`) | `20260529120000:43-58` | `currency` has **no CHECK**; `status` CHECK admits every status at insert (`:48-50`); **no BEFORE INSERT trigger** exists in any migration; the A2 transition trigger (`:117-137`) and `freeze_intent_money_columns` (`20260611130000:174-182`) are BEFORE UPDATE only; RLS policy `payment_intents_insert_own` lets any `authenticated` user insert their own row (`:235-237`) and `sec_harden_08` keeps the `authenticated` INSERT grant (`20260627213858:30-32`) |
| `public.journal_entries.currency` | `20260706120000:24-32` | ISO-4217 CHECK (`journal_entries_currency_iso`); one entry = one currency |
| `public.journal_lines` (`debit_minor`, `credit_minor`) | `20260607120000:91-109` | Currency-neutral integers; per-entry balance trigger (`assert_entry_balanced`, `:119-145`) |
| `public.ledger_accounts` | 7 seeded at `20260607120000:58-66`; `+vat_output_payable`, `+fee_vat_recoverable`, `−vat_payable` at `20260607140000:40-49`; `+withdrawals_payable` at `20260706130000:20-22` | 9 codes on `main` (TS mirror `packages/payment-router/src/ledger.ts:48-64`); prod held 8 at FL2 |
| `public.customer_wallets` (`balance_kobo`, `currency` default `'NGN'`, no CHECK on `currency`) | prod `supabase/prod-actual/schema.sql:3024-3034`; `UNIQUE (user_id)` `:6213`; `balance_kobo >= 0` `:6306` | **One wallet per user**, NGN |
| `public.customer_wallet_transactions` (`amount_kobo`, `balance_after_kobo`, `settlement_currency`, `display_currency`, `exchange_rate*`) | prod `:2999-3023` | Columns carry currency context (foundation migration `20260419120000`); rows are NGN |
| `public.customer_wallet_funding_requests` / `_withdrawal_requests` / `customer_payout_methods` (`currency` default `'NGN'`, no CHECK) | `20260611120000_fl2_wallet_rail_completion.sql:51, 88, 113` | NGN rows written by the routes (`topup/init/route.ts:74`, `withdrawal/request/route.ts:236,260`) |
| `public.payment_refunds.currency` | `20260611130000:90-91` | **CHECK `currency = 'NGN'`**; the row is inserted with the literal `'NGN'` (`:341`) |
| `public.customer_receipts.currency` | `20260607130000:90-91` | **CHECK `currency = 'NGN'`**; inserted with the literal `'NGN'` (`:193`) |
| `public.customer_credit_notes.currency` | `20260611130000:674-675` | **CHECK `currency = 'NGN'`**; inserted with the literal `'NGN'` (`:787`) |
| `public.processed_webhooks` | `20260529120000:89-100` | Dedup key `(provider, provider_event_id)`; currency-free |
| CI bootstrap `public.customer_wallets` | `apps/hub/supabase/tests/_bootstrap_supabase_env.sql:42-48`; `payout_rail_min.sql:8-12` is a no-op `create table if not exists` after it | **No `currency`, `is_active`, `frozen_at` columns** — the fresh CI DB does not have prod's wallet shape |

### 1.2 Money writers (`payments_private`, service-role only, reached over the pooled direct-pg rail)

| RPC (last definition) | Where | Currency behaviour today |
|---|---|---|
| `post_ledger_entry(source, event, desc, currency, lines)` | `20260706120000:39-114` | Accepts any `^[A-Z]{3}$` (`:62`); tags the entry; returns `{posted:false, reason:'duplicate'}` on a replayed key |
| `post_charge_settlement(intent, status, fee, fee_vat)` | `20260706120000:126-210` | Posts in the **intent's** currency, reading only the intent row (`:151`); 7.5% statutory fee-VAT split **only** when `NGN` (`:187-188`); a provider-reported fee VAT is honoured for any currency and posted to `fee_vat_recoverable` (`:186`, `:204`); **raises** `fee must be < gross` (`:174-177`) and on a fee-VAT out of range (`:182-185`) |
| `apply_payment_webhook(provider, event, intent, status, fee, fee_vat)` | `20260611130000:899-926` | Dedup-first; calls `post_charge_settlement` in the same txn; rejects `refunded`; **takes no provider-confirmed amount or currency** — the intent's own figure is what gets posted, whatever the provider captured |
| `post_sale_revenue(event, gross, output_vat)` | `20260607140000:197-224` | **Hard-codes `'NGN'`** (`:222`); no currency parameter; **no lookup of the intent** — the caller chooses gross and the event id |
| `credit_wallet_topup(user, request, intent, amount_kobo, currency)` | `20260607120000:363-422` | **Rejects non-NGN** (`:375-376`); resolves the wallet by `user_id` only (`:382-383`); posts via `perform` and **ignores a `posted:false` result** (`:413-419`) — a consumed key moves the balance with no entry; checks nothing about a charge-settlement entry |
| `initiate_payment_refund` / `set_refund_provider_reference` / `fail_payment_refund` / `apply_refund_webhook` | `20260611130000:218-633` | `initiate` returns `non_base_currency` for a non-NGN intent (`:258-259`) and inserts `'NGN'` into the row (`:341`); `fail_payment_refund` re-credits `customer_wallets` by `payment_intents.user_id` with **no currency read** (`:386-387`, `:399-421`); every refund posting is tagged `'NGN'` (`:321`, `:416`, `:536`, `:606`); `apply_refund_webhook` returns no amount or currency (`:629-632`); its `amount_mismatch` guard only runs when the payload amount is non-null (`:513-516`) |
| `record_customer_receipt(...)` | `20260607130000:127-205` | **Rejects non-NGN** (`:151-152`); inserts `'NGN'` (`:193`); total must equal the posting's debit total (`:178-183`) |
| `record_customer_credit_note(...)` | `20260611130000:692-798` | **Rejects non-NGN** (`:719-720`); inserts `'NGN'` (`:787`) |
| `reserve_withdrawal` / `post_withdrawal_settlement` / `release_withdrawal` | `20260706130000:29-226` | Only `reserve` checks the row currency (`:58-59`); `settle` reads `amount_kobo, status` only (`:118-119`) and raises on `fee >= amount` (`:133-136`); `release` credits `customer_wallets where user_id` with no currency read (`:183-184`, `:199-202`); all three postings tagged `'NGN'` (`:80`, `:149`, `:209`) |
| `post_ai_usage_charge` | `20260627120000:312-321` | NGN wallet, `'NGN'` literal (`:321`) — stays NGN (program spec M4 deferred) |
| `ledger_reconciliation()` | `20260706120000:223-293` | Per-currency `currencies[]` (`:252-283`); global `accounts[]` kept for backward compatibility and **mixes currencies** once a second currency posts (`:235`, `:290`); `payout_ledger_invariants.sql:161-169` reads that global list |
| `wallet_ledger_reconciliation()` | `20260607120000:464-481` | Sums **all** `customer_wallets.balance_kobo` (`:470`) against **all** `customer_wallet_liability` lines (`:474`) — no currency predicate |
| `vat_reconciliation(from, to)` | `20260607140000:231-262` | Sums `vat_output_payable` / `fee_vat_recoverable` across **all** currencies; returns `'currency': 'NGN'` (`:258`) |

### 1.3 Charge, reconcile, document and reader code paths

| Path | Where | Behaviour today |
|---|---|---|
| Account intents route (create) | `apps/account/app/api/payments/intents/route.ts:42`, `:54-61` | Accepts any of the 15 codes in `CURRENCY_MAP` (`packages/i18n/currency.ts:13-29`) via `normalizeCurrency`; the client supplies `amountMinor`, `currency` and `division`; no allowlist check; inserts through the service-role client |
| Account intents route (replay) | `route.ts:69-93`, `:110-114`, `:170-173` | On `23505` it reads only `id, status`; if still `pending` it **routes again with the NEW body amount and currency** and overwrites `provider_reference` |
| Finalize / webhook apply | `intents/[id]/finalize/route.ts:22`, `:52-59`; `webhooks/[provider]/route.ts:91-95`, `:215-222` | Pass status and fee only; `verified.value.amountMinor` / `currency` are **never read**; `VerifiedWebhook` carries no amount/currency for charge events (`adapter-interface.ts:69-125`) |
| Provider selection | `packages/payment-router/src/router.ts:88-92` | Eligibility = country preference ∩ method capability ∩ registered. **`query.currency` is not consulted** |
| Division card rails | `apps/studio/lib/studio/card-math.ts:14`, `apps/care/lib/payments/card-math.ts:10`, `apps/marketplace/lib/checkout/card-rail.ts:75` | Return `null` / reject for any non-NGN amount; every rail writes `currency: "NGN"`, `country: "NG"`; marketplace mints a fresh `reference` per start (`:80`) |
| Reconcile-on-return | `studio/card-rail.ts:154-192`, `care/card-rail.ts:158-197`, `packages/payment-router/src/division-sale.ts:78-92`, `apps/account/lib/wallet-topup.ts:116-125` | Exact `amount_minor` (+ currency where modelled) match of the **division record against the intent**; mismatch flags, never settles. Studio and care find the intent by `metadata` + `status='succeeded'`; wallet and marketplace by `(user_id, idempotency_key)`. None checks how the intent was born or whether a settlement entry exists |
| Payer currency resolution + charge amount | `packages/pricing/src/currency-model.ts:337-389`, `:414-442` | `resolvePayerCurrency` / `computePayerChargeMinor` exist and are tested; **no app caller**; `computePayerChargeMinor` takes a `rate` it does not validate and rounds floats (`:436-438`) |
| FX rates | `packages/pricing/src/exchange-rate.ts` | Open Exchange Rates, USD base cross-rate (`:107-119`), module cache 30 min (`:16`), `fetch(url, { next: { revalidate: 1800 } })` (`:46`) so the Next Data Cache can serve a 30-minute-old body that is then stamped `fetchedAt = now` (`:57-63`); served stale after 2 h (`:17`); identity fallback flagged `isFallback` (`:102`, `:113`); `convertMinorUnits` returns `null` on fallback (`:151`) but scales minor units with no exponent adjustment (`:154`) |
| Charge allowlist | `currency-model.ts:319-327` (`parseChargeCurrencies`) | Pure parser. **No code reads a `CHARGE_CURRENCIES` env var** anywhere in `apps/`, `packages/`, `scripts/` or `.github/` — the interlock exists in comments only (`currency-model.ts:293, 314`; `ledger.ts:24`; `20260706120000:14, 23`) |
| Provider amount units | Paystack `paystack-provider.ts:136` (minor verbatim); Flutterwave `flutterwave-provider.ts:192` (initiate), `:449-452` (refund), `:533` (transfer) — major via `minorUnitExponent` | Flutterwave rejects a code outside `CURRENCY_MAP` before any math (`:189-190`, `:231-232`, `:449`, `:481-482`, `:531-532`). **The Paystack adapter has no currency guard**: it forwards `params.currency` verbatim (`:137`) and matches balance rows by the raw string (`:212`); the only guard ahead of it is the intents route |
| Provider fee identity (Flutterwave) | `flutterwave-provider.ts:236-260` | `feeMinor = gross − amount_settled − merchant_fee`, which assumes settlement in the charge currency; an inconsistent result (`fm < 0`) is **silently dropped** (`:252-259`) and the charge then posts gross-to-cash |
| Refund route | `intents/[id]/refund/route.ts:72-79`, `:157-161` | Documents `amountMinor` as kobo while the DB treats it as intent-currency minor units; the adopt match treats a provider refund with a null amount as a match (`:159`) |
| Refund email | `webhooks/[provider]/route.ts:162-171` | `refundedMinor = refundEvent.amountMinor ?? intentRow.amount_minor` then `Math.round(refundedMinor / 100)`: a partial refund with a null payload amount emails the full intent amount, in NGN |
| Payout rail (flag-dark `WALLET_AUTO_PAYOUT`) | `apps/account/lib/wallet-payout.ts:145`; transfer webhook `webhooks/[provider]/route.ts:64-78` | Non-NGN payout method → manual review; the transfer webhook calls `post_withdrawal_settlement` / `release_withdrawal` **by name**, keyed on our reference, with no currency dispatch |
| Withdrawal hold, cap and one-at-a-time reads | `apps/account/lib/account-data.ts:979-985`; `wallet-payout.ts:32-49`; `withdrawal/request/route.ts:201-227` | Sum `amount_kobo` across **every** request row of the user, no currency predicate |
| Withdrawal limits | `packages/payment-router/src/withdrawal-limits.ts:31-37` | Per-currency table; only an `NGN.verified` row |
| Studio wallet checkout | `apps/account/app/api/studio/payments/[id]/wallet/route.ts:98-104` | Raw `customer_wallets.balance_kobo` update + wallet-log insert with **no ledger post and no RPC** — the NGN wallet projection can diverge from `customer_wallet_liability` through this path today |
| Receipt / credit-note issuance | `apps/marketplace/lib/checkout/sale-reconcile-port.ts:208-227`; `apps/account/app/api/documents/[type]/[id]/route.ts:36-43`, `:154-200` | The **only** `record_customer_receipt` caller passes the literal `"NGN"` (`:219`) inside a silent `catch {}` (`:225-227`); the `receipt` document type renders the **legacy `customer_invoices` row** (`getInvoiceById`, `receiptNo: R-<invoice_no>`), never `customer_receipts`; there is **no `credit-note` document type**; `record_customer_credit_note`, `generateCreditNotePdf` and `buildCreditNoteProps` have **no application caller** (only `apps/account/scripts/prove-receipts.mts`), and that proof script is NGN-only (`:83-99`) |
| Receipt props / line items | `apps/account/lib/payment-documents.ts:245`, `:407`, `:209-217`, `:258-270` | Throw `currency_not_base` for non-NGN; line items are the breakdown's amounts taken as kobo |
| Document money formatting | `packages/branded-documents/src/format.ts:7-13` | `value / 100` for **every** currency (wrong for a 0-decimal currency) |
| Callback amount display | `apps/account/app/payments/callback/PaymentCallbackClient.tsx:117-119` | `amountMinor / 100` for every currency |
| Other `/ 100` + currency-label sites | `apps/account/components/admin/RefundButton.tsx:63`; `apps/account/app/(account)/admin/refund/page.tsx:114-118`; `apps/account/components/smart-home/DealsRail.tsx:39-45`; `apps/learn/app/instructor/payouts/page.tsx:9`; `apps/logistics/app/(staff)/manager/claims/page.tsx:102`; `packages/ui/src/intelligence/IntelligenceExtras.tsx:19-21`; `packages/interactions/src/pricing.ts:15-17`; `apps/marketplace/app/account/saved/page.tsx:78-81`; `apps/account/lib/regional-context.ts:49-55` (labels kobo with the display currency without converting) | Blanket `÷100` or NGN-kobo assumptions behind a non-NGN label — including the owner's refund decision surface |
| Money emails | `apps/account/lib/email/templates.ts` (42 `NGN` literals across the locale subjects/bodies) | `NGN` literal in every locale's wallet/withdrawal/refund subject |
| Owner finance console | `apps/hub/lib/finance-ledger.ts:244-290`, `:336-387` | Re-derives totals, per-account balances, wallet reconciliation, VAT, intent stats and the 30-day flow from `journal_lines` / `customer_wallets` / `payment_intents` with **no currency predicate**, folding with `+=` |
| Owner-command revenue readers | `apps/hub/lib/owner-command/division-revenue.ts:125-129, 169-187` (selects `division,amount_minor,status,created_at` — currency not even selected); `since-last-looked.ts:42-57`; `apps/hub/lib/owner-data.ts:457, 1034, 1291` (`/ 100` naira sums); `apps/hub/components/owner/OwnerMoneyStrip.tsx:37-38` (labels the sum NGN); `apps/staff/lib/finance-data.ts:93-98` (pending funding/withdrawal sums) | Sum `payment_intents.amount_minor` and request `amount_kobo` across currencies and label the result NGN |
| Wallet display overlay | `apps/account/lib/wallet-currency.ts:43-58` | Converts in major units then re-scales to the target exponent — the correct pattern; **hard-codes the source as NGN kobo** (no `from` parameter) |
| Snapshot builder | `currency-model.ts:207-242` (`buildCurrencySnapshot`) | `convertedDisplayAmount = round(originalAmount × rate)` on **minor** units with no exponent adjustment (`:217-219`); accepts a fallback (rate 1) snapshot and labels the result approximate; no app caller |
| Pending-intent lifecycle | (no code) | No sweeper or expiry exists for `pending` intents; `pending → cancelled` is legal (`20260529120000:124`) but nothing calls it |
| Chargebacks / disputes | (no code) | Neither adapter parses a chargeback or dispute event |

### 1.4 What is live, what is dark

- Live money: Flutterwave card rail (`FL2-GO-LIVE-STATUS-REPORT-2026-06-27.md:18-21, 32`: 39/39
  succeeded attempts on `flutterwave`; ledger balanced; migrations through `v3_19_refunds` applied).
- On `main`, prod application **not recorded** in any status document (FL2 report, apply manifest,
  captured migrations): `20260706120000_v3_money_mc_multicurrency_ledger.sql` and
  `20260706130000_v3_money_payout_rail.sql`. Their landing date and PR are not derivable from this
  shallow clone (git attributes every pre-existing file to the graft commit `b5d1f22` / #499); their
  headers cite the 2026-07-05 and 2026-07-06 designs, which places them at or after 2026-07-06. Build
  step M0 verifies prod state by introspection.
- Dark: `WALLET_AUTO_PAYOUT`, the division card flags per environment, Stripe (V3-14 deferred by D1).
- Consequence worth stating plainly: with the pre-MC `post_charge_settlement` in prod, a non-NGN
  intent that a provider happened to accept would reach `succeeded` with **no ledger entry**
  (`20260611130000:841-845` returns `non_base_currency`). With the MC version it would post
  in-currency, and every reader in §1.2/§1.3 marked "no currency predicate" would then mix that
  currency into NGN figures. Either way the first non-NGN charge must not be possible until the lock
  in §5.4 lands. Today the only thing preventing it is the provider account configuration.

### 1.5 Live findings on `main` (pre-existing, outside the multi-currency scope)

Found while grounding; each verified line by line. They are listed here because the multi-currency
build must not be stacked on them, and because the first needs the owner's attention now.

| Id | Finding | Evidence | Consequence | Fix (M-NOW, §11) |
|---|---|---|---|---|
| LF-1 **critical** | Any signed-in user can INSERT a `payment_intents` row with `status = 'succeeded'` through PostgREST: the insert policy checks only `user_id = auth.uid()`, the status CHECK admits every status, no BEFORE INSERT trigger exists, and `sec_harden_08` keeps the `authenticated` INSERT grant. The reconcilers then trust it: the wallet top-up reconciler credits the wallet for any `succeeded` intent whose `idempotency_key` equals the user's own funding-request reference (`wallet-topup-port.ts:80-93`, `wallet-topup.ts:116-125` → `credit_wallet_topup`, which checks no settlement entry); studio and care flip their record to paid on a `succeeded` intent found by `metadata` (`studio/card-rail.ts:166-180`, `care/card-rail.ts:174-182`); marketplace posts revenue (`division-sale.ts:82-88`). | `20260529120000:48-50`, `:117-137`, `:235-237`; `20260627213858:30-32`; no `before insert` on `payment_intents` in any migration | A user self-credits any wallet amount with no money moved (the live rail), withdrawable through finance review today and automatically once `WALLET_AUTO_PAYOUT` is on; studio/care/marketplace release goods for ₦0 where their card flag is on. `ledger_reconciliation` stays "balanced" (the top-up entry balances); only `payments_clearing` shows a debit balance | Birth guard: drop `payment_intents_insert_own`, revoke INSERT from `authenticated`, and a BEFORE INSERT trigger that raises for the request roles and forces `status = 'pending'` + `provider_reference is null` for `service_role` (proposed migration `01_payment_intents_birth_guard.sql`, held). The reconcilers additionally require a `('payment_intent', intent)` settlement entry before crediting or flipping (M-NOW item 3) |
| LF-2 **critical (provider-conditional)** | Nothing compares the provider-confirmed amount and currency to the intent, and the intents route re-routes a still-`pending` intent with the **new body amount** on an idempotency replay, overwriting `provider_reference`. If the provider accepts a re-initialisation of the same reference for a smaller amount (Flutterwave re-initialises an unpaid `tx_ref`; Paystack rejects a duplicate reference), the buyer pays the small amount, the webhook re-verifies payload against verify (never against the intent), `apply_payment_webhook` applies `succeeded`, `post_charge_settlement` posts the intent's **original** amount, and the reconciler credits it | `intents/route.ts:69-93, 110-114, 170-173`; `finalize/route.ts:52-59`; `webhooks/[provider]/route.ts:215-222`; `20260611130000:899-926`; `20260706120000:151` | Loss = frozen amount − paid amount, withdrawable | `apply_payment_webhook(..., p_confirmed_amount_minor, p_confirmed_currency)` raising on mismatch; both routes pass the verify figures; the replay branch routes with the **stored** amount and currency (409 when the body differs) and never overwrites `provider_reference` |
| LF-3 medium | The studio wallet checkout debits `customer_wallets` with a raw update and no ledger post | `studio/payments/[id]/wallet/route.ts:98-104` | NGN `wallet_ledger_reconciliation` diverges by every such checkout | Route the debit through a guarded `payments_private` RPC that posts DR `customer_wallet_liability` / CR `payments_clearing` (or revenue) in the same txn — a separate hardening pass; noted so MC-CI-10's "per-currency delta = 0" is not mistaken for prod truth |
| LF-4 low | The refund email falls back to the full intent amount when the payload amount is null, and every locale subject hard-codes NGN | `webhooks/[provider]/route.ts:162-171`; `templates.ts` | Wrong amount in a customer email on a partial refund | Email only from the RPC result (§8.1) |

---

## 2. The NGN-lock inventory (what the build widens, in order)

Each lock is widened by exactly one build step (§11) and is never removed without the CI rule that
replaces it (§10) landing in the same change.

| # | Lock | File:line | Widened in | Replaced by rule |
|---|---|---|---|---|
| N1 | `payment_intents.currency` has no CHECK; no allowlist; no birth guard; authenticated INSERT policy | `20260529120000:47, 235-237`; `20260627213858:30-32`; `intents/route.ts:42` | M-NOW (birth guard), M1 (policy table) | MC-CI-07 |
| N2 | `wallet_ledger_reconciliation` sums across currencies | `20260607120000:464-481` | M1 | MC-CI-01 |
| N3 | `vat_reconciliation` sums across currencies, labels result NGN | `20260607140000:231-262` | M1 | MC-CI-01 |
| N4 | `ledger_reconciliation().accounts` global list; `payout_ledger_invariants.sql` p7 reads it | `20260706120000:235, 290`; `payout_ledger_invariants.sql:161-169` | M1 (drop + amend p7) | MC-CI-01, MC-CI-12 |
| N5 | Hub finance reader re-derives without currency | `apps/hub/lib/finance-ledger.ts:244-290, 336-387` | M1 | MC-CI-01 |
| N5a | Owner-command and staff money readers sum intents/requests across currencies | `division-revenue.ts:125-129, 169-187`; `since-last-looked.ts:42-57`; `owner-data.ts:457, 1034, 1291`; `OwnerMoneyStrip.tsx:37-38`; `apps/staff/lib/finance-data.ts:93-98` | M1 | MC-CI-01 |
| N6 | `post_sale_revenue` tags `'NGN'`, trusts the caller's gross and event id | `20260607140000:197-224` | M4 | MC-CI-02 |
| N7 | `payment_refunds_currency_base`; `initiate_payment_refund` non-NGN gate and `'NGN'` on the row; `'NGN'` on refund postings; `fail_payment_refund` re-credits the NGN wallet unconditionally | `20260611130000:90-91, 258-259, 321, 341, 399-421, 416, 536, 606` | M1 (currency assertion), M4 (widening) | MC-CI-02, MC-CI-05, MC-CI-10 |
| N8 | `customer_credit_notes_currency_base`; `record_customer_credit_note` NGN guard and literal | `20260611130000:674-675, 719-720, 787` | M4 | MC-CI-06 |
| N9 | `customer_receipts_currency_base`; `record_customer_receipt` NGN guard and literal | `20260607130000:90-91, 151-152, 193` | M5 | MC-CI-06 |
| N10 | `buildReceiptProps` / `buildCreditNoteProps` `currency_not_base`; kobo line items | `payment-documents.ts:245, 407, 209-217, 258-270` | M5 | MC-CI-06 (TS) |
| N11 | `/ 100` and NGN-kobo formatting behind non-NGN labels | `branded-documents/src/format.ts:7-13`; `PaymentCallbackClient.tsx:117-119`; `webhooks/[provider]/route.ts:171`; the "Other `/ 100`" row in §1.3 | M1 (formatters + guard), M5 (documents) | MC-CI-04 |
| N12 | Money-email `NGN` subjects/bodies; refund email full-amount fallback | `templates.ts`; `webhooks/[provider]/route.ts:162-171` | M5 | MC-CI-04 + email matrix row |
| N13 | Division rails: NGN-only math, `currency: "NGN"`, `country: "NG"`, fresh reference per start, NGN breakdown passed to receipts | `card-math.ts` ×2; marketplace `card-rail.ts:75, 80, 112-113`; `sale-reconcile-port.ts:53-70, 186-219` | M6 | MC-CI-08, MC-CI-06 |
| N14 | Provider selection ignores currency | `router.ts:88-92` | M3 | MC-CI-09 |
| N15 | `credit_wallet_topup` NGN-only; wallet by `user_id`; ignores `posted:false` | `20260607120000:375-376, 382-383, 413-419` | M1 (posted assertion), M7 | MC-CI-10 |
| N16 | Payout RPCs: `settle`/`release` read no currency; postings `'NGN'`; transfer webhook dispatches by name; auto-payout non-NGN → manual | `20260706130000:118-119, 149, 183-184, 199-202, 209`; `webhooks/[provider]/route.ts:64-78`; `wallet-payout.ts:145` | M1 (assertions + dispatch), M7 | MC-CI-10 |
| N17 | `DEFAULT_WITHDRAWAL_LIMITS` NGN row only | `withdrawal-limits.ts:31-37` | M7 | per-row exponent test (§7.3) |
| N18 | `computePayerChargeMinor` accepts any `rate`, rounds floats | `currency-model.ts:436-438` | M2 | MC-CI-03, MC-CI-04 |
| N19 | `buildCurrencySnapshot` / `convertMinorUnits` scale minor units without exponent; `buildCurrencySnapshot` accepts a fallback; `convertWalletDisplay` hard-codes an NGN source | `currency-model.ts:215-219, 234-238`; `exchange-rate.ts:154`; `wallet-currency.ts:43-58` | M2 | MC-CI-04 |
| N20 | Flutterwave fee identity assumes same-currency settlement and drops an inconsistent fee silently | `flutterwave-provider.ts:236-260` | M3 | MC-CI-09 + settle-test oracle (§6.4) |
| N21 | `apply_payment_webhook` takes no confirmed amount/currency; finalize/webhook never read them | `20260611130000:899-926`; `finalize/route.ts:52-59`; `webhooks/[provider]/route.ts:215-222` | M-NOW | MC-CI-08 |
| N22 | Intents route replay re-routes with the body amount | `intents/route.ts:69-93, 110-114, 170-173` | M-NOW | MC-CI-08 |
| N23 | Paystack adapter has no currency guard | `paystack-provider.ts:137, 212` | M3 | MC-CI-09 |
| N24 | Hold / cap / one-at-a-time reads sum every request row | `account-data.ts:979-985`; `wallet-payout.ts:32-49`; `withdrawal/request/route.ts:201-227` | M1 | MC-CI-01 |
| N25 | No receipt / credit-note issuance path (documents route reads legacy invoices; no `credit-note` type; no credit-note caller; NGN-only proof script) | `documents/[type]/[id]/route.ts:36-43, 154-200`; `sale-reconcile-port.ts:208-227`; `prove-receipts.mts:83-99` | M5 | MC-CI-06 |
| N26 | CI bootstrap `customer_wallets` lacks prod's `currency`, `is_active`, `frozen_at` | `_bootstrap_supabase_env.sql:42-48` | M1 | MC-CI-11 |
| N27 | Exchange-rate freshness measured on the wrong clock (Data Cache + hourly feed) | `exchange-rate.ts:46, 57-63` | M2 | MC-CI-03 |
| N28 | Refund route amount units undocumented per currency; adopt wildcard; no `p_currency` | `refund/route.ts:72-79, 157-161`; `20260611130000:270-278` | M4 | MC-CI-05 |
| N29 | No pending-intent expiry; disabling a currency would not touch in-flight intents | (no code); `20260529120000:124` | M2 (sweeper), M1 (disable cancels) | MC-CI-07, MC-CI-08 |
| N30 | `customer_wallets.currency` and the request tables' `currency` have no CHECK | prod `:3028`; `20260611120000:51, 88, 113` | M1 | MC-CI-10 |

Locks that are **kept on purpose**: the NGN statutory fee-VAT split (`20260706120000:187-188`),
`LEDGER_CURRENCY = "NGN"` as the presentation base (`packages/payment-router/src/ledger.ts:18`),
`SYSTEM_BASE_CURRENCY = 'NGN'` (`currency-model.ts:108`; a second constant of the same name at
`packages/i18n/currency.ts:31`), the AI metering wallet (`post_ai_usage_charge`, NGN), and the
studio wallet checkout (LF-3, its own pass).

---

## 3. Principles (the invariants)

"Minor units" always means the minor unit of the currency named on the same row, scaled by that
currency's exponent (`getCurrencyMinorUnit`, `packages/i18n/currency.ts:59-61`; NGN 2, USD 2, XOF 0).

| Id | Invariant | Rule |
|---|---|---|
| MC-INV-01 | Minor units of two currencies are never added, compared or netted. Every aggregate over `journal_lines`, the wallet tables, the request tables, `payment_intents.amount_minor` or `payment_refunds.amount_minor` carries a currency predicate or groups by currency — in SQL and in TypeScript folds alike. | MC-CI-01 |
| MC-INV-02 | A posting's currency is the currency of the money event it records: the intent's currency for a charge, sale, refund or receipt; the wallet's currency for a wallet move. No RPC chooses a currency on its own, and no RPC trusts a caller-supplied currency it can derive from the row. | MC-CI-02, MC-CI-05, MC-CI-06, MC-CI-10 |
| MC-INV-03 | FX is applied in exactly one place, before an intent exists: the payer-charge seam (§5). The frozen result (currency, minor amount, rate snapshot id) is what the provider is asked to charge, what the provider must confirm, what reconcile matches, what a refund reverses and what a receipt prints. Nothing downstream re-converts. | MC-CI-03, MC-CI-08 |
| MC-INV-04 | A charge never starts on a fallback, stale or missing rate, measured on the rate's own timestamp, not the fetch time. Display may use a labelled approximation; a charge may not. | MC-CI-03 |
| MC-INV-05 | Exponent-correct everywhere: no `× 100` / `÷ 100` on a value whose currency is not statically NGN; `formatMoney(amountMinor, currency)` from `@henryco/i18n` is the only money formatter. | MC-CI-04 |
| MC-INV-06 | A currency becomes chargeable only through one switch, enforced at the database (`payments_private.charge_currency_policy`), flipped by the owner with a verified settle-test reference. The app reads the same table; there is no env var and no default list in code. | MC-CI-07 |
| MC-INV-07 | Per currency, the refund leg, the credit-note leg and the receipt leg are proven in CI **and** exercised in the live settle test before the charge leg can be enabled. A refund is always in the charge currency, for at most the captured amount, at the charged figure. | MC-CI-05, MC-CI-06, §11 gate G3 |
| MC-INV-08 | Status is provider-confirmed truth (unchanged). The provider's confirmed amount and currency are compared to the intent's frozen amount and currency inside `apply_payment_webhook`; a mismatch raises, no settlement posts, an alarm fires. **Not built today (LF-2).** | MC-CI-08 |
| MC-INV-09 | A wallet holds one currency. Wallet moves are same-currency only, dispatched by the row's currency to the matching RPC family. There is no cross-currency wallet transfer, auto-conversion or netting in this program. | MC-CI-10 |
| MC-INV-10 | The presentation base is NGN. Consolidated figures are computed in a read-only, as-of function from explicit, auditable reporting-rate snapshots; they are never posted. | §4.6, MC-CI-01 |
| MC-INV-11 | Nothing here weakens an existing invariant: per-entry balance, immutability, idempotency, grant lockdown, A1/A2/A3, the refund cap, the receipt and credit-note ties. Every existing proof suite stays green at its CI position, unchanged in meaning. | MC-CI-12 |
| MC-INV-12 | An intent is born `pending` by a server path only. No request role can insert one; no insert carries a status, a `provider_reference` or (for a non-NGN intent) a snapshot the seam did not produce. | MC-CI-07 |
| MC-INV-13 | Enabling and disabling a currency is transactional with its in-flight money: enable validates a completed settle-test cycle; disable cancels that currency's `pending` intents in the same transaction and reports the count. | MC-CI-07 |

---

## 4. Ledger design

### 4.1 Books: one chart, per-currency columns (built)
The in-currency ledger (`journal_entries.currency`, per-entry balance) is the foundation and is not
re-litigated. A balance for `(account, currency)` is the only meaningful balance. The global
`ledger_reconciliation().accounts` list (`20260706120000:235-291`) is **dropped** in M1 (not
renamed: a stale reader must fail loudly, not pass vacuously) and `payout_ledger_invariants.sql`
p7 is amended in the same change to iterate `currencies[]` and assert `withdrawals_payable = 0`
per currency. `currencies[]` is the contract.

### 4.2 Chart additions
Two accounts, added in M1 so the chart is complete before any non-NGN entry can exist. Both satisfy
`ledger_accounts_normal_balance_consistent` (`20260607120000:51-54`); no proof suite counts accounts.

| Code | Type | Normal | Purpose |
|---|---|---|---|
| `fx_conversion_clearing` | liability | credit | The two single-currency legs of an **explicit** conversion event (a treasury conversion, a provider that settles a different currency than it charged, or a chargeback debited in another currency — §6.3, §6.7). Each leg posts in its own currency; the reporting view closes the pair at the realised rate. No v1 writer. |
| `fx_gain_loss` | expense | debit | Realised difference between a booking rate and a realised rate on an explicit conversion event. Gains post as credits. No v1 writer. |

Both are seeded via `LEDGER_ACCOUNTS` (`ledger.ts:48-64`) and the SQL seed in lockstep. MC-CI-02
proves that no v1 function body references either code.

### 4.3 Posting rules per money event (all in the event's currency)
| Event | Entry (currency = intent/wallet currency) | Change vs today |
|---|---|---|
| Charge settled, no fee known | DR `cash_settlement` gross / CR `payments_clearing` gross | none (built); the confirmed-amount check (§6.3) gates it |
| Charge settled, fee known | DR `cash_settlement` net, DR `processor_fees` fee-ex, DR `fee_vat_recoverable` fee-VAT (NGN statutory split; provider-reported only otherwise), CR `payments_clearing` gross | A fee whose currency differs from the charge currency, or a fee ≥ gross, is **dropped** (gross-to-cash posts, `fee_dropped` returned, alarm) instead of raising inside the webhook transaction (§6.5) |
| Sale recognised | DR `payments_clearing` gross / CR `platform_revenue` ex-VAT, CR `vat_output_payable` output VAT | `post_sale_revenue(p_intent_id uuid, p_output_vat_minor bigint)`: gross and currency are **derived from the intent row** (raise `intent_not_found`; require status in succeeded / refund_processing / refunded; raise when a caller-supplied gross is kept and differs). No currency parameter, no default (M4) |
| Refund confirmed | DR `payments_clearing` / CR `cash_settlement` for the refund amount; proportional reversal of revenue + output VAT with the existing clamp math (currency-neutral, `20260611130000:581-590`) | postings tagged with the refund row's currency (M4) |
| Wallet top-up allocation | DR `payments_clearing` / CR `customer_wallet_liability` | NGN: `credit_wallet_topup` asserts `posted = true` (M1); currency wallets: `credit_currency_wallet_topup` (M7) |
| Withdrawal reserve / settle / release | as built (`buildWithdrawal*Lines`) | NGN RPCs assert the row currency is NGN (M1); currency family mirrors (M7) |

### 4.4 VAT in a multi-currency book
VAT attaches to the supply, not to the currency.
- **Output VAT** on a standard-rated supply paid in USD is carved from the USD gross with the same
  inclusive math (`carveInclusiveVat`) and posted to `vat_output_payable` **in USD**. The
  classification engine (`packages/config/tax.ts`) decides the treatment; currency is not an input.
  Whether a non-resident buyer's supply is an export (zero-rated) is an accountant decision (D-MC-05);
  until answered, foreign-currency sales default to the division's treatment.
- **Fee VAT** on a foreign-currency processor fee is posted to `fee_vat_recoverable` in that currency
  **only when the provider itemises it** (built, `20260706120000:186`).
- `vat_reconciliation(from, to)` returns **one row per currency**:
  `{currency, output_vat_collected_minor, input_vat_recoverable_minor, net_vat_payable_minor, in_return}`.
  `in_return` is true for the NGN row only until D-MC-05 is answered.
- **The FIRS figure** (M8) is: NGN net VAT **plus** the reporting conversion of each foreign row's
  `output_vat_collected_minor`. Foreign `input_vat_recoverable_minor` is shown on a separate line
  labelled "not in the return pending D-MC-05" and is **never netted by default** — netting it would
  be the under-remit direction. The hub monthly net-VAT table shows one block per currency and the
  composed return figure with its rate ids.

### 4.5 Reconciliation readers (M1, before any currency can be enabled)
| Reader | Change |
|---|---|
| `payments_private.wallet_ledger_reconciliation()` | Returns `{wallets: [{currency, wallet_balance_total_minor, ledger_wallet_liability_minor, delta_minor, reconciled}]}`; NGN sums `customer_wallets where currency = 'NGN'`, other currencies sum `customer_currency_wallets` (§7.2); liability lines join `journal_entries.currency`. `customer_wallets` gains `check (currency = 'NGN')`; the funding/withdrawal request tables gain the same CHECK until M7 widens them. |
| `payments_private.vat_reconciliation()` | Per-currency rows (§4.4). |
| `payments_private.ledger_reconciliation()` | `accounts` dropped; `currencies[]` is the contract; p7 of the payout proof amended. |
| Tag consistency (new proof, run in CI and nightly) | Every `journal_entries` row with `source in ('payment_intent','sale_revenue','payment_refund','sale_revenue_refund')` has `currency = ` the intent's currency; every `withdrawal_*` / `wallet_*` row has the wallet's currency. Per-currency `balanced` alone proves nothing (each entry balances by trigger), so the soak gate asserts **concrete per-(account, currency) expectations**: `payments_clearing` = Σ unallocated succeeded intents in that currency; `withdrawals_payable` = Σ `processing` requests; `customer_wallet_liability` = wallet totals per family; foreign `cash_settlement` = Σ(gross − fee) − Σ refunds. |
| `apps/hub/lib/finance-ledger.ts` | Every fold groups by currency: `journal_lines` reads join `journal_entries(currency)`; `customer_wallets` reads carry `currency`; `payment_intents` stats, stuck, flow and recent group by `currency`. One block per currency; never a mixed total. `FINANCE_TRACE_SQL` texts gain `GROUP BY currency`. |
| Owner-command and staff readers (N5a) | `division-revenue.ts`, `since-last-looked.ts`, `owner-data.ts`, `OwnerMoneyStrip.tsx`, `apps/staff/lib/finance-data.ts`: select `currency`, fold per `(division, currency)`, render the NGN figure plus "+ n in other currencies" rather than a sum. |
| Request-table readers (N24) | `getWithdrawalRequests`, `getPendingWithdrawalHoldKobo`, `getWindowWithdrawnKobo`, the request route's one-at-a-time check: `.eq("currency", X)`; one-at-a-time and the daily cap are per currency. |
| FL2 soak scripts and the owner's "balanced to zero" check (`prove-refund-seam.mts:136`) | Read `currencies[]` and the per-(account, currency) expectations above. |

### 4.6 Reporting base and consolidation (M8)
- Presentation base: NGN (unchanged; `LEDGER_CURRENCY`).
- `payments_private.currency_exponents(currency pk, exponent int)` is seeded from `CURRENCY_MAP`
  with a CI parity test (the TS map stays the source; SQL needs the exponent to convert).
- Reporting rates live in `public.fx_rate_snapshots` with `kind = 'reporting'` (§5.5), entered by
  finance (CBN reference rate or whatever the accountant specifies — D-MC-06), never from the OER feed.
- `payments_private.ledger_consolidated(p_as_of timestamptz, p_snapshot_ids uuid[])` is a `STABLE`,
  read-only function: balances come from `journal_lines` joined to `journal_entries where posted_at < p_as_of`,
  grouped by `(currency, account_code)`; rates are read **by id** from `fx_rate_snapshots`
  (`kind = 'reporting'`, `quote_currency = 'NGN'`, `base_currency` = the row currency,
  `rate_as_of <= p_as_of`, exactly one per foreign currency, raise on missing or duplicate);
  conversion is `balance_minor × rate_e8 × 10^(2 − exp_foreign) / 10^8` in integer arithmetic. It
  returns NGN-equivalent figures **labelled as derived**, with the rate id per currency. It never
  writes; it is in the MC-CI-02 function-body scan. The hub calls it only on the consolidated tab;
  the default tab is per-currency.
- No translation adjustment is posted in v1.

---

## 5. FX design — the one conversion seam

### 5.1 Where conversion is allowed
Exactly one server-only function converts money for a charge:

```
resolvePayerCharge({
  division, userPreference, countryCode,
  pricingCurrency: 'NGN', pricingAmountMinor,     // the NGN list price, in kobo
  policy,                                         // from loadChargeCurrencyPolicy(); no default
  now,
}) → { charge: { currency, amountMinor }, snapshot: FxChargeSnapshot } | { blocked: reason }
```
Inside: `resolvePayerCurrency` (built) → policy row (§5.4) → rate fetch (charge-grade, §5.2) →
freshness check → spread → exact integer conversion (§5.3) → floor check → persist snapshot →
return. Every division rail calls this and nothing else; the figure handed to `router.route` **is**
`snapshot.payerAmountMinor`, asserted in one place. A missing policy set is a `blocked` result, never
a default. `computePayerChargeMinor` is retired as an entry point and kept as the pure core with
integer math and a `spreadBps` parameter. The display path (approximate prices, wallet overlay) keeps
using `getExchangeRateSnapshot` with the `isApproximateDisplay` label and is forbidden from writing
any `*_minor` column (MC-CI-04).

### 5.2 Rate freshness, quote TTL and the capture window
- **Freshness is measured on the rate's own timestamp.** The OER response `timestamp` is persisted
  as `rate_as_of`; a charge rate must have `rate_as_of >= now() − CHARGE_RATE_MAX_AGE (30 min)` and
  must not be a fallback. Charge-grade reads use a dedicated `fetchChargeRates()` with
  `cache: "no-store"` (the display path keeps the Data Cache). `isStale`/`fetchedAt` are display
  concepts only.
- **Quote TTL at the surface:** the payer-currency amount shown is valid for 15 minutes; a charge
  start after that re-resolves and the re-resolved amount is what the provider charges.
- **Capture window (new):** an intent is not a free option. `pending` intents older than
  `CHARGE_CAPTURE_TTL` (card: 60 minutes) are moved to `cancelled` by a sweeper routine through
  `advance_payment_intent(pending → cancelled)`; a provider capture that arrives for a `cancelled`
  intent is not applied — `apply_payment_webhook` returns `late_capture`, the route flags it for the
  orphan/refund queue, and nothing posts. In v1 non-NGN charges are **card only** (hosted page,
  minutes); `bank_transfer` and `ussd` are excluded for non-NGN in the method matrix (§6.1). One open
  non-NGN intent per division record: the record's `charged_amount_minor` is set once (CAS); a second
  start cancels the first.
- **Exposure, stated honestly.** In-currency settlement removes FX from the ledger, not from the
  business: wherever the obligation is NGN-denominated (marketplace vendor payouts, studio and care
  costs), the company holds the payer currency against an NGN payable until treasury converts. The
  spread is sized to the **capture window plus the treasury conversion lag**, not to the quote TTL
  (D-MC-03, D-MC-11).

### 5.3 Rounding — integer-exact, never below the reference price
- The rate is stored as an integer `rate_e8` (rate × 10^8, **rounded up** at fetch for
  `kind = 'charge'`), with `CHECK (rate_e8 >= 10000)` so relative precision stays within 0.5 bps for
  every supported pair; the spread as `spread_bps`. The effective rate is
  `rate_e8 × (10_000 + spread_bps) / 10_000` in integer arithmetic.
- `payerMinor = ceil( pricingMinor × rate_e8 × (10_000 + spread_bps) × 10^expPayer / (10^8 × 10_000 × 10^expPricing) )`
  computed with `BigInt`. With the rate rounded up and the ceiling, the payer never pays less than the
  reference price and never more than one minor unit above it. The snapshot records
  `pricingAmountMinor`, `payerAmountMinor`, `rate_e8`, `spread_bps`, `rate_as_of` so the figure is
  reproducible.
- Same-currency (NGN → NGN) is an identity path: rate 1, spread ignored, and the NGN policy row carries
  `CHECK (spread_bps = 0)` so the M6 "NGN path byte-identical" gate cannot be broken by configuration.
- Per-currency floor: `floor_minor` on the policy row (e.g. USD 100, XOF 500) — below it the charge
  is blocked. Provider minimums are checked at the live settle test, not assumed.
- `buildCurrencySnapshot` and `convertMinorUnits` are corrected to convert through major units and
  the target exponent (the pattern of `wallet-currency.ts:54-58`), `buildCurrencySnapshot` returns
  `convertedDisplayAmount: null` for a fallback snapshot, and `convertWalletDisplay(amountMinor,
  fromCurrency, toCurrency)` takes its source currency (identity when equal) before any caller is
  wired (M2).

### 5.4 The policy table and the birth guard (DB truth, owner-flipped)
```
payments_private.charge_currency_policy (
  currency text primary key check (currency ~ '^[A-Z]{3}$'),
  enabled boolean not null default false,
  wallet_enabled boolean not null default false,          -- M7
  spread_bps int not null default 0 check (spread_bps between 0 and 1000),
  floor_minor bigint not null check (floor_minor >= 0),
  settle_test_user_id uuid,                                -- the only user who may create an intent in a disabled currency
  settle_test_division text,
  settle_test_ref uuid,                                    -- the intent that completed §6.4
  enabled_at timestamptz, enabled_by uuid, updated_at timestamptz not null default now(),
  check (currency <> 'NGN' or spread_bps = 0)
)
```
- Seeded with `NGN enabled = true, spread 0, floor 10000`. Any other currency is inserted
  `enabled = false` and flipped only through `set_charge_currency_enabled(currency, enabled, ref)`
  (service-role, audit-logged), which **validates** the reference on enable: an intent in that
  currency whose status is `refunded`, with a `payment_refunds` row `succeeded`, a
  `customer_credit_notes` row and a `customer_receipts` row, created by `settle_test_user_id`, whose
  succeeded attempt's provider lists the currency in `PROVIDER_CURRENCIES`. On disable it cancels
  that currency's `pending` intents in the same transaction and records the count.
- **The birth guard** (M-NOW, independent of the policy table): `payment_intents_insert_own` is
  dropped and INSERT is revoked from `authenticated`; a BEFORE INSERT trigger raises for the request
  roles (`current_user in ('anon','authenticated')`), and for `service_role` requires
  `new.status = 'pending'` and `new.provider_reference is null` (superuser-run proofs and migrations
  are exempt, which is how the existing fixtures seed captured intents). The only client creator
  (`WalletTopUpClient` → `/api/payments/intents`) already goes through the service-role route.
- **The currency guard** (M1, same trigger): raise unless the currency row exists and is `enabled`,
  or `new.user_id = settle_test_user_id` for that row; for `currency <> 'NGN'` require
  `metadata->'fx_charge_snapshot'` present with `payerCurrency = new.currency`,
  `payerAmountMinor = new.amount_minor`, and `rateSnapshotId` resolving to an `fx_rate_snapshots`
  row with `kind = 'charge'` and `rate_as_of >= now() − 30 min`. A wallet-funding intent (a
  `customer_wallet_funding_requests` row with `user_id = new.user_id and payment_reference =
  new.idempotency_key`) must match that request's `currency` and `amount_kobo`. CHECK
  `payment_intents.currency ~ '^[A-Z]{3}$'`.
- The app reads the policy table (60-second cache) through `loadChargeCurrencyPolicy()` and passes
  the enabled set to `resolvePayerCurrency`; `parseChargeCurrencies` remains a pure helper for tests;
  its docblock, `ledger.ts:24` and the MC migration header are rewritten so no text names an env var.

### 5.5 Snapshot persistence
```
public.fx_rate_snapshots (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('charge','reporting')),
  pricing_currency text not null, payer_currency text not null,   -- ^[A-Z]{3}$; direction is pinned by the names
  rate_e8 bigint not null check (rate_e8 >= 10000),
  spread_bps int not null default 0,
  source text not null,                     -- 'openexchangerates' | 'cbn' | 'manual:<who>'
  rate_as_of timestamptz not null,          -- the feed's own timestamp
  fetched_at timestamptz not null,
  created_at timestamptz not null default now(),
  check (kind <> 'charge' or pricing_currency = 'NGN')             -- v1: every charge quote is NGN-priced
)
```
Append-only (immutability trigger reused from the ledger pattern), service-role write via
`record_fx_rate_snapshot`, staff read. The intent's `metadata.fx_charge_snapshot` (a new key, kept
distinct from the float `currency_snapshot` display columns of `20260419120000`) stores
`{ pricingCurrency, pricingAmountMinor, payerCurrency, payerAmountMinor, rateSnapshotId, rate_e8,
spread_bps, rate_as_of, quotedAt }`. `freeze_intent_money_columns` is widened to raise when
`metadata->'fx_charge_snapshot'` changes **or is removed** after it is first set.

### 5.6 Rate source (D-MC-04)
Display and charge quotes use OER today (`OPENRATE_APP_ID`). Keep one feed for the charge quote;
confirm the plan allows commercial use at hourly freshness, or switch the charge quote to the
acquiring provider's published rate. Reporting rates are manual (`kind = 'reporting'`).

---

## 6. Provider design

### 6.1 Currency capability joins the routing rule
`PROVIDER_CURRENCIES: Record<PaymentProviderKey, readonly ISO4217[]>` in
`packages/payment-router/src/routing/currency-matrix.ts`; `eligibleProviders` (`router.ts:88-92`)
adds `providerSupportsCurrency(adapter, query.currency)`, evaluated on
`adapter.supportedCurrencies ?? PROVIDER_CURRENCIES[key]` so a mock registered under a real key
(`router.ts:207-215`) declares every currency and `MOCK_PAYMENT=1` keeps working. The table starts
conservative: `paystack: ["NGN"]`, `flutterwave: ["NGN"]`, `stripe: []`. A currency is appended to a
provider's row only after the owner's live settle test on that provider (§6.4), in the same change
that flips `charge_currency_policy.enabled`. The method matrix gains a per-currency restriction:
non-NGN is `card` only in v1 (§5.2).

### 6.2 Routing country
The rails pass the merchant's acquiring country (`country: "NG"`), not the payer's. That stays.
Payer-country routing arrives with Stripe (V3-14, D1). `country-defaults.ts` is untouched.

### 6.3 The confirmed-amount check (M-NOW) and in-currency settlement (v1)
- `apply_payment_webhook` gains `p_confirmed_amount_minor bigint, p_confirmed_currency text`. For a
  money-confirming status it raises `check_violation` unless both equal the intent row (NULL is
  accepted only on a Paystack async webhook that omits the amount, and then finalize's verify figures
  must already have been applied); the route turns the raise into a 409 + alarm, never a retry loop.
  Both adapters surface `amountMinor`/`currency` **from the verify** on charge events; both routes
  pass them. Flutterwave `refund()` receives the intent currency and refuses when the transaction's
  currency differs.
- A currency is enabled on a provider only if that provider holds a balance in it and settles it
  in-currency. If a provider converts (charges USD, settles NGN), the in-currency posting would
  record USD cash that never arrives and the Flutterwave fee identity would be inconsistent. Such a
  pairing is **not enabled in v1**; the explicit "charge-then-convert" model through
  `fx_conversion_clearing` is designed in §4.2 with no v1 writer (D-MC-02, D-MC-10).

### 6.4 The live settle test per (provider, currency) — the owner's oracle
Run as `settle_test_user_id` on `settle_test_division` while the currency is still disabled.
1. Read the provider's balance in the currency (`getBalance`, built in both adapters) → `B0`, and
   note the account is otherwise quiet.
2. One real charge in that currency through the full rail (card).
3. Finalize and the webhook both pass the **confirmed-amount check** (§6.3) against the intent.
4. `ledger_reconciliation().currencies[X]` shows `cash_settlement` = net, a `processor_fees` line
   **> 0** (a missing fee line means the fee was dropped or inconsistent — stop), `payments_clearing`
   = gross, balanced; the NGN column is byte-for-byte unchanged.
5. **Primary oracle:** the provider's settlement record for that transaction, read after the
   settlement date, shows settlement **currency = X** and net = gross − fee. Balance delta `B1 − B0`
   is a secondary check only (available balances lag settlement by a day or more and other activity
   moves them); "balance did not move" is not proof of conversion until the settlement date.
6. One refund of that charge; `refund.processed` arrives; the refund posting is in-currency; a
   receipt PDF **and** a credit-note PDF are downloaded from the new document routes (§9.1).
7. `set_charge_currency_enabled(X, true, <intent id>)` validates all of the above (§5.4) and adds
   the provider row.
An owner gate, not CI. CI proves the code paths on synthetic data (§10).

### 6.5 Fees
- `feeMinor`/`feeVatMinor` are read in the charge currency only when the provider's fee currency
  equals the verify currency; otherwise the adapter reports `feeStatus: 'inconsistent'`, which is
  **fatal on verify** (no settle, alarm). Flutterwave reports `feeStatus: reported | unreported |
  inconsistent` (`fm < 0`, or a settlement currency different from the charge currency, is
  inconsistent — never silently dropped).
- `post_charge_settlement` never raises inside the webhook transaction for a fee problem: a fee ≥
  gross or a fee VAT out of range posts gross-to-cash, returns `fee_dropped: true`, and the route
  alarms (`henry.payment.fee.dropped`) so finance can post the fee by a correcting entry. The status
  write (provider truth) always applies.
- NGN: statutory split when not itemised (built). Any other currency: provider-reported VAT only.
- Payout (transfer) fees follow the same rule in the wallet currency (§7.3).

### 6.6 Units
Paystack takes minor units verbatim (`:136`); Flutterwave takes major units through the exponent
(`:192`, `:449-452`, `:533`) and converts back with `majorToMinor` (`:667-669`). M3 adds the same
`normalizeCurrency` guard to the Paystack adapter (`initiate`, `finalize`, `getBalance`, `refund`,
`listRefunds`) so both fail closed by construction. `PROVIDER_CURRENCIES.paystack` gains a
0-decimal code only after a live settle test on that Paystack product. The adapter test suites gain
one case per currency in `PROVIDER_CURRENCIES` (USD, and XOF as the 0-decimal canary) on initiate,
verify, refund and transfer, plus the fee-currency and fee ≥ gross cases. `CURRENCY_MAP` is the
single exponent source; `payments_private.currency_exponents` mirrors it with a parity test (§4.6).

### 6.7 Chargebacks and disputes
Neither adapter models them today. M3 adds a `chargebackEvent` to `VerifiedWebhook` for both
adapters that, in v1, only alarms and writes a finance-queue row (no posting); a chargeback debited by
the provider in a different currency is the conversion event of §4.2 and gets its own pass. A
hazard-register row records the gap.

---

## 7. Wallet design

### 7.1 NGN wallets stay NGN, and the NGN RPCs learn to refuse other currencies (M1)
- `customer_wallets` is one row per user (`UNIQUE (user_id)`, prod `:6213`), read by every wallet
  surface with `.maybeSingle()` (`account-data.ts:199-207`, `dashboard-modules-wallet/src/data.ts:102-105`,
  the AI metering RPCs `20260627120000:166-169`, the studio wallet checkout). Dropping the unique
  constraint would put every one of those readers at risk. **It is not dropped.** It gains
  `check (currency = 'NGN')`.
- Every NGN wallet RPC asserts the row it acts on is NGN before moving anything:
  `post_withdrawal_settlement` and `release_withdrawal` read `currency` from the request row and
  raise otherwise; the hold and release branches of `initiate_payment_refund` and
  `fail_payment_refund` read the refund row's currency and raise unless NGN; `credit_wallet_topup`
  reads the funding request's currency instead of trusting `p_currency`. All five raise when
  `post_ledger_entry` returns `posted = false` (the `reserve_withdrawal` pattern,
  `20260706130000:86-89`), so a consumed key can never move a balance without its entry.
- The transfer webhook and `fail_payment_refund` **dispatch on the row's currency** to the matching
  family; nothing is called by name alone.
- A non-NGN intent can never credit the NGN wallet: the birth-guard clause for wallet-funding intents
  (§5.4) makes a funding request and its intent agree on currency and amount at insert time, proven
  in MC-CI-07 with USD enabled; `credit_wallet_topup` rejects non-NGN (built); the reconciler flags
  `currency_mismatch` (built).

### 7.2 Per-currency wallets as separate balance tables (M7)
```
public.customer_currency_wallets (
  id uuid pk, user_id uuid not null references auth.users(id),
  currency text not null check (currency ~ '^[A-Z]{3}$' and currency <> 'NGN'),
  balance_minor bigint not null default 0 check (balance_minor >= 0),
  is_active boolean not null default true, frozen_at timestamptz, frozen_reason text,
  created_at, updated_at, unique (user_id, currency)
)
public.customer_currency_wallet_transactions (
  id uuid pk, wallet_id uuid not null references customer_currency_wallets(id),
  user_id uuid not null, currency text not null,
  type text not null, amount_minor bigint not null, balance_after_minor bigint not null,
  description text not null, status text not null default 'completed',
  reference_type text, reference_id text, metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
)
```
- Balances and transaction logs are separate tables so every NGN reader stays untouched and the
  kobo-named columns keep meaning kobo. The **request tables are shared**: `customer_wallet_funding_requests`
  and `customer_wallet_withdrawal_requests` already carry `currency`; their CHECK (`= 'NGN'`, M1) is
  widened to ISO-4217 in M7, and every reader is currency-scoped from M1 (N24, N5a).
- Grants follow the **ledger pattern**, not `sec_harden_08`: INSERT/UPDATE/DELETE/TRUNCATE revoked
  from `anon`, `authenticated` **and** `service_role`; writes only through SECURITY DEFINER RPCs
  (MC-CI-11 asserts it). RLS owner-read.
- Writers (`payments_private`, mirrors of the NGN ones with a `(user_id, currency)` wallet lookup and
  the currency derived from the request/refund row): `credit_currency_wallet_topup`,
  `hold_currency_wallet_refund`, `release_currency_wallet_refund`, `reserve_currency_withdrawal`,
  `post_currency_withdrawal_settlement`, `release_currency_withdrawal`. They post under **distinct
  source names** (`currency_wallet_topup`, `currency_wallet_refund_hold/release`,
  `currency_withdrawal_reserve/settle/release`) so a mis-routed call can never consume the other
  family's idempotency key, and each raises on `posted = false`. Partial unique indexes on
  `(reference_type, reference_id)` mirror the NGN table.
- Readers: a per-currency wallet section (balance, statement) in `apps/account`; the home widget
  shows the NGN balance plus one line per currency wallet through `convertWalletDisplay` with the
  wallet's own currency as the source. Withdrawals from a currency wallet are in that currency only.

### 7.3 Withdrawal limits and payouts per currency
- `DEFAULT_WITHDRAWAL_LIMITS` gains a row per enabled currency in that currency's minor units (owner
  sets the figures, D-MC-07). A unit test asserts each row's `minMinor >= floor_minor` for the
  currency and that `maxSingleMinor` / `dailyCapMinor` at the reporting rate fall within a bounded
  ratio of the NGN row, so a row copied in the wrong exponent fails. The daily cap and one-at-a-time
  are per currency.
- Transfer fees: the adapter surfaces `feeCurrency`; the settle RPCs require it to equal the wallet
  currency, else they post the settlement with fee 0 and a `fee_unreconciled` marker (never a raise
  loop that leaves the hold live and the user blocked). MC-CI-10 includes the XOF settle fixture.
- The payout rail's non-NGN branch (`wallet-payout.ts:145`) is widened only for currencies the
  transfer provider supports with in-currency balances; account resolution and name match stay
  mandatory. International bank details belong to V3-69; v1 non-NGN payouts are limited to
  destinations the current `account_number + bank_code` shape can address.

### 7.4 What is explicitly not built
No in-app conversion between a user's wallets, no "hold USD, withdraw NGN", no netting of a USD
refund against an NGN wallet. Each is a conversion event with a spread and a treasury position; they
are a separate design on `fx_conversion_clearing` (§4.2) gated on D-MC-07.

---

## 8. Refund and credit-note design

### 8.1 Always the charge currency, never re-converted (M4)
- `payment_refunds.currency` CHECK widens to ISO-4217; a BEFORE INSERT/UPDATE trigger asserts
  `currency = (select currency from payment_intents where id = intent_id)`.
- `initiate_payment_refund` gains `p_currency` and raises unless it equals the intent currency; the
  route requires `{amountMinor, currency}` together and documents them as intent-currency minor
  units. A partial refund of an NGN-denominated claim (care damage claims, logistics claims carry
  `requested_amount_minor` in kobo) converts at the intent's frozen `rate_e8` + `spread_bps`
  (floor), never a live rate, and never exceeds the proportional share — one helper, one fixture.
  The `non_base_currency` branch is dropped; `v_intent.currency` is written into the row (`:341`).
- The wallet-hold branch dispatches on currency: NGN → the existing hold (asserting NGN);
  otherwise → `hold_currency_wallet_refund` (§7.2); before M7 a non-NGN rail top-up cannot exist
  (§5.4 birth guard).
- `apply_refund_webhook` gains `p_currency`: when the payload carries one it must equal the row's;
  for a non-NGN row a `processed` outcome with a null amount is refused until the adapter re-verifies
  the refund (`GET /refund/:id` on Paystack; verify on Flutterwave) — NGN behaviour is unchanged.
  Every `post_ledger_entry` call uses `v_row.currency` (`:536`, `:606`); the proportional reversal
  math is unchanged. The RPC returns `amount_minor` and `currency`, and the refund email is built
  only from that result through `formatMoney` (LF-4).
- `fail_payment_refund` selects `currency` and dispatches the release by family (§7.1); the release
  posting uses the row's currency (`:416`).
- The adopt-don't-redrive match drops the `amountMinor === null` wildcard (`refund/route.ts:159`).
- The adapters already carry the exponent on refund (Flutterwave `:449-452`; Paystack minor
  verbatim); Flutterwave `refund()` additionally receives the intent currency (§6.3).

### 8.2 Refund-time balance, treasury and chargebacks
Providers refund the charged amount in the charge currency from the in-currency balance; the absorbed
processor fee is not returned (built assumption). That balance must still exist: the refund route
reads `getBalance({currency})` first and returns `insufficient_provider_balance` instead of creating
a provider refund the balance cannot fund, and the treasury rule (D-MC-11) keeps each currency's
balance at or above its refundable exposure (Σ captured − Σ refunded, trailing 180 days) before any
conversion. Chargebacks: §6.7 (alarm-only in v1).

### 8.3 Credit notes
`customer_credit_notes.currency` CHECK widens to ISO-4217; `record_customer_credit_note` asserts
`p_currency = (select currency from journal_entries where id = p_posting_id)`, that this equals the
refund row's currency, and inserts that value (replacing the literal at `:787`). Minting is **wired**
at the site where `apply_refund_webhook` applies a `processed` outcome
(`webhooks/[provider]/route.ts:128-179`, beside the refund email), best-effort and idempotent, with
`generateCreditNotePdf`; a failure emits `henry.document.generated outcome=failed`, never a silent
catch. Numbering stays one `HO-CRN-YYYY-NNNNNN` sequence.

### 8.4 Sequencing
A currency's `enabled` flag can only be set by `set_charge_currency_enabled` with a reference that
proves a full charge → refund → credit note → receipt cycle in that currency (§5.4), and only after
MC-CI-05/06 are green. Disabling cancels that currency's `pending` intents in the same transaction
(§5.4); `processing` intents complete under provider truth and are reported. The orphan alarm for a
provider-dashboard refund with no in-flight row (`:181-193`) stays and gains the intent currency.

---

## 9. Receipt design

### 9.1 A real issuance path, in-currency (M5)
- `customer_receipts.currency` CHECK widens to ISO-4217; `record_customer_receipt` asserts
  `p_currency = (select currency from journal_entries where id = p_posting_id)` and inserts that
  value (replacing the literal at `:193`); it also asserts `Σ line_items.amountMinor = total_minor`.
- **Issuance:** a `customer_receipts`-backed `receipt` document route (by id or `receipt_no`, RLS-owned)
  replaces the legacy-invoice render for receipts, and a `credit-note` type is added to
  `documents/[type]/[id]`. The marketplace port's silent `catch {}` (`sale-reconcile-port.ts:225-227`)
  becomes `henry.document.generated outcome=failed`. Studio and care mint their receipt at the
  reconcile seam the same way. `prove-receipts.mts` gains USD and XOF fixtures.
- **Charge-currency breakdown:** at charge start the rail stores, next to `charged_currency` /
  `charged_amount_minor`, a breakdown in the charge currency: each line = floor(line × effective
  rate × 10^Δexp), the residual (`payerAmountMinor − Σ lines`) allocated by largest remainder, and
  the output VAT re-carved from the payer gross. The receipt prints that breakdown; the NGN order
  record keeps its NGN pricing. A fixture with 3 × ₦1,001 at `rate_e8 = 65000` (lines 65, 65, 66 →
  total 196) is in MC-CI-06.
- `buildReceiptProps` / `buildCreditNoteProps` accept any supported currency; `currency_not_base`
  is retired; `splitDocumentMoney` gains a currency label only.
- The document prints every amount in the charge currency with the correct exponent. An
  informational NGN-equivalent line (rate, source, `rate_as_of`, from the charge snapshot) is printed
  only if the accountant requires it for NRS e-invoicing (D-MC-08); it never changes a total.
- VAT line: "VAT (7.5%)" in the charge currency for a standard supply, classification note
  otherwise. Numbering stays one `HO-RCT-YYYY-NNNNNN` sequence.

### 9.2 Exponent-correct rendering everywhere (M1 for formatters, M5 for documents)
- `formatMoney(amountMinor, currency)` from `@henryco/i18n` becomes the only money formatter:
  `packages/branded-documents/src/format.ts` `formatKobo` → `formatMinor(amountMinor, currency)`
  delegating to it; `PaymentCallbackClient.tsx`, the admin refund surfaces, `DealsRail`, learn
  payouts, logistics claims, `IntelligenceExtras`, `interactions/pricing`, marketplace saved, and
  `formatRegionalMoney` (retired or made to convert) all route through it. The MC-CI-04 guard flags any
  `Intl.NumberFormat(..., { style: "currency" })` outside `@henryco/i18n`.
- Money emails: subject and body helpers take `(amountMinor, currency)`; the `NGN ` literal leaves
  every locale string (12 locales per the i18n rule); the refund email uses the RPC result (§8.1).
  The money-email matrix gains a row per new transition.
- Wallet statements and transaction-history PDFs read NGN tables only until a per-currency statement
  exists; they never union the two wallet families (asserted by the MC-CI-01 select rule).

---

## 10. Invariants as CI rules

All SQL proofs run in the existing `Payments money-RPC grant invariant` job
(`.github/workflows/ci.yml:123-249`), appended after the current last ledger proof step
(`payout_ledger_invariants.sql`, `:249`; the job continues with the SEC-HARDEN-04B studio and care
money-surface steps at `:331-359`), so they see the full money chain on the same fresh PG 17. Static
guards run in `Lint, typecheck, test, build` next to `care-money:check`. Each rule states its red
condition. "Day-one green" was checked against `main` for every static guard.

| Rule | Mechanism | Red when |
|---|---|---|
| MC-CI-01 **no cross-currency sum** | (a) `multicurrency_readers_invariants.sql`: seed NGN + USD + XOF entries, wallets and requests; assert `ledger_reconciliation().currencies[]`, `wallet_ledger_reconciliation().wallets[]`, `vat_reconciliation()` rows per currency with the exact seeded figures; assert no scalar equals the mixed sum; assert the per-(account, currency) expectations and the tag-consistency proof (§4.5). (b) `scripts/ci/currency-sum-guard.mjs`, a **mechanical** rule over `apps/**/{app,components,lib}/**/*.{ts,tsx}` and `packages/{payment-router,pricing,dashboard-modules-*,branded-documents}/src/**`: any `.select("…")` naming `amount_minor|debit_minor|credit_minor|balance_minor|balance_kobo|amount_kobo` must also name `currency` (or join `journal_entries(currency)`), and any `sum(`, `.reduce(`, `+=` or `-=` on a `/minor|kobo/i` identifier within 12 lines of such a select counts as an aggregate needing a currency predicate. SQL half: `pg_get_functiondef` of the reader functions on the fresh DB (not the immutable migration files) must group by or filter on currency; sums scoped by `entry_id`, `intent_id` or `posting_id` are exempt by construction. Baseline per site (`file::normalized line`, the `schema-drift-check.mjs:352-365` pattern), shrink-only, **excluding** the N24 request readers. | any per-currency row missing or mixed scalar; any new unqualified select/fold; any baseline growth |
| MC-CI-02 **posting currency = event currency** | `multicurrency_posting_invariants.sql`: USD intent → settlement entry USD; `post_sale_revenue(intent_id, vat)` derives USD and raises for a non-captured or unknown intent; `initiate` + `apply_refund_webhook` on a USD intent post USD; currency-wallet RPCs post USD; the tag-consistency proof (§4.5). Secondary, literal scan of `payments_private` bodies for `'NGN'` with an explicit (function, expected count) allowlist — `post_charge_settlement` (statutory branch), `post_ai_usage_charge`, `wallet_ledger_reconciliation`, the dedicated NGN wallet hold/release functions (moved out of the generic refund functions so those carry no literal), and `record_customer_receipt` until M5 — and a scan that no v1 body references `fx_conversion_clearing` / `fx_gain_loss`; `ledger_consolidated` must be `STABLE`. The behavioural proofs are primary; the literal scan cannot be relied on against `'NG'||'N'`. | any wrong tag; any raise missing; any non-allowlisted literal or FX-account reference |
| MC-CI-03 **charge needs a fresh, real rate** | `payer-charge.test.ts`: `resolvePayerCharge` returns `blocked` for fallback, `rate_as_of` older than 30 min, missing rate, missing policy set, unknown exponent, below floor; returns the exact `BigInt` figure for a fixture table (NGN→USD, NGN→XOF, NGN→GHS, spread 0/150 bps, the rate rounded up at fetch); the snapshot reproduces the figure; `fetchChargeRates` uses `cache: "no-store"` (asserted on the fetch init). | any blocked case passes; any fixture figure differs by one minor unit |
| MC-CI-04 **exponent-correct, no blanket ×100** | (a) unit tests: `formatMinor`/`formatMoney`/callback/email formatting for USD and XOF; `buildCurrencySnapshot` (fallback → null) and `convertMinorUnits` NGN→XOF; `convertWalletDisplay` with a USD source. (b) `scripts/ci/exponent-guard.mjs` over the MC-CI-01 scope **plus** `packages/{ui,interactions,i18n,email}/src/**`: any `/ 100`, `* 100`, `/100`, `*100` on an identifier matching `minor|kobo|cents|amount` must sit in a function whose currency is statically `"NGN"` (named `*Naira*`/`*Kobo*` or guarded by `=== "NGN"` within 6 lines); any `Intl.NumberFormat(…, { style: "currency" })` outside `packages/i18n` is flagged; per-site shrink-only baseline seeded with the §1.3 list. | any new unguarded scale or formatter; any XOF fixture off by 100× |
| MC-CI-05 **refund in charge currency, ≤ captured** | extends `refunds_invariants.sql` with a USD cycle: full refund, two partials with proportional VAT reversal, over-refund rejected, `refund.failed` revert on a USD **rail top-up** releasing the USD wallet (both `wallet_ledger_reconciliation` rows at delta 0), replay dedup, `p_currency` mismatch raises, null-amount `processed` refused for USD, the NGN-claim conversion fixture (floor at the frozen rate). | any step posts NGN; any cap breach; any replay double-posts; any mis-routed wallet |
| MC-CI-06 **document currency = posting currency** | extends `payment_documents_invariants.sql` and the credit-note proofs: a USD posting records a USD receipt; `p_currency` ≠ posting raises; Σ lines ≠ total raises; the 3 × ₦1,001 breakdown fixture; a credit note likewise; `prove:receipts` renders USD and XOF with the right decimals and the issuer triad; a route test fetches `receipt` and `credit-note` PDFs from `customer_receipts` / `customer_credit_notes`. | any mismatch accepted; any `/100` artefact |
| MC-CI-07 **birth guard + one allowlist, enforced by the DB** | `charge_currency_policy_invariants.sql`: an `authenticated`-role insert raises; a `service_role` insert with `status <> 'pending'` or a `provider_reference` raises; a disabled-currency insert raises except for `settle_test_user_id`; a non-NGN insert without a consistent `fx_charge_snapshot` raises; a wallet-funding intent whose currency or amount differs from its funding request raises (with USD enabled); `set_charge_currency_enabled` rejects an invalid or foreign reference and cancels `pending` intents on disable; `anon`/`authenticated` cannot execute the RPC or read the table; the app loader test asserts `resolvePayerCurrency` receives the table's set and blocks on none. Grep guard scoped to `process.env.CHARGE_CURRENCIES` / `env.CHARGE_CURRENCIES` in `.ts` outside tests (comment-stripped). | any insert that should raise succeeds; any grant leak; any env read |
| MC-CI-08 **provider-confirmed figure = frozen figure** | SQL proof: `apply_payment_webhook` with a confirmed amount or currency ≠ intent raises and posts nothing; a capture for a `cancelled` intent returns `late_capture`; `freeze_intent_money_columns` rejects a snapshot rewrite or removal. Route tests: the replay-with-different-amount case routes with the stored figure and 409s on a body mismatch; the seam asserts `snapshot.payerAmountMinor` equals the routed amount; each rail settles only when `intent.amount_minor === record.charged_amount_minor && intent.currency === record.charged_currency` and only when a `('payment_intent', intent)` entry exists. | any settle on a mismatch or without an entry; any snapshot rewrite accepted |
| MC-CI-09 **provider currency capability + fees** | `select-provider.test.ts`: a currency outside the adapter's set makes it ineligible; `route` returns `no_suitable_provider` when none supports it; the mock keeps every currency; non-NGN `bank_transfer`/`ussd` ineligible. Adapter fixtures per enabled currency (initiate/verify/refund/transfer; XOF canary; Paystack normalisation); fee-currency mismatch and fee ≥ gross → `feeStatus: inconsistent` / `fee_dropped`; the chargeback event parses. | any route to an unsupported provider; any fee posted in the wrong currency |
| MC-CI-10 **wallet currency isolation** | `currency_wallet_invariants.sql`: every NGN RPC raises on a non-NGN request or refund row; a currency release after an attempted mis-route still restores the currency wallet (distinct source names); every wallet writer raises on `posted = false`; `wallet_ledger_reconciliation().wallets[]` reconciles per currency after top-up, hold, release, reserve, settle (incl. the XOF settle fixture); the fee-currency mismatch posts fee 0 with `fee_unreconciled`. | any cross-currency wallet move; any per-currency delta ≠ 0; any raise loop |
| MC-CI-11 **grants and CI shape** | New `payments_private` functions in the grant-invariant lists (anon/authenticated EXECUTE false, service_role true); both new tables revoke DML from `service_role` too; `_bootstrap_supabase_env.sql` carries prod's `customer_wallets` shape (`currency`, `is_active`, `frozen_at`). | any leak; any missing column |
| MC-CI-12 **nothing regressed** | All existing suites green at their positions; `payout_ledger_invariants.sql` p7 amended to iterate `currencies[]` (unchanged in meaning); `multicurrency_ledger_invariants.sql` mc1–mc6 green (its direct USD inserts stay `pending` and run before the M1 migration in the chain); `@henryco/payment-router`, `@henryco/pricing`, `@henryco/account` tests green. | any red |

Not a CI rule, by design: the live settle test (§6.4).

---

## 11. Build plan — ordered by money risk

Order principle: every step that can only **lose** money if skipped comes before any step that lets
money move in a new currency. Each step is additive and independently shippable; each ends with a
gate.

| Step | Scope | Risk class prevented | Gate |
|---|---|---|---|
| **M-NOW — hardening on `main` (before anything else; separate PR)** | (1) The birth guard: drop `payment_intents_insert_own`, revoke INSERT from `authenticated`, BEFORE INSERT trigger (§5.4) — proposed held migration `docs/v3/security/v3-mc-design-01-proposed-migrations/01_payment_intents_birth_guard.sql` + its proof; (2) `apply_payment_webhook(p_confirmed_amount_minor, p_confirmed_currency)` + both routes passing the verify figures + the replay branch routing with the stored figure (§6.3); (3) the reconcilers (wallet, studio, care, marketplace) require a `('payment_intent', intent)` settlement entry before crediting or flipping; (4) NGN wallet RPC currency assertions and `posted` checks (§7.1). Owner applies dry-run-first. | LF-1 self-credit; LF-2 under-payment credit; mis-routed wallet families | MC-CI-07 (birth clauses), MC-CI-08 (confirmed figure), MC-CI-10 (assertions) green; prod apply recorded |
| **M0 + M1 — one prod apply: lock first, readers, then the July migrations** | Verify prod state by introspection (SCHEMA-TRUTH-01 method). In **one** owner apply, ordered: the policy table + currency/birth-guard clauses + `payment_intents` ISO CHECK (§5.4) → `20260706120000` → `20260706130000` → the readers: `wallet_ledger_reconciliation` / `vat_reconciliation` per currency, `accounts` dropped + p7 amended, chart gains the two FX accounts (no writers), `customer_wallets` + request-table CHECKs, CI bootstrap wallet shape, hub finance + owner-command + staff + request readers currency-scoped, formatters routed through `formatMoney`, both static guards with per-site baselines. Record in `fl2-apply-manifest.md`. | Mixed-currency figures; an unplanned non-NGN intent; books silent or contaminated between applies | MC-CI-01, 04, 07, 11, 12 green; FL2 soak check reads `currencies[]` and the per-(account, currency) expectations |
| **M2 — FX seam** | `resolvePayerCharge`, integer rounding with the rate rounded up, `rate_as_of` freshness, `fetchChargeRates` no-store, spread, floor; `fx_rate_snapshots` + `record_fx_rate_snapshot`; `fx_charge_snapshot` freeze incl. removal; the pending-intent sweeper + `late_capture`; `buildCurrencySnapshot` / `convertMinorUnits` / `convertWalletDisplay` fixes. No caller wired. | Stale/fallback-rate charges; float drift; free option on old quotes; 100× display mis-scale | MC-CI-03, 04, 08 (SQL half) green |
| **M3 — Provider capability** | `PROVIDER_CURRENCIES` + adapter-declared sets in routing; non-NGN card-only; Paystack normalisation; adapter `amountMinor`/`currency` on charge events; `feeStatus` + fee-currency rule + `fee_dropped`; chargeback alarm event; settle-test runbook (`scripts/money/live-settle-test.mjs`: settlement-record oracle, fee-line assertion, receipt + credit-note download). | Routing a currency to a provider that converts or rejects; raise loops on fees; phantom cash | MC-CI-09 green; runbook dry-runs against the mock |
| **M4 — Refund + credit-note legs widened** | N6, N7, N8, N28: `post_sale_revenue(intent_id, vat)`; refund row currency trigger; `initiate`/`apply` currency params; dispatch by family; partial-claim conversion helper; RPC returns amount + currency; email from the RPC result; adopt wildcard dropped; credit-note minting wired at the apply site; USD proof cycle. | Unrefundable foreign charges; orphaned provider refunds; wrong-currency reversals; wrong email amounts | MC-CI-02, 05 green |
| **M5 — Receipt leg + issuance** | N9, N10, N25: receipt currency tie + Σ lines; `customer_receipts`-backed `receipt` route + `credit-note` type; port catch → event; studio/care receipt minting; renderers and `prove:receipts` USD/XOF; email copy modules across locales; money-email matrix rows; guard scope widened. | A receipt that cannot be issued or prints wrong decimals | MC-CI-06 green; `i18n:check:strict`, `tone:check` green |
| **M6 — Rail wiring, dark** | Studio first, then care, marketplace: each rail calls `resolvePayerCharge`, writes `charged_currency` + `charged_amount_minor` + the charge-currency breakdown on its record (set once, CAS), creates the intent with the snapshot, routes with the currency, reconciles on the frozen figure and the settlement entry. Wallet-funding intents stay NGN by the birth guard. Nothing enabled. | Double conversion at reconcile; rate-move stranding | MC-CI-08 green; NGN path byte-identical (existing rail tests) |
| **G3 — Owner gate: first currency** | §6.4 on studio as `settle_test_user_id` with the first currency (D-MC-01); `set_charge_currency_enabled` validates the cycle and adds the provider row. | — | settle test passed incl. refund, receipt, credit note, settlement record |
| **M7 — Per-currency wallets + payouts** | §7.2 tables + writers with distinct source names; request-table CHECK widened; wallet surfaces; limits rows + exponent test; payout branch; fee-currency rule; refund holds for currency top-ups. Behind `wallet_enabled` per currency. | Cross-currency wallet moves; overdraw in a second currency; raise loops | MC-CI-10 green; owner payout test in that currency |
| **M8 — Reporting** | `currency_exponents` + parity test; `ledger_consolidated` as-of by snapshot ids; reporting-rate entry UI; hub consolidated tab; per-currency VAT block with the composed FIRS figure and the `in_return` line. | Posted FX; mis-stated VAT return; wrong-direction or wrong-exponent consolidation | MC-CI-01, 02 green (derived figures labelled; no writes) |
| **Later, separate designs** | LF-3 studio wallet checkout through a guarded RPC; charge-then-convert for auto-converting providers; chargeback posting; period-end revaluation; in-app wallet FX; payer-country routing with Stripe (V3-14); international payout details (V3-69); AI metering currency (program spec M4). | — | each needs its own owner decision |

Rollout per currency after M6: `NGN` (live) → first currency (D-MC-01) → next, one at a time, each
through G3. Studio first, then marketplace, care, learn.

---

## 12. Owner decisions (surfaced; each blocks the gate named)

| Id | Decision | Recommendation | Blocks |
|---|---|---|---|
| D-MC-00 | Apply the M-NOW hardening (birth guard, confirmed-amount check) to prod now, ahead of the multi-currency work | Yes, dry-run-first; LF-1 is a live self-credit path | M-NOW |
| D-MC-01 | First non-NGN currency | USD | G3 |
| D-MC-02 | Per (provider, currency): confirm on the live account that the provider holds a balance in that currency and settles in-currency, using the settlement record (§6.4 step 5) | A provider that converts is excluded from that currency in v1 | M3 table rows, G3 |
| D-MC-03 | Spread (`spread_bps`) per currency and the per-currency charge floor, sized to the capture window plus the treasury conversion lag | 150 bps for card with a 60-minute capture window; floors USD 100, GBP 100, EUR 100, GHS 500, KES 10000, XOF 500 (minor units) — confirm with the accountant; NGN fixed at 0 | M2 config, G3 |
| D-MC-04 | Charge-quote rate source: OER (current) vs the acquiring provider's published rate | Keep OER for the quote; verify plan terms for commercial use at hourly freshness; revisit if the provider's rate diverges beyond the spread | M2 |
| D-MC-05 | VAT treatment of foreign-currency supplies (resident vs non-resident buyer; export zero-rating) and whether foreign-currency processor-fee VAT is reclaimable | Accountant answer; default until then: division treatment applies regardless of currency; foreign fee VAT recorded in-currency and kept **out** of the return | M4 (posting rule), M8 |
| D-MC-06 | Reporting rate source and convention for the VAT return and consolidated figures (CBN reference at transaction date vs period average) | CBN reference rate at month end for consolidation; transaction-date rate for the VAT return if the accountant requires it; both as `kind='reporting'` snapshots | M8 |
| D-MC-07 | Scope of per-currency wallets: which currencies; withdrawal limits per currency; whether a currency wallet can be withdrawn to a bank | Enabled charge currencies only, same-currency withdrawal only, limits mirrored from NGN at the reporting rate and rounded to clean figures | M7 |
| D-MC-08 | Whether receipts for foreign-currency supplies must print the NGN equivalent and rate for NRS e-invoicing | Accountant answer; the design supports an informational line either way | M5 |
| D-MC-09 | Confirm the M0 + M1 single prod apply (lock first, July migrations second, readers last) is the owner's own apply, dry-run-first, like FL2 | Yes | M0/M1 |
| D-MC-10 | Confirm provider auto-conversion (charge USD, settle NGN) and chargeback posting stay out of scope for v1 and get their own passes | Yes | §6.3, §6.7 |
| D-MC-11 | Treasury conversion policy: who converts foreign balances to NGN, when, and the rule that each currency balance stays at or above its refundable exposure before conversion; acceptance of the economic FX exposure on NGN-denominated obligations during the capture window | Finance converts monthly above the exposure floor; exposure accepted for card-only non-NGN with a 60-minute capture window | M2 (spread), G3 |
| D-MC-12 | Non-NGN charges card-only in v1 (no bank transfer or USSD in a foreign currency) | Yes | M3 |

---

## 13. Hazard register — the paths this design closes

| Hazard | Where it would bite | Closed by |
|---|---|---|
| Forged intent birth: a signed-in user inserts a `succeeded` intent and a reconciler trusts it (LF-1) | `20260529120000:235-237`; the reconcilers | §5.4 birth guard; settlement-entry requirement in reconcilers; MC-CI-07/08 |
| Under-payment credit: replay re-route with a smaller amount, no confirmed-amount check (LF-2) | `intents/route.ts:69-114`; `apply_payment_webhook` | §6.3 confirmed-amount check; stored-figure replay; MC-CI-08 |
| Free option on an old quote; late capture after a disable or after the window | pending intents live forever | §5.2 sweeper + `late_capture`; one open intent per record; card-only; disable cancels pending |
| Rounding leakage at the charge quote (float `Math.round`; rate rounded down) | `currency-model.ts:436-438` | §5.3 integer ceiling with the rate rounded up; MC-CI-03 fixtures |
| Rounding leakage in partial refunds | currency-neutral clamp math (`20260611130000:581-590`) | unchanged; MC-CI-05 USD cycle |
| Freshness measured on the fetch clock, not the rate's | `exchange-rate.ts:46, 57-63` | §5.2 `rate_as_of`; no-store charge fetch; MC-CI-03 |
| Rate-move arbitrage via refunds | refund at today's rate in another currency | §8.1 (charge currency, charged figure) |
| Rate-move arbitrage via wallets (top up USD, withdraw NGN) | no cross-currency wallet moves | §7.4; MC-CI-10 |
| Mis-routed wallet family: NGN RPC acting on a USD row, consumed key, unbacked credit | `20260706130000:118-119, 199-202`; `20260611130000:399-421`; `20260607120000:413-419` | §7.1 assertions + `posted` checks + dispatch by currency; distinct source names; MC-CI-10 |
| Double conversion at reconcile | re-deriving the expected amount from the NGN record | §5.1 frozen figure + settlement entry; MC-CI-08 |
| Double conversion or identity conversion in display | `buildCurrencySnapshot`; `convertWalletDisplay` NGN source | §5.3 fixes; MC-CI-04 |
| Unit mix-up: 0-decimal currency through `/100` on documents, callback, emails, admin refund surface | §1.3 "Other `/ 100`" row | §9.2 single formatter; MC-CI-04 widened scope |
| Unit mix-up: wallet limits or request reads in the wrong exponent | `withdrawal-limits.ts:31-37`; N24 readers | §7.3 exponent test; §4.5 currency-scoped reads |
| Document line items in kobo on a foreign-currency receipt | `sale-reconcile-port.ts:53-70`; `payment-documents.ts:209-217` | §9.1 charge-currency breakdown with largest-remainder residual; MC-CI-06 |
| Mixed-currency books: readers summing across currencies | §1.2/§1.3 rows marked "no currency predicate", incl. the owner-command tiles | §4.5; MC-CI-01 mechanical rule |
| Per-currency "balanced" mistaken for correctness | each entry balances by trigger | §4.5 per-(account, currency) expectations + tag-consistency proof |
| Phantom cash: provider converts, fee identity inconsistent and dropped | `flutterwave-provider.ts:236-260` | §6.5 `feeStatus` fatal on verify; §6.4 settlement-record oracle; D-MC-02 |
| Raise loop on a fee: webhook 500s forever, charge stranded | `20260706120000:174-185`; payout settle `:133-136` | §6.5 `fee_dropped`; §7.3 `fee_unreconciled` |
| Unrefundable foreign charge; provider-dashboard refund orphaned; refund after a treasury sweep; chargeback in another currency | `initiate_payment_refund:258-259`; orphan path; §8.2 | §8, §8.2 balance check + D-MC-11; §6.7 alarm; MC-CI-05 |
| Unplanned non-NGN intent today | `intents/route.ts:42` | §5.4 DB policy + birth guard; MC-CI-07 |
| Foreign fee VAT netted into the FIRS return by default | `vat_reconciliation` global sum | §4.4 `in_return`; separate line; D-MC-05 |
| Wrong-direction or wrong-exponent consolidation acted on | caller-supplied rates; no exponent in SQL | §4.6 snapshot ids, pinned direction, `currency_exponents`, as-of balances |
| Posting FX | a conversion inside a posting or a consolidated figure written back | §4.6 `STABLE` function; MC-CI-02 (no v1 writer touches the FX accounts) |

---

## 14. Test and rollout summary

- CI: the rules in §10, appended to the existing money job, with the existing proofs unchanged in
  meaning.
- Local: `pnpm --filter @henryco/payment-router test`, `pnpm --filter @henryco/pricing test`,
  `pnpm --filter @henryco/account run prove:receipts`, the two static guards, `i18n:check:strict`,
  `tone:check`.
- Prod: the owner's "I prove, you settle" discipline — M-NOW first, then one M0 + M1 apply, every
  migration dry-run-first on the shadow, every currency through §6.4, NGN never at risk at any step.
