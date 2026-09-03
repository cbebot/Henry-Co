# Phase E Build Plan — V3-34 → V3-42, re-grounded and ordered

**Pass:** V3-E-DESIGN-01 · **Type:** Design / architecture only (no feature code, no migration) · **Risk class:** mixed (per-pass below) · **Status:** Draft for owner ratification · **Base:** `origin/main @ 47de2de2` (2026-07-16)

> Legend — **Risk:** M (money/AI-billing-touching) · I (identity) · C (compliance) · N (net-new, none of those). **Size:** S/M/L/XL (register estimates, adjusted where re-grounding shrank the work). **Gate:** what must be true to start. Each pass keeps its prompt file as the contract; the *Re-grounding* list is the delta the builder applies on top — the prompt + this plan together are the spec.

---

## 0. The gate is open

MASTER-PLAN's phase gate — "Phase E waits on Phase D usage billing (V3-27)" (`docs/v3/MASTER-PLAN.md:178`) — is **satisfied**: the governed gateway + metered billing are built (PR #352 `96e72bc2`) and the money migration + reconciled rate card are recorded as applied to prod 2026-07-03 (`docs/v3/ai/APPLY-v3-ai-01-metered-billing.md:1-3`; D4 "✅ RECONCILED" in `packages/pricing/src/ai-usage.ts:165-179`). Owner decisions **E-D1…E-D5** (OWNER-DECISIONS.md) are the only ratifications Phase E itself needs. Two are folded into P0 by design — **E-D4** (apply `abandoned_tasks`) is P0.3 and **E-D2** (consent model) is P0.4, so they gate Wave E.1; **E-D1/E-D3/E-D5** block nothing before Waves E.2/E.3. The P0 *fix-work* (P0.1, P0.2) starts decision-free, today.

## Dependency spine

```
P0 pre-work (leak fixes · suppression fix · E-D4 apply · consent wiring prep)
   │
   ├──► Wave E.1  V3-34  (foundation: layout persistence + consent gate wiring)
   │        │
   │        ├──► Wave E.2 (parallel fan-out; most consume the V3-34 home + consent gate —
   │        │       V3-38 is context-only, V3-37-R gates on P0.3/E-D5)
   │        │       V3-36 recs  ·  V3-35 deals  ·  V3-38 availability  ·  V3-39 next-action
   │        │       V3-37-R residual arcs (R2/R3/R5/R6/R7 — E-D4 unlocks R1 earlier)
   │        │
   ├──────► Wave E.3 (parallel with E.2 — does NOT depend on V3-34)
   │            V3-40 fraud+risk  ·  V3-41 quality+workload      [gates: E-D1, E-D3]
   │                       │
   └───────────────────────┴──► Wave E.4  V3-42 staff dashboards (reads 40+41 output)
```

This re-derives the register's parallelism ("V3-34 first, then fan out, V3-42 close" — `PASS-REGISTER.md:283`; waves E.1–E.4 in `MASTER-PLAN.md:87-92`) with one correction the register already implies: **V3-40/41 depend on the AI layer, not on V3-34** (their register deps are V3-26 only) — so the predictive wave can start alongside the personalization fan-out, staffed independently.

---

## P0 — Pre-work (blocking; small; not register passes)

| Item | What | Why it blocks | Evidence |
|---|---|---|---|
| **P0.1 Leak fixes** | Add viewer filters to `inbox-aggregate` (studio_project_messages) and `calendar-aggregate` (studio_project_milestones) + cross-user regression tests | Phase E widens these read surfaces; Prime Directive 10; both violate their own written contracts today | `packages/data/src/inbox-aggregate.ts:176-189` vs `:27-28`; `calendar-aggregate.ts:150-157` vs `:18` |
| **P0.2 Suppression fix** | Route hub/staff campaign-send + `isEmailSuppressed` through canonical `evaluateSuppression` (the `transactional_only` skip) | Any personalized outbound (V3-35 campaigns, V3-37 emails via V3-45/48) must honor opt-down; FIRE STAFF-6 pattern still on main | `apps/staff/lib/newsletter/service.ts:924-946`; `apps/hub/lib/newsletter/service.ts:150-168`; canonical `packages/newsletter/src/suppression.ts:47-49` |
| **P0.3 E-D4 apply** | Owner ratifies + applies `v3_37_abandoned_tasks` (+ its notification-category migration) to prod — dry-run-first, RLS proof script exists | The shipped recovery feature is silently inert on prod without it; every Wave E.2 continue/recovery surface builds on it | `docs/v3/PROGRAM-STATUS-2026-06-21.md:111,401`; `scripts/v3/prove-abandoned-tasks-rls.sql` |
| **P0.4 Consent decision** | Owner ratifies **E-D2** (consent model) so V3-34 can wire the gate | The gate's semantics (what degrades when off) shape every fan-out surface | PRIVACY-NDPR §1–2 |

P0.1/P0.2 are ordinary fix-PRs (no migration). P0.3 is an apply, not a build. None needs a prompt file.

---

## Wave E.1 — V3-34 personalization-home (foundation)

**Builds:** `user_home_layouts` + pure `computeHomeLayout` projection + `/customize` UI + Smart Home consumption + telemetry + **the personalization consent wiring** (helper, `customer_preferences.personalization_enabled`, `personalization_consent_events` — PRIVACY-NDPR §2, folded in here so the gate exists before any consumer).
**Size:** L · **Risk:** N (+C for the consent slice) · **Parallel-safe:** No (foundation).
**Gates:** P0 complete; E-D2 ratified.

**Re-grounding deltas to the prompt:**
1. Migration path → `apps/hub/supabase/migrations/<ts>_v3_34_user_home_layouts.sql` (no root `supabase/migrations/` exists).
2. **S5 scope-cut:** first slice personalizes the **account** surface only. Owner/staff home projection is a follow-on slice — `@henryco/data` owner/staff summaries are zero stubs (`packages/data/src/dashboard-summary.ts:167-189`) and hub/staff still run legacy readers; do not gate the Phase E foundation on back-filling them.
3. Kill switch joins the governed flag family (`parseHenryFeatureFlags`), e.g. `personalization_home` — not a bespoke env string.
4. "V3-26 available for later signal enrichment" → the gateway exists; **no AI in this pass** (unchanged intent, real name).
5. `signalScores` derivation from `getSignalFeed` grouped by source — confirmed real; the home-widget contract (`packages/dashboard-shell/src/home-widget.ts`) and module registry are exactly as the prompt describes. The prompt's audit summary is accurate — build against it.

**Unblocks:** all of Wave E.2.

## Wave E.2 — personalization fan-out (parallel after V3-34)

### V3-36 cross-division recommendations
**Size:** L · **Risk:** **M-lite** (platform-absorbed AI spend via the gateway — no customer billing) + C (profiling consent) · **Parallel-safe:** Yes.
**Gates:** V3-34 (home slot + consent gate); E-D1 (for the AI re-rank slice — the deterministic engine needs no gate).
**Re-grounding deltas:**
1. "`@henryco/ai-router` or equivalent" → **`@henryco/ai-gateway`**; the re-rank registers a new **internal, non-billable** surface (ARCHITECTURE §5.2): `billable:false`, fast tier, `freeAllowancePerDay`, audit ON, inside the internal daily spend budget.
2. The engine lands **behind the reserved `intelligence_recommendations` flag** and supersedes `rankNextBestActions` as its own comment plans (`apps/account/lib/smart-home/recommender.ts:55-60`).
3. Marketplace domain recommender reads **`marketplace_recommendation_signals`** (applied + hourly recompute) — replaces the prompt's "V3-52 TODO" fallback.
4. Jobs/property domain recommenders **wrap the shipped ones** (`apps/jobs/lib/jobs/data.ts:553-604`; property public-home recs) into the shared reason-code vocabulary.
5. **Wire-or-retire in-pass:** `RecommendationRail`, `WelcomeBackSurface`, `getRecentlyViewed`, learn `recommended` field; and wire the existing `trackRecentlyViewed` helper (`packages/cart-saved-items/server/index.ts:277-302`, zero callers today) into the item-view surfaces (S0 slice) so recently-viewed becomes a real signal — no new write path needed.
6. Consent: profiled output only when `consentAllowsPersonalized`; deterministic division-local defaults otherwise.
7. Candidate readers are **injected** (`@henryco/data` core + dashboard-modules satellites) — the engine gets no table access of its own; leak tests per PRIVACY-NDPR §5.3.

### V3-35 deals & campaigns
**Size:** L · **Risk:** N with an **M boundary note** (offer artifacts only; `fixed_off` in integer minor units + ISO currency; any checkout application stays inside the locked payment surface — never built here) · **Parallel-safe:** Yes.
**Gates:** V3-34. Partner-authored deals stay inert until V3-50 (unchanged).
**Re-grounding deltas:**
1. Migration path → `apps/hub/supabase/migrations/`.
2. **Reconcile with `marketplace_deals_curation`** (applied; staff-curated; read by the marketplace module) — recommended: migrate curation rows into the new `deals` model as owner/staff campaigns and retire the old read, so the ecosystem has **one** deal model.
3. Dispatch references (the prompt names Brevo) → the platform email rail is **Postmark** (PR #500); V3-35 still emits eligibility only — V3-48/V3-61 own send; P0.2 must be done before any campaign send ships.
4. Approval workflow reuses the applied V3-25 moderation framework (it shipped: `docs/v3/PROGRAM-STATUS-2026-06-21.md:87`) rather than the prompt's "if shipped" hedge.
5. Fairness audit + diversity guard unchanged (good design); impressions insert service-role with a write-amplification budget (batch, not per-render-row).

### V3-38 local availability
**Size:** M · **Risk:** N · **Parallel-safe:** Yes.
**Gates:** V3-34 (context only — could start earlier if staffing allows; its true deps are the address spine, which shipped in V2).
**Re-grounding deltas:** migration path; resolver in `packages/intelligence` as written; IP-geo coarse/advisory + disclosed (PRIVACY-NDPR §1); persist only the coverage-gap telemetry (`unavailable_shown`), emit-only for per-render resolution; seed `service_area_coverage` from real division coverage before enabling badges (a flood of `unavailable_shown` means missing rows, not a broken resolver — the prompt's own soak note, kept).

### V3-39 smart next action
**Size:** M · **Risk:** N · **Parallel-safe:** Yes.
**Gates:** V3-34; consumes V3-36's sets when present (graceful deterministic fallback — unchanged).
**Re-grounding deltas:** opt-out lands on `customer_preferences` + `ALLOWED_FIELDS` extension (the prompt's own "check `packages/notifications` before adding a table" resolves to: extend the existing row); `next_action_dismissals` migration under `apps/hub/…`; chip host must arbitrate with the `IntelligenceLauncher` mounted bottom-right in 9 layouts (`apps/account/app/layout.tsx:112` et al.) — one chrome-affordance host, no overlap; stitch events distinct (`henry.next_action.stitched`) for cross-division lift measurement (unchanged).

### V3-37-R recovery residuals (not a fresh pass — activation + arcs)
**Size:** M (sum of arcs) · **Risk:** N (R5's pending-intent sweep is M-adjacent — design only, execute with finance review) · **Parallel-safe:** Yes.
**Gates:** P0.3 (table applied) for anything server-persisted; E-D5 for channels.
**Work (ARCHITECTURE §6):** R2 wire `detectFromDraftEnvelope` promotion (zero callers today); R3 anonymous-capture producer for studio `/request`, care `/book`, logistics `/quote`; R5 client drafts for the two biggest state-loss holes (jobs apply form — no draft at all; care `BookPickupForm` — 2,065 lines, no persistence); R6 reconcile/retire the dormant `@henryco/interactions` engine; R7 fix learn→`'cart'` task-type mapping + record-precise deep links via `packages/seo/src/deeplinks/builders.ts`. R4 (real email/push channels) stays **out** — V3-45/48 (Phase F) own it; `user_engagement_events` consumers arrive there.

## Wave E.3 — predictive (parallel with E.2; independent of V3-34)

### V3-40 predictive fraud & risk
**Size:** XL · **Risk:** **M + I + C** (enforcement sits in front of money flows; identity-adjacent; AML control surface) · **Parallel-safe:** Yes (with E.2).
**Gates:** **E-D1** (cost model) + **E-D3** (approach) ratified; compliance/AML review before go-live (unchanged); ≥30-day shadow before any enforcement (unchanged); go-live ratifiable **per entity type** (new — data volumes differ wildly).
**Re-grounding deltas:**
1. "V3-26 router" → gateway **internal non-billable surface** for any LLM-assisted feature (ARCHITECTURE §5.2); audit option ON; freeze never rests on an LLM alone (retained).
2. **Compose with the watchtower threat engine** (PR #501 `b0c5d5bf`): its sign-in/audit detections become `scoreEntity` input signals for `account` entities; V3-40 adds the versioned score + enforcement machine. No duplicate account-threat rules.
3. Fix the prompt's SQL sketch: `references_model_version` placeholder → real composite FK on `(model_kind, version)`.
4. Money-adjacent tables copy the V3-AI-01 lockdown template (`20260627120000:96-120`): RLS default-deny, grant strips, staff-read policies where role-appropriate; extend the CI grant-invariant chain.
5. Enforcement composes with `requireSensitiveAction` in front of sensitive routes; Prime Directives absolute (a held/frozen transaction never completes silently, never double-charges, idempotency untouched).
6. Shadow-mode validation reports **per-entity-type sample sizes** (several domains are pre-data; honesty over ceremony).

### V3-41 predictive quality & workload
**Size:** L · **Risk:** N (M-lite only if the optional LLM narrative slice ships — behind E-D1) · **Parallel-safe:** Yes.
**Gates:** none beyond E-D1 for the narrative slice; 30-day shadow before staffing recommendations render as authoritative (unchanged).
**Re-grounding deltas:** gateway naming per §5.2 (narrative-only, internal surface, budget-capped); back-tests report absolute sample sizes given modest live volumes; three staff-RLS tables under `apps/hub/…`; queue keys verified against the real `(workspace)` modules at build time; feeds V3-47 (Phase F) as designed.

## Wave E.4 — close

### V3-42 predictive staff dashboards
**Size:** M · **Risk:** N (staff-only, read-only over 40/41 output) · **Parallel-safe:** Yes (within the wave).
**Gates:** V3-40 + V3-41 output tables populated (shadow data suffices — dashboards are exactly how the owner *reviews* shadow mode).
**Re-grounding deltas:** none of substance — the prompt's audit of the staff shell substrate is accurate. Addition: the drill-down per-role RLS matrix doubles as the Phase E no-cross-leak regression fixture (PRIVACY-NDPR §5.3); recommendation cards never auto-act (retained; automation is V3-43/44/47).

---

## Cross-phase seams (kept clean, none built here)

| Seam | Owner pass | Phase E's obligation |
|---|---|---|
| Multi-channel send (recovery emails/push, deal campaigns) | V3-45 / V3-48 / V3-61 (Phase F/G) | Emit intents + eligibility; keep `user_engagement_events` consumer columns for them; Postmark + `evaluateSuppression` when they build |
| Partner model (`partners`, partner-authored deals) | V3-50 | `creator_partner_id` nullable forward-ref (unchanged from prompt) |
| Marketplace ranking depth | V3-52 | V3-36 already reads `marketplace_recommendation_signals`; V3-52 improves the *producer* |
| Deals/local-discovery product surfaces | V3-62 / V3-63 | Build on the V3-35 schema / V3-38 resolver respectively (register deps unchanged) |
| Event lake, retention, `actor_hash` | V3-90 / V3-92 | Phase E windows its reads + declares retention intents now; migrates onto the lake when it exists |
| A/B experimentation | V3-91 | Reason-code CTR telemetry is the input; no experiments framework built in Phase E |
| DSAR / deletion / consent ledger | V3-93 | Seams per PRIVACY-NDPR §2.3/§6 (consent events forward-compatible; export inventory extended) |

## Delivery conventions (every pass)

Branch `v3/<NN>-<slug>`; conventional commits; flag-dark via the governed flag family; migrations per-app with RLS+grants in-file, then regenerate `packages/data/src/database.types.ts` via the SCHEMA-TRUTH-01 shadow-db flow (`scripts/db/build-shadow-db.mjs` / Supabase CLI `gen types` — note: no `pnpm supabase:types` script exists despite the prompts naming one) + `pnpm schema-drift:check` green; typed i18n copy modules per surface namespace (12 locales); Register-L recipe for customer surfaces / staff-shell for operator surfaces; telemetry names registered in `HenryEventNames`; leak tests for every new reader; validation gates + `.codex-temp/<pass>/report.md` per the prompts' report contracts; design-only follow-ups use `docs(<area>): <PASS-ID> — … (design only)`.
