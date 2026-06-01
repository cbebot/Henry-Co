# V3 Legal & Business Prerequisites

**Pass:** V3 Strategic Architect (Phase E output)
**Compiled:** 2026-05-17
**Status:** Non-code prerequisites that block specific V3 passes. None of these are code changes — they are real-world filings, registrations, contracts, and signatures.

This is the list of things owner+lawyer+accountant work on in parallel with engineering. Each item names what's needed, why, which Pass IDs it blocks, and a recommended acquisition order.

---

## How to use

1. Skim the table at the top to see what blocks what.
2. Each item then has a section with: requirement, blocks, recommended provider/path, owner action.
3. Items are sequenced by criticality, not by phase. Some early items unblock multiple later items.
4. As items close, mark them `**Closed YYYY-MM-DD:** <evidence/reference>`.

---

## Summary table

| # | Item | Category | Blocks Pass IDs | Recommended order |
|---|---|---|---|---|
| L1 | Legal entity per operating country | Corporate | V3-14, V3-15, V3-16, V3-19, V3-22, V3-65, V3-66, V3-93 | 1 (Nigeria already exists; do this for any new market) |
| L2 | Tax registration per country (VAT/GST/sales) | Tax | V3-21, V3-69, V3-84, V3-85 | 2 |
| L3 | Money-handling license / EFTSP (where required) | Compliance | V3-13, V3-17, V3-22 | 3 |
| L4 | Payment provider merchant approval (Paystack + Flutterwave + Stripe) | Provider | V3-14, V3-15, V3-16, V3-23 | 4 |
| L5 | KYC/AML provider contract (Smile Identity / Onfido) | Vendor | V3-24, V3-50, V3-67 | 5 |
| L6 | Privacy notices, terms, contracts per market | Compliance | V3-25, V3-67, V3-69, V3-93 | 6 |
| L7 | Gaming licenses / formal legal opinion per market | Compliance | V3-65, V3-66 | 7 (defer if D2 = Option B) |
| L8 | Insurance (E&O, cyber, marketplace seller liability) | Risk | V3-50, V3-67, V3-69 | 8 |
| L9 | App Store + Play Store developer accounts | Distribution | V3-88 | 9 (do early for parallel review time) |
| L10 | Trademark filings (HenryCo wordmark, monogram, "HenryCo Intelligence") | IP | (anti-clone hardening) | 10 (do as early as budget allows; trademark registration takes months) |
| L11 | Sender-domain reputation setup (SPF, DKIM, DMARC per division domain) | Operational | V3-46, V3-48, V3-61 | 11 |
| L12 | Bank account per operating country (with money-flow capacity for marketplace payouts) | Financial | V3-69 | 12 |
| L13 | AI provider terms-of-service review (Anthropic + OpenAI contracts) | Vendor | V3-26 | 13 |
| L14 | Customer-data processing addendum (DPA) per provider | Privacy | V3-93 | 14 |
| L15 | Anti-money-laundering (AML) program + transaction monitoring (where required) | Compliance | V3-17, V3-22, V3-65 | 15 |
| L16 | Data residency commitments per market | Compliance | V3-84, V3-93 | 16 |
| L17 | Cookie + tracker consent banner compliance (per market) | Privacy | V3-93 | 17 |
| L18 | Refund + dispute policy published (per market) | Operational | V3-19, V3-25 | 18 |

---

## L1 — Legal entity per operating country

**Requirement:** A locally registered company with the capacity to invoice customers, pay providers, hold bank accounts, and accept payment-provider merchant agreements.

**Why:** Payment providers (Stripe, Paystack, Flutterwave) require a legal entity registered in their accepted jurisdictions. KYC vendors require a corporate customer. Tax authorities require a registered taxpayer. Privacy regulators (NDPR, GDPR) require a registered controller.

**Blocks:** V3-14, V3-15, V3-16, V3-19, V3-22, V3-65, V3-66, V3-93.

**Current state:** Nigeria registered entity is **Henry Holdings Limited**. CAC name availability has been confirmed and the registration filing is in process as of 2026-06-01; use this legal entity on payment, invoice, receipt, KYB, KYC, privacy, terms, tax, and provider-onboarding surfaces. International entities are not yet established.

**Recommended path:**
- Nigeria: already in place; verify CAC registration current.
- For each additional market: form a local entity OR contract a merchant-of-record (MoR) provider (Lemon Squeezy, Paddle, Polar) that holds the entity for you and handles tax + compliance globally.

**Owner action:** confirm Nigeria entity in place; defer international entity formation until D10 (per-market commitment) decided.

---

## L2 — Tax registration per country

**Requirement:** VAT (Nigeria 7.5%), GST (where applicable), sales tax (US per-state), or equivalent.

**Why:** Without registration, V3-21 (tax engine) cannot compute tax on invoices, and HenryCo accumulates a tax liability without a remittance path.

**Blocks:** V3-21, V3-69 (partner payouts must withhold tax forms), V3-84, V3-85.

**Recommended path:**
- Nigeria: register for VAT with FIRS if not already. Threshold-exempt status check.
- International: register only when revenue in that market exceeds the country's threshold (e.g., UK £85k VAT threshold).

**Owner action:** owner + accountant confirm Nigeria VAT registration current; track turnover per country for future thresholds.

---

## L3 — Money-handling license / EFTSP (where required)

**Requirement:** Depending on how money flows through the wallet, HenryCo may need to register as an Electronic Funds Transfer Service Provider or similar. In Nigeria, the CBN regulates this. In US, money-transmitter licensing per state. In EU, PSD2/EMI licensing.

**Why:** Holding customer funds in a HenryCo wallet (i.e., the wallet balance is HenryCo's liability) typically triggers money-transmitter regulation. Using a licensed payment provider as the funds-holder (Paystack-managed escrow) sidesteps this but limits operational flexibility.

**Blocks:** V3-13 (provider router), V3-17 (ledger architecture), V3-22 (finance dashboard scope).

**Recommended path:**
- For V3 launch: HenryCo wallet balance held in a provider's escrow account (Paystack/Flutterwave); HenryCo is not a money-transmitter; ledger tracks user-balance claims against the escrow pool.
- Future: if scale demands holding funds directly, pursue licensing per market.

**Owner action:** lawyer confirms the provider-escrow model is sufficient for V3 launch in Nigeria; document the model in V3-17 prompt.

---

## L4 — Payment provider merchant approval

**Requirement:** Each payment provider requires merchant onboarding, KYB (know-your-business) checks, sometimes board director KYC, business-document upload, expected-volume disclosure.

**Why:** Provider integration code (V3-14, V3-15, V3-16) cannot deploy without live merchant accounts.

**Blocks:** V3-14, V3-15, V3-16, V3-23.

**Recommended path:**
- Paystack: standard NG business onboarding; usually 3–10 business days.
- Flutterwave: same.
- Stripe: requires US, UK, or EU entity. Defer until L1 international entity decision.

**Owner action:** apply Paystack + Flutterwave merchant accounts now; collect required documents.

---

## L5 — KYC/AML provider contract

**Requirement:** Vendor contract with chosen KYC provider (per D6 decision).

**Why:** V3-24 cannot integrate without contract + API credentials.

**Blocks:** V3-24, V3-50 (verified provider model), V3-67 (partner onboarding).

**Recommended path:** Smile Identity for Nigeria/Africa, Onfido as backup or international.

**Owner action:** sign contract with chosen vendor; receive API credentials.

---

## L6 — Privacy notices, terms, contracts per market

**Requirement:** User-facing terms of service, privacy notice, cookie policy, acceptable-use policy. Per-market variations where law requires (GDPR for EU, CCPA for California, NDPR for Nigeria).

**Why:** Cannot ship V3-25 (moderation), V3-67 (partner contracts), V3-69 (payout tax forms), V3-93 (privacy data rights) without legally reviewed policies.

**Blocks:** V3-25, V3-67, V3-69, V3-93.

**Recommended path:**
- Engage Nigerian + international privacy counsel.
- Generate base templates via Termly / Iubenda / counsel-drafted; lawyer reviews for HenryCo-specific clauses.
- Publish at `/legal/terms`, `/legal/privacy`, `/legal/cookies`, `/legal/acceptable-use`.

**Owner action:** engage counsel; commission draft policies; review and ship.

---

## L7 — Gaming licenses / formal legal opinion per market

**Requirement:** Depending on D2 decision and per-market gambling/gaming laws.

**Why:** Cash-staked PvP gaming is regulated as gambling in most jurisdictions. Required for V3-65, V3-66.

**Blocks:** V3-65, V3-66.

**Recommended path (only if D2 = Option A or C):**
- Engage gaming-law counsel per market.
- Obtain formal legal opinion letter.
- Apply for license where required (e.g., Nigeria LSLGA for Lagos State, NSCDC nationally).

**Owner action (if D2 ≠ Option B):** budget for legal opinion letters per market; expect 3–6 months per market.

---

## L8 — Insurance

**Requirement:** Errors-and-omissions, cyber-liability, marketplace seller liability insurance.

**Why:** Risk transfer for partner-payment, KYC-failure, data-breach, marketplace dispute scenarios. V3-50 (verified provider model) creates duty-of-care exposure.

**Blocks:** V3-50, V3-67, V3-69.

**Recommended path:**
- Engage African insurance broker (AXA, Leadway).
- Quote E&O + cyber + marketplace.
- Annual policies.

**Owner action:** budget for premiums; obtain quotes; bind policies before V3-50 launch.

---

## L9 — App Store + Play Store developer accounts

**Requirement:** Apple Developer Program ($99/yr) + Google Play Console ($25 one-time) accounts under HenryCo legal entity.

**Why:** V3-88 (store submission) requires accounts in HenryCo's name. Review takes time even for established companies.

**Blocks:** V3-88.

**Recommended path:**
- Apply Apple Developer Program now (use legal entity name, not personal).
- Apply Google Play Console now.
- Pre-fill app metadata, screenshots, privacy disclosures; smoke-submit a development build to learn the review workflow.

**Owner action:** apply both accounts immediately even if mobile work is months away.

---

## L10 — Trademark filings

**Requirement:** Register HenryCo wordmark, monogram, and "HenryCo Intelligence" trademark.

**Why:** Trademark registration is a multi-month process. Anti-clone defense + brand protection require registered marks. Without registration, defensive enforcement is weak.

**Blocks:** Cross-cuts anti-clone hardening (ANTI-CLONE.md).

**Recommended path:**
- File in Nigeria (NIPC) first.
- File international via Madrid Protocol if international expansion is on the roadmap.

**Owner action:** engage trademark counsel; file Nigeria filings within 30 days.

---

## L11 — Sender-domain reputation setup

**Requirement:** SPF, DKIM, DMARC records configured per division domain (`care@henrycogroup.com`, `marketplace@...`, etc.) plus subdomain warm-up.

**Why:** Email deliverability is foundational for V3-46 (owner reports), V3-48 (follow-up campaigns), V3-61 (newsletter).

**Blocks:** V3-46, V3-48, V3-61.

**Recommended path:**
- Configure SPF + DKIM + DMARC on every division sender domain.
- Verify with Resend / Brevo dashboards.
- Warm up new senders with low-volume staff-only sends before broadcasting.

**Owner action:** verify current state with Resend dashboard; configure missing records.

---

## L12 — Bank account per operating country

**Requirement:** Business bank accounts with capacity to receive payouts from payment providers and disburse to partners/sellers.

**Why:** V3-69 (partner payouts) requires HenryCo-owned bank accounts to disburse from.

**Blocks:** V3-69.

**Recommended path:**
- Nigeria: existing business account (verify Naira-volume capacity).
- International: bank account in any country with international entity (L1).
- Alternative: Wise Business multi-currency account.

**Owner action:** confirm Naira business account exists; verify monthly volume capacity.

---

## L13 — AI provider terms-of-service review

**Requirement:** Legal review of Anthropic + OpenAI ToS for commercial deployment, data-handling, IP indemnification.

**Why:** V3-26 (AI provider router) cannot deploy without legal-cleared usage. Especially relevant: training opt-out, customer-data handling, content-policy compliance.

**Blocks:** V3-26.

**Recommended path:**
- Sign Anthropic commercial agreement (with no-train, data-handling addendums).
- Sign OpenAI commercial agreement (similar).
- DPA per L14.

**Owner action:** legal reviews each provider ToS + signs.

---

## L14 — Data processing addendum (DPA) per provider

**Requirement:** DPA executed with every data-processor (Supabase, Vercel, Cloudinary, Resend, Brevo, Sentry, Typesense, OneSignal, Anthropic, OpenAI, KYC vendor, payment providers).

**Why:** GDPR/NDPR require DPAs with sub-processors. V3-93 (privacy data rights) cannot certify without these.

**Blocks:** V3-93.

**Recommended path:** counsel-templated DPA; sign with each processor.

**Owner action:** inventory current DPAs; close gaps.

---

## L15 — Anti-money-laundering (AML) program

**Requirement:** Where regulation applies (any market with money-transmitter rules or where HenryCo holds custodial funds), a documented AML program including transaction monitoring, suspicious-activity reporting, sanctions-list screening.

**Why:** Ledger hardening (V3-17), finance dashboard (V3-22), gaming arena (V3-65) cannot operate compliantly without AML program where required.

**Blocks:** V3-17 (production), V3-22, V3-65.

**Recommended path:**
- If using provider-escrow model (per L3), AML is largely the provider's burden; HenryCo's program is light-touch (sanction screening, fraud monitoring per V3-40).
- If holding funds directly, full AML program required.

**Owner action:** depends on L3 path; counsel scopes the program.

---

## L16 — Data residency commitments per market

**Requirement:** Some markets (Russia, China, India, EU under GDPR for special-category data) require data stored in-country.

**Why:** V3-84 (global localization), V3-93 (privacy data rights).

**Blocks:** V3-84, V3-93.

**Recommended path:**
- For V3 (Nigeria-primary): Supabase region near Nigeria (EU or US-East); document where data resides.
- International: revisit when D10 commits a market.

**Owner action:** document current Supabase region; defer international until D10.

---

## L17 — Cookie + tracker consent

**Requirement:** Cookie banner with consent management per market.

**Why:** V3-93 (privacy data rights); also EU/UK/California legal exposure if tracking happens without consent.

**Blocks:** V3-93.

**Recommended path:**
- For V3 Nigeria-primary: NDPR-compliant consent banner.
- If international expansion in D10: full Consent Management Platform (Cookiebot, OneTrust, Iubenda).

**Owner action:** select CMP if international; ship NDPR-compliant banner for Nigeria.

---

## L18 — Refund + dispute policy published

**Requirement:** Published refund and dispute resolution policy covering payment providers' chargeback windows, marketplace seller defaults, service cancellation refund windows.

**Why:** V3-19 (refunds + reconciliation), V3-25 (content moderation) cannot fully ship without published policy.

**Blocks:** V3-19, V3-25.

**Recommended path:** counsel-drafted; published at `/legal/refund-policy`.

**Owner action:** commission draft; review; ship.

---

## Recommended acquisition order

If owner can only fund the legal/business work in order, this is the critical path:

1. **L1** (Nigeria entity verify) — week 0
2. **L4** (Paystack + Flutterwave merchant onboard) — week 1–3
3. **L11** (sender-domain reputation) — week 1
4. **L9** (App Store + Play Store accounts) — week 1
5. **L13 + L14** (AI provider contracts + DPAs) — week 2–4
6. **L5** (KYC vendor contract) — week 2–4
7. **L10** (trademark filings) — week 2 (long lead time; start early)
8. **L2** (Nigeria VAT confirm) — week 3
9. **L6** (privacy + terms drafted) — week 3–8
10. **L18** (refund/dispute policy) — week 4
11. **L12** (bank-account volume capacity verified) — week 4
12. **L8** (insurance quotes + bind) — week 6–10
13. **L17** (consent banner) — week 8
14. **L3** (provider-escrow model documented + reviewed) — week 8
15. **L15** (AML program scoped) — week 10
16. **L7** (gaming legal opinion, IF D2 ≠ Option B) — week 12+
17. **L16** (data residency commit, IF international) — when D10 decided

---

## Self-verification

- [x] 18 non-code prerequisites enumerated
- [x] Each has requirement + why + Pass IDs blocked + recommended path + owner action
- [x] Acquisition order recommended with rough weeks
- [x] Cross-references to PASS-REGISTER.md and DECISIONS-REQUIRED.md
- [x] Closeable inline ("Closed YYYY-MM-DD: <evidence>")
