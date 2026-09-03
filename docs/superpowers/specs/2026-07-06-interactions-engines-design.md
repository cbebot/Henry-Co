# SP1 — `@henryco/interactions` (Engines 1–10) + Telemetry — Design Spec

**Date:** 2026-07-06
**Author:** Fable 5 (with owner)
**Sub-project:** SP1 of the V3 Launch Showcase (V3-96) — the keystone package
**Branch:** `worktree-v3+interactions-engines` (worktree off `origin/main` @ `bb8491c7`)
**Governing docs:** `docs/v3/prompts/v3-96-closure-v3-showcase.md`, `docs/v3/public-pages-interaction-principles.md` (the doctrine — Part IV Engines 1–10, Part VI telemetry), `docs/v3/ANTI-CLONE.md`, `docs/v3/account-design-language.md`, `packages/ui/src/public-shell/public-tokens.ts`.

---

## 1. Purpose & context

The V3-96 showcase spec requires the doctrine's ten interaction **Engines** to live in a shared package (`@henryco/interactions`) "consumed by every showcase route" and, more broadly, by every public surface across the 9 divisions. **This package does not exist yet** — the V3-96 prompt flags its absence as "the first entry in the S4 defect ledger until satisfied." SP1 builds it.

This is the keystone: SP2–SP6 (the `/v3` microsite, journey, press kit, owner dashboard, ecosystem unification) all consume it. Building it first, proven in isolation, means every later surface is a thin, confident compose rather than a re-implementation of button/trust/joy behavior.

### Non-goals (explicitly out of SP1)

- No `/v3` microsite pages (SP2/SP3).
- No press kit or announcement surfaces (SP4).
- No owner dashboard (SP5).
- No changes to payment behavior — the engines *render* pricing, they never move money. Money invariants stay in the existing (behavior-locked) payment layer.
- No app-level wiring beyond a **dev gallery** used to see/test the engines. Division-level adoption is later work.
- No new locales; i18n uses the existing Pattern A/B architecture via injected labels.

---

## 2. Architecture — "pure logic-core + thin React wrapper, DI at the edges"

Every engine is two parts:

1. **Pure logic core** (`<engine>.logic.ts`) — a DOM-free, side-effect-free function or reducer. It holds the decision: `resolveCtaState()`, `nextCommitmentOffer()`, `shouldTriggerRecovery()`, `resolveVisibleTrustStage()`, `breakdownPrice()`, etc. Cores take `now: number` as a parameter — they never call `Date.now()` — so time-dependent behavior is deterministic and unit-testable.
2. **Thin client component** (`<Engine>.tsx`) — a `"use client"` React component that renders the core's output and binds DOM events (click, scroll, IntersectionObserver, unload).

The package **injects its dependencies at the edges** instead of hard-importing app systems:

- **Telemetry** — an `InteractionTelemetrySink` interface, provided via context. The app wires it to `@henryco/observability`. Default: no-op sink (tests) / console sink (dev).
- **i18n labels** — an `InteractionLabels` object, provided via context (Pattern B injection). The package ships **zero hardcoded user-facing English**.
- **Currency** — a `CurrencyFormatter` function, injected from `@henryco/pricing` at the app edge.
- **Persistence** — engines that need cross-session state (Micro-Commitment tier, Abandonment draft) take an adapter interface; the app supplies the server-backed anonymous-session implementation (V3-01 pattern).

**Rationale (why this and not the alternatives):**
- Pure cores → unit-testable with the repo's existing `tsx --test` runner, no DOM/React-testing harness required; and extracting decisions out of components *is* the doctrine's isolation-and-clarity principle.
- DI at the edges → no coupling to a single app's data shape; reusable across all 9 divisions without drift (the doctrine's "compounding A/B learning" earning hypothesis); tests never mock three packages.
- Rejected: (B) hard-importing observability/i18n/pricing (couples + hard to test); (C) headless-hooks-only (each app re-implements markup → behavior drift, defeats the doctrine).

---

## 3. Package layout

```
packages/interactions/
  package.json          # @henryco/interactions, type:module, source-exported (no build step)
  tsconfig.json         # extends repo base; include [src/**]; types [node]
  README.md
  src/
    index.ts            # barrel export (components + hooks + logic + types)
    telemetry.ts        # InteractionTelemetrySink, provider, useInteractionTelemetry(); typed Part-VI event union
    motion.ts           # useReducedMotion(); motion presets referencing public-tokens
    labels.ts           # InteractionLabels type + InteractionLabelsProvider + useInteractionLabels()
    pricing.ts          # CurrencyFormatter type + provider + useCurrencyFormatter()
    engines/
      cta/                    { cta.logic.ts, cta.logic.test.ts, CtaButton.tsx, index.ts }
      joy/                    { joy.logic.ts, joy.logic.test.ts, JoyState.tsx, index.ts }
      trust-reveal/           { trust.logic.ts, trust.logic.test.ts, TrustStair.tsx, parts.tsx, index.ts }
      pricing-reveal/         { pricing-reveal.logic.ts, *.test.ts, PriceReveal.tsx, PlatformFeeTooltip.tsx, index.ts }
      micro-commitment/       { commitment.logic.ts, *.test.ts, CommitmentGate.tsx, useCommitmentTier.ts, index.ts }
      abandonment-recovery/   { recovery.logic.ts, *.test.ts, useAbandonmentRecovery.ts, index.ts }
      newsletter-earn/        { newsletter.logic.ts, *.test.ts, NewsletterEarn.tsx, index.ts }
      earn-with-us/           { earn.logic.ts, *.test.ts, EarnWithUs.tsx, index.ts }
      concierge-handoff/      { concierge.logic.ts, *.test.ts, ConciergeHandoff.tsx, index.ts }
      local-boost/            { boost.logic.ts, *.test.ts, PromotedLabel.tsx, BoostControls.tsx, index.ts }
```

`package.json` mirrors `@henryco/payment-surface`: `"type": "module"`, `exports` map to `./src/index.ts` + per-engine subpaths, `peerDependencies` on `@henryco/ui`, `lucide-react`, `next`, `react`, `react-dom`; `scripts.typecheck: "tsc -p tsconfig.json"`; `scripts.test: "tsx --test src/**/*.test.ts"`.

---

## 4. The shared backbone

### 4.1 `telemetry.ts` — interaction events (doctrine Part VI)

```ts
export type InteractionEvent =
  | { name: "page_viewed"; props: { surface_id: string; locale: string; currency: string; commitment_tier: string; referrer_class?: string; device_class?: string } }
  | { name: "cta_seen"; props: { cta_id: string; surface_id: string; ab_variant?: string; scroll_depth_at_view?: number } }
  | { name: "cta_clicked"; props: { cta_id: string; surface_id: string; ab_variant?: string; time_since_page_view_ms?: number } }
  | { name: "cta_succeeded"; props: { cta_id: string; surface_id: string; latency_ms: number } }
  | { name: "cta_failed"; props: { cta_id: string; surface_id: string; error_class: string; retried: boolean } }
  | { name: "commitment_rung_offered"; props: { from_tier: string; to_tier: string; surface_id: string; trigger: string } }
  | { name: "commitment_rung_accepted"; props: { from_tier: string; to_tier: string; surface_id: string } }
  | { name: "joy_state_seen"; props: { cta_id: string; surface_id: string; variant: string } }
  | { name: "recovery_triggered"; props: { flow_id: string; trigger: "idle" | "exit"; consented: boolean } }
  | { name: "recovery_resumed"; props: { flow_id: string; time_to_resume_s: number } }
  | { name: "pricing_revealed"; props: { surface_id: string; currency: string; converted_from?: string } }
  | { name: "trust_stage_entered"; props: { surface_id: string; stage: string; via: string } };

export interface InteractionTelemetrySink { emit(event: InteractionEvent): void }
```

Provided via `InteractionTelemetryProvider`; consumed via `useInteractionTelemetry()`. These are the **exact** Part-VI events already listed in the doctrine — no new interaction events invented here.

### 4.2 `motion.ts`
`useReducedMotion()` (SSR-safe, `matchMedia` guarded) + preset objects (durations/eases) that mirror `public-tokens.ts` `PublicMotionTokens`. When reduced-motion is on, engines strip scale/glow and keep label/opacity changes only.

### 4.3 `labels.ts`
`InteractionLabels` = a typed record of every string the engines render (verbs, states, tooltip copy templates). `InteractionLabelsProvider` supplies them; `useInteractionLabels()` reads them. No string literal is baked into a component.

### 4.4 `pricing.ts`
`CurrencyFormatter = (minorUnits: number, currency: string) => string`, injected from `@henryco/pricing`. Engines never format money themselves.

---

## 5. The ten engines — API + pure core

| # | Engine | Component / hook API | Pure core signature |
|---|---|---|---|
| 1 | **CTA** | `<CtaButton variant="primary\|secondary\|destructive" ctaId surfaceId onAction … />`, `useCta()` | `resolveCtaState(prev: CtaState, ev: CtaEvent): CtaState` — states `idle→pressed→inflight→success(1.5s)→idle` and `inflight→error(retry)`; width-locked; destructive adds `confirm` intermediate with 3s cancel window |
| 2 | **Joy** | `<JoyState variant outcome nextAction? />` | `joyContentFor(variant, outcome): { headline; sub; hapticMs: 10; next?: Action }` — ≤600ms envelope; one next action |
| 3 | **Trust Reveal** | `<TrustStair stages>` + `<Outcome/> <Quote/> <SafetyNet/> <PaymentTrust/>` | `resolveVisibleStage(pos: { scrollDepth; interactions; sectionVisible }, budget: Stage[]): Stage` |
| 4 | **Pricing Reveal** | `<PriceReveal amountMinor currency fx? />`, `<PlatformFeeTooltip/>` | `breakdownPrice(amountMinor, currency, feeRateBps, fx?): { total; fee; net; fx? }` — integer minor units only; both cadences; annual saving in currency |
| 5 | **Micro-Commitment** | `useCommitmentTier()`, `<CommitmentGate rung>` | `nextOffer(tier, history, now): Offer \| null` — right rung only; per-session + weekly cooldowns |
| 6 | **Abandonment Recovery** | `useAbandonmentRecovery({ flowId, consented, highIntent })` | `shouldTriggerRecovery(idleMs, consented, highIntent, lastSentAt, now): Trigger \| null` — 20s idle / exit; 7-day cap |
| 7 | **Newsletter Earn** | `<NewsletterEarn/>` | `shouldSurfaceCapture(primarySucceeded, scrollDepth, lastAskedAt, now): boolean` — post-success OR >70% scroll; weekly cap |
| 8 | **Earn-With-Us** | `<EarnWithUs role proofValue/>` | `shouldShowInvite(role, enrolledRoles): boolean` — hidden if already enrolled |
| 9 | **Concierge Handoff** | `<ConciergeHandoff onOpen/>` | `resolveHandoffTrigger(lingerMs, bounceCount, postSuccess): Trigger \| null` — 45s / 3 bounces / post-success |
| 10 | **Local Boost** | `<PromotedLabel seller/>`, `<BoostControls/>` | `projectBoost(bidMinor, locale, baseline): { impressions; clicks }` |

**Cross-cutting requirements on every engine:** reduced-motion aware; i18n via injected labels (no hardcoded copy); currency via injected formatter; telemetry via injected sink; 44×44 hit targets; `focus-visible` ring; `aria-busy` during in-flight; consumes `public-tokens.ts` for color/elevation/radius/motion (no ad-hoc hex).

**Doctrine anti-pattern guards (Part V), enforced in code:** no fake countdowns (no timer primitives that fabricate scarcity); destructive = inline two-step, never full-modal; no pre-checked opt-ins; equal visual weight for yes/no; platform fee itemized + named, never buried; red reserved for true error/destructive.

---

## 6. Telemetry closure events (S6) — appended to `@henryco/observability`

Append these 9 events to the `HenryEventName` union in `packages/observability/src/events.ts` (format `henry.<domain>.<entity>.<verb>`), and mirror them into the doctrine's Part VI table in the same change (V3-96 requires "same PR"). These are fired later by the `/v3` surfaces (SP2/SP3); the definitions land now with the telemetry work:

`henry.v3.showcase.viewed`, `henry.v3.journey.started`, `henry.v3.journey.step_completed`, `henry.v3.journey.completed`, `henry.v3.journey.abandoned`, `henry.v3.announcement.delivered`, `henry.v3.announcement.engaged`, `henry.v3.launch_window.metric_breach`, `henry.v3.closure_certificate.signed`.

---

## 7. Testing (TDD, `tsx --test`)

Each engine's `.logic.test.ts` is written **before** its core. Coverage targets:

- **CTA:** full state-machine transition table incl. destructive confirm/cancel window; width-lock invariant; success auto-collapse timing.
- **Pricing:** money-exact — integer minor units, fee = round-half-even, annual-saving math, FX passthrough; never floats for money.
- **Micro-Commitment:** rung selection at each tier; cooldown enforcement (same rung not re-offered in session; not thrice in a week).
- **Recovery:** idle vs exit trigger; consent gate; high-intent gate; 7-day frequency cap.
- **Trust:** stage resolution across scroll/interaction/visibility inputs; never shows a later stage before its predecessor.
- **Joy / Newsletter / Earn / Concierge / Boost:** content selection + show/hide predicates + trigger thresholds.

Components stay thin enough that the cores carry the correctness guarantee. A lightweight dev **gallery route** (in the worktree, not shipped to a division) renders each engine for visual/interaction verification and screenshots.

---

## 8. Build tranches (within SP1)

- **Tranche 1 (demonstrable tip):** backbone (`telemetry`/`motion`/`labels`/`pricing`) + **CTA** + **Joy** + dev gallery → owner sees + clicks them live.
- **Tranche 2:** Trust Reveal + Pricing Reveal + Micro-Commitment.
- **Tranche 3:** Abandonment Recovery + Newsletter Earn + Earn-With-Us + Concierge Handoff + Local Boost.
- **+ Telemetry closure events** appended to observability + doctrine table.

Each tranche: red→green TDD on the logic cores, then thin components, then gallery verification.

---

## 9. Acceptance criteria (SP1 done)

- [ ] `packages/interactions` exists, typechecks (`tsc -p`), and all logic-core tests pass (`tsx --test`).
- [ ] All 10 engines present with the API in §5; each backed by a tested pure core.
- [ ] Zero hardcoded user-facing strings (all via injected labels); zero ad-hoc hex (tokens only); zero money floats (integer minor units).
- [ ] Telemetry sink injected, not hard-imported; the 9 `henry.v3.*` events appended to observability + doctrine Part VI table.
- [ ] Reduced-motion, focus-visible, 44×44, `aria-busy` verified on interactive engines.
- [ ] Doctrine Part V anti-patterns absent (checklist in §5 confirmed).
- [ ] Dev gallery renders all engines in light + dark; screenshots captured.
- [ ] No changes to payment behavior; no new locales; no division wiring.

---

## 10. Risks & mitigations

- **Monorepo install cost on Windows** → install once in the worktree; source-exported package needs no build.
- **Two telemetry vocabularies** (interaction Part-VI vs. closure `henry.v3.*`) → explicitly separated in §4.1 and §6; documented so consumers don't conflate them.
- **Over-coupling temptation** → DI enforced; a lint/review check that the package imports no app data-fetcher.
- **Scope creep into SP2** → the gallery is a dev harness only; real surfaces are later sub-projects.
```
