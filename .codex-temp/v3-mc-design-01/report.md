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

## 0. Live findings on `main` (read this first)

Grounding the design found money holes that exist on `main` today, outside the multi-currency scope.
LF-1 and LF-2 were raised by the round-1 reviewers; round 2 added LF-5, LF-6 and LF-7; round 3 added
LF-8 and LF-9 (items 3–7 below). Each was re-verified line by line (design §1.5); LF-5, LF-6 and LF-8
were also reproduced by execution against the real function bodies.

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

3. **LF-5, high — a webhook that arrives before the buyer returns cannot apply.**
   `apply_payment_webhook` writes the terminal status directly (`20260611130000:921`); the A2 trigger
   admits only `pending → processing` and `processing → succeeded|failed`
   (`20260605123000:34-35`); only the finalize route, called when the buyer lands on the callback
   page, advances `pending → processing` (`finalize/route.ts:35`). Webhook-first on a `pending`
   intent raises, the route returns 500 and the provider redelivers until it gives up. A buyer who
   pays on the hosted page and never returns leaves captured money with no status, no settlement
   entry, no wallet credit and no receipt, and nothing alarms. Fix: the RPC advances
   `pending → processing` inside its own transaction before the terminal write (M-NOW item 5).
4. **LF-6, medium (books; over-remit) — a refund before the sale allocation leaves the full sale on
   the books.** A refund confirmed before the marketplace sale is allocated reverses nothing
   ("No sale entry → nothing to reverse", `20260611130000:548-553`); the intent returns to
   `succeeded`; the next `/pay/[orderNo]` load posts the full sale (`post_sale_revenue` has no
   status or refund check, `20260607140000:197-224`). Revenue and output VAT are overstated by the
   refunded share and VAT is over-remitted. Fix: `post_sale_revenue` posts the proportional
   catch-up reversal for every refund already succeeded on the intent (M-NOW item 7).
5. **LF-7, critical (latent; live the moment a division card flag is on) — one card settlement
   allocated twice.** A rail intent's `idempotency_key` is a `randomUUID()` the payer can read from
   their own row (`payment_intents_select_own`). `POST /api/wallet/topup/init` accepts any UUID as
   `idempotencyKey` and inserts a `rail_topup` funding request with it (`topup/init/route.ts:49-79`);
   the reconciler joins `(user_id, idempotency_key = payment_reference)` with no marker check
   (`wallet-topup-port.ts:80-86`) and credits the wallet through `credit_wallet_topup`, which checks
   nothing about the intent. ₦X of goods plus ₦X of withdrawable balance for one ₦X charge; the
   ledger stays "balanced". The division card flags are dark in prod today (design §1.4), so this is
   latent until M6 lights studio. Fix: a wallet-funding marker on the intent, a key refusal at
   `/topup/init`, and one allocation per intent by primary key (`intent_allocations`), M-NOW item 4.
6. **LF-8, high (live NGN rail; owner-action-conditional) — a partial refund before the top-up
   credit yields the full credit plus the refund.** `initiate_payment_refund` takes a wallet hold
   only for a funding request already `verified` (`20260611130000:290-294`); while the request is
   still `pending_verification` a partial refund posts and returns the intent to `succeeded`; the
   user's next wallet load runs the reconciler, which needs only `succeeded` + an equal amount and
   credits the full amount through `credit_wallet_topup`, which never reads `payment_refunds`.
   ₦3,000 in, ₦5,000 of obligations on a ₦5,000 top-up with a ₦2,000 refund; both reconciliation
   readers stay "true". Reproduced by execution. Fix: `credit_wallet_topup` and the division
   allocation claim raise `refund_exists`; `initiate_payment_refund` refuses `topup_not_credited`
   for an uncredited rail request (M-NOW item 4).
7. **LF-9, medium (provider-conditional) — an attempt-level failure consumes the success dedup
   key.** `apply_payment_webhook` inserts `(provider, reference)` first for every status; Paystack
   maps `abandoned` and Flutterwave maps a per-attempt `failed` / `cancelled` to terminal `failed`,
   which has no exit. A buyer who closes the checkout, returns (finalize applies `failed`) and then
   completes the same reference produces a `charge.success` that is `duplicate`. Whether a provider
   lets the same reference be completed afterwards is confirmed in the settle test. Fix: `failed`
   applies are keyed `<reference>:failed` and `failed → succeeded` is a legal provider-confirmed edge
   (M-NOW item 8).

All seven go first in the build plan (M-NOW) and need the owner's decision D-MC-00.

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

### Round 2 — 58 findings (1 critical-in-design, 3 live-on-main, 9 high, 25 medium, 20 low); all fixed in revision 3

Every finding was re-verified against the files before the design changed; the wallet/payout
reviewer also executed the CI money chain plus the held migration and proof on a scratch PostgreSQL
cluster, so the CI-shape findings are executed results.

| Lens | Findings | What changed in the design |
|---|---|---|
| Claims auditor | 9 (1 high, 1 medium, 7 low): proof b2 would die on a missing `service_role` table grant before the trigger fires (the CI bootstrap reproduces Supabase's default grant on functions only); proof b3 could not tell a trigger refusal from an RLS refusal (same SQLSTATE); the status-CHECK anchor pointed at the column lines; the `:80` / `:270-278` / `:117-137` anchors; README position and seam-script notes | Proof grants `service_role` SELECT/INSERT first and gains (b0) trigger-present; (b3) asserts the trigger's own message; §1.1 / §1.5 / N13 / N28 anchors corrected; README rewritten with the CI-grant caveat, the seam-script transaction wrapper and the chain position |
| Ledger / VAT / reporting | 10 (1 high, 5 medium, 4 low): **LF-6** — a refund confirmed before the sale allocation reverses nothing and the next `/pay` load posts the full sale (revenue + VAT overstated, VAT over-remitted; live on `main`); `apply_payment_webhook` discards the settlement result so `fee_dropped` never reaches the route; the reporting-rate direction was not pinned (the §4.6 reader named columns the §5.5 DDL did not have); the §4.5 expectations were not computable from tables and red on legal states and on the CI chain DB; the readers migration's chain position collided with payout proof p7 and the CI wallet shape; a cross-period foreign refund converted at a later rate reduces the return by more than was remitted, and NGN fee VAT is netted without an accountant answer; the bank-transfer fund route sources the request currency from a staff-editable setting; the tag-consistency proof missed `ai_usage` and the M7 names; MC-CI-07's positive control needed `fx_rate_snapshots` (then an M2 table) and `db push` would apply the lock after the July files; the §5.3 precision claims | §4.3 `post_sale_revenue` catch-up reversal keyed by refund id (M-NOW) + MC-CI-02 fixture; §6.5 merged settlement result returned to the route; §5.5 `from_currency`/`to_currency` with orientation CHECKs, `rate_as_of <= fetched_at`, the spread range and a reporting plausibility band; §4.5 formulas from the tables, scoped to fixture users in CI, incl. withdrawals; §4.1 chain position, bootstrap shape, `FinanceLedgerConsole` in N5; §4.4 per-movement reporting rate ids + reversal cap, D-MC-05 extended to NGN fee VAT; §7.1 fund route pinned; §4.5 resolver table; lock migration carries `fx_rate_snapshots` + `currency_exponents` and is named `20260706110000_…`; §5.3 bound restated |
| FX / rounding / units | 15 (1 high, 6 medium, 8 low): the free option survived through `processing` (finalize advances before verify; no hosted-page expiry; the sweeper was `pending`-only and A2 has no `processing → cancelled`); `late_capture` as "not applied" stranded provider truth with no refund path; the 30-minute freshness bound blocked half of every hour and a quote paid inside its TTL was refused at insert; the birth guard did not bind `amount_minor` to the snapshot row (a copied fresh id with a ÷10 amount passed); the frozen-rate floor on NGN claims under-refunded, stranded `refunded` and put FX inside a refund; the marketplace port's kobo VAT compared to a payer-minor gross would silently post 0 VAT on every foreign sale; "set once (CAS)" contradicted "a second start cancels the first"; the §5.3 bound was relative, not one minor unit; the largest-remainder rule was undefined for negative discount lines, ties and zero lines; snapshot CHECKs and the §4.6 reader disagreed with the DDL; the GUC escape hatch; the NULL-amount clause coupled settlement to the buyer's return; the settle-test routing deadlock; the spread text contradicted itself; the Flutterwave fee identity mixes fee-bearer models | §5.2 rewritten: clock rule 75 / 15 / 90 min, sweeper over both states with verify-then-decide and the `processing → cancelled` edge, `late_capture` applies + auto-refund + reconciler refusal (D-MC-14), `charged_intent_id` CAS, spread formula and accepted exposure; §5.4 recomputation against the snapshot row with `currency_exponents` seeded in M1 (MC-CI-07 ÷10 case); §8.1 proportional share with no rate; §9.1 VAT from the payer gross, mathematical floor, tie-break by index, the ₦1,001 / ₦2,003 / ₦3,007 / −₦500 fixture; §5.3 restated with the ₦100,000,000 fixture; §5.5 CHECKs; GUC removed from the held migration; §6.3 no NULL branch + route re-verify; §6.1 `settle_test_provider` override; §6.5 identity on `amount` + `surchargeMinor` |
| Provider / refund / receipt | 12 (1 critical, 5 high, 4 medium, 2 low): **LF-5** — webhook-first on a `pending` intent cannot apply today (A2 admits only `pending → processing`; the RPC writes the terminal status directly), so the revision-2 sweeper would have cancelled real captured money and `late_capture` would have left it unrecorded; dropping the adopt wildcard would double-refund (Paystack's list parser returns null for non-integral amounts); the NULL-accepted confirmed figure was unenforceable (finalize and the webhook share the dedup key; Paystack's signed body carries the amount and the adapter drops it; a missing amount defaulted to `0`/`""`); a 409 on mismatch is a redelivery loop with no durable record and the alarm is a log line; `PROVIDER_CURRENCIES` recreated the circular enable gate and a plpgsql RPC cannot read a TS constant; `feeStatus: inconsistent` as fatal contradicted "the status write always applies" and would surface as a forged webhook; `fee_dropped` had no persistence or correction path; the null-amount refusal named an adapter method that does not exist and left the hold live for ever; the policy enable was bypassable by a direct UPDATE; a chargeback left the intent refundable; the Σ-lines assertion was shape-unaware and the key name disagreed with the proof; the GUC + proof b3 | §1.5 LF-5 + M-NOW (5): `apply_payment_webhook` advances `pending → processing` itself, MC-CI-08 both orders; §8.1 adopt rules (reference match, exclusions, 503 on an unbindable null row); §6.3 rewritten: figures required, refuse-and-record into `payment_exceptions`, 200 to the provider, `resolve_payment_exception` + owner route + runbook (D-MC-13), finalize emits on a failed verify; §6.1 override + parity test; §6.5 `feeStatus` as a field with `fee_unreconciled`, `fee_dropped` persisted + `post_fee_correction`; §8.1 route re-verify + `refund_unverified` exception + stale-hold alarm; §5.4 policy trigger + DML revoke; §6.7 `payment_disputes` refund-blocking; §9.1 `tax_inclusive` + `amountMinor` key with legacy read |
| Wallet / payout / CI / build order | 12 (1 critical, 2 high, 5 medium, 4 low): **LF-7, critical (latent; live once a division card flag is on)** — one card settlement allocated twice: the payer reads a rail intent's `idempotency_key` from their own row, creates a `rail_topup` funding request with it, and the reconciler credits the wallet for the intent that already paid the division record; proof 02 red on the missing `service_role` grant (executed); proof b3 vacuous (executed); build-order clobber — M-NOW's payout-RPC hardening would be overwritten by the July file applied later; the payout `fee >= amount` raise is a 500 loop the hazard register claimed closed; the fund-route currency setting (also silently degrading to the legacy row); MC-CI-01's rule missed `select("*")` and had 26 day-one reds, several outside N24, and a line-keyed baseline; un-inventoried raw wallet debits (marketplace checkout, out-of-band manual payouts) make the §4.5 expectations red on prod from day one; the studio wallet checkout debits `amount × 100` without checking the record's currency; the GUC survives `RESET ROLE` and leaks over the pooler; `fx_rate_snapshots` referenced before it exists; the shadow rehearsal set does not carry the new files | §1.5 LF-7 + §7.1 one-allocation rule: wallet-funding marker, key refusal at `/topup/init`, `intent_allocations` by primary key + `claim_intent_allocation` (MC-CI-10 cycle); proof fixed; §7.1 sequencing rule (payout RPC hardening is M1 in a migration after `20260706130000`; MC-CI-10 after the payout proof asserts the hardened bodies); §7.3 fee ≥ amount rule; §7.1 fund route; MC-CI-01 `"*"` handling, per-row exemption, `file::table.column` baseline, N24 list extended, day-one list seeded; LF-3 widened to the marketplace checkout and manual payouts with a dated delta baseline for §4.5; studio route currency assertion in M-NOW; GUC removed; lock migration carries the DDL; MC-CI-11 adds `FL2_SET` |

New owner decisions from this round: D-MC-13 (mismatch resolution: refund in full), D-MC-14 (late
capture applied and refunded, never fulfilled); D-MC-05 extended to NGN processor-fee VAT.

### Round 3 — 63 findings (0 critical, 9 high, 31 medium, 23 low); all fixed in revision 4

Three of the five reviewers rebuilt the CI money chain plus the held migration and proof on a scratch
PostgreSQL cluster and ran scenario SQL against the real function bodies; the chain-shape findings,
the overload ambiguity, the trigger-arithmetic overflow and the LF-8 path are executed results. The
held migration and proof passed (b0–b3) with every later suite green in all three runs.

| Lens | Findings | What changed in the design |
|---|---|---|
| Claims auditor | 11 (0 high, 4 medium, 7 low): `customer_wallet_transactions` has no `currency` column (prod carries `settlement_currency`), so the MC-CI-01 rule and two reader fixes were unsatisfiable as written; a credit note minted before the LF-6 catch-up carries VAT 0 for ever; `supabase db push` would sweep 19 unrelated pending migrations into the money apply; the MC-CI-02 literal allowlist counts were wrong (measured: payout RPCs 2/1/1, `credit_wallet_topup` 2, refund functions 3/1, comments counted); anchor slips (`vat_reconciliation` netting at `:246-251, 257`; the live A2 trigger and `advance_payment_intent` definitions are in `20260605123000`, not the dropped public copies); the day-one baseline list was self-contradictory; the proof's b0 probed a setting the trigger no longer reads; no CI position for the lock migration; the pre-apply check omitted `customer_wallets.currency`; the M-NOW catch-up on the prod signature of `post_sale_revenue` was unstated and M4 never dropped the old overload | MC-CI-01 names each table's currency column; §8.3 `credit_note_pending` rule; §11 per-file apply in version order (the FL2 method) with the pending set listed; MC-CI-02 allowlist by measured count, comments stripped; anchors re-pointed; baseline rule restated (generated pre-M1, shrunk in the M1 PR; `.single()` reads exempt); b0 simplified; lock migration between `ci.yml:224` and `:231`; pre-apply check widened; M-NOW (7) states the `p_source_event_id = intent id` reading and M4 drops the old signature |
| Ledger / VAT / reporting | 13 (2 high, 6 medium, 5 low): the lock migration named `20260706110000_…` would be clobbered on any version-ordered apply because it extended the birth-guard function a higher-versioned file owns; **LF-8** — a partial refund before the top-up credit yields the full credit plus the refund (live NGN rail; reproduced); the LF-6 catch-up took no intent lock (a concurrent refund webhook leaves a share unreversed); the catch-up must be sequential with remainders recomputed (333 / 333 / 334 drifts by a unit otherwise); the overload ambiguity (reproduced, 42725); `ledger_consolidated` overflows `bigint` at a $614,892 balance; the tag-consistency proof is red on the chain's own fixture sources; VAT re-carved from the payer gross over-states VAT on mixed carts; a credit note before the catch-up; the per-movement reversal cap must be cumulative per sale; MC-CI-01's "no scalar equals the mixed sum" contradicted the kept global scalars; the payout proof cannot run on the FK-bearing shadow; the pre-apply check and the plausibility band had gaps; LF-6 needs the marketplace card flag (dark) and a partial refund | §5.4 separate `enforce_payment_intent_currency` trigger function + MC-CI-12 version-order replay; §1.5 LF-8 + §7.1 `refund_exists` / `topup_not_credited` + MC-INV-14; §4.3 intent lock and sequential catch-up; §6.3 drop-first rule + one overload per name; §4.6 `numeric`; §4.5 `(source, source_event_id)` allowlist; §9.1 VAT from the converted standard-rated base; §8.3; §4.4 cumulative cap; §4.1 global scalars dropped with the five readers amended; payout proof seeds `auth.users`; §11 pre-apply check widened; §5.5 band against the display feed; LF-6 relabelled latent |
| FX / rounding / units | 10 (1 high, 4 medium, 5 low): the sweeper's verify-then-decide was not total — Paystack `abandoned` became a terminal `failed` with no exit and a later capture raised and looped, a Flutterwave never-charged `tx_ref` stayed `pending` for ever and a capture days later was fulfilled at a stale rate; the §5.4 formula transcribed literally is `double precision` (`10^e`) or overflows `bigint` at ₦10,818 for KES (executed); VAT re-carved from the payer gross VATs exempt lines; the late-capture refund was route-side after the commit; the sweeper would cancel NGN bank-transfer top-ups at 60 minutes; claim currency is free text and multi-intent bookings were unhandled; `tax_inclusive` must follow the VAT regime, not the builder; the §5.3 bound is 102.5 cents; the rate rounding runs on a float cross-rate; three precision gaps (live-gross check at reconcile, M7 USD wallet funding cannot carry an NGN snapshot, the Flutterwave `: 0` fallback) | §5.2 rewritten: scope (non-NGN card), total decision table incl. `notFound`, `failed` attempt-level with `<reference>:failed` keys, late capture by time inside the RPC and atomic with its exception row and refund claim, SQL-side refusals, new-start block; §5.4 `numeric` multiplication form with KES/XOF/USD range fixtures; §9.1 standard-rated base + regime-derived `tax_inclusive`; §8.1 NGN-only claims + multi-intent allocation; §5.3 102.5 bound + `BigInt` rate from decimal text; §5.2 live-gross check; §5.4 identity path; §6.3 Flutterwave fallback; D-MC-15 |
| Provider / refund / receipt | 15 (2 high, 8 medium, 5 low): **LF-9** — an attempt-level `failed` consumes the success dedup key (Paystack `abandoned`, Flutterwave per-attempt failures), stranding a later capture on the same reference; the Paystack confirmed figure ignores the customer-bears-fee setting (`requested_amount`); `advance_payment_intent` lacks `pending → cancelled`; `failed` on a sweeper-cancelled intent raises and loops; LF-5's fix makes webhook-first common and drops the Paystack fee the finalize carries; the late-capture auto-refund had no idempotent anchor and sat outside the apply transaction; the routes cannot write `payment_exceptions` / `payment_disputes` (DML revoked); signature changes left the old overloads; exception-path intents were never terminalised and a transient re-verify failure landed a good charge in an exception; `refund_unverified` had no resolution path; the Paystack exception-refund match used the wrong identifier and bypassed the dispute gate; the mock and `FinalizeResult` contract broke under the figure check; the sweeper was live on NGN; `fee_unreconciled` had no parameter to arrive through; `RefundParams` lacks `currency` | §1.5 LF-9 + §5.2 keys and edges; §6.3 Paystack bearer identity + optional figures + mock echo + re-verify-failure = 500 + figure check before the advance + `<reference>:exception` key + resolver cancels the intent + sweeper skips open exceptions; §5.2 whitelist edges; `already_terminal`; §6.5 `fee_unreported` + catch-up on `duplicate`; §5.2 atomic late capture; §6.3 `record_payment_exception` / `open_payment_dispute` RPCs; drop-first; §8.1 resolver actions; §6.3 both identifiers + dispute check + adopt-don't-redrive on the owner route; `p_fee_status`; `RefundParams.currency`; scope |
| Wallet / payout / CI / build order | 14 (3 high, 8 medium, 3 low): the lock-migration clobber (independently found); MC-CI-05/06 "extend" suites that run before the migrations they need; the overload ambiguity (executed); the bootstrap default-privileges statement placed after its own `create table`s grants nothing to the wallet tables (executed both placements); three unlisted fixture sources; the global scalars kept in `ledger_reconciliation`; `select("*")` makes the "must also name currency" test vacuous and the 12-line window misses the N24 fold; `claim_intent_allocation` must be idempotent per `(kind, ref)` (the claim and the flip run on different connections); no marker backfill for pre-existing intents; payout fees have no intent for `post_fee_correction`; the LF-3 shrink-only baseline is red on the first wallet checkout; the `created_at` ordering test is clock-dependent (UTC vs local defaults); `division is null` would refuse every legitimate top-up; `FL2_SET` lacks the AI and July files | §5.4 separate trigger; MC-CI-05/06 as new suites after :249; drop-first; MC-CI-11 bootstrap statement before the first `create table` + `has_table_privilege` assertions; §4.5 allowlist; §4.1 scalars dropped; MC-CI-01 rewritten (table-specific column, `*` reads baselined, `.single()` exempt, function-scoped folds); §7.1 idempotent claim, backfill, identity binding, marker alone; §7.3 `post_withdrawal_fee_correction`; §4.5 explained delta; MC-CI-11 `FL2_SET` |

New in this revision: MC-INV-14 (one allocation per intent, none after a refund, time decides late
capture); D-MC-15 (NGN intent expiry is a separate pass); LF-8 and LF-9.

### Round 4 — pending (launched against revision 4)
