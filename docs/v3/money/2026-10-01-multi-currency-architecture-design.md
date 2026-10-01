# Multi-currency architecture — ledger, FX, provider, wallet, refund, receipt (V3-MC-DESIGN-01)

**Status:** DESIGN DRAFT for owner review, revision 4 (after adversarial rounds 1 to 3). Nothing in this
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

**Live findings on `main` (§1.5).** Grounding this design, and the adversarial rounds against it,
found money holes that exist today, outside the multi-currency scope: LF-1 (self-credit), LF-2 (no
confirmed-amount check), LF-5 (a webhook that arrives before the buyer returns cannot apply), LF-6
(a refund before the sale allocation leaves the full sale on the books), LF-7 (one settlement
allocated twice), LF-8 (a partial refund before the top-up credit yields the full credit plus the
refund) and LF-9 (an attempt-level failure consumes the success dedup key). They are listed first
in the build plan (M-NOW, §11) and in the report, and a held hardening migration for the first is
proposed at
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
| `public.payment_intents` (`amount_minor bigint`, `currency text`) | `20260529120000:43-58` | `currency` has **no CHECK**; `status` CHECK admits every status at insert (`:63-66`, `payment_intents_status_valid`; the column default `'pending'` is `:50`); **no BEFORE INSERT trigger** exists in any migration; the A2 transition trigger (live definition `20260605123000:28-43`, trigger `:52-54`; the public copy at `20260529120000:117-139` is dropped at `20260605123000:57`) and `freeze_intent_money_columns` (`20260611130000:174-182`) are BEFORE UPDATE only; RLS policy `payment_intents_insert_own` lets any `authenticated` user insert their own row (`:235-237`) and `sec_harden_08` keeps the `authenticated` INSERT grant (`20260627213858:30-32`) |
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
| Division card rails | `apps/studio/lib/studio/card-math.ts:14`, `apps/care/lib/payments/card-math.ts:10`, `apps/marketplace/lib/checkout/card-rail.ts:75` | Return `null` / reject for any non-NGN amount; every rail writes `currency: "NGN"`, `country: "NG"`; marketplace mints a fresh `reference` per start (`:79`) |
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
| LF-1 **critical** | Any signed-in user can INSERT a `payment_intents` row with `status = 'succeeded'` through PostgREST: the insert policy checks only `user_id = auth.uid()`, the status CHECK admits every status, no BEFORE INSERT trigger exists, and `sec_harden_08` keeps the `authenticated` INSERT grant. The reconcilers then trust it: the wallet top-up reconciler credits the wallet for any `succeeded` intent whose `idempotency_key` equals the user's own funding-request reference (`wallet-topup-port.ts:80-93`, `wallet-topup.ts:116-125` → `credit_wallet_topup`, which checks no settlement entry); studio and care flip their record to paid on a `succeeded` intent found by `metadata` (`studio/card-rail.ts:166-180`, `care/card-rail.ts:174-182`); marketplace posts revenue (`division-sale.ts:82-88`). | `20260529120000:63-66`, `:117-139`, `:235-237`; `20260627213858:30-32`; no `before insert` on `payment_intents` in any migration | A user self-credits any wallet amount with no money moved (the live rail), withdrawable through finance review today and automatically once `WALLET_AUTO_PAYOUT` is on; studio/care/marketplace release goods for ₦0 where their card flag is on. `ledger_reconciliation` stays "balanced" (the top-up entry balances); only `payments_clearing` shows a debit balance | Birth guard: drop `payment_intents_insert_own`, revoke INSERT from `authenticated`, and a BEFORE INSERT trigger that raises for the request roles and forces `status = 'pending'` + `provider_reference is null` for `service_role` (proposed migration `01_payment_intents_birth_guard.sql`, held). The reconcilers additionally require a `('payment_intent', intent)` settlement entry before crediting or flipping (M-NOW item 3) |
| LF-2 **critical (provider-conditional)** | Nothing compares the provider-confirmed amount and currency to the intent, and the intents route re-routes a still-`pending` intent with the **new body amount** on an idempotency replay, overwriting `provider_reference`. If the provider accepts a re-initialisation of the same reference for a smaller amount (Flutterwave re-initialises an unpaid `tx_ref`; Paystack rejects a duplicate reference), the buyer pays the small amount, the webhook re-verifies payload against verify (never against the intent), `apply_payment_webhook` applies `succeeded`, `post_charge_settlement` posts the intent's **original** amount, and the reconciler credits it | `intents/route.ts:69-93, 110-114, 170-173`; `finalize/route.ts:52-59`; `webhooks/[provider]/route.ts:215-222`; `20260611130000:899-926`; `20260706120000:151` | Loss = frozen amount − paid amount, withdrawable | `apply_payment_webhook(..., p_confirmed_amount_minor, p_confirmed_currency)` refusing a mismatch or a missing figure with no status write, no posting, a durable `payment_exceptions` row and a 200 ack (§6.3); both adapters surface the confirmed figures and both routes pass them; the replay branch routes with the **stored** amount and currency (409 when the body differs) and never overwrites `provider_reference` |
| LF-3 medium | Two wallet checkouts debit `customer_wallets` with a raw update and no ledger post: studio (`studio/payments/[id]/wallet/route.ts:98-104`, which also debits `amount × 100` without checking the record's `currency`, `:27, :57`) and marketplace (`apps/marketplace/app/api/marketplace/route.ts:919-926`, a raw CAS update); manual withdrawals are marked `paid` by out-of-band SQL (no application writer) | files cited | NGN `wallet_ledger_reconciliation` diverges by every such checkout and every manual payout; the §4.5 expectations `customer_wallet_liability = wallet totals` and `withdrawals_payable = Σ processing` are red on prod before any currency is enabled | Route both debits through a guarded `payments_private` RPC that posts DR `customer_wallet_liability` / CR `payments_clearing` (or revenue) in the same txn, plus a manual-payout RPC — a separate hardening pass. In M-NOW the studio route asserts `currency === 'NGN'` before it computes kobo (ahead of M6, which lights studio first). Until that pass lands the §4.5 concrete expectations run against a **dated delta baseline** on prod, shrink-only |
| LF-7 **critical (latent; live the moment a division card flag is on)** | One card settlement allocated twice. A rail intent's `idempotency_key` is a `randomUUID()` the payer can read from their own row (`payment_intents_select_own`, `20260529120000:231-233`; `sec_harden_08` keeps `authenticated` SELECT). `POST /api/wallet/topup/init` accepts any UUID as `idempotencyKey` and inserts a `rail_topup: true` funding request with `payment_reference = key` without checking that an intent already carries it (`topup/init/route.ts:49-50, 68-79`); the reconciler joins `(user_id, idempotency_key = payment_reference)` with no division or marker check (`wallet-topup-port.ts:80-86`), sees `succeeded` + equal amount + NGN (`wallet-topup.ts:116-124`) and credits through `credit_wallet_topup`, which checks nothing about the intent (`20260607120000:363-422`). The division record is paid by the same intent | files cited | ₦X of goods plus ₦X of withdrawable balance for one ₦X charge; the ledger stays "balanced" (the top-up entry balances); the M-NOW settlement-entry requirement does not close it (the division charge has one) and the §5.4 wallet-funding clause fires only at intent INSERT (here the request is created after the intent) | (i) the intents route marks a wallet-funding intent (`metadata.wallet_funding = true`; `division` stays `'account'`) only when a `rail_topup` funding request with that reference already exists for the user, and writes `payment_intent_id` on that request; `credit_wallet_topup` requires the marker and the identity binding (`request.payment_intent_id = intent.id`, matching users and amounts — §7.1), else raises `not_wallet_funding`; (ii) `/topup/init` refuses (409) an `idempotencyKey` that already exists in `payment_intents`; (iii) one allocation per intent by construction: `payments_private.intent_allocations(intent_id pk, kind, ref)` written by `credit_wallet_topup`, `post_sale_revenue` and a new `claim_intent_allocation(intent_id, kind, record)` the studio and care flips call first; (iv) MC-CI-10 cycle: rail charge → late funding request with the same key → reconciler flags, never credits |
| LF-8 **high (live NGN rail; owner-action-conditional)** | A partial refund before the top-up credit yields the full credit plus the refund. `initiate_payment_refund` takes a wallet hold only for a funding request in `verified` (`20260611130000:290-294`); while the request is still `pending_verification` (the reconciler has not run) a partial refund posts DR clearing / CR cash and returns the intent to `succeeded` (`:620`); the user's next wallet load runs the reconciler, which needs only `succeeded` + an equal amount (`wallet-topup.ts:119-124`) and credits the **full** amount through `credit_wallet_topup`, which never reads `payment_refunds`. Studio and care flip a record to paid in full after a partial refund the same way. Reproduced by execution against the real bodies | files cited | Cash in ₦3,000, obligations ₦5,000 on a ₦5,000 top-up with a ₦2,000 refund; the refunded amount is withdrawable; `wallet_ledger_reconciliation().reconciled` and `ledger_reconciliation().balanced` both stay true; only `payments_clearing` shows the debit. A full refund first is safe (`refunded`, the reconciler skips) | `credit_wallet_topup` and `claim_intent_allocation` raise `refund_exists` when any `payment_refunds` row in `processing` / `succeeded` exists for the intent; `initiate_payment_refund` refuses `topup_not_credited` for a `rail_topup` request not yet credited (finance runs the sync first, then the refund takes the hold); MC-CI-10 fixtures (§7.1, M-NOW) |
| LF-9 **medium (provider-conditional)** | An attempt-level failure consumes the success dedup key. `apply_payment_webhook` inserts `(provider, reference)` first for every status (`20260611130000:914-921`); both adapters key charge events by the transaction reference (`paystack-provider.ts:192, 261`; `flutterwave-provider.ts:282, 361`); Paystack maps `abandoned` (the customer left the checkout; the session may still be completable) and Flutterwave maps a per-attempt `failed` / `cancelled` to terminal `failed` (`paystack-provider.ts:432-435`; `flutterwave-provider.ts:672-681`), and `failed` has no exit (`state-machine.ts:38`). A buyer who closes the checkout, lands on the callback page (finalize applies `failed`) and then completes the same reference produces a `charge.success` that returns `duplicate` | files cited | Captured money with the intent `failed`, no entry, no alarm — the LF-5 shape by another door; whether a given provider lets the same reference be completed after `abandoned` / a failed attempt is confirmed in the settle test (§6.4) | `failed` applies are keyed `<reference>:failed` and never consume the success key; `failed → succeeded` is a legal provider-confirmed edge (§5.2); MC-CI-08 "failed, then success on the same reference" fixture |
| LF-4 low | The refund email falls back to the full intent amount when the payload amount is null, and every locale subject hard-codes NGN | `webhooks/[provider]/route.ts:162-171`; `templates.ts` | Wrong amount in a customer email on a partial refund | Email only from the RPC result (§8.1) |
| LF-5 **high** | A provider webhook that arrives before the buyer returns cannot apply: `apply_payment_webhook` writes the terminal status directly (`20260611130000:921`), the A2 trigger admits only `pending → processing` and `processing → succeeded\|failed` (`20260605123000:34-35`), and only the finalize route advances `pending → processing` (`finalize/route.ts:35`), when the buyer lands on the callback page. Webhook-first on a `pending` intent therefore raises, the RPC rolls back (dedup row included), the route returns 500 and the provider redelivers until it gives up | `20260611130000:914-924`; `20260605123000:28-42`; `webhooks/[provider]/route.ts:215-225`; `finalize/route.ts:33-35` | A buyer who pays on the hosted page and never returns leaves captured money with no status, no settlement entry, no wallet credit and no receipt; nothing alarms (the 500 is a log line); the intent stays `pending` until someone calls finalize by hand | `apply_payment_webhook` advances `pending → processing` inside its own transaction before the terminal write (two legal A2 edges, same txn); MC-CI-08 proves webhook-first-then-finalize and finalize-first-then-webhook both apply exactly once |
| LF-6 **medium (books; over-remit; latent until the marketplace card flag is on)** | A refund confirmed before the sale is allocated reverses nothing ("No sale entry → nothing to reverse", `20260611130000:548-553`), the intent returns to `succeeded` (`:618-622`), and the marketplace reconciler, which runs on the buyer's next `/pay/[orderNo]` load, then posts the **full** sale (`decideSaleReconcile` needs only `succeeded` + the exact gross, `division-sale.ts:82-84`; `post_sale_revenue` has no status or refund check, `20260607140000:197-224`) | files cited | Revenue and output VAT overstated by the refunded share; VAT over-remitted; `payments_clearing` left in debit by the refund; a later full refund leaves part of the sale on the books for ever | `post_sale_revenue(intent_id, vat)` locks the intent and posts, in the same transaction, the proportional `sale_revenue_refund` catch-up for every refund already `succeeded` on the intent, sequentially and keyed by refund id (§4.3); MC-CI-02 "partial refund, then sale" fixtures. Reachable only with `MARKETPLACE_CARD_CHECKOUT=1` (dark, §1.4) and an owner **partial** refund between `succeeded` and the buyer's next `/pay/[orderNo]` load; a full refund first is harmless (`refunded`, the reconciler skips) |

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
| N5 | Hub finance reader re-derives without currency; the console consumes the global `accounts` list | `apps/hub/lib/finance-ledger.ts:244-290, 336-387`; `apps/hub/components/owner/finance/FinanceLedgerConsole.tsx:108-115, 242-243` | M1 | MC-CI-01 |
| N5a | Owner-command and staff money readers sum intents/requests across currencies | `division-revenue.ts:125-129, 169-187`; `since-last-looked.ts:42-57`; `owner-data.ts:457, 1034, 1291`; `OwnerMoneyStrip.tsx:37-38`; `apps/staff/lib/finance-data.ts:93-98` | M1 | MC-CI-01 |
| N6 | `post_sale_revenue` tags `'NGN'`, trusts the caller's gross and event id | `20260607140000:197-224` | M4 | MC-CI-02 |
| N7 | `payment_refunds_currency_base`; `initiate_payment_refund` non-NGN gate and `'NGN'` on the row; `'NGN'` on refund postings; `fail_payment_refund` re-credits the NGN wallet unconditionally | `20260611130000:90-91, 258-259, 321, 341, 399-421, 416, 536, 606` | M1 (currency assertion), M4 (widening) | MC-CI-02, MC-CI-05, MC-CI-10 |
| N8 | `customer_credit_notes_currency_base`; `record_customer_credit_note` NGN guard and literal | `20260611130000:674-675, 719-720, 787` | M4 | MC-CI-06 |
| N9 | `customer_receipts_currency_base`; `record_customer_receipt` NGN guard and literal | `20260607130000:90-91, 151-152, 193` | M5 | MC-CI-06 |
| N10 | `buildReceiptProps` / `buildCreditNoteProps` `currency_not_base`; kobo line items | `payment-documents.ts:245, 407, 209-217, 258-270` | M5 | MC-CI-06 (TS) |
| N11 | `/ 100` and NGN-kobo formatting behind non-NGN labels | `branded-documents/src/format.ts:7-13`; `PaymentCallbackClient.tsx:117-119`; `webhooks/[provider]/route.ts:171`; the "Other `/ 100`" row in §1.3 | M1 (formatters + guard), M5 (documents) | MC-CI-04 |
| N12 | Money-email `NGN` subjects/bodies; refund email full-amount fallback | `templates.ts`; `webhooks/[provider]/route.ts:162-171` | M5 | MC-CI-04 + email matrix row |
| N13 | Division rails: NGN-only math, `currency: "NGN"`, `country: "NG"`, fresh reference per start, NGN breakdown passed to receipts | `card-math.ts` ×2; marketplace `card-rail.ts:75, 79, 112-113`; `sale-reconcile-port.ts:53-70, 186-219` | M6 | MC-CI-08, MC-CI-06 |
| N14 | Provider selection ignores currency | `router.ts:88-92` | M3 | MC-CI-09 |
| N15 | `credit_wallet_topup` NGN-only; wallet by `user_id`; ignores `posted:false`; checks nothing about the intent (LF-7) | `20260607120000:375-376, 382-383, 413-419` | M-NOW (posted assertion, wallet-funding marker — the function is on prod), M7 | MC-CI-10 |
| N16 | Payout RPCs: `settle`/`release` read no currency; postings `'NGN'`; `settle` raises on `fee >= amount` (a 500 loop at the transfer webhook, `:133-136`); transfer webhook dispatches by name; auto-payout non-NGN → manual | `20260706130000:118-119, 133-136, 149, 183-184, 199-202, 209`; `webhooks/[provider]/route.ts:64-78`; `wallet-payout.ts:145` | M1 (assertions + dispatch + fee rule — in a migration timestamped after `20260706130000`, never M-NOW: the July file is not on prod and would clobber an earlier redefinition), M7 | MC-CI-10 |
| N17 | `DEFAULT_WITHDRAWAL_LIMITS` NGN row only | `withdrawal-limits.ts:31-37` | M7 | per-row exponent test (§7.3) |
| N18 | `computePayerChargeMinor` accepts any `rate`, rounds floats | `currency-model.ts:436-438` | M2 | MC-CI-03, MC-CI-04 |
| N19 | `buildCurrencySnapshot` / `convertMinorUnits` scale minor units without exponent; `buildCurrencySnapshot` accepts a fallback; `convertWalletDisplay` hard-codes an NGN source | `currency-model.ts:215-219, 234-238`; `exchange-rate.ts:154`; `wallet-currency.ts:43-58` | M2 | MC-CI-04 |
| N20 | Flutterwave fee identity assumes same-currency settlement and drops an inconsistent fee silently | `flutterwave-provider.ts:236-260` | M3 | MC-CI-09 + settle-test oracle (§6.4) |
| N21 | `apply_payment_webhook` takes no confirmed amount/currency; finalize/webhook never read them | `20260611130000:899-926`; `finalize/route.ts:52-59`; `webhooks/[provider]/route.ts:215-222` | M-NOW | MC-CI-08 |
| N22 | Intents route replay re-routes with the body amount | `intents/route.ts:69-93, 110-114, 170-173` | M-NOW | MC-CI-08 |
| N23 | Paystack adapter has no currency guard | `paystack-provider.ts:137, 212` | M3 | MC-CI-09 |
| N24 | Hold / cap / one-at-a-time reads sum every request row | `account-data.ts:919` (`select("*")`), `:931`, `:979-985`; `wallet-payout.ts:32-49`; `withdrawal/request/route.ts:201-227`; `apps/marketplace/lib/marketplace/payment.ts:221-228`; `packages/dashboard-modules-wallet/src/data.ts:116-120, 145-158`; `packages/dashboard-modules-account/src/data.ts:98`; `apps/hub/lib/owner-data.ts:418` | M1 | MC-CI-01 |
| N25 | No receipt / credit-note issuance path (documents route reads legacy invoices; no `credit-note` type; no credit-note caller; NGN-only proof script) | `documents/[type]/[id]/route.ts:36-43, 154-200`; `sale-reconcile-port.ts:208-227`; `prove-receipts.mts:83-99` | M5 | MC-CI-06 |
| N26 | CI bootstrap `customer_wallets` lacks prod's `currency`, `is_active`, `frozen_at` | `_bootstrap_supabase_env.sql:42-48` | M1 | MC-CI-11 |
| N27 | Exchange-rate freshness measured on the wrong clock (Data Cache + hourly feed) | `exchange-rate.ts:46, 57-63` | M2 | MC-CI-03 |
| N28 | Refund route amount units undocumented per currency; adopt wildcard; no `p_currency` | `refund/route.ts:72-79, 157-161`; `20260611130000:218-223` | M4 | MC-CI-05 |
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
| MC-INV-08 | Status is provider-confirmed truth (unchanged). The provider's confirmed amount and currency are compared to the intent's frozen amount and currency inside `apply_payment_webhook`; a mismatch or a missing figure is refused: no status write, no settlement, a durable exception row, an alarm, a 200 to the provider — never a redelivery loop. **Not built today (LF-2).** | MC-CI-08 |
| MC-INV-09 | A wallet holds one currency. Wallet moves are same-currency only, dispatched by the row's currency to the matching RPC family. There is no cross-currency wallet transfer, auto-conversion or netting in this program. | MC-CI-10 |
| MC-INV-10 | The presentation base is NGN. Consolidated figures are computed in a read-only, as-of function from explicit, auditable reporting-rate snapshots; they are never posted. | §4.6, MC-CI-01 |
| MC-INV-11 | Nothing here weakens an existing invariant: per-entry balance, immutability, idempotency, grant lockdown, A1/A2/A3, the refund cap, the receipt and credit-note ties. Every existing proof suite stays green at its CI position, unchanged in meaning. | MC-CI-12 |
| MC-INV-12 | An intent is born `pending` by a server path only. No request role can insert one; no insert carries a status, a `provider_reference` or (for a non-NGN intent) a snapshot the seam did not produce. | MC-CI-07 |
| MC-INV-13 | Enabling and disabling a currency is transactional with its in-flight money: enable validates a completed settle-test cycle; disable cancels that currency's `pending` intents in the same transaction and reports the count. | MC-CI-07 |
| MC-INV-14 | One allocation per intent, and none after a refund: an intent credits a wallet or pays a division record at most once, by primary key, never while a `payment_refunds` row exists for it, and never when it carries `late_capture`. Status edges are provider truth; **time**, not status, decides whether a capture is late. | MC-CI-08, MC-CI-10 |

---

## 4. Ledger design

### 4.1 Books: one chart, per-currency columns (built)
The in-currency ledger (`journal_entries.currency`, per-entry balance) is the foundation and is not
re-litigated. A balance for `(account, currency)` is the only meaningful balance. The global
`ledger_reconciliation().accounts` list **and** the global scalars `total_debit_minor`,
`total_credit_minor`, `delta_minor`, `balanced` (`20260706120000:232-233, 285-290` — mixed-currency
sums of minor units; each entry balances by trigger, so the global flag proves nothing) are
**dropped** in M1 (not renamed: a stale reader must fail loudly, not pass vacuously). The five
readers of those scalars are amended in the same change, unchanged in meaning: `payout_ledger_invariants.sql`
p7 (`:162-171`), `multicurrency_ledger_invariants.sql` mc6 (`:119-121`), `refunds_invariants.sql`
proof 10 (`:478`), `vat_invariants.sql` proof d (`:225`) and `prove-refund-seam.mts:136` each assert
every `currencies[]` row balanced (and p7 `withdrawals_payable = 0` per currency). `currencies[]`
is the contract. Chain position matters: the readers migration sits
in the CI chain between the payout-rail migration and `payout_ledger_invariants.sql` (`ci.yml:246-249`),
so the amended p7 runs against the post-M1 functions (p7 reads `r->'accounts'` and `w->>'delta_kobo'`
today, `:166-171`); `_bootstrap_supabase_env.sql:42-48` and `payout_rail_min.sql:8-12` give
`customer_wallets` prod's `currency text not null default 'NGN'`, `is_active` and `frozen_at` first
(MC-CI-11); the new reader suite asserts `not (ledger_reconciliation() ? 'accounts')`.
`FinanceLedgerConsole.tsx:108-115, 242-243` consumes the TS `accounts` list and is in N5's scope.

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
| Charge settled, fee known | DR `cash_settlement` net, DR `processor_fees` fee-ex, DR `fee_vat_recoverable` fee-VAT (NGN statutory split; provider-reported only otherwise), CR `payments_clearing` gross | A fee whose currency differs from the charge currency, or a fee ≥ gross, is **dropped**: gross-to-cash posts, the drop is persisted on the intent (`metadata.fee_dropped`) and returned to the route, an alarm fires, and finance posts it later through `post_fee_correction` (§6.5) — never a raise inside the webhook transaction |
| Fee correction (new, M3) | DR `processor_fees` fee-ex, DR `fee_vat_recoverable` fee-VAT / CR `cash_settlement` fee; source `fee_correction`, one per intent, intent currency | `post_fee_correction(intent_id, fee, fee_vat)` is the only way a dropped or unreconciled fee reaches the books; the soak gate asserts dropped-without-correction = 0 (§4.5) |
| Late capture (new, M2) | The ordinary settlement entry; the intent carries `metadata.late_capture = true` | A confirmed capture for a `cancelled` intent **applies** (provider truth) through a dedicated A2 edge and is refunded in full through the guarded refund path; it is never fulfilled (§5.2) |
| Sale recognised | DR `payments_clearing` gross / CR `platform_revenue` ex-VAT, CR `vat_output_payable` output VAT | `post_sale_revenue(p_intent_id uuid, p_output_vat_minor bigint)`: gross and currency are **derived from the intent row** (raise `intent_not_found`; require status in succeeded / refund_processing / refunded; raise when a caller-supplied gross is kept and differs). No currency parameter, no default (M4). Its first statement locks the intent row (`select … for update`, the `apply_refund_webhook` pattern at `20260611130000:490-491`), so a concurrent refund webhook cannot slip between its refund scan and its post. In the same transaction it posts the proportional `sale_revenue_refund` catch-up for every refund already `succeeded` on the intent, **sequentially in `(resolved_at, id)` order with the remainders recomputed between iterations** (the `:581-587` math; a batch from the initial remainders drifts by a minor unit — 333 / 333 / 334 of 1,000 must reverse 23 + 23 + 24 of VAT 70), keyed by refund id, so a refund that precedes the sale never leaves the full sale on the books (LF-6; M-NOW). It raises `late_capture` for an intent whose metadata carries it (§5.2) and `credit_note_pending` handling is in §8.3 |
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
  be the under-remit direction. Each foreign VAT movement converts at the reporting rate of **its own
  period** (the rate id is stored per movement in the return table, never one rate for the window),
  and the NGN effect of reversals is capped **cumulatively per sale** at the NGN originally included
  for that sale (the return table tracks the remaining NGN per sale; two half refunds at a higher
  rate cannot together exceed it), so a refund in a later period cannot reduce the return by more
  than was remitted. NGN
  processor-fee input VAT (`fee_vat_recoverable`) is netted by the built `vat_reconciliation`
  (`20260607140000:246-251, 257`); whether it is deductible is put to the accountant with the same
  question (D-MC-05), and the hub shows it on its own line next to the netted figure until answered.
  The hub monthly net-VAT table shows one block per currency and the composed return figure with its
  rate ids.

### 4.5 Reconciliation readers (M1, before any currency can be enabled)
| Reader | Change |
|---|---|
| `payments_private.wallet_ledger_reconciliation()` | Returns `{wallets: [{currency, wallet_balance_total_minor, ledger_wallet_liability_minor, delta_minor, reconciled}]}`; NGN sums `customer_wallets where currency = 'NGN'`, other currencies sum `customer_currency_wallets` (§7.2); liability lines join `journal_entries.currency`. `customer_wallets` gains `check (currency = 'NGN')`; the funding/withdrawal request tables gain the same CHECK until M7 widens them. |
| `payments_private.vat_reconciliation()` | Per-currency rows (§4.4). |
| `payments_private.ledger_reconciliation()` | `accounts` dropped; `currencies[]` is the contract; p7 of the payout proof amended. |
| Tag consistency (new proof, run in CI and nightly) | An explicit source → currency-resolver table drives the proof: `payment_intent`, `sale_revenue`, `sale_revenue_refund`, `payment_refund`, `fee_correction` → the intent; `wallet_topup` → the funding request → the wallet; `wallet_refund_hold` / `wallet_refund_release` → the refund row → the intent; `withdrawal_reserve` / `withdrawal_settle` / `withdrawal_release` → the request; `payment_intent_refund` (the pre-V3-19 refund source, `20260607140000:99`) → the intent; `ai_usage` → `ai_usage_events.user_id` → the NGN wallet; `withdrawal_fee_correction` → the request; the six M7 `currency_*` sources → their request or refund row; every other `(source, source_event_id)` must be on the CI fixture allowlist (`proof_balanced:evt-1`, `proof_idem:evt-5`, `sale_revenue:sale-evt-1`, `payout_seed_topup:seed-dd`, `proof_mc_usd:mc-evt-1`) or the proof fails; the soak gate runs it unscoped on prod and the shadow, where none of those exist. Per-currency `balanced` alone proves nothing (each entry balances by trigger), so the soak gate asserts **expectations computed from the tables**, stated once: `payments_clearing(c)` = Σ over intents in `c` that have a `('payment_intent', i)` entry, no `('sale_revenue', i)` entry and no `wallet_topup` entry for their funding request, of (`amount_minor` − Σ succeeded refunds of `i`); `withdrawals_payable(c)` = Σ `amount_kobo` of requests in `processing`; `customer_wallet_liability(c)` = wallet totals per family; `cash_settlement(c)` = Σ(gross − posted fee) − Σ succeeded refunds − Σ paid withdrawals (amount + fee); dropped fees without a `fee_correction` / `withdrawal_fee_correction` = 0 (§6.5, §7.3); open disputes (§6.7) are a separate line against the provider balance. The CI proof scopes every expectation to its own fixture users (the chain DB carries other suites' USD entries on `pending` intents); the soak gate runs it unscoped on the shadow and prod snapshots. On prod, until the LF-3 pass lands, the wallet-liability and withdrawals expectations assert `delta = explained delta`, where the explained delta is Σ `customer_wallet_transactions` debits with `reference_type in ('studio_payment', 'marketplace_order')` that have no ledger entry plus withdrawals marked `paid` without a `withdrawal_settle` entry, and that no other source contributes — a shrink-only baseline would be red on the first wallet checkout after its date. |
| `apps/hub/lib/finance-ledger.ts` | Every fold groups by currency: `journal_lines` reads join `journal_entries(currency)`; `customer_wallets` reads carry `currency`; `payment_intents` stats, stuck, flow and recent group by `currency`. One block per currency; never a mixed total. `FINANCE_TRACE_SQL` texts gain `GROUP BY currency`. |
| Owner-command and staff readers (N5a) | `division-revenue.ts`, `since-last-looked.ts`, `owner-data.ts`, `OwnerMoneyStrip.tsx`, `apps/staff/lib/finance-data.ts`: select `currency`, fold per `(division, currency)`, render the NGN figure plus "+ n in other currencies" rather than a sum. |
| Request-table readers (N24) | `getWithdrawalRequests`, `getPendingWithdrawalHoldKobo`, `getWindowWithdrawnKobo`, the request route's one-at-a-time check: `.eq("currency", X)`; one-at-a-time and the daily cap are per currency. |
| FL2 soak scripts and the owner's "balanced to zero" check (`prove-refund-seam.mts:136`) | Read `currencies[]` and the per-(account, currency) expectations above. |

### 4.6 Reporting base and consolidation (M8)
- Presentation base: NGN (unchanged; `LEDGER_CURRENCY`).
- `payments_private.currency_exponents(currency pk, exponent int)` is seeded from `CURRENCY_MAP`
  **in M1** (the birth guard recomputes the payer figure from it, §5.4) with a CI parity test (the
  TS map stays the source; SQL needs the exponent to recompute and to consolidate).
- Reporting rates live in `public.fx_rate_snapshots` with `kind = 'reporting'` (§5.5), entered by
  finance (CBN reference rate or whatever the accountant specifies — D-MC-06), never from the OER feed.
- `payments_private.ledger_consolidated(p_as_of timestamptz, p_snapshot_ids uuid[])` is a `STABLE`,
  read-only function: balances come from `journal_lines` joined to `journal_entries where posted_at < p_as_of`,
  grouped by `(currency, account_code)`; rates are read **by id** from `fx_rate_snapshots`
  (`kind = 'reporting'`, `to_currency = 'NGN'`, `from_currency` = the row currency — the §5.5 CHECKs
  pin that orientation, so a reporting row entered the charge way round cannot exist —
  `rate_as_of <= p_as_of`, exactly one per foreign currency, raise on missing or duplicate);
  conversion is `floor(balance_minor × rate_e8 × 10^(2 − exp_foreign) / 10^8)` computed in `numeric`
  and cast once (a `bigint` product overflows at a USD balance of $614,892 against a reporting
  `rate_e8` of 1.5 × 10^11; MC-CI-01 carries a $1,000,000 fixture). It
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
  as `rate_as_of`; `isStale`/`fetchedAt` are display concepts only. Charge-grade reads use a
  dedicated `fetchChargeRates()` with `cache: "no-store"` (the display path keeps the Data Cache).
  The clock rule, stated once: `CHARGE_RATE_MAX_AGE` = 75 minutes (the feed publishes hourly, so the
  rate's age at any fetch is uniform on [0, 60) minutes; a 30-minute bound would block half of every
  hour) and `QUOTE_TTL` = 15 minutes. `resolvePayerCharge` blocks when `rate_as_of < now() −
  CHARGE_RATE_MAX_AGE` or the rate is a fallback; the intent insert (birth-guard clause, §5.4) accepts
  `rate_as_of >= now() − (CHARGE_RATE_MAX_AGE + QUOTE_TTL)` = 90 minutes, so a quote resolved at the
  edge of the window and paid at the end of its TTL inserts. MC-CI-03 fixes both bounds.
- **Quote TTL at the surface:** the payer-currency amount shown is valid for `QUOTE_TTL`; a charge
  start after that re-resolves and the re-resolved amount is what the provider charges.
- **Capture window (new) — a function of time, not of status:** an intent is not a free option.
  Neither adapter sets a hosted-page expiry, and the finalize route advances `pending → processing`
  before it verifies (`finalize/route.ts:35`), so status alone cannot say whether an intent is
  live. **Scope:** the sweeper and the late-capture rule apply only to intents that carry
  `fx_charge_snapshot` (non-NGN) with `method = 'card'`; NGN intents are untouched — an NGN
  `bank_transfer` top-up settling at 90 minutes is ordinary (`RAIL_TOPUP_METHODS` includes
  `bank_transfer` and `ussd`, `wallet-topup.ts:35`), and NGN expiry with per-method TTLs is a
  separate owner decision (D-MC-15).
- **The sweeper** covers in-scope `pending`, `processing` and `failed` intents older than
  `CHARGE_CAPTURE_TTL` (60 minutes) and **verifies before it decides**, with a total decision
  table: the adapter's `finalize` (the verify) returns `succeeded` → apply through
  `apply_payment_webhook` with the verify figures (money truth); a provider-asserted terminal
  failure of the transaction (`failed`, a cancelled attempt, `reversed`) → apply `failed`; a
  non-terminal provider status (Paystack `abandoned` — the customer left, the session may still be
  completable — `ongoing`, `pending`, `processing`, `queued`, or `impliedStatus: null`) or a
  not-found verify (Flutterwave `verify_by_reference` on a `tx_ref` that was never charged, which
  the adapter surfaces as `notFound: true`, distinct from a transport error) → cancel through
  `advance_payment_intent(from → cancelled)`; a transport or 5xx failure → retry next run; a
  `pending` intent with no succeeded attempt and no `provider_reference` → cancel without a verify;
  an intent with an open `payment_exceptions` row → skipped. The A2 trigger, the TS mirror
  (`state-machine.ts:33-41`) and the RPC whitelist (the live definition is
  `20260605123000:60-80`, not the dropped public copy) gain `pending → cancelled`,
  `processing → cancelled` and `failed → cancelled`. The cancel is a CAS on the current status, so a
  finalize or webhook racing it loses cleanly.
- **`failed` is attempt-level, not the end of the intent (LF-9).** `apply_payment_webhook(…,
  'failed')` is keyed `<reference>:failed` and never consumes the success key; on a `cancelled` or
  `failed` intent it is an idempotent ack (`{applied: false, reason: 'already_terminal'}`, no
  status write — today `cancelled → failed` would raise and loop). A later confirmed `succeeded` on
  the same reference takes the new legal edge `failed → succeeded`: within the window it is a buyer
  who retried on the same hosted page and is fulfilled normally; after the window it is a late
  capture.
- **Late capture, decided by time inside the RPC:** `apply_payment_webhook` stamps
  `metadata.late_capture = true` on any in-scope `succeeded` apply that lands after `created_at +
  CHARGE_CAPTURE_TTL + 15 min` grace, from whichever status (`pending`, `processing`, `failed` or
  `cancelled`), and always on the new edge `cancelled → succeeded`, which the trigger admits only
  when the same statement sets the marker. In the **same transaction** the RPC posts the settlement
  entry with the confirmed figures, inserts the `payment_exceptions` row (kind `late_capture`) and
  claims the full refund through the `initiate_payment_refund` internals with the deterministic
  `refund_key = uuid5(intent_id, 'late_capture')`, returning `{applied: true, late_capture: true,
  refund_id}`; a crash after the commit therefore leaves a durable row and a claimed refund, never a
  silent `duplicate`. The provider refund call runs from the sweeper (and the exception resolver)
  with adopt-don't-redrive (§8.1: Paystack `listRefunds`; Flutterwave has no list, so a crash
  between the provider call and `set_refund_provider_reference` is manual review from the open
  exception); the route's own attempt is best-effort. `post_sale_revenue`, `credit_wallet_topup`
  and `claim_intent_allocation` **raise** on `metadata->>'late_capture' = 'true'` (the refusal is
  not only TypeScript); the finalize route returns `late_capture` so the callback page never shows
  "Payment successful"; the credit note minted at the apply site uses `intent.division ?? 'account'`;
  a user with an unresolved late capture cannot start another non-NGN charge (each late capture
  forfeits the processor fee — a griefing lever otherwise). The TS mirror cannot express the
  metadata gate, so MC-CI-12's lock-step comparison carries an explicit carve-out for that edge.
  The same rule covers a capture that lands after "disable cancels pending" (§5.4). "Not applied,
  nothing posts" is not an option: money that arrived is on the books or the books are wrong
  (D-MC-14).
- In v1 non-NGN charges are **card only** (hosted page, minutes); `bank_transfer` and `ussd` are
  excluded for non-NGN in the method matrix (§6.1). One open non-NGN intent per division record:
  the record stores `charged_intent_id` next to `charged_currency` / `charged_amount_minor`; the
  CAS is keyed on that id (null → set), it is cleared when that intent is cancelled, and a new
  start on a record whose open intent is `pending`, `processing` or `failed` cancels it first
  (`advance_payment_intent`), re-resolves and rewrites all three. Reconcile matches the intent's
  own `fx_charge_snapshot` **and** asserts `snapshot.pricingAmountMinor` equals the record's live
  NGN gross (the check the NGN path has today, `sale-reconcile-port.ts:53`), so a record amended
  after the start never settles at the stale figure.
- **Exposure, stated honestly.** In-currency settlement removes FX from the ledger, not from the
  business: wherever the obligation is NGN-denominated (marketplace vendor payouts, studio and care
  costs), the company holds the payer currency against an NGN payable until treasury converts. The
  spread covers `CHARGE_RATE_MAX_AGE + QUOTE_TTL + CHARGE_CAPTURE_TTL` (about 2.5 hours of NGN
  movement, D-MC-03). The exposure between capture and the monthly treasury conversion is
  **accepted, not covered** (D-MC-11).

### 5.3 Rounding — integer-exact, never below the reference price
- The rate is stored as an integer `rate_e8` (rate × 10^8, **rounded up** at fetch for
  `kind = 'charge'`), with `CHECK (rate_e8 >= 10000)` so the rounding-up error at fetch stays below
  `1 / rate_e8` relative (under 1 bps at the floor; about 0.2 bps for GBP, the weakest NGN-priced
  pair; verified for all 14 pairs in `CURRENCY_MAP`); the spread as `spread_bps`. The effective rate
  is `rate_e8 × (10_000 + spread_bps) / 10_000` in integer arithmetic.
- `payerMinor = ceil( pricingMinor × rate_e8 × (10_000 + spread_bps) × 10^expPayer / (10^8 × 10_000 × 10^expPricing) )`
  computed with `BigInt`. With the rate rounded up and the ceiling, the payer never pays less than the
  reference price, and never more than **one minor unit plus the rate's relative rounding** above it
  (`A − P·r·(1 + s/10⁴)·10^Δ < 1 + P·(1 + s/10⁴)·10^Δ / 10⁸`; at ₦100,000,000 to USD with a 150 bps
  spread the supremum is 102.5 cents, which the spread absorbs; MC-CI-03 asserts an overshoot of at
  most 102 cents on that fixture). `rate_e8` is computed from the feed's **decimal text** with a
  `BigInt` ceiling division (`ceilDiv(rates[X] × 10^k × 10^8, rates[NGN] × 10^k)`), never from the
  float64 cross-rate (`exchange-rate.ts:119`), so the rounding-up step is exact. The snapshot records
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
  settle_test_provider text,                               -- the provider the settle test runs on (§6.1 override; §6.4)
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
  succeeded attempt's provider equals the row's `settle_test_provider` (a fact plpgsql can read; the
  TS `PROVIDER_CURRENCIES` table cannot be read from the database). On disable it cancels that
  currency's `pending` intents in the same transaction and records the count; `processing` intents
  are left to the sweeper's verify-then-decide rule and a capture after the disable is a late
  capture (§5.2).
- **Unbypassable enable.** The validation lives in a BEFORE INSERT OR UPDATE trigger on the policy
  table (the repo's standard for guards that hold against the table owner, `20260611130000:106-165`),
  not only in the RPC: a row whose `enabled` becomes true must carry a `settle_test_ref` that
  validates in-trigger, and DML on the table is revoked from `service_role` (the ledger pattern), so
  the RPC is the only writer. MC-CI-07 includes the direct-UPDATE refuter.
- **The birth guard** (M-NOW, independent of the policy table): `payment_intents_insert_own` is
  dropped and INSERT is revoked from `authenticated`; a BEFORE INSERT trigger raises for the request
  roles (`current_user in ('anon','authenticated')`), and for `service_role` requires
  `new.status = 'pending'` and `new.provider_reference is null` (superuser-run proofs and migrations
  are exempt, which is how the existing fixtures seed captured intents). The only client creator
  (`WalletTopUpClient` → `/api/payments/intents`) already goes through the service-role route.
- **The currency guard** (M1, **its own** trigger function `payments_private.enforce_payment_intent_currency()`
  and trigger `payment_intents_enforce_currency`, BEFORE INSERT, firing after the birth trigger by
  name; the lock migration never redefines the birth function, which a higher-versioned file owns —
  on any version-ordered apply (`supabase db reset`, a preview branch, a new project) a shared
  function would be clobbered by the later file and the currency clauses would vanish silently):
  raise unless the currency row exists and is `enabled`,
  or `new.user_id = settle_test_user_id` for that row; for `currency <> 'NGN'` require
  `metadata->'fx_charge_snapshot'` (`js`) present and **bound to the snapshot row** (`row` =
  `fx_rate_snapshots` by `js.rateSnapshotId`, `kind = 'charge'`): `row.from_currency = 'NGN'`,
  `row.to_currency = new.currency = js.payerCurrency`, `js.rate_e8 = row.rate_e8`,
  `js.spread_bps = row.spread_bps`, `js.pricingAmountMinor > 0`, `row.rate_as_of >= now() − 90 min`
  (§5.2), and `new.amount_minor = js.payerAmountMinor = ceil(js.pricingAmountMinor × row.rate_e8 ×
  (10000 + row.spread_bps) × 10^exp_payer / (10^12 × 10^exp_pricing))` **recomputed**, with
  exponents from `payments_private.currency_exponents` (seeded in M1, §4.6). The SQL form is fixed,
  because the formula transcribed literally is not what it looks like: `10^e` with integer operands
  is `double precision` in PostgreSQL and a `bigint` product overflows at ₦10,818 for KES —
  `n := p::numeric * r::numeric * (10000 + s)::numeric * power(10::numeric, e_payer); d :=
  power(10::numeric, 12) * power(10::numeric, e_pricing)`, and the clause is `(new.amount_minor −
  1)::numeric * d < n and n <= new.amount_minor::numeric * d` (no division, every operand
  `numeric`; verified: KES ₦11,000 at `rate_e8 = 8,400,001`, 150 bps → 93,787 accepted, 93,786
  refused). MC-CI-07 runs KES, XOF and USD at ₦100,000,000 through the trigger and asserts the TS
  fixture table and the trigger agree row for row. A copied fresh snapshot id with a forged amount
  therefore fails. A wallet-funding intent (a
  `customer_wallet_funding_requests` row with `user_id = new.user_id and payment_reference =
  new.idempotency_key`) must match that request's `currency` and `amount_kobo`, and is bound by
  **identity**, not time: the intents route writes `payment_intent_id` on the funding request when
  it sets the `wallet_funding` marker, and the clause requires `request.payment_intent_id = new.id`
  and `request.user_id = new.user_id` (the two tables' `created_at` defaults differ —
  `timezone('utc', now())` at `20260611120000:65` against `now()` at `20260529120000:55` — so an
  ordering test is clock-dependent). A wallet-funding intent whose request currency equals its own
  currency takes the **identity path**: no `fx_charge_snapshot`, `amount_minor = request.amount_kobo`
  (the M7 USD wallet top-up has no NGN pricing and cannot carry a `from_currency = 'NGN'` charge
  snapshot). CHECK `payment_intents.currency ~ '^[A-Z]{3}$'`. MC-CI-07 asserts both triggers
  present and enabled, and MC-CI-12's version-order replay (§10) proves the two files compose in
  either order.
- The app reads the policy table (60-second cache) through `loadChargeCurrencyPolicy()` and passes
  the enabled set to `resolvePayerCurrency`; `parseChargeCurrencies` remains a pure helper for tests;
  its docblock, `ledger.ts:24` and the MC migration header are rewritten so no text names an env var.

### 5.5 Snapshot persistence
```
public.fx_rate_snapshots (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('charge','reporting')),
  from_currency text not null check (from_currency ~ '^[A-Z]{3}$'),   -- the unit being converted
  to_currency   text not null check (to_currency   ~ '^[A-Z]{3}$'),   -- direction is pinned by the names
  rate_e8 bigint not null check (rate_e8 >= 10000),
  spread_bps int not null default 0 check (spread_bps between 0 and 1000),
  source text not null,                     -- 'openexchangerates' | 'cbn' | 'manual:<who>'
  rate_as_of timestamptz not null,          -- the feed's own timestamp
  fetched_at timestamptz not null,
  created_at timestamptz not null default now(),
  check (rate_as_of <= fetched_at),                                                -- a future-dated feed is never "fresh"
  check (kind <> 'charge'    or (from_currency = 'NGN' and to_currency <> 'NGN')),  -- v1: every charge quote is NGN-priced
  check (kind <> 'reporting' or (to_currency = 'NGN' and from_currency <> 'NGN' and spread_bps = 0))
)
```
Append-only (immutability trigger reused from the ledger pattern), service-role write via
`record_fx_rate_snapshot`, staff read. The DDL ships in the lock migration (M1) so MC-CI-07's
positive controls exist at the M0 + M1 gate; the writers are M2. A `kind = 'reporting'` row is
refused with `rate_implausible` when it lies outside ±25% of the inverse of the latest `charge`
snapshot for the pair, or, when no charge snapshot exists for that currency (the first entry; a
consolidation-only currency), outside ±25% of the display feed's cross rate (always available)
unless the caller passes an explicit, audit-logged `p_acknowledge_implausible = true` — the
wrong-orientation entry is caught by the CHECK, a wrong-magnitude entry (15,000 for 1,500) by the
band. The intent's `metadata.fx_charge_snapshot` (a new key, kept
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
adds `providerSupportsCurrency(adapter, query.currency, query.currencyOverride)`, evaluated on
`adapter.supportedCurrencies ?? PROVIDER_CURRENCIES[key]` **plus** `query.currencyOverride` — a
`{provider, currency}` pair the rail passes only when `intent.user_id = policy.settle_test_user_id`
and the policy row names `settle_test_provider`. Without the override the settle test is circular:
the currency joins the table only after the test, and the test routes through `eligibleProviders`,
which would return `no_suitable_provider` (`router.ts:116-120`). A mock registered under a real key
(`router.ts:207-215`) declares every currency so `MOCK_PAYMENT=1` keeps working. The table starts
conservative: `paystack: ["NGN"]`, `flutterwave: ["NGN"]`, `stripe: []`. A currency is appended to
a provider's row only after the owner's live settle test on that provider (§6.4), in the same change
that flips `charge_currency_policy.enabled`; MC-CI-09 carries a parity test that every enabled
`(settle_test_provider, currency)` pair in the policy fixture is in the TS table. The method matrix
gains a per-currency restriction: non-NGN is `card` only in v1 (§5.2).

### 6.2 Routing country
The rails pass the merchant's acquiring country (`country: "NG"`), not the payer's. That stays.
Payer-country routing arrives with Stripe (V3-14, D1). `country-defaults.ts` is untouched.

### 6.3 The confirmed-amount check (M-NOW) and in-currency settlement (v1)
- `apply_payment_webhook` gains `p_confirmed_amount_minor bigint, p_confirmed_currency text,
  p_fee_status text`. For a money-confirming `succeeded` the figures are **required** and are
  checked **before** the LF-5 `pending → processing` advance: NULL returns `{applied: false,
  reason: 'confirmed_amount_missing'}` and a value that differs from the intent row returns
  `{applied: false, reason: 'amount_mismatch', confirmed: {...}}` — in both cases **no status write
  and no posting**, and the RPC inserts the `payment_exceptions` row (kind, the provider figures,
  the intent id) in the same transaction, which commits, under a dedup row keyed
  `<reference>:exception` so the success key stays free for a later resolution. It never raises
  for these: a raise would roll back the exception row with the dedup row, and a non-2xx makes the
  provider redeliver into the same raise (`webhooks/[provider]/route.ts:78, 124, 190-194`). The
  route returns **200** (the provider stops), emits `henry.payment.amount_mismatch` (a new
  `PaymentEventName`; `emitEvent` is a log line plus a best-effort Sentry breadcrumb,
  `packages/observability/src/events.ts:495-510`, so the exception row is the durable record), and
  the finalize route emits `henry.payment.verify.failed` when the verify is not ok
  (`finalize/route.ts:42-44` is a silent 200 today). A `failed` status needs no figures. The
  sweeper skips intents with an open exception, so the exception is not re-verified every run.
  **Signatures:** every redefinition `drop function`s the superseded signature first (the repo's
  own precedent, `20260607140000:64, 159`): with both overloads present a call at the old arity
  through `callPaymentRpc`'s untyped `$n` binds is ambiguous (`42725 function is not unique`,
  reproduced) and every webhook apply would 500 into a redelivery loop, while the un-hardened body
  stayed callable and granted (`refunds_grant_invariant.sql:24`); the grant-invariant lists carry
  the new signatures at their chain positions, MC-CI-11 asserts exactly one overload per hardened
  name, and `prove-refund-seam.mts:69` passes the confirmed figures.
- The figures come from the provider, not the DB: Paystack surfaces `amountMinor`/`currency` from
  the HMAC-signed `charge.success` body (it carries both today and the adapter drops them,
  `paystack-provider.ts:303-318`) and from the verify on `finalize`; Flutterwave surfaces the verify
  figures it already matched the payload against (`flutterwave-provider.ts:346-367`). **Paystack
  fee bearer:** on an account set to pass the transaction charge to the customer, `data.amount` is
  the total debited and `requested_amount` is what we asked, so the confirmed figure is
  `requested_amount ?? amount`, `surchargeMinor = amount − requested_amount` must be 0 or equal
  `fees` (else `amount_mismatch`), and the settle test records the account's bearer setting
  (MC-CI-09 carries the Paystack bearer fixture beside the Flutterwave one). `FinalizeResult.
  amountMinor` / `currency` become optional: a missing field is `undefined`, never `0` or `""`
  (`paystack-provider.ts:194-195` and `flutterwave-provider.ts:234` are corrected), and the mock
  adapter echoes the amount and currency from its own signed body (`mock-provider.ts:88-92` returns
  `0` / `"NGN"` today, which would make every `MOCK_PAYMENT=1` charge an exception). When an adapter
  reports no figure on a webhook, the **route** calls `adapter.finalize` (the verify) and passes its
  figures before the RPC; a verify that **fails** (transport, 5xx) is a 500 (redeliver), never an
  exception; only a verify that succeeds without the figures lets `confirmed_amount_missing` reach
  the exception row.
- **Exception and dispute rows are written only through RPCs** — `payments_private.record_payment_exception(kind,
  intent_id, figures jsonb)` and `open_payment_dispute(...)` in the grant lists — because MC-CI-11
  revokes `service_role` DML on both tables; the route acks only after the RPC commits, else 500.
- **Resolution** (M-NOW): an owner-only route first checks `payment_disputes`, then lists the
  provider's refunds for the reference (`listRefunds`; 503 when it cannot — adopt-don't-redrive,
  §8.1), calls `adapter.refund` for the confirmed amount when none exists, and records
  `resolve_payment_exception(id, 'refunded', provider_refund_reference)`, which also moves the
  intent to `cancelled` (`advance_payment_intent`, §5.2). A later `refund.processed` for an intent
  with no in-flight row is matched to the exception by **both** identifiers — Flutterwave's `data.id`,
  and for Paystack the pair (transaction reference, amount), since its `refund.processed` carries the
  settlement-side `refund_reference`, not the id (`paystack-provider.ts:277-286`) — instead of the
  orphan alarm. Refund in full is the only v1 action — money that never entered the books leaves the
  way it came; accepting a mismatched charge at the confirmed figure is a later owner decision
  (D-MC-13). The same resolver handles refund-side exceptions (§8.1): `resolve_payment_exception(id,
  'refund_applied' | 'refund_failed', amount, currency)` calls `apply_refund_webhook` /
  `fail_payment_refund`. Runbook: `docs/v3/money/runbooks/payment-exceptions.md`. `RefundParams`
  gains `currency`; Flutterwave `refund()` receives the intent currency and refuses when the
  transaction's currency differs.
- A currency is enabled on a provider only if that provider holds a balance in it and settles it
  in-currency. If a provider converts (charges USD, settles NGN), the in-currency posting would
  record USD cash that never arrives and the Flutterwave fee identity would be inconsistent. Such a
  pairing is **not enabled in v1**; the explicit "charge-then-convert" model through
  `fx_conversion_clearing` is designed in §4.2 with no v1 writer (D-MC-02, D-MC-10).

### 6.4 The live settle test per (provider, currency) — the owner's oracle
Run as `settle_test_user_id` on `settle_test_division` while the currency is still disabled.
1. Read the provider's balance in the currency (`getBalance`, built in both adapters) → `B0`, and
   note the account is otherwise quiet.
2. One real charge in that currency through the full rail (card), routed to `settle_test_provider`
   through the §6.1 override (the currency is not yet in `PROVIDER_CURRENCIES`).
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
- `feeStatus: 'reported' | 'unreported' | 'inconsistent'` is a **field on the verified event, never
  a failure** of `verifyWebhook` or `finalize`: a verify failure maps to 401 "Invalid signature" and
  a redelivery loop (`webhooks/[provider]/route.ts:46-51`), and the customer has paid. `inconsistent`
  (fee currency ≠ charge currency; Flutterwave `fm < 0`, `flutterwave-provider.ts:252-259`, which
  today silently reports no fee) carries `feeMinor: undefined`; the route applies the status with fee
  NULL (gross-to-cash) and the RPC records `metadata.fee_unreconciled` — the §7.3 pattern applied to
  charges.
- `post_charge_settlement` never raises inside the webhook transaction for a fee problem: a fee ≥
  gross or a fee VAT out of range posts gross-to-cash and **persists** `metadata.fee_dropped = {fee,
  fee_vat, reason}` on the intent in the same transaction; `apply_payment_webhook` returns the merged
  settlement result (`applied`, `posted`, `entry_id`, `fee_status`) to the route — today it returns
  only `applied` and `perform` discards the settlement result (`20260611130000:924-925`) — which
  alarms `henry.payment.fee.dropped`. The status write (provider truth) always applies.
- A dropped or unreconciled fee reaches the books only through `post_fee_correction(intent_id,
  fee_minor, fee_vat_minor)` (M3; source `fee_correction`, one per intent, intent currency; DR
  `processor_fees` / `fee_vat_recoverable`, CR `cash_settlement`). **Webhook-first fee catch-up:**
  once LF-5's fix makes the webhook the common first applier, a Paystack `charge.success` (which
  frequently carries `fees: null`, the adapter test's "common case") settles gross-to-cash and the
  finalize's real `data.fees` would return `duplicate` and be discarded; so a `succeeded` settlement
  posted with fee NULL records `metadata.fee_unreported`, and `apply_payment_webhook` on a
  `duplicate` whose caller carries a fee, when the intent's settlement posted with fee NULL and no
  `fee_correction` exists, posts the `fee_correction` entry itself (idempotent, intent currency) and
  returns `{applied: false, reason: 'duplicate', fee_corrected: true}`. The soak gate counts
  `fee_unreported` and `fee_dropped` alike: dropped-or-unreported-without-correction = 0 (§4.5).
- **Fee identity (Flutterwave, M3):** today `feeMinor = charged_amount − amount_settled −
  merchant_fee` (`flutterwave-provider.ts:243-252`). When the customer bears the fee
  (`charged_amount = amount + fee`, `amount_settled = amount`) that posts a customer-paid surcharge as
  our expense and understates cash. The identity becomes `amount − amount_settled − merchant_fee`
  (what we asked against what settled); `charged_amount − amount` is surfaced as `surchargeMinor`,
  reported, never posted as a fee. MC-CI-09 carries both bearer fixtures.
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
adapters that, in v1, writes a durable `payment_disputes` row (intent, provider reference, disputed
amount and currency, opened / closed) and alarms — no posting. The row is **refund-blocking**:
`initiate_payment_refund` refuses with `dispute_open` while a dispute is open (a refund on top of a
chargeback is a double loss; A2 gives `succeeded` no chargeback exit, and the Paystack `reversed →
failed` mapping, `paystack-provider.ts:433-435`, applies only at verify from `processing`). The soak
expectation (§4.5) lists open disputes against the provider balance. A chargeback debited by the
provider in a different currency is the conversion event of §4.2 and gets its own pass (D-MC-10). A
hazard-register row records the gap.

---

## 7. Wallet design

### 7.1 NGN wallets stay NGN, and the NGN RPCs learn to refuse other currencies (M-NOW for the RPCs on prod; M1 for the payout RPCs)
- `customer_wallets` is one row per user (`UNIQUE (user_id)`, prod `:6213`), read by every wallet
  surface with `.maybeSingle()` (`account-data.ts:199-207`, `dashboard-modules-wallet/src/data.ts:102-105`,
  the AI metering RPCs `20260627120000:166-169`, the studio wallet checkout). Dropping the unique
  constraint would put every one of those readers at risk. **It is not dropped.** It gains
  `check (currency = 'NGN')`.
- Every NGN wallet RPC asserts the row it acts on is NGN before moving anything:
  `post_withdrawal_settlement` and `release_withdrawal` read `currency` from the request row and
  raise otherwise; the hold branch of `initiate_payment_refund` asserts `v_intent.currency` (it runs
  before the refund row exists, `20260611130000:296-326`) and the release branch of
  `fail_payment_refund` reads the refund row's currency, both raising unless NGN; `credit_wallet_topup`
  reads the funding request's currency instead of trusting `p_currency`. All five raise when
  `post_ledger_entry` returns `posted = false` (the `reserve_withdrawal` pattern,
  `20260706130000:86-89`), so a consumed key can never move a balance without its entry.
- The transfer webhook and `fail_payment_refund` **dispatch on the row's currency** to the matching
  family; nothing is called by name alone.
- The bank-transfer funding route stops sourcing the request currency from a staff-editable setting
  (`wallet/fund/route.ts:103` writes `rail.currency`, which is `care_settings.payment_currency`,
  `payment-settings.ts:41`): it writes the wallet row's currency (`'NGN'` until M7). Without this the
  M1 CHECK on `customer_wallet_funding_requests` would refuse every bank-transfer top-up the moment a
  care owner set `USD`. MC-CI-01's mechanical rule adds: no `currency:` on a request-table insert may
  be sourced from a settings row.
- A non-NGN intent can never credit the NGN wallet: the birth-guard clause for wallet-funding intents
  (§5.4) makes a funding request and its intent agree on currency and amount at insert time, proven
  in MC-CI-07 with USD enabled; `credit_wallet_topup` rejects non-NGN (built); the reconciler flags
  `currency_mismatch` (built).
- **One allocation per intent (LF-7, M-NOW).** A wallet top-up is credited only from an intent the
  intents route marked `metadata.wallet_funding = true` — set only when a `rail_topup` funding
  request with that reference already exists for the user, at which point the route also writes
  `payment_intent_id` on the request; the marker alone is the test (`division` stays `'account'`,
  which `WalletTopUpClient.tsx:101` sends and the owner-command readers group by).
  `credit_wallet_topup` requires the marker, `request.payment_intent_id = p_intent_id`,
  `request.user_id = intent.user_id = p_user_id` and `p_amount_kobo = request.amount_kobo =
  intent.amount_minor` (identity, never a timestamp order — §5.4), and raises `not_wallet_funding`
  otherwise; the M-NOW migration **backfills** the marker and `payment_intent_id` for every existing
  intent that has a `rail_topup` request with the same user and reference, so a request still
  `pending_verification` at apply time is not stranded in a raise loop; `IntentRow` carries the
  marker and `decideTopupReconcile` returns `flag: "not_wallet_funding"` before any RPC call
  (`wallet-topup-port.ts:80-86` selects only `id, status, amount_minor, currency` today).
  `/topup/init` refuses (409) an `idempotencyKey` that already exists in `payment_intents` for
  **any** user. `payments_private.intent_allocations (intent_id primary key, kind, ref)` is written
  in the same transaction by `credit_wallet_topup`, `post_sale_revenue` and
  `claim_intent_allocation(intent_id, kind, record)`, which the studio and care flips call before
  they mark a record paid — so an intent allocated to a division record can never also credit a
  wallet, by primary key. `claim_intent_allocation` is idempotent on the same `(kind, ref)`
  (`{claimed: true, existing: true}`, the flip proceeds) and raises `already_allocated` only on a
  different pair, because the claim and the flip run on different connections
  (`studio/card-rail.ts:190-197`; `care/card-rail.ts:194-200`) and a crash between them must be
  retryable. MC-CI-10 runs the cycle, the claim-twice case and the pre-existing-unmarked-request case.
- **No allocation after a refund (LF-8, M-NOW).** `credit_wallet_topup` and `claim_intent_allocation`
  raise `refund_exists` when any `payment_refunds` row in `processing` or `succeeded` exists for the
  intent (finance resolves: a net credit or the remaining refund through a guarded path), and
  `initiate_payment_refund` refuses `topup_not_credited` for a `rail_topup` request that is not yet
  `verified` — today it takes a hold only for a `verified` request (`20260611130000:290-294`), so a
  partial refund before the credit is followed by the full credit. Finance runs the top-up sync
  first; the refund then takes the hold. MC-CI-10: charge → partial refund → credit attempt raises;
  full refund → the request is cancelled.
- **Sequencing (build-order clobber).** Every RPC redefinition lives in exactly one step and in a
  migration timestamped after the file that last defined the function: `credit_wallet_topup`, the
  refund hold/release branches, `apply_payment_webhook` and `post_sale_revenue` are on prod and are
  hardened in M-NOW; `reserve_withdrawal` / `post_withdrawal_settlement` / `release_withdrawal` are
  defined by `20260706130000` (not on prod yet, `:29, :101, :169`), so their assertions, dispatch and
  fee rule are M1, in a migration timestamped after `20260706130000`, applied after both July files
  in the CI chain and in the prod apply; `post_charge_settlement` is redefined by `20260706120000`
  (`:126`), so the `fee_dropped` persistence (M3) follows it likewise. MC-CI-10 runs after
  `payout_ledger_invariants.sql` and asserts the hardened bodies (a non-NGN request row makes
  `release_withdrawal` raise), so a clobber goes red.

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
  loop that leaves the hold live and the user blocked). The same rule replaces the built
  `fee >= amount` raise (`20260706130000:133-136`), which today turns a misparsed fee into a 500 at
  the transfer webhook (`webhooks/[provider]/route.ts:77-80`) and a redelivery loop with the transfer
  paid, the request stuck `processing`, the hold live and the cash entry absent: fee 0,
  `fee_unreconciled`, alarm, status write applied. MC-CI-10 includes the XOF settle fixture and the
  fee ≥ amount case. A dropped payout fee has no intent, so it reaches the books through
  `post_withdrawal_fee_correction(request_id, fee_minor)` (M1; source `withdrawal_fee_correction`,
  currency from the request row, DR `processor_fees` / CR `cash_settlement`, one per request); §4.5
  counts both correction kinds.
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
  `requested_amount_minor` in kobo, `care/claims/route.ts:111`) is a **proportional share of the
  charged figure, with no rate**: `refundMinor = floor(A × C / P)` (A = charged payer minor, C = the
  claim in kobo, P = the pricing kobo), with the cumulative-remainder rule the VAT reversal already
  uses — the final claim takes the exact remainder, so a full claim returns A and two half-claims sum
  to A. (A floor at the frozen rate, as revision 2 had it, returns 65 of 66 cents on ₦1,001, strands
  `refunded` for ever, and puts FX inside a refund against MC-INV-03.) The claims routes force
  `currency = 'NGN'` and reject anything else (today `care/claims/route.ts:113, 132` store a
  free-text currency after `.slice(0, 6)`, so a claim sent as `6500 USD` would be read as $65.00
  for a ₦65 claim), and the helper raises unless the claim currency is NGN. A booking paid by more
  than one intent (care deposit + balance, possibly at two rates) allocates C across its captured
  intents in capture order, `share_i = floor(A_i × C_i / P_i)` with `C_i` clamped at `P_i − Σ prior
  C_i` and the cumulative remainder per intent, one refund row per intent each capped by its own
  intent (`20260611130000:111-159`). One helper; fixtures: single intent, and a two-intent booking
  whose claim of ΣP returns ΣA.
  The `non_base_currency` branch is dropped; `v_intent.currency` is written into the row (`:341`).
- The wallet-hold branch dispatches on currency: NGN → the existing hold (asserting NGN);
  otherwise → `hold_currency_wallet_refund` (§7.2); before M7 a non-NGN rail top-up cannot exist
  (§5.4 birth guard).
- `apply_refund_webhook` gains `p_currency`: when the payload carries one it must equal the row's.
  Both adapters surface `currency` on `refundEvent` and `ProviderRefundSummary` (Paystack refund
  webhooks carry it today and the adapter drops it; the adapter contract has no `getRefund`,
  `adapter-interface.ts:226-280`, so nothing is "re-verified by the adapter" on its own). For a
  non-NGN row a `processed` outcome with a null amount is never applied blind: the **route**
  re-verifies before the RPC — Paystack `listRefunds` matched on `provider_refund_reference`,
  Flutterwave `GET /transactions/:id/verify` for the currency and `amount_refunded` — and passes the
  recovered figures; if they are still unknown the route writes a `payment_exceptions` row (kind
  `refund_unverified`) and **acks** (a 500 would loop for ever, `webhooks/[provider]/route.ts:188-195`);
  the refund row stays `processing` and finance resolves it through
  `resolve_payment_exception(id, 'refund_applied' | 'refund_failed', amount, currency)` (§6.3), which
  calls `apply_refund_webhook` / `fail_payment_refund` — the webhook will not redeliver after the
  ack and the staff refund route answers `refund_in_flight`, so without it the row could never
  complete. A refund-side `amount_mismatch` or `p_currency` mismatch gets the same exception-and-ack
  treatment instead of today's 500 loop (`webhooks/[provider]/route.ts:188-195`). A `processing` row
  with a wallet hold older than 24 hours raises `henry.payment.refund.stale` naming the exception
  (the hold is not released automatically: the provider may still process). NGN behaviour is
  unchanged.
  Every `post_ledger_entry` call uses `v_row.currency` (`:536`, `:606`); the proportional reversal
  math is unchanged. The RPC returns `amount_minor` and `currency`, and the refund email is built
  only from that result through `formatMoney` (LF-4).
- `fail_payment_refund` selects `currency` and dispatches the release by family (§7.1); the release
  posting uses the row's currency (`:416`).
- The adopt-don't-redrive match (`refund/route.ts:157-162`) **keeps** the null-amount wildcard on the
  safe side and tightens around it. Paystack's list parser returns `amountMinor: null` for any
  non-integral amount (`paystack-provider.ts:386-395`), and a match miss creates a second real-money
  refund (`:194-201`, the #272 class) — so dropping the wildcard, as revision 2 proposed, would
  double-refund. Instead: match by `provider_refund_reference` when the row carries one; exclude any
  provider reference already recorded on another `payment_refunds` row of the intent (an earlier
  processed partial of the same amount is never adopted); refuse with 503 when the list holds a
  `pending|processing` row with a null amount that no reference can bind. `processed` stays
  adoptable only under those exclusions (the crash-after-create case needs it). Route test cases:
  the null-amount queued row, the same-amount earlier partial, the reference match.
- The adapters already carry the exponent on refund (Flutterwave `:449-452`; Paystack minor
  verbatim); Flutterwave `refund()` additionally receives the intent currency (§6.3).

### 8.2 Refund-time balance, treasury and chargebacks
Providers refund the charged amount in the charge currency from the in-currency balance; the absorbed
processor fee is not returned (built assumption). That balance must still exist: the refund route
reads `getBalance({currency})` first and returns `insufficient_provider_balance` instead of creating
a provider refund the balance cannot fund, and the treasury rule (D-MC-11) keeps each currency's
balance at or above its refundable exposure (Σ captured − Σ refunded, trailing 180 days) before any
conversion. Chargebacks: §6.7 — a durable `payment_disputes` row that blocks refunds while open; no
posting in v1.

### 8.3 Credit notes
`customer_credit_notes.currency` CHECK widens to ISO-4217; `record_customer_credit_note` asserts
`p_currency = (select currency from journal_entries where id = p_posting_id)`, that this equals the
refund row's currency, and inserts that value (replacing the literal at `:787`). Minting is **wired**
at the site where `apply_refund_webhook` applies a `processed` outcome
(`webhooks/[provider]/route.ts:128-179`, beside the refund email), best-effort and idempotent, with
`generateCreditNotePdf`; a failure emits `henry.document.generated outcome=failed`, never a silent
catch. **Minting waits for the allocation:** `record_customer_credit_note` ties `p_tax_minor` to the
posted `sale_revenue_refund` VAT for that refund (`20260611130000:760-769`) and is unique per refund
(`:723-728`), so a note minted before the LF-6 catch-up would carry VAT 0 for ever while the ledger
later reverses VAT under the same refund id. The apply site therefore mints only when a
`('sale_revenue', intent)` entry exists or the intent has no sale leg by design (a wallet top-up, or
`refunded` with no sale); otherwise it records `metadata.credit_note_pending` and the
`post_sale_revenue` catch-up mints the note with the reversed VAT in its own transaction (a
`credit_note_already_issued` raise guards the reverse order). MC-CI-06 covers the case. Numbering
stays one `HO-CRN-YYYY-NNNNNN` sequence.

### 8.4 Sequencing
A currency's `enabled` flag can only be set by `set_charge_currency_enabled` with a reference that
proves a full charge → refund → credit note → receipt cycle in that currency (§5.4), and only after
MC-CI-05/06 are green. Disabling cancels that currency's `pending` intents in the same transaction
(§5.4); `processing` intents are left to the sweeper's verify-then-decide rule (§5.2), and a capture
that lands after the disable is a late capture (applied, refunded in full, never fulfilled). The orphan alarm for a
provider-dashboard refund with no in-flight row (`:181-193`) stays and gains the intent currency.

---

## 9. Receipt design

### 9.1 A real issuance path, in-currency (M5)
- `customer_receipts.currency` CHECK widens to ISO-4217; `record_customer_receipt` asserts
  `p_currency = (select currency from journal_entries where id = p_posting_id)` and inserts that
  value (replacing the literal at `:193`); it also asserts the line-item sum, **shape-aware**:
  receipts gain `tax_inclusive boolean`; the line-item key is `amountMinor` on new rows (the reader
  accepts `amountKobo` on rows minted before M5, `payment_documents_invariants.sql:68`); the
  assertion is `Σ line_items = total_minor` when `tax_inclusive` and `Σ line_items = total_minor −
  tax_minor` otherwise; fee lines are in the sum either way. `tax_inclusive` is derived from the
  **VAT regime of the breakdown**, never from which builder minted the row:
  `extractTaxFromBreakdown(breakdown)?.inclusive ?? (meta.vat present)` — the marketplace shape has
  VAT inside `meta.vat` and no `tax` line (`sale-reconcile-port.ts:60-66`); studio and care use
  `applyInclusiveVat`, whose non-tax lines already sum to the total (`vat.ts:187-205`) even though the
  account builder drops the `tax` line (`payment-documents.ts:210-217`); only the legacy add-on-top
  shape is `tax_inclusive = false`. MC-CI-06 carries all three shapes.
- **Issuance:** a `customer_receipts`-backed `receipt` document route (by id or `receipt_no`, RLS-owned)
  replaces the legacy-invoice render for receipts, and a `credit-note` type is added to
  `documents/[type]/[id]`. The marketplace port's silent `catch {}` (`sale-reconcile-port.ts:225-227`)
  becomes `henry.document.generated outcome=failed`. Studio and care mint their receipt at the
  reconcile seam the same way. `prove-receipts.mts` gains USD and XOF fixtures.
- **Charge-currency breakdown:** at charge start the rail stores, next to `charged_currency` /
  `charged_amount_minor`, a breakdown in the charge currency: each non-tax line (fee lines and the
  negative `discount` line included, `packages/pricing/src/index.ts:286`) =
  `floorDiv(line × rate_e8 × (10000 + spread_bps) × 10^expPayer, 10^12 × 10^expPricing)` with
  **mathematical floor** (toward −∞: `BigInt` division truncates toward zero and a negative line must
  be corrected), remainder = `x − floor(x)`, the residual (`payerAmountMinor − Σ floors`, in `[0, n]`)
  allocated one minor unit at a time to the largest remainders, ties broken by ascending line index;
  a priced line that floors to 0 stays 0 and prints as such. The output VAT is carved from the
  **converted standard-rated base**, not the payer gross: Σ of the allocated payer-minor lines whose
  treatment is standard, plus the allocated delivery and fee lines when any standard line exists
  (the composite rule of `order-vat.ts:83-101`), then `carveInclusiveVat` on that sub-sum — a carve
  on the whole gross would VAT exempt and zero-rated lines (₦8,000 baby products + ₦2,000 delivery at
  `rate_e8` 65000 must post 0, not 45 cents; a ₦10,000 standard + ₦10,000 exempt cart must post 45,
  not 91) and contradict §4.4. The port stamps `meta.vat.payer = {outputVatMinor, standardBaseMinor,
  currency}` beside the kobo figures, and **that figure is what the port hands to
  `post_sale_revenue`** — today the port keeps the kobo VAT from `meta.vat` only when it is below the
  gross (`sale-reconcile-port.ts:54-58`), which after M6 compares kobo to cents and would silently
  post 0 VAT on every foreign sale. The receipt prints that breakdown and `tax_minor` equals the
  posted VAT; the NGN order record keeps its NGN pricing. The fixture is ₦1,001 / ₦2,003 / ₦3,007 and a −₦500 discount at `rate_e8 = 65000`
  with distinct remainders → 65, 130, 196, −32 = 359 (MC-CI-06), plus the 3 × ₦1,001 tie case →
  66, 65, 65 = 196 by index.
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
| MC-CI-01 **no cross-currency sum** | (a) `multicurrency_readers_invariants.sql`: seed NGN + USD + XOF entries, wallets and requests; assert `ledger_reconciliation().currencies[]`, `wallet_ledger_reconciliation().wallets[]`, `vat_reconciliation()` rows per currency with the exact seeded figures; assert **no per-account or total figure outside `currencies[]`** (the global scalars are dropped with `accounts`, §4.1, and the five readers of them are amended in the same change); assert the per-(account, currency) expectations computed from the tables and scoped to the suite's fixture users, and the tag-consistency proof with its resolver table and `(source, source_event_id)` allowlist (§4.5); `ledger_consolidated` fixtures: USD 100,000 cents at `rate_e8 = 1,500 × 10^8` → 150,000,000 kobo, XOF 500 at `2.6 × 10^8` → 130,000 kobo, a $1,000,000 balance (the `bigint` overflow case) → 1.5 × 10^11 kobo, and a reporting snapshot entered the charge way round is refused by the §5.5 CHECK. (b) `scripts/ci/currency-sum-guard.mjs`, a **mechanical** rule over `apps/**/{app,components,lib}/**/*.{ts,tsx}` and `packages/{payment-router,pricing,dashboard-modules-*,branded-documents}/src/**`: any `.select("…")` on a money table naming `amount_minor|debit_minor|credit_minor|balance_minor|balance_kobo|amount_kobo` must also name **that table's currency column** (`currency`; `settlement_currency` for `customer_wallet_transactions`, which has no `currency` column — `schema.sql:3013-3014`) or join `journal_entries(currency)`; a `select("*")` / `safeSelect(…, "*")` list read on a money table is **baselined by `file::table.column`** (a `*` names the currency column, so a "must also name" test is vacuous there); any `.single()` / `.maybeSingle()` read is exempt regardless of the equality column; the aggregate rule is **function-scoped**, not line-windowed: a `sum(`, `.reduce(`, `+=` or `-=` over an identifier matching `/amount_(kobo|minor)|balance_(kobo|minor)|debit_minor|credit_minor/` must sit in a function that filters on the currency column or takes a `currency` parameter (the N24 fold `getPendingWithdrawalHoldKobo`, `account-data.ts:979-985`, is 60 lines from its select and called from two routes). SQL half: `pg_get_functiondef` of the reader functions on the fresh DB (not the immutable migration files) must group by or filter on currency; sums scoped by `entry_id`, `intent_id` or `posting_id` are exempt by construction. Baseline per site keyed `file::table.column` (the `schema-drift-check.mjs:350-356` pattern — never by line), shrink-only, generated against pre-M1 `main` and shrunk to zero in the M1 PR for the N5 / N5a sites it widens (`finance-ledger.ts:211-216`; `division-revenue.ts:127, 150`; `since-last-looked.ts:44`; `staff/finance-data.ts:54, 61`; `dashboard-modules-wallet/src/data.ts:108`; the list reads `account-data.ts:212, 810, 816`, `lifecycle/collector.ts:768`), with the N24 request readers **fixed, not baselined**; the rule also flags a `currency:` on a request-table insert sourced from a settings row (§7.1). | any per-currency row missing or mixed scalar; any new unqualified select/fold; any baseline growth; any N24 site baselined |
| MC-CI-02 **posting currency = event currency** | `multicurrency_posting_invariants.sql`: USD intent → settlement entry USD; `post_sale_revenue(intent_id, vat)` derives USD and raises for a non-captured or unknown intent, and a standard-rated USD sale posts `vat_output_payable > 0` from the VAT carved from the converted standard-rated base (§9.1); the "partial refund, then sale" fixtures (LF-6): after a succeeded ₦40,000 refund of a ₦100,000 sale, `post_sale_revenue` leaves revenue = gross − refunded share and VAT likewise, with one `sale_revenue_refund` catch-up keyed by the refund id, and a replay posts nothing; three prior refunds of 333 / 333 / 334 on a 1,000 sale with VAT 70 reverse 23 + 23 + 24 (sequential, remainders recomputed); a concurrent refund webhook during the sale post is serialised by the intent lock; a mixed USD cart (₦10,000 standard + ₦10,000 exempt at `rate_e8` 65000) posts 45 cents of VAT and an all-exempt cart posts 0; `initiate` + `apply_refund_webhook` on a USD intent post USD; currency-wallet RPCs post USD; the tag-consistency proof (§4.5). Secondary, literal scan of `payments_private` bodies for `'NGN'` (comments stripped before counting — `pg_get_functiondef` includes them, `20260706120000:52`) with an explicit (function, expected count) allowlist measured on the built chain DB: `post_charge_settlement` 1 (statutory branch), `post_ai_usage_charge` 1, `wallet_ledger_reconciliation` (0 today; 1 after M1), the NGN-asserting payout RPCs `reserve_withdrawal` 2 / `post_withdrawal_settlement` 1 / `release_withdrawal` 1 and `credit_wallet_topup` 2 (they stay NGN by design, §7.1), the dedicated NGN wallet hold/release functions (moved out of `initiate_payment_refund` — 3 today — and `fail_payment_refund` — 1 today — in M4, after which those two carry none), and `record_customer_receipt` 2 until M5 — and a scan that no v1 body references `fx_conversion_clearing` / `fx_gain_loss`; `ledger_consolidated` must be `STABLE`. The behavioural proofs are primary; the literal scan cannot be relied on against `'NG'||'N'`. | any wrong tag; any raise missing; any non-allowlisted literal or FX-account reference |
| MC-CI-03 **charge needs a fresh, real rate** | `payer-charge.test.ts`: `resolvePayerCharge` returns `blocked` for fallback, `rate_as_of` older than `CHARGE_RATE_MAX_AGE` (75 min), missing rate, missing policy set, unknown exponent, below floor; returns the exact `BigInt` figure for a fixture table (NGN→USD, NGN→XOF, NGN→GHS, spread 0/150 bps, the rate rounded up at fetch from the feed's decimal text with `BigInt`, and the ₦100,000,000 bound case of §5.3 asserting an overshoot of at most 102 cents); the snapshot reproduces the figure; `fetchChargeRates` uses `cache: "no-store"` (asserted on the fetch init). SQL half: a quote resolved at age 74 min and inserted 15 min later (age 89) passes the birth-guard bound and age 91 fails. | any blocked case passes; any fixture figure differs by one minor unit; either clock bound off |
| MC-CI-04 **exponent-correct, no blanket ×100** | (a) unit tests: `formatMinor`/`formatMoney`/callback/email formatting for USD and XOF; `buildCurrencySnapshot` (fallback → null) and `convertMinorUnits` NGN→XOF; `convertWalletDisplay` with a USD source. (b) `scripts/ci/exponent-guard.mjs` over the MC-CI-01 scope **plus** `packages/{ui,interactions,i18n,email}/src/**`: any `/ 100`, `* 100`, `/100`, `*100` on an identifier matching `minor|kobo|cents|amount` must sit in a function whose currency is statically `"NGN"` (named `*Naira*`/`*Kobo*` or guarded by `=== "NGN"` within 6 lines); any `Intl.NumberFormat(…, { style: "currency" })` outside `packages/i18n` is flagged; per-site shrink-only baseline seeded with the §1.3 list. | any new unguarded scale or formatter; any XOF fixture off by 100× |
| MC-CI-05 **refund in charge currency, ≤ captured** | a new suite `multicurrency_refund_invariants.sql`, appended after the M4 migration (the existing `refunds_invariants.sql` runs at `ci.yml:208`, before any widening, and stays byte-identical) with a USD cycle: full refund, two partials with proportional VAT reversal, over-refund rejected, replay dedup (the `refund.failed` revert on a USD rail top-up releasing the USD wallet lives in `currency_wallet_invariants.sql` after M7), `p_currency` mismatch raises, a null-amount `processed` for USD is re-verified by the route and, unresolved, lands in `payment_exceptions` with an ack (no 500 loop), the NGN-claim share fixture (a full claim returns the charged figure; two half-claims sum to it; no rate), `dispute_open` refuses a refund. Route tests: a queued Paystack refund with a null amount makes the route refuse with 503, not redrive; an earlier processed partial of the same amount is never adopted; a reference match adopts. | any step posts NGN; any cap breach; any replay double-posts; any mis-routed wallet; any redrive |
| MC-CI-06 **document currency = posting currency** | a new suite `multicurrency_document_invariants.sql`, appended after the M5 migration (`payment_documents_invariants.sql` runs at its early chain position before the receipt CHECK widens and stays byte-identical): a USD posting records a USD receipt; `p_currency` ≠ posting raises; the shape-aware Σ-lines assertion raises on a mismatch for the marketplace, the inclusive studio/care and the legacy add-on shapes; the ₦1,001 / ₦2,003 / ₦3,007 / −₦500 breakdown fixture at `rate_e8 = 65000` → 65, 130, 196, −32 = 359 and the 3 × ₦1,001 tie case → 66, 65, 65 = 196; a credit note likewise, and a credit note for a refund that preceded the sale is minted by the catch-up with the reversed VAT (`credit_note_pending`); `prove:receipts` renders USD and XOF with the right decimals and the issuer triad; a route test fetches `receipt` and `credit-note` PDFs from `customer_receipts` / `customer_credit_notes`. | any mismatch accepted; any `/100` artefact |
| MC-CI-07 **birth guard + one allowlist, enforced by the DB** | `charge_currency_policy_invariants.sql`: both triggers (`payment_intents_enforce_birth`, `payment_intents_enforce_currency`) present and enabled; an `authenticated`-role insert raises; a `service_role` insert with `status <> 'pending'` or a `provider_reference` raises; a disabled-currency insert raises except for `settle_test_user_id`; a non-NGN insert without a consistent `fx_charge_snapshot` raises, and so does one with a copied fresh snapshot id and `amount_minor` ÷ 10 (the trigger recomputes the figure from the snapshot row; the lock migration ships `fx_rate_snapshots`, so the positive controls exist at this gate); KES, XOF and USD at ₦100,000,000 with 150 bps pass through the trigger and the TS fixture table agrees row for row (the `numeric` form of §5.4); a wallet-funding intent whose currency, amount or `payment_intent_id` binding differs from its funding request raises (with USD enabled), and the identity path accepts a USD wallet-funding intent with no snapshot when `wallet_enabled`; `set_charge_currency_enabled` rejects an invalid or foreign reference, validates `settle_test_provider`, and cancels `pending` intents on disable; a direct `update charge_currency_policy set enabled = true` without a valid reference raises (the policy trigger) and `service_role` holds no DML on the table; `anon`/`authenticated` cannot execute the RPC or read the table; the app loader test asserts `resolvePayerCurrency` receives the table's set and blocks on none. Grep guard scoped to `process.env.CHARGE_CURRENCIES` / `env.CHARGE_CURRENCIES` in `.ts` outside tests (comment-stripped). | any insert that should raise succeeds; any grant leak; any env read |
| MC-CI-08 **provider-confirmed figure = frozen figure; status edges** | SQL proof: `apply_payment_webhook` with a confirmed amount or currency ≠ intent returns `amount_mismatch`, writes the `payment_exceptions` row under `<reference>:exception`, posts nothing and writes no status (the figure check precedes the advance); NULL figures on `succeeded` return `confirmed_amount_missing` likewise; webhook-first on a `pending` intent applies (`pending → processing → succeeded` in one transaction) and a later finalize is `duplicate` — and when that finalize carries a fee the `fee_correction` posts once (`fee_corrected: true`) — and the reverse order likewise (LF-5); `failed` is keyed `<reference>:failed`, so `failed` then `succeeded` on the same reference applies (LF-9), `failed` on a `cancelled` or `failed` intent is `already_terminal`, and a Paystack `abandoned` then a capture, and a Flutterwave not-found then a capture at 24 h, both land as `late_capture` + a claimed refund, never a 500 and never fulfilment; a `pending` intent with no attempt is cancelled without a verify; a `processing` intent older than the TTL with a non-terminal verify is cancelled and one with a terminal verify applies; an NGN `bank_transfer` intent at age 2 h is untouched; a late capture's exception row and refund claim commit with the edge (the crash-between-steps fixture finds them), `post_sale_revenue` / `credit_wallet_topup` / `claim_intent_allocation` raise on `late_capture`, and each reconciler refuses to fulfil it; an intent with an open exception is skipped by the sweeper; `freeze_intent_money_columns` rejects a snapshot rewrite or removal. Route tests: the replay-with-different-amount case routes with the stored figure and 409s on a body mismatch; a mismatch returns 200 and emits `henry.payment.amount_mismatch`; a failed re-verify returns 500; the finalize route emits on a failed verify and returns `late_capture` for one; the seam asserts `snapshot.payerAmountMinor` equals the routed amount; each rail settles only when `intent.amount_minor === record.charged_amount_minor && intent.currency === record.charged_currency`, `snapshot.pricingAmountMinor` equals the live NGN gross, a `('payment_intent', intent)` entry exists, and never on `late_capture`; the Paystack bearer fixture (`requested_amount` + `fees`) and the mock adapter both pass the figure check. | any settle on a mismatch, without an entry or on a late capture; any snapshot rewrite accepted; any redelivery loop; any success key consumed by a failure |
| MC-CI-09 **provider currency capability + fees** | `select-provider.test.ts`: a currency outside the adapter's set makes it ineligible; `route` returns `no_suitable_provider` when none supports it; the `settle_test_provider` override admits only the settle-test user on that provider; the mock keeps every currency; non-NGN `bank_transfer`/`ussd` ineligible; parity: every enabled `(settle_test_provider, currency)` pair in the policy fixture is in `PROVIDER_CURRENCIES`. Adapter fixtures per enabled currency (initiate/verify/refund/transfer; XOF canary; Paystack normalisation; both adapters surface `amountMinor`/`currency` on charge events and `currency` on refund events; a missing field is `undefined`); fee-currency mismatch and Flutterwave `fm < 0` → `feeStatus: inconsistent` with the status still applied and `fee_unreconciled` set; fee ≥ gross → `fee_dropped` persisted and route-visible, `post_fee_correction` posts once and refuses twice; the customer-bears-fee fixtures (Flutterwave `charged_amount` vs `amount`; Paystack `requested_amount` vs `amount`) yield `surchargeMinor` and no fee; `FinalizeResult` figures optional and the mock echoes its signed body; the chargeback event writes a `payment_disputes` row through `open_payment_dispute` and `initiate_payment_refund` then refuses. | any route to an unsupported provider; any fee posted in the wrong currency; any verify failure on a fee; any dropped fee invisible to the route |
| MC-CI-10 **wallet currency isolation + one allocation** | `currency_wallet_invariants.sql`, positioned after `payout_ledger_invariants.sql` so it sees the hardened payout bodies: every NGN RPC raises on a non-NGN request or refund row; a currency release after an attempted mis-route still restores the currency wallet (distinct source names); every wallet writer raises on `posted = false`; `wallet_ledger_reconciliation().wallets[]` reconciles per currency after top-up, hold, release, reserve, settle (incl. the XOF settle fixture); the fee-currency mismatch and the fee ≥ amount case post fee 0 with `fee_unreconciled`, status applied. The LF-7 cycle: a rail charge succeeds, a funding request is then created with the same key, the reconciler flags and never credits, `credit_wallet_topup` raises `not_wallet_funding`, `/topup/init` refuses the key, and `intent_allocations` refuses a second allocation of one intent (route tests for the two routes); `claim_intent_allocation` twice with the same `(kind, ref)` → ok, with another kind → raises; a pre-existing unmarked request is flagged, not looped. The LF-8 cycle: charge → partial refund → `credit_wallet_topup` raises `refund_exists`; `initiate_payment_refund` refuses `topup_not_credited` on an uncredited rail request; a full refund cancels the request. `post_withdrawal_fee_correction` posts once after the fee ≥ amount fixture and refuses a second. | any cross-currency wallet move; any per-currency delta ≠ 0; any raise loop; any second allocation; any credit after a refund |
| MC-CI-11 **grants and CI shape** | New `payments_private` functions in the grant-invariant lists (anon/authenticated EXECUTE false, service_role true); the policy table, `fx_rate_snapshots`, `payment_exceptions`, `payment_disputes` and `intent_allocations` revoke DML from `service_role` too; `_bootstrap_supabase_env.sql` and `payout_rail_min.sql` carry prod's `customer_wallets` shape (`currency text not null default 'NGN'`, `is_active`, `frozen_at`) and `customer_wallet_transactions.settlement_currency`, and reproduce prod's default **table** grant to `service_role` — the `alter default privileges … grant all on tables to service_role` statement placed **before the first `create table`** in the bootstrap (placed after it, the three wallet tables the bootstrap creates itself get no grant: executed), as `scripts/db/shadow-bootstrap.sql:25` does; today the bootstrap grants EXECUTE on functions only, so a `service_role` table proof dies on a missing grant before any trigger fires; the suite asserts `has_table_privilege('service_role', t, 'INSERT')` for every money table a proof writes as `service_role`, and that every hardened `payments_private` name has exactly one overload; `scripts/db/build-shadow-db.mjs` `FL2_SET` gains the AI and July files with their suites (it ends at `sec_harden_01` today) and then the M-NOW and M0 + M1 files at the positions MC-CI-12 names, and `payout_ledger_invariants.sql` seeds its `auth.users` row first so it runs on the FK-bearing shadow. | any leak; any missing column; a service-role proof red on a grant; two overloads of one name |
| MC-CI-12 **nothing regressed; version order = chain order** | All existing suites green at their positions; the M-NOW migration + proof after the refunds step (`ci.yml:211`); the lock migration between `ci.yml:224` and `:231` (before the July ledger file, as its version orders it); the readers / payout-hardening migration between `ci.yml:246` and `:249` so `payout_ledger_invariants.sql` p7 — amended to iterate `currencies[]` and read `wallets[]`, unchanged in meaning — runs against the post-M1 functions, with mc6, refunds proof 10, vat proof d and the seam script amended for the dropped global scalars (§4.1); `multicurrency_ledger_invariants.sql` mc1–mc6 green (its direct USD inserts stay `pending`); the TS state-machine lock-step comparison carries an explicit carve-out for the metadata-gated `cancelled → succeeded` edge; a **version-order replay** step applies the whole migration directory in version order on a second fresh DB and asserts `pg_get_functiondef` of every `payments_private` function and the `pg_trigger` set on `payment_intents` equal the chain-order result (the clobber a shared trigger function would suffer is otherwise invisible to both CI and the shadow); `@henryco/payment-router`, `@henryco/pricing`, `@henryco/account` tests green. | any red; any function or trigger that differs between the two orders |

Not a CI rule, by design: the live settle test (§6.4).

---

## 11. Build plan — ordered by money risk

Order principle: every step that can only **lose** money if skipped comes before any step that lets
money move in a new currency. Each step is additive and independently shippable; each ends with a
gate.

| Step | Scope | Risk class prevented | Gate |
|---|---|---|---|
| **M-NOW — hardening on `main` (before anything else; separate PR)** | (1) The birth guard: drop `payment_intents_insert_own`, revoke INSERT from `authenticated`, BEFORE INSERT trigger (§5.4) — proposed held migration `docs/v3/security/v3-mc-design-01-proposed-migrations/01_payment_intents_birth_guard.sql` + its proof (the proof grants `service_role` SELECT/INSERT on `payment_intents` first, prod's platform default that the CI chain lacks); (2) `apply_payment_webhook(p_confirmed_amount_minor, p_confirmed_currency)` with the refuse-and-record semantics of §6.3, `payment_exceptions`, `resolve_payment_exception` + the owner resolve route, both adapters surfacing the figures, both routes passing them, the replay branch routing with the stored figure; (3) the reconcilers (wallet, studio, care, marketplace) require a `('payment_intent', intent)` settlement entry before crediting or flipping; (4) the NGN RPCs that are on prod: `credit_wallet_topup` currency + `posted` + wallet-funding marker (identity-bound, with the backfill) + `refund_exists`, the refund hold/release assertions and `topup_not_credited`, `intent_allocations` + `claim_intent_allocation` (idempotent per `(kind, ref)`), `/topup/init` key refusal, `IntentRow` marker + `decideTopupReconcile` flag (LF-7, LF-8, §7.1); the bank-transfer funding route pinned to the wallet currency; the studio wallet route asserting `(currency ?? 'NGN') === 'NGN'` (prod `studio_payments.currency` is nullable, `schema.sql:5534`); (5) LF-5: `apply_payment_webhook` advances `pending → processing` before the terminal write, after the figure check; (6) the finalize route emits on a failed verify; (7) LF-6: `post_sale_revenue` catch-up reversal (intent lock, sequential, `credit_note_pending`) for refunds that precede the sale — on the prod signature `(text, bigint, bigint)` the catch-up treats `p_source_event_id` as the intent id, which is what its only caller passes (`sale-reconcile-port.ts:186-188`); (8) LF-9: `failed` keyed `<reference>:failed`, `already_terminal` ack, the `failed → succeeded` edge; (9) every redefinition drops its superseded signature and the grant-invariant lists carry the new ones; (10) `record_payment_exception` / `open_payment_dispute` / `resolve_payment_exception` + the owner resolve route; (11) `prove-refund-seam.mts` seeds its captured intent with the birth trigger disabled inside its own transaction and passes the confirmed figures; (12) `FL2_SET` in `build-shadow-db.mjs` gains the AI and July files, then these. Owner applies dry-run-first. | LF-1 self-credit; LF-2 under-payment credit; LF-5 stranded capture; LF-6 overstated sale and VAT; LF-7 double allocation; LF-8 credit after a refund; LF-9 a failure consuming the success key; mis-routed wallet families | MC-CI-07 (birth clauses), MC-CI-08 (confirmed figure, LF-5 orders, LF-9 edge), MC-CI-02 (LF-6 fixtures), MC-CI-10 (assertions, LF-7 and LF-8 cycles), MC-CI-11 (one overload per name) green; prod apply recorded |
| **M0 + M1 — one prod apply: lock first, the July migrations, then readers + payout hardening** | Verify prod state by introspection (SCHEMA-TRUTH-01 method): list the remote migration history and the exact pending set (21 local files postdate prod's last recorded apply `20260627213858`, 19 of them unrelated to money — a `db push` would sweep them all in, so the apply is **per file, in version order, the FL2 method**, `fl2-apply-manifest.md:3-7`), and a pre-apply check that no `customer_wallets`, `customer_payout_methods` or request row carries a non-NGN `currency` (the CHECKs would otherwise fail to apply). In **one** owner apply, per file in version order: the lock migration, named `20260706110000_…` so it sorts before the July files — the policy table + its trigger, the **separate** currency-guard trigger function (§5.4; it never redefines the birth function), `payment_intents` ISO CHECK, `currency_exponents` + parity test, `fx_rate_snapshots` + `record_fx_rate_snapshot` (DDL; writers are M2) (§5.4, §5.5) → `20260706120000` → `20260706130000` → the readers / payout-hardening migration, named after `20260706130000` (in the CI chain between `ci.yml:246` and `:249`; the lock migration sits between `:224` and `:231`): the payout RPC currency assertions, dispatch and fee rule + `post_withdrawal_fee_correction` (§7.1, §7.3), `wallet_ledger_reconciliation` / `vat_reconciliation` per currency, `accounts` and the global scalars dropped + the five readers amended, chart gains the two FX accounts (no writers), `customer_wallets` + request-table CHECKs, CI bootstrap wallet shape and table grants first, hub finance + console + owner-command + staff + request readers currency-scoped, formatters routed through `formatMoney`, both static guards with per-site baselines. Record in `fl2-apply-manifest.md`. | Mixed-currency figures; an unplanned non-NGN intent; books silent or contaminated between applies; a hardened RPC clobbered by a later file; unrelated migrations swept into a money apply | MC-CI-01, 04, 07, 10, 11, 12 (incl. the version-order replay) green; FL2 soak check reads `currencies[]` and the per-(account, currency) expectations with the explained delta |
| **M2 — FX seam** | `resolvePayerCharge`, integer rounding with the rate rounded up (`BigInt` from the feed's decimal text), `rate_as_of` freshness (75 / 15 / 90 min), `fetchChargeRates` no-store, spread, floor; the `record_fx_rate_snapshot` writers + the reporting plausibility band; `fx_charge_snapshot` freeze incl. removal; the sweeper scoped to non-NGN card intents over `pending`, `processing` and `failed` with the total verify-then-decide table, the `notFound` verify result, and the `pending|processing|failed → cancelled` edges; late capture decided by time inside the RPC, atomic with its exception row and refund claim, the SQL-side refusals, the finalize `late_capture` result and the new-start block; the `charged_intent_id` CAS with the live-gross check; `buildCurrencySnapshot` / `convertMinorUnits` / `convertWalletDisplay` fixes. No caller wired; NGN intents untouched (D-MC-15). | Stale/fallback-rate charges; float drift; free option on old quotes through any state; stranded or fulfilled late captures; NGN transfers swept; 100× display mis-scale | MC-CI-03, 04, 08 (SQL half) green |
| **M3 — Provider capability** | `PROVIDER_CURRENCIES` + adapter-declared sets + the `settle_test_provider` override in routing; non-NGN card-only; Paystack normalisation; adapter `amountMinor`/`currency` on charge and refund events (optional `FinalizeResult` figures; the mock echoes its body); `feeStatus` as a field (never fatal) + `fee_unreconciled` via `p_fee_status`; `fee_dropped` / `fee_unreported` persisted and route-visible + `post_fee_correction` incl. the webhook-first catch-up (after `20260706120000`, which redefines `post_charge_settlement`); the Flutterwave and Paystack fee-bearer identities + `surchargeMinor`; `chargebackEvent` → `payment_disputes` + `dispute_open`; settle-test runbook (`scripts/money/live-settle-test.mjs`: settlement-record oracle, fee-line assertion, receipt + credit-note download). | Routing a currency to a provider that converts or rejects; raise loops on fees; phantom cash; a customer-borne surcharge posted as our fee; a refund on top of a chargeback | MC-CI-09 green; runbook dry-runs against the mock |
| **M4 — Refund + credit-note legs widened** | N6, N7, N8, N28: `post_sale_revenue(intent_id, vat)` with the old `(text, bigint, bigint)` signature dropped (the LF-6 catch-up is already in M-NOW); refund row currency trigger; `initiate`/`apply` currency params (old signatures dropped); dispatch by family; the proportional claim-share helper (NGN-only claims; multi-intent allocation); `RefundParams.currency`; RPC returns amount + currency; email from the RPC result; the adopt match tightened (reference match, exclusions, 503 on an unbindable null row); null-amount re-verify in the route + `refund_unverified` exception + resolver actions + the stale-hold alarm; refund-side mismatches as exceptions; credit-note minting wired at the apply site with `credit_note_pending`; the `multicurrency_refund_invariants.sql` USD cycle. | Unrefundable foreign charges; orphaned or doubled provider refunds; wrong-currency reversals; under-refunded or mis-denominated claims; wrong email amounts | MC-CI-02, 05 green |
| **M5 — Receipt leg + issuance** | N9, N10, N25: receipt currency tie + `tax_inclusive` (derived from the VAT regime) + the shape-aware Σ-lines assertion with `amountMinor` keys, in `multicurrency_document_invariants.sql`; `customer_receipts`-backed `receipt` route + `credit-note` type; port catch → event; studio/care receipt minting; renderers and `prove:receipts` USD/XOF; email copy modules across locales; money-email matrix rows; guard scope widened. | A receipt that cannot be issued or prints wrong decimals | MC-CI-06 green; `i18n:check:strict`, `tone:check` green |
| **M6 — Rail wiring, dark** | Studio first, then care, marketplace: each rail calls `resolvePayerCharge`, writes `charged_intent_id` + `charged_currency` + `charged_amount_minor` + the charge-currency breakdown on its record (CAS keyed on the intent id), creates the intent with the snapshot, routes with the currency, hands `post_sale_revenue` the VAT carved from the converted standard-rated base (`meta.vat.payer`), reconciles on the frozen figure, the live NGN gross and the settlement entry, never on `late_capture`. Wallet-funding intents stay NGN by the birth guard. Nothing enabled. | Double conversion at reconcile; rate-move stranding; silent 0 VAT on foreign sales | MC-CI-08 green; NGN path byte-identical (existing rail tests) |
| **G3 — Owner gate: first currency** | §6.4 on studio as `settle_test_user_id` with the first currency (D-MC-01); `set_charge_currency_enabled` validates the cycle and adds the provider row. | — | settle test passed incl. refund, receipt, credit note, settlement record |
| **M7 — Per-currency wallets + payouts** | §7.2 tables + writers with distinct source names; request-table CHECK widened; wallet surfaces; limits rows + exponent test; payout branch; fee-currency rule; refund holds for currency top-ups. Behind `wallet_enabled` per currency. | Cross-currency wallet moves; overdraw in a second currency; raise loops | MC-CI-10 green; owner payout test in that currency |
| **M8 — Reporting** | `ledger_consolidated` as-of by snapshot ids (floored, labelled derived); reporting-rate entry UI with the plausibility band; hub consolidated tab; per-currency VAT block with per-movement reporting rate ids, the reversal cap, the composed FIRS figure, the `in_return` line and the NGN fee-VAT line (§4.4). | Posted FX; mis-stated VAT return; wrong-direction or wrong-exponent consolidation | MC-CI-01, 02 green (derived figures labelled; no writes) |
| **Later, separate designs** | LF-3 studio and marketplace wallet checkouts through a guarded RPC + a manual-payout RPC (until then the §4.5 expectations run against a dated delta baseline); charge-then-convert for auto-converting providers; chargeback posting; period-end revaluation; in-app wallet FX; payer-country routing with Stripe (V3-14); international payout details (V3-69); AI metering currency (program spec M4). | — | each needs its own owner decision |

Rollout per currency after M6: `NGN` (live) → first currency (D-MC-01) → next, one at a time, each
through G3. Studio first, then marketplace, care, learn.

---

## 12. Owner decisions (surfaced; each blocks the gate named)

| Id | Decision | Recommendation | Blocks |
|---|---|---|---|
| D-MC-00 | Apply the M-NOW hardening (birth guard, confirmed-amount check) to prod now, ahead of the multi-currency work | Yes, dry-run-first; LF-1 is a live self-credit path | M-NOW |
| D-MC-01 | First non-NGN currency | USD | G3 |
| D-MC-02 | Per (provider, currency): confirm on the live account that the provider holds a balance in that currency and settles in-currency, using the settlement record (§6.4 step 5) | A provider that converts is excluded from that currency in v1 | M3 table rows, G3 |
| D-MC-03 | Spread (`spread_bps`) per currency and the per-currency charge floor, sized to rate age + quote TTL + capture window (75 + 15 + 60 minutes, §5.2) | 150 bps for card; floors USD 100, GBP 100, EUR 100, GHS 500, KES 10000, XOF 500 (minor units) — confirm with the accountant; NGN fixed at 0 | M2 config, G3 |
| D-MC-04 | Charge-quote rate source: OER (current) vs the acquiring provider's published rate | Keep OER for the quote at its hourly cadence (`CHARGE_RATE_MAX_AGE` 75 min, §5.2); verify plan terms for commercial use; revisit if the provider's rate diverges beyond the spread | M2 |
| D-MC-05 | VAT treatment of foreign-currency supplies (resident vs non-resident buyer; export zero-rating) and whether processor-fee input VAT is reclaimable — foreign **and NGN** (`vat_reconciliation` nets NGN fee VAT today, `20260607140000:240-245`) | Accountant answer; default until then: division treatment applies regardless of currency; foreign fee VAT recorded in-currency and kept **out** of the return; NGN fee VAT shown on its own line in the hub next to the netted figure (the live figure is not changed by this design) | M4 (posting rule), M8 |
| D-MC-06 | Reporting rate source and convention for the VAT return and consolidated figures (CBN reference at transaction date vs period average) | CBN reference rate at month end for consolidation; transaction-date rate for the VAT return if the accountant requires it; both as `kind='reporting'` snapshots | M8 |
| D-MC-07 | Scope of per-currency wallets: which currencies; withdrawal limits per currency; whether a currency wallet can be withdrawn to a bank | Enabled charge currencies only, same-currency withdrawal only, limits mirrored from NGN at the reporting rate and rounded to clean figures | M7 |
| D-MC-08 | Whether receipts for foreign-currency supplies must print the NGN equivalent and rate for NRS e-invoicing | Accountant answer; the design supports an informational line either way | M5 |
| D-MC-09 | Confirm the M0 + M1 single prod apply (lock first, July migrations second, readers last) is the owner's own apply, dry-run-first, like FL2 | Yes | M0/M1 |
| D-MC-10 | Confirm provider auto-conversion (charge USD, settle NGN) and chargeback posting stay out of scope for v1 and get their own passes | Yes | §6.3, §6.7 |
| D-MC-11 | Treasury conversion policy: who converts foreign balances to NGN, when, and the rule that each currency balance stays at or above its refundable exposure before conversion; acceptance of the economic FX exposure on NGN-denominated obligations between capture and conversion | Finance converts monthly above the exposure floor; the capture-to-conversion exposure is accepted, not covered by the spread (which covers rate age + TTL + capture window only) | M2 (spread), G3 |
| D-MC-12 | Non-NGN charges card-only in v1 (no bank transfer or USSD in a foreign currency) | Yes | M3 |
| D-MC-13 | Resolution policy when the provider-confirmed amount or currency differs from the intent (§6.3): v1 refunds in full at the provider from the exception; accepting at the confirmed figure with an adjustment is not built | Refund in full | M-NOW |
| D-MC-14 | A confirmed non-NGN card capture that lands after the capture window (§5.2: decided by time inside the RPC, from whichever status) is applied to the books and refunded in full, never fulfilled; a user with an unresolved late capture cannot start another non-NGN charge | Yes | M2 |
| D-MC-15 | Expiry of NGN intents (bank transfer, USSD, card) with per-method TTLs — bank transfer at 24 hours or more — and whether an NGN late capture is refunded or credited; out of M2 (the sweeper is scoped to non-NGN card intents) | Separate pass; no NGN intent is cancelled by this program | after M6 |

---

## 13. Hazard register — the paths this design closes

| Hazard | Where it would bite | Closed by |
|---|---|---|
| Forged intent birth: a signed-in user inserts a `succeeded` intent and a reconciler trusts it (LF-1) | `20260529120000:235-237`; the reconcilers | §5.4 birth guard; settlement-entry requirement in reconcilers; MC-CI-07/08 |
| Under-payment credit: replay re-route with a smaller amount, no confirmed-amount check (LF-2) | `intents/route.ts:69-114`; `apply_payment_webhook` | §6.3 confirmed-amount check; stored-figure replay; MC-CI-08 |
| Free option on an old quote through any non-terminal state (finalize advances before verify; no hosted-page expiry; `abandoned` and not-found verifies); late capture after a disable or after the window | `finalize/route.ts:35`; no `processing → cancelled` edge; pending intents live forever | §5.2 sweeper over `pending` / `processing` / `failed` with a total decision table; late capture by time, applied and auto-refunded; `charged_intent_id` CAS + live-gross check; card-only non-NGN scope; D-MC-14 / D-MC-15 |
| Webhook-first capture stranded on a `pending` intent (LF-5) | `20260611130000:921`; A2 | §1.5 / M-NOW (5); MC-CI-08 both orders |
| An attempt-level failure consuming the success dedup key; a `cancelled → failed` raise loop (LF-9) | `20260611130000:914-921`; `paystack-provider.ts:432-435`; `flutterwave-provider.ts:672-681` | §5.2 `<reference>:failed` keys, `already_terminal`, `failed → succeeded`; MC-CI-08 |
| Partial refund before the top-up credit: full credit plus the refund (LF-8) | `20260611130000:290-294`; `credit_wallet_topup` | §7.1 `refund_exists`, `topup_not_credited`; MC-INV-14; MC-CI-10 |
| A sweeper that turns `abandoned` into terminal `failed`, or leaves a never-charged `tx_ref` `pending` for ever, and then fulfils a capture days later at a stale rate | revision 3 §5.2 | §5.2 total decision table, late capture by time; MC-CI-08 |
| Late capture committed but its refund never initiated (route crash after the apply) | revision 3 §5.2 | §5.2 exception row + refund claim in the RPC transaction; sweeper drives the provider call |
| The currency guard vanishing on a version-ordered rebuild (a lower-versioned file redefining a higher-versioned file's function) | revision 3 §5.4 / §11 | §5.4 separate trigger function; MC-CI-12 version-order replay |
| A hardening overload left beside the old one: 42725 on every apply, the un-hardened body still callable | `callPaymentRpc` untyped binds, `db.ts:72-74` | §6.3 drop-first rule; MC-CI-11 one overload per name |
| VAT carved onto exempt and zero-rated lines of a foreign-currency cart | revision 3 §9.1 | §9.1 standard-rated base; MC-CI-02 mixed and all-exempt fixtures |
| The trigger recomputation overflowing `bigint` or drifting in `double precision` | revision 3 §5.4 | §5.4 `numeric` multiplication form; MC-CI-07 range fixtures |
| `ledger_consolidated` overflowing at ordinary balances | revision 3 §4.6 | §4.6 `numeric`; MC-CI-01 $1,000,000 fixture |
| The webhook-first order dropping the Paystack fee after LF-5's fix | `adapter-interface.ts:76-80`; the "common case" fixture | §6.5 `fee_unreported` + catch-up on `duplicate`; MC-CI-08 |
| One settlement allocated twice: division record paid and the wallet credited from the intent's own key (LF-7) | `topup/init/route.ts:49-79`; `wallet-topup-port.ts:80-86`; `credit_wallet_topup` | §7.1 wallet-funding marker, key refusal, `intent_allocations` by primary key; MC-CI-10 cycle |
| Refund before the sale allocation leaves the full sale and VAT on the books (LF-6) | `20260611130000:548-553`; `post_sale_revenue` | §4.3 catch-up reversal; MC-CI-02 fixture |
| Forged payer amount with a copied fresh snapshot id (a buggy or future service-role insert) | the §5.4 clauses as first drafted | §5.4 recomputation against the snapshot row; MC-CI-07 ÷10 case |
| Double refund through adopt-don't-redrive (a null-amount queued row; an earlier partial of the same amount) | `refund/route.ts:157-201`; `paystack-provider.ts:386-395` | §8.1 adopt rules; MC-CI-05 route cases |
| Under-refund and a stranded `refunded` on NGN claims converted at the frozen rate | revision 2 §8.1 | §8.1 proportional share, no rate; MC-CI-05 |
| Silent 0 VAT on every foreign sale (kobo VAT compared to a payer-minor gross) | `sale-reconcile-port.ts:54-58, 186-190` | §9.1 VAT from the payer gross; MC-CI-02 USD sale asserts VAT > 0 |
| Raise loop or silent ack on a provider mismatch; captured money with no record | `webhooks/[provider]/route.ts:78, 124, 190-194`; `finalize/route.ts:42-44` | §6.3 exception row + 200 + `resolve_payment_exception`; D-MC-13 |
| Enable flipped by a direct UPDATE on the policy table | revision 2 §5.4 | §5.4 BEFORE trigger + DML revoke; MC-CI-07 refuter |
| Freshness bound blocking half of every hour; a quote paid inside its TTL refused at insert | revision 2 §5.2 | §5.2 clock rule (75 / 15 / 90) |
| A hardened RPC clobbered by a later `create or replace` in an immutable July file | `20260706130000:29, 101, 169`; `20260706120000:126` | §7.1 sequencing rule; MC-CI-10 after the payout proof |
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
| Phantom cash: provider converts, fee identity inconsistent and dropped | `flutterwave-provider.ts:236-260` | §6.5 `feeStatus` field + `fee_unreconciled`; §6.4 settlement-record oracle; D-MC-02 |
| Customer-borne surcharge posted as our fee; cash understated | `flutterwave-provider.ts:243-252` | §6.5 identity on `amount`; `surchargeMinor` |
| Raise loop on a fee: webhook 500s forever, charge or payout stranded | `20260706120000:174-185`; payout settle `:133-136` | §6.5 `fee_dropped` persisted + `post_fee_correction`; §7.3 fee rule incl. fee ≥ amount |
| Unrefundable foreign charge; provider-dashboard refund orphaned; refund after a treasury sweep; refund on top of a chargeback | `initiate_payment_refund:258-259`; orphan path; §8.2 | §8, §8.2 balance check + D-MC-11; §6.7 `payment_disputes` refund-blocking; MC-CI-05 |
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
- Prod: the owner's "I prove, you settle" discipline — M-NOW first, then one M0 + M1 apply, per
  file in version order (never a `db push` that would sweep the 19 unrelated pending migrations in),
  every migration dry-run-first on the shadow (`build-shadow-db.mjs` `FL2_SET` carries the AI, July
  and new files, §10 MC-CI-11), every currency through §6.4, NGN never at risk at any step.
