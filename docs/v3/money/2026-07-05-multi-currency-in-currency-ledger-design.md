# Multi-currency, in-currency ledger — design (V3-MONEY-MC-LEDGER)

**Status:** DESIGN, approved by the owner ("clean recommendation", full in-currency ledger).
Not yet built. Money-critical; every stage is behind `CHARGE_CURRENCIES` (empty = NGN-only,
inert) and gated on a per-currency live settle test the owner runs before enabling a currency.

**Owner framing (binding):** Henry Onyx is a **global** company, not Nigeria-only. The books
are **multi-currency-first**, not "NGN with foreign exceptions". Providers settle the merchant
**in the charge currency** (domiciliary / multi-currency balances), so the ledger posts in that
currency; FX appears only at **reporting/consolidation**, never inside a posting.

---

## 1. The principle

Every journal entry stays in **one currency**, and its lines balance in that currency. The
books become a set of per-currency ledgers that never touch each other. NGN is unchanged;
USD (or any enabled currency) lives in its own balanced column. `DR = CR` is never asked to
police an exchange rate — the one thing it cannot catch.

Why this is safe by construction: the per-entry balance trigger only ever sums ONE entry's
lines, and one entry is one currency, so per-currency aggregate balance falls out for free.
The entire corruption surface collapses to a single rule — **never sum minor units across
currencies** — which lives in exactly one function (`ledger_reconciliation`).

## 2. What exists today (grounded)

- `public.journal_entries` has a **hard `CHECK (currency = 'NGN')`**
  (`20260607120000_double_entry_ledger.sql`, constraint `journal_entries_currency_base`).
- `payments_private.post_ledger_entry` **rejects any non-NGN** currency and hard-codes `'NGN'`
  on insert.
- The deferred **balance trigger** `assert_entry_balanced` is currency-agnostic (sums
  `debit_minor` vs `credit_minor` for one entry) — correct for multi-currency untouched.
- `ledger_reconciliation` sums **globally and per-account across all rows** — this is the ONE
  place that would add USD cents to NGN kobo and produce garbage per-account balances. The
  global `balanced` flag survives (each entry balances), but per-account balances corrupt.
- `post_charge_settlement` reads `amount_minor, currency` off the intent and **skips non-NGN**
  (`non_base_currency`). The Nigerian **fee-VAT statutory split (7.5%)** is NGN-specific.
- Wallets are NGN-only (`credit_wallet_topup` rejects non-NGN) — they stay NGN in this design.

## 3. Design decisions

### 3.1 Chart of accounts — shared codes, currency on the entry
Keep the existing account codes (`cash_settlement`, `payments_clearing`, `processor_fees`,
…) and let `journal_entries.currency` scope them. **Not** per-currency codes (`cash_settlement_usd`):
those still force every balance query to group by currency, so they add proliferation without
removing the real requirement. One chart, currency-tagged entries, per-currency aggregation.

### 3.2 Schema (additive migration)
- Drop `journal_entries_currency_base` (`currency = 'NGN'`); replace with a check that
  `currency` is a valid uppercase ISO-4217 code (`~ '^[A-Z]{3}$'`). Existing NGN rows pass;
  nothing is rewritten.
- The balance trigger and immutability/no-truncate triggers are untouched.

### 3.3 `post_ledger_entry`
Accept any valid ISO-4217 currency instead of rejecting non-NGN; tag the entry with it; keep
every other guard (≥2 one-sided lines, balanced, positive, idempotent on `source_event_id`).

### 3.4 `post_charge_settlement`
Post the settlement in the intent's **own** currency (remove the `<> 'NGN'` skip). The Nigerian
7.5% fee-VAT decomposition applies **only when currency = NGN**; a foreign processor fee posts
to `processor_fees` in that currency (plus a provider-reported fee-VAT if the provider itemizes
it), never a fabricated Nigerian split. `v_cash = v_amount - v_fee`, all in the entry currency.

### 3.5 Reconciliation — the corruption surface
`ledger_reconciliation` returns **per-currency** totals and per-`(account, currency)` balances,
never a single cross-currency sum. An NGN-only database returns numbers identical to today. The
FL2 soak gate checks each currency balances to zero **independently**. Shape:
```
{ currencies: [ { currency, total_debit_minor, total_credit_minor, delta_minor, balanced,
                  accounts: [ {code, type, normal_balance, debit_minor, credit_minor, balance_minor} ] } ] }
```
Any downstream query that sums `debit_minor`/`credit_minor` MUST carry a `currency` filter or a
`GROUP BY currency`. This is the single invariant tests must protect.

### 3.6 Rail wiring (M1b — studio, care, marketplace)
Behind the `CHARGE_CURRENCIES` allowlist (empty by default = NGN-only, inert):
- Resolve the payer currency (`resolvePayerCurrency`), compute the payer charge
  (`computePayerChargeMinor`, already shipped in #404).
- Write the intent with `amount_minor`/`currency` in the **payer** currency; freeze the FX
  snapshot into `metadata.currency_snapshot` (`buildCurrencySnapshot`).
- Route the provider in that currency (`router.route({ amountMinor, currency, country })` — the
  router + Flutterwave/Paystack providers are already ISO-4217-generic).
- NGN payers are byte-for-byte unchanged.

### 3.7 Reconcile-on-return
Match the intent's **own frozen** currency + `amount_minor` (recomputed from the frozen
snapshot), never a fresh live-rate lookup — so a rate that moved between charge and return can
never strand a paid order. (studio `card-rail.ts` / care `card-rail.ts` reconcile compare.)

## 4. Reporting base — global reframing (owner decision captured)

The company is global. Two consumers of "one number across currencies":
1. **Operational reconciliation** (does each currency balance to zero?) → per-currency, no FX.
2. **Consolidated reporting** (total revenue in one presentation currency) → convert each
   currency's balance at a period rate, in a **reporting view**, never in a posting.

Decision: keep NGN as the **reporting/presentation base** for now (the entity files NGN VAT),
with consolidated figures computed in a reporting view via `convertMinorUnits`. The books
themselves are currency-neutral. Revisit the presentation base when a second market goes
revenue-live.

## 5. Deferred (YAGNI until a currency is revenue-live)

- Foreign **revenue** allocation + foreign output-VAT (settlement cash→clearing is in scope;
  revenue recognition stays as-is / NGN-only for direct sales).
- Multi-currency **wallets** (wallets stay NGN-only).
- FX **consolidation reporting** view (built when a second currency is enabled).
- FX **gain/loss** account (only needed if a booking rate ever differs from a settlement rate;
  in-currency settlement avoids intra-entry FX, so not needed at v1).

## 6. Test plan (the invariant is not `DR = CR` — it must be tested)

TS mirror (`packages/payment-router/src/ledger.ts`) + SQL invariants
(`apps/hub/supabase/tests/`):
- a USD entry balances and posts;
- NGN + USD entries coexist and reconcile **independently** (per-currency delta 0 each);
- the NGN path is byte-identical to today (same numbers, same accounts);
- a foreign fee gets **no** Nigerian VAT split; a provider-reported fee-VAT is honoured;
- `ledger_reconciliation` never returns a cross-currency total (a mixed set yields per-currency
  rows, and a deliberately-crafted "sum-across" assertion FAILS the test if reintroduced);
- reconcile-on-return matches the frozen figure, not a live rate.

## 7. Rollout + safety

1. Land the schema + RPC + reconciliation migration (additive; inert — no non-NGN entry can be
   posted until a currency is enabled). Applied to prod dry-run-first (owner's "I prove, you
   settle" discipline).
2. Land M1b rail wiring behind `CHARGE_CURRENCIES` (empty). Still inert.
3. Owner adds ONE currency to `CHARGE_CURRENCIES` and runs a **live settle test** for it
   (charge → provider settles in-currency → webhook → per-currency ledger posts → reconciliation
   balances that currency to zero). Only then is that currency live.
4. Repeat per currency. NGN is never at risk at any step.

## 8. Open questions for the owner before build

- Confirm providers settle **in-currency** for the first target currency (the design assumes
  this; if a provider auto-converts to NGN for some currencies, that currency instead uses the
  simpler "book NGN base" path — the two can coexist per-currency).
- First target currency to enable (USD? GHS?) — drives the first live settle test.
