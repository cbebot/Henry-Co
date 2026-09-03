# V3-36 — Personalization & Predictive: Cross-Division Recommendations

**Pass ID:** V3-36  ·  **Phase:** E (Personalization & Predictive)  ·  **Pillar:** P3 (Personalization Engine)
**Dependencies:** V3-34 (Per-User Home), V3-26 (AI provider router)  ·  **Effort:** L  ·  **Parallel-safe:** Y
**Owner gate:** none  ·  **Risk class:** —

---

## Role

You are the V3 recommendations engineer for Henry Onyx. You execute exactly this one pass, then stop and report. This pass ships a **cross-division recommendation engine**: per-user candidate generation that suggests services, jobs, courses, properties, and marketplace items, blending a deterministic baseline with a V3-26 AI re-rank, and — critically — **explains every recommendation with a reason code**. The line you must not cross: the scoring formula and candidate set are **server-only and opaque** (ANTI-CLONE Principle 1); the client receives ordered cards + a localized reason, never the score or the formula. AI re-rank is an enhancement on a deterministic floor — if the AI router is unavailable, recommendations still generate from the deterministic baseline.

## Project

| Field | Value |
|---|---|
| Repo | `github.com/cbebot/Henry-Co` |
| Default branch | `main` |
| Working branch | `v3/36-personalization-cross-division-recommendations` |
| Deploy | Vercel |
| Backend | Supabase (project ref `rzkbgwuznmdxnnhmjazy`) |
| Package manager | pnpm 9.15.5 · Node 24.x |
| OS context | Windows + bash |

## Audit summary

The deterministic precedent already exists; the cross-division, explainable, AI-hybrid engine does not.

- `@henryco/intelligence` today is the **telemetry/analytics envelope** package (`henryEventNameSchema`, funnel keys, the `nextAccountSteps` deterministic next-step helper referenced in `index.ts`). There is **no `recommendations` module yet** — this pass creates `@henryco/intelligence/recommendations`.
- `@henryco/data` provides the cross-division readers this engine mines: `getCrossDivisionActivity` (reads `customer_activity` grouped by division), `getSignalFeed`, `dashboard-summary`, `inbox-aggregate`, `calendar-aggregate`. Saved items, bookings, enrollments, and inquiries are all reachable through these readers + their underlying tables.
- `@henryco/lifecycle` supplies the user's stage + selectors (`customer_lifecycle_snapshots`, `henry.lifecycle.*` events) — the lifecycle stage is a primary signal for recommendation relevance.
- V3-34 established the per-user home + `computeHomeLayout`; a recommendations module slots into that home via `@henryco/dashboard-shell` `getHomeWidgets`.
- V3-26 ships the vendor-agnostic AI provider router (`@henryco/ai-router` or equivalent) used for the optional re-rank + reason-code refinement.

**The gap this pass closes:** the platform has rich per-division activity but no engine that says "you booked Care → here is a relevant Job" or "you finished this Learn course → these employer roles match," and nothing surfaces *recommended* (not merely recent) services/jobs/courses/properties with an explainable reason. V3-36 ships the recommendation engine, five per-domain recommenders, cross-pollination signals, a dedicated recommendations surface, and a home module.

## Mandatory scope

### S1 — Recommendation engine core

New `packages/intelligence/src/recommendations/` exporting `generateRecommendations(viewer, opts): Promise<RecommendationSet>`:

```ts
export type RecommendationDomain = "services" | "jobs" | "courses" | "properties" | "marketplace";

export type RecommendationReasonCode =
  | "recent_division_use"
  | "saved_item_match"
  | "completed_course_pathway"
  | "lifecycle_stage_fit"
  | "location_match"
  | "budget_match"
  | "cross_division_bridge"      // e.g. Care booking → caregiver Job
  | "popular_in_segment";

export type Recommendation = {
  id: string;
  domain: RecommendationDomain;
  targetRef: string;             // listing/job/course/property/service id
  title: string;
  actionUrl: string;             // built via @henryco/config helpers, never hardcoded
  reason: RecommendationReasonCode;
  confidence: number;            // 0..1, SERVER-ONLY — never serialized to client
  generatedBy: "deterministic" | "ai_reranked";
};

export type RecommendationSet = {
  byDomain: Record<RecommendationDomain, ReadonlyArray<Omit<Recommendation, "confidence">>>;
  generatedAt: string;
};
```

Pipeline: (1) deterministic candidate generation per domain from `@henryco/data` readers + `@henryco/lifecycle` stage; (2) deterministic scoring → ordered baseline; (3) **optional** V3-26 AI re-rank that may reorder and sharpen reason codes — wrapped in a timeout + try/catch so failure falls back to the deterministic order; (4) strip `confidence` before returning to any client boundary. Every recommendation MUST carry a `reason`. Candidate generation respects RLS — the engine reads only what the viewer could read directly.

### S2 — Per-domain recommenders

Each a pure-ish module in `recommendations/domains/`:
- **Services (Care):** past bookings + location + budget band.
- **Jobs:** profile + skills + saved jobs.
- **Courses (Learn):** completed courses + employer-demand signals.
- **Properties:** saved items + neighborhood + budget.
- **Marketplace:** seeds from the V3-52 ranking output (if shipped) + cross-division signals; until V3-52 lands, a deterministic recency/category recommender with a clear TODO marker.

Each recommender is independently unit-tested with fixture viewers.

### S3 — Cross-pollination signals

A `recommendations/cross-pollination.ts` mapping table that bridges divisions and writes the bridge to `customer_activity` (or a dedicated `recommendation_signals` table) so the bridge is observable and reusable:
- "You booked Care → here is a Job for caregivers." (`cross_division_bridge`)
- "You completed a Learn course → these employer roles match."
- "You saved a Property → here is a relevant Logistics/moving service."
Bridges emit `henry.recommendation.generated` with the bridge reason and are logged for the fairness/quality review.

### S4 — Recommendation surface

- Dedicated full view `apps/account/app/(account)/recommendations/page.tsx` — grouped by domain, each card showing its localized reason.
- A home module (registered via `@henryco/dashboard-shell` `getHomeWidgets`) consuming the V3-34 personalization context.
- Per-division mini-recs in division mini-dashboards (top 1–3 per division).
Each rendered card logs an impression event; clicks/dismissals tracked.

### S5 — Telemetry + owner observability

Emit via `@henryco/intelligence`:
- `henry.recommendation.generated`
- `henry.recommendation.clicked`
- `henry.recommendation.dismissed`

Owner tiles: recommendations generated/day by domain, click-through by reason code, deterministic-vs-AI-reranked share, AI re-rank fallback rate (so the owner sees how often the AI path is degrading).

## Out of scope

- Deep **predictive job-match scoring** (learned model) — V3-41.
- **A/B testing** of recommendation variants — V3-91.
- The **deals** surface — V3-35 (a deal may *appear* in recommendations but deal authoring/fairness is V3-35).
- Geo "available in your area" badges — V3-38.
- Mutating the AI provider router itself — that is V3-26; this pass only consumes it.

## Dependencies

Depends on V3-34 (home module slot + personalization context) and V3-26 (AI provider router for the re-rank). Recommendations feed V3-39 (smart-next-action) and V3-59 (concierge guided assistant). Marketplace recommender quality improves once V3-52 ranking ships.

## Inheritance

- `@henryco/intelligence` (telemetry envelope; new `recommendations` module added here).
- `@henryco/data` — `getCrossDivisionActivity`, `getSignalFeed`, `dashboard-summary`, `inbox-aggregate`, `calendar-aggregate`, `createDataAdminClient`.
- `@henryco/lifecycle` — stage snapshots + selectors.
- V3-26 AI provider router (optional re-rank).
- `@henryco/dashboard-shell` (home-widget registry), `@henryco/config`, `@henryco/i18n`, `@henryco/ui`.

## Implementation requirements

### Files
- `packages/intelligence/src/recommendations/index.ts` + `engine.ts` + `domains/{services,jobs,courses,properties,marketplace}.ts` + `cross-pollination.ts` (new) + `__tests__/`
- `packages/intelligence/src/index.ts` (export recommendations surface)
- (optional) `supabase/migrations/<ts>_v3_36_recommendation_signals.sql` if a dedicated bridge table is used (RLS owner-scoped reads)
- `apps/account/app/(account)/recommendations/page.tsx` (new) + recommendation home module + division mini-recs
- Hub owner observability tiles (new)

### Trust / safety / compliance
Candidate generation respects RLS — the engine never recommends an item the viewer could not read directly. `confidence`/score is **server-only**, stripped at every client boundary. The AI re-rank is sandboxed: timeout + try/catch + deterministic fallback; the AI prompt never includes secrets and the call is metered/audited per V3-26/V3-27 if it touches the billed personal-task path (recommendation generation is a company-critical task — keep it on the free/internal path, not the metered personal-task path). Reason codes are mandatory and explainable.

### Mobile + desktop parity
Recommendations page + home module + mini-recs responsive. Same engine output consumed by the Expo super-app via `@henryco/data`/`@henryco/intelligence` — note the contract for V3-87; no native UI in this pass.

### i18n
Add typed copy module `packages/i18n/src/recommendations-copy.ts` (namespace `surface:recommendations`): section titles, every `RecommendationReasonCode` → localized human reason, empty/loading/error states, dismiss/refresh labels. Recommended-item titles (listing/job/course names) are dynamic → rendered via `translateSurfaceLabel`. Never "Per locale." — concretely: all static labels typed, all reason codes localized, all dynamic titles fall back through `translateSurfaceLabel`.

### Brand & design system
Recommendation cards use `@henryco/dashboard-shell` + `@henryco/ui` tokens (no ad-hoc hex), per-division accent from `company.ts`. Division names in copy from `@henryco/config` (`Henry Onyx <Division>`). All `actionUrl` values built via `getAccountUrl()` / `henryDomain(division)` / `henryWebRoot()` — zero hardcoded domains. Light + dark, mobile + desktop, CLS ≈ 0, `pnpm a11y:contrast` not regressed.

## Validation gates
1. `pnpm typecheck && pnpm lint && pnpm test && pnpm build` green.
2. Per-domain unit tests: each recommender generates valid, RLS-respecting recommendations from fixture viewers; every recommendation carries a reason code.
3. Reason-code coverage test: no recommendation may be returned without a `RecommendationReasonCode`.
4. Cross-pollination smoke: a fixture "Care booking" viewer receives a `cross_division_bridge` job recommendation; a "completed Learn course" viewer receives matching employer roles.
5. AI-fallback test: with the V3-26 router forced to error/timeout, recommendations still generate from the deterministic baseline (`generatedBy: "deterministic"`).
6. Confidence leak test: assert `confidence` is absent from every client-serialized payload.
7. Real-browser check on `/recommendations` + home module: light + dark, mobile + desktop, CLS ≈ 0, contrast pass.
8. Telemetry: all 3 events validate against `henryEventNameSchema`.

## Deployment gate
All gates green; owner reviews recommendation quality + reason-code legibility + AI-fallback behavior. Ship behind a kill switch (recommendation module hideable instantly; AI re-rank independently toggleable). 14-day soak monitoring click-through and AI fallback rate before declaring stable.

## Final report contract
`.codex-temp/v3-36-personalization-cross-division-recommendations/report.md` with the standard 9 sections: exec summary · files changed · migration/RLS/env · validation evidence · smoke · live verification · telemetry baseline · deferred items · pass-closure assertion.

## Self-verification
- [ ] `@henryco/intelligence/recommendations` engine + 5 per-domain recommenders shipped + unit-tested.
- [ ] Every recommendation carries a reason code; reason-code-coverage test enforces it.
- [ ] Cross-pollination bridges wired (Care→Job, Learn→employer roles) and logged.
- [ ] AI re-rank is optional with deterministic fallback proven under forced failure.
- [ ] `confidence`/score never serialized to the client (leak test passes); RLS respected in candidate generation.
- [ ] `/recommendations` page + home module + division mini-recs shipped.
- [ ] 3 telemetry events + owner tiles (incl. AI-fallback rate) live.
- [ ] All copy via `surface:recommendations`; brand via `@henryco/config`; zero hardcoded domains/strings; light+dark, mobile+desktop, CLS ≈ 0.
- [ ] Kill switch wired; report written.
