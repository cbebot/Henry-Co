# V3 Audit Baseline — Single Ground Truth

**Pass:** V3 Strategic Architect (Phase A synthesis)
**Compiled:** 2026-05-17
**Author:** Claude · Opus 4.7 (1M context) · maximum effort
**Status:** Authoritative reference for every V3 pass that follows. All later docs in `docs/v3/` cite back to this file.

This document supersedes nothing — it stands on top of `V3-DISCOVERY-INVENTORY.md` (2026-05-03) and incorporates everything shipped since (V3 PASS 21–25 design rebuild cycle, intelligence rollout, dashboard-modules registry, observability package, payment-surface skeleton, mobile super-app architecture). Two deeper audits — `audit/foundation-base-lock.md` and `audit/pillar-gap-map.md` — extend specific sections.

The purpose of this baseline is to give every later pass enough current truth to start work without re-auditing. If a later pass disagrees with this file, the LATER PASS wins and this file must be updated.

---

## 0 · Scope of this audit

This baseline maps the current state of HenryCo against the 12-pillar V3 Vision (P1–P12) and the owner's explicit "FOUNDATION LOCK" priorities. It does not propose passes — that happens in `PASS-REGISTER.md`.

In scope:
- Repo state (apps, packages, migrations, env, deploys)
- Capability state (what ships, what's partial, what's missing) per pillar
- Foundation state (session, auth, notifications, messages, deep links, live data, dead links, hardcoded text, fake loading, empty dashboards, mobile consistency)
- Owner-decision gates already known
- Recent work (since 2026-05-03 inventory) integrated

Out of scope:
- Pass authoring (PASS-REGISTER + per-pass prompts handle that)
- Owner decisions (DECISIONS-REQUIRED handles that)
- Legal prerequisites (LEGAL-AND-BUSINESS handles that)

---

## 1 · Repo state as of audit

### 1.1 Workspace inventory

- **Monorepo:** pnpm 9.15.5 workspaces, Node 24.x
- **Apps:** 10 Next.js 16 web (account, care, hub, jobs, learn, logistics, marketplace, property, staff, studio) + 2 Expo (super-app, company-hub)
- **Packages:** 33 internal packages (up from 19 at the 2026-05-03 inventory)

New packages since 2026-05-03 inventory:
- `@henryco/auth` — extracted auth helpers (cookies, owner, server, staff, viewer)
- `@henryco/observability` — logger + redaction + Sentry config + audit-log subpath
- `@henryco/payment-surface` — manual payment proof + receipt UI primitives (NOT live payment providers)
- `@henryco/messaging-thread` — extracted thread UI (previously inline in account/support)
- `@henryco/dashboard-shell` — modular dashboard shell with command palette + register pattern
- `@henryco/dashboard-modules-{account, building, hotel, marketplace, owner, staff, wallet}` — 7 modular dashboard module packages
- `@henryco/data` — read-side aggregation layer (calendar, cross-division activity, dashboard summary, inbox, signal feed, support summary)
- `@henryco/rooms` — chat/video room primitives (provider-selector, realtime, server, components, hooks)
- `@henryco/workspace-shell` — workspace chrome
- `@henryco/dashboard-modules-building` and `dashboard-modules-hotel` — domain modules suggesting future verticals (hotels, buildings) not yet user-facing

Pre-existing packages (unchanged in count, several have evolved):
- `@henryco/ui`, `@henryco/config`, `@henryco/brand`, `@henryco/notifications`, `@henryco/notifications-ui`, `@henryco/chat-composer`, `@henryco/address-selector`, `@henryco/cart-saved-items`, `@henryco/branded-documents`, `@henryco/search-core`, `@henryco/search-ui`, `@henryco/seo`, `@henryco/email`, `@henryco/i18n`, `@henryco/intelligence`, `@henryco/lifecycle`, `@henryco/newsletter`, `@henryco/pricing`, `@henryco/trust`

### 1.2 Branch and deploy state

- **Default branch:** `main`
- **Current working branch (audit start):** `fix/i18n-selector-promote-all-12-locales` (owner-occupied, do not disturb)
- **Branch sprawl:** still high (165+ branches; owner runs many parallel Claude/Codex sessions per memory `project_henryco_parallel_sessions.md`)
- **Vercel projects:** 10 production projects, one per app
- **Per-app deploy parity:** assumed current (V5-5 era staff-app lag is older context; not re-verified this baseline)

### 1.3 Database state

- **Supabase:** single project (multi-app)
- **Hub-level migrations:** 30+ (V5-5 baseline) plus newer V3-PASS-21 logistics + studio app-local migrations
- **Per-app migrations:** learn (4), marketplace (6+), property (2), studio (4+), logistics (new from V3 PASS 21)
- **RLS coverage:** 218/222 user-scoped tables RLS-enabled per 2026-05-09 second-pass; 4 outliers fixed in `fix(supabase): wrap auth.<fn>()` (PR #95) — but **D8 from V3-BACKLOG-FROM-V2** flagged wallet/care tables with RLS off + anon grants; status unclear post-#95 (verify in Phase B audit)
- **Edge Functions:** none deployed (per inventory)
- **Migration tracking drift:** Q5 from backlog — 46 remote-only timestamps not in `apps/hub/supabase/migrations/`; DASH-9 worked around via `supabase db query --linked` (idempotent)

### 1.4 Integration state

| Service | Role | Current state |
|---|---|---|
| Supabase | DB + Auth + Realtime + Storage | live, single project |
| Vercel | Hosting + Analytics + Speed Insights | live, 10 projects |
| Cloudinary | Image + video assets | live, primary store |
| Resend | Transactional + auth email | live, primary |
| Brevo | Auth SMTP fallback | live, fallback |
| Typesense | Search backend | **env not provisioned** — degraded to empty results |
| Google Places | Address autocomplete | **env not provisioned** — fallback to unverified |
| WhatsApp Business | Webhooks (care/property/studio) | receivers exist; HMAC verification per V3 backlog B1 status |
| OneSignal | Push notifications (web SW) | service worker shipped via PR #39; mobile push not wired |
| Sentry | Error tracking | `@henryco/observability` exports config builders; per-app `Sentry.init` ownership |
| GitHub | Code + CI | live (lint/typecheck/test/build + PNH-04 baseline + i18n-check) |
| EAS (Expo) | Mobile build/dist | super-app dist/ exists; no production submission |
| **Stripe** | Card payments | **NOT INTEGRATED** — no SDK present in any app/package |
| **Paystack** | African card + bank payments | **NOT INTEGRATED** |
| **Flutterwave** | Multi-rail African payments | **NOT INTEGRATED** |
| **Apple/Google Pay** | Wallet payments | **NOT INTEGRATED** |
| **Anthropic / OpenAI / any LLM** | AI provider | **NOT INTEGRATED** — `@henryco/intelligence` is deterministic only; `triageSupportStub` is regex-based |
| **DeepL** | Translation | wired for runtime auto-translate per `feedback_*` memory + I18N PASS 18B |
| Tax engine (Avalara / TaxJar / TaxJar-equiv) | Sales tax | **NOT INTEGRATED** |
| KYC vendor (Smile Identity / Onfido / Sumsub) | KYC verification | basic `kyc_verification_infra` migration shipped 2026-04-10; **no external vendor wired** — internal manual review only |

---

## 2 · Capability state — what V2 + post-V2 actually shipped

This section enumerates capabilities by user-facing surface. It expands W3 of the V3-DISCOVERY-INVENTORY with everything shipped since.

### 2.1 Authentication & identity
- Auth chooser (`/auth/choose`) with role-aware redirect (V2-AUTH-RT-01)
- `hc_dash_pref` cross-session preference cookie
- Cross-subdomain SSO via `.henrycogroup.com` cookies
- Resend → Brevo auth fallback (PR #5)
- API-layer signup rate limit (PNH-04)
- HMAC-verified auth email hook
- **NEW:** `@henryco/auth` package extracted with cookies/owner/server/staff/viewer helpers
- Role types: customer, division operator, cross-division staff, owner, super-admin/founder (not yet modeled separately)
- 6 role-membership tables + owner_profiles
- `is_staff_in()` SECURITY DEFINER for cross-division staff check
- KYC sensitive-action gating (per `docs/kyc-sensitive-action-gating.md`)

### 2.2 Notifications (customer + staff)
- Customer notifications with `is_read`/`read_at`
- Cross-division notification signal foundation (publisher + bridges)
- Premium notification UI (severity-style, swipe, motion)
- Realtime via Supabase Realtime publication
- Email fallback cron worker
- Notification preferences UI
- Staff audience model (`publishStaffNotification` + audience-generic)
- Recently-deleted feed + 30-day purge cron
- **GAP from PRODUCT-GAP-LEDGER:** `support_threads`/`support_messages` lack `is_read`/`read_at` — message-level unread state is NOT real (only thread-level via `customer_notifications`)

### 2.3 Cross-division search
- `@henryco/search-core` + `@henryco/search-ui`
- 15 Typesense collection definitions
- Outbox cron (`*/1 * * * *` in `apps/hub/vercel.json`)
- Backfill script `scripts/search-backfill.mjs`
- Wired: hub + account
- **GAP:** Pending wiring in care, jobs, learn, logistics, marketplace, property, studio (V3-BACKLOG H1)
- **GAP:** Typesense env not provisioned — degraded to empty results

### 2.4 Address management
- `user_addresses` canonical table with label enum + UNIQUE per user
- KYC matcher with weighted faceted scoring
- `@henryco/address-selector` package
- Wired: account, care, logistics, marketplace
- F1 legacy backfill **CLOSED** (2026-05-09 confirmation)
- **GAP:** Google Places env not provisioned

### 2.5 Cart, saved items, recovery
- `saved_items` + 7-day expiry sweep + cart_recovery_state
- `user_engagement_events` taxonomy
- Marketplace 3-step bespoke checkout
- Account welcome-back with cart/saved/recently-viewed
- Hourly engagement-sweep cron
- **GAP L1:** property + jobs use pre-existing storage; cross-division saved-model deferred

### 2.6 Document export
- `@henryco/branded-documents` — 9+ React-PDF templates including newer **logistics-shipment-receipt**, **logistics-b2b-statement**, **property-managed-statement**, **owner-report**, **transaction-history**
- Live endpoints in account (`/api/documents/[type]/[id]`)
- Live endpoint in learn (`/api/certificates/[code]/pdf`)
- **NEW (V3 PASS 21):** branded-documents `studio proposal`, `invoice`, `brand guidelines` (commit `034a09a1`)
- **NEW (V3 PASS 21):** logistics b2b statement + shipment receipt
- **GAP G3:** Jobs application package PDF route handler still missing

### 2.7 Chat, support, messaging
- `@henryco/chat-composer` (autosize, attachments, mobile full-screen, viewport-aware)
- 5+ surfaces consume it (account/support new+reply, care/support reply, jobs/hiring messages, studio/support reply)
- **NEW:** `@henryco/messaging-thread` package extracted — used by account/support/SupportThreadRoom and studio messaging
- SupportDock concierge premium (V5-2) — being **replaced by SupportAssist** in current branch (`feat(support): replace SupportDock with chrome-integrated SupportAssist`) per `project_henryco_supportdock_replacement.md`
- PASS 24 — Support Chat Workspace-Grade Upgrade shipped (commit `529c42bf`)
- **GAP K1:** logistics support has no composer surface yet

### 2.8 SEO + discoverability
- `@henryco/seo` package — typed JSON-LD, OG/Twitter, manifest, robots, sitemap
- Wired across all 8 public apps + hub
- Vercel Analytics + Speed Insights live
- **GAP M1:** master sitemap-index aggregator deferred
- **GAP M2:** hreflang real implementation deferred

### 2.9 Accessibility
- `scripts/a11y/{audit,contrast-matrix,headers-scan,aggregate,gate,diff}.mjs`
- PNH-04 baseline contrast/headers gate enforced on every PR
- 11 critical / 63 serious / 42 moderate axe findings cataloged
- **GAP N2:** per-route remediation still deferred
- **GAP N3:** Expo super-app a11y stack separate, not in V2-A11Y-01 scope

### 2.10 Premium UI primitives
- `HenryCoHeroCard`, `HenryCoTactileCard`, `PublicProofRail`, `PublicSpotlight`
- Wired in hub, care, property, studio + recent editorial rebuilds in account/{care,jobs,learn,logistics,marketplace,property,studio} per `feat(account/*): editorial rebuild — premium hero, fewer cards` commits
- Brand monogram on all 8 division shells
- **PASS 25:** typography tone refinement shipped

### 2.11 Hardening (security headers, rate limits)
- V2-PNH-04 baseline live (HSTS preload, frame-ancestors, XFO, CTO, Referrer, Permissions-Policy)
- Full CSP on hub + staff; `frame-ancestors 'none'` only on the other 8 (D2 carry-forward)
- Signup rate limit + info-disclosure fixes
- Image perf (next/image migration on hub Logo)
- KYC sensitive-action gating
- **NEW (recent commits):** `fix(supabase): wrap auth.<fn>() in 200 RLS policies` (#95), `security_invoker on 5 ERROR-level views` (#93), `auto-safe advisor batch — search_path, FK indexes, dup indexes` (#94) — significant DB security tightening
- **GAP:** D8 from V3-BACKLOG — wallet/care RLS state needs re-verification post-#95

### 2.12 Intelligence layer (`@henryco/intelligence`)
- Schemas + types + deterministic helpers (NOT LLM-backed today)
- Event envelope schema: `henry.<domain>.<object>.<verb>` with version "1" + actor + properties
- 25+ named event types: auth/profile/trust/support/security/wallet/jobs/marketplace/lifecycle
- `triageSupportStub` — regex-based intent classifier (account_access/billing/marketplace_order/booking/verification/wallet/other) + escalation threshold
- `nextAccountSteps` — deterministic recommendation engine (profile completeness + trust state + saved items)
- 8 risk signal types (failed_sensitive_action_burst, listing_spam_pattern, wallet_velocity_anomaly, etc.)
- Account trust tiers (basic/verified/trusted/premium_verified)
- Feature flags via `parseHenryFeatureFlags` from env (NEXT_PUBLIC_HENRY_FLAG_*)
- Per `intelligence-rollout-status.md` already wired into:
  - Account support routes (triage + intelligence events)
  - Account task center derivation (`apps/account/lib/intelligence-rollout.ts`)
  - Account dashboard recommendations
  - Staff dashboard live task/queue/risk metrics
  - Staff support prioritized queue
  - Staff operations risk routing
- **Hardening shipped:** signed account webhook + freshness + idempotent receipts; idempotency keys on support create/reply; cron auth on jobs+logistics
- **Intentionally limited today:** no LLM triage, no persisted `customer_tasks` table, no unified event ingest endpoint, no outbox worker

### 2.13 Observability (`@henryco/observability`)
- Logger with PII redaction (default redact keys)
- Event-taxonomy emitter (`emitEvent`)
- Sentry config builders (server, client, edge) — decoupled from `@sentry/nextjs` version
- DASH-9 audit-log writer at `/audit-log` subpath (server-only)
- **GAP:** per-app Sentry `Sentry.init` adoption inventory unknown; some apps may not call it yet
- **GAP:** no traces / no SLOs / no performance-budget enforcement yet

### 2.14 Payment surface (`@henryco/payment-surface`)
- UI primitives: payment-action-button, payment-copy-button, payment-file-field, payment-guide, payment-processing, payment-proof-upload, payment-receipt, payment-surface
- Adapter pattern: `coercePaymentStatus`, `buildPaymentRecordView`, `buildPaymentSurfaceContext`
- Status normalization: pending/processing/paid/failed/refunded/cancelled
- **Current workflow is MANUAL:** bank-transfer instruction → user uploads proof file → staff verifies → status flips paid
- **NOT INTEGRATED:** no Stripe SDK, no Paystack SDK, no Flutterwave SDK anywhere in `apps/` or `packages/`
- `apps/super-app/src/platform/adapters/payments.deferred.ts` — deferred payments adapter; mobile payment flow is a stub
- **Currency:** `payment-surface` defaults to "NGN" — multi-currency foundation per memory `project_henryco_currency.md`

### 2.15 Dashboard shell + modules
- `@henryco/dashboard-shell` — modular dashboard registry, command palette, role gates, register pattern
- 7 dashboard-modules packages (account, building, hotel, marketplace, owner, staff, wallet)
- DASH-1 through DASH-9 shipped per V3-BACKLOG §P
- DASH-3 wallet module live on production 2026-05-05
- DASH-9 staff dashboard merged but had deploy lag (per 2026-05-09 second-pass)
- **NEW (V3 PASS 21):** account portal editorial rebuild across 8 division mini-dashboards (account/{care,jobs,learn,logistics,marketplace,property,studio} + account/{security,verification,wallet,notifications,invoices,tasks})

### 2.16 Studio (V3 PASS 21 backend shipped)
- Studio proposals + sign + revisions + milestones + asset packs + kanban + gantt
- Studio cron: milestone reminders, invoice reminders, proposal expiry, weekly digest
- Studio app-local migrations for the new schema
- Studio domain-intelligence (`apps/studio/lib/studio/domain-intelligence.ts`) — deterministic
- Studio brief-copilot-action (`apps/studio/lib/studio/brief-copilot-action.ts`) — likely deterministic too
- **GAP:** V3 vision wants Studio motion/video services — not in current scope

### 2.17 Logistics (V3 PASS 21 shipped)
- Operator workspaces: rider, dispatcher, manager, owner
- API routes: quote, book, track, pod (proof of delivery), dispatch, claims, whatsapp webhook
- App-local migrations
- **GAP:** B2B statement PDF exists; full B2B contract + bulk-invoice flow not yet

### 2.18 i18n (`@henryco/i18n`)
- Custom @henryco/i18n + Pattern A typed copy + Pattern B `translateSurfaceLabel` runtime DeepL
- 12 locales now per `fix(i18n): promote all 12 locales` (90cc65ea) — was 7 in inventory
- Locales: en, ar, de, es, fr, ha, hi, ig, it, pt, yo, zh
- Surface labels + per-app copy modules
- Hard-reload on language change
- **GAP per memory `project_henryco_i18n_architecture.md`:** remaining gaps before any new "translate everything" pass — gaps logged in `docs/v3/i18n-gaps/{extra-label-gaps.json, module-gaps.json, summary.json, work-units.json}`

### 2.19 Mobile apps (Expo)

**super-app** (3,145+ LOC) per `docs/architecture-summary.md`:
- Layered: routes → features → domain → platform (contracts/adapters/bundle)
- Runtime modes: local / staging / production
- Live-services gate: `EXPO_PUBLIC_LIVE_SERVICES_APPROVED`
- `EXPO_PUBLIC_HENRYCO_ENV` for env selection
- Platform contracts: auth, database, media, notifications, payments, analytics, monitoring
- Adapters: mock, Supabase, Expo, Cloudinary, Sentry, deferred payments
- Web smoke export available
- Divisions hook: `useDivisions` → `database.fetchDivisions()` → mock or `divisions` table → fallback `DIVISION_CATALOG`
- **NOT submitted** to Apple App Store or Google Play

**company-hub** (3,735+ LOC):
- Owner mobile app
- Has `dist/` (built once)
- **NOT submitted** to stores

---

## 3 · Foundation Lock state (the owner's #1 priority)

This section maps the current state against the owner's explicit foundation-lock list. A deeper file-citation audit lives in `audit/foundation-base-lock.md` (sub-agent in progress at audit time).

### 3.1 Session persistence
- **Solid:** Supabase Auth session in `httpOnly` cookies via `@henryco/auth` server helpers
- **Solid:** cross-subdomain SSO via `.henrycogroup.com` cookies
- **Partial:** `hc_dash_pref` cookie holds dashboard preference but no broader "remember where I was" surface
- **Gap:** what happens on token-expiry mid-action (e.g., long form fill) is not consistently handled — likely silent failure or re-redirect to login losing draft state
- **Gap:** multi-tab session consistency (e.g., logout in one tab) needs verification

### 3.2 Auth reliability
- **Solid:** Resend → Brevo fallback for auth email; HMAC-verified auth hook
- **Solid:** `@henryco/auth` package with extracted helpers
- **Partial:** OAuth (Google/Apple/etc.) — Supabase has built-in but the app-level UX is unverified
- **Gap:** logout completeness — does logout clear all caches, all tabs, all stored drafts, all IndexedDB?
- **Gap:** role-chooser badge counts (V3-BACKLOG I1)
- **Gap:** session-tampering defense (signed-cookie check on sensitive paths)

### 3.3 Notifications & message states
- **Solid:** customer + staff notification audience model
- **Solid:** Realtime via Supabase publication on notification tables
- **CRITICAL GAP (PRODUCT-GAP-LEDGER):** `support_threads` + `support_messages` have NO `is_read`/`read_at` — message-level unread state is fake; only thread-level is real
- **CRITICAL GAP (PRODUCT-GAP-LEDGER 2026-04-09):** 409 customer_notifications referenced legacy `/care?booking=%` URLs at time of audit — needs re-count + backfill decision
- **Gap:** delivery state machine (sent/delivered/seen) per WhatsApp-style ledger not modeled
- **Gap:** notification retry on transient failure (e.g., Resend rate-limit) verified for email, not modeled for in-app delivery

### 3.4 Deep links
- **Solid:** per-PRODUCT-GAP-LEDGER, subscriptions + invoices + care bookings now deep-link into dedicated detail routes
- **Partial:** legacy `/care?booking=` links replaced repo-side but 400+ historic notifications still reference old format
- **Gap:** universal links / app links on Expo super-app + company-hub
- **Gap:** auth-gated deep link round-trip preservation (does `/account/orders/123` survive a sign-in detour and land back at `/orders/123`?)
- **Gap:** SMS/share deep links inventory

### 3.5 Live data (vs fake loading / empty dashboards)
- **PRODUCT-GAP-LEDGER 2026-04-09 evidence (likely still partially true):**
  - Care live HTML: "Preparing the public Care experience"
  - Learn live HTML: "Loading your learning experience"
  - Logistics live HTML: "Loading logistics" + "Preparing shipping..."
  - Studio live HTML: "Loading HenryCo Studio" + "Preparing your creative workspace"
  - Marketplace live HTML: "Loading marketplace" + "Preparing products..."
  - Property live HTML: visible loading surface on first response
- **Solid:** Hub owner-data, owner-reporting; staff intelligence-data live aggregator (per intelligence-rollout-status)
- **Gap (PRODUCT-GAP-LEDGER):** `customer_subscriptions` rows = 0 (subscriptions dashboard wired but no real data)
- **Gap (PRODUCT-GAP-LEDGER):** `customer_invoices` rows = 2 (invoice dashboard wired but trivial data)
- **Gap:** receipts depend on division publishing receipt files — inconsistent across divisions

### 3.6 Dead links
- **Inventory:** not yet exhaustively scanned (sub-agent foundation-base-lock will produce list)
- **Known:** PRODUCT-GAP-LEDGER named legacy care booking link issues; PASS 21 + 22 closed many

### 3.7 Hardcoded text
- **Solid (after V3 PASS 21):** massive i18n A1 wave extracted hardcoded strings to surface labels
- **Gap:** i18n-gaps/ directory contains unfinished work — extra-label-gaps.json, module-gaps.json, summary.json, work-units.json
- **Gap (V3-BACKLOG Q1):** hardcoded `henrycogroup.com` literals (~30 in care/account)

### 3.8 Fake loading / fake state
- **Documented (PRODUCT-GAP-LEDGER):** "Loading X" first-render placeholders on 6+ public surfaces
- **Solid:** PERF-01 canonical PublicRouteLoader for `loading.tsx` per memory `project_henryco_perf01_loading.md`
- **Gap:** division-specific "warming up" copy still in HTML per April audit; needs current verification

### 3.9 Empty dashboards
- **Solid:** dashboard-modules registry pattern means modules are explicit about their data source
- **Solid:** staff dashboard pulls real intelligence-data per intelligence-rollout-status
- **Gap:** owner workspace dashboard data freshness varies; some KPI tiles may show zero-state without "you have nothing yet vs we haven't loaded yet" distinction
- **Gap (PRODUCT-GAP-LEDGER):** subscriptions dashboard ships UI but no rows exist in production

### 3.10 Mobile consistency
- **Solid:** chat-composer mobile full-screen mode
- **Solid:** `fix(account/support): rebuild mobile thread header as WhatsApp-style thin app bar` (recent commits #114, #115, #116, #117) — mobile messaging hardened
- **Partial:** safe-area insets + viewport keyboard-avoidance verified on support surfaces; unverified on other workflows
- **Gap:** Expo super-app + company-hub parity with web mobile is a Phase H concern, not foundation-lock

### Cross-cutting foundation issues
- **Logs/states/fallback:** intelligence-rollout-status notes "routes now report degraded side effects explicitly" — degradation reporting pattern exists. Coverage outside the intelligence-routes is uncertain.
- **Refresh loops losing context:** PRODUCT-GAP-LEDGER named the "legacy care links route to listings instead of detail" issue; partially fixed but exhaustive sweep not done.
- **Duplicated UI labels:** not yet cataloged.
- **Every-card-one-job audit:** not yet done — this is the owner's literal question.

---

## 4 · Per-pillar gap snapshot

This is the high-altitude pillar map. `audit/pillar-gap-map.md` (sub-agent in progress) is the deeper version with file citations per pillar.

### P1 — Product Expansion
- **Ships today:** Care booking + pickup; Marketplace catalog + cart; Studio templates + briefs + (V3-PASS-21) proposals/milestones/asset-packs; Property listings + managed; Jobs board + employer console + hiring messages; Learn courses + paths + certifications; Logistics (V3-PASS-21) quote/book/track/POD + rider/dispatcher/manager/owner workspaces.
- **Weak/partial:** Care is single-service today (broader services not yet); Jobs interview room not built; Property rules engine + inspection eligibility surface not built; Newsletter foundation shipped but no campaign engine; Concierge / guided assistant not built; Local discovery + verified provider model thin.
- **Missing entirely:** Laundry/garment-care/repairs/errands/moving/event-support service catalogs; Coming-soon roadmap surface; Studio motion/video services; Learn-to-earn + employer tools; Business profiles + business tools + seller academy.
- **To remove/deprecate:** Owner pivot context — fake/decorative summary surfaces flagged in PRODUCT-GAP-LEDGER.

### P2 — Wallet, Payments, Financial Spine
- **Ships today:** Manual payment proof + receipt flow via `@henryco/payment-surface`; `wallets` + `wallet_transactions` tables; DASH-3 wallet module live; `@henryco/branded-documents` invoice/receipt PDFs; pricing governance + breakdown persistence (`@henryco/pricing`); multi-currency foundation (NGN default); wallet withdrawals migration.
- **Weak/partial:** Manual workflow blocks scale; refunds workflow exists but no provider integration; tax computation is line-item config, not engine; subscription lifecycle (table exists, 0 rows).
- **Missing entirely:** PaymentProviderRouter; Stripe / Paystack / Flutterwave SDK integration; Apple Pay / Google Pay; webhook reconciliation engine (vs HMAC verification alone); finance dashboard for owner; native-app payment compliance (super-app payments deferred).

### P3 — Personalization Engine
- **Ships today:** `nextAccountSteps` deterministic recommendations; cart-recovery state; recently-viewed; account `welcome-back` surface; lifecycle blocker/dormant signals via intelligence package; locale persistence (i18n cookie); currency persistence (per memory).
- **Weak/partial:** Personalized home is a deterministic "next steps" panel; not learned-model personalization. Personalized deals not built. Cross-division recommendations only fire from account triggers, not predicting.
- **Missing entirely:** Per-user personalized home layout; recommended services/jobs/courses/properties; abandoned-task recovery beyond cart; local availability awareness; smart-next-action surfacing.

### P4 — HenryCo Intelligence Layer (AI)
- **Ships today:** `@henryco/intelligence` deterministic triage + recommendation + risk-signal taxonomy + event envelopes; wired into account support + task center + staff dashboards; feature-flag gated.
- **Missing entirely:** LLM provider integration (Anthropic / OpenAI / etc. — NONE present); usage billing + wallet auto-debit; provider router with vendor-agnostic interface; UI surface for "HenryCo Intelligence" branded chat; hard wallet-zero cap; per-task company-critical vs personal-task gating; unauth-blocking for personal tasks.
- **GOVERNANCE-CRITICAL:** owner's instruction "Do not name the underlying provider anywhere in the UI; it is 'HenryCo Intelligence' only" — must be enforced from day 1.

### P5 — Automation & Workflow Engine
- **Ships today:** support triage + escalation (deterministic); cron-based notification purge + engagement sweep + email fallback + search outbox worker; studio cron (milestone, invoice, proposal expiry, weekly digest); intelligence event emission from account routes.
- **Weak/partial:** Auto-assign tickets exists via deterministic triage; auto-escalate is threshold-based; reminders exist for studio only; owner reports exist (owner-reporting.ts).
- **Missing entirely:** Auto-detect neglected queues; auto-create staff tasks (no `customer_tasks` table); auto-trigger follow-up campaigns; cross-division workflow engine.

### P6 — Predictive & Analytical Intelligence
- **Ships today:** 8 deterministic risk-signal types; staff intelligence aggregator with risk/anomaly routing; staff support prioritized queue; account trust tiers (basic/verified/trusted/premium_verified).
- **Weak/partial:** Trust scoring rules per `trust-score-rules.md` exist; jobs employer trust events emit; marketplace seller trust recalculation events emit.
- **Missing entirely:** Fraud/risk prediction model (today is rules-based not ML); staff workload prediction; support summarization (would need LLM); deal recommendations; pricing suggestions; seller growth suggestions; property fraud detection; service quality warnings; job match scoring; course recommendations; advanced staff intelligence dashboards beyond live aggregator.

### P7 — Trust, Safety & Compliance
- **Ships today:** KYC submissions table + internal review; trust flags + review safety (`@henryco/trust`); content moderation hooks for jobs employer + marketplace review/dispute; PNH-04 baseline; OneSignal SW; idempotency + nonce scope; referral fraud hardening migration.
- **Weak/partial:** KYC has no external vendor wired — internal review only. Content moderation is per-division ad-hoc, not central. Dispute resolution mechanic exists per `marketplace.dispute` events but no formal dispute surface.
- **Missing entirely:** Escrow patterns (especially for studio/property/marketplace high-value); per-market KYC maturity (Nigeria vs other markets); gaming-arena compliance framework; spam/abuse/harassment defenses beyond rate limits.

### P8 — Partner & Enterprise Ecosystem
- **Ships today:** Logistics rider/dispatcher/manager/owner workspaces (operator pattern); studio teams page; per-division operator roles.
- **Weak/partial:** Care has no formal partner onboarding flow (care_pricing_items table exists but RLS open per D8). Marketplace seller tiers migration exists. Property managed listings table exists.
- **Missing entirely:** Partner onboarding flow with KYC integration; performance scoring; contracts; payouts engine; service-area model; quality scoring; enterprise/business suite (employer hiring suite at depth, seller business suite, service-provider CRM, studio project suite, logistics business dashboard, bulk invoicing, team roles, company admin accounts).

### P9 — Revenue Engine & Monetization Integrity
- **Ships today:** Pricing governance + breakdown persistence; honest line-item display per `@henryco/pricing`; referral fraud hardening; wallet withdrawals.
- **Missing entirely:** User earning opportunities surface; partner economy; rewards + referral with anti-abuse beyond migration; transparent revenue-share UI; monetization integrity audit; anti-reverse-engineering hardening (P9 + P10 cross-reference with ANTI-CLONE.md).

### P10 — Studio Live / Gaming Arena
- **Ships today:** `@henryco/rooms` package skeleton (provider-selector, realtime, server, components, hooks).
- **Missing entirely:** Original game catalog; PvP mechanic; wallet-funded match stakes; invitations + notifications; spectator + replay; moderation + anti-cheat; fair-play audit; jurisdiction-specific compliance gates.
- **Gated:** owner legal sign-off per market required before any gaming launch.

### P11 — Platform & API Layer
- **Ships today:** Webhook receivers (resend, whatsapp, account); cron handlers; document download API; per-division public APIs.
- **Weak/partial:** No formal seller API, logistics API, booking API, or business-account API yet.
- **Missing entirely:** Versioning; rate limiting beyond signup; auth scopes for partner API; developer docs; analytics exports; partner integration framework.

### P12 — Global, Mobile, Observability, Closure
- **Ships today:** i18n 12 locales (strings); multi-currency foundation; super-app + company-hub Expo skeletons; `@henryco/observability` (logger + redaction + Sentry config + audit-log); Vercel Analytics + Speed Insights.
- **Weak/partial:** Localization beyond strings (currency rounding rules per market, address formats, phone formats, tax behavior, holiday calendars) — partial; observability has logger but no traces / SLOs / performance budget enforcement / data lake / event-tracking depth.
- **Missing entirely:** Mobile app store submissions; A/B testing framework; data lake; backup/disaster-recovery formalized; GDPR/CCPA/NDPR privacy + data rights surface; V3 final integration + launch-readiness pass; V3 showcase final pass.

---

## 5 · Owner-decision gates already known

These are decisions the owner must make before specific V3 passes can ship. Full list lives in `DECISIONS-REQUIRED.md`. Snapshot:

- D1 — Payment provider activation per country (P2 blocker)
- D2 — Gaming-arena legal posture per market (P10 blocker)
- D3 — AI provider selection (Anthropic vs OpenAI vs hybrid; P4 blocker)
- D4 — AI usage pricing markup ratification (P4 blocker; owner said ~10% baseline)
- D5 — Tax engine selection (P2 blocker for tax)
- D6 — KYC vendor selection per market (P7 blocker)
- D7 — Email/SMS senders per division (operational)
- D8 — Mobile-app stack (continue Expo vs Flutter — P12 decision)
- D9 — Monetization rates per division (P9 blocker)
- D10 — Per-market localization commitment (P12 blocker)
- D11 — Foundation Lock acceptance — does the owner sign off on Phase B closing before any new feature pillar starts? (recommended YES)

---

## 6 · Anti-patterns this baseline preserves (from prior passes + owner feedback)

- Do not ship landing heroes that scale a single headline to fill the viewport (`feedback_no_giant_hero_text.md`)
- Do not ship features without commit + PR + deploy verification (V5-3 → V5-4 lesson)
- Do not certify closure without live walk evidence (V5-4 lesson)
- Do not introduce destructive operations as shortcuts
- Do not bypass V2-PNH-04 baseline headers
- Do not ship AI agents in customer-facing surfaces without owner explicit authorization (DASH-PROMPT-HARDEN-01)
- Do not name the AI provider in user-facing UI — it is "HenryCo Intelligence" only (P4 owner instruction)
- Do not mock the database in tests (existing user feedback)
- Do not bulk-batch sub-agent work — prefer one-thing-well + stop (`feedback_clean_works_over_bulk.md`)
- Do not delete files in `packages/search-ui/` — reserved as quality reference (`feedback_dashboard_search_engine_no_touch.md`)

---

## 7 · How later passes use this baseline

- Every per-pass prompt under `docs/v3/prompts/v3-NN-*.md` opens with "audit summary lifted from this baseline" and quotes the relevant section.
- The PASS-REGISTER.md cross-references this baseline section by section when motivating each pass.
- The MASTER-PLAN.md sequences passes against the foundation-lock gates documented here.
- The OWNER-BRIEF.md summarizes this baseline in one paragraph.

If the codebase moves and this baseline becomes stale, the first pass to notice updates this file and re-emits the dependent docs (PASS-REGISTER, MASTER-PLAN, OWNER-BRIEF).

---

## 8 · Self-verification

- [x] Repo state captured (workspace, branches, deploys, DB, integrations)
- [x] Capability state captured per V2 + post-V2 (19 buckets including newer packages)
- [x] Foundation Lock state captured per owner's 10 areas + cross-cutting
- [x] Per-pillar gap snapshot for all 12 pillars (P1–P12)
- [x] Owner-decision gates listed (D1–D11, full set in DECISIONS-REQUIRED.md)
- [x] Anti-patterns preserved from prior pass + owner memories
- [x] Citations to source docs (V3-DISCOVERY-INVENTORY, PRODUCT-GAP-LEDGER, intelligence-rollout-status, architecture-summary, V3-BACKLOG-FROM-V2)
- [x] No passes proposed (PASS-REGISTER does that)
- [x] No owner decisions made (DECISIONS-REQUIRED does that)
- [x] Stale-marker explicit ("if a later pass disagrees with this file, the later pass wins")

End of baseline.
