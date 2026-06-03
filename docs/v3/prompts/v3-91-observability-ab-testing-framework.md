# V3-91 — Observability: A/B Testing Framework

**Pass ID:** V3-91  ·  **Phase:** I (Platform/API · Global/Mobile · Observability · Closure)  ·  **Pillar:** P12 (Trust, Reliability & Foundation)
**Dependencies:** V3-90 (data lake + event tracking — the exposure/conversion sink experiments measure against)  ·  **Effort:** M  ·  **Parallel-safe:** Y
**Owner gate:** none  ·  **Risk class:** —

---

## Role

You are the V3 A/B Testing engineer for Henry Onyx. You execute exactly this one pass, then stop and report. This pass gives the company a governed experiment lifecycle — create with a hypothesis and KPI, split traffic, assign stickily, track exposure and conversion through the V3-90 lake, read significance, and ship the winner or kill the loser — on a single self-hosted flag platform, coexisting cleanly with the existing env-var feature flags. The line it must not cross: it builds **the framework and three test experiments** — it does not redesign any product surface, does not run an experiment without consent-honouring assignment, and never lets an experiment touch money, identity, or payment behaviour.

## Project

| Field | Value |
|---|---|
| Repo | `github.com/cbebot/Henry-Co` |
| Default branch | `main` |
| Working branch | `v3/91-observability-ab-testing-framework` |
| Deploy | Vercel |
| Backend | Supabase (project ref `rzkbgwuznmdxnnhmjazy`) |
| Package manager | pnpm 9.15.5 · Node 24.x |
| OS context | Windows + bash |

## Audit summary

Feature flagging today is simple and env-driven: `@henryco/intelligence` exposes `parseHenryFeatureFlags` (boolean toggles read from env vars — a deploy-time switch, not a per-user experiment). There is **no traffic-split, no sticky per-user assignment, no exposure/conversion measurement, and no significance read** anywhere in the codebase. The measurement substrate the framework needs now exists: V3-90 ships `henry_events_raw` (partitioned, redacted, `actor_hash`-keyed) plus the BI views, and `@henryco/observability/emitEvent` carries the canonical `henry.<domain>.<noun>.<verb>` taxonomy with a `traceId` stitch — so exposure and conversion are already first-class events waiting for an experiment dimension. The owner's P12 mandate is "an A/B testing framework"; the register names the candidate set GrowthBook / LaunchDarkly / Vercel Edge Config. The gap this pass closes: from "deploy-time boolean flags only" to "a per-user, sticky, consent-honouring experiment lifecycle whose results are read from our own data lake."

## Mandatory scope

### S1 — Platform decision: self-hosted GrowthBook

**Decision (recommended, default unless owner overrides):** GrowthBook — open-source, self-hostable, keeps experiment data on our infra (consistent with the V3-90 "data on our infra" posture and Principle 10 — the data moat). LaunchDarkly (SaaS, per-seat cost, data off-infra) and Vercel Edge Config (a config store, not an experimentation engine) are rejected for this reason; the rejection rationale is recorded in `docs/v3/ab-testing-architecture.md` so the choice is not re-litigated.

GrowthBook env (env-only, added to `docs/v3/INTEGRATION-KEYS.md`, **zero hardcoded host/keys**):
- `GROWTHBOOK_API_HOST` (self-hosted instance URL)
- `GROWTHBOOK_CLIENT_KEY` (client-side SDK init)
- `GROWTHBOOK_SECRET_API_KEY` (server-side management API)

### S2 — `@henryco/experiments` package

New workspace package `packages/experiments/` (monorepo convention: `exports` → `./src/*`, no build step; tests on `node:test` + `tsx`; split runtime-safe from `server-only`):

```
packages/experiments/src/
  types.ts            ExperimentKey, VariantKey, Assignment, ExperimentContext — pure types.
                      ExperimentKey/VariantKey are a string-literal union (NO hardcoded ad-hoc
                      ids at call sites — adding an experiment is a typed registry edit).
  registry.ts         The authoritative experiment registry: key → { hypothesis, kpi,
                      variants, trafficSplit, status }. One source of truth, type-checked.
  assignment.ts       sticky bucketing: hash(unitId + experimentKey) → variant, deterministic
                      and stable across requests/sessions; honours the consent gate (S5).
  client.ts           React hook useExperiment(key) → VariantKey | "control"; SSR-safe.
  server.ts           'server-only' — resolveVariant(key, ctx) for route handlers + RSC.
  tracking.ts         emitExposure / emitConversion → emitEvent + sinkEvent (V3-90 lake).
  index.ts            barrel (runtime-safe; never re-exports a server-only module).
  __tests__/*.test.ts sticky-assignment determinism + split-ratio + consent-gate specs.
```

The GrowthBook SDK backs `assignment.ts`/`client.ts`/`server.ts`; `@henryco/experiments` is the thin, typed, consent-aware wrapper the apps import — apps never call the GrowthBook SDK directly, so a future platform swap is a wrapper change, not an app change.

### S3 — Feature flag + experiment lifecycle

The full lifecycle, each step concrete:
1. **Create** — a registry entry (S2) + a GrowthBook experiment with `hypothesis` (free text) and a single primary `kpi` (must map to a canonical `HenryEventName` conversion event).
2. **Variants + split** — ≥ 2 variants, a `trafficSplit` that sums to 100%, a `control`.
3. **Assign** — sticky bucketing keyed on `actor_hash` for authed users, on a stable anonymous `session_id` for guests; the same unit always sees the same variant.
4. **Track** — `emitExposure(key, variant)` on first render of the experimental surface and `emitConversion(key, variant)` on the KPI event, both flowing through V3-90 (`sinkEvent` → `henry_events_raw`) with an `experiment_key` + `variant_key` dimension on the payload.
5. **Analyse** — significance read in the GrowthBook UI over the lake-fed metrics; the framework supplies the exposure/conversion data, GrowthBook computes the stats.
6. **Decide** — roll out the winner (promote the variant to 100% / fold into code) **or** kill the experiment (revert to control, archive the registry entry). Both transitions are recorded; a killed experiment leaves no dead branch in the surface.

### S4 — Coexistence with existing flags

- `@henryco/intelligence/parseHenryFeatureFlags` (env-var booleans) **stays unchanged** — it remains the right tool for simple deploy-time toggles (kill-switches, region gating).
- `@henryco/experiments` is the home for **A/B-tested** flags only. `docs/v3/ab-testing-architecture.md` states the decision rule: "deterministic deploy-time toggle → env flag; per-user measured comparison → experiment." No flag lives in both systems.

### S5 — Consent-honouring assignment (compliance)

Experimentation is a tracker under the cookie/consent regime (L17). Assignment honours consent:
- A user who has **not** consented to experimentation/analytics cookies is **always served `control`** and emits **no exposure event** — they are simply outside the experiment.
- The consent signal is read from the existing cookie-consent state (the L17 banner; V3-93 formalises the consent ledger — this pass reads the current consent flag, it does not build the ledger).
- Every exposure assignment is logged for audit (`emitExposure` → the lake), so the experiment population is reconstructable for a fairness/consent review.

### S6 — First experiments (test runs, behind real surfaces)

Three low-risk experiments that prove the framework end-to-end (each measures a non-money KPI):
- **`marketplace_ranking_density`** — the V3-52 marketplace discovery density variant (control vs denser grid); KPI `henry.marketplace.checkout.started`.
- **`deals_copy_variant`** — the V3-35 deals headline copy A/B (two i18n-keyed copy variants, both translated); KPI `henry.marketplace.cart.updated`.
- **`campaign_followup_subject`** — the V3-48 follow-up campaign subject-line A/B; KPI the campaign's click event.

Each runs at a small initial split, behind a real surface, with a registry entry, sticky assignment, exposure + conversion tracking, and a documented hypothesis. **None touches price, payment, identity, or KYC.**

### S7 — Telemetry

Three new events, added to the `HenryEventName` union in `packages/observability/src/events.ts` and `docs/event-taxonomy.md`:

```
henry.experiment.assigned    (system_state · completed)  — a unit bucketed into a variant
henry.experiment.exposure    (system_state · completed)  — experimental surface rendered to the unit
henry.experiment.conversion  (user_action · completed)   — the KPI event fired for an exposed unit
```

Payloads carry `{ experiment_key, variant_key }` only — low-cardinality, no PII (the unit is `actor_hash` / `session_id`, never a raw id).

## Out of scope

- Statistical analysis tooling beyond the GrowthBook UI (we feed it data; we do not rebuild its stats).
- Multi-armed bandit / adaptive allocation (future — fixed split only this pass).
- Building the consent ledger / DSAR (**V3-93** — this pass *reads* the existing consent flag; it does not build the ledger).
- The data lake itself (**V3-90** — this pass consumes its `sinkEvent` + BI views).
- Any redesign of the marketplace/deals/campaign surfaces — this pass adds an experiment dimension to existing surfaces only.

## Dependencies

- **Requires:** V3-90 (the lake — exposure/conversion land in `henry_events_raw`; significance is read from BI metrics over it).
- **Blocks:** V3-52 / V3-35 / V3-48 ship their measured variants through this framework; V3-94 closure asserts the experiment lifecycle works and no experiment touches money/identity.

## Inheritance

- `@henryco/observability` — `emitEvent` + the typed `HenryEventName` taxonomy (exposure/conversion events), `sinkEvent` (V3-90 lake), the `traceId` stitch.
- V3-90 — `henry_events_raw` + the BI views (the measurement substrate); `actor_hash` as the sticky bucketing unit for authed users.
- `@henryco/intelligence/parseHenryFeatureFlags` — the existing env-flag pattern, preserved and delineated from experiments.
- `@henryco/i18n` — copy variants in the deals experiment are i18n-keyed, both translated.
- The L17 cookie-consent state — the gate that keeps non-consenting users out of experiments.

## Implementation requirements

### Files

`packages/experiments/` (the S2 tree); the three registry entries + GrowthBook experiments (S6); the experiment-dimension wiring on the marketplace/deals/campaign surfaces (touch the render seam only); the consent gate in `assignment.ts` (S5); the three taxonomy entries (S7); `docs/v3/ab-testing-architecture.md` (platform decision + the env-flag-vs-experiment rule + the lifecycle). New env in `docs/v3/INTEGRATION-KEYS.md`: `GROWTHBOOK_API_HOST`, `GROWTHBOOK_CLIENT_KEY`, `GROWTHBOOK_SECRET_API_KEY`.

### Trust / safety / compliance

No experiment may touch money, identity, payment behaviour, or KYC — the registry type forbids a money/identity surface as an experiment target, and S6's three experiments measure non-money KPIs only. Experimentation honours consent (S5): non-consenting users are served control and never exposed. Every exposure assignment is logged for audit (Principle 12). The bucketing unit is `actor_hash` / `session_id` — never a raw id; payloads are PII-free. GrowthBook secrets are env-only, never client-bundled (`GROWTHBOOK_SECRET_API_KEY` is server-side only; `GROWTHBOOK_CLIENT_KEY` is the only client-safe key).

### Mobile + desktop parity

The GrowthBook SDK runs on both web and the Expo super-app; `@henryco/experiments` exposes the same `useExperiment` hook to both. Sticky assignment is keyed on `actor_hash` / `session_id` so a user sees the same variant across web and mobile within an experiment. Mobile exposure/conversion flow into the same V3-90 lake.

### i18n

Copy-based variants (the `deals_copy_variant` experiment) are **i18n-keyed in both arms** — namespace `surface:deals` — and translated; an experiment never ships a hardcoded string. The framework's own operator surface (registry status) is operator-facing; any owner-facing experiment dashboard label routes through `surface:observability`.

### Brand & design system

Variant surfaces inherit the locked division tokens + Fraunces; a UI variant must hold light + dark, mobile + desktop, CLS ≈ 0, contrast not regressed (`pnpm a11y:contrast`) — a denser grid variant cannot ship a layout shift. Any link in an experiment surface resolves through `@henryco/config` helpers, never a literal domain. The GrowthBook host URL is env-sourced (`GROWTHBOOK_API_HOST`), never hardcoded.

## Validation gates

1. **Standard CI** — typecheck, lint, test, build (`Lint, typecheck, test, build`, the required branch-protection context).
2. **Experiment lifecycle e2e** — create → split → assign → expose → convert → read significance → roll-out/kill, walked end-to-end against a synthetic experiment; the killed path leaves the surface on control with no dead branch.
3. **Sticky assignment verified** — the same `actor_hash` / `session_id` resolves to the same variant across repeated requests and across web↔mobile; split ratios match the configured `trafficSplit` over a large sample.
4. **Consent gate** — a non-consenting unit is served `control` and emits no `henry.experiment.exposure`; a consenting unit is bucketed and exposed.
5. **Conversion tracking via the lake** — exposure + conversion land in `henry_events_raw` with `{ experiment_key, variant_key }`; the BI metric reads correctly for significance.
6. **No money/identity target** — a unit test asserts the registry rejects a money/identity/payment surface as an experiment target; S6's three experiments measure non-money KPIs only.

## Deployment gate

All gates green; the required check passing; branch `v3/91-observability-ab-testing-framework` off `origin/main` → PR → squash-merge (no force-push). Owner reviews `docs/v3/ab-testing-architecture.md` (platform choice + the three test experiments + their hypotheses). **14-day soak** running the three test experiments at a small split to confirm sticky assignment, consent-gating, and lake-fed measurement behave before any high-stakes experiment runs.

## Final report contract

`.codex-temp/v3-91-observability-ab-testing-framework/report.md` with the standard 9 sections (exec summary · files changed · migration/RLS/env · validation evidence · smoke · live verification · telemetry baseline · deferred items · pass-closure assertion) + the three test-experiment definitions (hypothesis · KPI · split) + the sticky-assignment determinism evidence.

## Self-verification

- [ ] GrowthBook (self-hosted) adopted; LaunchDarkly/Edge-Config rejection rationale recorded; env-only keys, zero hardcoded host.
- [ ] `@henryco/experiments` ships a typed registry + sticky assignment + `useExperiment` + server `resolveVariant` + exposure/conversion tracking; apps never call the GrowthBook SDK directly.
- [ ] Full lifecycle (create → split → assign → track → analyse → decide) tooling works; roll-out and kill both clean.
- [ ] Env-flag system (`parseHenryFeatureFlags`) preserved + delineated from experiments; no flag in both.
- [ ] Consent gate: non-consenting units served control, never exposed; every exposure logged.
- [ ] Three test experiments (marketplace ranking density · deals copy · campaign subject) running at small split, behind real surfaces, none touching money/identity.
- [ ] Three `henry.experiment.*` events added to the typed union + `docs/event-taxonomy.md`; payloads PII-free.
- [ ] Bucketing unit is `actor_hash`/`session_id`; copy variants i18n-keyed both arms. Report written; hand-off to V3-52 / V3-35 / V3-48 noted.
