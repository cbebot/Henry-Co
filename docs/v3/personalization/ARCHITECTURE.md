# Phase E Architecture — one personalization fabric, not silos

**Pass:** V3-E-DESIGN-01 · **Type:** Design / architecture only (no feature code, no migration) · **Risk class:** mixed (M where marked) · **Status:** Draft for owner ratification · **Base:** `origin/main @ 47de2de2` (2026-07-16)

> The thesis: Phase E is **not** nine features. It is one fabric with three projections — a **personalization** projection (what should this person see first?), a **predictive** projection (what should staff act on before it breaks?), and a **recovery** projection (what did this person leave unfinished?). All three feed on the same signal spine, rank on a deterministic floor, optionally sharpen through the governed AI gateway, render through the registered-surface system on Register-L, and answer to the same consent gate and telemetry envelope. Build the spine once; every pass mounts on it.

---

## 1. The fabric at a glance

```
              SIGNAL SPINE (§2)                         GOVERNANCE (always-on)
  customer_activity · get_signal_feed ·           consent gate (PRIVACY-NDPR §2)
  lifecycle snapshots · engagement events ·       viewer-scoping / no-cross-leak (§7)
  recommendation signals · abandoned_tasks        score opacity (server-only)
        │                                          telemetry (@henryco/intelligence envelope)
        ▼
  DETERMINISTIC RANKING FLOOR (§3–§4)             ┌─────────────────────────────┐
  computeHomeLayout · rankNextBestActions ·       │  @henryco/ai-gateway (§5)    │
  generateRecommendations (deterministic) ·  ───► │  optional enhancement only:  │
  cadence planner · risk rules                    │  re-rank / narrative / assist│
        │                                         │  — never the floor          │
        ▼                                         └─────────────────────────────┘
  SURFACES (Register-L / staff shell)
  Smart Home + /customize · deals module · /recommendations ·
  availability badges · next-action chip · /continue ·
  staff risk/predictive/intelligence dashboards
```

Two properties are non-negotiable and shared by every box:

- **Deterministic floor, AI enhancement.** Every surface works with the AI gateway *off* (kill switch, no key, budget exhausted). AI may reorder, sharpen a reason code, or write a narrative sentence; it never becomes the only path, and a freeze/enforcement decision never rests on an LLM call alone (V3-40 prompt line 91 — retained verbatim as doctrine).
- **Server-computed, opaque scoring** (ANTI-CLONE Principle 1). Clients receive ordered items + localized reason codes. `confidence`/score fields are stripped at every client boundary; leak tests assert it.

## 2. The signal spine — what personalization actually feeds on

The prompts assume a rich event stream. The ground truth is narrower and must be designed around:

| Source | State on main | Use in Phase E |
|---|---|---|
| `customer_activity` | **The real behavior spine.** 30+ direct insert sites (more via wrappers) across account/care/studio/staff/jobs; columns `division, activity_type, title, status, reference_type/id, amount_kobo, metadata, action_url`; owner-SELECT RLS; governance columns (`archived_at`, `retention_hold_until`) exist (`supabase/prod-actual/captured-migrations/20260402150914:190`; `20260423143000_data_governance_foundation.sql:369-419`) | Primary signal for recency/division-mix/lifecycle features. Canonical metadata via `buildCanonicalActivityMetadata` (`packages/intelligence/src/analytics.ts`) — PII-stripped at write by `sanitizeAnalyticsProperties` |
| `get_signal_feed` RPC | SECURITY DEFINER union of `customer_notifications` + last-30d `customer_activity`, priority×recency score, cursor pagination, auth.uid() IDOR guard (`20260623090000:147-156`) | V3-34 derives module-level `signalScores` from it (group items by source → max score) — exactly as the prompt already specifies |
| `henry_events` | Queryable telemetry sink, **but only 10 event names ever persist** (auth session ×3, module.rendered, deeplink ×2, ai.usage ×4); ~150 typed names are pino/Sentry-only; SELECT is service-role-only; no retention job (V3-90 pending) | Treat as *operational* telemetry, not a personalization feature source. Phase E **emits** its new events here (via `persistEvent` where a durable row is needed) but never assumes browse/click history exists |
| `user_engagement_events` | Deduped re-engagement log (`cart_abandoned`, `kyc_incomplete_after_signup`, …) with `consumed_at`/`consumer` worker columns — **producer-only today** ("NO email worker is wired", `apps/account/app/api/cron/engagement-sweep/route.ts:1-14`) | The designed hand-off queue between detection and outreach. Phase E's recovery/campaign passes become its **first consumers** |
| `customer_lifecycle_snapshots` | Per-pillar snapshot upserted on every account dashboard render by the ~20-read collector (`apps/account/lib/lifecycle/collector.ts:741-881`); applied on prod | Lifecycle stage = a primary relevance signal (V3-36) and the V3-37 detector input (shipped) |
| `marketplace_recommendation_signals` | Table + hourly recompute cron **exist and are applied** (`apps/marketplace/lib/marketplace/automation.ts:407-415`; `docs/v3/fl2-apply-manifest.md:174`), kinds `co_purchase/co_view/similar_attributes/…`, score 0..1 — **no UI reads it** | V3-36's marketplace recommender reads this instead of the prompt's "V3-52 TODO" placeholder |
| `recently_viewed_items` / `marketplace_recently_viewed` | Tables applied with owner-scoped RLS — a write helper exists (`trackRecentlyViewed`, `packages/cart-saved-items/server/index.ts:277-302`) but has **zero callers**, so nothing writes at runtime | **S0 signal-foundation work**: wire the existing helper into item-view surfaces (not a new write path); then `getRecentlyViewed` (`apps/account/lib/account-data.ts:481-506`, 0 callers) and `WelcomeBackSurface` light up |
| `abandoned_tasks` + engagement substrate | V3-37 spine shipped (see §6); `saved_items`, `cart_recovery_state` applied | Recovery projection + "continue" signals for the home |

**Design rule:** every ranking input must name its source column(s) from this table. A pass that needs a signal that does not exist adds the *write path* first (S0), never fakes it.

## 3. Personalization projection I — the personal home (V3-34)

**Ground truth:** the cross-division personal home already exists and is good: the account Smart Home (DASH-4) — `SmartHomeHero` + `AttentionPanel` + `NextBestActions` + `RankedMetricStrip` + cursor-paginated `SignalFeed` + `ModuleWidgetGrid` over a 13-module registry (`apps/account/app/(account)/page.tsx:37-78`; `_modules/index.ts:15-36`), with the V3-37 `RecoveryNudge` already mounted. `apps/account` is the SSO host / super-app; care, learn, and property customer homes are its division landings (their own apps redirect or host no customer dashboard at all — `apps/learn/app/learner/page.tsx:4-6`, `apps/property/app/account/page.tsx:6-8`).

**V3-34 therefore stays what its prompt says it is** — a *layout-persistence layer over* the Smart Home (`user_home_layouts` + pure `computeHomeLayout` + `/customize`), with these re-groundings:

1. **Migration path:** `apps/hub/supabase/migrations/<ts>_v3_34_user_home_layouts.sql` (not root `supabase/migrations/`).
2. **Surface scope, first slice = `account` only.** The prompt's S5 extends the projection to owner (hub) and staff homes — but `@henryco/data`'s owner/staff summaries are hard-coded zero stubs (`packages/data/src/dashboard-summary.ts:167-189`) and hub/staff still run legacy readers. Owner/staff layout personalization is a *follow-on slice* gated on those readers existing, not part of the foundation.
3. **The `open_blocker` reason code** maps to what exists: lifecycle `actionables` (critical tier) + trust-pillar KYC state — the same inputs `rankNextBestActions` already consumes.
4. **Kill switch** joins the governed flag family (§8) rather than a bespoke env var.
5. **Expo contract note stands** (the super-app reads the same row via `@henryco/data`) — V3-87 consumes it; no native UI here.

V3-34 remains **the Phase E foundation for the personalization fan-out** (V3-35/36/38/39 mount modules/chips into the home it makes persistent). It is *not* a dependency of the predictive passes (§5.3).

## 4. Personalization projection II — recommendations, deals, availability, next-action

### 4.1 V3-36 cross-division recommendations — wire the reserved seam

The landing site is already reserved: `rankNextBestActions` declares itself the **floor** that `flags.intelligence_recommendations` may supersede with a richer `@henryco/intelligence` recommender (`apps/account/lib/smart-home/recommender.ts:55-60`; flag registered at `packages/intelligence/src/index.ts:304`). V3-36 builds exactly that module — `packages/intelligence/src/recommendations/` with `generateRecommendations` — as the prompt specifies, with these re-groundings:

- **Candidate substrate is two-layered:** `@henryco/data` core readers (`getCrossDivisionActivity`, `getSignalFeed`, aggregates) **plus** the 15 `dashboard-modules-*` satellites for division-commerce reads. The engine's per-domain recommenders take *injected reader functions*, so it never grows its own table access and stays leak-testable.
- **Marketplace recommender reads `marketplace_recommendation_signals`** (applied + recomputed hourly) — the prompt's "until V3-52 lands, a deterministic recency/category recommender with a TODO" is superseded by real data.
- **Existing per-division recommenders join the fabric instead of being duplicated:** jobs already ships a content-based scorer on the candidate home (`apps/jobs/lib/jobs/data.ts:553-604`); property ships a localStorage-prefs "Recommended for you" on its public homepage. V3-36's jobs/property domain modules wrap/lift these, one vocabulary of `RecommendationReasonCode`s across all five domains.
- **Wire-or-retire the orphans:** `RecommendationRail` (marketplace), `WelcomeBackSurface` + `getRecentlyViewed` (account), learn's `recommended` field — each either becomes a consumer of `generateRecommendations` or is deleted in the pass. No third state.
- **AI re-rank rides the gateway** on a new **internal, non-billable** surface (§5.2) — never the metered personal-task path (the prompt's own "keep it on the free/internal path" line, now made concrete by the registry).
- **Consent-gated:** cross-division profiling requires the `personalizedExperience` gate per E-D2 (PRIVACY-NDPR §2). Without consent the engine returns division-local, non-profiled defaults.

### 4.2 V3-35 deals & campaigns — reconcile with what's applied

The prompt's `deals` + `deal_impressions` schema stands, with re-groundings: (a) migration under `apps/hub/supabase/migrations/`; (b) **reconcile with `marketplace_deals_curation`** — the applied, staff-curated "deals of the moment" table read by the marketplace dashboard module (`packages/dashboard-modules-marketplace/src/data.ts:94-99`). The new engine either *supersedes* it (migrate curation rows into `deals` with `creator_partner_id IS NULL`) or *feeds beside* it; recommended: supersede, one deal model (BUILD-PLAN V3-35). (c) Dispatch stays out of scope (V3-48/V3-61 own send) — and any dispatch language now means the **Postmark** rail + canonical `evaluateSuppression`, whose known divergence (hub/staff campaign loops skip `transactional_only` scopes — FIRE STAFF-6 pattern, `apps/staff/lib/newsletter/service.ts:924-946`) is **P0 pre-work** before any Phase E-adjacent campaign send. (d) Money boundary unchanged and load-bearing: a deal is an offer artifact; any discount reaching checkout is applied by the behavior-locked payment surface as an idempotent ledger-true line item. `fixed_off` amounts are integer minor units + ISO currency — matching the multi-currency ledger posture (`20260706120000_v3_money_mc_multicurrency_ledger.sql`).

### 4.3 V3-38 local availability — prompt is sound; smallest deltas

The address spine ground truth holds exactly as written (`user_addresses`, `packages/address-selector`). Deltas: the availability resolver module lands in `packages/intelligence` as specified; coverage tables under `apps/hub/supabase/migrations/`; the resolver's IP-geo fallback is **coarse + advisory only** (never gates a paid action) and its use is disclosed under the privacy notice — address-keyed availability resolution runs on legitimate interest, while geography used as a *profiling signal* (V3-35/36) is consent-gated (the geo split defined in PRIVACY-NDPR §1); telemetry events register in `HenryEventNames` and persist via `persistEvent` only where a durable row is needed (the `unavailable_shown` coverage-gap signal is worth persisting; per-render badge resolution is not — emit-only).

### 4.4 V3-39 smart next action — the stitch layer

Prompt is well-grounded (`nextAccountSteps` exists as described). Re-groundings: (a) the per-page resolver **delegates recommendable sets to V3-36 when present** and falls back deterministically — as written; (b) the opt-out preference row lands on **`customer_preferences`** (own-row RLS, the canonical prefs table — `supabase/prod-actual/schema.sql:2883-2919`) and the account preferences API's `ALLOWED_FIELDS` allowlist is extended (`apps/account/app/api/preferences/update/route.ts:7-16`); (c) `next_action_dismissals` migration under `apps/hub/…`; (d) the floating chip must not collide with the `IntelligenceLauncher` now mounted bottom-right in 9 layouts (`apps/account/app/layout.tsx:112` et al.) — one shared host arbitrates chrome affordances.

## 5. The predictive projection — fraud, quality, dashboards

### 5.1 Doctrine

Predictions are **staff/owner-facing projections, never customer-facing labels**. All three passes keep the prompts' hard lines: advisory-first, staff override always, shadow-before-live, enforcement gates sit **in front of** `@henryco/payment-surface` never inside it, and the scored party never sees their score (tables are staff/service-role RLS only).

### 5.2 How predictive AI honors money-grade billing (the E-D1 frame)

The gateway's billing model is two-class today (`packages/ai-gateway/src/surfaces.ts:3-4`): **METERED** (customer-invoked business/personal tasks; wallet reserve→settle→VAT through `payments_private`) and **FREE** (company-critical; no wallet interaction; daily-allowance rate limits + the free-spend budget). Predictive scoring introduces a third situation: **platform-invoked** work the customer never asked for. The rules:

1. **A platform-invoked prediction call NEVER debits a customer wallet.** There is no consent-to-pay; billing one would violate the pre-paid, user-confirmed model the rate card is built on.
2. **It still goes through the gateway** — same doctrine, opacity, caps, telemetry (`audit` option ON so every call lands in `henry_events` — note the free customer chat currently runs without it; predictive surfaces must not repeat that gap, `apps/account/app/api/intelligence/chat/route.ts:131-139`).
3. **Its cost is metered as company spend**: registered as non-billable surfaces (e.g. `risk.entity.assist`, `predictive.narrative` — final keys at build time) with `freeAllowancePerDay` + a **dedicated internal daily budget** generalizing the `ai_free_spend_ledger` pattern (`20260705150000`) — a per-day provider-cost counter with a hard ceiling, so a runaway batch can never burn unbounded provider spend. Company absorbs the cost as COGS (the chart already carries `ai_provider_cost` / `provider_payable` accounts from V3-AI-01) — visible in the books, invisible to customers.
4. **Customer-facing trust reviews stay metered.** The registry already prices `*.listing.verify` / `jobs.posting.verify` / `learn.course.verify` (deep tier, billable) — those are user-confirmed purchases and inherit the full metered rail. V3-40 does not replace them; it consumes their verdicts as features where present.
5. **LLM features are advisory**: they may raise a score or write the staff-facing rationale; a `freeze` tier never rests on an LLM call alone; forecasts (V3-41) are statistical with LLM confined to optional narrative.

The owner ratifies the cost posture in **E-D1** (recommended: deterministic core now, LLM-assisted features behind a flag with the internal budget).

### 5.3 V3-40 fraud & risk — compose, don't duplicate

Prompt architecture stands (three tables — `model_versions`, `risk_scores`, `risk_enforcement_log`; scoring service in `packages/intelligence/src/risk/`; 4-tier enforcement; ≥30-day shadow; staff queue at `apps/staff/app/(workspace)/risk/`). Re-groundings:

- **Compose with the watchtower threat engine** (PR #501 `b0c5d5bf`): it already detects sign-in/audit threats for the owner desk. Its detections become **input signals** to `scoreEntity` for `account` entities; V3-40 adds the persisted, versioned, entity-generic score + enforcement machine that watchtower deliberately does not have. One threat vocabulary; two consumers (owner desk, risk queue).
- **The eight deterministic `RiskSignalType`s** in `packages/intelligence` remain the rules floor, as the prompt says; `@henryco/trust` supplies content signals.
- **"V3-26 router" → gateway internal surface** per §5.2; model lifecycle config (`model_versions.config`) must never carry a provider/model name into any client-bound payload — reuse `assertClientSafe`.
- **Fix the prompt's SQL sketch artifact:** `references_model_version` (v3-40 prompt line 52) is a placeholder — the real migration enforces the FK by `(model_kind, version)` composite reference.
- **Data reality check:** several entity domains are pre-data (e.g. hiring `employer_landscape` was all-zeros in FIRE-JOBS). The shadow window's validation report must state per-entity-type sample sizes; go-live can be ratified per entity type, not all-or-nothing.
- **Enforcement composes with `requireSensitiveAction`** (V3-02) in front of sensitive routes; money invariants per Prime Directives (a held transaction never silently completes; idempotency untouched).

### 5.4 V3-41 quality & workload — statistical, unchanged in spirit

Prompt stands nearly verbatim (transparent seasonal/EWMA forecaster; at-risk detector; dispute scorer; three staff-RLS tables; panels on existing staff modules). Re-groundings: gateway naming per §5.2 (narrative only); back-test honesty — live volumes are modest (support threads ~100s, orders ~40 groups), so back-tests report absolute sample sizes and the "recommended agents" figure stays owner-ratified after shadow, exactly as the prompt's deployment gate says; the queue keys align with the real `(workspace)` modules on main.

### 5.5 V3-42 staff dashboards — read-only instrument

Depends only on V3-40 + V3-41 output tables. Prompt stands (shared `<PredictiveDashboard>` primitive; z-score/MAD anomaly detector; recommendation cards accept/dismiss/snooze in `staff_recommendation_state`; drill-down through queue-shell with per-role RLS matrix proven). One addition: the drill-down RLS matrix test doubles as a Phase E **no-cross-leak** regression fixture (§7).

## 6. The recovery projection — abandoned tasks (V3-37 shipped; the remaining arcs)

V3-37 is **DONE+APPLIED (caveat)** — the design doc (`docs/v3/2026-06-10-v3-37-abandoned-recovery-design.md`) shipped as PR #265: server detector (lifecycle collector → `deriveRecoveryTasksFromSnapshot` → `captureAbandonedTask`), pure day-1/3/7/14 cadence, 6-hourly sweep (in-app nudge via `publishNotification`, eventType `account.recovery.reminder`, deep link `/continue`), owner-RLS table, claim bridge on login, dashboard widgets, kill switch `RECOVERY_CADENCE_ENABLED`. What Phase E still owes, in priority order:

| Arc | Ground truth | Work |
|---|---|---|
| **R1 — Activate the table** | `v3_37_abandoned_tasks` migration committed-NOT-applied; every consumer is best-effort so the feature silently no-ops on prod | Owner decision **E-D4**: apply (low risk — owner-RLS, service-role writes only, RLS proof script exists at `scripts/v3/prove-abandoned-tasks-rls.sql`) |
| **R2 — Layer B: promote client drafts** | `detectFromDraftEnvelope` (the 24h-stale-draft → `form_draft` task builder) has **zero callers**; drafts are per-origin localStorage (marketplace-checkout, studio-brief/copilot, property viewing/inquiry, account support/profile) — cross-device resume impossible | Wire the promotion server action into the highest-value flows; studio copilot conversations additionally deserve durable storage (the `intelligence_conversations` store exists — reconcile rather than keep a 30-convo localStorage cap) |
| **R3 — Anonymous capture** | `claim_token/claim_email/claim_phone` columns + login reconciler exist; **no producer** | Ship the public-flow capture action for studio `/request`, care `/book`, logistics `/quote` (the design doc's own exemplar list), per the owner's "only once identified" decision |
| **R4 — Real channels** | Email/push are dispatch **intents only** (`recovery-sweep/route.ts:115-124`, "→ V3-45/48"); the only live recovery emails are marketplace `abandoned_cart` (18h idle, hourly cron) and care payment reminders — each on its own per-division queue; there is **no generic notification_queue** | Keep the seam: V3-45/48 (Phase F) own multi-channel send on Postmark; Phase E does **not** build a send rail (owner decision E-D5). Marketplace's existing automation keeps running; when V3-45 lands it consumes `user_engagement_events` (its designed, never-used consumer columns) |
| **R5 — Close the biggest state-loss holes** | Jobs apply form: NO draft anywhere (single-step server-action form); care `BookPickupForm`: 2,065 lines, ~25 useState fields, no persistence; learn in-progress quiz: nothing until submit; no pending `payment_intents` sweep | Add `useFormDraft` to jobs apply + care booking (client Layer B, then R2 promotes); learn quiz draft optional; a pending-intent sweep is money-adjacent — design under V3-41's dispute/stall detection, execute with finance review |
| **R6 — Reconcile the two engines** | `@henryco/interactions` abandonment-recovery (SP1 showcase: consent-gated, ≥20s idle, 7-day cap) has zero app wiring — a second philosophy beside V3-37's server cadence | V3-37's server spine remains canonical for *recovery*; the interactions engine is the *in-session* nudge layer and mounts only per its own consent gate — or is explicitly retired. Decide in the pass, don't leave both dormant |
| **R7 — Precision** | `derive.ts` maps learn → task_type `'cart'` (semantic bug in copy fallbacks); coarse pillars deep-link to hub/list pages rather than the exact step | Rename/extend task types; use the typed deep-link builders (`packages/seo/src/deeplinks/builders.ts`) for record-precise `continue_url`s |

## 7. Cross-division connectedness — and the wall between users

The fabric connects **divisions**, never **users**:

- **One vocabulary.** `RecommendationReasonCode`, `AbandonedTaskType`, availability scopes, risk tiers — all defined once in shared packages (`@henryco/intelligence`, `@henryco/data`) and reused by every division surface. Cross-division bridges (care→jobs, learn→employer-roles, purchase→logistics, property→logistics) are data (`cross-pollination.ts` mapping) not bespoke code paths.
- **One surface system.** Every customer surface is Register-L on `@henryco/dashboard-shell` primitives (home widgets, chips, panels); staff surfaces ride `dashboard-modules-staff` shells. Note the open token gap: ~90 no-fallback `var(--acct-*)` reads in shell code are undefined in care/jobs/logistics/staff/studio (slice B2, `docs/superpowers/specs/2026-07-10-redesign-final-token-consolidation.md:72-78`) — new Phase E surfaces on those apps inherit it; the fix precedes or accompanies mounting there. learn/property don't declare the shell dependency yet.
- **One wall.** The FIRE lesson as architecture: personalization reads run through viewer-scoped readers *only*; candidate generation is RLS-respecting; every new reader ships a cross-user leak test (fixture user A must never receive user B's rows); the CI suite grows a `personalization-leak` job mirroring the payments-grant-invariant pattern (rebuild schema, probe as two users, assert zero cross-reads). The two live violations in `@henryco/data` (README ledger #9) are **P0** — fixed and regression-tested before any Phase E pass widens those aggregates.

## 8. Delivery posture

- **Flags:** Phase E uses the governed `parseHenryFeatureFlags` family (`packages/intelligence/src/index.ts:333-359`) — `intelligence_recommendations` (already registered) gates V3-36; net-new flags (`personalization_home`, `predictive_shadow`, …) join the same family. The raw `NEXT_PUBLIC_*_LIVE === "1"` style is not extended.
- **Migrations:** per-app, canonically `apps/hub/supabase/migrations/`; every new table ships RLS + explicit grants in the same file; regenerate `packages/data/src/database.types.ts` via the SCHEMA-TRUTH-01 shadow-db flow (`scripts/db/build-shadow-db.mjs` / Supabase CLI `gen types` — no `pnpm supabase:types` script exists despite the prompts naming one), schema-drift guard green. Money-adjacent tables copy the V3-AI-01 lockdown pattern (RLS default-deny + grant strips + guarded-RPC-only writes) — `20260627120000_v3_ai_01_metered_billing.sql:96-120` is the template.
- **Telemetry:** every pass registers its `henry.*` names in `HenryEventNames`; durable rows via `persistEvent` only where a read path exists (owner tiles/dashboards) — no write-amplification for signals nobody reads (the per-render `module.rendered` insert is the cautionary example).
- **i18n / brand / a11y:** per the Register-L recipe (`docs/v3/gaming/ARCHITECTURE.md:82`): typed copy modules per surface namespace, 12 locales, tokens-only styling, both themes, CLS ≈ 0, contrast green, `tone:check` clean.
- **CI:** docs-only PRs run the full pipeline (no paths filter — `.github/workflows/ci.yml:6-15`); build passes add the leak-test job and, where money is touched, extend the payments-grant-invariant chain.
