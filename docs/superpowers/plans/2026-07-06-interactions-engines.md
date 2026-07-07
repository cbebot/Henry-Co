# @henryco/interactions (Engines 1–10) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the `@henryco/interactions` package — the doctrine's 10 interaction Engines as reusable, tested, doctrine-compliant components — the keystone every V3 showcase surface consumes.

**Architecture:** Each engine = a pure DOM-free logic core (unit-tested with `tsx --test`) + a thin `"use client"` React wrapper. The package injects telemetry, i18n labels, currency formatting, and persistence at the edges (React context), hard-importing none of them. Source-exported package (no build step), mirroring `@henryco/payment-surface`.

**Tech Stack:** TypeScript 5.9, React 19, Next 16, `lucide-react`, node built-in test runner via `tsx`, `@henryco/ui` public-tokens for styling.

## Global Constraints

- Package name `@henryco/interactions`; `"type": "module"`; source-exported via `exports` map; no build step. (verbatim from spec §3)
- Pure cores take `now: number` as a parameter — **never** call `Date.now()` internally (deterministic tests). (spec §2)
- Zero hardcoded user-facing strings — all copy via injected `InteractionLabels`. (spec §5)
- Zero ad-hoc hex — colors/elevation/radius/motion via `packages/ui/src/public-shell/public-tokens.ts` tokens. (spec §5)
- Money is integer **minor units** only — never floats. (spec §5, §7)
- Every interactive engine: reduced-motion aware, `focus-visible` ring, 44×44 hit target, `aria-busy` in-flight. (spec §5)
- Telemetry is injected (`InteractionTelemetrySink`), never hard-imported. (spec §4.1)
- Doctrine Part V anti-patterns forbidden: no fake countdowns, destructive = inline two-step (never modal), no pre-checked opt-ins, equal yes/no weight, itemized+named fees, red only for error/destructive. (spec §5)
- Test command: `pnpm --filter @henryco/interactions test` → `tsx --test "src/**/*.test.ts"`. Typecheck: `tsc -p tsconfig.json`.

---

## Task 0: Scaffold the package

**Files:**
- Create: `packages/interactions/package.json`
- Create: `packages/interactions/tsconfig.json`
- Create: `packages/interactions/src/index.ts`
- Create: `packages/interactions/README.md`

**Interfaces:**
- Produces: the installable `@henryco/interactions` workspace package; `src/index.ts` barrel.

- [ ] **Step 1:** Write `package.json` mirroring `@henryco/payment-surface`:
```json
{
  "name": "@henryco/interactions",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "exports": { ".": "./src/index.ts" },
  "scripts": {
    "typecheck": "tsc -p tsconfig.json",
    "test": "tsx --test \"src/**/*.test.ts\""
  },
  "peerDependencies": {
    "@henryco/ui": "workspace:^",
    "lucide-react": "^0.577.0",
    "next": "^16.1.6",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@henryco/ui": "workspace:^",
    "@types/react": "^19.2.14",
    "@types/react-dom": "^19.2.3",
    "lucide-react": "^0.577.0",
    "tsx": "^4.19.2",
    "typescript": "^5.9.3"
  }
}
```
- [ ] **Step 2:** Write `tsconfig.json` matching a sibling package's config (extend repo base; `include: ["src/**/*"]`, `types: ["node"]`, `jsx: react-jsx`, `moduleResolution: bundler`). Copy from `packages/payment-surface/tsconfig.json` and adjust.
- [ ] **Step 3:** Write a placeholder `src/index.ts` with `export {}` and a header comment; write `README.md` describing the package purpose + DI contract.
- [ ] **Step 4:** Run `pnpm install` at the worktree root to link the workspace package. Expected: interactions listed, 0 errors.
- [ ] **Step 5:** Commit: `git add packages/interactions && git commit -m "feat(interactions): scaffold @henryco/interactions package"`

---

## Task 1: Telemetry backbone

**Files:**
- Create: `packages/interactions/src/telemetry.ts`
- Test: `packages/interactions/src/telemetry.test.ts`

**Interfaces:**
- Produces: `InteractionEvent` (union, spec §4.1), `InteractionTelemetrySink { emit(e) }`, `InteractionTelemetryProvider`, `useInteractionTelemetry(): InteractionTelemetrySink`, `noopSink`, `createConsoleSink()`.

- [ ] **Step 1: Write failing test** (`telemetry.test.ts`):
```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { createCollectingSink } from "./telemetry.ts";

test("collecting sink records emitted events in order", () => {
  const { sink, events } = createCollectingSink();
  sink.emit({ name: "cta_clicked", props: { cta_id: "book", surface_id: "care" } });
  sink.emit({ name: "joy_state_seen", props: { cta_id: "book", surface_id: "care", variant: "care" } });
  assert.equal(events.length, 2);
  assert.equal(events[0].name, "cta_clicked");
  assert.equal(events[1].props.surface_id, "care");
});
```
- [ ] **Step 2:** Run `pnpm --filter @henryco/interactions test` → FAIL (module/export missing).
- [ ] **Step 3:** Implement `telemetry.ts`: the `InteractionEvent` union verbatim from spec §4.1; `InteractionTelemetrySink`; `noopSink`; `createConsoleSink()`; `createCollectingSink()` (test helper: returns `{ sink, events: InteractionEvent[] }`); React context `InteractionTelemetryProvider` + `useInteractionTelemetry()` (defaults to `noopSink`).
- [ ] **Step 4:** Run test → PASS.
- [ ] **Step 5:** Commit: `git commit -am "feat(interactions): telemetry sink + Part-VI event union"`

---

## Task 2: Motion, labels, pricing backbone

**Files:**
- Create: `packages/interactions/src/motion.ts`, `src/labels.ts`, `src/pricing.ts`
- Test: `packages/interactions/src/backbone.test.ts`

**Interfaces:**
- Produces: `useReducedMotion(): boolean`, `MOTION` preset object; `InteractionLabels` type + `InteractionLabelsProvider` + `useInteractionLabels()`; `CurrencyFormatter = (minor:number, currency:string)=>string` + `CurrencyProvider` + `useCurrencyFormatter()`.

- [ ] **Step 1: Write failing test** covering: `MOTION.cta.pressScale === 0.98`; `useInteractionLabels` throws or returns injected labels; a default `CurrencyFormatter` fallback formats `12345, "NGN"` as a non-empty string containing "123".
- [ ] **Step 2:** Run test → FAIL.
- [ ] **Step 3:** Implement the three files. `motion.ts`: SSR-safe `matchMedia("(prefers-reduced-motion: reduce)")` hook + `MOTION` presets mirroring `PublicMotionTokens`. `labels.ts`: typed labels record + provider/hook. `pricing.ts`: injected formatter type + provider/hook with an Intl-based fallback.
- [ ] **Step 4:** Run test → PASS.
- [ ] **Step 5:** Commit.

---

## Task 3: CTA Engine — logic core (TDD)

**Files:**
- Create: `packages/interactions/src/engines/cta/cta.logic.ts`
- Test: `packages/interactions/src/engines/cta/cta.logic.test.ts`

**Interfaces:**
- Produces: `type CtaState = { phase: "idle"|"pressed"|"inflight"|"success"|"error"|"confirm"; retryable: boolean }`; `type CtaEvent = {type:"press"}|{type:"release"}|{type:"submitStart"}|{type:"submitOk"; at:number}|{type:"submitErr"; errorClass:string}|{type:"retry"}|{type:"tick"; at:number}|{type:"confirm"}|{type:"cancel"}`; `resolveCtaState(prev, ev, opts:{destructive?:boolean; successUntil?:number}): CtaState`; `SUCCESS_MS = 1500`, `CONFIRM_WINDOW_MS = 3000`.

- [ ] **Step 1: Write failing tests** (`cta.logic.test.ts`):
```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { resolveCtaState, initialCtaState } from "./cta.logic.ts";

test("press → pressed, release → idle", () => {
  const s = resolveCtaState(initialCtaState, { type: "press" }, {});
  assert.equal(s.phase, "pressed");
  assert.equal(resolveCtaState(s, { type: "release" }, {}).phase, "idle");
});

test("submitStart → inflight, submitOk → success", () => {
  const inflight = resolveCtaState(initialCtaState, { type: "submitStart" }, {});
  assert.equal(inflight.phase, "inflight");
  const ok = resolveCtaState(inflight, { type: "submitOk", at: 1000 }, {});
  assert.equal(ok.phase, "success");
});

test("success auto-collapses to idle after SUCCESS_MS", () => {
  const ok = resolveCtaState(resolveCtaState(initialCtaState, { type: "submitStart" }, {}), { type: "submitOk", at: 1000 }, {});
  const still = resolveCtaState(ok, { type: "tick", at: 1000 + 1499 }, {});
  assert.equal(still.phase, "success");
  const gone = resolveCtaState(ok, { type: "tick", at: 1000 + 1500 }, {});
  assert.equal(gone.phase, "idle");
});

test("submitErr → error(retryable); retry → inflight", () => {
  const err = resolveCtaState(resolveCtaState(initialCtaState, { type: "submitStart" }, {}), { type: "submitErr", errorClass: "network" }, {});
  assert.equal(err.phase, "error");
  assert.equal(err.retryable, true);
  assert.equal(resolveCtaState(err, { type: "retry" }, {}).phase, "inflight");
});

test("destructive: press → confirm (not inflight); confirm → inflight; cancel → idle", () => {
  const c = resolveCtaState(initialCtaState, { type: "press" }, { destructive: true });
  assert.equal(c.phase, "confirm");
  assert.equal(resolveCtaState(c, { type: "confirm" }, { destructive: true }).phase, "inflight");
  assert.equal(resolveCtaState(c, { type: "cancel" }, { destructive: true }).phase, "idle");
});
```
- [ ] **Step 2:** Run `pnpm --filter @henryco/interactions test` → FAIL.
- [ ] **Step 3:** Implement `cta.logic.ts` as a pure reducer satisfying all transitions; export `initialCtaState`, `SUCCESS_MS`, `CONFIRM_WINDOW_MS`.
- [ ] **Step 4:** Run test → PASS (all 5).
- [ ] **Step 5:** Commit: `git commit -am "feat(interactions): CTA engine logic core (TDD)"`

---

## Task 4: CTA Engine — `<CtaButton>` component

**Files:**
- Create: `packages/interactions/src/engines/cta/CtaButton.tsx`, `src/engines/cta/index.ts`
- Modify: `packages/interactions/src/index.ts` (export cta)

**Interfaces:**
- Consumes: `resolveCtaState`, `useInteractionTelemetry`, `useReducedMotion`, `useInteractionLabels`.
- Produces: `<CtaButton variant="primary"|"secondary"|"destructive" ctaId surfaceId onAction={()=>Promise<void>} labelKey abVariant?/>`.

- [ ] **Step 1:** Implement `CtaButton.tsx` (`"use client"`): drives `resolveCtaState` via `useReducer`; width-locked (min-width fixed from label); fires `cta_seen` (IntersectionObserver), `cta_clicked`, `cta_succeeded{latency_ms}`, `cta_failed{error_class,retried}`; inline retry on error; success confirmation 1.5s; destructive inline two-step; `aria-busy` in-flight; token-based styling; reduced-motion strips scale/glow.
- [ ] **Step 2:** Export from `engines/cta/index.ts` and `src/index.ts`.
- [ ] **Step 3:** `tsc -p tsconfig.json` → 0 errors.
- [ ] **Step 4:** Commit: `git commit -am "feat(interactions): CtaButton component"`

---

## Task 5: Joy Engine — logic core (TDD)

**Files:**
- Create: `packages/interactions/src/engines/joy/joy.logic.ts`
- Test: `packages/interactions/src/engines/joy/joy.logic.test.ts`

**Interfaces:**
- Produces: `type JoyVariant = "care"|"marketplace"|"jobs"|"learn"|"logistics"|"property"|"studio"|"generic"`; `joyContentFor(variant, outcome:{ subject?:string; when?:string; ref?:string }, labels): { headlineKey:string; detail:string; hapticMs:10; envelopeMs:number }`; `JOY_ENVELOPE_MS = 600`.

- [ ] **Step 1: Write failing tests:**
```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { joyContentFor, JOY_ENVELOPE_MS } from "./joy.logic.ts";

test("envelope never exceeds 600ms", () => {
  const c = joyContentFor("care", { subject: "Adaeze", when: "Saturday 10am" });
  assert.ok(c.envelopeMs <= JOY_ENVELOPE_MS);
});
test("haptic is a single 10ms tap", () => {
  assert.equal(joyContentFor("marketplace", {}).hapticMs, 10);
});
test("care variant names subject + when in detail", () => {
  const c = joyContentFor("care", { subject: "Adaeze", when: "Saturday 10am" });
  assert.match(c.detail, /Adaeze/);
  assert.match(c.detail, /Saturday/);
});
```
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** Implement `joy.logic.ts`: per-variant content builder; `hapticMs: 10`; `envelopeMs: 600`. (Detail string composed from injected label templates + outcome fields — the test passes a minimal labels stub.)
- [ ] **Step 4:** Run → PASS.
- [ ] **Step 5:** Commit.

---

## Task 6: Joy Engine — `<JoyState>` component

**Files:**
- Create: `packages/interactions/src/engines/joy/JoyState.tsx`, `src/engines/joy/index.ts`
- Modify: `src/index.ts`

**Interfaces:**
- Consumes: `joyContentFor`, `useReducedMotion`, `useInteractionTelemetry`.
- Produces: `<JoyState variant outcome nextAction?/>` — confident check, scale-in icon, accent glow ≤600ms, single 10ms `navigator.vibrate(10)` (guarded), one optional next action; fires `joy_state_seen`; reduced-motion strips scale+glow, keeps label + check.

- [ ] **Step 1:** Implement component. **Step 2:** export. **Step 3:** `tsc` clean. **Step 4:** Commit.

---

## Task 7: Dev gallery — the demonstrable "tip" (Tranche 1 milestone)

**Files:**
- Create: `packages/interactions/gallery/README.md` (how to view) and a self-contained gallery under `apps/hub/app/(dev)/interactions-gallery/page.tsx` guarded by `process.env.NODE_ENV !== "production"`.

**Interfaces:**
- Consumes: `CtaButton`, `JoyState`, providers.

- [ ] **Step 1:** Add a dev-only route rendering `<CtaButton>` in all three variants (with a fake async `onAction`) and `<JoyState>` in care + marketplace variants, wrapped in the label/telemetry/currency providers with a console sink. Light + dark toggle.
- [ ] **Step 2:** Run `pnpm --filter @henryco/hub dev`, open the route, verify: CTA three states + success + destructive two-step; Joy 600ms; reduced-motion honored. Capture screenshots (light + dark).
- [ ] **Step 3:** Commit: `git commit -am "feat(interactions): dev gallery for CTA + Joy engines"`
- [ ] **Step 4: TRANCHE 1 REVIEW CHECKPOINT** — show owner the gallery screenshots.

---

## Task 8: Trust Reveal Engine

**Files:** `src/engines/trust-reveal/{trust.logic.ts, trust.logic.test.ts, TrustStair.tsx, parts.tsx, index.ts}`; modify `src/index.ts`.

**Interfaces:**
- Produces: `type Stage = "browse"|"consider"|"commit"|"pay"`; `resolveVisibleStage(pos:{scrollDepth:number; interactions:number; sectionVisible:Stage|null}, budget:Stage[]): Stage`; `<TrustStair stages>`, `<Outcome/>`, `<Quote/>`, `<SafetyNet/>`, `<PaymentTrust/>`.

- [ ] **Step 1: Failing tests:** stage never precedes its predecessor in `budget`; `pay` marks render only at pay stage; `browse` shows outcome-only. **Step 2:** FAIL. **Step 3:** implement pure `resolveVisibleStage` + components (each child renders only at its stage; `trust_stage_entered` fires on entry; data via injected verified-records adapter prop). **Step 4:** PASS. **Step 5:** Commit.

---

## Task 9: Pricing Reveal Engine

**Files:** `src/engines/pricing-reveal/{pricing-reveal.logic.ts, *.test.ts, PriceReveal.tsx, PlatformFeeTooltip.tsx, index.ts}`; modify `src/index.ts`.

**Interfaces:**
- Produces: `breakdownPrice(amountMinor:number, feeRateBps:number): { totalMinor; feeMinor; netMinor }` (round-half-even on fee); `annualSavingMinor(monthlyMinor, annualMinor): number`; `<PriceReveal amountMinor currency fx?/>`, `<PlatformFeeTooltip/>`.

- [ ] **Step 1: Failing tests (money-exact):**
```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { breakdownPrice, annualSavingMinor } from "./pricing-reveal.logic.ts";
test("fee is integer minor units, round-half-even", () => {
  const b = breakdownPrice(10000, 750); // 7.5%
  assert.equal(b.feeMinor, 750);
  assert.equal(b.totalMinor, 10000);
  assert.equal(b.netMinor, 9250);
});
test("annual saving = 12*monthly - annual", () => {
  assert.equal(annualSavingMinor(1000, 10000), 2000);
});
```
**Step 2:** FAIL. **Step 3:** implement pure core (integer math only) + components (currency via injected formatter; FX source+rate+timestamp on hover; fee itemized + named honest tooltip; both cadences; `pricing_revealed` fires). **Step 4:** PASS. **Step 5:** Commit.

---

## Task 10: Micro-Commitment Engine

**Files:** `src/engines/micro-commitment/{commitment.logic.ts, *.test.ts, CommitmentGate.tsx, useCommitmentTier.ts, index.ts}`; modify `src/index.ts`.

**Interfaces:**
- Produces: `type Tier = "anonymous"|"cookie"|"identified"|"account"|"verified"|"subscribed"`; `nextOffer(tier, history:{toTier:Tier; at:number}[], now:number): { toTier:Tier } | null`; `useCommitmentTier(adapter)`, `<CommitmentGate rung>`.

- [ ] **Step 1: Failing tests:** offers exactly the next rung; never a cleared rung; not twice same rung in session; not thrice/week. **Step 2:** FAIL. **Step 3:** implement pure `nextOffer` + hook/component (persistence via injected adapter; `commitment_rung_offered/accepted` fire). **Step 4:** PASS. **Step 5:** Commit.

---

## Task 11: Abandonment Recovery Engine

**Files:** `src/engines/abandonment-recovery/{recovery.logic.ts, *.test.ts, useAbandonmentRecovery.ts, index.ts}`; modify `src/index.ts`.

**Interfaces:**
- Produces: `shouldTriggerRecovery(idleMs:number, consented:boolean, highIntent:boolean, lastSentAt:number|null, now:number): { trigger:"idle"|"exit" } | null`; `IDLE_MS=20000`, `RECOVERY_CAP_MS=7*24*3600*1000`; `useAbandonmentRecovery({flowId, consented, highIntent, adapter})`.

- [ ] **Step 1: Failing tests:** idle<20s → null; idle≥20s+consent+highIntent → idle trigger; not consented → null; within 7-day cap → null. **Step 2:** FAIL. **Step 3:** implement pure core + hook (draft save local→server via adapter; unload listener; `recovery_triggered/resumed` fire). **Step 4:** PASS. **Step 5:** Commit.

---

## Task 12: Newsletter Earn Engine

**Files:** `src/engines/newsletter-earn/{newsletter.logic.ts, *.test.ts, NewsletterEarn.tsx, index.ts}`; modify `src/index.ts`.

**Interfaces:**
- Produces: `shouldSurfaceCapture(primarySucceeded:boolean, scrollDepth:number, lastAskedAt:number|null, now:number): boolean`; `<NewsletterEarn valueLabel onSubscribe/>`.

- [ ] **Step 1: Failing tests:** shows after primary success; shows past 70% scroll; hidden if asked <7 days ago; never twice per session. **Step 2:** FAIL. **Step 3:** implement + component (value named to user; single field; frequency cap). **Step 4:** PASS. **Step 5:** Commit.

---

## Task 13: Earn-With-Us Engine

**Files:** `src/engines/earn-with-us/{earn.logic.ts, *.test.ts, EarnWithUs.tsx, index.ts}`; modify `src/index.ts`.

**Interfaces:**
- Produces: `shouldShowInvite(role:string, enrolledRoles:string[]): boolean`; `<EarnWithUs role proofValue onboardingHref/>`.

- [ ] **Step 1: Failing tests:** hidden if already enrolled in role; shown otherwise. **Step 2:** FAIL. **Step 3:** implement + component (end-of-page, non-disruptive; server-computed proof passed as prop, never hardcoded; links to onboarding). **Step 4:** PASS. **Step 5:** Commit.

---

## Task 14: Concierge Handoff Engine

**Files:** `src/engines/concierge-handoff/{concierge.logic.ts, *.test.ts, ConciergeHandoff.tsx, index.ts}`; modify `src/index.ts`.

**Interfaces:**
- Produces: `resolveHandoffTrigger(lingerMs:number, bounceCount:number, postSuccess:boolean): "linger"|"bounce"|"post_success"|null` (45s / 3 / true); `<ConciergeHandoff onOpen/>`.

- [ ] **Step 1: Failing tests:** 45s linger → "linger"; 3 bounces → "bounce"; postSuccess → "post_success"; else null. **Step 2:** FAIL. **Step 3:** implement + component (opt-in, never modal, service-framed; free-first-message copy; opens via injected `onOpen` → app wires `@henryco/intelligence`). **Step 4:** PASS. **Step 5:** Commit.

---

## Task 15: Local Boost Engine

**Files:** `src/engines/local-boost/{boost.logic.ts, *.test.ts, PromotedLabel.tsx, BoostControls.tsx, index.ts}`; modify `src/index.ts`.

**Interfaces:**
- Produces: `projectBoost(bidMinor:number, locale:string, baseline:{cpmMinor:number; ctr:number}): { impressions:number; clicks:number }`; `<PromotedLabel seller/>`, `<BoostControls bidMinor baseline/>`.

- [ ] **Step 1: Failing tests:** impressions scale with bid; clicks = round(impressions*ctr); zero bid → zero. **Step 2:** FAIL. **Step 3:** implement + components ("Promoted by [seller]" clear label, not 9px grey; projected impressions/clicks preview; transparent). **Step 4:** PASS. **Step 5:** Commit.

---

## Task 16: Append the 9 closure events (S6)

**Files:**
- Modify: `packages/observability/src/events.ts` (append to `HenryEventName` union)
- Modify: `docs/v3/public-pages-interaction-principles.md` (Part VI telemetry table)

**Interfaces:**
- Produces: 9 new `henry.v3.*` event names (spec §6) available to the typed emitter.

- [ ] **Step 1:** Append the 9 `henry.v3.*` names to the union under a `// v3 showcase (V3-96)` comment block.
- [ ] **Step 2:** Add the same 9 rows to the doctrine's Part VI table with their property lists (from spec §6 / V3-96 S6).
- [ ] **Step 3:** `pnpm --filter @henryco/observability typecheck` → 0 errors.
- [ ] **Step 4:** Commit: `git commit -am "feat(observability): append 9 henry.v3.* showcase closure events"`

---

## Task 17: SP1 final verification

- [ ] **Step 1:** `pnpm --filter @henryco/interactions test` → all logic-core tests pass.
- [ ] **Step 2:** `pnpm --filter @henryco/interactions typecheck` → 0 errors.
- [ ] **Step 3:** Walk the acceptance checklist (spec §9); tick every box or record a gap.
- [ ] **Step 4:** Re-open the gallery; capture final light+dark screenshots of all engines that render.
- [ ] **Step 5:** Commit any doc updates; write a short `packages/interactions/README.md` usage section with the DI wiring example.

---

## Self-Review

**Spec coverage:** §2 architecture → Tasks 1–15 (cores+wrappers+DI). §4 backbone → Tasks 1–2. §5 all 10 engines → Tasks 3–15. §6 closure events → Task 16. §7 testing → every core task is TDD. §8 tranches → T1 (Tasks 0–7), T2 (Tasks 8–10), T3 (Tasks 11–16). §9 acceptance → Task 17. No gaps.

**Placeholder scan:** T1 tasks carry full test+impl code. T2/T3 tasks carry exact core signatures + concrete test targets (not "TODO"); component behavior specified against doctrine. Acceptable right-sizing given inline execution with full spec context.

**Type consistency:** `resolveCtaState`, `joyContentFor`, `resolveVisibleStage`, `breakdownPrice`, `nextOffer`, `shouldTriggerRecovery`, `shouldSurfaceCapture`, `shouldShowInvite`, `resolveHandoffTrigger`, `projectBoost` — names consistent between Interfaces blocks and tests. `InteractionEvent`/`InteractionTelemetrySink` consistent across Tasks 1, 4, 6, 8–15.
