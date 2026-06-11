# V3 Pass Register

**Pass:** V3 Strategic Architect (Phase B output)
**Compiled:** 2026-05-17
**Author:** Claude · Opus 4.7 (1M context) · maximum effort
**Status:** Authoritative pass list. Every pass authored in `docs/v3/prompts/v3-NN-*.md` corresponds to one row below.

This register enumerates every V3 pass. Every pass has a unique ID `V3-NN` (with NN sequential across all 9 phases). Each pass maps to one prompt file. Each prompt file is self-contained — a fresh Claude window can read it cold and execute.

The naming convention `V3-NN-slug` is deliberately distinct from the pre-existing `V3 PASS 21` / `PASS 22-25` design-rebuild cycle (per `project_henryco_v3_pass21_rebuild_prompts.md`). Hyphenated `V3-NN` = global V3 plan. Space-separated `V3 PASS NN` = older design-rebuild cycle.

Hardening passes use a lowercase-suffix convention (`V3-07b`, `V3-07c`) anchored to the parent foundation pass. They are NOT phase blockers — they ship anytime after the parent pass plus their explicit deps clear.

---

## Phase map

| Phase | Name | Pass range | Focus |
|---|---|---|---|
| A | Audit | (this pass) | Ground-truth baseline + sub-agent audits |
| B | Foundation Lock | V3-01 → V3-12 | Boring essentials; "finish the base" |
| C | Money & Identity Spine | V3-13 → V3-25 | Payments, ledger, KYC, moderation |
| D | AI Intelligence Layer | V3-26 → V3-33 | Governed AI, usage billing, surfaces |
| E | Personalization & Predictive | V3-34 → V3-42 | Personalized home, recs, fraud, quality |
| F | Automation & Workflow | V3-43 → V3-48 | Workflow engine, owner reports, campaigns |
| G | Product Expansion | V3-49 → V3-66 | New services, business profiles, gaming (gated) |
| H | Partner & Enterprise | V3-67 → V3-75 | Onboarding, payouts, business suites |
| I | Platform/API + Global/Mobile + Observability + Closure | V3-76 → V3-96 | Public API, mobile apps, observability depth, launch readiness |

Total: **96 passes** mapping the full 12-pillar vision against current state, plus a thin tail of hardening passes (`V3-07b`, `V3-07c`) that do not count toward the 96 and do not gate any phase.

---

## Column legend

- **ID:** V3-NN (or V3-NN<letter> for hardening passes)
- **Slug:** kebab-case identifier; matches prompt filename `docs/v3/prompts/v3-NN-<slug>.md`
- **Pillar:** P1–P12 (multiple allowed if cross-pillar)
- **Deps:** Pass IDs that must complete before this one starts (`—` = none)
- **Eff:** Effort estimate (S = <1 wk, M = 1–2 wk, L = 2–4 wk, XL = 4+ wk)
- **Par:** Parallel-safe with sibling passes in same phase? (Y/N)
- **Own:** Owner decision required before start? (decision ID from DECISIONS-REQUIRED.md)
- **Risk:** Touches money/identity/compliance? (M/I/C combined)
- **One-line:** What the pass produces

---

## Phase B — FOUNDATION LOCK (V3-01 → V3-12)

The owner's #1 demand. No new feature pillar (Phase C+) starts until Phase B closes. Every pass in this phase contributes to "the base feels solid."

| ID | Slug | Pillar | Deps | Eff | Par | Own | Risk | One-line |
|---|---|---|---|---|---|---|---|---|
| V3-01 | foundation-session-persistence | P12 | — | M | Y | — | I | Token-expiry mid-action handling + multi-tab session consistency + draft preservation across refresh |
| V3-02 | foundation-auth-reliability | P12, P7 | V3-01 | M | N | — | I | OAuth UX, logout completeness across cookies/storage/cache, role-chooser badge counts, session-tampering defense |
| V3-03 | foundation-notification-message-states | P3, P12 | — | L | Y | — | — | Real `is_read`/`read_at` on `support_threads` + `support_messages`; delivery-state machine (sent/delivered/seen); retry on transient failure |
| V3-04 | foundation-deep-links | P3, P12 | V3-02 | M | Y | — | — | Legacy `/care?booking=` backfill decision + auth round-trip preservation + universal links + share link inventory |
| V3-05 | foundation-kill-loading-theater | P12 | — | M | Y | — | — | Sweep PRODUCT-GAP-LEDGER warmup copy ("Loading X", "Preparing X") across all 7+ public surfaces; replace with plain-state language |
| V3-06 | foundation-dead-link-sweep | P12 | V3-05 | M | Y | — | — | Every `href=` verified against live route table; cross-division links specifically; commit deletion of every dead path |
| V3-07 | foundation-hardcoded-text-cleanup | P12 | — | M | Y | — | — | Close `docs/v3/i18n-gaps/` work units; remove ~30 `henrycogroup.com` literals; sweep remaining string-literals into surface labels |
| V3-08 | foundation-empty-dashboard-truth | P12, P3 | V3-03 | M | Y | — | — | Every KPI tile distinguishes "no data yet" from "loading" from "you have nothing"; subscriptions/invoices truth-up; remove decorative placeholder modules |
| V3-09 | foundation-mobile-consistency | P12 | — | M | Y | — | — | Safe-area insets, viewport keyboard avoidance, swipe gestures, sticky nav, modal escape — across all public + auth flows on web mobile |
| V3-10 | foundation-logs-states-fallbacks | P12 | — | M | Y | — | — | `@henryco/observability` adoption inventory + per-route fallback handling coverage; explicit degraded-side-effect reporting on every mutating route |
| V3-11 | foundation-one-job-per-card | P12 | V3-04 | M | N | — | — | Audit every card/button/summary module: "does this open the exact next step?" — destructive cleanup of decorative-only surfaces |
| V3-12 | foundation-lock-acceptance | P12 | V3-01..V3-11 | M | N | D11 | — | Red-team the foundation; owner sign-off; gate for Phase C start |

**Phase B parallelism plan:** V3-01, V3-03, V3-05, V3-07, V3-09, V3-10 can run in parallel as first wave. V3-02 blocks on V3-01. V3-04 blocks on V3-02. V3-06 blocks on V3-05. V3-08 blocks on V3-03. V3-11 blocks on V3-04. V3-12 blocks on all prior.

**Phase B closure gate (D11):** No Phase C+ pass starts until V3-12 closes with owner sign-off.

### Phase B hardening tail (NOT phase blockers)

| ID | Slug | Pillar | Deps | Eff | Par | Own | Risk | One-line |
|---|---|---|---|---|---|---|---|---|
| V3-02b | public-shell-logout-everywhere-completion | P12, P7 | V3-02 | S | Y | — | I | Wire `onSignOut` prop on shared `PublicAccountChip` + `AccountDropdown` across the 6 remaining public-shell apps (care, jobs, learn, logistics, property, studio); marketplace already wired as template; ~2 hours; source: `.codex-temp/v3-02-auth-reliability/report.md` §8 item 2 |
| V3-07b | operator-surface-i18n | P12 | V3-07, V3-12 | L | N | D17 | — | Close ~1,305 operator-surface i18n GAPs (staff dashboards, admin workspaces, server messages, emails, PDFs, structured data, A11y); raise scanner from baseline to "no ambiguity"; 3–4 sessions |
| V3-07c | henrycogroup-domain-sweep | P12 | V3-07 | S | Y | — | — | Mechanical replace of remaining ~156 `henrycogroup.com` literals with `henryDomain(division)` / `henryWebRoot()` helper across `apps/` + `packages/` (excl. `packages/search-ui/`); 1–2 sessions |
| V3-DELIVERY-01 | notification-delivery-classification-fix | P3, P12 | V3-03 (merged) | S | Y | — | — | Add `email_dispatched_at IS NOT NULL` guard to V3-03 redelivery cron Stage 2 + optional 1-statement UPDATE to re-classify 1,408 misclassified `customer_notifications` rows (benign, 13 distinct users); see `docs/v3/notification-delivery-incident.md`; ~6-line fix |

**Hardening posture (V3-02b, V3-07b, V3-07c, V3-DELIVERY-01):**
- These are HARDENING / CLEANUP passes surfaced by Wave B.1/B.2 conductors as deferred work after their parent passes closed. With one named exception, none block Phase B closure (D11) and none block Phase C start.
- **Exception — V3-02b blocks Phase B closure (V3-12 acceptance).** V3-12 red-teams "no dead logout paths"; the 6 public-shell apps still routing through the legacy fetch path are a foundation-lock gap until wired. Schedule V3-02b in the same window as V3-02's merge.
- Pattern B (runtime DeepL fallback) handles user-facing translation today; V3-07b/c deliver Pattern A typed-copy completeness and operator-surface coverage.
- V3-07b runs sequentially across modules within itself (3–4 agent sessions are expected, each closing a module slice). V3-07c is parallel-safe and mechanical.
- V3-DELIVERY-01 is benign — see `docs/v3/notification-delivery-incident.md`. Ship within the same window as the cron-guard PR.
- Either V3-07b/c may execute during Phase C or later. Recommendation: schedule V3-07c immediately after V3-07 merges (1–2 session sweep); schedule V3-07b after Phase B closes, before Phase C wave 2.

### Infrastructure tail (NOT phase blockers; sit between Phase B closure and Phase C)

| ID | Slug | Pillar | Deps | Eff | Par | Own | Risk | One-line |
|---|---|---|---|---|---|---|---|---|
| V3-DOMAIN-01 | henry-holdings-domain-migration | P12 | Wave B.1 merged + henry.holdings purchased + CAC certificate + corporate bank account | M | N | — | I | Migrate production from `henrycogroup.com` to `henry.holdings` — DNS, SSO domain, OAuth callbacks, Vercel project domains, email sender domains, hardcoded references via `henryDomain()` helper; see `docs/v3/domain-decision.md` + `docs/v3/infrastructure-decisions.md` ID-2 |

**Infrastructure posture (V3-DOMAIN-01):**
- Domain `henry.holdings` is selected (per `docs/v3/domain-decision.md`) but not yet acquired. Trigger to buy: Wave B.1 fully merged + CAC certificate received + corporate bank account opened.
- Cross-references with infrastructure ID-1 (Cloudflare reverse-proxy, see `docs/v3/infrastructure-decisions.md`) — sequence Cloudflare cutover BEFORE the domain migration where possible to minimize compounding DNS churn.
- Does NOT block any V3 numbered pass; clean public launch (V3-96) benefits from the migration but does not strictly require it.

---

## Phase C — MONEY & IDENTITY SPINE (V3-13 → V3-25)

Payments and identity are the highest-stakes work in V3. Every pass in this phase touches Money, Identity, or Compliance. Most require owner decisions before code can ship.

| ID | Slug | Pillar | Deps | Eff | Par | Own | Risk | One-line |
|---|---|---|---|---|---|---|---|---|
| V3-13 | payments-provider-router | P2 | V3-12 | M | N | — | M | Vendor-agnostic `@henryco/payment-router` (capability registry + deterministic country routing) built + proven against MockProvider; A1/A2/A3 (idempotent create / legal transitions / webhook dedup) enforced at DB + mirrored TS reference; client never sees provider (Principle 9). See `docs/v3/payment-router-architecture.md` |
| V3-14 | payments-stripe-activation | P2 | V3-13 | L | Y | D1 | M | Stripe SDK wired + Apple/Google Pay + Stripe Connect for payouts + webhook handler signed-and-idempotent |
| V3-15 | payments-paystack-activation | P2 | V3-13 | L | Y | D1 | M | Paystack SDK wired + card + bank + USSD + webhook reconciliation |
| V3-16 | payments-flutterwave-activation | P2 | V3-13 | L | Y | D1 | M | Flutterwave SDK wired + mobile money rails + multi-currency + webhook reconciliation |
| V3-17 | payments-ledger-hardening | P2, P9 | V3-13 | L | N | — | M | Double-entry verification; reconciliation queries; immutable audit trail; daily balance snapshot |
| V3-18 | payments-receipts-and-invoices | P2 | V3-17 | M | Y | — | M | PDF generator unified; email delivery; storage + retrieval + signed-URL access; branded per-division |
| V3-19 | payments-refunds-and-reconciliation | P2 | V3-14, V3-15, V3-16, V3-17 | L | N | — | M | Provider-agnostic refund flow + webhook reconciliation engine + dispute tracking + dispute response surface |
| V3-20 | payments-subscription-lifecycle | P2 | V3-13, V3-17 | L | Y | D9 | M | Trial → active → grace → canceled state machine; dunning; retry; pause/resume; proration |
| V3-21 | payments-tax-engine | P2, P7 | V3-13, V3-17 | XL | Y | D5 | M, C | Per-country + per-product + per-buyer tax computation; tax-included display rules; VAT/GST/sales-tax/Nigeria-VAT |
| V3-22 | payments-finance-dashboard | P2, P8 | V3-17, V3-19, V3-20 | L | Y | — | — | Owner-only finance dashboard: revenue, refunds, disputes, by-division/by-provider/by-country/by-time |
| V3-23 | payments-native-app-compliance | P2, P12 | V3-14 | M | Y | D8 | M | super-app payments wired with App Store + Play Store policy compliance (use Apple Pay for digital goods, web for physical) |
| V3-24 | identity-kyc-vendor-integration | P7 | V3-12 | XL | Y | D6 | I, C | Per-market KYC vendor selection (Smile Identity / Onfido / Sumsub / Verisoul) + adapter pattern + verification levels + per-action gating |
| V3-25 | identity-content-moderation-framework | P7 | V3-12 | L | Y | — | C | Cross-division content moderation: marketplace listings, jobs posts, studio briefs, services profiles; LLM-assisted but human-gated |

**Phase C parallelism plan:** V3-13 first (provider router). Then V3-14, V3-15, V3-16 in parallel (per-provider integrations). V3-17 ledger in parallel with provider work. V3-18, V3-20, V3-21, V3-22, V3-23 fan out after their deps. V3-19 (refunds) waits for all providers + ledger.

**V3-13 card-CTA rollout (Q2 deliverable):** the `cardCta` seam shipped on `PaymentSurfaceContext` (+ `buildPaymentSurfaceContext` passthrough) in `@henryco/payment-surface`, wired once as a reference in marketplace `/pay/[orderNo]` — gated on `MOCK_PAYMENT=1` so production ships no dead link until the live card route exists. Remaining pay surfaces to adopt the same seam (tracked, NOT yet wired): logistics, studio, jobs, property, care. Each adopts via one call-site addition — `buildPaymentSurfaceContext({ …, cardCta: { label: translateSurfaceLabel(locale, "Pay with card"), href } })` — when its checkout surface and a live card route are ready. No live provider until V3-14/15/16.

**V3-15 checkout-entry + callback + USSD surface (follow-up — REQUIRED before rails carry traffic):** V3-15 activated the Paystack rail end-to-end at the server boundary (`POST /api/payments/intents` → hosted-redirect `clientAction`, webhook reconciliation, Q3 refund lifecycle) but deliberately deferred scope item 4 — the buyer-facing checkout *entry* UI and the `/payments/callback` landing page. The callback URL is already computed (`getAccountUrl("/payments/callback")`, G7 config-driven) and threaded into Paystack's `transaction/initialize`, but **the page itself is not built** — a buyer redirected back lands on a 404 today. This follow-up is the first real card/USSD entry point and is tied to the 6-app CTA rollout above: it MUST exist before any live checkout. Scope: (a) a checkout-entry surface that calls the intents route and forwards the opaque `clientAction.redirect` (never names Paystack — Principle 9); (b) the `/payments/callback` page that reads back intent status (money truth comes from the webhook, NOT this redirect — callback is display-only); (c) **USSD** for NG buyers via Paystack's hosted `channels:['ussd']` — no bespoke USSD UI (Principle 9 keeps the provider invisible; the hosted page renders the USSD code). USSD especially matters for NG users without cards. Until this ships, V3-15 is functionally closed at the API boundary (Finish Line 1) but cannot carry real buyers.

---

## Phase D — AI INTELLIGENCE LAYER (V3-26 → V3-33)

The "HenryCo Intelligence" surface. Owner's hard constraints: never name the provider in UI; unauth users get zero personal-task usage; wallet-zero = API not called; ~10% margin on provider cost; free for company-critical tasks (e.g. registering a service the user is paying for), metered for personal tasks.

| ID | Slug | Pillar | Deps | Eff | Par | Own | Risk | One-line |
|---|---|---|---|---|---|---|---|---|
| V3-26 | ai-provider-router | P4 | V3-12 | L | N | D3 | I, M | Vendor-agnostic AI provider interface; Anthropic/OpenAI/open-source adapters; per-task model routing; cost telemetry |
| V3-27 | ai-usage-billing-engine | P4, P2, P9 | V3-26, V3-17 | XL | N | D4 | M | Per-call metering; wallet auto-debit; hard wallet-zero cap; ~10% margin layered; usage dashboard for user; per-task pricing config; idempotency on billed calls |
| V3-28 | ai-henryco-intelligence-chat-surface | P4 | V3-26, V3-27 | L | N | — | I | Governed chat UI surface labeled "HenryCo Intelligence" only; declines competing-brand questions; declines anti-company statements; per-context preset |
| V3-29 | ai-support-message-assist | P4 | V3-28 | M | Y | — | — | Helps user draft support messages — FREE (company-critical task); rate-limited per-account; inline in chat-composer |
| V3-30 | ai-business-message-assist | P4, P8 | V3-28 | M | Y | — | M | Helps business owner draft customer-facing messages — METERED; inline in business suite messaging |
| V3-31 | ai-account-check-assist | P4 | V3-28 | M | Y | — | — | Helps user check anything in their account — FREE; respects RLS; never reveals secrets |
| V3-32 | ai-studio-domain-and-brief-assist | P4 | V3-28 | M | Y | — | M | Helps domain-availability lookup in studio (FREE because it's a sales-aiding task on a paid service); helps studio clients articulate briefs (METERED for client-end) |
| V3-33 | ai-personal-task-gating | P4, P7 | V3-26, V3-27 | M | N | — | I | Unauth users blocked from personal-task usage at the router; auth-and-wallet-check middleware on every personal-task call; audit every call |

**Phase D parallelism plan:** V3-26 first. V3-27 + V3-33 fan out. V3-28 chat surface after billing exists. V3-29 through V3-32 in parallel after V3-28.

---

## Phase E — PERSONALIZATION & PREDICTIVE (V3-34 → V3-42)

Built on top of the AI layer (Phase D) and the existing deterministic intelligence package. Predictive replaces rules-based with learned-model where appropriate.

| ID | Slug | Pillar | Deps | Eff | Par | Own | Risk | One-line |
|---|---|---|---|---|---|---|---|---|
| V3-34 | personalization-home | P3 | V3-12, V3-26 | L | Y | — | — | Per-user persistent home layout; module ordering by signal; device-aware (mobile vs desktop); fallback to default |
| V3-35 | personalization-deals-and-campaigns | P3, P1 | V3-34 | L | Y | — | — | Deals engine driven by user signals + history + division mix; campaign authoring tool for staff; fairness audit |
| V3-36 | personalization-cross-division-recommendations | P3 | V3-34, V3-26 | L | Y | — | — | Recommended services/jobs/courses/properties per user; deterministic + AI hybrid; explainable reason codes |
| V3-37 | personalization-abandoned-task-recovery | P3, P5 | V3-34 | M | Y | — | — | Beyond cart: incomplete bookings, half-filled forms, paused KYC, abandoned proposals; cross-channel recovery (email/push/in-app) |
| V3-38 | personalization-local-availability | P3, P1 | V3-34 | M | Y | — | — | Geo-aware service catalog; provider availability awareness; "available in your area" badge |
| V3-39 | personalization-smart-next-action | P3, P5 | V3-34 | M | Y | — | — | Per-page next-step prompt; cross-division stitch (e.g., "booked Care → here's a relevant Job"); deeplinked into exact workflow step |
| V3-40 | predictive-fraud-and-risk | P6, P7 | V3-26 | XL | Y | — | I, C | Move beyond 8 rules-based signals; train on labeled signals; daily-scored risk for accounts, listings, transactions, support tickets |
| V3-41 | predictive-quality-and-workload | P6 | V3-26 | L | Y | — | — | Staff workload prediction; service quality warning; dispute likelihood; queue staffing recommendation |
| V3-42 | predictive-staff-dashboards | P6 | V3-40, V3-41 | M | Y | — | — | Advanced staff intelligence dashboards: trend, anomaly, recommendation, drill-down; per-staff/per-team views |

**Phase E parallelism plan:** V3-34 first (foundation). Then most siblings can fan out in parallel since they're per-domain. V3-42 waits for prediction passes to land.

---

## Phase F — AUTOMATION & WORKFLOW (V3-43 → V3-48)

Generalize the workflow patterns scattered across cron handlers, intelligence triage, and ad-hoc reminders into a coherent engine.

| ID | Slug | Pillar | Deps | Eff | Par | Own | Risk | One-line |
|---|---|---|---|---|---|---|---|---|
| V3-43 | workflow-engine-foundation | P5 | V3-10 | L | N | — | — | Cron + outbox + retry + idempotency unified; observable; reusable across divisions |
| V3-44 | workflow-auto-assign-escalate | P5, P7 | V3-43 | M | Y | — | — | Support + dispute + KYC review queues: deterministic assignment + AI-augmented escalation; per-queue thresholds |
| V3-45 | workflow-auto-remind | P5 | V3-43, V3-37 | M | Y | — | — | Incomplete actions, expiring sessions, abandoned tasks: SMS + email + push reminders; respect quiet hours; opt-out honored |
| V3-46 | workflow-owner-reports | P5 | V3-43 | M | Y | — | — | Weekly + monthly + quarterly reports per division + cross-division; auto-generated PDF; owner-only delivery |
| V3-47 | workflow-neglected-queue-detection | P5 | V3-43, V3-44 | M | Y | — | — | Staff queue health monitoring; escalate when SLA breach detected; auto-notify queue manager |
| V3-48 | workflow-follow-up-campaigns | P5, P3 | V3-43, V3-35 | M | Y | — | — | Post-purchase / post-booking / post-service / post-course campaigns; multi-step; A/B tested |

---

## Phase G — PRODUCT EXPANSION (V3-49 → V3-66)

The big P1 build-out. This phase ships actual new product surfaces. Many passes have direct customer-facing impact and need premium polish (per the "polish is trust" feedback).

| ID | Slug | Pillar | Deps | Eff | Par | Own | Risk | One-line |
|---|---|---|---|---|---|---|---|---|
| V3-49 | product-services-catalog-expansion | P1 | V3-12 | XL | N | — | — | Care broadens to: laundry, garment care, repairs, errands, moving, event support, business support, deep cleaning, provider-assisted. Service taxonomy + per-service surfaces + pricing per service |
| V3-50 | product-verified-provider-model | P1, P7, P8 | V3-49, V3-24 | XL | N | — | I, C | Provider profile + verification + scoring + availability + service areas; provider-side onboarding flow |
| V3-51 | product-smart-booking | P1 | V3-49, V3-50 | L | Y | — | — | Slot picker + provider matching + recurring bookings + cancellation policy per service |
| V3-52 | product-marketplace-discovery-and-ranking | P1, P3 | V3-12 | XL | Y | — | — | T3.A from V5-5 (5 sub-PRs: density variant, merit shuffle, personalisation re-rank, editorial overlays, telemetry); diversity guard; trust gate |
| V3-53 | product-property-rules-engine | P1, P7 | V3-12 | L | Y | — | C | Listing validity rules; inspection eligibility (per `property-inspection-eligibility-rules.md`); governance flag automation |
| V3-54 | product-jobs-interview-room | P1 | V3-12 | L | Y | — | — | Scheduled video room (uses `@henryco/rooms`); recruiter notes; candidate-employer chat (uses chat-composer); recording opt-in |
| V3-55 | product-studio-motion-video | P1 | V3-12 | L | Y | — | — | Studio motion/video service intake + scope step + production workflow + delivery + asset packs |
| V3-56 | product-learn-to-earn-employer-tools | P1 | V3-12 | L | Y | — | — | Course-completion → jobs-board pipeline; employer-side tools for course gating; verified-completion badges |
| V3-57 | product-business-profiles-and-tools | P1, P8 | V3-12 | L | Y | — | — | Company profiles; business storefront; business team management; business analytics surface |
| V3-58 | product-seller-academy | P1, P8 | V3-56, V3-57 | M | Y | — | — | Courses for sellers; quality scoring; certification; tiered seller badges |
| V3-59 | product-concierge-guided-assistant | P1, P4 | V3-28 | L | Y | — | — | Cross-division assistant powered by HenryCo Intelligence; guided flows for first-time users |
| V3-60 | product-coming-soon-roadmap | P1 | V3-12 | S | Y | — | — | Transparent public roadmap surface; pre-launch signup; quarterly update post; not a marketing promise wall |
| V3-61 | product-newsletter-engine | P1, P5 | V3-48 | M | Y | — | — | Campaign authoring, segmentation, analytics, GDPR-compliant unsubscribe; transactional vs marketing separation |
| V3-62 | product-deals-engine | P1, P3 | V3-35 | M | Y | — | — | Deal creation by partners; deal discovery by users; fairness + visibility audit |
| V3-63 | product-local-discovery | P1, P3 | V3-49, V3-50, V3-38 | L | Y | — | — | Geo-search across services + products + properties; per-city landing surfaces; "near you" relevance |
| V3-64 | product-logistics-network-maturity | P1 | V3-12 | L | Y | — | — | Multi-rider routing; cross-division shipment bundling; customer-facing tracking polish; SLA enforcement |
| V3-65 | gaming-arena-foundation | P10 | V3-13, V3-17, V3-24 | XL | N | D2 | M, I, C | **GATED on legal sign-off per market.** Original game catalog scaffold (no copyrighted IP); PvP mechanic foundation; lobby; profile |
| V3-66 | gaming-arena-stakes-spectator-replay | P10 | V3-65 | XL | N | D2 | M, I, C | **GATED.** Wallet-funded match stakes with company margin per match; spectator + replay; invitations + notifications; anti-cheat foundation; fair-play audit |

---

## Phase H — PARTNER & ENTERPRISE (V3-67 → V3-75)

Business-side suites. Most depend on Phase C (payments, identity) and Phase G (verified provider model, business profiles).

| ID | Slug | Pillar | Deps | Eff | Par | Own | Risk | One-line |
|---|---|---|---|---|---|---|---|---|
| V3-67 | partner-onboarding | P8, P7 | V3-50, V3-24 | L | N | — | I, C | KYC integration + verification + service-area selection + initial profile + contract acceptance |
| V3-68 | partner-performance-and-contracts | P8 | V3-67 | L | Y | — | — | Quality scoring; contract storage; dispute history; performance dashboard; SLA tracking |
| V3-69 | partner-payouts | P8, P2 | V3-67, V3-14, V3-15, V3-16 | XL | N | — | M, C | Wallet credit + bank transfer + scheduled payouts + tax forms (W-9, NDPR-compliant); per-country payout rails |
| V3-70 | enterprise-employer-hiring-suite | P8 | V3-57 | L | Y | — | — | ATS-grade: applicant tracking, interview scheduling, candidate scoring, team collaboration |
| V3-71 | enterprise-seller-business-suite | P8 | V3-57, V3-58 | L | Y | — | — | Bulk listing, deal scheduling, performance analytics, payout management, team roles |
| V3-72 | enterprise-service-provider-crm | P8 | V3-50, V3-57 | L | Y | — | — | Customer notes, recurring bookings, performance, payout reconciliation |
| V3-73 | enterprise-studio-project-suite | P8 | V3-57 | L | Y | — | — | Project management at depth; asset packs; milestones; client portal; revisions tracking |
| V3-74 | enterprise-logistics-business-dashboard | P8 | V3-57, V3-64 | L | Y | — | — | Business shipper dashboard; contracts; bulk shipments; B2B statements + reconciliation |
| V3-75 | enterprise-bulk-invoicing-team-roles-admin | P8, P2 | V3-18, V3-57 | L | N | — | M, C | Multi-user accounts for businesses; team roles + permissions; company admin accounts; bulk invoicing |

---

## Phase I — PLATFORM/API + GLOBAL/MOBILE + OBSERVABILITY + CLOSURE (V3-76 → V3-96)

Foundation for the next chapter (partners, integrations, scale). Closure passes lock V3.

| ID | Slug | Pillar | Deps | Eff | Par | Own | Risk | One-line |
|---|---|---|---|---|---|---|---|---|
| V3-76 | platform-public-api-foundation | P11 | V3-02 | L | N | — | I | Versioning scheme; rate limiting; auth scopes; key management UI; per-app/per-partner keys |
| V3-77 | platform-seller-api | P11, P8 | V3-76, V3-71 | L | Y | — | — | Read products + write orders + read inventory + webhooks; example clients in 3 languages |
| V3-78 | platform-logistics-api | P11 | V3-76, V3-74 | L | Y | — | — | Quote + book + track + cancel + webhooks; signed callbacks |
| V3-79 | platform-booking-api | P11 | V3-76, V3-51 | L | Y | — | — | Services + slots + bookings + cancel + webhooks |
| V3-80 | platform-business-account-api | P11, P8 | V3-76, V3-75 | L | Y | — | — | Multi-user accounts, team roles, analytics access |
| V3-81 | platform-webhook-delivery-service | P11 | V3-76 | M | Y | — | — | Versioned, signed, retryable, observable webhook delivery service; per-partner subscription |
| V3-82 | platform-analytics-exports | P11, P12 | V3-90 | M | Y | — | — | CSV + JSON + scheduled deliveries; partner-scoped data access |
| V3-83 | platform-developer-docs | P11 | V3-77, V3-78, V3-79, V3-80 | L | Y | — | — | API reference + guides + changelog + sandbox; published at `developers.henrycogroup.com` |
| V3-84 | global-localization-maturity | P12, P3 | V3-12, V3-21 | XL | Y | D10 | C | Per-market currency rounding rules, address formats, phone formats, tax behavior, holiday calendars |
| V3-85 | global-per-market-payment-routing | P12, P2 | V3-13, V3-84 | M | Y | — | M | Router uses market default; user can override; per-market provider availability matrix |
| V3-86 | mobile-architecture-decision | P12 | V3-12 | M | N | D8 | — | Continue Expo vs Flutter spike — owner-decided; produce decision doc + spike branch + cost analysis |
| V3-87 | mobile-super-app-parity-wave-1 | P12 | V3-86, V3-03, V3-04 | XL | N | — | — | Notifications + messages + bookings + orders parity with web; payment surface integration |
| V3-88 | mobile-store-submission | P12 | V3-87, V3-23 | XL | N | — | C | App Store + Play Store submission; OneSignal mobile push wired; per-store policy compliance |
| V3-89 | observability-traces-slos-budgets | P12 | V3-10 | L | Y | — | — | Traces (OpenTelemetry); SLOs per critical user journey; error budgets; performance-budget enforcement on PR |
| V3-90 | observability-data-lake-event-tracking | P12 | V3-43 | L | Y | — | — | Sink for analytics events (S3 / GCS / BigQuery / Supabase); BI access; PII-redacted by default |
| V3-91 | observability-ab-testing-framework | P12 | V3-90 | M | Y | — | — | Adopt one of GrowthBook / LaunchDarkly / Vercel Edge Config; per-feature flag-and-experiment lifecycle |
| V3-92 | observability-backup-disaster-recovery | P12, P7 | V3-90 | L | Y | — | C | Backup runbooks; restore tests; RPO/RTO targets per data class; off-site replica |
| V3-93 | compliance-privacy-data-rights | P12, P7 | V3-24, V3-90 | L | Y | — | C | GDPR + CCPA + NDPR: DSAR endpoint; deletion workflow; consent ledger; per-region data residency |
| V3-94 | closure-integration-test-pass | P12 | V3-13..V3-93 | L | N | — | I, M, C | Cross-pillar smoke test; live walk every public surface; auth+role matrix; foundation-lock regression; re-runs V3-07 + V3-07b hardcoded-text CI gate |
| V3-95 | closure-launch-readiness | P12 | V3-94 | M | N | — | I, M, C | Owner sign-off pack: every gate cleared, every doc current, every credential rotated, every backup verified |
| V3-96 | closure-v3-showcase | P12 | V3-95 | M | N | — | — | Public-facing launch: announcement post, screen recordings, press kit, customer FAQ, what's new page |

---

## Critical path (longest dependency chain)

```
V3-01 → V3-02 → V3-04 → V3-11 → V3-12  (Foundation Lock close)
       → V3-13 → V3-17 → V3-19 → V3-94 → V3-95 → V3-96  (Money spine through closure)
       
V3-12 → V3-24 → V3-50 → V3-67 → V3-69 → V3-75 → V3-94  (Identity through enterprise)

V3-12 → V3-26 → V3-27 → V3-28 → V3-59 → V3-94             (AI through concierge)

V3-12 → V3-65 → V3-66 → V3-94                              (Gaming — gated)
```

Critical path is approximately **27 sequential passes** end-to-end. With parallelism per phase, the practical wall-clock minimum is ~40 weeks of focused execution if zero owner-decision delays. Realistic with owner availability + legal sign-offs is **9–18 months** for full V3 closure.

V3-07b and V3-07c sit OUTSIDE the critical path. They re-run inside V3-94's regression suite but do not extend the wall-clock minimum.

---

## Parallelization map (what runs together within each phase)

- **Phase B:** wave 1 = V3-01, V3-03, V3-05, V3-07, V3-09, V3-10 (parallel); wave 2 = V3-02, V3-06, V3-08; wave 3 = V3-04, V3-11; wave 4 = V3-12 (sequential close)
- **Phase B hardening tail:** V3-07c may run any time after V3-07 merges (parallel-safe); V3-07b runs in 3–4 sequential agent sessions any time after V3-07 + V3-12 close
- **Phase C:** V3-13 alone; then V3-14 + V3-15 + V3-16 + V3-17 + V3-21 parallel; then V3-18 + V3-20 + V3-22 + V3-23; then V3-19, V3-24, V3-25
- **Phase D:** V3-26 alone; then V3-27 + V3-33; then V3-28; then V3-29 + V3-30 + V3-31 + V3-32 parallel
- **Phase E:** V3-34 alone; then V3-35..V3-39, V3-40, V3-41 parallel; V3-42 close
- **Phase F:** V3-43 alone; then V3-44..V3-48 parallel
- **Phase G:** V3-49 → V3-50 → V3-51 chain; V3-52, V3-53, V3-54, V3-55, V3-56, V3-57, V3-60, V3-61 parallel; V3-58, V3-59, V3-62, V3-63, V3-64 dependent; V3-65/V3-66 gated and sequential
- **Phase H:** V3-67 → V3-68 → V3-69 chain; V3-70..V3-75 parallel after their respective product deps
- **Phase I:** V3-76 first; then API + global + mobile + observability fans out; closure sequential V3-94 → V3-95 → V3-96

---

## Passes blocked on owner decisions

Cross-reference DECISIONS-REQUIRED.md.

- D1 (payment provider activation per country): blocks V3-14, V3-15, V3-16
- D2 (gaming-arena legal posture per market): blocks V3-65, V3-66
- D3 (AI provider selection): blocks V3-26
- D4 (AI usage pricing markup ratification): blocks V3-27
- D5 (tax engine selection): blocks V3-21
- D6 (KYC vendor selection per market): blocks V3-24
- D8 (mobile-app stack: Expo vs Flutter): blocks V3-86, V3-23 (partially)
- D9 (monetization rates per division): blocks V3-20 (partially), V3-69, V3-75
- D10 (per-market localization commitment): blocks V3-84
- D11 (Foundation Lock acceptance): blocks Phase C start
- D17 (V3-07b operator-surface i18n scope sign-off): blocks V3-07b only; does NOT block any phase

---

## V3-COMMAND track — Owner Command Center

A **named track**, distinct from the numbered `V3-NN` global plan and the older `V3 PASS NN` design-rebuild cycle (same convention rationale as the hardening suffixes). It builds the owner's company-wide operations brain on the same **mock-first, de-risked discipline** as the payment rail (V3-13): prove the architecture against mocks before any live wiring. Blueprint: `docs/v3/command-center-architecture.md`.

| ID | Slug | Deps | Eff | Risk | Status | One-line |
|---|---|---|---|---|---|---|
| V3-COMMAND-01 | command-center-architecture | — | S | — | DONE | Audit (10 divisions + owner/staff surfaces + predicates) + three-surface architecture + publish-to-command contract blueprint (`docs/v3/command-center-architecture.md`) |
| V3-COMMAND-02 | command-foundation-staged | V3-COMMAND-01 | M | I | STAGED | `@henryco/command-contract` (typed `AttentionItem` + state machine + access gating + mock feed, `node:test`-gated) + Owner Command Center (`apps/command`) + Staff Workspace (`apps/work`) on Vercel free domains, against mocks. ZERO live data. |
| V3-COMMAND-03 | command-live-wiring | V3-COMMAND-02, V3-22 | L | M/I | BLOCKED | Supabase-backed `command_attention_items` store + SQL transition trigger + per-division publishers (replace the `apps/hub` pull model) + real `UnifiedViewer`/SQL predicates + flip to `henrySubdomain('command'|'work')` real hosts. |

**Hard lines preserved by V3-COMMAND-02:** the real owner surface (`apps/hub/app/owner/(command)`) and staff surface (`apps/staff`) are left running **untouched** — live extraction is V3-COMMAND-03. No payment surface, design token, or public site is touched. Zero hardcoded domains (`henryDomain()` / `henrySubdomain()` only). Zero code-identifier changes (`@henryco/*` unchanged).

**V3-COMMAND-03 gate:** the finance spine (V3-22) — so money-at-stake totals are authoritative — plus the real `henryonyx.com` subdomains.

---

## Passes touching Money / Identity / Compliance

(M=money I=identity C=compliance — high-stakes; require extra rigor + legal review where applicable)

- **Money-touching:** V3-13 through V3-23, V3-27, V3-30, V3-32, V3-50, V3-65, V3-66, V3-69, V3-75, V3-85, V3-94, V3-95
- **Identity-touching:** V3-01, V3-02, V3-24, V3-26, V3-28, V3-33, V3-40, V3-50, V3-65, V3-66, V3-67, V3-76, V3-94, V3-95
- **Compliance-touching:** V3-21, V3-24, V3-25, V3-50, V3-53, V3-65, V3-66, V3-69, V3-84, V3-88, V3-92, V3-93, V3-94, V3-95

V3-07b and V3-07c do NOT touch money, identity, or compliance — they are surface-text hardening only.

---

## Self-verification

- [x] 96 passes enumerated across 9 phases (A–I)
- [x] 2 hardening passes (V3-07b, V3-07c) appended to Phase B with explicit "not a blocker" note
- [x] Every pass has unique V3-NN ID (or V3-NN<letter> for hardening) with kebab-slug
- [x] Dependencies stated for every pass
- [x] Effort + parallel-safety + owner-decision + risk class flagged
- [x] Critical path computed (~27 sequential passes); hardening tail does not extend it
- [x] Parallelization map per phase, with hardening-tail scheduling note
- [x] Owner-decision blockers cross-referenced to DECISIONS-REQUIRED.md (D17 added for V3-07b)
- [x] M/I/C-risk passes inventoried
- [x] Naming convention deliberately distinct from "V3 PASS 21" cycle
- [x] Phase B placement preserves "finish the base before chasing brilliance"
- [x] Hardening posture explicit: Pattern B DeepL fallback handles user-facing translation today; V3-07b/c deliver Pattern A typed-copy completeness and operator-surface coverage

---

## Appendix — SCHEMA-TRUTH-01 drift-debt tickets (2026-06-11)

SCHEMA-TRUTH-01 regenerated `packages/data/src/database.types.ts` from PROD-ACTUAL
+ the FL2 set (see `docs/v3/fl2-apply-manifest.md`) and burned the schema-drift
baseline 33 → 21. The 21 residual entries (`scripts/ci/schema-drift-baseline.json`)
are NOT fixable by a read-side rename — each needs either its unapplied feature
family or a design decision. Burn-down tickets:

| Ticket | Baseline entries | What it needs |
|---|---|---|
| SD-1 profiles.email | learn templates/people/shared-account, logistics + studio shared-account (5×) | `profiles` has no email (it lives on `customer_profiles`); rewire the shared-account readers to the right table — behavioral, verify each consumer |
| SD-2 security risk_level | jobs posting-eligibility, staff intelligence-data (2×) | `customer_security_log` has no risk_level; define the risk signal (column at a future migration, or derive from metadata/event_type) |
| SD-3 studio wave | milestones.completed_at, automation reminder_sent_at, proposals.signed_pdf_url, revisions.requested_by_user_id (4×) | the 2026-05-14 studio feature wave (manifest §4) — ship the wave with a prod-shape rehearsal, or park the routes |
| SD-4 jobs wave | salary period/status, interview_rooms.status, offer_letters.status (4×) | the 2026-05-15 jobs feature wave (manifest §4) |
| SD-5 rooms wave | rooms_sessions.kind/.status (2×) | the rooms family (manifest §4); also unblocks the realtime backfill thirds |
| SD-6 staff review queue | review_due_at ×3 + property rental_price_kobo (4×) | the staff review-queue concept never landed in prod; staff dashboard modules read it — design decision |
| SD-7 hq nonce scope | (not in baseline — manifest §3) | the unapplied index swap in 20260407193000 (global → per author+thread client_nonce); messaging dedupe correctness |
| SD-8 workspace reads | (not in baseline — guard blind spot) | hub internal-comms access + owner DM/members routes read absent workspace_* tables today; live-risk triage (ship workspace platform or guard the reads) |
| SD-9 wave routes live-risk | (not in baseline) | division API routes per manifest §4 read absent tables and 500-if-hit (care pod/track/recurring/claims, logistics quote/book/dispatch/pod/fleet pages, jobs verifications, studio asset-packs/proposals-sign); per-family: ship wave or add read-resilience |

Guard upgrade candidate: the drift guard cannot flag a TABLE that exists in
migration files but not in prod (it trusts the types ∪ migration-DDL union).
With `supabase/prod-actual/schema.sql` now committed as the declared baseline,
a table-existence check against prod-actual + the FL2 manifest set would close
SD-8/SD-9-class blind spots in CI.
