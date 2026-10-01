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

## 0. Two live findings on `main` (read this first)

Grounding the design found two money holes that exist on `main` today, outside the multi-currency
scope. Both were raised by the round-1 reviewers and re-verified line by line (design §1.5).

1. **LF-1, critical — any signed-in user can insert a `succeeded` payment intent.**
   `payment_intents_insert_own` lets `authenticated` insert its own rows
   (`20260529120000_payment_intents.sql:235-237`), the status CHECK admits every status at insert,
   no BEFORE INSERT trigger exists, and `sec_harden_08` keeps the `authenticated` INSERT grant
   (`20260627213858:30-32`). The wallet top-up reconciler credits the wallet for any `succeeded`
   intent whose `idempotency_key` equals the user's own funding-request reference
   (`apps/account/lib/wallet-topup-port.ts:80-93` → `credit_wallet_topup`, which checks no settlement
   entry), so a user can self-credit any amount on the live rail and withdraw it through finance
   review (automatically once `WALLET_AUTO_PAYOUT` is on). Studio and care flip their record to paid
   on a `succeeded` intent found by `metadata`; marketplace posts revenue. `ledger_reconciliation`
   stays "balanced". Proposed held fix (not applied, not in CI):
   `docs/v3/security/v3-mc-design-01-proposed-migrations/01_payment_intents_birth_guard.sql` + proof.
2. **LF-2, critical, provider-conditional — no confirmed-amount check, and a replay re-routes with
   the new body amount.** The intents route re-routes a still-`pending` intent with the body's amount
   on an idempotency replay and overwrites `provider_reference` (`intents/route.ts:69-93, 110-114,
   170-173`); finalize and the webhook never compare the provider's verified amount/currency to the
   intent (`finalize/route.ts:52-59`, `webhooks/[provider]/route.ts:215-222`;
   `apply_payment_webhook` takes none). Where the provider accepts re-initialising an unpaid
   reference for a smaller amount, the buyer pays the small amount and the books credit the frozen
   one. Fix specified in design §6.3 (M-NOW).

Both go first in the build plan (M-NOW) and need the owner's decision D-MC-00.

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

Each round: five independent read-only reviewers (claims auditor; ledger/VAT/reporting; FX/rounding/
units; provider/refund/receipt; wallet/payout/CI/build order), each told to re-derive every claim
from the files and to find a money-losing path, with the instruction to answer `NO FINDINGS` when
nothing lands. Every finding was re-verified against the files before the design changed.

### Round 1 — 51 findings (2 critical-on-main, 2 critical-in-design, 9 high, 24 medium, 14 low); all fixed in revision 2

| Lens | Findings | What changed in the design |
|---|---|---|
| Claims auditor | 5 (2 medium, 3 low): the July migrations' "PR #499 / 2026-07-16" provenance was a shallow-clone graft artefact; the Paystack adapter has no currency guard (the design said both adapters fail closed); the inventory missed the `'NGN'` literals on the refund row (`:341`) and the credit-note insert (`:787`); `ledger_accounts` is 9 codes on `main`, not 8; the CI step wording | §1.4 provenance corrected; §1.3/§6.6 Paystack row corrected and the guard made an M3 item; N7/N8 literals added; §1.1 account count; §10 step wording |
| Ledger / VAT / reporting | 10: `fail_payment_refund` re-credits the NGN wallet unconditionally; `credit_wallet_topup` ignores a consumed key and still moves the balance (the design's "shared key prevents a double post" was backwards); owner-command revenue readers (`division-revenue.ts`, `since-last-looked.ts`, `owner-data.ts`, `OwnerMoneyStrip`, staff finance) sum intents across currencies and the guard pattern could not catch `+=` folds; M0 before M1 contaminates the books; `post_sale_revenue` trusts the caller's gross/event; `ledger_consolidated` could not honour as-of, direction or exponent; the FIRS figure netted unconfirmed foreign fee VAT; per-currency "balanced" is a tautology; payout proof p7 reads the global `accounts` list; `customer_wallets.currency` has no CHECK | §7.1 currency assertions + `posted` checks + dispatch by family; distinct source names (§7.2); N5a readers + mechanical select/fold rule (MC-CI-01); M0+M1 one apply, lock first; `post_sale_revenue(intent_id, vat)` derives gross+currency; §4.6 as-of balances, snapshot ids, `currency_exponents`, STABLE; §4.4 `in_return` and a separate foreign-input-VAT line; §4.5 per-(account,currency) expectations + tag-consistency proof; `accounts` dropped and p7 amended; CHECKs on wallet and request tables |
| FX / rounding / units | 13: **LF-1** (forged intent birth) and **LF-2** (no confirmed-amount check + replay re-route) on `main`; the frozen quote is a free option with NGN-denominated obligations exposed; the exponent guard scope missed every N11 file and eight more sites; freshness measured on the fetch clock behind the Next Data Cache; receipt line items in kobo on a foreign-currency document; partial-refund amounts' currency undefined; refunds after a treasury sweep and chargebacks unmodelled; disabling a currency left in-flight intents; `rate_e8` rounded half-up could land below the reference; display seams could double- or identity-convert; the env-var grep would be red on day one; three unpinned details (NGN spread, snapshot direction, key name) | §1.5 + M-NOW + the held migration; §6.3 confirmed-amount check; §5.2 capture window, sweeper, `late_capture`, one open intent per record, card-only non-NGN, honest exposure statement, D-MC-11/12; MC-CI-04 scope + per-site baseline + single formatter rule; `rate_as_of` + no-store fetch; §9.1 charge-currency breakdown with largest-remainder residual; §8.1 `p_currency` + frozen-rate conversion of NGN claims; §8.2 balance check + treasury rule; §6.7 chargeback alarm; disable cancels pending; rate rounded up + CHECK; `buildCurrencySnapshot` null on fallback, `convertWalletDisplay(from, to)`; grep scoped to env reads; NGN spread CHECK, pinned snapshot direction, `fx_charge_snapshot` key |
| Provider / refund / receipt | 11: MC-INV-08 described a check that does not exist; the enable gate was circular (a settle-test charge could not exist while disabled); no receipt or credit-note issuance path exists on `main` (documents route renders legacy invoices; no credit-note type; no caller); a reported fee ≥ gross would raise-loop the webhook and strand the charge; the Flutterwave fee identity silently drops an inconsistent fee (phantom cash in the auto-convert case); the balance oracle is settlement-blind; refund webhooks carry no currency and Paystack's decimal-string amount parses to null; the marketplace port hard-codes NGN and ×100; the Paystack units claim; the refund email fallback; the mock-registration interaction with the provider-currency gate and a citation slip | §6.3; `settle_test_user_id` + validated enable (§5.4); §9.1 issuance path, credit-note minting at the apply site, proof fixtures; §6.5 `fee_dropped` and `feeStatus` fatal on verify; §6.4 settlement-record oracle + fee-line assertion; §8.1 `apply_refund_webhook(p_currency)`, null-amount refusal for non-NGN, RPC returns amount+currency; M6 lists the port lines and `post_sale_revenue` has no default; §6.6; adapter-declared currency sets; citation fixed |
| Wallet / payout / CI / build order | 12: **critical** mis-routed wallet family (NGN settle/release/fail on a USD row credits the NGN wallet and consumes the shared key); a non-NGN wallet-funding intent could exist between G3 and M7; M0 before M1; CI bootstrap `customer_wallets` lacks `currency`; MC-CI-01's SQL scan red on immutable migrations; MC-CI-02's literal allowlist incomplete and bypassable; transfer fee currency raise-loop; hold/cap reads with no currency predicate; `sec_harden_08` grant pattern keeps `service_role` DML and the studio wallet checkout writes balances with no ledger post; env-var grep red on comments; per-file exponent baseline hides new sites; limit rows could be in the wrong exponent | §7.1 assertions + dispatch; §5.4 wallet-funding clause in the birth guard; M0+M1 one apply; MC-CI-11 bootstrap shape; MC-CI-01 scoped to reader function bodies with by-construction exemptions; MC-CI-02 behavioural-first with an explicit (function, count) allowlist and dedicated NGN hold/release functions; §7.3 `fee_unreconciled`; N24 readers currency-scoped; ledger-pattern grants for the new tables + LF-3 recorded; env grep scoped; per-site baselines; exponent test on limit rows |

### Round 2 — pending (launched against revision 2)
