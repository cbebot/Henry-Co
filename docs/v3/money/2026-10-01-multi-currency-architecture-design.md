# Multi-currency architecture — ledger, FX, provider, wallet, refund, receipt (V3-MC-DESIGN-01)

**Status:** DESIGN DRAFT for owner review. Nothing in this document changes production. Every
stage below is additive, flag-dark, and gated on a per-currency live settle test the owner runs.
**Date:** 2026-10-01. **Base:** `origin/main` @ `b1efffe`.
**Builds on:** `2026-07-05-multi-currency-in-currency-ledger-design.md` (owner-approved, in-currency
ledger; its M1a migration `20260706120000_v3_money_mc_multicurrency_ledger.sql` is on `main`) and
`2026-07-06-automatic-withdrawal-payout-rail-design.md` (payout rail; W1–W3 are on `main`,
flag-dark). It completes what those two deferred: FX at the charge seam, provider currency
capability, per-currency wallets, in-currency refunds and credit notes, in-currency receipts, and
the reporting layer — and it fixes the readers that would mix currencies the moment a second
currency posts.

**Owner framing (binding, unchanged):** Henry Onyx is a global company. Money is charged, settled,
posted, refunded and documented in the payer's currency. FX appears only at the charge quote and
at reporting. It never appears inside a posting, a reconcile, a refund or a receipt.

**What this supersedes.** The program spec `docs/superpowers/specs/2026-07-04-multi-currency-charge-program.md`
§2.1 ("the ledger keeps ONE accounting base (NGN)") and its stage M2 ("post base-currency entries
derived from the snapshot") are superseded by the owner's 2026-07-05 in-currency decision and by the
shipped migration. The rest of that spec (resolution, allowlist, rollout order) stands and is folded
in here.

---

## 0. Reading guide

| Section | What it settles |
|---|---|
| §1 | The spine as it exists on `main` — every claim carries a file and line |
| §2 | The NGN-lock inventory: every place NGN is hard-wired, and which build step widens it |
| §3 | Principles — the money invariants, each with its CI rule id |
| §4 | Ledger design (per-currency books, chart, reconciliation, VAT, reporting base) |
| §5 | FX design (the one conversion seam, rate freshness, spread, rounding, snapshot persistence) |
| §6 | Provider design (currency capability, routing, settlement proof, fees) |
| §7 | Wallet design (NGN wallets stay; per-currency wallets as separate tables) |
| §8 | Refund and credit-note design (in-currency, never re-converted) |
| §9 | Receipt design (in-currency documents, exponent-correct rendering) |
| §10 | Invariants as CI rules (what goes red, and how) |
| §11 | Build plan ordered by money risk, with gates |
| §12 | Owner decisions required before each gate |
| §13 | Hazard register: the money-losing paths this design closes, and how |

---

## 1. The spine on `main` (grounded)

Every row was read from the file named. "Prod" means the production database as last captured
(`supabase/prod-actual/schema.sql`, 2026-06-11) plus the FL2 go-live verification
(`docs/v3/FL2-GO-LIVE-STATUS-REPORT-2026-06-27.md`). Anything after 2026-06-27 is "on main,
prod state unverified" and is listed as such.

### 1.1 Money tables and their currency posture

| Object | Where | Currency posture today |
|---|---|---|
| `public.payment_intents` (`amount_minor bigint`, `currency text`) | `apps/hub/supabase/migrations/20260529120000_payment_intents.sql:43-58` | `currency` has **no CHECK**; `amount_minor`/`currency` are frozen after insert by `freeze_intent_money_columns` (`20260611130000_v3_19_refunds.sql:174`) |
| `public.journal_entries.currency` | `20260706120000_v3_money_mc_multicurrency_ledger.sql:24-32` | ISO-4217 CHECK (`journal_entries_currency_iso`); one entry = one currency |
| `public.journal_lines` (`debit_minor`, `credit_minor`) | `20260607120000_double_entry_ledger.sql:91-109` | Currency-neutral integers; balance trigger per entry (`assert_entry_balanced`, `:119-145`) |
| `public.ledger_accounts` (8 codes) | `20260607120000:58-66`, `+vat_*` `20260607140000:40-43`, `+withdrawals_payable` `20260706130000:20-22` | Shared chart; no per-currency codes (design 3.1 of the 07-05 doc) |
| `public.customer_wallets` (`balance_kobo`, `currency` default `'NGN'`) | prod `supabase/prod-actual/schema.sql:3024-3034`; `UNIQUE (user_id)` `:6213`; `balance_kobo >= 0` `:6306` | **One wallet per user**, NGN |
| `public.customer_wallet_transactions` (`amount_kobo`, `balance_after_kobo`, `settlement_currency`, `display_currency`, `exchange_rate*`) | prod `:2999-3023` | Columns carry currency context (foundation migration `20260419120000`), rows are NGN |
| `public.customer_wallet_funding_requests` / `_withdrawal_requests` / `customer_payout_methods` (`currency` default `'NGN'`) | `20260611120000_fl2_wallet_rail_completion.sql` | NGN rows written by the routes (`topup/init/route.ts:74`, `withdrawal/request/route.ts:236,260`) |
| `public.payment_refunds.currency` | `20260611130000_v3_19_refunds.sql:90-91` | **CHECK `currency = 'NGN'`** |
| `public.customer_receipts.currency` | `20260607130000_v3_18_payment_documents.sql:90-91` | **CHECK `currency = 'NGN'`** |
| `public.customer_credit_notes.currency` | `20260611130000:674-675` | **CHECK `currency = 'NGN'`** |
| `public.processed_webhooks` | `20260529120000:89-100` | Dedup key `(provider, provider_event_id)`; currency-free |

### 1.2 Money writers (`payments_private`, service-role only, reached over the pooled direct-pg rail)

| RPC | Where | Currency behaviour today |
|---|---|---|
| `post_ledger_entry(source, event, desc, currency, lines)` | `20260706120000:39-114` | Accepts any `^[A-Z]{3}$`; tags the entry |
| `post_charge_settlement(intent, status, fee, fee_vat)` | `20260706120000:126-210` | Posts in the **intent's** currency; 7.5% statutory fee-VAT split **only** when `NGN` (`:187-188`); a provider-reported fee VAT is honoured for any currency and posted to `fee_vat_recoverable` (`:186`, `:204`) |
| `apply_payment_webhook(...)` | `20260611130000:899-926` | Dedup-first; calls `post_charge_settlement` in the same txn; rejects `refunded` |
| `post_sale_revenue(event, gross, output_vat)` | `20260607140000:197-224` | **Hard-codes `'NGN'`** on the entry (`:222`); no currency parameter |
| `credit_wallet_topup(user, request, intent, amount_kobo, currency)` | `20260607120000:363-427` | **Rejects non-NGN** (`:376`); resolves the wallet by `user_id` only |
| `initiate_payment_refund` / `set_refund_provider_reference` / `fail_payment_refund` / `apply_refund_webhook` | `20260611130000:218-633` | `initiate` returns `non_base_currency` for a non-NGN intent (`:259`); every refund posting is tagged `'NGN'` (`:321`, `:416`, `:536`, `:606`) |
| `record_customer_receipt(...)` | `20260607130000:127-205` | **Rejects non-NGN** (`:152`); inserts `'NGN'` (`:193`); total must equal the posting's debit total |
| `record_customer_credit_note(...)` | `20260611130000:692-798` | **Rejects non-NGN** (`:720`) |
| `reserve_withdrawal` / `post_withdrawal_settlement` / `release_withdrawal` | `20260706130000:29-226` | `reserve` rejects non-NGN (`:59`); all three postings tagged `'NGN'` (`:80`, `:149`, `:209`) |
| `ledger_reconciliation()` | `20260706120000:223-293` | Per-currency `currencies[]` (correct); global `accounts[]` kept for backward compatibility and **mixes currencies** once a second currency posts (`:235`, `:290`) |
| `wallet_ledger_reconciliation()` | `20260607120000:464-479` | Sums **all** `customer_wallets.balance_kobo` against **all** `customer_wallet_liability` lines — no currency predicate (`:474`) |
| `vat_reconciliation(from, to)` | `20260607140000:231-262` | Sums `vat_output_payable` / `fee_vat_recoverable` across **all** currencies; returns `'currency': 'NGN'` (`:258`) |

### 1.3 Charge, reconcile and document code paths

| Path | Where | Currency behaviour today |
|---|---|---|
| Account intents route | `apps/account/app/api/payments/intents/route.ts:42` | Accepts any of the 15 codes in `CURRENCY_MAP` (`packages/i18n/currency.ts:13-29`) via `normalizeCurrency`; the client supplies `amountMinor` + `currency`; no allowlist check |
| Provider selection | `packages/payment-router/src/router.ts:88-92` | Eligibility = country preference ∩ method capability ∩ registered. **`query.currency` is not consulted** |
| Division card rails | `apps/studio/lib/studio/card-math.ts:14`, `apps/care/lib/payments/card-math.ts:10`, `apps/marketplace/lib/checkout/card-rail.ts:75` | Return `null` / reject for any non-NGN amount; every rail writes `currency: "NGN"`, `country: "NG"` |
| Reconcile-on-return | `apps/studio/lib/studio/card-rail.ts:154-190`, `apps/care/lib/payments/card-rail.ts:158-195`, `packages/payment-router/src/division-sale.ts:78-92`, `apps/account/lib/wallet-topup.ts:116-125` | Exact `amount_minor` (+ currency where modelled) match on the intent; mismatch flags, never settles |
| Payer currency resolution + charge amount | `packages/pricing/src/currency-model.ts:337-389`, `:414-443` | `resolvePayerCurrency` / `computePayerChargeMinor` exist and are tested; **no app caller yet**; `computePayerChargeMinor` takes a `rate` it does not validate for staleness/fallback and rounds with `Math.round` on float major units (`:436-438`) |
| FX rates | `packages/pricing/src/exchange-rate.ts` | Open Exchange Rates, USD base cross-rate, 30-minute cache, served stale after 2 h (`:17`), identity-rate fallback flagged `isFallback` (`:102`, `:113`); `convertMinorUnits` returns `null` on fallback (`:151`) but scales minor units with no exponent adjustment (`:154`) |
| Charge allowlist | `packages/pricing/src/currency-model.ts:319-327` (`parseChargeCurrencies`) | Pure parser only. **No code reads a `CHARGE_CURRENCIES` env var anywhere in `apps/`** — the interlock exists on paper, not in a running path |
| Provider amount units | Paystack `paystack-provider.ts:136` (minor verbatim); Flutterwave `flutterwave-provider.ts:192`, `:533` (major via `minorUnitExponent`) | Exponent-correct per adapter; `normalizeCurrency` rejects anything outside `CURRENCY_MAP` before any math |
| Provider fee identity (Flutterwave) | `flutterwave-provider.ts:236-260` | `feeMinor = gross − amount_settled − merchant_fee` assumes **settlement in the charge currency** |
| Payout rail (flag-dark `WALLET_AUTO_PAYOUT`) | `apps/account/lib/wallet-payout.ts:145` | Non-NGN payout method → manual review |
| Withdrawal limits | `packages/payment-router/src/withdrawal-limits.ts:31-37` | Per-currency table; only an `NGN.verified` row exists |
| Receipt props | `apps/account/lib/payment-documents.ts:245`, `:407` | Throws `currency_not_base` for non-NGN |
| Document money formatting | `packages/branded-documents/src/format.ts:10-12` | `value / 100` for **every** currency (wrong for a 0-decimal currency) |
| Callback amount display | `apps/account/app/payments/callback/PaymentCallbackClient.tsx:117-119` | `amountMinor / 100` for every currency |
| Money emails | `apps/account/lib/email/templates.ts` (subjects and bodies) | `NGN` literal in every locale's wallet/withdrawal/refund subject; refund email passes `Math.round(refundedMinor / 100)` (`webhooks/[provider]/route.ts:171`) |
| Owner finance console | `apps/hub/lib/finance-ledger.ts:244-290` | Re-derives totals, per-account balances, wallet reconciliation and VAT from `journal_lines` / `customer_wallets` **with no currency predicate** |
| Wallet display overlay | `apps/account/lib/wallet-currency.ts:57-58` | Converts in major units then re-scales to the target exponent — the correct pattern |
| Snapshot builder | `packages/pricing/src/currency-model.ts:207-245` (`buildCurrencySnapshot`) | `convertedDisplayAmount = round(originalAmount × rate)` on **minor** units with no exponent adjustment; no app caller today |

### 1.4 What is live, what is dark

- Live money: Flutterwave card rail (`FL2-GO-LIVE-STATUS-REPORT-2026-06-27.md`: 39/39 succeeded
  attempts on `flutterwave`; ledger balanced; migrations through `v3_19_refunds` applied).
- On `main`, prod application **not recorded** in any status document: `20260706120000_v3_money_mc_multicurrency_ledger.sql`
  and `20260706130000_v3_money_payout_rail.sql` (both landed 2026-07-16, PR #499). Build step M0 verifies this.
- Dark: `WALLET_AUTO_PAYOUT`, division card flags per environment, Stripe (V3-14 deferred by D1).
- Consequence worth stating plainly: with the pre-MC `post_charge_settlement` in prod, a non-NGN
  intent that a provider happened to accept would reach `succeeded` with **no ledger entry**
  (`20260611130000:844` returns `non_base_currency`). With the MC version it would post in-currency
  but every reader in §1.2/§1.3 marked "no currency predicate" would then mix that currency into NGN
  figures. Either way the first non-NGN charge must not be possible until §11 M1 lands. Today the
  only thing preventing it is the provider account configuration.

---

## 2. The NGN-lock inventory (what the build widens, in order)

Each lock is widened by exactly one build step (§11). A lock is never removed without the CI rule
that replaces it (§10) landing in the same change.

| # | Lock | File:line | Widened in | Replaced by rule |
|---|---|---|---|---|
| N1 | `payment_intents.currency` has no CHECK and no allowlist | `20260529120000:47`; `intents/route.ts:42` | M1 | MC-CI-07 (allowlist trigger) |
| N2 | `wallet_ledger_reconciliation` sums across currencies | `20260607120000:464-479` | M1 | MC-CI-01 |
| N3 | `vat_reconciliation` sums across currencies, labels result NGN | `20260607140000:231-262` | M1 | MC-CI-01 |
| N4 | `ledger_reconciliation().accounts` global list | `20260706120000:235, 290` | M1 | MC-CI-01 |
| N5 | Hub finance reader re-derives without currency | `apps/hub/lib/finance-ledger.ts:244-290` | M1 | MC-CI-01 (TS half) |
| N6 | `post_sale_revenue` tags `'NGN'` | `20260607140000:222` | M4 | MC-CI-02 |
| N7 | `payment_refunds_currency_base`, `initiate_payment_refund` non-NGN gate, `'NGN'` on refund postings | `20260611130000:90-91, 259, 321, 416, 536, 606` | M4 | MC-CI-02, MC-CI-05 |
| N8 | `customer_credit_notes_currency_base`, `record_customer_credit_note` NGN guard | `20260611130000:674-675, 720` | M4 | MC-CI-06 |
| N9 | `customer_receipts_currency_base`, `record_customer_receipt` NGN guard and literal | `20260607130000:90-91, 152, 193` | M5 | MC-CI-06 |
| N10 | `buildReceiptProps` / `buildCreditNoteProps` `currency_not_base` | `payment-documents.ts:245, 407` | M5 | MC-CI-06 (TS) |
| N11 | `/ 100` formatting | `branded-documents/src/format.ts:10-12`; `PaymentCallbackClient.tsx:117-119`; `webhooks/[provider]/route.ts:171` | M5 | MC-CI-04 |
| N12 | Money-email `NGN` subjects/bodies | `apps/account/lib/email/templates.ts` | M5 | MC-CI-04 + email matrix row |
| N13 | Division rails: `NGN`-only math, `currency: "NGN"`, `country: "NG"` | `card-math.ts` ×2, marketplace `card-rail.ts:75`, each `card-rail.ts` intent insert | M6 | MC-CI-08 (frozen snapshot match) |
| N14 | Provider selection ignores currency | `router.ts:88-91` | M3 | MC-CI-09 |
| N15 | `credit_wallet_topup` NGN-only; wallet resolved by `user_id` | `20260607120000:376, 383-384` | M7 | MC-CI-10 |
| N16 | `reserve_withdrawal` NGN-only; payout postings `'NGN'`; auto-payout non-NGN → manual | `20260706130000:59, 80, 149, 209`; `wallet-payout.ts:145` | M7 | MC-CI-10 |
| N17 | `DEFAULT_WITHDRAWAL_LIMITS` NGN row only | `withdrawal-limits.ts:31-37` | M7 | unit test per currency row |
| N18 | `computePayerChargeMinor` accepts any `rate`, rounds floats | `currency-model.ts:436-438` | M2 | MC-CI-03, MC-CI-04 |
| N19 | `buildCurrencySnapshot` / `convertMinorUnits` scale minor units without exponent | `currency-model.ts:217-219`; `exchange-rate.ts:154` | M2 | MC-CI-04 |
| N20 | Flutterwave fee identity assumes same-currency settlement | `flutterwave-provider.ts:236-260` | M3 | settle-test oracle (§6.4) + MC-CI-09 |

Locks that are **kept on purpose**: the NGN statutory fee-VAT split (`20260706120000:187-188`),
`LEDGER_CURRENCY = "NGN"` as the presentation base (`packages/payment-router/src/ledger.ts:18`),
`SYSTEM_BASE_CURRENCY = 'NGN'` (`currency-model.ts:108`), and the AI metering wallet (NGN; program spec M4 stays deferred).

---

## 3. Principles (the invariants)

Each principle names the CI rule (§10) that enforces it. "Minor units" always means the minor unit
of the currency named on the same row, scaled by that currency's exponent
(`getCurrencyMinorUnit`, `packages/i18n/currency.ts:57-59`; NGN 2, USD 2, XOF 0).

| Id | Invariant | Rule |
|---|---|---|
| MC-INV-01 | Minor units of two currencies are never added, compared or netted. Every aggregate over `journal_lines`, `customer_wallets*`, `payment_intents.amount_minor` or `payment_refunds.amount_minor` carries a currency predicate or a `GROUP BY currency`. | MC-CI-01 |
| MC-INV-02 | A posting's currency is the currency of the money event it records: the intent's currency for a charge, sale, refund or receipt; the wallet's currency for a wallet move. No RPC chooses a currency on its own. | MC-CI-02, MC-CI-05, MC-CI-06 |
| MC-INV-03 | FX is applied in exactly one place, before an intent exists: the payer-charge seam (§5). The frozen result (currency, minor amount, rate snapshot id) is what the provider charges, what reconcile matches, what a refund reverses and what a receipt prints. Nothing downstream re-converts. | MC-CI-03, MC-CI-08 |
| MC-INV-04 | A charge never starts on a fallback, stale or missing rate. Display may use a labelled approximation; a charge may not. | MC-CI-03 |
| MC-INV-05 | Exponent-correct everywhere: no `× 100` / `÷ 100` on a value whose currency is not statically NGN. | MC-CI-04 |
| MC-INV-06 | A currency becomes chargeable only through one switch, enforced at the database (`payments_private.charge_currency_policy`), flipped by the owner after that currency's live settle test. The app reads the same table; there is no second list. | MC-CI-07 |
| MC-INV-07 | Per currency, the refund leg, the credit-note leg and the receipt leg are proven (CI) before the charge leg can be enabled. A refund is always in the charge currency, for at most the captured amount, at the charged figure. | MC-CI-05, MC-CI-06, §11 gate G3 |
| MC-INV-08 | Status is provider-confirmed truth (unchanged). The provider's confirmed amount and currency must equal the intent's frozen amount and currency, or the event is fatal (never "close enough"). | existing adapter guards + MC-CI-08 |
| MC-INV-09 | A wallet holds one currency. Wallet moves are same-currency only. There is no cross-currency wallet transfer, auto-conversion or netting in this program. | MC-CI-10 |
| MC-INV-10 | The presentation base is NGN. Consolidated figures are computed in a read-only view from explicit, auditable reporting rates; they are never posted. | §4.6, MC-CI-01 |
| MC-INV-11 | Nothing here weakens an existing invariant: per-entry balance, immutability, idempotency, grant lockdown, A1/A2/A3, the refund cap, the receipt and credit-note ties. Every existing proof suite stays green at its CI position. | existing suites |

---

## 4. Ledger design

### 4.1 Books: one chart, per-currency columns (built)
The in-currency ledger (`journal_entries.currency`, per-entry balance) is the foundation and is not
re-litigated. A balance for `(account, currency)` is the only meaningful balance. The global
`ledger_reconciliation().accounts` list (`20260706120000:235-291`) is renamed
`accounts_single_currency_deprecated` in M1 and removed once the hub reader (§4.5) is per-currency;
`currencies[]` is the contract.

### 4.2 Chart additions
Two accounts, added in M1 so the chart is complete before any non-NGN entry can exist:

| Code | Type | Normal | Purpose |
|---|---|---|---|
| `fx_conversion_clearing` | liability | credit | The two single-currency legs of an **explicit** conversion event (a treasury conversion, or a provider that settles a different currency than it charged — §6.3). Each leg posts in its own currency; the account carries a debit balance in one currency and a credit balance in the other, which the reporting view closes at the realised rate. Unused in v1 (no conversion event is allowed in v1), present so the chart and the proofs are ready. |
| `fx_gain_loss` | expense | debit | Realised difference between a booking rate and a realised rate on an explicit conversion event. Gains post as credits. Unused in v1 for the same reason. |

Both are seeded via `LEDGER_ACCOUNTS` (`packages/payment-router/src/ledger.ts:48-64`) and the SQL
seed in lockstep (existing TS/SQL mirror discipline). No posting function may touch either account
until §6.3 is enabled (MC-CI-02 includes a "no v1 writer references these codes" proof).

### 4.3 Posting rules per money event (all in the event's currency)
| Event | Entry (currency = intent/wallet currency) | Change vs today |
|---|---|---|
| Charge settled, no fee known | DR `cash_settlement` gross / CR `payments_clearing` gross | none (built) |
| Charge settled, fee known | DR `cash_settlement` net, DR `processor_fees` fee-ex, DR `fee_vat_recoverable` fee-VAT (NGN statutory split, or **provider-reported only** otherwise), CR `payments_clearing` gross | none (built); §4.4 states what the foreign-currency `fee_vat_recoverable` balance means |
| Sale recognised | DR `payments_clearing` gross / CR `platform_revenue` ex-VAT, CR `vat_output_payable` output VAT | `post_sale_revenue` gains `p_currency` and asserts it equals the intent's currency when `p_source_event_id` is an intent id (M4) |
| Refund confirmed | DR `payments_clearing` / CR `cash_settlement` for the refund amount; proportional reversal of revenue + output VAT with the existing clamp math (currency-neutral) | postings tagged with the refund row's currency (M4) |
| Wallet top-up allocation | DR `payments_clearing` / CR `customer_wallet_liability` | NGN wallet: none; per-currency wallet: new writer (M7) |
| Withdrawal reserve / settle / release | as built (`buildWithdrawal*Lines`) | currency = the wallet's currency (M7) |

### 4.4 VAT in a multi-currency book
VAT attaches to the supply, not to the currency. Rules:
- **Output VAT** on a standard-rated supply paid in USD is carved from the USD gross with the same
  inclusive math (`carveInclusiveVat`) and posted to `vat_output_payable` **in USD**. The
  classification engine (`packages/config/tax.ts`) decides the treatment; currency is not an input to
  treatment. Whether a non-resident buyer's supply is an export (zero-rated) is an accountant
  decision (D-MC-05); until answered, foreign-currency sales default to the division's treatment —
  the platform never under-remits by default.
- **Fee VAT** on a foreign-currency processor fee is posted to `fee_vat_recoverable` in that currency
  **only when the provider itemises it** (built: `20260706120000:186`). Whether that VAT is Nigerian
  input VAT the entity can reclaim is also D-MC-05; the in-currency balance is the fact, the
  reclaim is a reporting decision.
- `vat_reconciliation(from, to)` returns **one row per currency** (`{currency, output_vat_collected_minor,
  input_vat_recoverable_minor, net_vat_payable_minor}`), never a single number (M1). The FIRS figure is
  the NGN row plus the reporting conversion of each foreign row at the rate the accountant specifies
  (§4.6). The hub monthly net-VAT table shows one block per currency.

### 4.5 Reconciliation readers
| Reader | Change (M1) |
|---|---|
| `payments_private.wallet_ledger_reconciliation()` | Returns `{wallets: [{currency, wallet_balance_total_minor, ledger_wallet_liability_minor, delta_minor, reconciled}]}`; NGN sums `customer_wallets` (currency `'NGN'`), other currencies sum `customer_currency_wallets` (§7); liability lines are joined to `journal_entries.currency`. The scalar NGN fields are kept one release for the FL2 soak scripts, then removed. |
| `payments_private.vat_reconciliation()` | Per-currency rows (§4.4). |
| `payments_private.ledger_reconciliation()` | `accounts` renamed as deprecated; `currencies[]` is the contract. |
| `apps/hub/lib/finance-ledger.ts` | Every fold groups by currency: `journal_lines` reads join `journal_entries(currency)`; `customer_wallets` reads carry `currency`; `payment_intents` stats group by `currency`. The console renders one block per currency and labels the presentation-base block "NGN"; it never shows a mixed total. The reconcile-trace SQL texts (`FINANCE_TRACE_SQL`) gain `GROUP BY currency`. |
| FL2 soak scripts and the owner's "balanced to zero" check | Read `currencies[]` and assert each currency independently (already the 07-05 design's intent). |

### 4.6 Reporting base and consolidation
- Presentation base: NGN (unchanged; `LEDGER_CURRENCY`).
- Reporting rates live in `public.fx_rate_snapshots` with `kind = 'reporting'` (§5.5), entered by
  finance (CBN reference rate or whatever the accountant specifies — D-MC-06), never fetched from
  the display-grade OER feed.
- `payments_private.ledger_consolidated(p_as_of timestamptz, p_rates jsonb)` is a read-only function:
  it takes the per-currency balances from `ledger_reconciliation().currencies[]`, multiplies each
  foreign balance by the supplied rate (numeric, exponent-aware), and returns NGN-equivalent figures
  **labelled as derived**, with the rate id per currency. It never writes. The hub console calls it
  only when the owner opens the consolidated tab; the default tab is per-currency.
- No translation adjustment is posted in v1. If the owner later wants a period-end revaluation
  (unrealised FX), that is a separate design on top of `fx_gain_loss`.

---

## 5. FX design — the one conversion seam

### 5.1 Where conversion is allowed
Exactly one server-only function converts money for a charge:

```
resolvePayerCharge({
  division, userPreference, countryCode,
  pricingCurrency, pricingAmountMinor,        // the NGN list price, in kobo
  now,
}) → { charge: { currency, amountMinor }, snapshot: FxChargeSnapshot } | { blocked: reason }
```
Inside: `resolvePayerCurrency` (built) → policy table lookup (§5.4) → rate fetch → freshness check
→ spread → exact integer conversion → floor check → persist snapshot → return. Every division rail
calls this and nothing else. The display path (approximate prices, wallet overlay) keeps using
`getExchangeRateSnapshot` with the `isApproximateDisplay` label and is forbidden from writing any
`*_minor` column (MC-CI-04 static guard).

### 5.2 Rate freshness
- A charge rate must have `fetchedAt` within `CHARGE_RATE_MAX_AGE_MS = 30 min` and must not be a
  fallback (`isFallback`) or stale (`isStale`). Otherwise `resolvePayerCharge` returns
  `blocked: "rate_unavailable"` and the surface offers NGN (the program spec's rule, now enforced in
  code rather than described). `computePayerChargeMinor` is retired as a charge entry point; it
  stays as the pure core with a new `spreadBps` parameter and integer math (§5.3).
- Quote TTL at the surface: the payer-currency amount shown is valid for 15 minutes
  (`CHARGE_QUOTE_TTL_MS`); a charge start after that re-resolves. The intent is created with the
  re-resolved amount and that amount is what the provider charges (hosted page), so the buyer sees
  the figure they pay. Bank-transfer rails that capture hours later still capture the frozen
  payer-currency amount; because settlement is in-currency there is no NGN exposure on the platform
  side until a treasury conversion, which is outside this program.

### 5.3 Rounding — integer-exact, never below the reference price
- The rate is stored as an integer `rate_e8` (rate × 10^8, rounded half-up once at fetch) and the
  spread as `spread_bps`. The effective rate is `rate_e8 × (10_000 + spread_bps) / 10_000` kept in
  integer arithmetic.
- `payerMinor = ceil( pricingMinor × rate_e8 × (10_000 + spread_bps) × 10^expPayer / (10^8 × 10_000 × 10^expPricing) )`
  computed with `BigInt`. Ceiling, not round: the payer never pays less than the reference price;
  the maximum overcharge is one minor unit of the payer currency. The snapshot records
  `pricingAmountMinor`, `payerAmountMinor`, `rate_e8`, `spread_bps` so the figure is reproducible.
- Per-currency floor: `CHARGE_FLOOR_MINOR[currency]` (e.g. USD 100 = $1.00, XOF 500) — below it the
  charge is blocked (`below_floor`), mirroring the rails' NGN ₦100 floor. Provider minimums are
  checked at the live settle test, not assumed.
- `buildCurrencySnapshot` (`currency-model.ts:217-219`) and `convertMinorUnits` (`exchange-rate.ts:154`)
  are corrected to convert through major units and the target exponent (the pattern already used by
  `wallet-currency.ts:57-58`) before any caller is wired; their display label stays approximate.

### 5.4 Spread and allowlist policy (DB truth, owner-flipped)
```
payments_private.charge_currency_policy (
  currency text primary key check (currency ~ '^[A-Z]{3}$'),
  enabled boolean not null default false,
  spread_bps int not null default 0 check (spread_bps between 0 and 1000),
  floor_minor bigint not null check (floor_minor >= 0),
  live_settle_test_ref text,          -- the owner's proof (intent id of the settle test)
  enabled_at timestamptz, enabled_by uuid,
  updated_at timestamptz not null default now()
)
```
- Seeded with `NGN enabled=true, spread 0, floor 10000`. Any other currency is inserted
  `enabled=false` by migration and flipped by the owner through a guarded RPC
  `set_charge_currency_enabled(currency, enabled, settle_test_ref)` (service-role; audit-logged).
- A BEFORE INSERT trigger on `payment_intents` rejects a currency that is not enabled
  (`payment_intents_currency_enabled`), and a CHECK enforces `^[A-Z]{3}$`. This closes N1: the
  intents route's accepted-code list stops mattering for money.
- The app reads the table (60-second cache) through `loadChargeCurrencyPolicy()` and passes the
  enabled set to `resolvePayerCurrency`; `parseChargeCurrencies` remains a pure helper for tests.
  There is no env var.

### 5.5 Snapshot persistence
```
public.fx_rate_snapshots (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('charge','reporting')),
  base_currency text not null, quote_currency text not null,   -- ^[A-Z]{3}$
  rate_e8 bigint not null check (rate_e8 > 0),
  spread_bps int not null default 0,
  source text not null,                 -- 'openexchangerates' | 'cbn' | 'manual:<who>'
  fetched_at timestamptz not null,
  created_at timestamptz not null default now()
)
```
Append-only (immutability trigger reused from the ledger pattern), service-role write via
`record_fx_rate_snapshot`, staff read. The intent's `metadata.currency_snapshot` stores
`{ pricingCurrency, pricingAmountMinor, payerCurrency, payerAmountMinor, rateSnapshotId, rate_e8,
spread_bps, fetchedAt, source, quotedAt }`. `freeze_intent_money_columns` is widened to raise when
`metadata->'currency_snapshot'` changes after it is first set, so the snapshot is as immutable as
the amount it explains.

### 5.6 Rate source (D-MC-04)
Display and charge quotes use OER today (`OPENRATE_APP_ID`). The design keeps one feed for the
charge quote; the recommendation is to confirm the plan allows commercial use at the needed
freshness, or to switch the charge quote to the acquiring provider's published rate so the company's
quote and the provider's economics do not drift. Reporting rates are manual (`kind='reporting'`).

---

## 6. Provider design

### 6.1 Currency capability joins the routing rule
`PROVIDER_CURRENCIES: Record<PaymentProviderKey, readonly ISO4217[]>` in
`packages/payment-router/src/routing/currency-matrix.ts`, and `eligibleProviders` (`router.ts:88-91`)
adds `providerSupportsCurrency(key, query.currency)` to the intersection. The table is data and
starts conservative: `paystack: ["NGN"]`, `flutterwave: ["NGN"]`, `stripe: []`, `mock: all`. A
currency is appended to a provider's row only after the owner's live settle test on that provider
(§6.4), in the same change that flips `charge_currency_policy.enabled`. Routing for a currency no
registered provider supports resolves to the A5 manual-fallback path exactly as an unknown country
does today.

### 6.2 Routing country
The rails pass the merchant's acquiring country (`country: "NG"`), not the payer's. That stays: a
USD charge from a visitor is acquired by the NG providers that support USD. Payer-country routing
arrives with Stripe (V3-14, D1) and is out of scope here. `country-defaults.ts` is untouched.

### 6.3 Settlement currency must equal charge currency (v1)
A currency is enabled on a provider only if that provider holds a balance in it and settles it
in-currency. If a provider auto-converts (charges USD, settles NGN), then for that provider and
currency the in-currency posting would record USD cash that never arrives and the Flutterwave fee
identity (`flutterwave-provider.ts:236-260`) would compute garbage. Such a pairing is **not enabled
in v1**. The explicit "charge-then-convert" model (two single-currency legs through
`fx_conversion_clearing` using the provider's settlement report as the realised rate) is designed
in §4.2 but has no writer in v1; it is a separate pass gated on D-MC-02.

### 6.4 The live settle test per (provider, currency) — the owner's oracle
Before a currency is enabled anywhere:
1. `getBalance({ currency })` on the provider → `B0` (Paystack `/balance`, Flutterwave `/balances`
   — both built and currency-keyed).
2. One real charge in that currency on a test division (studio first), through the full rail.
3. Verify and webhook both pass the adapter's amount+currency match against the intent.
4. `ledger_reconciliation().currencies[X]` shows `cash_settlement` = net, `payments_clearing` = gross,
   balanced; the NGN column is unchanged byte-for-byte.
5. `getBalance({ currency })` → `B1`; `B1 − B0` equals the provider-reported net (gross − fee) in
   that currency. If the balance did not move in that currency, the provider converted — stop.
6. One refund of that charge; `refund.processed` arrives; the refund posting and credit note are
   in-currency; `B2 − B1` equals the refund.
7. Only then: `set_charge_currency_enabled(X, true, <intent id>)` and the provider row.
This is an owner gate, not CI. CI proves the code paths on synthetic data (§10).

### 6.5 Fees
- `feeMinor`/`feeVatMinor` are read in the charge currency (built in both adapters).
- NGN: statutory split when not itemised (built). Any other currency: provider-reported VAT only;
  no fabricated split (built). §4.4 states the meaning of the resulting balance.
- Payout fees (transfers) follow the same rule in the wallet currency (§7).

### 6.6 Units
Paystack takes minor units verbatim (`:136`); Flutterwave takes major units through the exponent
(`:192`, `:533`) and converts back with `majorToMinor` (`:667-669`). Both reject a code outside
`CURRENCY_MAP` before any math. The adapter test suites gain one case per currency in
`PROVIDER_CURRENCIES` (USD, and XOF as the 0-decimal canary) on initiate, verify, refund and
transfer. `CURRENCY_MAP` (`packages/i18n/currency.ts:13-29`) is the single exponent source; adding a
currency anywhere else first is a build error by construction (`normalizeCurrency` fails closed).

---

## 7. Wallet design

### 7.1 v1: wallets stay NGN, and a non-NGN charge can never touch one
- `customer_wallets` is one row per user (`UNIQUE (user_id)`, prod `:6213`), read by every wallet
  surface with `.maybeSingle()` (`apps/account/lib/account-data.ts:199-207`,
  `packages/dashboard-modules-wallet/src/data.ts`, the AI metering RPCs
  `20260627120000:166-167`, the studio wallet checkout). Dropping the unique constraint would put
  every one of those readers at risk. **It is not dropped.**
- A non-NGN intent can never credit it: `credit_wallet_topup` rejects non-NGN (built), the reconciler
  flags `currency_mismatch` (built), and after M1 the allowlist trigger means a non-NGN intent only
  exists for a currency the owner has enabled — and the wallet top-up initiator (`topup/init`) keeps
  writing `currency: "NGN"` and is additionally guarded so a wallet-funding intent must be NGN until
  §7.2 ships (MC-CI-10).

### 7.2 Per-currency wallets as separate tables (M7)
```
public.customer_currency_wallets (
  id uuid pk, user_id uuid not null references auth.users(id),
  currency text not null check (currency ~ '^[A-Z]{3}$' and currency <> 'NGN'),
  balance_minor bigint not null default 0 check (balance_minor >= 0),
  is_active boolean not null default true, frozen_at timestamptz, frozen_reason text,
  created_at, updated_at,
  unique (user_id, currency)
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
Why separate tables rather than widening `customer_wallets`: zero regression surface for every NGN
reader, the kobo-named columns keep meaning kobo, and the two tables can converge later behind a
view once every reader is currency-aware. RLS: owner-read, deny-all write; grants locked like the
money tables (`sec_harden_08` pattern). Idempotency: partial unique indexes on
`(reference_type, reference_id)` for `wallet_topup`, `wallet_refund_hold`, `wallet_refund_release`
exactly as `customer_wallet_transactions` has.

Writers (all `payments_private`, service-role, mirrors of the NGN ones with a `p_currency` and a
`(user_id, currency)` wallet lookup): `credit_currency_wallet_topup`, `hold_currency_wallet_refund`
(inside `initiate_payment_refund` when the intent is a non-NGN rail top-up),
`release_currency_wallet_refund`, `reserve_currency_withdrawal`,
`post_currency_withdrawal_settlement`, `release_currency_withdrawal`. Each posts its ledger entry in
the wallet currency under the same source names as the NGN RPCs (the `(source, source_event_id)`
unique key already prevents a double post across the two families because the event ids are the
same request/refund ids).

Readers: a new wallet surface section per currency (balance, statement) in `apps/account`; the
existing NGN surfaces are untouched. The home widget shows the NGN balance plus one line per
non-NGN wallet. Withdrawals from a currency wallet are in that currency only.

### 7.3 Withdrawal limits and payouts per currency
- `DEFAULT_WITHDRAWAL_LIMITS` gains a row per enabled currency with `minMinor`, `maxSingleMinor`,
  `dailyCapMinor` in that currency's minor units (owner sets the figures, D-MC-07). No
  cross-currency aggregation of the daily cap in v1 (one cap per currency); an AML aggregate across
  currencies is a reporting-rate computation for the risk layer, not a money gate.
- The payout rail's non-NGN branch (`wallet-payout.ts:145`) is widened only for currencies the
  transfer provider supports with in-currency balances; `createTransfer` already carries
  `currency`. Account resolution/name match stays mandatory. International bank details (IBAN,
  SWIFT, routing) are a payout-method schema change and belong to V3-69; v1 non-NGN payouts are
  limited to destinations the current `account_number + bank_code` shape can address.

### 7.4 What is explicitly not built
No in-app conversion between a user's wallets, no "hold USD, withdraw NGN", no netting of a USD
refund against an NGN wallet. Each of those is a conversion event with a spread and a treasury
position; they are a separate design on `fx_conversion_clearing` (§4.2) gated on D-MC-07.

---

## 8. Refund and credit-note design

### 8.1 Always the charge currency, never re-converted
- `payment_refunds.currency` CHECK widens to ISO-4217; a BEFORE INSERT/UPDATE trigger asserts
  `currency = (select currency from payment_intents where id = intent_id)`.
- `initiate_payment_refund`: drop the `non_base_currency` branch (`:259`); write `v_intent.currency`
  into the row; the wallet-hold branch runs against the NGN wallet when the intent is NGN and
  against the currency wallet (§7.2) otherwise — and until §7.2 ships it returns
  `wallet_currency_unsupported` for a non-NGN rail top-up (which M1 already prevents from existing).
- `apply_refund_webhook`: every `post_ledger_entry` call uses `v_row.currency` (`:536`, `:606`);
  the proportional VAT/revenue reversal math is unchanged (it is currency-neutral; the `sale_revenue`
  entry it reverses is in the same currency by MC-INV-02).
- `fail_payment_refund`: the release posting (`:416`) uses the row's currency.
- The provider is asked to refund `amountMinor` in the intent's currency — the adapters already
  carry the exponent (Flutterwave `:533`-style path on `refund`; Paystack minor verbatim). The
  refund webhook amount parse is already exponent-aware per adapter; `apply_refund_webhook`'s
  `amount_mismatch` guard compares minor units of the same currency by construction.

### 8.2 Refund fees and provider-side FX
Providers refund the charged amount in the charge currency from the in-currency balance; the
absorbed processor fee is not returned (built assumption, unchanged). Because v1 enables only
in-currency settlement (§6.3), no provider-side conversion can occur on a refund.

### 8.3 Credit notes
`customer_credit_notes.currency` CHECK widens to ISO-4217; `record_customer_credit_note` asserts
`p_currency = (select currency from journal_entries where id = p_posting_id)` and that this equals
the refund row's currency. Numbering stays one `HO-CRN-YYYY-NNNNNN` sequence.

### 8.4 Sequencing (the rule that prevents stranded money)
A currency's `charge_currency_policy.enabled` may only be flipped when the refund and credit-note
proofs for a non-NGN currency are green in CI (MC-CI-05/06) **and** the live settle test's refund
step (§6.4 step 6) passed. The orphan alarm for a provider-dashboard refund with no in-flight row
(`webhooks/[provider]/route.ts:181-193`) stays and gains the intent currency in its payload.

---

## 9. Receipt design

### 9.1 In-currency documents
- `customer_receipts.currency` CHECK widens to ISO-4217; `record_customer_receipt` asserts
  `p_currency = (select currency from journal_entries where id = p_posting_id)` and inserts that
  value (replacing the literal at `:193`). The existing ties stay: posting must be the charge
  settlement for the intent; total = posting debit total (now in the posting currency).
- `buildReceiptProps` / `buildCreditNoteProps` accept any supported currency; the
  `currency_not_base` reason is retired; `splitDocumentMoney` is currency-neutral already (integer
  minor units) and gets a currency parameter only to label the split.
- The document prints every amount in the charge currency with the correct exponent (§9.2). An
  informational NGN-equivalent line (rate, source, date, from the charge snapshot) is printed only if
  the accountant requires it for NRS e-invoicing (D-MC-08); it never changes any total.
- VAT line: "VAT (7.5%)" in the charge currency for a standard supply, classification note otherwise
  — unchanged logic, currency-labelled.
- Numbering stays one `HO-RCT-YYYY-NNNNNN` sequence.

### 9.2 Exponent-correct rendering everywhere
- `packages/branded-documents/src/format.ts` `formatKobo` becomes `formatMinor(amountMinor, currency)`
  using `getCurrencyMinorUnit`; the NGN fast path stays. All callers that pass a non-NGN currency
  already pass it explicitly.
- `PaymentCallbackClient.tsx:117-119` formats through `formatMoney(amountMinor, currency)` from
  `@henryco/i18n` (exponent-aware).
- Money emails: the subject and body helpers take `(amountMinor, currency)` and format through
  `formatMoney`; the `NGN ` literal leaves every locale string (copy modules updated across the
  12 locales per the i18n rule); the refund email call (`:171`) passes the refund row's minor amount
  and currency rather than `/ 100`. The money-email matrix gains a row per new transition
  (currency-wallet credited, currency withdrawal requested/paid).
- Wallet statements and transaction-history PDFs keep reading NGN tables only until a per-currency
  statement exists; they never union the two wallet families.

---

## 10. Invariants as CI rules

All SQL proofs run in the existing `Payments money-RPC grant invariant` job
(`.github/workflows/ci.yml`), appended after the current last money step (`payout_ledger_invariants.sql`,
`:242-249`) so they see the full chain on the same fresh PG 17. Static guards run in the
`Lint, typecheck, test, build` job next to `care-money:check`. Each rule states its red condition.

| Rule | Mechanism | Red when |
|---|---|---|
| MC-CI-01 **no cross-currency sum** | (a) `apps/hub/supabase/tests/multicurrency_readers_invariants.sql`: seed NGN + USD + XOF entries and wallets; assert `ledger_reconciliation().currencies[]`, `wallet_ledger_reconciliation().wallets[]`, `vat_reconciliation()` rows are per-currency with the exact seeded figures and that no scalar in any result equals the mixed sum. (b) `scripts/ci/currency-sum-guard.mjs`: scans `apps/hub/supabase/migrations/*.sql`, `apps/*/lib/**/*.ts`, `packages/{payment-router,pricing,dashboard-modules-wallet}/src/**/*.ts` for `sum(`/`.reduce(` over `debit_minor|credit_minor|amount_minor|balance_kobo|balance_minor|amount_kobo` and requires a currency token (`currency`, `GROUP BY currency`, `je.currency`, `.eq("currency"`) within 12 lines, with a dated allowlist file for the legacy NGN-only readers that is only allowed to shrink. | any per-currency row missing or any mixed scalar; any new unqualified aggregate |
| MC-CI-02 **posting currency = event currency** | `multicurrency_posting_invariants.sql`: a USD intent → `post_charge_settlement` entry is USD; `post_sale_revenue(..., 'USD')` entry is USD and `post_sale_revenue(intent, ..., 'NGN')` for a USD intent raises; `initiate` + `apply_refund_webhook` on a USD intent post USD; `reserve/settle/release` on a USD currency wallet post USD; no `payments_private` function body contains the literal `'NGN'` except an allowlist (`post_charge_settlement` statutory branch, the NGN-wallet family) — checked with `pg_get_functiondef` on the fresh DB; no v1 function body references `fx_conversion_clearing` or `fx_gain_loss`. | any wrong tag, any raise missing, any non-allowlisted literal |
| MC-CI-03 **charge needs a fresh, real rate** | `packages/pricing/src/__tests__/payer-charge.test.ts`: `resolvePayerCharge` returns `blocked` for `isFallback`, `isStale`, `fetchedAt` older than 30 min, missing rate, unknown exponent; returns the exact `BigInt` ceiling figure for a fixture table (NGN→USD, NGN→XOF, NGN→GHS with spread 0/150 bps); the snapshot it returns reproduces the figure. | any blocked case passes; any fixture figure differs by one minor unit |
| MC-CI-04 **exponent-correct, no blanket ×100** | (a) unit tests: `formatMinor`/`formatMoney`/callback formatting for USD and XOF; `buildCurrencySnapshot` and `convertMinorUnits` NGN→XOF. (b) `scripts/ci/exponent-guard.mjs`: in money-touching files (same scope as MC-CI-01) any `/ 100`, `* 100`, `/100`, `*100` on an identifier matching `minor|kobo|cents|amount` must be inside a function whose currency is statically `"NGN"` (named `*Naira*`, `*Kobo*`, or guarded by a `=== "NGN"` check within 6 lines), else the file must be in the shrinking allowlist. | any new unguarded scale; any XOF fixture off by 100× |
| MC-CI-05 **refund in charge currency, ≤ captured** | extends `refunds_invariants.sql` with a USD cycle: full refund, two partials with proportional VAT reversal, over-refund rejected, `refund.failed` revert, replay dedup; the row's currency trigger rejects a refund row whose currency differs from its intent. | any step posts NGN, any cap breach, any replay double-posts |
| MC-CI-06 **document currency = posting currency** | extends `payment_documents_invariants.sql` and the credit-note proofs: a receipt for a USD posting records USD; a receipt whose `p_currency` differs from the posting raises; a credit note likewise; `prove:receipts` renders a USD and an XOF receipt with the right symbols and decimals and the issuer triad. | any mismatch accepted; any render shows `/100` artefacts |
| MC-CI-07 **one allowlist, enforced by the DB** | `charge_currency_policy_invariants.sql`: inserting a `payment_intents` row in a disabled currency raises; enabling via the RPC requires a `settle_test_ref`; `anon`/`authenticated` cannot execute the RPC or read the table; the app loader test asserts `resolvePayerCurrency` receives the table's enabled set and no env var is read (grep guard: `CHARGE_CURRENCIES` must not appear in `apps/` or `packages/` outside tests/docs). | any disabled-currency insert succeeds; any grant leak; any env read |
| MC-CI-08 **reconcile matches the frozen figure** | unit tests on each rail's reconcile: a USD intent is settled only when `intent.amount_minor === record.charged_amount_minor && intent.currency === record.charged_currency`; a rate change between quote and return changes nothing; `freeze_intent_money_columns` rejects a `currency_snapshot` rewrite (SQL proof). | any settle on a mismatch; any snapshot rewrite accepted |
| MC-CI-09 **provider currency capability** | `select-provider.test.ts`: a currency outside `PROVIDER_CURRENCIES[key]` makes the provider ineligible; `route` returns `no_suitable_provider` when no registered provider supports the currency; adapter fixture tests for each enabled currency (initiate/verify/refund/transfer; XOF canary). | any route to an unsupported provider |
| MC-CI-10 **wallet currency isolation** | `currency_wallet_invariants.sql`: NGN RPCs still reject non-NGN; currency RPCs reject a currency that does not match the wallet row; `wallet_ledger_reconciliation().wallets[]` reconciles per currency after top-up, hold, release, reserve, settle; a non-NGN rail top-up initiation is refused before M7. | any cross-currency wallet move; any per-currency delta ≠ 0 |
| MC-CI-11 **grants** | every new `payments_private` function and the two new tables are added to `ledger_grant_invariant.sql` / `refunds_grant_invariant.sql` style lists (anon/authenticated EXECUTE false, service_role true; no USAGE on the schema; no request-role DML on the tables). | any leak |
| MC-CI-12 **nothing regressed** | all existing suites unchanged at their positions; `multicurrency_ledger_invariants.sql` (mc1–mc6) stays green; `@henryco/payment-router` and `@henryco/pricing` tests green. | any red |

Not a CI rule, by design: the live settle test (§6.4). CI proves code on synthetic data; only the
owner can prove a provider settles a currency in-currency.

---

## 11. Build plan — ordered by money risk

Order principle: every step that can only **lose** money if skipped comes before any step that lets
money move in a new currency. Each step is additive and independently shippable; each ends with a
gate. "Risk class" is what the step prevents.

| Step | Scope | Risk class prevented | Gate |
|---|---|---|---|
| **M0 — Verify prod state** | Confirm (read-only introspection, same method as SCHEMA-TRUTH-01) whether `20260706120000` and `20260706130000` are applied; if not, apply dry-run-first on the shadow then prod. Record in `docs/v3/fl2-apply-manifest.md`. | Books silent on a non-NGN charge (pre-MC `post_charge_settlement` skip) | manifest row + `ledger_reconciliation().currencies[]` present on prod |
| **M1 — Readers and the lock** (no money moves) | `charge_currency_policy` table + trigger + RPC (§5.4); `payment_intents` ISO CHECK; `wallet_ledger_reconciliation` / `vat_reconciliation` per-currency; `ledger_reconciliation.accounts` deprecated; hub finance reader per-currency; chart gains `fx_conversion_clearing`, `fx_gain_loss` (no writers); `currency-sum-guard` + `exponent-guard` with allowlists; email/doc formatters exponent-aware (N11, N12 at the formatting layer only). | Mixed-currency figures; an unplanned non-NGN intent | MC-CI-01, 04, 07, 11 green; FL2 soak check reads `currencies[]` |
| **M2 — FX seam** | `resolvePayerCharge`, integer rounding, freshness, spread, floor; `fx_rate_snapshots` + `record_fx_rate_snapshot`; snapshot freeze in `freeze_intent_money_columns`; fix `buildCurrencySnapshot` / `convertMinorUnits`. No caller wired. | Stale/fallback-rate charges; float drift; 100× display mis-scale | MC-CI-03, 04, 08 (SQL half) green |
| **M3 — Provider capability** | `PROVIDER_CURRENCIES` + `providerSupportsCurrency` in routing; per-currency adapter fixtures; settle-test runbook script (`scripts/money/live-settle-test.mjs`: balance before/after, verify match, ledger column check, refund step). | Routing a currency to a provider that converts or rejects | MC-CI-09 green; runbook dry-runs against the mock provider |
| **M4 — Refund + credit-note legs widened** | N6, N7, N8; `post_sale_revenue(p_currency)`; refund row currency trigger; USD proof cycle. | Unrefundable foreign charges; orphaned provider refunds; wrong-currency reversals | MC-CI-02, 05 green |
| **M5 — Receipt leg widened** | N9, N10; `record_customer_receipt` currency tie; renderers and `prove:receipts` with USD/XOF; email copy modules across locales; money-email matrix rows. | A receipt that cannot be issued or prints wrong decimals | MC-CI-06 green; `i18n:check:strict`, `tone:check` green |
| **M6 — Rail wiring, dark** | Studio first, then care, marketplace: each rail calls `resolvePayerCharge`, writes `charged_currency` + `charged_amount_minor` on its own record, creates the intent in the payer currency with the snapshot, routes with the currency, and reconciles on the frozen figure (`decideSaleReconcile` compares the record's charged figure). `wallet-funding` intents stay NGN. All behind `charge_currency_policy` (nothing enabled). | Double conversion at reconcile; rate-move stranding | MC-CI-08 green; NGN path byte-identical (existing rail tests) |
| **G3 — Owner gate: first currency** | §6.4 on studio with the first currency (D-MC-01); flip `enabled` + provider row for that currency only. | — | settle test passed incl. refund |
| **M7 — Per-currency wallets + payouts** | §7.2 tables + writers; wallet surfaces; limits rows; payout branch; refund holds for currency top-ups. Flag-dark per currency behind the same policy row (`wallet_enabled` column added in this step). | Cross-currency wallet moves; overdraw in a second currency | MC-CI-10 green; owner payout test in that currency |
| **M8 — Reporting** | `ledger_consolidated` view-function; reporting-rate entry UI for finance; hub consolidated tab; per-currency VAT block for filing. | Posted FX; mis-stated VAT return | MC-CI-01 (derived figures labelled; no writes) |
| **Later, separate designs** | Charge-then-convert for auto-converting providers (§6.3); period-end revaluation; in-app wallet FX; payer-country routing with Stripe (V3-14); international payout details (V3-69); AI metering currency (program spec M4). | — | each needs its own owner decision |

Rollout per currency after M6: `NGN` (live) → first currency (D-MC-01) → next, one at a time, each
through G3. Studio first (signed-in, lowest blast radius), then marketplace, care, learn — the
program spec's order.

---

## 12. Owner decisions (surfaced; each blocks the gate named)

| Id | Decision | Recommendation | Blocks |
|---|---|---|---|
| D-MC-01 | First non-NGN currency | USD (both providers list it; most display demand) | G3 |
| D-MC-02 | Per (provider, currency): confirm on the live account that the provider holds a balance in that currency and settles in-currency (not auto-converted to NGN). | Run §6.4 steps 1 and 5 before anything else; a provider that converts is excluded from that currency in v1 | M3 table rows, G3 |
| D-MC-03 | Spread (`spread_bps`) per currency, and the per-currency charge floor | 150 bps to cover rate drift between quote and capture and the provider's cross-currency cost; floors USD 100, GBP 100, EUR 100, GHS 500, KES 10000, XOF 500 (minor units) — confirm with the accountant | M2 config, G3 |
| D-MC-04 | Charge-quote rate source: OER (current) vs the acquiring provider's published rate | Keep OER for the quote; verify plan terms for commercial use and freshness; revisit if the provider's rate diverges beyond the spread | M2 |
| D-MC-05 | VAT treatment of foreign-currency supplies (resident vs non-resident buyer; export zero-rating) and whether foreign-currency processor-fee VAT is reclaimable | Accountant answer; default until then: division treatment applies regardless of currency; fee VAT recorded in-currency, reclaim decided at filing | M4 (posting rule), M8 |
| D-MC-06 | Reporting rate source and convention for the VAT return and consolidated figures (CBN reference at transaction date vs period average) | CBN reference rate at month end for consolidation; transaction-date rate for the VAT return if the accountant requires it; both entered as `kind='reporting'` snapshots | M8 |
| D-MC-07 | Scope of per-currency wallets: offer them at all in this program; which currencies; withdrawal limits per currency; whether a currency wallet can be withdrawn to a bank | Yes for the enabled charge currencies only, same-currency withdrawal only, limits mirrored from NGN at the reporting rate and rounded to clean figures | M7 |
| D-MC-08 | Whether receipts for foreign-currency supplies must print the NGN equivalent and rate for NRS e-invoicing | Accountant answer; design supports an informational line either way | M5 |
| D-MC-09 | Confirm M0 (apply the two July migrations to prod if not applied) is the owner's own apply, dry-run-first, like FL2 | Yes | M0 |
| D-MC-10 | Confirm that provider auto-conversion (charge USD, settle NGN) stays out of scope for v1 and gets its own pass | Yes | §6.3 |

---

## 13. Hazard register — the paths this design closes

| Hazard | Where it would bite | Closed by |
|---|---|---|
| Rounding leakage at the charge quote (float `Math.round` on major units; sub-unit under-charge) | `currency-model.ts:436-438` | §5.3 integer ceiling; MC-CI-03 fixtures |
| Rounding leakage in partial refunds | currency-neutral clamp math already exact in minor units (`20260611130000:581-590`) | unchanged; MC-CI-05 USD cycle re-proves it |
| Rate-move arbitrage: pay later at an old quote | quote TTL; frozen amount per intent; in-currency settlement means no NGN exposure on the platform | §5.2; MC-CI-08 |
| Rate-move arbitrage via refunds | refund at today's rate in another currency | §8.1 (charge currency, charged figure, never re-converted) |
| Rate-move arbitrage via wallets (top up USD, withdraw NGN) | no cross-currency wallet moves | §7.4; MC-CI-10 |
| Double conversion at reconcile | re-deriving the expected amount from the NGN record at a fresh rate | §5.1 frozen figure on the division record; MC-CI-08 |
| Double conversion in display → written as money | `buildCurrencySnapshot` minor-unit scaling; `convertMinorUnits` | §5.3 fixes; MC-CI-04 static guard |
| Refund loss: foreign charge unrefundable, provider dashboard refund orphaned | `initiate_payment_refund:259`; orphan ack path | §8, §8.4 sequencing; MC-CI-05 |
| Unit mix-up: 0-decimal currency through `/100` | `format.ts:12`, callback `:117`, email `:171` | §9.2; MC-CI-04 |
| Unit mix-up: wallet limits in the wrong exponent | `withdrawal-limits.ts:31-37` rows added per currency | §7.3; per-row unit test |
| Mixed-currency books: readers summing across currencies | §1.2/§1.3 rows marked "no currency predicate" | §4.5; MC-CI-01 |
| Phantom cash: provider converts, ledger posts the charge currency | Flutterwave fee identity; in-currency posting | §6.3/§6.4 oracle; D-MC-02 |
| Unplanned non-NGN intent today | `intents/route.ts:42` accepts any supported code; no allowlist in a running path | §5.4 DB trigger; MC-CI-07 |
| Foreign fee VAT mistaken for Nigerian input VAT in the return | `vat_reconciliation` global sum labelled NGN | §4.4 per-currency rows; D-MC-05 |
| Posting FX | a conversion inside a posting or a consolidated figure written back | §4.6 read-only function; MC-CI-02 (no v1 writer touches the FX accounts) |

---

## 14. Test and rollout summary

- CI: the rules in §10, appended to the existing money job, with the existing proofs untouched.
- Local: `pnpm --filter @henryco/payment-router test`, `pnpm --filter @henryco/pricing test`,
  `pnpm --filter @henryco/account run prove:receipts`, the two static guards, `i18n:check:strict`,
  `tone:check`.
- Prod: the owner's "I prove, you settle" discipline — every migration dry-run-first on the shadow,
  every currency through §6.4, NGN never at risk at any step.
