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
legs on the real spine (every claim carries a `file:line`), lists the thirty NGN locks and the build step
that widens each, states fourteen invariants and specifies twelve of them as CI rules with red
conditions, orders the build by money risk (the hardening of `main` first, then the readers and the
DB-level currency lock, money movement last), and surfaces seventeen owner decisions (D-MC-00 to
D-MC-16), each tied to the gate it blocks.

Two structural facts about today's `main` worth knowing before any of it is built (the nine live
money findings, LF-1, LF-2 and LF-5 to LF-11, are in §0 and come first in the build plan):

1. **The charge-currency interlock exists on paper only.** `parseChargeCurrencies` is a pure parser
   with tests; no code in `apps/` reads a `CHARGE_CURRENCIES` env var, and the account intents route
   accepts any of the 15 codes in `CURRENCY_MAP`. Today the only thing stopping a non-NGN intent is the
   provider account configuration. The design moves the lock into the database: the birth guard
   (M-NOW, held migration) and `payments_private.charge_currency_policy` + its own `payment_intents`
   trigger (M1).
2. **Three readers still sum across currencies**: `wallet_ledger_reconciliation`, `vat_reconciliation`
   (which labels its global result `NGN`), and the owner finance console's TS re-derivation. With the
   July ledger migration applied, the first USD charge would post correctly in USD and then be added to
   NGN figures by all three. M1 fixes them before any currency can be enabled.

## 0. Live findings on `main` (read this first)

Grounding the design found money holes that exist on `main` today, outside the multi-currency scope.
LF-1 and LF-2 were raised by the round-1 reviewers; round 2 added LF-5, LF-6 and LF-7; round 3 added
LF-8 and LF-9; round 4 added LF-10; round 5 added LF-11 (items 3–9 below). Each was re-verified line by line (design
§1.5); LF-5, LF-6 and LF-8 were also reproduced by execution against the real function bodies.

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
8. **LF-10, medium (books; latent until a division card flag is on) — studio and care card sales
   never reach revenue or output VAT.** The only application caller of `post_sale_revenue` is the marketplace
   port (`sale-reconcile-port.ts:186-190`); the studio flip is a raw status update
   (`studio/card-rail.ts:190-197`) and the care flip's RPC posts nothing to the ledger. Their
   captures sit in `payments_clearing` for ever and `vat_reconciliation` never sees their output
   VAT (under-remit). Fix: M6 wires both to `post_sale_revenue` on every path, NGN included, through
   the one-allocation rule; the back-fill of live NGN sales is the owner's call (D-MC-16). Round 5
   added that care does post — to its own NGN, major-unit ledger (`care_journal_entries`), a second
   book the spine's readers never see, so a care card sale records its cash twice across the two
   books; D-MC-16 now also asks which book is the record.
9. **LF-11, high (live on the NGN rail; provider-conditional) — a lost refund response unwinds a
   refund the provider made.** The staff refund route treats every non-`ok` adapter result as a
   synchronous rejection (`refund/route.ts:202-221`), including a retryable transport error or 5xx
   returned after the provider created the refund (`paystack-provider.ts:108-109, 117-118`;
   `flutterwave-provider.ts:159-160, 168-169`): `fail_payment_refund` re-credits the wallet hold
   and reverts the intent to `succeeded` (`20260611130000:399-432`), and the `refund.processed`
   that follows finds no row in flight and is logged as an orphan with a 200 (`:498-508`;
   `webhooks/[provider]/route.ts:181-187`). The customer then holds the re-credited, withdrawable
   balance and the provider's cash for one top-up. Fix: unwind only on a definitive rejection; a
   retryable error leaves the row claimed and answers 503 for the sweeper's 15-minute rule; a
   `processed` outcome against a `failed` row is an exception, never a log (M-NOW item 13).

All nine go first in the build plan (M-NOW and M6) and need the owner's decision D-MC-00.

---

## 1. Grounding method

Read, in full, before writing a line of design: the eight money migrations
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
| Ledger design | §4 — per-currency books (built), two FX accounts with no v1 writer, posting rules per event, `intent_allocations` (`wallet` / `division`) with `post_sale_revenue` keyed to the `division` row, the LF-6 catch-up under the intent lock and `refunds_present` parking the record, VAT in-currency with per-currency `vat_reconciliation`, per-currency `wallet_ledger_reconciliation`, the readers migration dropping the global scalars (only p7 and mc6 amended), per-(account, currency) expectations with the explained delta, hub reader per-currency, read-only consolidation at explicit reporting rates |
| FX design | §5 — one server-only seam `resolvePayerCharge`, freshness on the feed's own timestamp (75-minute max age, 15-minute quote TTL, 90-minute insert bound), no fallback or stale charges, integer `rate_e8` + `spread_bps` with the rate rounded up and the multiplication-form recomputation, per-currency floors, DB policy table as the only allowlist behind its own currency-guard trigger plus the birth guard, append-only `fx_rate_snapshots` frozen with the intent, the 75-minute sweeper over non-NGN card intents (7-day cancelled re-verify) with the total verify-then-decide table, late capture decided by provider capture time inside the RPC and atomic with its exception row and refund claim |
| Provider design | §6 — `PROVIDER_CURRENCIES` + adapter-declared sets join the routing rule, acquiring-country routing kept, in-currency settlement required in v1, the confirmed-amount check in `apply_payment_webhook` (dedup first, figure check, then advance) with the `payment_exceptions` path and two-phase owner resolution, fees in-currency incl. `customer_borne` and the `fee_unreported` catch-up, chargebacks to `payment_disputes` with an outcome, the lost-dispute posting and cap, the wallet-funding dispute hold, the owner's live settle test as the oracle (settlement record + fee line + refund step) |
| Wallet design | §7 — NGN wallets untouched (one row per user stays) and the NGN RPCs refuse other currencies; wallet-funding identity bound through `customer_wallet_funding_requests.payment_intent_id` (pre-generated intent id, the intent inserted first then the request CAS-bound, strict equality and the intent lock in `credit_wallet_topup`); one allocation per intent, none after a refund; `topup_not_credited` for partial refunds only; terminal `needs_review` + the owner sync route; per-currency wallets as separate tables with mirrored RPCs (M7), same-currency withdrawals only, no cross-currency moves |
| Refund design | §8 — charge currency, charged figure, never re-converted; row-currency trigger (widened in M2 so the late-capture claim can exist); `claim_refund_provider_call` / `claim_exception_refund_provider_call` CAS on a durable row before any provider refund call with the sweeper as the only driver, `cancelled` only on the provider's confirmation after the claim re-checks the intent, the staff route unwinding only on a definitive rejection (LF-11) with `refund_reinstated` for a refund the provider processes after one, the surcharge carried as a column and compared on the sum; in-currency postings; credit notes keyed by allocation kind and tied to the posting currency; refund leg proven before a currency can be enabled |
| Receipt design | §9 — in-currency documents with the posting-currency tie, `tax_inclusive` from the VAT regime, VAT from the converted standard-rated base, exponent-correct rendering, money emails made currency-aware, optional NGN-equivalent line pending the accountant |
| Invariants as CI rules | §3 MC-INV-01…14 as the principles; §10 — MC-CI-01…12, each with mechanism and red condition, appended to the existing money CI job (plus the version-order replay); the live settle test explicitly an owner gate, not CI |
| Ordered M-risk build plan | §11 — M-NOW hardening of `main` (separate PR: birth guard, confirmed-amount check, allocations, wallet identity, the LF closures) → M0 + M1 one prod apply (lock first, the July migrations, then readers + payout hardening) → M2 FX seam → M3 provider capability → M4 refund/credit-note legs → M5 receipt leg → M6 rails dark → G3 owner gate (first currency) → M7 wallets/payouts → M8 reporting |
| Owner decisions | §12 — D-MC-00…16, each with a recommendation and the gate it blocks |
| Hazard register | §13 — the money-losing paths (rounding leakage, rate-move arbitrage, double conversion, refund loss, unit mix-ups, mixed books, phantom cash, posted FX, forged intents, late capture, double allocation, lost chargebacks, a lost refund response) and what closes each |

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

### Round 4 — 47 findings (0 critical, 6 high, 19 medium, 22 low); all fixed in revision 5

The first two launches of this round died when the session's usage window ran out, before any
reviewer had produced a report; the third launch, after the reset, ran all five lenses to completion
with the reviewers working from the files (no chain rebuild). One finding surfaced another latent
books gap on `main` (LF-10).

| Lens | Findings | What changed in the design |
|---|---|---|
| Claims auditor | 7 (0 high, 2 medium, 5 low): the MC-CI-02 literal allowlist omitted four functions that keep `'NGN'` until M4 or M1 (red at the M-NOW gate as written); the identity binding referenced a column that exists nowhere and a clause a BEFORE INSERT trigger cannot satisfy; N7 said M1 where the rest said M-NOW; `schema.sql:5534` is `reference`, the nullable `currency` is `:5535`; D-MC-05 reused the output-VAT anchor; the FL2 manifest's per-file apply is at `:397-399`; `pending → cancelled` already exists in the trigger and the mirror | MC-CI-02 allowlist completed; §5.4 column + sequence (with the other lenses); N7; three anchors; §5.2 whitelist wording |
| Ledger / VAT / reporting | 8 (1 high, 3 medium, 4 low): the identity clause breaks the live NGN top-up rail at birth after M1 (independently found); the §4.5 clearing expectation is red while a wallet-refund hold is in flight; `intent_allocations` by primary key collides with the M6 studio/care sale posts, and today studio and care never post a sale at all — their output VAT never reaches the books (**LF-10**); the currency trigger lacked the superuser exemption the chain's USD fixtures need; an earlier partial's pending credit note is never minted once a later refund completes the intent with no sale leg; MC-CI-02 allowlist (independently); the CI bootstrap funding-request table lacks `metadata` / `verified_at`; `fail_payment_refund` locks refund row → intent, opposite to the webhook | §5.4 null-tolerant clause + strict equality in `credit_wallet_topup`; §4.5 hold term; §7.1 two allocation kinds with `post_sale_revenue` requiring the `division` row; §1.5 LF-10 + M6 + D-MC-16; §5.4 superuser exemption; §8.3 mint-all-pending on `refunded`; MC-CI-11 bootstrap shape; §6.3 intent-first lock |
| FX / rounding / units | 9 (0 high, 4 medium, 5 low): out-of-order `failed` after `succeeded` raises and loops under the `:failed` keys; late capture judged on our apply time turns every on-time payment during an outage of more than 15 minutes into a refund, and a 60-minute cancel voids the 75-minute grace; cancelled sessions are never re-verified (a capture with a lost webhook is money with no record); the exception resolver refunds at the provider before checking the intent; the identity binding cannot pass BEFORE INSERT (independently); the payer VAT base is not a sub-sum of the printed lines; the receipt's `tax_minor` equality is by construction only; the exposure window is 165 minutes, not 150, and a capture after a disable was not late by rule; two drivers of the late-capture provider refund | §5.2 `already_terminal` outside `pending` / `processing`; `p_captured_at` from the signed body and the sweeper at 75 minutes; 7-day `cancelled` re-verify; §6.3 two-phase resolution + `superseded`; §5.4 pre-generated id; §9.1 `standardBasePayer` once at the seam + discounted fixture; receipt VAT tie; D-MC-03 165 min + disable → late; `claim_refund_provider_call` |
| Provider / refund / receipt | 14 (2 high, 5 medium, 7 low): no durable claim before a provider refund call (Flutterwave has no list: two drivers = two refunds, a crash = a refund that never completes); the M2 late-capture claim creates a non-NGN refund row against the NGN-only CHECK two steps before M4 (raise loop); `failed` after `succeeded` (independently); the sweeper's table needs the raw provider status and `notFound`, which the contract lacks; `failed` intents never leave the sweep set; a customer-borne Paystack fee makes `fee_unreported` red for ever and the catch-up posts the surcharge as our fee; a refund-side `amount_mismatch` has no resolver action that can complete it; `credit_note_pending` strands studio/care partial refunds; `uuid5` is not callable on the chain or in `payments_private`'s search path; two incompatible resolver signatures; the dedup / figure-check order was unpinned; refund-side exceptions not deduplicated and a Flutterwave transport failure logged as a bad signature; a chargeback during an in-flight refund; the callback page shows "succeeded" on a mismatch | §5.2 `claim_refund_provider_call` + sweeper-only driver; refund-row widening moved to M2 + non-raise claim result; §6.6 contract additions; `failed → cancelled` after the window; §6.5 `customer_borne`; §6.3 adoption of the provider figure; §8.3 by allocation kind; `md5` key; one signature; dedup-first + per-kind exception key + idempotent `record_payment_exception`; 500 on transport failure; §6.7 `dispute_during_refund`; finalize `status: 'exception'` + §4.5 open-exception line |
| Wallet / payout / CI / build order | 9 (2 high, 4 medium, 3 low): the identity clause unsatisfiable (independently); `payment_intent_id` exists nowhere and the CI funding-request table lacks `metadata` — the M-NOW migration could not apply at `ci.yml:211` as written; `topup_not_credited` refused the one safe refund (full) and finance had no way to run the sync for a user; three of the five "amended readers" would be vacuous before the readers migration; every new RPC refusal becomes a per-page-load retry loop in the reconcilers; MC-CI-10's non-NGN negative rows cannot be seeded under the M1 CHECK; `credit_wallet_topup` assigned to two steps; the backfill could bind a staged division intent; `post_withdrawal_fee_correction` re-admits the refused figure | §5.4 / §7.1 column + index + guarded backfill (`division = 'account'` only); `topup_not_credited` partial-only + full refund cancels the request + owner sync route; §4.1 p7 + mc6 only; §7.1 terminal `needs_review`; MC-CI-10 seeds under a dropped CHECK; §4.3 M-NOW owns `credit_wallet_topup`; §7.3 correction guards |

New in this revision: LF-10 and D-MC-16 (studio and care revenue + output VAT on every path).

### Round 5 — 30 findings (0 critical, 4 high, 10 medium, 16 low); all fixed in revision 6

All five lenses ran to completion from the files. One finding is live on `main` (LF-11); one
corrects the grounding itself (the care app's own ledger).

| Lens | Findings | What changed in the design |
|---|---|---|
| Claims auditor | 5 (0 high, 1 medium, 4 low): the care app runs a second double-entry ledger (`care_journal_entries`: NGN, major units, no VAT account) that LF-10 described as "posts nothing" and the design never mentioned — on a care card sale the cash is recorded in both books; four anchors (an ambiguous `20260627120000` prefix, the fixture lines, `division-sale.ts:83`, the CI job's extent) | §1.1 care-ledger row; LF-10, M6, D-MC-16 and §13 reworded around which book is the record; anchors corrected |
| Ledger / VAT / reporting | 4 (1 high, 2 medium, 1 low): after a partial refund before the sale, the LF-6 catch-up posts the right books but `finalizeSettled` still releases the order and the vendor payout at the full gross (MC-INV-14 and §4.3 contradicted each other); the credit-note dispatch had no "no allocation row" case and the catch-up's `credit_note_already_issued` raise would loop `reconcileDivisionSale`; a lost chargeback stayed in cash and VAT with the soak gate green; `post_fee_correction` had no precondition, so a correction on the wrong intent posted a second fee | `post_sale_revenue` returns `refunds_present` → `needs_review`, MC-INV-14 reworded; §8.3 no-row case + mint-or-verify + finance action; §6.7 outcome + lost-dispute posting + cap; §4.3 fee-correction guard |
| FX / rounding / units / status | 6 (0 high, 1 medium, 5 low): the late-capture exception row was refused by the design's own `record_payment_exception` rule and had no closure; `failed` on a `pending` intent would raise on A2 (no `pending → failed`); legacy `failed` dedup rows keep the bare key, so a later capture on an old session is swallowed as `duplicate`; the customer-borne surcharge was never refunded on a late capture; a restart cancelled a completable session blind; the recomputation clause was NULL-vacuous for a currency without an exponent row | §5.2 direct insert before the status write + closure on the full refund; the in-transaction advance; the M-NOW re-key; surcharge-inclusive refunds (D-MC-14); the verify-first restart; `into strict` + `coalesce` + FK |
| Provider / refund / receipt | 9 (2 high, 4 medium, 3 low): an exception refund had no durable row (the cap trigger refuses a `payment_refunds` row for an uncaptured intent) and `cancelled` was written before the provider confirmed the refund; refund-side exceptions were unclaimable under the charge-side status rule; **LF-11** — the staff route unwinds a refund on a retryable transport error after the provider created it (live on the NGN rail); the refund block lifted at dispute closure instead of outcome; no hold on a charged-back top-up; a failed full refund of an uncredited top-up left the request invisible; Flutterwave's refund currency check against the intent rather than the confirmed figure; the resolver committing against a refused inner call; credit notes lost on a transient failure | §6.3 `exception_refunds` + kind-dispatched phase one + `cancelled` on confirmation; §8.1 LF-11 rule + `refund_after_failed`; §6.7 outcome, posting, cap, hold; §7.1 `cancelled_by_refund` restore; the resolver raises unless applied; `credit_note_pending` on every apply + soak gate |
| Wallet / payout / CI / build order | 6 (1 high, 2 medium, 3 low): the request was to be bound **before** the intent existed, through a plain foreign key over two auto-committed PostgREST statements (23503 on every fresh top-up of the live rail); a credit and a full refund could both commit with no intent lock and an id-only `finalizeVerified`; the failed-full-refund stranding (independently); the MC-CI-10 CHECK re-add would fail validation; the backfill referenced division tables absent at `ci.yml:211`; the studio and care flips were told to call a `payments_private` RPC with no direct-pg rail | §5.4 insert-then-bind + port self-heal; §7.1 intent lock + CAS; savepoint seeding; no division-table reference; the shared pooled-pg client in M-NOW (4) |

New in this revision: LF-11; `exception_refunds`; the dispute outcome, posting, cap and
wallet-funding hold (D-MC-10 narrowed to representment, fees and cross-currency chargebacks); the
care-local ledger in §1.1 (D-MC-16 widened to which book is the record); `refunds_present` and the
reworded MC-INV-14; `chargebacks` in the chart.

### Round 6 — 36 findings (0 critical, 7 high, 12 medium, 17 low); all fixed in revision 7

All five lenses ran to completion from the files. No new live finding on `main`; most of the round
attacked the constructs revision 6 added (the dispute posting, the exception refund row, the
surcharge rule, the late-capture claim key) and found them under-specified.

| Lens | Findings | What changed in the design |
|---|---|---|
| Claims auditor | 10 (0 high, 1 medium, 9 low): the studio table is created by the SEC-HARDEN-03 seed at `ci.yml:305`, not `:331`; nine line-range nits (the orphan return at `:510`, which refund-RPC refusals return and which raise, the release posting, the §8.4 orphan branch, the studio imports, the care chart table, the seam script's `processing` seed, proof d's CI step, the seam script as a second `post_sale_revenue` caller) | anchors corrected; §6.3 states which refusals return and which raise |
| Ledger / VAT / reporting | 6 (3 high, 2 medium, 1 low): no allocator read `payment_disputes`, so a lost dispute on an unallocated intent was credited or released afterwards (a double loss); the lost-sale posting counted the loss twice (`chargebacks` plus the reversal) and stranded a clearing credit; the amended cap in the trigger would refuse a refund in flight on its `refund.processed` and loop; the marketplace recovery branch and defensive shortcut release without the RPC; neither care-book option was implementable as listed; the §4.5 identities ignored dispute holds, lost disputes and fee corrections | §7.1 `dispute_open` / `dispute_lost` in all three allocators + `disputes_present`; §4.3 one `dispute_loss` entry with the debit by allocation; §6.7 cap at initiation only, shared remainder; every marketplace completion path checks; §11 M6 spine-settled care branch; §4.5 identities extended |
| FX / rounding / units / status | 5 (2 high, 2 medium, 1 low): the customer-borne whole-transaction refund was refused by `apply_refund_webhook` as `amount_mismatch` (row vs `amount + surcharge`); the deterministic late-capture refund key made every re-drive answer `duplicate` for ever; the restart cancelled a live session inside the window; the resolver's cancel put provider-refunded intents into the 7-day re-verify set; Flutterwave `created_at` has attempt, not capture, semantics | `surcharge_minor` column, the figure compared on the sum, the surcharge leg posted; attempt-keyed claim with the balance check; 409 `payment_in_progress` inside the window; re-verify exclusion + `refunded_at_provider`; capture bounds |
| Provider / refund / receipt | 10 (2 high, 4 medium, 4 low): `refund_after_failed` had no resolution path (`apply_refund_webhook` selects `processing` rows only); a Paystack row with no reference and an empty list was stuck at 503 for ever; a customer-borne webhook with `fees: null` became an `amount_mismatch`; the provider-call claim did not re-check the intent, so a capture applied between phase one and the call could be refunded and `succeeded → cancelled` attempted; the surcharge pair match; the re-verify set (independently); two queued exception refunds per intent; the adopt match of an older processed entry; `topup_crediting` blocked the full refund of a credited top-up; a lost dispute left the receipt with no credit note | `refund_reinstated`; `provider_never_created` on two empty lists; `customer_borne_unverified`; the claim CAS on the intent status + `refund_after_success`; queued uniqueness; adopt exclusions by claim time; `verified` → the hold branch; the dispute credit note |
| Wallet / payout / CI / build order | 5 (0 high, 3 medium, 2 low): the CI bootstrap shape change was scheduled after the M-NOW gate that needs it (42703 on `metadata`); the version-order replay cannot run the whole directory on the chain DB; the `processing → cancelled` edge the exception resolver needs was scheduled in M2; a negative payout fee was clamped to 0 with no marker; `payment_refunds` has no `metadata` column for the stamps | bootstrap shape + default grant in M-NOW (12); the replay scoped to the chain's file set and the shadow; the cancel edges in M-NOW (8); negative fee → `fee_unreconciled`; the `metadata` column in M-NOW (10) |

New in this revision: no new LF or D-MC; `exception_refunds` queued-uniqueness and the claim CAS;
`refund_reinstated`, `refund_after_success`, `provider_never_created`, `refunded_at_provider`,
`customer_borne_unverified`, `payment_in_progress`; one `dispute_loss` entry; the care spine-settled
branch; the bootstrap shape change and the cancel edges in M-NOW.

### Round 7 — pending (launched against revision 7)
