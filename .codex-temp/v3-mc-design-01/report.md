# V3-MC-DESIGN-01 — multi-currency architecture draft (ledger · FX · provider · wallet · refund · receipt)

**Owner:** autonomous agent (Claude), max effort
**Date:** 2026-10-01
**Branch:** `claude/nice-gates-vxqjay` off `origin/main@b1efffe`
**Deliverable:** `docs/v3/money/2026-10-01-multi-currency-architecture-design.md` (committed) + this report (force-added; `.codex-temp/` is gitignored)
**Prod DDL performed:** none. **Code changed:** none. This is a design pass; nothing here changes production or `main` behaviour.

---

## TL;DR

The repo already carries the in-currency ledger (`20260706120000`, owner-approved 2026-07-05) and the
payout rail (`20260706130000`), both flag-dark, and the pricing package already has the payer-currency
resolution + charge-amount seams with tests. What it does not have is everything around them: a real
FX seam with freshness, spread, integer rounding and a persisted snapshot; provider currency capability
in routing; per-currency wallets; in-currency refunds, credit notes and receipts; and reconciliation
readers that stop summing kobo with cents the moment a second currency posts. The design grounds all six
legs on the real spine (every claim carries a `file:line`), lists the twenty NGN locks and the build step
that widens each, specifies twelve invariants as CI rules with red conditions, orders the build by money
risk (readers and the DB-level currency lock first, money movement last), and surfaces ten owner
decisions, each tied to the gate it blocks.

Two findings about today's `main` worth knowing before any of it is built:

1. **The charge-currency interlock exists on paper only.** `parseChargeCurrencies` is a pure parser
   with tests; no code in `apps/` reads a `CHARGE_CURRENCIES` env var, and the account intents route
   accepts any of the 15 codes in `CURRENCY_MAP`. Today the only thing stopping a non-NGN intent is the
   provider account configuration. The design moves the lock into the database
   (`payments_private.charge_currency_policy` + a `payment_intents` trigger) as build step M1.
2. **Three readers still sum across currencies**: `wallet_ledger_reconciliation`, `vat_reconciliation`
   (which labels its global result `NGN`), and the owner finance console's TS re-derivation. With the
   July ledger migration applied, the first USD charge would post correctly in USD and then be added to
   NGN figures by all three. M1 fixes them before any currency can be enabled.

---

## 1. Grounding method

Read, in full, before writing a line of design: the seven money migrations
(`20260529120000` payment_intents → `20260605123000` isolation → `20260607120000` ledger →
`20260607130000` documents → `20260607140000` VAT → `20260611130000` refunds → `20260706120000`
multi-currency ledger → `20260706130000` payout rail), their eight CI proof suites and the CI job that
runs them, the pricing package (`currency-model.ts`, `exchange-rate.ts`, `vat.ts`, tests), the
payment-router package (ledger mirror, router, both live adapters, limits, division-sale), the account
money routes (intents, finalize, refund, webhooks, wallet top-up/withdrawal, payout), the three division
card rails and their reconcilers, the receipt/credit-note document builders and renderers, the hub
finance reader, the prod-actual schema capture, the FL2 go-live report and apply manifest, and the three
prior money design docs plus the program spec. The "exists on main" statements in the design were then
re-derived by independent adversarial agents (§5 below).

## 2. Spine truth (one line each; the design's §1 has the full tables)

- Ledger: per-entry balance, immutable, idempotent on `(source, source_event_id)`, currency on the entry
  (ISO-4217 CHECK). `ledger_reconciliation()` is per-currency; `wallet_ledger_reconciliation()` and
  `vat_reconciliation()` are not.
- Charge: `post_charge_settlement` posts in the intent's currency; the 7.5% statutory fee-VAT split
  applies only to NGN; a provider-reported fee VAT posts to `fee_vat_recoverable` in any currency.
- Sale: `post_sale_revenue` hard-codes `'NGN'` (no currency parameter).
- Refund: `payment_refunds.currency` CHECK = NGN; `initiate_payment_refund` returns `non_base_currency`;
  all refund postings tagged `'NGN'`.
- Documents: `customer_receipts` and `customer_credit_notes` CHECK = NGN; both writer RPCs reject non-NGN;
  renderers divide by 100 for every currency.
- Wallet: one `customer_wallets` row per user (`UNIQUE (user_id)` in prod), NGN; `credit_wallet_topup`
  and the payout RPCs reject non-NGN; the auto-payout branch sends a non-NGN method to manual review.
- Provider: both adapters are exponent-correct and reject unknown codes; routing ignores currency.
- FX: OER feed, 30-minute cache, served stale after 2 h, identity fallback flagged; the pure charge
  seam does not check freshness and rounds floats; two display helpers scale minor units without the
  exponent.
- Prod: FL2 live on Flutterwave (2026-06-27 report); the two July migrations are on `main` (PR #499,
  2026-07-16) with no record of a prod apply — the design's M0 verifies.

## 3. What the design specifies (map to the final-line claims)

| Claim | Where in the design |
|---|---|
| Ledger design | §4 — per-currency books (built), two FX accounts with no v1 writer, posting rules per event, VAT in-currency with per-currency `vat_reconciliation`, per-currency `wallet_ledger_reconciliation`, hub reader per-currency, read-only consolidation at explicit reporting rates |
| FX design | §5 — one server-only seam `resolvePayerCharge`, 30-minute rate max age, no fallback/stale charges, 15-minute quote TTL, integer `rate_e8` + `spread_bps` with a `BigInt` ceiling, per-currency floors, DB policy table as the only allowlist, append-only `fx_rate_snapshots`, snapshot frozen with the intent |
| Provider design | §6 — `PROVIDER_CURRENCIES` joins the routing rule, acquiring-country routing kept, in-currency settlement required in v1, the owner's live settle test as the oracle (`getBalance` before/after + refund step), fees in-currency |
| Wallet design | §7 — NGN wallets untouched (one row per user stays), per-currency wallets as separate tables with mirrored RPCs, same-currency withdrawals only, no cross-currency moves |
| Refund design | §8 — charge currency, charged figure, never re-converted; row-currency trigger; in-currency postings; credit notes tied to the posting currency; refund leg proven before a currency can be enabled |
| Receipt design | §9 — in-currency documents with the posting-currency tie, exponent-correct rendering, money emails made currency-aware, optional NGN-equivalent line pending the accountant |
| Invariants as CI rules | §10 — MC-CI-01…12, each with mechanism and red condition, appended to the existing money CI job; the live settle test explicitly an owner gate, not CI |
| Ordered M-risk build plan | §11 — M0 verify prod → M1 readers + DB lock (no money moves) → M2 FX seam → M3 provider capability → M4 refund/credit-note legs → M5 receipt leg → M6 rails dark → G3 owner gate (first currency) → M7 wallets/payouts → M8 reporting |
| Owner decisions | §12 — D-MC-01…10, each with a recommendation and the gate it blocks |
| Hazard register | §13 — the money-losing paths (rounding leakage, rate-move arbitrage, double conversion, refund loss, unit mix-ups, mixed books, phantom cash, posted FX) and what closes each |

## 4. Verification run in this pass

- `node scripts/v3/tone-gate.mjs` → OK (2853 files clean, 8 voice rules). The design is a docs file
  (outside the gate's roots) and was written in the company voice regardless.
- No code, migration, test or CI file was changed, so lint/typecheck/i18n gates are unaffected; the
  design names the gates each build step must pass.

## 5. Adversarial rounds

(filled in below as rounds complete)
