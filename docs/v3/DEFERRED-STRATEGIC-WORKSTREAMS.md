# V3 Deferred Strategic Workstreams

**Pass:** V3-BACKLOG-RECORD-01 (strategic backlog capture)
**Compiled:** 2026-06-15
**Author:** Claude · Opus 4.8 · ultracode (max effort)
**Status:** Authoritative record of strategic workstreams the owner has named but deliberately deferred past the Nigeria-first core launch. Each is real scope. None is "maybe" — they are **scheduled later, not dropped**. This file holds the deps, gates, and sequencing so no future session loses them.

This document does **not** renumber the 96-pass `PASS-REGISTER.md`. These workstreams either (a) refine/expand passes that already exist (multi-currency expands V3-14/21/69/84/85; Flutterwave payouts advances V3-69), or (b) are genuinely new and earn a `V3-NN` number only when scheduled (the owner AI portal). Until then they live here under a `W#` namespace and back-link to the passes they touch.

---

## ⚠️ READ THIS FIRST — the close-blocker

> **W1 — International multi-currency is a MANDATORY pre-close requirement, not an enhancement.**
>
> Launch Nigeria-first in NGN. That is correct and sequenced. **But V3 is NOT complete and MUST NOT be closed** — `V3-95 closure-launch-readiness` cannot be signed, `V3-96 closure-v3-showcase` cannot ship — **until customers worldwide can see prices, pay, and get paid in their own currency.** This spans a global processor, a real multi-currency pricing engine (not FX approximations), multi-currency settlement + international payouts, multi-jurisdiction tax, **and** a non-code banking/regulatory buildout (forex accounts, cross-border licensing, per-market tax registration) that legal + banking own.
>
> Owner's words, recorded verbatim in intent: *"launch NGN-first, but the project is not complete and must not be closed without this."* Any session that proposes "V3 is done" without W1 closed is **wrong**. See `W1` below, `D18` in `DECISIONS-REQUIRED.md`, and `L19`/`L20` in `LEGAL-AND-BUSINESS.md`.

---

## How to use this doc

1. Skim the summary table to see what is deferred, what gates it, and which existing passes it touches.
2. Each workstream then has a section with: what it is, why it's deferred, components, dependencies, gates, sequencing, and the owner decision that authorizes it.
3. As a workstream is scheduled, mint its `V3-NN` pass(es) in `PASS-REGISTER.md`, write the prompt(s) under `prompts/`, and mark the row here `**Scheduled YYYY-MM-DD → V3-NN.**`
4. As a workstream closes, mark it `**Closed YYYY-MM-DD:** <evidence/PR>`.

---

## Summary table

| # | Workstream | Class | Gates on | Maps to passes | Owner decision | Sequencing |
|---|---|---|---|---|---|---|
| **W1** | **International multi-currency** | **⚠️ CLOSE-BLOCKER** | NG-core launch proven; likely after Phase D | V3-14, V3-16, V3-21, V3-69, V3-84, V3-85 + L1/L2/L3/L12 + **L19/L20** | **D18** + D1 + D10 | After NG-core launch + proven; before V3-95/V3-96 closure |
| **W2** | **Flutterwave payouts (money-out)** | Money-grade | Division checkout live + real revenue to distribute | V3-69 (advances), V3-17 (ledger), V3-19 (reconcile) | **D19** | After division checkout live + provider/seller revenue exists |
| **W3** | **Owner's personal AI portal** | New (Phase D+) | Core launch; AI phase foundation (V3-26) | New pass(es); reuses V3-26 router; distinct from V3-28..V3-33 (customer) and V3-46 (auto-reports) | **D20** + D3 | After core launch, within/after the AI phase (Phase D) |
| **W4** | **Marketplace-LIVE VAT gate** | Money gate | V3-21 output-VAT in place | V3-21, V3-VAT settlement seam, division checkout | (covered by D5) | Blocks marketplace card checkout TEST→LIVE flip |
| **W5** | **Per-division checkout-activation pattern** | Pattern/playbook | Per-division: W4 (VAT) + soak | V3-13, V3-15, V3-16; division `cardCta` seam | (per-division operational) | One division at a time on the proven rail |

---

## W1 — International multi-currency ⚠️ MANDATORY BEFORE PROJECT CLOSE

**What it is:** Customers anywhere in the world see prices in their own currency, pay in their own currency, and (for providers/sellers) get paid out in their own currency. This is the owner's hard rule for what "finished" means. NGN-first launch is the deliberate first step; global-currency parity is the finish line.

**Why deferred:** Premium quality in one market (Nigeria, NGN) beats spread-thin coverage in twelve. The disciplined path is to prove the NG-core money spine end-to-end (real payments, ledger, receipts, refunds, payouts) before paying the very large cost — code **and** banking/regulatory — of true multi-currency. Deferral is sequencing, not descoping.

**Components (all five are required for "closed"):**

- **(a) A global processor — Stripe.** This is the deferred provider in `D1` ("defer Stripe until first market with significant card volume outside Africa" / "Stripe is the right second wave for international scaling"). Activates `V3-14 payments-stripe-activation` (Apple/Google Pay + Stripe Connect for payouts + signed/idempotent webhooks). Requires an international legal entity (L1) and Stripe merchant approval (L4).
- **(b) A real multi-currency pricing engine — NOT FX approximations.** Genuine per-currency prices (a product/service is priced *in* USD/GBP/EUR/etc.), with per-market rounding and presentation rules — not a runtime FX conversion of an NGN base price. Today multi-currency is **display-only** (the wallet's `lib/wallet-currency.ts`, dormant until an FX-rate app id is set); that is an approximation layer, explicitly **not** what W1 requires. This is net-new pricing infrastructure. Expands `V3-84 global-localization-maturity` (currency rounding rules) and underpins V3-21 tax-on-price.
- **(c) Multi-currency settlement + international payouts.** Money moves in and out in multiple currencies: settle customer payments in-currency, hold/convert as policy dictates, and pay providers/sellers out in their currency. Builds on `V3-69 partner-payouts` (per-country payout rails), `V3-85 global-per-market-payment-routing`, and **W2** (the payout rail itself). Requires forex/multi-currency banking (L12 + **L19**).
- **(d) Multi-jurisdiction tax.** EU VAT (incl. OSS one-stop-shop), US sales tax (per-state nexus), UK VAT, and other per-market regimes — beyond the Nigeria-VAT-first scope that `V3-21 payments-tax-engine` (per `D5`) starts with. This is V3-21's international expansion + per-market tax registration (**L20**). The "drop in a vendor (Avalara/Stripe Tax) when international markets demand it" option in `D5` is the natural escalation path here.
- **(e) The non-code banking/regulatory buildout — owner + legal + banking, NOT a coding task.** Forex/multi-currency bank accounts, cross-border money-movement licensing (money-transmitter/EMI/PSD2 where applicable), and per-market tax registration. Recorded as **L19** (forex/cross-border banking + licensing) and **L20** (per-market tax registration) in `LEGAL-AND-BUSINESS.md`, extending existing L1/L2/L3/L12. **Flag loudly:** this track has long lead times (licensing + banking can take many months) and must start well before the engineering can ship — it is on the critical path to close.

**Dependencies:** NG-core money spine proven live (V3-13→V3-19 closed + soaked); `D1` (Stripe activation), `D10` (per-market localization commitment), `D18` (this workstream's ratification). Tax depends on `D5` escalation. Banking/regulatory (L19/L20) depends on `D10` market choices.

**Gates / sequencing:** AFTER the NG-core launch is live and proven, and **likely after the intelligence phase (Phase D)** so the company has revenue + operational maturity before taking on multi-market complexity. **Hard gate:** W1 must close before `V3-95 closure-launch-readiness` is signed and `V3-96 closure-v3-showcase` ships. **Launch NGN-first; do not close V3 without W1.**

**Owner decision:** **D18** (international multi-currency close-blocker ratification + the banking/regulatory commitment + timing). Also reads on `D1` (Stripe) and `D10` (markets).

---

## W2 — Flutterwave payouts (money-grade, money LEAVING)

**What it is:** The rail that sends money **out** of HenryCo to providers, sellers, and (eventually) refis/withdrawals. Money leaving is the highest-stakes money operation there is — a payout bug spends real money irrecoverably. The same Flutterwave secret key that authorizes charges also authorizes **Transfers/Payouts**, so **no new credential is required** — the credential is already in the estate (see `INTEGRATION-KEYS.md`).

**Why deferred:** There is nothing to pay out until real provider/seller revenue exists to distribute. Payouts come **after** the inbound money path (division checkout) is live and producing distributable balances. Building the money-out rail before there is money to move would be premature and unsoakable.

**Components / requirements (money-grade rigor, same bar as the inbound spine):**

- A **balanced double-entry ledger** posting for every payout (builds on `V3-17 payments-ledger-hardening`).
- A **guarded, idempotent transfer RPC** — a transfer can never be issued twice for the same intent (idempotency key on the payout intent, not the provider txn id), service-role-gated.
- A **webhook-confirmed transfer lifecycle**: `queued → processing → success / failed`, with the ledger and balances reconciled to provider truth — never optimistic.
- **Issue-authorization** before any transfer: only an authorized path may initiate a payout — service-role-gated, behind the owner money-sign-off path, within configured per-transfer/per-day limits. (This is the *who/what may spend* gate, distinct from verifying the payee.)
- **Balance + payee verification** before issue: sufficient distributable balance, and the payee verified (KYC + bank-account verified).
- **Reconciliation**: a sweep that re-verifies in-flight transfers against the provider and resolves stuck/failed states (the same lesson as the inbound pending-intent strand — never trust an unconfirmed state).

**Dependencies:** `V3-17` ledger (live), `V3-19` reconciliation patterns, division checkout live (inbound revenue), payee verification (KYC — `V3-24`). Banking capacity (L12).

**Gates / sequencing:** AFTER division checkout is live **and** real provider/seller revenue exists to distribute. Requires explicit owner **money sign-off** (money-out is the highest-stakes change class). This workstream **advances `V3-69 partner-payouts`** — it is the Flutterwave-specific, near-term implementation of the payout rail that V3-69 (Phase H) generalizes across providers/countries; when scheduled it may be minted as a dedicated pass or folded into V3-69.

**Owner decision:** **D19** (Flutterwave payouts go-ahead + timing + the money-out sign-off).

---

## W3 — Owner's personal AI portal (Phase D+)

**What it is:** A private, owner-only AI command portal powered by the most capable Claude model (Opus 4.8). It does four first-class things — (1) **advises** the owner, (2) **assists** with company work, (3) **drafts** content, and (4) **manages the company's social presence** (human-in-the-loop, per the constraint below). It is **distinct** from the customer-facing "HenryCo Intelligence" surfaces (`V3-28`..`V3-33`) and from the automated `V3-46 workflow-owner-reports` — this is an **interactive**, owner-private, higher-capability assistant.

**Why deferred:** It rides on the AI phase foundation (the provider router, `V3-26`) and should land after the core launch, when the company has a real operating surface for the assistant to act on.

**CRITICAL CONSTRAINT — human-in-the-loop social (non-negotiable):**

- The AI **drafts, schedules, monitors, and suggests**. The **owner approves** every outward-facing action.
- It does **NOT** autonomously post or reply. Fully-autonomous posting/replying risks platform-ToS violations → **account bans** and brand damage. That risk is unacceptable for the company's own accounts.
- Social integration uses **Business/Creator accounts via official platform APIs**, operating **within each platform's automation rules** — never unofficial automation that violates ToS.

**Components:**

- An owner-only, access-gated portal (strongest auth + sensitive-action gating; owner identity only).
- An advisory/assistant surface over company data (respects RLS; reuses the `V3-26` provider router; provider name never surfaced per the standing constraint).
- Content drafting (posts, replies, copy) with an **explicit owner-approval step** before anything leaves the building.
- A scheduling + monitoring layer for social, integrated via official Business/Creator APIs, with the human-approval gate enforced in the action path (not just the UI).

**Dependencies:** `V3-26 ai-provider-router` (Phase D foundation), `D3` (AI provider selection), core launch complete. Reads on the owner-identity/sensitive-action gating already in the estate.

**Gates / sequencing:** AFTER core launch, **within or after the AI phase (Phase D)**. New scope — earns its own `V3-NN` pass(es) when scheduled (it is not covered by any existing pass).

**Owner decision:** **D20** (authorize the owner AI portal + ratify the human-in-the-loop social posture).

---

## W4 — Marketplace-LIVE VAT gate (ties to V3-21)

**What it is:** A gating rule, recorded so it is not forgotten: **marketplace card checkout cannot flip from TEST-mode to LIVE (real customer money) until output VAT is correctly computed, charged, and recorded** on every sale. The VAT *settlement* seam already exists on the ledger (fee/input VAT on the clearing seam), but charging and remitting **output VAT on the sale itself** is `V3-21 payments-tax-engine` (Nigeria VAT 7.5% first, per `D5`).

**Why it matters:** Taking real customer money for a taxable sale without correctly handling VAT creates a tax liability with no remittance path and a compliance exposure. The TEST-mode checkout is safe to demo; the LIVE flip is gated on V3-21.

**Dependencies / gate:** `V3-21` output-VAT in place (at least Nigeria scope) + VAT registration current (`L2`). Internationally, this rolls into **W1(d)** multi-jurisdiction tax.

**Owner decision:** covered by `D5` (tax engine) — no new decision; recorded here as a hard gate on the LIVE flip.

---

## W5 — Per-division checkout-activation pattern (playbook)

**What it is:** The repeatable pattern for igniting card checkout on each division (care, studio, marketplace, property, jobs, learn, logistics) **one division at a time** on the proven account rail — never a big-bang multi-division switch.

**The pattern:**

1. The **proven rail is on `origin/main`**: `packages/payment-router/` (V3-13), the double-entry ledger + VAT settlement seam, and the clearing→revenue RPCs (`post_sale_revenue`, `record_customer_receipt`). These are shipped and soaked.
2. The **ignition layer is the in-flight piece** (currently a worktree, not yet on main): a shared division-sale seam in the payment-router package and a per-division feature flag (e.g. an `*_CARD_CHECKOUT` flag) wired to each division's `cardCta` seam. The account webhook posts cash → clearing (division-agnostic); each division reconciles-on-read, allocating clearing → revenue via the existing RPCs. No new money RPC per division.
3. Each division ships **TEST-mode first** (flag on, test keys), proves end-to-end, then flips to **LIVE only after** its **VAT gate (W4)** is satisfied and a soak window passes.
4. Money flows stay **frozen-safe**: the proven proof/receipt/ledger flows are never reworked per division — only the thin `cardCta` ignition + flag is added.

**Why record it:** So every division activation follows the same money-safe playbook (shared seam, clearing-account model, per-division flag, TEST→VAT-gate→LIVE) instead of re-deriving a checkout per division.

**Dependencies / gate:** Per division — the ignition seam merged, the division `cardCta` wired, **W4** (VAT) before LIVE, soak before LIVE. Relates to `V3-13`, `V3-15`, `V3-16`.

**Owner decision:** per-division operational; each LIVE flip is owner-gated (real money).

---

## Recommended sequencing (where these sit relative to the 96 passes)

```
NG-core money spine (V3-13 → V3-19, soaked)
   └─ W5 per-division checkout activation (one division at a time; W4 VAT gate before each LIVE flip)
        └─ W2 Flutterwave payouts  (once real revenue exists to distribute; advances V3-69)

Phase D (AI: V3-26 → V3-33)
   └─ W3 owner personal AI portal  (after core launch; reuses V3-26; human-in-the-loop social)

Phase I closure (V3-94 → V3-95 → V3-96)
   └─ ⚠️ W1 international multi-currency MUST be closed before V3-95/V3-96
        (start L19/L20 banking + licensing EARLY — long lead time, on the critical path to close)
```

**Order of arrival:** W4/W5 are near-term (they gate the inbound LIVE flips). W2 follows once there is revenue to distribute. W3 follows the AI phase. **W1 is last in build order but FIRST in lead-time** — its banking/regulatory track (L19/L20) must begin long before the engineering, or it will block closure.

---

## Owner decisions cross-reference

New decisions added to `DECISIONS-REQUIRED.md` for these workstreams:

- **D18** — International multi-currency: ratify it as a mandatory pre-close requirement; commit to the banking/regulatory buildout (L19/L20); set timing relative to Phase D / closure. (Blocks W1 → blocks `V3-95`/`V3-96` close.)
- **D19** — Flutterwave payouts: authorize the money-out rail + timing + money sign-off. (Blocks W2; advances V3-69.)
- **D20** — Owner's personal AI portal: authorize it + ratify the human-in-the-loop social posture. (Blocks W3.)

Existing decisions these read on: `D1` (Stripe / provider activation), `D5` (tax engine), `D10` (per-market localization commitment).

---

## Legal & business cross-reference

New non-code prerequisites added to `LEGAL-AND-BUSINESS.md` for W1's banking/regulatory track:

- **L19** — Forex / multi-currency bank accounts + cross-border money-movement licensing (extends L1, L3, L12). Long lead time.
- **L20** — Per-market tax registration for international VAT/OSS + US sales tax (extends L2). Per-market.

---

## Self-verification

- [x] All three owner-named deferred workstreams recorded (W1 multi-currency, W2 Flutterwave payouts, W3 owner AI portal) with deps + gates + sequencing.
- [x] The international multi-currency **close-blocker** is flagged loudly at the top and tied to the closure passes (V3-95/V3-96) — impossible to miss.
- [x] The non-code banking/regulatory dimension of W1 is captured (L19/L20) and flagged as long-lead, on the critical path to close.
- [x] W2 records money-out rigor (balanced ledger, idempotent guarded RPC, webhook-confirmed lifecycle, balance/auth checks, reconciliation) + the "same secret key, no new credential" fact.
- [x] W3 records the human-in-the-loop social constraint and the official-API / Business-Creator-account posture as non-negotiable.
- [x] The marketplace-LIVE VAT gate (W4 → V3-21) and the per-division checkout-activation pattern (W5) are recorded.
- [x] Honest about ground truth: payment-router + ledger + VAT settlement + clearing RPCs are on `origin/main`; the division-sale ignition seam + per-division flag are in-flight (not yet on main).
- [x] Does not renumber the 96-pass register; maps workstreams to existing passes and reserves new `V3-NN` numbers for scheduling time.
- [x] Cross-referenced into PASS-REGISTER, MASTER-PLAN, DECISIONS-REQUIRED (D18–D20), LEGAL-AND-BUSINESS (L19–L20), OWNER-BRIEF, README.
