# V3 Audit — Pillar Gap Map (deep dive of §4)

**Pass:** V3 Strategic Architect (Phase A · deep audit)
**Compiled:** 2026-05-21
**Author:** Claude · Opus 4.7 (1M context) · maximum effort
**Status:** Authoritative reference for V3-13..V3-96 pillar passes. Extends `AUDIT-BASELINE.md §4`.

This document extends `docs/v3/AUDIT-BASELINE.md §4` (Per-pillar gap snapshot, P1–P12) with file-cited deep dives. Where the baseline gave a paragraph per pillar, this audit cites packages, route paths, migration files, and (where load-bearing) line numbers. The classification per pillar is the same: **Ships today** / **Weak or partial** / **Missing entirely** / **Pass coverage** / **Cross-pillar dependencies**. Every "NOT INTEGRATED" claim in `AUDIT-BASELINE.md §1.4` was re-verified by grepping the active workspace; corrections appear inline. The audit was performed against the workspace at `C:\Users\HP VICTUS\HenryCo` on 2026-05-21 — the parent working tree contains tracked production code plus the untracked V3 strategy docs. File citations refer to the active (non-`.worktree-conductor-closure/`) paths.

---

## Audit-wide corrections to `AUDIT-BASELINE.md §1.4`

These integration claims were re-verified by grepping every active `package.json` and lockfile:

| Service | Baseline claim | Verified state | Evidence |
|---|---|---|---|
| Stripe | NOT INTEGRATED | **Confirmed absent** | No `"stripe"` or `"@stripe/*"` in any `package.json` |
| Paystack | NOT INTEGRATED | **Confirmed absent** | No `paystack` or `@paystack/*` in any `package.json` |
| Flutterwave | NOT INTEGRATED | **Confirmed absent** | No `flutterwave` in any `package.json` |
| Apple/Google Pay | NOT INTEGRATED | **Confirmed absent** | Only `apps/super-app/src/platform/adapters/payments.deferred.ts` stub exists |
| Anthropic/OpenAI/LLM | NOT INTEGRATED | **CORRECTED: PARTIALLY INTEGRATED** | `@anthropic-ai/sdk@^0.92.0` is declared in `apps/studio/package.json:19` and the root `package.json:45`. Two production-active server actions consume it: `apps/studio/lib/studio/brief-copilot-action.ts:5` (with full anti-abuse rails, conservative caps, model `BRIEF_COPILOT_MODEL`) and `apps/studio/lib/portal/refine-draft-action.ts:3` (Claude Haiku 4.5 — `claude-haiku-4-5-20251001` per line 19). `triageSupportStub` and `nextAccountSteps` in `packages/intelligence/src/index.ts` remain deterministic. There is no `@anthropic-ai/sdk` usage in any other app. |
| DeepL | wired for runtime auto-translate | **Confirmed wired** | `packages/i18n/src/deepl.ts` (DEEPL_API_URL constant) + `packages/i18n/src/translate-runtime.ts` |
| Avalara / TaxJar | NOT INTEGRATED | **Confirmed absent** | No `avalara`, `taxjar`, `@avalara`, or `@taxjar` in any `package.json` |
| KYC vendor (Smile Identity / Onfido / Sumsub) | basic KYC infra; no vendor wired | **Confirmed** | `apps/hub/supabase/migrations/20260410130000_kyc_verification_infra.sql:9-15` adds verification_status fields on `customer_profiles` plus `customer_verification_submissions` table; no external vendor SDK present |

These corrections do not weaken the foundation argument — Anthropic is integrated only at the studio domain layer, not as the cross-platform "HenryCo Intelligence" provider router demanded by Phase D. But the precise statement is "Anthropic SDK present in the monorepo, consumed by exactly two studio server actions; no provider router, no usage-billing, no UI surface labeled HenryCo Intelligence."

Workspace inventory re-verified: **33 packages** under `packages/` (matches baseline §1.1 count). The 33 are: `address-selector, auth, brand, branded-documents, cart-saved-items, chat-composer, config, dashboard-modules-account, dashboard-modules-building, dashboard-modules-hotel, dashboard-modules-marketplace, dashboard-modules-owner, dashboard-modules-staff, dashboard-modules-wallet, dashboard-shell, data, email, i18n, intelligence, lifecycle, messaging-thread, newsletter, notifications, notifications-ui, observability, payment-surface, pricing, rooms, search-core, search-ui, seo, trust, ui, workspace-shell`.

Migration counts re-verified (significantly higher than the 2026-05-03 inventory):

| App | Inventory 2026-05-03 | Current (2026-05-21) |
|---|---:|---:|
| apps/hub/supabase/migrations/ | 30 | **47** |
| apps/care/supabase/migrations/ | 0 | **7** |
| apps/jobs/supabase/migrations/ | 0 | **8** |
| apps/learn/supabase/migrations/ | 4 | **7** |
| apps/logistics/supabase/migrations/ | (new) | **7** |
| apps/marketplace/supabase/migrations/ | 6 | **12** |
| apps/property/supabase/migrations/ | 2 | **13** |
| apps/studio/supabase/migrations/ | 4 | **19** |
| apps/account/supabase/migrations/ | 0 | **0** |

The biggest growth — care, jobs, logistics, property, studio — is V3 PASS 21 + post-baseline schema build-out (e.g. `20260515100000_rooms_sessions.sql` and siblings in `apps/hub/supabase/migrations/`, the seven new care migrations dated `20260515*`, the eight new jobs migrations including `jobs_interview_rooms.sql`, the thirteen new property migrations).

---

## P1 — Product Expansion

### Ships today

- **Care:** booking + pickup workflow. App at `apps/care/`. New schema in `apps/care/supabase/migrations/` (7 files) including `20260515120000_care_garment_types.sql`, `20260515120500_care_user_preferences.sql`, `20260515121000_care_recurring_schedules.sql`, `20260515121500_care_claims.sql`, `20260515122000_care_pod_records.sql`, `20260515122500_care_booking_garments.sql`. WhatsApp webhook at `apps/care/app/api/webhooks/whatsapp/`. Resend webhook at `apps/care/app/api/webhooks/resend/`. Live HTML still exposes "Preparing the public Care experience" copy per `docs/PRODUCT-GAP-LEDGER.md:36` (PRODUCT-GAP-LEDGER 2026-04-09 — needs re-verification).
- **Marketplace:** catalog + cart + checkout. App at `apps/marketplace/`. Twelve migrations in `apps/marketplace/supabase/migrations/` covering init/policies, events/application_state, pricing_breakdowns, deals_curation, seller_tiers, `20260505090000_marketplace_checkout_payment_completion.sql`, `20260514120000_marketplace_inventory_movements.sql`, `20260514120500_marketplace_refunds.sql`, `20260514121000_marketplace_review_photos.sql`, `20260514121500_marketplace_recommendation_signals.sql`, `20260514122000_marketplace_product_variants_matrix.sql`. Bespoke 3-step checkout per `V3-DISCOVERY-INVENTORY.md:349`.
- **Studio:** template browser (`/pick`), brief builder (`/request`), `/pay`. App at `apps/studio/`. Nineteen migrations in `apps/studio/supabase/migrations/` including client portal (`20260503120000_studio_client_portal.sql`), brief drafts (`20260503130000_studio_brief_drafts.sql`), messaging (`20260503140000_studio_messaging.sql`), proposal signatures (`20260514130000_studio_proposal_signatures.sql`), revisions versioning (`20260514130500_studio_revisions_versioning.sql`), milestone extensions, payment plans (`20260514131500_studio_payment_plans.sql`), resource allocations, asset packs (`20260514132500_studio_asset_packs.sql`), realtime publication (`20260514133000_studio_realtime_publication.sql`). Public surfaces at `apps/studio/app/(public)/{pricing, work, teams, services, process, faq, about, policies, pick, trust, contact}`. Brief copilot at `apps/studio/lib/studio/brief-copilot-action.ts`. Studio automation sweep cron at `apps/studio/app/api/cron/studio-automation/route.ts`.
- **Property:** listings + managed. App at `apps/property/`. Thirteen migrations including `20260515120000_property_amenities_catalog.sql`, `20260515120500_property_floorplans.sql`, `20260515121000_property_virtual_tours.sql`, `20260515121500_property_neighborhood_signals.sql`, `20260515122000_property_saved_searches.sql`, `20260515122500_property_inspection_rules.sql`, `20260515123000_property_rent_payments.sql`, `20260515123500_property_maintenance_tickets.sql`, `20260515124000_property_viewings_extensions.sql`, `20260515124500_property_realtime_publication.sql`.
- **Jobs:** board + employer console + hiring messages. App at `apps/jobs/`. Eight migrations including `20260504130000_jobs_employer_subscriptions.sql`, `20260515120000_jobs_taxonomy.sql`, `20260515120500_jobs_skill_verifications.sql`, `20260515121000_jobs_interview_rooms.sql`, `20260515121500_jobs_offer_letters.sql`, `20260515122000_jobs_salary_benchmarks.sql`, `20260515122500_jobs_pipeline_extras.sql`. The `jobs_interview_rooms` table is migration-ready but the consuming UI is not wired (see P10 below — rooms package fully built, zero consumers).
- **Learn:** courses + paths + certifications + teacher applications. App at `apps/learn/`. Seven migrations including `20260515000000_learn_v3_pass21_player.sql`, `20260515001000_learn_v3_pass21_policies.sql`, `20260515002000_learn_v3_pass21_realtime.sql`. Certificate PDF route at `apps/learn/app/api/certificates/[code]/pdf/`.
- **Logistics:** quote / book / track / POD with operator workspaces. App at `apps/logistics/`. Workspaces live under `apps/logistics/app/(staff)/{dispatcher, manager, owner, rider}`. Seven migrations including `20260514120000_logistics_quotes.sql`, `20260514120500_logistics_shipment_legs.sql`, `20260514121000_logistics_pod.sql`, `20260514121500_logistics_claims.sql`, `20260514122000_logistics_fleet.sql`, `20260514122500_logistics_b2b_accounts.sql`, `20260514123000_logistics_realtime_publication.sql`. API routes at `apps/logistics/app/api/logistics/{book, claims, dispatch, pod, quote, track}`. Logistics automation cron at `apps/logistics/app/api/cron/logistics-automation/`. WhatsApp webhook at `apps/logistics/app/api/webhooks/whatsapp/`.

### Weak or partial

- **Care broader services:** garment-care migrations exist (`care_garment_types`, `care_booking_garments`) but the user-facing public surface is still single-service-focused per `docs/PRODUCT-GAP-LEDGER.md:46-50`.
- **Jobs interview room UI:** `apps/jobs/supabase/migrations/20260515121000_jobs_interview_rooms.sql` adds the schema, and `@henryco/rooms` is built (P10), but no `apps/jobs/**` source file imports `@henryco/rooms` (verified — zero grep matches in `apps/**/*.{ts,tsx}`).
- **Property rules engine:** `apps/property/supabase/migrations/20260515122500_property_inspection_rules.sql` adds rules schema; the consuming surface/operator UI is not yet a coherent rules engine — needs verification.
- **Newsletter foundation:** `apps/hub/supabase/migrations/20260424160000_newsletter_foundation.sql` plus `@henryco/newsletter` package. Subscribe path exists. Campaign authoring + segmentation tool is missing.
- **Local discovery:** address infra (`@henryco/address-selector`, `user_addresses` canonical) is shipped but cross-division geo search is not.
- **Concierge / guided assistant:** `apps/studio/lib/studio/brief-copilot-action.ts` is the closest pattern, but no cross-division concierge surface exists.

### Missing entirely

- **Laundry / errands / moving / event-support / business-support / deep-cleaning service catalogs:** no migrations, no routes, no UI. Care is single-vertical.
- **Coming-soon roadmap surface:** no public roadmap route. (V3-60 target.)
- **Studio motion / video service intake:** no migration adds video-specific scope steps; no `(public)/motion/` or similar route under `apps/studio/app/(public)/`.
- **Learn-to-earn employer pipeline:** no migration linking `learn` completions to `jobs` board surfaces. (V3-56 target.)
- **Business profiles + business tools:** no `business_profiles` or `business_storefronts` table found in any migration; no `apps/*/app/business/` storefront route family. (V3-57 target.)
- **Seller academy:** no migration; no route.

### To remove / deprecate

- Fake / decorative summary surfaces flagged in `docs/PRODUCT-GAP-LEDGER.md:85` ("marketplace public shell is strong, but the empty-state copy still needed a truth-first tone adjustment") — needs the V3-08 / V3-11 sweep before V3-49 builds new catalogs.

### Pass coverage

- `docs/v3/prompts/v3-49-product-services-catalog-expansion.md`
- `docs/v3/prompts/v3-50-product-verified-provider-model.md`
- `docs/v3/prompts/v3-51-product-smart-booking.md`
- `docs/v3/prompts/v3-52-product-marketplace-discovery-and-ranking.md`
- `docs/v3/prompts/v3-53-product-property-rules-engine.md`
- `docs/v3/prompts/v3-54-product-jobs-interview-room.md`
- `docs/v3/prompts/v3-55-product-studio-motion-video.md`
- `docs/v3/prompts/v3-56-product-learn-to-earn-employer-tools.md`
- `docs/v3/prompts/v3-57-product-business-profiles-and-tools.md`
- `docs/v3/prompts/v3-58-product-seller-academy.md`
- `docs/v3/prompts/v3-59-product-concierge-guided-assistant.md`
- `docs/v3/prompts/v3-60-product-coming-soon-roadmap.md`
- `docs/v3/prompts/v3-61-product-newsletter-engine.md`
- `docs/v3/prompts/v3-62-product-deals-engine.md`
- `docs/v3/prompts/v3-63-product-local-discovery.md`
- `docs/v3/prompts/v3-64-product-logistics-network-maturity.md`

### Cross-pillar dependencies

- **Feeds:** P1 expands the value surface that every other pillar prices, ranks, personalizes, supports, and bills. Without P1, P3/P6/P9 have nothing to operate on.
- **Waits on:** P12 (Foundation Lock V3-12) per `DEPENDENCIES.md:73-88` — every P1 product pass depends on V3-12 closing. P7 (V3-24 KYC) and P2 (Phase C) for the verified provider model (V3-50) and smart booking (V3-51).
- **Co-evolves with:** P3 (personalization signals from catalog interactions), P9 (monetization rates per service), P8 (verified provider model is dual-tagged P1+P7+P8).

---

## P2 — Wallet, Payments, Financial Spine

### Ships today

- **Manual payment-proof + receipt workflow:** `packages/payment-surface/` — eight UI primitives (`payment-action-button.tsx`, `payment-copy-button.tsx`, `payment-file-field.tsx`, `payment-guide.tsx`, `payment-processing.tsx`, `payment-proof-upload.tsx`, `payment-receipt.tsx`, `payment-surface.tsx`) plus adapter (`adapter.ts`), formatters (`format.ts`), shared types (`types.ts:3-31`). Status normalization at `packages/payment-surface/src/types.ts:3-9` (pending/processing/paid/failed/refunded/cancelled). Currency default at `packages/payment-surface/src/adapter.ts:67` (`"NGN"`).
- **Wallet schema:** `wallets` and `wallet_transactions` tables exist — verified via `apps/hub/supabase/migrations/20260509120000_v2_closure_d8_rls_hot_patch.sql:32-37` which enables RLS on `wallets`, `wallet_transactions`, `care_pricing_items`, `care_site_settings`. Per-customer wallet at `customer_wallets` (referenced at `apps/hub/supabase/migrations/20260421191500_handle_new_customer_search_path.sql:17`). Funding requests at `customer_wallet_funding_requests` (`apps/hub/supabase/migrations/20260403183000_account_integration_hardening.sql:22`). Withdrawal requests at `customer_wallet_withdrawal_requests` (`apps/hub/supabase/migrations/20260406140000_wallet_withdrawals.sql:3`).
- **DASH-3 wallet module live:** `packages/dashboard-modules-wallet/` per `AUDIT-BASELINE.md:238`. Wallet API routes in `apps/account/app/api/wallet/`.
- **Branded documents (invoice / receipt / transaction history):** `packages/branded-documents/src/templates/` contains `invoice.tsx`, `receipt.tsx`, `transaction-history.tsx`, `studio-invoice.tsx`, `vendor-payout-statement.tsx`, `vendor-tax-document.tsx`, `logistics-b2b-statement.tsx`, `logistics-shipment-receipt.tsx`, `property-managed-statement.tsx`, plus 9 other templates (18 total). Account download API at `apps/account/app/api/documents/[type]/[id]/`.
- **Pricing governance + breakdown persistence:** `@henryco/pricing` package — `packages/pricing/src/{currency-model, currency-sanity, exchange-rate, index}.ts`. Hub-level migration `20260417170000_shared_pricing_governance.sql`, marketplace migration `20260417160000_marketplace_pricing_breakdowns.sql`.
- **Multi-currency foundation:** `apps/hub/supabase/migrations/20260419120000_multi_currency_schema_foundation.sql`. NGN is default per `packages/payment-surface/src/adapter.ts:67`.
- **Subscriptions + invoices tables exist** (corrects a partial baseline implication): `customer_subscriptions` and `customer_invoices` referenced in `apps/hub/supabase/migrations/20260514140000_auth_rls_initplan_wrap.sql:120-123` and FK indexed in `apps/hub/supabase/migrations/20260514120000_unindexed_foreign_keys.sql:27`. Per `docs/PRODUCT-GAP-LEDGER.md:26-27`, the live tables have **0 subscription rows and 2 invoice rows** — UI is wired, data is empty.

### Weak or partial

- **Refund workflow:** marketplace has `apps/marketplace/supabase/migrations/20260514120500_marketplace_refunds.sql` — schema exists, no provider-side refund call because no provider is integrated.
- **Tax computation:** line-item config via `@henryco/pricing` only — no per-country / per-buyer / per-product tax engine. No `tax_*` table in any migration.
- **Subscription lifecycle:** `customer_subscriptions` table exists but is empty per `docs/PRODUCT-GAP-LEDGER.md:26`; no state machine (trial → active → grace → canceled), no dunning, no proration.

### Missing entirely

- **`PaymentProviderRouter`:** no file in `packages/` or `apps/` implements a vendor-agnostic router. (V3-13 target.)
- **Stripe SDK:** **CONFIRMED ABSENT** — zero `"stripe"` or `"@stripe/"` references in any `package.json`.
- **Paystack SDK:** **CONFIRMED ABSENT** — zero `"paystack"` or `"@paystack/"` references.
- **Flutterwave SDK:** **CONFIRMED ABSENT** — zero references.
- **Apple Pay / Google Pay:** only stubbed at `apps/super-app/src/platform/adapters/payments.deferred.ts` (returns `{ ok: false, error: "Payments adapter not implemented…" }` per lines 4-12).
- **Webhook reconciliation engine:** no `reconciliation_*` table; no Vercel/cron route under `apps/*/app/api/cron/*reconciliation*`.
- **Finance dashboard:** no `apps/hub/app/owner/finance/` route family (verified via `ls apps/hub/lib/` and `apps/hub/app/api/owner/`).
- **Native-app payment compliance:** super-app `payments.deferred.ts` returns failure — no Apple-Pay-for-digital-goods routing.

### Pass coverage

- `docs/v3/prompts/v3-13-payments-provider-router.md`
- `docs/v3/prompts/v3-14-payments-stripe-activation.md`
- `docs/v3/prompts/v3-15-payments-paystack-activation.md`
- `docs/v3/prompts/v3-16-payments-flutterwave-activation.md`
- `docs/v3/prompts/v3-17-payments-ledger-hardening.md`
- `docs/v3/prompts/v3-18-payments-receipts-and-invoices.md`
- `docs/v3/prompts/v3-19-payments-refunds-and-reconciliation.md`
- `docs/v3/prompts/v3-20-payments-subscription-lifecycle.md`
- `docs/v3/prompts/v3-21-payments-tax-engine.md`
- `docs/v3/prompts/v3-22-payments-finance-dashboard.md`
- `docs/v3/prompts/v3-23-payments-native-app-compliance.md`
- `docs/v3/prompts/v3-85-global-per-market-payment-routing.md` (P12 cross-pillar)
- `docs/v3/prompts/v3-69-partner-payouts.md` (P8 cross-pillar)

### Cross-pillar dependencies

- **Feeds:** every revenue-producing pillar — P1 (services priced), P8 (partner payouts), P9 (monetization), P10 (wallet-funded stakes), P11 (API billing).
- **Waits on:** P12 V3-12 Foundation Lock per `DEPENDENCIES.md:37`; D1 owner gate (provider activation per country) blocks V3-14/15/16; D5 (tax engine) blocks V3-21; D9 (monetization rates) blocks V3-20.
- **Co-evolves with:** P7 (KYC + sensitive-action gating + escrow), P12 (per-market currency rounding + payment routing).

---

## P3 — Personalization Engine

### Ships today

- **`nextAccountSteps` deterministic recommendations:** `packages/intelligence/src/index.ts:152-190` — pure function over `UserContext { roleHint, trustState, profileCompleteness, savedJobIds, ... }` returning up to 5 ranked recommendations. Currently emits trust-completion, profile-completion, and saved-jobs follow-up cards only.
- **Cart-recovery state:** `apps/hub/supabase/migrations/20260502170000_v2_cart_01_saved_items_engagement.sql` adds `saved_items`, `user_engagement_events`, `cart_recovery_state`, `recently_viewed_items`. Hourly engagement-sweep cron at `apps/account/app/api/cron/engagement-sweep/`.
- **Account `welcome-back` surface:** `apps/account/components/smart-home/SmartHome.tsx` is the home widget; `apps/account/lib/smart-home/widgets.ts` reads recent activity from `customer_activity`.
- **Lifecycle blocker / dormant signals:** events declared in `packages/intelligence/src/index.ts:71-75` — `LIFECYCLE_DORMANT_DETECTED`, `LIFECYCLE_BLOCKER_DETECTED`, `LIFECYCLE_REENTRY_COMPLETED`, etc. `@henryco/lifecycle` package wires "continue where you left off" panel.
- **Locale persistence:** `packages/i18n/src/cookie.ts` + `packages/i18n/src/locale-route.ts`. 12 locales per `packages/i18n/src/locales.ts:18` (`en, fr, ig, yo, ha, ar, es, pt, de, it, zh, hi`).
- **Currency persistence:** per memory `project_henryco_currency.md` (not re-verified file-by-file in this audit).
- **Customer lifecycle snapshot:** `apps/hub/supabase/migrations/20260424140000_customer_lifecycle_snapshot.sql`.

### Weak or partial

- **Personalized home:** `SmartHome.tsx` renders a deterministic "next steps" panel. No per-user layout persistence, no module ordering by signal, no device-aware swap.
- **Cross-division recommendations:** `nextAccountSteps` only emits 3 cards (trust, profile, saved-jobs). No multi-division "you booked Care → here's a relevant Job" stitch.
- **Recently-viewed:** `recently_viewed_items` table exists from `20260502170000`; cross-division surfacing not verified.

### Missing entirely

- **Per-user persisted home layout** — no `customer_home_layouts` or similar table in any migration.
- **Recommended services/jobs/courses/properties** — no recommendation tables beyond `marketplace_recommendation_signals` (which is signal-emitter side only — see `apps/marketplace/supabase/migrations/20260514121500_marketplace_recommendation_signals.sql`).
- **Local-availability awareness** — no geo-aware availability filter in any service catalog.
- **Smart-next-action surfacing** — no per-page next-step prompt beyond `SmartHome.tsx`'s 3 deterministic cards.
- **Personalized deals engine** — no `deals_curation` consumer beyond marketplace's seller-side migration.

### Pass coverage

- `docs/v3/prompts/v3-34-personalization-home.md`
- `docs/v3/prompts/v3-35-personalization-deals-and-campaigns.md`
- `docs/v3/prompts/v3-36-personalization-cross-division-recommendations.md`
- `docs/v3/prompts/v3-37-personalization-abandoned-task-recovery.md`
- `docs/v3/prompts/v3-38-personalization-local-availability.md`
- `docs/v3/prompts/v3-39-personalization-smart-next-action.md`

### Cross-pillar dependencies

- **Feeds:** P5 (workflow follow-up campaigns consume personalization triggers per `DEPENDENCIES.md:69`); P8 (deals visible to business surfaces); P12 (analytics).
- **Waits on:** P12 V3-12 + P4 V3-26 (AI provider router) per `DEPENDENCIES.md:58`. Cross-division recommendations (V3-36) also waits on V3-26.
- **Co-evolves with:** P4 (LLM-powered recommendations vs deterministic), P6 (predictive scoring informs recommendation ranking).

---

## P4 — HenryCo Intelligence Layer (AI)

### Ships today

- **`@henryco/intelligence` deterministic core:** `packages/intelligence/src/index.ts` — event envelope (`henryEventEnvelopeSchema:28-43`), 25+ named event types (`HenryEventNames:47-76`), `triageSupportStub:215-244` (regex-based intent classifier across account_access / billing / marketplace_order / booking / verification / wallet / other), `nextAccountSteps:152-190` (deterministic recommendation engine), 8 `RiskSignalType` values (`packages/intelligence/src/index.ts:246-254` — failed_sensitive_action_burst, listing_spam_pattern, wallet_velocity_anomaly, verification_mismatch, support_abuse_pattern, booking_brute_force, moderation_repeat_failure, upload_pattern_suspicious), `ACCOUNT_TRUST_TIERS` (`:273-278` — basic, verified, trusted, premium_verified), `TRIAGE_CONFIDENCE_ESCALATE_THRESHOLD = 0.55` (`:213`), `parseHenryFeatureFlags:293-314` reading `NEXT_PUBLIC_HENRY_FLAG_INTELLIGENCE_{EVENTS,RECOMMENDATIONS,STAFF_QUEUES}`.
- **Wired into account support routes:** `apps/account/lib/intelligence-rollout.ts:7-13` imports `triageSupportStub`, `nextAccountSteps`, `noopSink`, `trackEvent`, `HenryEventNames` from `@henryco/intelligence`. `apps/account/app/api/support/{create, reply}/route.ts` apply triage + emit events per `docs/intelligence-rollout-status.md:8-11`.
- **Account task center derivation:** `apps/account/lib/intelligence-rollout.ts` derives tasks from live trust/profile/saved state.
- **Staff intelligence aggregator:** `apps/staff/lib/intelligence-data.ts` per `docs/intelligence-rollout-status.md:20-23`.
- **Hardening per `docs/intelligence-rollout-status.md:24-29`:** account webhook signed + timestamped + idempotent; support create/reply with idempotency keys + explicit degraded side effects; jobs+logistics cron auth (e.g. `apps/studio/app/api/cron/studio-automation/route.ts:7-11` checks `Bearer ${CRON_SECRET}`).
- **CORRECTED FROM BASELINE — Anthropic SDK IS present and used in studio:** `@anthropic-ai/sdk@^0.92.0` declared at `apps/studio/package.json:19` and `package.json:45`. Two server actions consume it:
  - `apps/studio/lib/studio/brief-copilot-action.ts:5` — `import Anthropic from "@anthropic-ai/sdk"`. Anti-abuse rails per file comment lines 22-50: anon limit 5/session, auth limit 20/day, IP limit 10/day, system limit 500/day, dedup window 24h. Uses model `BRIEF_COPILOT_MODEL` from `brief-copilot-prompt.ts`.
  - `apps/studio/lib/portal/refine-draft-action.ts:3` — `import Anthropic from "@anthropic-ai/sdk"`. Model `claude-haiku-4-5-20251001` per `refine-draft-action.ts:19`. Polishes client/team message drafts; gracefully falls back when `ANTHROPIC_API_KEY` absent (lines 90-99).
- **`docs/intelligence-rollout-status.md:48-52` confirms the still-limited state:** no persisted `customer_tasks` table; no unified event ingest endpoint; no outbox worker for secondary side effects (routes report degraded side effects explicitly).

### Weak or partial

- **`triageSupportStub` is regex-based** (`packages/intelligence/src/index.ts:215-244`) — not LLM-backed.
- **Recommendations engine** is deterministic 3-rule output — no learned model.
- **Studio is the only Anthropic consumer** — no cross-platform "HenryCo Intelligence" provider router exists; the SDK is tied directly to two server actions.
- **Feature flag gating:** `parseHenryFeatureFlags` only governs 3 flags (events, recommendations, staff_queues); no per-task budget flag or wallet-zero kill switch.

### Missing entirely

- **Vendor-agnostic provider router** (`PaymentProviderRouter`-style abstraction for AI providers): no file in `packages/` implements this. (V3-26 target.)
- **Usage-billing engine:** no `ai_usage_events`, `ai_usage_meters`, or similar table. Anthropic calls in studio are billed to the company directly, not metered + wallet-debited. (V3-27 target.)
- **UI surface labeled "HenryCo Intelligence":** no React component named `HenryCoIntelligence*` in `packages/ui/` (verified via grep — no matches). The studio brief copilot does NOT carry the "HenryCo Intelligence" brand.
- **Hard wallet-zero cap on AI calls:** no middleware checks wallet before the Anthropic call. The studio paths have rate-limit rails but no per-call billing.
- **Per-task company-critical vs personal-task gating:** no such taxonomy exists in code.
- **Unauth-blocking for personal-task AI:** `refine-draft-action.ts:80-87` does block unauth (returns `unauthorised`), but it's per-action ad hoc, not centralized at a router.
- **`customer_tasks` persisted table:** confirmed absent — `docs/intelligence-rollout-status.md:50` explicitly states "not yet added in this pass".

### GOVERNANCE-CRITICAL gap

The brand-name discipline ("Do not name the underlying provider anywhere in the UI; it is 'HenryCo Intelligence' only" per `AUDIT-BASELINE.md:387` and `ANTI-CLONE.md` Principle 9) is **not enforced today** — the studio AI surface has not been examined for brand compliance, and there is no central guard in the proposed router. V3-26 / V3-28 must enforce this from day 1.

### Pass coverage

- `docs/v3/prompts/v3-26-ai-provider-router.md`
- `docs/v3/prompts/v3-27-ai-usage-billing-engine.md`
- `docs/v3/prompts/v3-28-ai-henryco-intelligence-chat-surface.md`
- `docs/v3/prompts/v3-29-ai-support-message-assist.md`
- `docs/v3/prompts/v3-30-ai-business-message-assist.md`
- `docs/v3/prompts/v3-31-ai-account-check-assist.md`
- `docs/v3/prompts/v3-32-ai-studio-domain-and-brief-assist.md`
- `docs/v3/prompts/v3-33-ai-personal-task-gating.md`

### Cross-pillar dependencies

- **Feeds:** P3 (V3-34 personalization-home depends on V3-26 per `DEPENDENCIES.md:58`), P6 (predictive uses LLM where appropriate — V3-40, V3-41 depend on V3-26), P5 (workflow auto-escalate may use LLM), P8 (business-message-assist V3-30), P1 (concierge V3-59 depends on V3-28).
- **Waits on:** D3 (provider selection) blocks V3-26; D4 (pricing markup) blocks V3-27. V3-26 itself waits on V3-12 per `DEPENDENCIES.md:50`.
- **Co-evolves with:** P2 (V3-27 requires V3-17 ledger hardening for wallet auto-debit per `DEPENDENCIES.md:51`), P9 (margin layered on AI cost = revenue line), P7 (V3-33 personal-task gating is identity-touching).

---

## P5 — Automation & Workflow Engine

### Ships today

- **Support triage + escalation (deterministic):** `triageSupportStub` in `packages/intelligence/src/index.ts:215-244` and the rollout in `apps/account/lib/intelligence-rollout.ts`. `TRIAGE_CONFIDENCE_ESCALATE_THRESHOLD = 0.55` (`packages/intelligence/src/index.ts:213`).
- **Cron handlers — full inventory across all 10 apps (14 active routes):**

  | App | Route | Schedule (vercel.json) | Purpose |
  |---|---|---|---|
  | account | `/api/cron/engagement-sweep/route.ts` | (per-app) | V2-CART-01 hourly engagement sweep |
  | account | `/api/cron/notification-email-fallback/route.ts` | (per-app) | V2-NOT-01-C email-fallback delivery |
  | account | `/api/cron/notification-purge/route.ts` | (per-app) | V2-NOT-02-A 30-day recently-deleted purge |
  | care | `/api/cron/care-automation/route.ts` | `15 8 * * *` (`apps/care/vercel.json:6-9`) | Care automation sweep daily 08:15 UTC |
  | hub | `/api/cron/owner-reporting/{weekly,monthly}/route.ts` | (per-app) | Owner reporting weekly + monthly digests |
  | hub | `/api/cron/owner-reports/route.ts` | `5 7 * * *` (`apps/hub/vercel.json:6-10`) | Daily owner-reports at 07:05 UTC |
  | hub | `/api/cron/search-index-worker/route.ts` | `* * * * *` (`apps/hub/vercel.json:11-14`) | V2-SEARCH-01 outbox drain every minute |
  | jobs | `/api/cron/jobs-alerts/route.ts` | (per-app) | Jobs candidate alerts (OneSignal-aware) |
  | learn | `/api/cron/learn-automation/route.ts` | (per-app) | Learn automation sweep |
  | logistics | `/api/cron/logistics-automation/route.ts` | `*/15 * * * *` (`apps/logistics/vercel.json:6-9`) | Logistics automation every 15 min |
  | marketplace | `/api/cron/marketplace-automation/route.ts` | (per-app) | Marketplace automation sweep |
  | property | `/api/cron/property-automation/route.ts` | (per-app) | Property automation sweep |
  | studio | `/api/cron/studio-automation/route.ts` | `0 */6 * * *` (`apps/studio/vercel.json:6-9`) | Studio automation every 6 hours |
  | staff | (no cron) | — | Staff app has no cron registered |

  Total: **14 cron routes across 8 apps** — coverage has grown substantially from the V3-DISCOVERY-INVENTORY (which listed account + hub + jobs + logistics only). Every per-app automation sweep is authenticated via `CRON_SECRET` Bearer token following the pattern in `apps/studio/app/api/cron/studio-automation/route.ts:7-11`.
- **Studio automation sweep:** `apps/studio/app/api/cron/studio-automation/route.ts:1-34` calls `runStudioAutomationSweep` (defined in `apps/studio/lib/studio/automation.ts`). Studio reminders helper at `apps/studio/lib/studio/automation-reminders.ts`. Authenticated via `CRON_SECRET` Bearer token (lines 7-11).
- **Owner reporting:** `apps/hub/lib/owner-reporting.ts` per `docs/intelligence-rollout-status.md:32-35`.
- **Intelligence event emission:** account routes emit events via `apps/account/lib/intelligence-rollout.ts` per `docs/intelligence-rollout-status.md:11`.
- **`@henryco/observability` audit-log:** `packages/observability/src/audit-log.ts:1-40` wraps `add_audit_log_v2()` SECURITY DEFINER function. Consumed in `apps/hub/lib/owner-audit-log.ts`.
- **Search-index outbox:** `apps/hub/supabase/migrations/20260502180000_search_index_outbox_v2_search_01.sql` plus `apps/hub/app/api/cron/search-index-worker/route.ts`.
- **Notification realtime publication:** `apps/hub/supabase/migrations/20260501130000_notification_realtime_publication.sql`. Per-app realtime publications at `apps/{studio,property,jobs,care,logistics,learn}/supabase/migrations/*_realtime_publication.sql`.

### Weak or partial

- **Auto-assign tickets:** present via deterministic triage's `suggestedQueue` field (`packages/intelligence/src/index.ts:226-232`), but no persisted assignment workflow with reassignment audit.
- **Auto-escalate:** threshold-based on confidence + urgent keywords (`packages/intelligence/src/index.ts:225-237`); no SLA-aware escalation chain.
- **Reminders:** exist for studio only (`apps/studio/lib/studio/automation-reminders.ts`); no cross-division reminder framework.
- **Owner reports:** `apps/hub/lib/owner-reporting.ts` plus cron — emits owner-only reports; no per-division weekly/monthly auto-generated PDF.

### Missing entirely

- **Generalized workflow engine** — no `workflow_definitions`, `workflow_runs`, or similar table; no orchestrator package.
- **Auto-detect neglected queues** — no monitoring that compares queue dwell time against SLA threshold.
- **Auto-create staff tasks** — no `customer_tasks` table (confirmed absent per `docs/intelligence-rollout-status.md:50`).
- **Auto-trigger follow-up campaigns** — no campaign engine; newsletter foundation only.
- **Cross-division workflow** — each cron is division-scoped; no shared workflow primitive.

### Pass coverage

- `docs/v3/prompts/v3-43-workflow-engine-foundation.md`
- `docs/v3/prompts/v3-44-workflow-auto-assign-escalate.md`
- `docs/v3/prompts/v3-45-workflow-auto-remind.md`
- `docs/v3/prompts/v3-46-workflow-owner-reports.md`
- `docs/v3/prompts/v3-47-workflow-neglected-queue-detection.md`
- `docs/v3/prompts/v3-48-workflow-follow-up-campaigns.md`

### Cross-pillar dependencies

- **Feeds:** P3 (V3-37 abandoned-task-recovery waits on V3-43 per `DEPENDENCIES.md:69`), P12 (V3-90 data lake depends on V3-43 per `DEPENDENCIES.md:114`), P1 (V3-61 newsletter engine depends on V3-48 per `DEPENDENCIES.md:85`).
- **Waits on:** P12 V3-10 (logs / states / fallbacks) per `DEPENDENCIES.md:67`.
- **Co-evolves with:** P4 (AI-augmented escalation in V3-44), P6 (workload prediction informs queue routing), P12 (observability traces inform queue health).

---

## P6 — Predictive & Analytical Intelligence

### Ships today

- **8 deterministic risk-signal types:** `packages/intelligence/src/index.ts:246-254`. Each `RiskSignal` includes `severity ("info" | "low" | "medium" | "high")` and `metadataKeys` array.
- **Account trust tiers:** `ACCOUNT_TRUST_TIERS = ["basic", "verified", "trusted", "premium_verified"]` (`packages/intelligence/src/index.ts:273-278`).
- **Trust scoring rules:** `packages/trust/verification.ts`. Trust score caps per `docs/trust-score-rules.md:18-25`: `none → max 58, basic`; `pending → 72, verified`; `rejected → 38, basic`. Consumers: `apps/account/lib/trust.ts`, `apps/jobs/lib/jobs/data.ts`, `apps/marketplace/lib/marketplace/data.ts`, `apps/property/lib/property/trust.ts`.
- **Trust scoring infra migration:** `apps/hub/supabase/migrations/20260416120000_trust_scoring_infra.sql` (trust_flags + OCR scaffold).
- **Staff intelligence aggregator:** `apps/staff/lib/intelligence-data.ts` — referenced in `docs/intelligence-rollout-status.md:20`.
- **Jobs trust events:** `JOBS_EMPLOYER_TRUST_COMPUTED`, `JOBS_INTERVIEW_NO_SHOW`, `JOBS_EMPLOYER_MODERATION_INCIDENT` (`packages/intelligence/src/index.ts:62-64`).
- **Marketplace trust events:** `MARKETPLACE_SELLER_TRUST_RECALCULATED`, `MARKETPLACE_REVIEW_FLAGGED`, `MARKETPLACE_REVIEW_BLOCKED`, `MARKETPLACE_DISPUTE_TRUST_IMPACT` (`packages/intelligence/src/index.ts:66-69`).
- **Marketplace recommendation signals:** `apps/marketplace/supabase/migrations/20260514121500_marketplace_recommendation_signals.sql`.

### Weak or partial

- **Risk signals are rules-based not ML.** No labeled-risk training dataset; no scored prediction. The 8 signal types declare schema; the actual emission logic lives in division-specific code.
- **Staff support prioritized queue** is deterministic ordering on the triage output.

### Missing entirely

- **Fraud / risk prediction model** — no ML model trained on labeled signals.
- **Daily-scored risk for accounts / listings / transactions / support tickets** — no `risk_scores` table or scheduled scoring job.
- **Staff workload prediction** — no model.
- **Support summarization** — would need LLM (and AI provider router; see P4).
- **Deal recommendations / pricing suggestions / seller growth suggestions** — none.
- **Property fraud detection** — `property_listing_governance.md` documents the policy gap; no detection layer.
- **Service quality warnings / dispute likelihood / course recommendations / job match scoring** — none.
- **Advanced staff intelligence dashboards** beyond `apps/staff/lib/intelligence-data.ts` live aggregator.

### Pass coverage

- `docs/v3/prompts/v3-40-predictive-fraud-and-risk.md`
- `docs/v3/prompts/v3-41-predictive-quality-and-workload.md`
- `docs/v3/prompts/v3-42-predictive-staff-dashboards.md`

### Cross-pillar dependencies

- **Feeds:** P7 (V3-40 fraud signals route to safety operators), P3 (recommendations consume risk-clean signal), P9 (suspect transactions routed to manual review).
- **Waits on:** V3-26 AI provider router per `DEPENDENCIES.md:64-65` (both V3-40 and V3-41).
- **Co-evolves with:** P4 (LLM augments rules-based detection), P5 (workflow engine routes high-risk to queues), P12 (data lake for model training).

---

## P7 — Trust, Safety & Compliance

### Ships today

- **KYC submissions table + internal review:** `apps/hub/supabase/migrations/20260410130000_kyc_verification_infra.sql:9-15` adds `verification_status` / `verification_submitted_at` / `verification_reviewed_at` / `verification_reviewer_id` / `verification_note` columns to `customer_profiles`. Lines 19-31 add `customer_verification_submissions` table with `document_type` ∈ `government_id | selfie | address_proof | business_cert`. Indexes at lines 33-38. RLS enabled line 40. No external vendor wired.
- **KYC sensitive-action gating:** documented at `docs/kyc-sensitive-action-gating.md` (per baseline §2.1).
- **Trust flags + review safety:** `packages/trust/{detect.ts, index.ts, moderation.ts, verification.ts, package.json}`.
- **Content moderation hooks:** `packages/trust/moderation.ts`. Jobs employer moderation event at `packages/intelligence/src/index.ts:64`. Marketplace review flagging/blocking events at `:66-69`.
- **PNH-04 baseline:** HSTS preload, frame-ancestors none, XFO DENY, CTO nosniff, Referrer strict-origin-when-cross-origin, Permissions-Policy locked per `V3-DISCOVERY-INVENTORY.md:404-409`. Wired in `packages/config/` headers helpers.
- **OneSignal Service Worker:** `OneSignalSDKWorker.js` shipped to ALL 10 web apps (`apps/{account,care,hub,jobs,learn,logistics,marketplace,property,staff,studio}/public/OneSignalSDKWorker.js` confirmed present).
- **Idempotency + nonce scope:** `apps/hub/supabase/migrations/20260407193000_idempotency_and_nonce_scope.sql`.
- **Account webhook receipts:** `apps/hub/supabase/migrations/20260407190000_account_webhook_receipts.sql`.
- **Referral fraud hardening:** `apps/hub/supabase/migrations/20260410120000_referral_fraud_hardening.sql`.
- **RLS hot patch (D8 fix):** `apps/hub/supabase/migrations/20260509120000_v2_closure_d8_rls_hot_patch.sql:32-37` enables + forces RLS + revokes anon grants on `wallets`, `wallet_transactions`, `care_pricing_items`, `care_site_settings`. Policy detail at lines 64-111 (owner-scoped SELECT for wallet tables).
- **Security invoker on views:** `apps/hub/supabase/migrations/20260514100000_security_invoker_views.sql`.
- **Function search-path lockdown:** `apps/hub/supabase/migrations/20260514110000_function_search_path_lockdown.sql`.
- **Auth RLS init-plan wrap:** `apps/hub/supabase/migrations/20260514140000_auth_rls_initplan_wrap.sql` (wraps `auth.<fn>()` in 200 RLS policies — referenced in baseline §2.11).
- **Auth RLS init-plan storage policies:** `apps/hub/supabase/migrations/20260515060000_auth_rls_initplan_storage_policies.sql`.
- **Audit log writer:** `packages/observability/src/audit-log.ts:1-40` (wraps `add_audit_log_v2()` per DASH-9).

### Weak or partial

- **KYC has no external vendor wired** — internal manual review only. No Smile Identity / Onfido / Sumsub / Verisoul SDK in any `package.json` (verified).
- **Content moderation is per-division ad hoc** — `packages/trust/moderation.ts` is shared, but consuming routes live in each division's own data layer; no central content-moderation framework.
- **Dispute resolution mechanic** — `MARKETPLACE_DISPUTE_TRUST_IMPACT` event exists; no formal dispute surface UI.

### Missing entirely

- **Escrow patterns** (studio/property/marketplace high-value transactions) — no `escrow_*` table; no API.
- **Per-market KYC maturity** — Nigeria-only assumption baked into KYC schema.
- **Gaming-arena compliance framework** — no migration for gaming jurisdiction gates.
- **Spam / abuse / harassment defense beyond rate limits** — no abuse-pattern detector, no shadow-ban mechanism, no harassment-report surface.
- **DSAR / GDPR / CCPA / NDPR endpoints** — no `apps/*/app/api/privacy/{export, delete}` route exists.

### Pass coverage

- `docs/v3/prompts/v3-24-identity-kyc-vendor-integration.md`
- `docs/v3/prompts/v3-25-identity-content-moderation-framework.md`
- `docs/v3/prompts/v3-93-compliance-privacy-data-rights.md`
- `docs/v3/prompts/v3-21-payments-tax-engine.md` (P2 + P7 dual-tagged)
- `docs/v3/prompts/v3-50-product-verified-provider-model.md` (P1+P7+P8 cross-pillar)
- `docs/v3/prompts/v3-44-workflow-auto-assign-escalate.md` (P5 + P7)
- `docs/v3/prompts/v3-67-partner-onboarding.md` (P8 + P7)

### Cross-pillar dependencies

- **Feeds:** every pillar handling money / identity / user content — P2 (KYC gates wallet withdrawals), P8 (partner onboarding requires KYC), P10 (gaming compliance), P1 (verified provider model is identity-rooted).
- **Waits on:** D6 (KYC vendor selection per market) blocks V3-24; P12 V3-12 Foundation Lock blocks V3-24 / V3-25 per `DEPENDENCIES.md:48-49`.
- **Co-evolves with:** P4 (LLM-assisted content moderation per V3-25 description), P12 (per-market data residency for V3-93), P6 (fraud signals route to P7 review queues).

---

## P8 — Partner & Enterprise Ecosystem

### Ships today

- **Logistics operator workspaces:** `apps/logistics/app/(staff)/{dispatcher, manager, owner, rider}` — four operator roles per workspace path. Schema in `apps/logistics/supabase/migrations/20260514122000_logistics_fleet.sql` and `20260514122500_logistics_b2b_accounts.sql`.
- **Studio teams page:** `apps/studio/app/(public)/teams/page.tsx` (verified directory exists).
- **Per-division operator role memberships:** per `V3-DISCOVERY-INVENTORY.md:252-260` — `jobs_role_memberships`, `learn_role_memberships`, `logistics_role_memberships`, `marketplace_role_memberships`, `property_role_memberships`, `studio_role_memberships` (six division role tables; care uses legacy `profiles.role` fallback).
- **`is_staff_in()` SECURITY DEFINER:** baseline §2.1; also `apps/hub/supabase/migrations/20260508120000_is_staff_in_any.sql` extends to `is_staff_in_any`.
- **Marketplace seller tiers:** `apps/marketplace/supabase/migrations/20260501020000_marketplace_seller_tiers.sql`.
- **Property managed listings:** `apps/property/lib/property/policy.ts` per `docs/trust-score-rules.md:58-60`.
- **B2B logistics statement PDF:** `packages/branded-documents/src/templates/logistics-b2b-statement.tsx` plus `logistics_b2b_accounts` migration.
- **Vendor payout statement / tax document PDFs:** `packages/branded-documents/src/templates/vendor-payout-statement.tsx`, `vendor-tax-document.tsx`.
- **Owner report PDF:** `packages/branded-documents/src/templates/owner-report.tsx`.

### Weak or partial

- **Care partner onboarding:** `care_pricing_items` table exists but its RLS was open pre-`20260509120000_v2_closure_d8_rls_hot_patch.sql:35`; no formal care-provider onboarding flow.
- **Marketplace seller tiers** schema present, no UI for seller progression or quality-gated tier escalation surface.
- **Property managed listings** — table exists, no business storefront.

### Missing entirely

- **Partner onboarding flow with KYC integration** — no `partner_onboarding_state` table, no onboarding wizard route.
- **Performance scoring + contracts + payouts engine + service-area model + quality scoring.**
- **Employer hiring suite (ATS-grade):** no `applicant_tracking_*` table beyond `apps/jobs/supabase/migrations/20260515122500_jobs_pipeline_extras.sql`; no candidate scoring surface; no team-collaboration.
- **Seller business suite / service-provider CRM / studio project suite / logistics business dashboard.**
- **Bulk invoicing, team roles, company admin accounts** — no `companies` table, no `team_memberships` table beyond per-division role memberships.

### Pass coverage

- `docs/v3/prompts/v3-67-partner-onboarding.md`
- `docs/v3/prompts/v3-68-partner-performance-and-contracts.md`
- `docs/v3/prompts/v3-69-partner-payouts.md`
- `docs/v3/prompts/v3-70-enterprise-employer-hiring-suite.md`
- `docs/v3/prompts/v3-71-enterprise-seller-business-suite.md`
- `docs/v3/prompts/v3-72-enterprise-service-provider-crm.md`
- `docs/v3/prompts/v3-73-enterprise-studio-project-suite.md`
- `docs/v3/prompts/v3-74-enterprise-logistics-business-dashboard.md`
- `docs/v3/prompts/v3-75-enterprise-bulk-invoicing-team-roles-admin.md`

### Cross-pillar dependencies

- **Feeds:** P2 (V3-69 partner payouts depends on V3-14/V3-15/V3-16/V3-67 per `DEPENDENCIES.md:93`), P11 (every public API + V3-77 seller API depends on V3-57 + V3-71 per `DEPENDENCIES.md:101`).
- **Waits on:** P7 V3-24 (KYC) is a hard prerequisite for V3-50 + V3-67 per `DEPENDENCIES.md:74, 91`. P12 V3-12 for V3-57 per `DEPENDENCIES.md:81`. P1 product passes deeply feed P8 (V3-50 product-verified-provider-model is tri-tagged P1+P7+P8 and unblocks V3-67/V3-72).
- **Co-evolves with:** P9 (monetization via payouts), P2 (financial spine), P11 (public APIs for partners).

---

## P9 — Revenue Engine & Monetization Integrity

### Ships today

- **Pricing governance + breakdown persistence:** `apps/hub/supabase/migrations/20260417170000_shared_pricing_governance.sql`, `apps/marketplace/supabase/migrations/20260417160000_marketplace_pricing_breakdowns.sql`. `@henryco/pricing` exports `currency-model.ts`, `currency-sanity.ts`, `exchange-rate.ts`.
- **Honest line-item display:** marketplace + studio + property consumers of `@henryco/pricing`.
- **Referral fraud hardening:** `apps/hub/supabase/migrations/20260410120000_referral_fraud_hardening.sql`.
- **Wallet withdrawals:** `apps/hub/supabase/migrations/20260406140000_wallet_withdrawals.sql:3` adds `customer_wallet_withdrawal_requests`.
- **Studio payment plans:** `apps/studio/supabase/migrations/20260514131500_studio_payment_plans.sql`.

### Weak or partial

- **Referral fraud hardening** is migration-level; the live anti-abuse engine has not been verified end-to-end.

### Missing entirely

- **User earning opportunities surface** — no `earnings_*` surface or table beyond the wallet withdrawal flow.
- **Partner economy / rewards / referral with anti-abuse beyond the hardening migration.**
- **Transparent revenue-share UI** — no per-partner revenue-share dashboard.
- **Monetization integrity audit** (per-transaction margin attestation).
- **Anti-reverse-engineering hardening** — cross-references `ANTI-CLONE.md` Principle 1 (server-side business logic), Principle 2 (auth-gated scoring), Principle 9 (network behavior masking). None of these are encoded as automated checks in `scripts/`.
- **AI usage margin layered onto Anthropic provider cost** — see P4 V3-27 (depends on V3-17 ledger hardening, blocked by D4 owner gate for ~10% margin ratification).

### Pass coverage

P9 has limited direct V3-NN prompts — most P9 outcomes are delivered via P2 (revenue plumbing) + P8 (partner payouts) + P4 (AI usage billing):
- `docs/v3/prompts/v3-17-payments-ledger-hardening.md` (dual-tagged P2 + P9)
- `docs/v3/prompts/v3-27-ai-usage-billing-engine.md` (dual-tagged P4 + P2 + P9)
- `docs/v3/prompts/v3-69-partner-payouts.md` (P8 + P2)
- `docs/v3/prompts/v3-75-enterprise-bulk-invoicing-team-roles-admin.md` (P8 + P2)
- `ANTI-CLONE.md` Principles 1, 2, 9 are the cross-cutting guards.

### Cross-pillar dependencies

- **Feeds:** owner reporting + finance dashboard surfaces.
- **Waits on:** P2 ledger + P8 partner economy + P4 AI usage billing. P9 has no standalone Phase E/F/G pass — its outputs ride on those phases.
- **Co-evolves with:** every revenue-producing pillar; ANTI-CLONE.md Principle 10 (data + trust moats) is the strongest non-code defense.

---

## P10 — Studio Live / Gaming Arena

### Ships today

- **`@henryco/rooms` is NOT a skeleton — it is fully built but unconsumed** (correcting baseline §4 P10 framing):
  - Package at `packages/rooms/src/`. Public surface at `packages/rooms/src/index.ts:1-31` exports types + errors + `selectProvider` + `selectProviderName`.
  - **Provider drivers** at `packages/rooms/src/providers/{daily.ts, jitsi.ts}` — Daily.co primary and Jitsi fallback per `packages/rooms/src/provider-selector.ts:9-26`. Provider selection matrix at `:9-19`. Default Jitsi instance `meet.jit.si` per `:42`. Test override seam at `:46-56`.
  - **Components** at `packages/rooms/src/components/`: `CollabEditorPane.tsx`, `PresencePane.tsx`, `RecordingConsent.tsx`, `RoomBadge.tsx`, `RoomChat.tsx`, `RoomShell.tsx`, `ScorecardSidebar.tsx`, `ScreenSharePane.tsx`.
  - **Hooks** at `packages/rooms/src/hooks/`.
  - **Server actions** at `packages/rooms/src/server/{actions.ts, supabase.ts}`.
  - **Realtime** at `packages/rooms/src/realtime/`.
  - **Tests** at `packages/rooms/src/__tests__/`.
- **Rooms schema migrations:** `apps/hub/supabase/migrations/20260515100000_rooms_sessions.sql` through `20260515100600_rooms_realtime_publication.sql` (seven migrations: sessions, participants, recordings_consent, recordings, scorecards, messages, realtime_publication).
- **Jobs interview rooms migration:** `apps/jobs/supabase/migrations/20260515121000_jobs_interview_rooms.sql` (schema-ready).
- **Daily webhook receiver:** `apps/jobs/app/api/webhooks/daily/` (confirmed directory exists).

### Weak or partial

- **Zero app consumes `@henryco/rooms`.** Verified: `grep -r "@henryco/rooms" apps/**/{package.json,*.ts,*.tsx}` returns no matches in the active workspace (only the package's own package.json references it). The rooms infrastructure ships ahead of any UI surface — both jobs (V3-54) and studio (V3-73) interview/project rooms need to import it.
- **Jobs has its OWN Daily.co integration outside the rooms package:** `apps/jobs/lib/jobs/interview-room.ts:1-40` is a standalone Daily.co provider (file-level header: "V3 PASS 21 — Daily.co interview-room provider"). It uses env `DAILY_API_KEY / DAILY_DOMAIN / DAILY_WEBHOOK_SECRET / DAILY_WEBHOOK_ID / DAILY_DOMAIN_NAME` (lines 9-14) and defines `InterviewRoomRecord { provider: "daily.co" | "jitsi" | "google-meet" | "zoom" }` at lines 35-40 — a parallel taxonomy to `@henryco/rooms` provider-selector's `daily | jitsi`. Webhook receiver at `apps/jobs/app/api/webhooks/daily/route.ts:1-30` validates Daily HMAC. **Implication:** consolidating jobs to `@henryco/rooms` is a deferred V3-54 refactor — the rooms package was built later than jobs interview infrastructure, so jobs has its own copy.

### Missing entirely (gaming-arena scope — distinct from rooms)

- **Original game catalog** — no `games`, `game_modes`, `match_types` table.
- **PvP mechanic** — no matchmaking schema.
- **Wallet-funded match stakes** — no `match_stakes` table linking to `wallet_transactions`.
- **Invitations + notifications + spectator + replay** for matches.
- **Moderation + anti-cheat + fair-play audit + jurisdiction-specific compliance gates.**

### Gated

- Per `AUDIT-BASELINE.md:416` and `PASS-REGISTER.md:171-172`: V3-65 and V3-66 are **GATED on owner legal sign-off per market (D2)**.

### Pass coverage

- `docs/v3/prompts/v3-54-product-jobs-interview-room.md` (the first concrete `@henryco/rooms` consumer)
- `docs/v3/prompts/v3-65-gaming-arena-foundation.md`
- `docs/v3/prompts/v3-66-gaming-arena-stakes-spectator-replay.md`
- `docs/v3/prompts/v3-73-enterprise-studio-project-suite.md` (rooms used for studio client rooms)

### Cross-pillar dependencies

- **Feeds:** P1 (jobs interview room is P1 product), P8 (enterprise studio project suite).
- **Waits on:** V3-13 + V3-17 + V3-24 per `DEPENDENCIES.md:89` (V3-65 depends on payment router + ledger + KYC). V3-66 depends on V3-65 (`:90`). D2 (gaming legal posture per market) is the owner-decision blocker.
- **Co-evolves with:** P2 (wallet stakes), P7 (anti-cheat + jurisdiction compliance), P12 (per-market gating).

---

## P11 — Platform & API Layer

### Ships today

- **Webhook receivers (already enumerated under P5):**
  - `apps/account/app/api/webhooks/account/`
  - `apps/care/app/api/webhooks/{resend, whatsapp}/`
  - `apps/studio/app/api/webhooks/{resend, whatsapp}/`
  - `apps/care/app/api/webhooks/whatsapp/`
  - `apps/property/app/api/webhooks/whatsapp/`
  - `apps/logistics/app/api/webhooks/whatsapp/`
  - `apps/jobs/app/api/webhooks/daily/`
- **Cron handlers (already enumerated under P5):** account / hub / jobs / logistics / studio.
- **Document download API:**
  - `apps/account/app/api/documents/[type]/[id]/` (multi-type)
  - `apps/learn/app/api/certificates/[code]/pdf/`
- **Per-division public APIs — full inventory:**

  | App | API subpaths (top-level under `/api/`) |
  |---|---|
  | account | `addresses, auth, cron, dashboard, documents, locale, notifications, preferences, profile, property, proxy, referral, runtime-error, saved-items, search, studio, support, verify, wallet, webhooks` (20) |
  | care | `auth, care, cron, locale, owner, webhooks` (6) |
  | hub | `auth, cron, locale, newsletter, owner, profile, search` (7) |
  | jobs | `auth, candidate, cron, hiring, jobs, locale, webhooks` (7) |
  | learn | `auth, certificates, cron, learn, locale` (5) |
  | logistics | `logistics/{book, claims, dispatch, pod, quote, track}` plus `auth, cron, locale, webhooks` (10 total) |
  | marketplace | `auth, cart, cron, follows, health, locale, marketplace, orders, products, readiness, saved-items, seller-applications, shell, version, wishlist` (15) |
  | property | `auth, cron, locale, property, webhooks` (5) |
  | staff | `auth, kyc, newsletter, support` (4) |
  | studio | `auth, cron, documents, locale, portal, studio, support, webhooks` (8) |

  Total: **~87 top-level API subpaths across the 10 apps**, all consumed by their own app (no formal partner-facing API). Every app has `/api/auth/`, every app has `/api/locale/`. No app has `/api/v1/` or `/api/v2/` (versioning scheme absent).

### Weak or partial

- **No formal seller / logistics / booking / business-account API:** each app's `/api/*` routes are app-private; no versioned partner-facing API exists.
- **WhatsApp HMAC:** receivers exist per `AUDIT-BASELINE.md:83` ("HMAC verification per V3 backlog B1 status"); receivers in `apps/{care,property,studio,logistics}/app/api/webhooks/whatsapp/` need re-verification against B1.

### Missing entirely

- **Versioning scheme** — no `apps/*/app/api/v1/` or `v2/` route segment found.
- **Rate limiting beyond signup PNH-04** — no per-route per-IP middleware sweep.
- **Auth scopes for partner API** — no `api_key_scopes` or `partner_tokens` table.
- **Developer docs** — no `developers.henrycogroup.com` route (would live in hub or a new app).
- **Analytics exports** — no CSV/JSON scheduled-delivery endpoint.
- **Partner integration framework** — no SDK, no example clients.
- **Webhook delivery service** — receivers exist; outbound versioned/signed/retryable webhook dispatcher does not.

### Pass coverage

- `docs/v3/prompts/v3-76-platform-public-api-foundation.md`
- `docs/v3/prompts/v3-77-platform-seller-api.md`
- `docs/v3/prompts/v3-78-platform-logistics-api.md`
- `docs/v3/prompts/v3-79-platform-booking-api.md`
- `docs/v3/prompts/v3-80-platform-business-account-api.md`
- `docs/v3/prompts/v3-81-platform-webhook-delivery-service.md`
- `docs/v3/prompts/v3-82-platform-analytics-exports.md`
- `docs/v3/prompts/v3-83-platform-developer-docs.md`

### Cross-pillar dependencies

- **Feeds:** P8 (every business suite + V3-83 docs benefit), P12 (V3-82 analytics-exports depends on V3-90 data lake per `DEPENDENCIES.md:106`).
- **Waits on:** P12 V3-02 (auth reliability) per `DEPENDENCIES.md:100`. P1 / P8 product passes (V3-77 needs V3-71; V3-78 needs V3-74; V3-79 needs V3-51; V3-80 needs V3-75).
- **Co-evolves with:** P12 (versioning + observability + rate limiting all rely on P12 traces / SLOs / observability depth).

---

## P12 — Global, Mobile, Observability, Closure

### Ships today

- **i18n 12 locales (strings):** `packages/i18n/src/locales.ts:18` declares `ALL_LOCALES = ["en", "fr", "ig", "yo", "ha", "ar", "es", "pt", "de", "it", "zh", "hi"]`. Locale tiers at `:22-35`: `en, fr` production-ready; `es, pt, ar, de, it` native-ui-ready; `ig, yo, ha, zh, hi` scaffold. DeepL fallback at `packages/i18n/src/deepl.ts` (DEEPL_API_URL constant + fetch wrapper). Runtime translate at `packages/i18n/src/translate-runtime.ts`. Per-app copy modules at `packages/i18n/src/{account-copy.ts, care-copy.ts, jobs-copy.ts, learn-*-copy.ts, logistics-*-copy.ts, marketplace-copy.ts, hub-*-copy.ts}`. i18n translation cache schema at `apps/hub/supabase/migrations/20260510010000_i18n_translation_cache.sql`.
- **Multi-currency foundation:** `apps/hub/supabase/migrations/20260419120000_multi_currency_schema_foundation.sql`. `@henryco/pricing` currency-model + exchange-rate primitives.
- **Expo super-app skeleton:** `apps/super-app/` (3,145+ LOC per inventory). Platform contracts at `apps/super-app/src/platform/contracts/{auth, database, media, notifications, payments, analytics, monitoring}`. Adapters at `apps/super-app/src/platform/adapters/{mock, expo, supabase, cloudinary, sentry.monitoring.ts, payments.deferred.ts}`. Runtime modes (local / staging / production) at `apps/super-app/src/platform/bundle.ts` per `docs/architecture-summary.md:15-25`.
- **Expo company-hub skeleton:** `apps/company-hub/` (3,735+ LOC per inventory).
- **`@henryco/observability`:** `packages/observability/src/{logger.ts, redaction.ts, events.ts, audit-log.ts, sentry/}`.
- **Sentry.init wired in 3 of 10 web apps:**
  - `apps/account/instrumentation.ts` + `apps/account/instrumentation-client.ts` (confirmed exist)
  - `apps/hub/instrumentation.ts` + `apps/hub/instrumentation-client.ts` (confirmed exist)
  - `apps/staff/instrumentation.ts:13` (calls `Sentry.init(buildServerSentryConfig())`) + `:16` (edge) + `apps/staff/instrumentation-client.ts:7` (client)
  - **Missing on 7 apps:** care, jobs, learn, logistics, marketplace, property, studio (no `instrumentation.ts` file found at those paths).
- **Super-app Sentry:** `apps/super-app/src/platform/adapters/sentry.monitoring.ts:14` calls `Sentry.init({...})`.
- **Vercel Analytics + Speed Insights:** per `V3-DISCOVERY-INVENTORY.md:375` — default-on platform-wide.
- **OneSignal SW shipped to all 10 web apps** (per P7 evidence).

### Weak or partial

- **Localization beyond strings:**
  - Currency rounding rules per market: only NGN default in `@henryco/payment-surface`; no per-market rounding policy.
  - Address formats: `@henryco/address-selector` is Nigeria-tuned; no per-country format library.
  - Phone formats: not verified — likely Nigeria-tuned.
  - Tax behavior: no tax engine (see P2).
  - Holiday calendars: none.
- **Observability has logger but no traces / SLOs / performance budget enforcement / data lake / event-tracking depth.**
- **Sentry coverage gap:** 7 of 10 web apps have no `instrumentation.ts`. Per `intelligence-rollout-status.md:53` "no outbox worker yet" implies degraded reporting on the apps without Sentry.

### Missing entirely

- **Mobile app store submissions** — no production EAS submission per `AUDIT-BASELINE.md:274`. `EXPO_PUBLIC_LIVE_SERVICES_APPROVED` gate exists per `docs/architecture-summary.md:25` but no submission has occurred.
- **A/B testing framework** — no LaunchDarkly / GrowthBook / Vercel Edge Config integration.
- **Data lake** — no S3/GCS/BigQuery sink; no `analytics_events_sink` table.
- **Backup / disaster-recovery formalized** — no documented RPO/RTO targets, no restore-test runbook.
- **GDPR / CCPA / NDPR privacy surface** — no DSAR endpoint, no consent ledger table, no per-region data residency.
- **V3 final integration + launch-readiness pass** — V3-94 / V3-95 / V3-96 not yet run.
- **OpenTelemetry traces** — no `@opentelemetry/*` in any `package.json` (verified — no matches in `node_modules`-tracked `package.json` files).
- **Performance budget enforcement on PR** — no Lighthouse CI / bundle-size gate beyond PNH-04 baseline.

### Pass coverage

- **Foundation Lock (P12 scope per `PASS-REGISTER.md:50-65`):**
  - `docs/v3/prompts/v3-01-foundation-session-persistence.md`
  - `docs/v3/prompts/v3-02-foundation-auth-reliability.md`
  - `docs/v3/prompts/v3-03-foundation-notification-message-states.md`
  - `docs/v3/prompts/v3-04-foundation-deep-links.md`
  - `docs/v3/prompts/v3-05-foundation-kill-loading-theater.md`
  - `docs/v3/prompts/v3-06-foundation-dead-link-sweep.md`
  - `docs/v3/prompts/v3-07-foundation-hardcoded-text-cleanup.md`
  - `docs/v3/prompts/v3-08-foundation-empty-dashboard-truth.md`
  - `docs/v3/prompts/v3-09-foundation-mobile-consistency.md`
  - `docs/v3/prompts/v3-10-foundation-logs-states-fallbacks.md`
  - `docs/v3/prompts/v3-11-foundation-one-job-per-card.md`
  - `docs/v3/prompts/v3-12-foundation-lock-acceptance.md`
- **Global / Mobile / Observability / Closure (P12 closure scope per `PASS-REGISTER.md:194-220`):**
  - `docs/v3/prompts/v3-84-global-localization-maturity.md`
  - `docs/v3/prompts/v3-85-global-per-market-payment-routing.md`
  - `docs/v3/prompts/v3-86-mobile-architecture-decision.md`
  - `docs/v3/prompts/v3-87-mobile-super-app-parity-wave-1.md`
  - `docs/v3/prompts/v3-88-mobile-store-submission.md`
  - `docs/v3/prompts/v3-89-observability-traces-slos-budgets.md`
  - `docs/v3/prompts/v3-90-observability-data-lake-and-event-tracking.md`
  - `docs/v3/prompts/v3-91-observability-ab-testing-framework.md`
  - `docs/v3/prompts/v3-92-observability-backup-disaster-recovery.md`
  - `docs/v3/prompts/v3-93-compliance-privacy-data-rights.md`
  - `docs/v3/prompts/v3-94-closure-integration-test-pass.md`
  - `docs/v3/prompts/v3-95-closure-launch-readiness.md`
  - `docs/v3/prompts/v3-96-closure-v3-showcase.md`

P12 has 24 of the 96 passes (25% of total) — making it the largest pillar by pass count. This reflects its dual nature: it both gates Phase B (V3-01..V3-12 = Foundation Lock) and closes the entire V3 plan (V3-94..V3-96).

### Cross-pillar dependencies

- **Feeds:** **EVERY pillar.** V3-12 (Foundation Lock acceptance) unblocks 16 passes per `DEPENDENCIES.md:139` — `V3-13, V3-24, V3-25, V3-26, V3-34, V3-49, V3-52, V3-53, V3-54, V3-55, V3-56, V3-57, V3-60, V3-64, V3-84, V3-86`. V3-10 (logs/states/fallbacks) unblocks V3-43 + V3-89. V3-43 (workflow engine) unblocks V3-44..V3-48 + V3-90.
- **Waits on:** D8 (mobile-app stack: Expo vs Flutter) blocks V3-86 + partially V3-23. D10 (per-market localization commitment) blocks V3-84. D11 (Foundation Lock acceptance) gates Phase C+ entirely.
- **Co-evolves with:** every other pillar — P12 is the substrate.

---

## Owner-decision gates (per-pillar blocking impact)

| Decision ID | Description | Blocks (passes) | Pillars affected |
|---|---|---|---|
| D1 | Payment provider activation per country | V3-14, V3-15, V3-16 | P2 |
| D2 | Gaming-arena legal posture per market | V3-65, V3-66 | P10 |
| D3 | AI provider selection (Anthropic vs OpenAI vs hybrid) | V3-26 | P4 |
| D4 | AI usage pricing markup ratification (~10% baseline) | V3-27 | P4, P9, P2 |
| D5 | Tax engine selection | V3-21 | P2, P7 |
| D6 | KYC vendor selection per market | V3-24 | P7, P1 (verified provider), P8 |
| D8 | Mobile-app stack (continue Expo vs Flutter) | V3-86, V3-23 (partial) | P12 |
| D9 | Monetization rates per division | V3-20 (partial), V3-69, V3-75 | P2, P8, P9 |
| D10 | Per-market localization commitment | V3-84 | P12, P3 |
| D11 | Foundation Lock acceptance | Phase C+ start (16 passes) | every pillar |
| D12 | ANTI-CLONE posture (Light / Moderate / Aggressive) | ANTI-CLONE.md applicability | cross-cuts every pillar |

Per `AUDIT-BASELINE.md §5`, D11 is the highest-leverage owner decision — without it the entire post-V3-12 cascade stalls.

---

## Foundation Lock state (cross-cuts P1..P12; deeper in `audit/foundation-base-lock.md`)

The Foundation Lock state from `AUDIT-BASELINE.md §3` is owner-priority #1. A separate audit (`audit/foundation-base-lock.md`, sub-agent in flight at compile time) covers the file-cited details. Summary of P12-rooted impact below:

- **Session persistence (§3.1):** Supabase Auth in `httpOnly` cookies via `@henryco/auth/server.ts` is solid. Token-expiry mid-action handling and multi-tab logout propagation are not verified file-by-file in this audit — V3-01 will close.
- **Auth reliability (§3.2):** Resend → Brevo fallback + HMAC auth hook solid. OAuth (Google / Apple) is Supabase-built-in; app-level UX is unverified.
- **Notification + message states (§3.3):** Thread-level state has grown: `apps/hub/supabase/migrations/20260513200000_support_thread_state_pass24_phase5.sql:19-23` adds `customer_muted_at` + `staff_muted_at` on `support_threads`, and lines 12-14 confirm `customer_last_read_at` + `staff_last_read_at` already exist from earlier migrations. **However, message-level state is still missing per PRODUCT-GAP-LEDGER 2026-04-09 (`docs/PRODUCT-GAP-LEDGER.md:24-25`)** — `support_messages` carries no `is_read` / `read_at`, so per-message unread state is not real (only per-thread "have you seen any new messages since `customer_last_read_at`"). V3-03 target.
- **Deep links (§3.4):** PRODUCT-GAP-LEDGER documented 409 legacy `customer_notifications` rows referencing `/care?booking=%` URLs. Backfill decision not made.
- **Live data vs fake loading (§3.5):** `apps/care/app/loading.tsx`, `apps/learn/app/loading.tsx`, `apps/logistics/app/loading.tsx`, `apps/studio/app/(public)/loading.tsx`, `apps/marketplace/app/loading.tsx`, `apps/property/app/loading.tsx` — all rendered loading copy per PRODUCT-GAP-LEDGER 2026-04-09 (needs re-verification).
- **Dead links (§3.6):** no exhaustive scan yet — V3-06 target.
- **Hardcoded text (§3.7):** i18n A1 wave shipped; `docs/v3/i18n-gaps/{extra-label-gaps.json, module-gaps.json, summary.json, work-units.json}` carries the remaining work (V3-07 target).
- **Empty dashboards (§3.9):** PRODUCT-GAP-LEDGER confirms subscriptions/invoices dashboards wired with 0 / 2 rows respectively — V3-08 target.
- **Mobile consistency (§3.10):** chat-composer + WhatsApp-style thread header shipped per recent commits #114-#117; broader workflow safe-area / keyboard-avoidance unverified.

---

## Cross-pillar dependency matrix

Reading: each row's "feeds" lists pillars that consume this pillar's output. "waits on" lists pillars whose output this pillar requires. "co-evolves with" lists pillars that move in lockstep. Derived from `DEPENDENCIES.md` Section A + Section B and the per-pillar evidence above.

| Pillar | Feeds | Waits on | Co-evolves with |
|---|---|---|---|
| **P1 Product Expansion** | P3, P5, P6, P8, P9, P11 | P12 (V3-12), P7 (V3-24 for V3-50), P2 (Phase C for paid services) | P3 (signals from catalog), P9 (monetization), P8 (verified provider) |
| **P2 Wallet / Payments / Financial Spine** | P1 (priced services), P8 (payouts), P9, P10, P11 | P12 (V3-12), D1 / D5 / D9 owner gates | P7 (KYC + sensitive-action gating), P12 (per-market routing) |
| **P3 Personalization Engine** | P5 (campaign triggers), P8 (deals visibility), P12 (analytics) | P12 (V3-12), P4 (V3-26 for AI recs) | P4 (LLM-augmented recs), P6 (scoring inputs) |
| **P4 HenryCo Intelligence (AI)** | P3 (recs), P6 (LLM summarization), P5 (escalation), P8 (business assist), P1 (concierge) | P12 (V3-12), P2 (V3-17 ledger for V3-27), D3 / D4 owner gates | P9 (margin layered on cost), P7 (V3-33 personal-task identity-touching), P2 (wallet auto-debit) |
| **P5 Automation & Workflow** | P3 (V3-37 recovery), P12 (V3-90 data lake), P1 (V3-61 newsletter) | P12 (V3-10 logs/states) | P4 (LLM-augmented escalation), P6 (workload prediction), P12 (observability) |
| **P6 Predictive & Analytical** | P7 (V3-40 fraud signals to safety), P3 (recommendation cleanliness), P9 (suspect routing) | P4 (V3-26 for both V3-40 + V3-41) | P4 (LLM augments rules), P5 (routes high-risk to queues), P12 (data lake for training) |
| **P7 Trust, Safety & Compliance** | P1 (verified provider model), P2 (KYC gates wallet), P8 (partner onboarding), P10 (gaming compliance) | D6 owner gate (V3-24), P12 (V3-12) | P4 (LLM moderation V3-25), P12 (V3-93 data rights), P6 (fraud signals route here) |
| **P8 Partner & Enterprise** | P2 (V3-69 partner payouts), P11 (every public API + V3-77 needs V3-71) | P7 (V3-24 KYC), P12 (V3-12 for V3-57), P1 (V3-50 unblocks V3-67) | P9 (monetization via payouts), P2 (financial spine), P11 (public APIs) |
| **P9 Revenue Engine & Monetization Integrity** | owner reporting, finance dashboard | P2 (ledger), P8 (partner economy), P4 (AI usage billing) | every revenue-producing pillar; ANTI-CLONE.md Principle 10 (data + trust moats) |
| **P10 Studio Live / Gaming Arena** | P1 (jobs interview room — first `@henryco/rooms` consumer), P8 (studio project suite) | V3-13 + V3-17 + V3-24 for V3-65; D2 owner gate | P2 (wallet stakes), P7 (anti-cheat + jurisdiction), P12 (per-market gating) |
| **P11 Platform & API Layer** | P8 (every business suite + V3-83 docs), P12 (V3-82 analytics exports) | P12 (V3-02 auth reliability), P1 / P8 product passes (per-API deps) | P12 (versioning + observability + rate limits), P7 (auth scopes) |
| **P12 Global / Mobile / Observability / Closure** | **EVERY pillar** (V3-12 unblocks 16 passes per `DEPENDENCIES.md:139`) | D8 / D10 / D11 owner gates | every other pillar — P12 is the substrate |

---

## Coverage checklist

This audit covered the following pillars with substantive file-cited evidence:

- [x] **P1 — Product Expansion** — 7 apps cited; 18 branded-document templates; 70 per-app migrations enumerated by date and purpose.
- [x] **P2 — Wallet, Payments, Financial Spine** — `@henryco/payment-surface` 8 primitives + adapter cited; wallet schema confirmed via D8 hot patch migration; integration audit corrected for Anthropic SDK presence; subscriptions/invoices tables confirmed (data empty).
- [x] **P3 — Personalization Engine** — `nextAccountSteps` line-cited (`packages/intelligence/src/index.ts:152-190`); cart-recovery migration cited; 12 locales confirmed at `packages/i18n/src/locales.ts:18`.
- [x] **P4 — HenryCo Intelligence Layer** — full `packages/intelligence/src/index.ts` audit; Anthropic SDK presence corrected and cited at `apps/studio/package.json:19`, `apps/studio/lib/studio/brief-copilot-action.ts:5`, `apps/studio/lib/portal/refine-draft-action.ts:3,19`; deterministic core mapped.
- [x] **P5 — Automation & Workflow Engine** — 11 cron handlers across 5 apps enumerated by route path; Vercel cron schedules cited at `apps/hub/vercel.json:6-15`; audit-log writer at `packages/observability/src/audit-log.ts:1-40`.
- [x] **P6 — Predictive & Analytical Intelligence** — 8 risk-signal types line-cited; trust caps from `docs/trust-score-rules.md:18-25`; 4 trust events + 4 marketplace trust events enumerated.
- [x] **P7 — Trust, Safety & Compliance** — KYC infra migration line-cited (`apps/hub/supabase/migrations/20260410130000_kyc_verification_infra.sql:9-15,19-31,33-38,40`); D8 hot patch line-cited; 6 hardening migrations cited.
- [x] **P8 — Partner & Enterprise** — 4 logistics operator workspaces cited; 6 division role-membership tables enumerated; 18 branded-document templates relevant to business surfaces enumerated.
- [x] **P9 — Revenue Engine & Monetization Integrity** — pricing governance + multi-currency + wallet withdrawal migrations cited; ANTI-CLONE.md cross-references made.
- [x] **P10 — Studio Live / Gaming Arena** — `@henryco/rooms` corrected from "skeleton" to "fully built but unconsumed"; provider-selector matrix line-cited (`packages/rooms/src/provider-selector.ts:9-26,42`); 7 rooms migrations enumerated; zero consumer apps verified.
- [x] **P11 — Platform & API Layer** — 7 webhook receivers enumerated; 6 cron handlers cited; 20-subpath account API surface enumerated; missing versioning / scopes / docs framework confirmed.
- [x] **P12 — Global, Mobile, Observability, Closure** — 12 locales line-cited at `packages/i18n/src/locales.ts:18,22-35`; Sentry coverage gap (3/10 apps) confirmed via direct file inventory; super-app deferred-payments stub cited at `apps/super-app/src/platform/adapters/payments.deferred.ts:4-12`; observability package full inventory.

**12 of 12 pillars audited with file citations.**

---

## Self-verification

- [x] Five required subsections per pillar: Ships today / Weak or partial / Missing entirely / Pass coverage / Cross-pillar dependencies.
- [x] File citations use `file_path:line_number` where line numbers apply; package and route paths otherwise.
- [x] "NOT INTEGRATED" claims in `AUDIT-BASELINE.md §1.4` re-verified — corrected the Anthropic SDK claim (PARTIALLY INTEGRATED) and confirmed Stripe / Paystack / Flutterwave / Apple Pay / Avalara / TaxJar absences via direct `package.json` grep.
- [x] Migration counts re-verified per app against the 2026-05-03 inventory baseline — substantial growth in care / jobs / logistics / property / studio enumerated.
- [x] Cross-pillar dependency matrix included (12 rows × 3 columns: feeds / waits on / co-evolves with).
- [x] Coverage checklist enumerates all 12 pillars.
- [x] Corrections to baseline are flagged explicitly ("CORRECTED FROM BASELINE", "needs verification") rather than silently overwritten.
- [x] No fabricated file paths or line numbers — where a claim could not be verified, the audit says so.
- [x] No emojis.
- [x] One file only — this `pillar-gap-map.md`. No intermediate planning docs created.

End of audit.
