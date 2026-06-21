# V3 Program Status — Authoritative Ledger

**Pass:** V3-PROGRAM-LEDGER-01 (audit / tracking — documentation only, no feature code, no migration)
**Compiled:** 2026-06-21
**Author:** Claude · Opus 4.8 (1M context) · ultracode / max effort
**Method:** Ground-truthed against **git `origin/main`** (HEAD `2347eb1e`, 533 commits), the **prod Supabase ledger** (`rzkbgwuznmdxnnhmjazy`, `supabase_migrations.schema_migrations` — **98 applied rows**, latest `20260621120001`), the **repo migration files** (161 `.sql` across 9 app dirs), the **107 prompt files** in `docs/v3/prompts/`, and `docs/v3/DECISIONS-REQUIRED.md` (D1–D17). Verified by a 5-agent fan-out using live `to_regclass`/column probes and prod money-table sums.

> **This is the master "nothing-gets-lost" ledger.** Every one of the 96 register passes, both hardening passes, the 9 pre-V3 polish prompts, and every off-register named workstream is accounted for below. Every status claim cites a commit SHA, a migration-ledger row, or a live DB probe — never memory or a stale report. Where the repo/prod contradicts a prior report or memory, it is flagged in **Appendix C**.

> **Branch caveat (load-bearing):** the currently checked-out working branch `v3/typography-reading-foundation` is **168 commits / 35 migration files behind `origin/main`** and is missing much of the payments/pricing code. **All status in this document is measured against `origin/main`, the authoritative committed state** — not the working tree. This ledger was authored in a clean worktree off `origin/main`.

---

## Executive snapshot

| Dimension | Count | Note |
|---|---|---|
| Formal register passes (A–I) | **96** | + hardening V3-02b / V3-07b / V3-07c; + 9 pre-V3 polish prompts = **107 prompt files** total |
| **DONE + APPLIED** (formal) | **25** | all of Phase B (12) + C: 13/15/16/17/18/19/22/25 + E: 37 + G: 56/57/58/65(free-play) |
| **MERGED — NOT APPLIED** | **3** | V3-49, V3-70, V3-73 (code on `main`, migration absent from prod) |
| **DEFERRED — GATED** | **2** | V3-24 (D6 KYC vendor), V3-66 (D2 real-money legal) |
| **DROPPED / SUPERSEDED** | **1** | V3-21 (PR #296 closed-unmerged; replaced by off-register V3-VAT-CLASSIFICATION-01) |
| **PENDING** (not started) | **65** | all of Phase D, most of E/F, the G/H/I remainder + gated V3-14/20/23 |
| Hardening | 02b ✅done · 07c ✅done (as V3-DOMAIN) · **07b pending** | not phase blockers |
| Off-register workstreams shipped | **~30 families** | payments hardening, VAT, SEC-HARDEN 01–06, FL2, media, owner-inbox, KYC-vault, gaming, domain, reading, design — full catalog in §1.4 |
| Prod migrations applied | **98** | repo holds **161** files → **59 committed-not-applied**, **23 applied-not-in-repo**, **1 real version collision** (Appendix B) |
| Owner decisions answered in-file | **1 of 17** (D2) | several others (D1, D5, D11) are *de-facto resolved by shipped work* but not written down — §3 |
| Money flowing in prod today | **Yes** | marketplace commission + 7.5% VAT + processor-fee absorption live; FL2 8-file spine applied, books balance (Δ=0) — §2 |
| Hard launch blockers open | **4** | V3-94 final QA (unstarted), i18n native-translation, multi-currency (W1), mobile (Phase I) — §4 |

**One-sentence state:** Phase B (Foundation Lock) and the core of Phase C (Money & Identity spine — ledger, receipts, refunds, VAT, Flutterwave, moderation) are **done and live on prod**; Phases **D (AI), E, F, most of G, H, and all of I are unbuilt**; the program's launch is gated by four measured blockers (final integration QA, i18n native translation, multi-currency, mobile) plus a migration-drift reconciliation, and the AI phase is gated entirely by two unanswered owner decisions (D3 provider, D4 margin).

---

## 0. Legend

**Status values**
- **DONE+APPLIED** — merged to `origin/main` AND its migration (if any) is in the prod ledger AND functionally live (or intentionally flag-dark in prod with the dark state being the intended posture).
- **MERGED-NOT-APPLIED** — code on `origin/main` but its migration is **absent from the prod ledger** (the feature cannot work on prod until applied).
- **CODE-ONLY-SIDE-BRANCH** — committed to a branch, never merged to `origin/main`.
- **PENDING** — prompt exists; no merge evidence.
- **DEFERRED-GATED** — intentionally not built/activated, blocked on an owner/legal decision.

**Gate** = the owner decision (D1–D17), legal sign-off, or dependency that must clear. **Evidence** = PR# + short SHA on `origin/main`, and/or prod migration row, and/or live DB probe.

---

## 1. Per-phase status (every pass + every workstream)

### 1.1 Phase B — Foundation Lock (V3-01 → V3-12 + hardening) — **CLOSED**

| ID | Slug | Status | Evidence |
|---|---|---|---|
| V3-01 | foundation-session-persistence | DONE+APPLIED | #129 `1caf3897` (+#130 `217c66e4`); migs `v3_01_henry_events` 20260522124106 + anon-insert 20260522235600 applied |
| V3-02 | foundation-auth-reliability | DONE+APPLIED | #158 `11ffea5c` (no schema) |
| V3-02b | auth-public-shell-wirings (hardening) | DONE+APPLIED | #163 `c73bc8c4` |
| V3-03 | foundation-notification-message-states | DONE+APPLIED | #131 `d825cd60`; mig `v3_03_message_read_state` 20260523041459 + realtime 20260523073251 applied |
| V3-04 | foundation-deep-links | DONE+APPLIED | #166 `75a59dc0` |
| V3-05 | foundation-kill-loading-theater | DONE+APPLIED | #132 `0c33ffa2` (+#210 Onyx loader) |
| V3-06 | foundation-dead-link-sweep | DONE+APPLIED | #165 `bb301d46` (CI gate) |
| V3-07 | foundation-hardcoded-text-cleanup | DONE+APPLIED | #134 `9e192a3d` |
| V3-07b | operator-surface-i18n (hardening) | **PENDING** | plan-doc only (#136 `eb61a9e9`); ~1,305 GAPs unscoped; blocked **D17**; not a phase blocker |
| V3-07c | henrycogroup-domain-sweep (hardening) | DONE+APPLIED | shipped functionally as **V3-DOMAIN** #213 `0d6c76ef` (henrycogroup→henryonyx, zero runtime literals) |
| V3-08 | foundation-empty-dashboard-truth | DONE+APPLIED | #164 `cb03dd4e` |
| V3-09 | foundation-mobile-consistency | DONE+APPLIED | #135 `8396a93e` |
| V3-10 | foundation-logs-states-fallbacks | DONE+APPLIED | #133 `42c2562f` (+#152 RCA); Sentry on 10/10 apps, uniform `/api/health` |
| V3-11 | foundation-one-job-per-card | DONE+APPLIED | #167 `21190952` |
| V3-12 | foundation-lock-acceptance | DONE+APPLIED | #168 `d7214f46`/`4d1ea6bd` — **D11 gate cleared; Phase C proceeded** |

### 1.2 Phase C — Money & Identity Spine (V3-13 → V3-25)

| ID | Slug | Status | Gate | Evidence |
|---|---|---|---|---|
| V3-13 | payments-provider-router | DONE+APPLIED | — | #169 `0a8e5944` — mock-only/test-gated router scaffold (no schema) |
| V3-14 | payments-stripe-activation | **PENDING** | D1 | No adapter on `origin/main` (`stripe` is only a MockProvider). Stripe is **required for multi-currency W1** |
| V3-15 | payments-paystack-activation | DONE+APPLIED | D1 | #170 `bd6b45da` (+#220/#222/#224/#242); built & wired but **superseded by Flutterwave** in practice (zero Paystack prod traffic) |
| V3-16 | payments-flutterwave-activation | DONE+APPLIED | D1 | #276 `a58db2b9` — **the live rail**; registers when `FLW_SECRET_KEY` set; live-key cutover + 48h soak still **owner-gated** |
| V3-17 | payments-ledger-hardening | DONE+APPLIED | — | #250 `7cbf851a`; FL2 8-file manifest **applied+verified prod 2026-06-12**, books balance (Δ=0, 65 journal_lines) |
| V3-18 | payments-receipts-and-invoices | DONE+APPLIED | — | #251 `94fbc64e` (+#252); mig `v3_18_payment_documents` 20260607130000 applied |
| V3-19 | payments-refunds-and-reconciliation | DONE+APPLIED | — | #267 `a3c7775a` (+#268, +Paystack double-refund fix #272); mig `v3_19_refunds` 20260611130000 applied |
| V3-20 | payments-subscription-lifecycle | **PENDING** | D9 | never built |
| V3-21 | payments-tax-engine | **DROPPED/SUPERSEDED** | D5 | PR #296 **CLOSED-unmerged** (archived `v3/21-tax-rate-engine`); replaced by off-register **V3-VAT-CLASSIFICATION-01** (#297). Do **not** re-land |
| V3-22 | payments-finance-dashboard | DONE+APPLIED | — | #283 `b6b42ee6` (+#285 service-role read); owner-only read-only ledger console (no schema) |
| V3-23 | payments-native-app-compliance | **PENDING** | D8 | never built (depends on mobile stack) |
| V3-24 | identity-kyc-vendor-integration | **DEFERRED-GATED** | **D6** | only the dormant primitive **V3-KYC-VAULT-01** (#320 `45aaa57d`) landed; `kyc_vault_envelope_encryption` mig **committed-NOT-applied**; no vendor adapter |
| V3-25 | identity-content-moderation-framework | DONE+APPLIED | — | #304 `486cd355`; mig `v3_25_moderation` 20260618175950 applied; flag `MODERATION_ENFORCED` **off** (deterministic floor when off) |

### 1.3 Phases D–I — the unbuilt / gated remainder (every pass listed)

**Phase D — AI Intelligence Layer (V3-26 → V3-33): ALL PENDING.** Gated by **D3 (AI provider)** + **D4 (AI margin)** — these two decisions block the *entire* phase. None started.

| ID | Slug | Status | Gate |
|---|---|---|---|
| V3-26 | ai-provider-router | PENDING | D3 |
| V3-27 | ai-usage-billing-engine | PENDING | D4 |
| V3-28 | ai-henryco-intelligence-chat-surface | PENDING | (V3-26/27) |
| V3-29 | ai-support-message-assist | PENDING | (V3-28) |
| V3-30 | ai-business-message-assist | PENDING | (V3-28) |
| V3-31 | ai-account-check-assist | PENDING | (V3-28) |
| V3-32 | ai-studio-domain-and-brief-assist | PENDING | (V3-28) |
| V3-33 | ai-personal-task-gating | PENDING | (V3-26/27) |

**Phase E — Personalization & Predictive (V3-34 → V3-42): PENDING except V3-37.**

| ID | Slug | Status | Note |
|---|---|---|---|
| V3-34 | personalization-home | PENDING | foundation of phase E |
| V3-35 | personalization-deals-and-campaigns | PENDING | |
| V3-36 | personalization-cross-division-recommendations | PENDING | |
| V3-37 | personalization-abandoned-task-recovery | **DONE+APPLIED (caveat)** | #265 `506be4db` shipped & functional on existing lifecycle tables; **but** its dedicated `v3_37_abandoned_tasks` mig is **committed-NOT-applied** (no `abandoned_tasks` table on prod) — a feature subset is dormant |
| V3-38 | personalization-local-availability | PENDING | |
| V3-39 | personalization-smart-next-action | PENDING | |
| V3-40 | predictive-fraud-and-risk | PENDING | |
| V3-41 | predictive-quality-and-workload | PENDING | |
| V3-42 | predictive-staff-dashboards | PENDING | |

**Phase F — Automation & Workflow (V3-43 → V3-48): ALL PENDING.**

| ID | Slug | Status |
|---|---|---|
| V3-43 | workflow-engine-foundation | PENDING |
| V3-44 | workflow-auto-assign-escalate | PENDING |
| V3-45 | workflow-auto-remind | PENDING |
| V3-46 | workflow-owner-reports | PENDING |
| V3-47 | workflow-neglected-queue-detection | PENDING |
| V3-48 | workflow-follow-up-campaigns | PENDING |

**Phase G — Product Expansion (V3-49 → V3-66).**

| ID | Slug | Status | Gate / Note |
|---|---|---|---|
| V3-49 | product-services-catalog-expansion | **MERGED-NOT-APPLIED** | #284 `4222feb3`; `care_services_catalog*` migs committed-NOT-applied (no `care_services_catalog` table on prod → live catalog = code default) |
| V3-50 | product-verified-provider-model | PENDING | blocked V3-24 (KYC) |
| V3-51 | product-smart-booking | PENDING | |
| V3-52 | product-marketplace-discovery-and-ranking | PENDING | |
| V3-53 | product-property-rules-engine | PENDING (partial off-register) | property media depth landed via **V3-PROPERTY-DEPTH-01** #288; rules engine itself unbuilt |
| V3-54 | product-jobs-interview-room | PENDING | `@henryco/rooms` + `jobs_interview_rooms` migs committed-NOT-applied (Pass-21 era) |
| V3-55 | product-studio-motion-video | PENDING | |
| V3-56 | product-learn-to-earn-employer-tools | DONE+APPLIED | #316 `fcffe977`; migs `v3_56_learn_candidate_optins` 20260621062649 + `v3_56_learn_to_earn_jobs` 20260621065910 applied |
| V3-57 | product-business-profiles-and-tools | DONE+APPLIED | #306 `6926834f`; migs `v3_57_business_profiles` 20260619015648 + rename 20260619015600 applied |
| V3-58 | product-seller-academy | DONE+APPLIED | #311 `35ac8dc8`; mig `v3_58_seller_tiers` 20260621062627 applied |
| V3-59 | product-concierge-guided-assistant | PENDING | depends on AI Phase D |
| V3-60 | product-coming-soon-roadmap | PENDING | gate D16 (scope) |
| V3-61 | product-newsletter-engine | PENDING | (newsletter_foundation mig exists 20260424112330; engine unbuilt) |
| V3-62 | product-deals-engine | PENDING | (marketplace_deals_curation mig exists 20260501080620; engine unbuilt) |
| V3-63 | product-local-discovery | PENDING | |
| V3-64 | product-logistics-network-maturity | PENDING (partial off-register) | delivery model reconciled via **V3-DELIVERY-COMPLETE-01** #315 + **V3-FREESHIP-CLOSE-01** #312; full network maturity unbuilt |
| V3-65 | gaming-arena-foundation | **DONE+APPLIED** | shipped as **V3-GAMING-01** #324 `2347eb1e` (free-play subset); mig `v3_gaming_01_free_play` 20260621120001 applied; flag `GAMING_ARENA_ENABLED` **dark in prod** |
| V3-66 | gaming-arena-stakes-spectator-replay | **DEFERRED-GATED** | **D2 legal** per market; real-money escrow designed-but-dormant |

**Phase H — Partner & Enterprise (V3-67 → V3-75).**

| ID | Slug | Status | Note |
|---|---|---|---|
| V3-67 | partner-onboarding | PENDING | blocked V3-50/V3-24 |
| V3-68 | partner-performance-and-contracts | PENDING | |
| V3-69 | partner-payouts | PENDING | gate D9; money-out (W2 Flutterwave payouts deferred) |
| V3-70 | enterprise-employer-hiring-suite | **MERGED-NOT-APPLIED** | #319 `67c9a2a3`; `v3_70_hiring_*` migs committed-NOT-applied (no `jobs_application_scores` on prod) |
| V3-71 | enterprise-seller-business-suite | PENDING | |
| V3-72 | enterprise-service-provider-crm | PENDING | |
| V3-73 | enterprise-studio-project-suite | **MERGED-NOT-APPLIED** | #321 `b7f51f27`; `studio_deliverable_revisions` mig committed-NOT-applied (dormant; needs `STUDIO_APPROVAL_SIGNATURE_SECRET`) |
| V3-74 | enterprise-logistics-business-dashboard | PENDING | |
| V3-75 | enterprise-bulk-invoicing-team-roles-admin | PENDING | gate D9 |

**Phase I — Platform/API + Global/Mobile + Observability + Closure (V3-76 → V3-96): ALL PENDING.**

| ID | Slug | Status | Note |
|---|---|---|---|
| V3-76 | platform-public-api-foundation | PENDING | |
| V3-77 | platform-seller-api | PENDING | |
| V3-78 | platform-logistics-api | PENDING | |
| V3-79 | platform-booking-api | PENDING | |
| V3-80 | platform-business-account-api | PENDING | |
| V3-81 | platform-webhook-delivery-service | PENDING | |
| V3-82 | platform-analytics-exports | PENDING | |
| V3-83 | platform-developer-docs | PENDING | |
| V3-84 | global-localization-maturity | PENDING | gate D10; ties to multi-currency W1 |
| V3-85 | global-per-market-payment-routing | PENDING | |
| V3-86 | mobile-architecture-decision | PENDING | gate D8; Expo scaffolds exist, decision doc missing |
| V3-87 | mobile-super-app-parity-wave-1 | PENDING | |
| V3-88 | mobile-store-submission | PENDING | |
| V3-89 | observability-traces-slos-budgets | PENDING | baseline observability live; traces/SLOs/budgets unbuilt (`tracing.ts` absent) |
| V3-90 | observability-data-lake-event-tracking | PENDING | |
| V3-91 | observability-ab-testing-framework | PENDING | |
| V3-92 | observability-backup-disaster-recovery | PENDING | |
| V3-93 | compliance-privacy-data-rights | PENDING | |
| V3-94 | closure-integration-test-pass | PENDING | **the final adversarial QA ("FIRE") — hard launch gate, unstarted** |
| V3-95 | closure-launch-readiness | PENDING | depends V3-94 |
| V3-96 | closure-v3-showcase | PENDING | depends V3-95 |

### 1.4 Off-register named workstreams (shipped — nothing lost)

These merged to `origin/main` but are **not** formal V3-NN register rows. They carry much of the real money/security/brand progress.

| Workstream | PR · SHA | Maps to | One-line |
|---|---|---|---|
| V3-VAT-01 (settlement VAT) | #257 `7f6dce91` | V3-21 precursor | output + fee VAT, ledger-grounded; mig `v3_vat_01_settlement_vat` 20260607140000 applied |
| V3-VAT-CLASSIFICATION-01 | #297 `c6462183` | **V3-21 replacement** | per-supply VAT classification + inclusive carve-out + NRS e-invoicing |
| V3-VAT-WIRING-01 | #305 `98a42448` | V3-21/19 activation | wires output VAT into the **live** marketplace sale (kobo-exact) + one-click owner refund |
| V3-DIVISION-CHECKOUT-01 | #298 `665580cd` | V3-15/16 activation | marketplace card checkout (test-mode, **flag `MARKETPLACE_CARD_CHECKOUT` off**) |
| Onyx Ledger wallet rebuild | #294 `5a64315b` | V3-17 adjacent | customer wallet rebuilt as the Onyx Ledger (live, holds real money) |
| FL2-REHEARSE-01 / HOTFIX-01 / ACTIVATE-01 | #273 `e7c4f08a` · #279 `4dafa970` · (no-PR, MCP-applied) | V3-16/17 | certify + activate the 8-file FL2 money manifest on prod (Δ=0) |
| V3-RETIRE-BANKTRANSFER (mktplace) | #303 `e2a0ad9a` | money-rail cleanup | retire bank transfer from checkout when card rail live (keep COD) |
| V3-DELIVERY-COMPLETE-01 | #315 `5030a7bb` | V3-64 adjacent | one VAT-correct delivery model; mig `marketplace_delivery_promises` 20260621065939 applied |
| V3-FREESHIP-CLOSE-01 (+#309) | #312 `ac686e72` | V3-64 adjacent | per-product free shipping → dormant money-safe |
| V3-OWNER-INBOX-01 | #300 `15549201` | net-new | unified owner email inbox; migs `owner_inbox_*` 20260616020443/20260616020828 applied |
| V3-MEDIA-SWEEP-01 | #291 `7fad43fe` | security/infra | sensitive media off public CDN → `@henryco/media` RLS-private signed storage (8 apps) |
| V3-PROPERTY-DEPTH-01 | #288 `a79b6d14` | V3-53 adjacent | property media on `@henryco/media`; introduced the media layer to `main` |
| V3-KYC-VAULT-01 | #320 `45aaa57d` | V3-24 primitive | dormant vendor-neutral KYC vault; envelope-encryption mig committed-NOT-applied |
| V3-GAMING-01 | #324 `2347eb1e` | V3-65 free-play | first gaming build; mig applied; flag dark |
| V3-GAMING-DESIGN-01 | **#322 OPEN/unmerged** | V3-65/66 design | architecture + phased plan (design-only) — **NOT merged** (memory said merged — incorrect; Appendix C) |
| SEC-HARDEN-01 | #269 `1ad5a52f` | security | audit-log forge hole + company-assets bucket; mig 20260612120000 applied |
| SEC-HARDEN-02 | #270 `2fe78399` | security | world-writable role-membership escalation; **effect applied via direct SQL — no ledger row** (Appendix B/C) |
| SEC-HARDEN-03 | #287 `8d69916f` | security | world-writable data-table class (40 tables); **effect applied via direct SQL — no ledger row** |
| SEC-HARDEN-04 | **#290 merged to side-branch `v3/sec-harden-03` (`f990d04a`), NOT on `origin/main`** | security | studio_payments money-input + profiles + learn trigger; code **orphaned on the stacking branch** (re-target-to-main never happened); prod effect (`world_writable={}`) per memory applied via direct SQL — **re-land needed** (Appendix C) |
| SEC-HARDEN-05 | #299 `be3ce78a` (+#307 `e69874b6`) | security/money | care manual-payment guard RPC + balanced ledger; mig `sec_harden_05_care_payment_guard` 20260619014208 applied (reconcile Δ0 = ₦2,625,169.30) |
| SEC-HARDEN-06 | #323 `5cd4eaa6` | security | SECURITY DEFINER IDOR fixes + grant lockdown; mig `sec_harden_06_secdef_idor_lockdown` 20260621120000 applied (anon 37→12) |
| STAB-01 | #280 `e500d66c` (+#282 `ab30e9f8`) | stability | stop per-render reconciliation storm; mig `stab01_handle_new_customer_idempotent` 20260613133434 applied |
| SCHEMA-TRUTH-01 | #266 `1baa546a` | infra | types from prod-actual + FL2 shadow; drift baseline 33→21 |
| REPO-RECONCILE-01 | #302 `2d05a635` | hygiene | promote captured follow-ups RR-1..RR-10 |
| V3-BACKLOG-RECORD-01 | #295 `9d6841c9` | planning | record deferred strategic workstreams W1–W5 + multi-currency close-blocker + D18–D20 |
| V3-DOMAIN / DOMAIN-FIX / DOMAIN-VERIFY | #213/#216/#217/#218/#219/#214 | V3-07c | migrate all surfaces to henryonyx.com (zero henrycogroup.com runtime) |
| Email: SES rail + onyx template + retire/revert | #310/#313/#317/**#318 revert** | infra (V3-EMAIL-SES-01) | SES adapter + template; retire Resend/Brevo **merged then reverted** (SES still sandboxed) |
| READING-01 / READING-02 | #258–#262 `7d85cd08`… | design/typography | editorial reading foundation (Fraunces + Manrope) across public sites |
| V3-PUBLIC-REBUILD ×7 + PUBLIC-CHROME/DESIGN/HARDENING | #183–#211 | design/security | rebuild public surfaces on the locked Henry Onyx design system |
| V3-IDENTITY-01 (+follow-ups) | #188/#192/#208 | brand | unify to Henry Onyx (brand) / Henry Onyx Limited (legal) |
| V3-INNER-L ×6 + THEME/CHROME + V3-ACTIONS-01 + V3-COMMAND-02 | #194–#247, #274, #212 | design/UX/ops | inner-surface light Register-L flip; device-aware theme; in-place actions; Command Center |
| V3-FEEDBACK / DASH-TOAST / DASH-NOTIF / DASH-RESILIENCE | #271/#255/#254/#256/#281 | UX | unified premium toast + Onyx chime; dashboard resilience |
| Pre-V3 polish (9 prompts) | #137–#148 | — | THEME-01, DESIGN-01, FIX-LT-01, RELIABILITY-01, FIX-MOBILE-CLICKS, MODULES-01, REALTIME-01, SEARCH-01, ACCOUNT-PREMIUM-01 (all shipped) |
| Division curated content + launch catalog seeds | #263 `7fbd1277`; (branch HEAD `70a54525`…`89306e68`) | content | curated content across divisions; **5 auto-seed commits sit on `v3/typography-reading-foundation` — origin/main merge UNVERIFIED** (Appendix C) |

---

## 2. The monetization map — "how the company earns"

Verified against `origin/main` code + **live prod money tables**. Prod confirms real revenue booked: `platform_revenue` CR **₦20,500**, `vat_output_payable` CR **₦75** (7,500 kobo), `processor_fees` DR **₦440.90** (owner absorbs the gateway fee), `fee_vat_recoverable` DR **₦33.08**; `marketplace_order_groups` carry **₦998,760** computed commission across 40 vendor groups.

### 2.1 LIVE (collecting / computing money in prod today)

| Path | Division | Mechanism | Where | Prod evidence |
|---|---|---|---|---|
| **Marketplace commission** | marketplace | Vendor take-rate on order subtotal, tiered by seller tier (**15 / 12 / 9 / 0%**; 0% for company inventory) | `apps/marketplace/lib/marketplace/governance.ts:101-142,357-369` | `marketplace_order_groups` SUM(commission)=₦998,760 / 40 groups |
| **Output VAT 7.5%** | marketplace (→all) | Nigeria statutory VAT carved **inclusive** at checkout, per-supply treatment | `packages/config/tax.ts` (0.075); `apps/marketplace/lib/checkout/order-vat.ts:62-115` | `vat_output_payable` CR ₦75; mig `v3_vat_01_settlement_vat` applied |
| **Processor-fee absorption** | shared (payments) | Owner **eats** the Flutterwave fee (reduces margin, not charged to customer) | `packages/payment-router/src/ledger.ts:38-45,189-228` | `processor_fees` DR ₦440.90 (8 lines) + `fee_vat_recoverable` DR ₦33.08 |
| **Delivery fee** | marketplace/logistics | Flat base ₦18,000, free over threshold | `packages/pricing/src/index.ts:88-91,112-117`; `apps/marketplace/lib/checkout/free-delivery.ts` | mig `marketplace_delivery_promises` applied |
| **Care first-party revenue** | care | Customer pays full price (no take-rate; full payment is revenue) | `apps/care/lib/payments/verification.ts`; RPC `care_record_manual_payment` | SEC-HARDEN-05 reconcile ₦2,625,169.30 |
| **Studio first-party revenue** | studio | Project fee (deposit + final), no take-rate; manual proof/status | `apps/studio/lib/studio/actions.ts:178,200-212,296-306` | manual flow |
| **Seller verified-tier engine** | marketplace | Tier (none/bronze/silver/gold) drives the commission rate above | `apps/marketplace/lib/marketplace/seller-tier-engine.ts` | V3-58 mig applied |

### 2.2 BUILT-DORMANT (wired, but rate=0 or no automated billing rail)

| Path | Division | State |
|---|---|---|
| Marketplace **platform fee** | marketplace | live-wired but default `rate=flat=cap=0` (all 21 orders `platform_fee_total=0`) — flip a constant to activate (gate **D9**) |
| Property submission fees (listing/inspection/management ×5) | property | live-wired, **all defaults 0** (gate D9) |
| Logistics rate-cards | logistics | full quote engine (₦2,800–9,000 + per-kg) but flow stops before payment; no collection rail |
| Jobs **employer subscription** | jobs | posting gate + price ladder; **no money collected** (mig `jobs_employer_subscriptions` applied) |
| Learn course revenue-share (per-instructor) | learn | admin-confirmed manual flow; not wired to rail/ledger |
| Seller monthly/posting/featured fees + payout fee (2/1.5%) | marketplace | amounts defined, listing cap DB-enforced; **no code path charges them** |
| Marketplace **card checkout** | marketplace | behind flag `MARKETPLACE_CARD_CHECKOUT` (off); needs `PAYMENTS_DATABASE_URL` |

### 2.3 PLANNED (design only, zero implementation)

| Path | Where it will live | Gate |
|---|---|---|
| **AI usage billing (~10% margin)** | V3-27 (Phase D) — per-call metering, wallet auto-debit, wallet-zero cap | **D3 + D4** |
| **Gaming match margin / escrow** | V3-66 — `gaming_company_margin` / `match_escrow_liability` accounts (clone of FL2) | **D2 legal** per market |
| Partner payouts (money-out) | V3-69 (W2 Flutterwave payouts) | D9 |
| AI business/studio assist (metered) | V3-30 / V3-32 | D3/D4 |

---

## 3. Owner-decision ledger (D1–D17)

Only **D2** is written into `docs/v3/DECISIONS-REQUIRED.md`. Several others are **de-facto resolved by shipped work but not recorded** — those should be inline-written to close the provenance gap.

| ID | Decision | In-file state | De-facto reality (from shipped work) | Blocks | Critical path? |
|---|---|---|---|---|---|
| **D1** | Payment provider per country | `_____` PENDING | **Option A executed** — Paystack (#170) then Flutterwave (#276) live; Stripe deferred | V3-14/15/16 | **Launch** — formalize (cheap) |
| **D2** | Gaming legal posture | ✅ **RATIFIED 2026-06-21** | refined Option C — free-play live, real-money per-market-legal-gated | V3-65/66 | Gaming track |
| **D3** | AI provider | `_____` PENDING | none | V3-26 | **AI phase (blocks all of D)** |
| **D4** | AI margin | `_____` PENDING | none | V3-27 | **AI phase (blocks all of D)** |
| **D5** | Tax engine | `_____` PENDING | **Option D executed** — roll-our-own (V3-VAT-CLASSIFICATION/WIRING), 7.5% live | V3-21 | Launch — formalize |
| **D6** | KYC vendor | `_____` PENDING | none (only dormant vault primitive) | V3-24 → V3-50/67 | **Identity/partner track** |
| D7 | Email senders | `_____` PENDING | hybrid in practice; SES attempt reverted | V3-46/48/61 (op) | No |
| **D8** | Mobile stack | `_____` PENDING | Expo scaffolds exist; decision doc missing | V3-86/23 | Mobile track |
| **D9** | Monetization rates | `_____` PENDING | commission 15/12/9/0% **coded & live**; platform/property fees=0 awaiting ratification | V3-20/69/75 | **Launch** — ratify rates |
| D10 | Per-market localization | `_____` PENDING | Nigeria-only de-facto (multi-currency NGN-fixed) | V3-84 | Multi-currency track |
| **D11** | Foundation Lock gate | `_____` PENDING | **satisfied** — V3-12 certified (#168), Phase C proceeded | Phase C start | Mark closed |
| D12 | Anti-clone posture | `_____` PENDING | Moderate partly in effect (server-side logic, SECDEF lockdowns) | cross-cuts | No |
| D13 | PASS 21–25 reconciliation | `_____` PENDING | Pass-21 depth = the committed-not-applied families (Appendix B) | coordination | Drift cleanup |
| D14 | V6 dashboard placement | `_____` PENDING | — | informs G | No |
| D15 | Branch hygiene | `_____` PENDING | partly done (REPO-RECONCILE-01) | operational | No |
| D16 | Roadmap surface | `_____` PENDING | — | V3-60 | No |
| **D17** | V3-07b i18n scope | `_____` PENDING | none | V3-07b | i18n gate |

**Critical-path decisions for core launch:** formalize D1 + D5 + D11 (de-facto done), ratify **D9** (rates). **For the AI phase:** **D3 + D4** are absolute blockers — no Phase D code can start without them. **For identity/partner expansion:** **D6**.

---

## 4. Launch-readiness gates (must clear before V3 close)

| Gate | Blocks launch? | State | Evidence |
|---|---|---|---|
| **V3-94 final integration QA ("FIRE")** | **YES (by design)** | **Unstarted.** No pass literally named "FIRE"; the cross-pillar adversarial QA is V3-94 — prompt only, no report/acceptance doc/smoke script. It is the gate that unblocks V3-95 sign-off | `docs/v3/prompts/v3-94-*.md`; no `.codex-temp/v3-94*` |
| **i18n native-translation** | **YES (quality bar)** | Scanner exists + CI-wired; typed Pattern A hit 0 gaps once (2026-05-09) but the 2026-05-17 live re-run measures **~1,286 actionable gaps**; runtime DeepL **cannot translate ig/yo/ha/hi/zh** (fall through to English) → native linguist still gating; ~8,041 component strings unextracted | `docs/v3/I18N-LOCALE-COVERAGE-LIVE.md:12`; V3-07b |
| **Multi-currency (W1)** | **YES (intl close-blocker)** | **Schema-only.** Mig `multi_currency_schema_foundation` applied but every column defaults NGN; `@henryco/pricing` snapshot/FX functions have **zero source callers**; live checkout uses the NGN-fixed breakdown; settlement always NGN. Needs Stripe (V3-14) + real FX + intl payouts + multi-juris tax + banking/licensing | `packages/pricing/src/currency-model.ts`; `apps/marketplace/.../route.ts:464` |
| **Mobile (Phase I)** | YES if in launch scope | Two Expo scaffolds (super-app ~3,140 LOC, company-hub ~3,772 LOC; last touched 2026-06-04/05); **D8 unratified** (no decision doc); V3-87 parity / V3-88 store-submission unbuilt | `apps/super-app/`, `apps/company-hub/`; `docs/v3/mobile-architecture-decision.md` MISSING |
| **Repo↔prod migration drift** | Must reconcile before close | **161 repo files vs 98 applied → 59 committed-not-applied** (mostly dormant depth families + V3-49/70/73); 23 applied-not-in-repo (consolidated baselines); 1 real version collision | Appendix B |
| **Money-rail go-live** | Gate (owner) | Flutterwave **live-key cutover + 48h soak still owner-gated**; bank-transfer estate-wide retirement blocked on FL2 soak + queue drain; card checkout flag off | §1.4, payments-rails |
| **Observability depth (V3-89)** | Not a hard blocker | Baseline live (Sentry ×10, `/api/health` ×10, henry_events sink); traces/SLOs/perf-budgets unbuilt (`tracing.ts` absent) | `packages/observability/`; `tracing.ts` MISSING |
| **SEC-HARDEN provenance** | Cleanup | SEC-HARDEN-02/03 effects applied via direct SQL with **no ledger row**; **SEC-HARDEN-04 (#290) has no commit on `origin/main`** — merge unverified | Appendix B/C |

---

## 5. Recommended sequence to launch

Dependency-aware path from today's state. **‖** = parallelizable.

**Phase 0 — Reconcile & formalize (now; low-risk, days)**
1. **Migration-drift decision per family** (Appendix B): for each committed-not-applied migration tied to a *shipped* pass (V3-49 care catalog, V3-70 hiring, V3-73 studio), decide **apply-to-prod** (if the feature is meant to be live) or **document-as-dormant**. Rename the gaming repo file `20260621120000`→`20260621120001` to clear the collision.
2. **Close the provenance gaps:** record SEC-HARDEN-02/03 + the brand-fix as ledger rows (or document the direct-SQL application); **re-land SEC-HARDEN-04 #290** — its code is merged only to `v3/sec-harden-03` (`f990d04a`), not on `origin/main`; open a fresh PR to main (the prod effect is already applied per memory, so this is a code-provenance fix).
3. **Inline-write the de-facto decisions** D1, D5, D11 into `DECISIONS-REQUIRED.md`; **ratify D9** rates (then optionally flip platform-fee / property-fee constants).
4. Promote V3-GAMING-DESIGN-01 (#322) to merged or re-open intentionally.

**Phase 1 — Finish the core (‖ where possible)**
5. Activate the partially-delivered passes: apply V3-49 catalog, V3-70, V3-73 migrations (per step 1); decide V3-37's `abandoned_tasks` migration.
6. Money-rail go-live: Flutterwave live-key cutover + 48h soak; then estate-wide bank-transfer retirement once the queue drains.

**Phase 2 — Decide & build AI (gated on D3+D4)**
7. Answer **D3 (provider) + D4 (margin)** → build Phase D in order: V3-26 → V3-27 → V3-33 → V3-28 → (V3-29/30/31/32 ‖). This also unblocks V3-59 concierge.

**Phase 3 — Launch gates (sequential close)**
8. Close **i18n** (V3-07b after D17; native linguists for ig/yo/ha/hi/zh).
9. Run **V3-94 ("FIRE") integration QA** across all surfaces + the auth/role/money matrix → **V3-95 launch-readiness** sign-off → **V3-96 showcase**.

**Post-core tracks (‖, after/with the above)**
- **Multi-currency (W1) — required before *project* close:** D10 + Stripe (V3-14) + FX engine + intl payouts + multi-juris tax + non-code banking/licensing → V3-84/V3-85.
- **Mobile (Phase I):** ratify D8 → V3-86 → V3-87 → V3-88.
- **Gaming real-money (V3-66):** per-market legal sign-off (D2) → activate dormant escrow.
- **Personalization/Automation/Platform-API (E, F, V3-76+):** sequenced after their deps; largely independent of launch-core.
- **Partner/Enterprise (H):** after V3-24 (KYC, needs D6) + V3-50.

---

## Appendix A — Prompt-file coverage (107 / 107)

`docs/v3/prompts/` holds **107** files. Every one is represented above.

- **96 formal register passes** (`v3-01-*` … `v3-96-*`) — every one appears in §1.1–§1.3.
- **2 hardening passes** — `v3-07b-operator-surface-i18n` (PENDING), `v3-07c-henrycogroup-domain-sweep` (DONE as V3-DOMAIN). *(`v3-02b` has no separate prompt file; tracked in §1.1.)*
- **9 pre-V3 polish prompts** — all shipped (§1.4 last row): `theme-standardize-owner-staff`→THEME-01 #137; `design-marketplace-profile-drawer-v2`→DESIGN-01 #138; `fix-loading-theater-property-account-care`→FIX-LT-01 #140; `reliability-cloudinary-uploads`→RELIABILITY-01 #141; `fix-dashboard-mobile-button-clicks`→FIX-MOBILE-CLICKS #143; `fix-mobile-module-landings`→MODULES-01 #144; `fix-supabase-realtime-stability`→REALTIME-01 #145; `search-productivity-uplift`→SEARCH-01 #147; `account-dashboard-premium-rebuild`→ACCOUNT-PREMIUM-01 #148.

96 + 2 + 9 = **107. No prompt file is unaccounted for.**

---

## Appendix B — Migration drift detail

**Repo: 161 `.sql` across 9 dirs** — hub 77, studio 20, marketplace 14, property 13, jobs 11, care 10, learn 8, logistics 7, super-app 1. **Prod: 98 applied** (latest `20260621120001`). No root or `packages/*` migrations dir.

### B.1 Committed-NOT-applied (59) — verified by live `to_regclass`/column probes

**Dormant depth families (Pass-21 / pre-V3 era — likely intentional):**
- `@henryco/rooms` ×7 (rooms_sessions/participants/recordings_consent/recordings/scorecards/messages/realtime)
- property-depth ×11 (amenities_catalog, floorplans, virtual_tours, neighborhood_signals, saved_searches, inspection_rules, rent_payments, maintenance_tickets, viewings_extensions, realtime, +1)
- care-depth ×7 (garment_types, user_preferences, recurring_schedules, claims, pod_records, booking_garments, realtime)
- logistics-depth ×7 (quotes, shipment_legs, pod, claims, fleet, b2b_accounts, realtime)
- studio-depth ×7 (proposal_signatures, revisions_versioning, milestone_extensions, payment_plans, resource_allocations, asset_packs, realtime)
- jobs-depth ×5 (interview_rooms, offer_letters, salary_benchmarks, pipeline_extras, realtime)
- learn Pass-21 ×3 (player, policies, realtime)

**Tied to shipped passes (decide apply vs dormant):**
- V3-49 care catalog ×2 (`care_services_catalog_expansion` + seed)
- V3-70 hiring ×2 (`v3_70_hiring_business_scope`, `v3_70_hiring_collaboration`)
- V3-73 studio (`studio_deliverable_revisions`)
- V3-37 ×2 (`v3_37_abandoned_tasks` + recovery category)

**Standalone dormant / provenance:**
- `super_app_core` (Expo, deferred), `workspace_staff_platform`
- `kyc_vault_envelope_encryption` (V3-KYC-VAULT-01, dormant)
- `sec_harden_02_role_membership_lockdown`, `sec_harden_03_world_writable_lockdown`, `v3_division_name_brand_fix` — **effect verified LIVE on prod but no ledger row** (applied via direct SQL)

### B.2 Applied-NOT-in-repo (23) — early consolidated baselines / direct-applied

`account_platform_core`, `create_studio_tables`, `create_logistics_property_hub_tables`, `create_jobs_communication_interview_tables`, `create_referral_trust_and_support_read_columns`, the granular `hq_ic_*` rows (×5), `add_care_bookings_rls_policies`, `20260406_auth_hardening_orders_and_care_reviews`, support_* lifecycle rows (×4), `verification_submissions_rls_policies`, `user_addresses_legacy_backfill`, `cms_phase1_publish_workflow_drafts_revisions`, `owner_inbox_harden_advisors`, `rename_orphan_businesses_for_v3_57`, `staff_navigation_audit`. *(These are not "missing" — they are consolidated/renamed baselines or directly-applied rows; the repo equivalent exists under a different name or was folded into a baseline.)*

### B.3 Version collision (1 real)

`apps/hub/supabase/migrations` has **two files at `20260621120000`** — `sec_harden_06_secdef_idor_lockdown` and `v3_gaming_01_free_play`. Prod resolved it by recording sec_harden_06 at `…120000` and gaming at `…120001`. **The repo gaming file still needs renaming to `20260621120001`.** (All cross-directory duplicate timestamps are benign per-app histories.)

---

## Appendix C — Repo/prod contradictions of prior reports & memory

1. **`docs/v3/orientation/architect-briefing.md` is a stale 2026-05-27 snapshot** — it states V3-02 is unmerged and V3-04/06/08/11/12 not started. **`origin/main` shows all of Phase B merged** (V3-02 #158 … V3-12 #168). Superseded; do not cite for status.
2. **V3-GAMING-DESIGN-01 (PR #322) is OPEN/unmerged** on `origin/main` — memory recorded it as merged. **Incorrect in memory.**
3. **SEC-HARDEN-04 (PR #290) is merged into the wrong branch.** GitHub marks #290 MERGED (merge commit `f990d04a`), but that commit is **NOT an ancestor of `origin/main`** — it lives only on `remotes/origin/v3/sec-harden-03`. So #290 was merged into its stacking base, and the planned re-target-to-main ("re-target when #287 merges") **never happened**; only SEC-HARDEN-03 (#287) reached main. SEC-HARDEN-04's code (studio_payments money-input guard, profiles anon-insert drop, learn trigger fix) is **orphaned on the side branch**; its prod *effect* (`world_writable={}`) was per memory applied via direct SQL on 2026-06-14, but the **code must be re-landed on main**. Status relative to main: **CODE-ONLY-SIDE-BRANCH**.
4. **V3-DELIVERY-COMPLETE-01's `marketplace_delivery_promises` (20260621065939) IS applied** on prod — earlier memory said committed-not-applied. **Now applied.**
5. **Applied-migration count is 98**, not the "96" used in some earlier prose / agent labels (settled via `count(*)` on `schema_migrations`).
6. **5 division launch-catalog auto-seed commits** (`70a54525`…`89306e68`) sit on `v3/typography-reading-foundation`; their merge to `origin/main` is **UNVERIFIED** (they are not in the `origin/main` log range audited).

---

**PROGRAM LEDGER COMPLETE — 96 passes across A–I (107 prompt files, all accounted for), 25 done+applied / 3 merged-not-applied / 65 pending (+2 deferred-gated, +1 dropped/superseded, +2 hardening done / 1 pending); monetization map (3 live revenue paths, prod-verified), decision ledger (D1–D17; only D2 written, D1/D5/D11 de-facto done), launch-readiness gates (4 hard blockers: V3-94 QA, i18n, multi-currency, mobile), and ordered path-to-launch recorded. Migration drift quantified: 161 repo files vs 98 applied → 59 committed-not-applied, 23 applied-not-in-repo, 1 version collision.**
