# Phase E — Personalization & Predictive (V3-34 → V3-42): the re-grounded blueprint

**Pass:** V3-E-DESIGN-01 · **Type:** Design / architecture only (no feature code, no migration) · **Risk class:** mixed (M where marked in the build plan) · **Status:** Draft for owner ratification · **Base:** `origin/main @ 47de2de2` (2026-07-16)

> This folder is the blueprint for **Phase E — Personalization & Predictive** (`docs/v3/PASS-REGISTER.md:148`, V3-34 → V3-42). The nine Phase E prompt files were last re-authored in one commit on **2026-06-03** (`df71b189`) — *before* the money spine finished activating, before the governed AI gateway existed, and before the FIRE audit series. This pass re-anchors every one of them to what is actually on `main` today, specifies the privacy/NDPR posture personalization must carry, orders the build, and surfaces the owner decisions. It introduces **no code and no migration**.

---

## Scope correction first

**Phase E is exactly V3-34 → V3-42.** V3-33 (ai-personal-task-gating) is a **Phase D** pass (`docs/v3/PROGRAM-STATUS-2026-06-21.md:102,104`) — and its substance already ships inside the gateway: `runAiTask` refuses anonymous callers before any wallet/provider work, rate-limits per surface per day, and persists a durable audit trail (`packages/ai-gateway/src/orchestrator.ts:93-97,138-160`; `src/server/index.ts:36-39,66-73`).

## What changed since the prompts were written (the re-grounding ledger)

The prompts are good — they were already grounded to early-June main (DASH Smart Home, `get_signal_feed`, the home-widget contract all pre-existed them). What they could not know:

| # | Reality on main today | Evidence | Consequence for Phase E |
|---|---|---|---|
| 1 | **The governed AI gateway exists.** "V3-26 (ai-provider-router)" was delivered as `@henryco/ai-gateway` — 19-surface registry, tiered models (fast/standard/deep → Onyx Swift/Core/Prime), provider+model opacity enforced in four layers, orchestrator with reserve→dispatch→meter→settle | PR #352 `96e72bc2`; `packages/ai-gateway/src/surfaces.ts:58-244`; `src/server/config.ts:13-24`; `src/redaction.ts` | Every prompt line reading "V3-26 router" now means `@henryco/ai-gateway`. New AI-assisted personalization registers a *surface*, not a provider integration |
| 2 | **Metered AI billing is built AND applied to prod.** The three guarded RPCs (`reserve_wallet_for_ai_usage` / `post_ai_usage_charge` / `release_wallet_ai_hold`) + rate card v2026-07-03 are live; **D4 is closed** ("✅ RECONCILED (owner decision, 2026-07-03)") | `apps/hub/supabase/migrations/20260627120000_v3_ai_01_metered_billing.sql`; `packages/pricing/src/ai-usage.ts:165-179`; `docs/v3/ai/APPLY-v3-ai-01-metered-billing.md:1-3` | The MASTER-PLAN gate "Phase E waits on Phase D usage billing (V3-27)" (`docs/v3/MASTER-PLAN.md:178`) is **satisfied**. Phase E can start |
| 3 | **A free-AI economic guardrail exists.** Daily provider-cost budget (`FREE_AI_DAILY_BUDGET_KOBO`, default ₦5,000/day) with allow/conserve/exhausted degradation, backed by a durable `ai_free_spend_ledger` | `packages/ai-gateway/src/free-budget.ts:17-52`; `apps/hub/supabase/migrations/20260705150000_ai_free_spend_ledger.sql` | The pattern Phase E generalizes for **platform-invoked** predictive AI spend (owner decision E-D1) |
| 4 | **V3-37 already shipped.** Abandoned-task recovery is DONE (PR #265 `506be4db`): `abandoned_tasks` DDL, day-1/3/7/14 cadence, 6-hourly sweep cron, `/continue` page, claim bridge, dashboard widgets | `docs/v3/PROGRAM-STATUS-2026-06-21.md:111`; `apps/hub/supabase/migrations/20260610120000_v3_37_abandoned_tasks.sql`; `apps/account/app/api/cron/recovery-sweep/route.ts` | V3-37 becomes a **residual-activation item**, not a build pass. Its migration is committed-NOT-applied on prod — decision E-D4 |
| 5 | **A deterministic threat engine now ships** (owner security watchtower): real sign-in/audit threat detection feeding the founder command desk | PR #501 `b0c5d5bf` | V3-40 must **compose with** it, not duplicate account-threat detection |
| 6 | **The intelligence chat layer is live-coded** (flag-dark): `intelligence_conversations`/`intelligence_messages`, ownership-checked persistence (the #389 IDOR fix is on main, commit `079695b7`) | `apps/account/lib/intelligence/persist.ts:107-145`; `apps/hub/supabase/migrations/20260704120000_intelligence_live_conversations.sql` | The IDOR-lesson ("verify ownership before writing a client-supplied id") is a standing Phase E invariant |
| 7 | **The email rail is Postmark now**, not SES/Brevo | PR #500 `67488320` | V3-35/37/45/48 dispatch language must point at the current adapter, not Brevo |
| 8 | **Migrations live per-app**, canonically `apps/hub/supabase/migrations/` — there is **no root `supabase/migrations/`** | reader-verified; root `supabase/` holds only `prod-actual/` snapshots | V3-34/V3-35 prompt file-paths (`supabase/migrations/<ts>_…`) are corrected in the build plan |
| 9 | **Live cross-user leaks exist in the read surface Phase E builds on** (FIRE-class): `inbox-aggregate` reads `studio_project_messages` and `calendar-aggregate` reads `studio_project_milestones` with **no viewer filter** | `packages/data/src/inbox-aggregate.ts:176-189` vs its own contract at `:27-28`; `packages/data/src/calendar-aggregate.ts:150-157` vs `:18` | **P0 pre-work.** Personalization must not widen a read surface that already leaks — see [PRIVACY-NDPR.md](./PRIVACY-NDPR.md) §5 and BUILD-PLAN P0 |
| 10 | **A consent category for personalization already exists — and is dead.** The shipped 5-category consent state includes `personalizedExperience`, but no helper reads it and nothing consumes it; consent is device-scoped only | `packages/ui/src/public/consent-state.ts:9-25,130-136` | Phase E wires it instead of inventing a new model — owner decision E-D2 |
| 11 | **Much personalization raw material is built-but-orphaned**: `RecommendationRail` (0 importers), `WelcomeBackSurface` (0 importers), `getRecentlyViewed` (0 callers), learn's `recommended` field (0 consumers), `recently_viewed_items` + `marketplace_recently_viewed` tables (write helper `trackRecentlyViewed` exists with 0 callers — no *wired* write path), `marketplace_recommendation_signals` + hourly recompute cron (applied, unread by any UI) | `apps/marketplace/components/marketplace/recommendation-rail.tsx`; `apps/account/components/saved-items/WelcomeBackSurface.tsx`; `apps/account/lib/account-data.ts:481-506`; `apps/marketplace/lib/marketplace/automation.ts:407-415` | Phase E **wires or retires** each — it does not rebuild them |
| 12 | **The signal reality is narrower than the event vocabulary.** Only **10** of ~150 typed `HenryEventName`s are ever persisted to `henry_events`; the real behavior spine is `customer_activity` (30+ direct insert sites, more via wrappers, across every division) + `get_signal_feed` + `user_engagement_events` (producer-only, zero consumers) | `packages/observability/src/persist-event.ts`; reader census; `apps/account/app/api/cron/engagement-sweep/route.ts:1-14` | Ranking designs must feed on what is actually queryable — see ARCHITECTURE §2 |

## Read in this order

| # | Doc | What it answers |
|---|-----|-----------------|
| 1 | **[README.md](./README.md)** (this) | Orientation + the re-grounding ledger. Read first. |
| 2 | **[ARCHITECTURE.md](./ARCHITECTURE.md)** | The one personalization fabric: signal sources → deterministic ranking floor → governed-AI enhancement → Register-L surfaces; the predictive layer (fraud/quality) and how platform-invoked AI honors money-grade billing; abandoned-task recovery's remaining arcs; how it all connects division-to-division. |
| 3 | **[PRIVACY-NDPR.md](./PRIVACY-NDPR.md)** | Lawful bases per feature (NDPA 2023), the consent model (wiring `personalizedExperience`, account-scoped persistence, consent ledger), minimization/retention, opt-outs, and the **no-cross-leak invariant** as testable rules. |
| 4 | **[BUILD-PLAN.md](./BUILD-PLAN.md)** | P0 pre-work + the re-grounded ordered plan for V3-34…V3-42: per pass, what it builds, real deps, risk class (M = money/AI-billing), gates, and parallel-safety. |
| 5 | **[OWNER-DECISIONS.md](./OWNER-DECISIONS.md)** | E-D1 predictive-AI cost model · E-D2 personalization consent model · E-D3 fraud approach · E-D4 `abandoned_tasks` apply · E-D5 recovery channels — options framed with recommended defaults. |

## The real anchors (pinned to `origin/main @ 47de2de2`)

| Anchor | Where | Role in Phase E |
|---|---|---|
| Cross-division read surface | `packages/data` (`@henryco/data`) — server-only barrel over a service-role client + app-layer viewer filters; one SQL RPC `get_signal_feed` (SECURITY DEFINER, auth.uid() IDOR guard) | The mining substrate for every recommender (`packages/data/src/index.ts:1-14`; `apps/hub/supabase/migrations/20260623090000_…signal_feed_guard.sql:147-156`) |
| Satellite readers | 15 `@henryco/dashboard-modules-*` packages, most with their own `data.ts` on `@henryco/data`'s admin client (building/hotel are hidden future modules with no data layer; owner/staff use per-module subdirectories) | Division-commerce reads (orders/bookings/courses/projects) live here, **not** in `@henryco/data` core |
| Behavior signals | `customer_activity` (the spine), `henry_events` (10 persisted names), `user_engagement_events` (producer-only), `customer_lifecycle_snapshots` | ARCHITECTURE §2 |
| The personal home | account Smart Home (DASH-4): `apps/account/app/(account)/page.tsx` + 13-module registry + `rankNextBestActions` floor + `intelligence_recommendations` supersede flag (`apps/account/lib/smart-home/recommender.ts:55-60`) | V3-34 layers layout persistence *on top*; V3-36's engine lands *behind the reserved flag* |
| Governed AI | `@henryco/ai-gateway` — surface registry, billing port, free-budget, doctrine, redaction | Every Phase E AI call, customer-billed or platform-absorbed, goes through it |
| Money spine | Double-entry ledger + `payments_private` RPCs + VAT engine + wallet; `post_ai_usage_charge` is the canonical worked example of a new charge type | `apps/hub/supabase/migrations/20260607120000_double_entry_ledger.sql`; `20260627120000_v3_ai_01_metered_billing.sql:213-335` |
| Consent + legal | 5-category consent state (`personalizedExperience` dead-signal), `customer_preferences` (own-row RLS), `packages/config/legal.ts` (NDPA registry), `evaluateSuppression` | PRIVACY-NDPR.md |
| Recovery spine | `abandoned_tasks` + cadence + sweep + `/continue` + claim bridge (V3-37, shipped; migration committed-NOT-applied) | ARCHITECTURE §6 |
| Register-L | The light-primary customer surface register — `docs/v3/gaming/ARCHITECTURE.md:77-82` (no single normative doc exists; `docs/v3/inner-surfaces-map.md` is cited by the AI docs but absent from main) | Every new Phase E customer surface follows its recipe |
| Delivery conventions | Flag-dark via the governed `parseHenryFeatureFlags` family (`intelligence_recommendations` already registered); design-PR convention `docs(<area>): <PASS-ID> — … (design only)` | BUILD-PLAN §Delivery |

## Prime Directives (inherited, unmodified)

The nine money/AI Prime Directives in `docs/v3/ai/README.md:112-122` bind every Phase E pass that touches AI or money — kobo-integer money; money moves only through guarded `payments_private` RPCs; balanced append-only ledger; idempotent billed calls; pre-paid gating; provider+model opacity; brand + voice; Register-L for customer surfaces; never touch `search-ui`, the payment-router providers, the money RPCs, or `payments_private` behavior (new work **adds** a posting path alongside).

Phase E adds three directives of its own (specified in [PRIVACY-NDPR.md](./PRIVACY-NDPR.md) and [ARCHITECTURE.md](./ARCHITECTURE.md)):

10. **No cross-leak, ever.** Personalization never surfaces one user's data on another user's surface. Every reader is viewer-filtered; every candidate generation is RLS-respecting ("the engine never recommends an item the viewer could not read directly"); leak tests are CI-graded. The two known violations (re-grounding ledger #9) are fixed **before** any Phase E surface widens those readers.
11. **Scores are server-only.** Relevance scores, risk scores, confidence values never serialize to a client. Clients receive ordered items + localized reason codes. The scored party never sees a prediction about themselves.
12. **Consent before profiling.** Cross-division recommendation profiling, geography used as a profiling signal, and recovery outreach honor the personalization consent gate and the canonical suppression engine (`evaluateSuppression`) — per the model the owner ratifies in E-D2. (Address-keyed availability resolution itself runs on legitimate interest — the geo split is defined once in PRIVACY-NDPR §1.)

## Provenance

Every claim in this folder was derived against `origin/main @ 47de2de2` in a clean worktree — never a stale branch (the lesson recorded in `docs/v3/ai/README.md:126-128`). Line numbers drift; symbols outrank line numbers — re-verify against the current base before building. Prod-applied statements are **doc claims** where marked (this pass could not probe prod): the in-repo prod snapshot (`supabase/prod-actual/schema.sql`) was last committed **2026-06-13** (`ab30e9f8`) and predates the ledger apply, the AI billing apply, and everything after.

**Scope boundary: documentation only.** This pass changes no runtime behavior, applies no migration, flips no flag.
