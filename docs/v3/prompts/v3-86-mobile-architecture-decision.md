# V3-86 — Global/Mobile: Mobile Architecture Decision (Expo vs Flutter)

**Pass ID:** V3-86  ·  **Phase:** I (Platform/API + Global/Mobile + Observability + Closure)  ·  **Pillar:** P12 (Foundation & Trust)
**Dependencies:** V3-12 (Foundation Lock acceptance — CERTIFIED, PR #168)  ·  **Effort:** M  ·  **Parallel-safe:** N
**Owner gate:** D8 (mobile-app stack: continue Expo vs Flutter)  ·  **Risk class:** —

---

## Role
You are the V3 Mobile Architect for Henry Onyx. This is a **decision pass**, not a feature build: you produce a rigorous, evidence-backed decision document and a runnable comparison spike, then stop and report. The line it must not cross: you ship **no production mobile code and no schema** — you stand up a throwaway spike branch, measure it against the existing Expo app on real axes, write the decision, and hand the ratified stack to V3-87. **Read the current answer to D8 in `docs/v3/DECISIONS-REQUIRED.md` first.** The recommendation on record is **continue Expo** (the owner already invested ~3K LOC in the super-app + ~3.7K LOC in company-hub with a full platform-contracts/adapters/bundle architecture); your job is to *test that recommendation with evidence* and either ratify it or document a defensible Flutter migration plan with honest cost — confirm or pivot on stated grounds, do not re-litigate from zero.

## Project

| Field | Value |
|---|---|
| Repo | `github.com/cbebot/Henry-Co` |
| Default branch | `main` |
| Working branch | `v3/86-mobile-spike` |
| Deploy | Vercel (web) · EAS (mobile builds) |
| Backend | Supabase (project ref `rzkbgwuznmdxnnhmjazy`) |
| Package manager | pnpm 9.15.5 · Node 24.x |
| OS context | Windows + bash |

## Audit summary

The Expo investment is real, layered, and already on `main` — this is the baseline the decision is measured against:

- **`apps/super-app`** — Expo Router app (`app/(tabs)/` with `index`, `account`, `services`, `directory`; `app/module/[slug].tsx`; `app/legal/*`), `app.json`, `eas.json` (preview/staging/production channels), `metro.config.js`, Jest config. Its strength is a **platform-abstraction layer**: `src/platform/contracts/` (`auth.ts`, `database.ts`, `notifications.ts`, `payments.ts`, `media.ts`, `analytics.ts`, `monitoring.ts`) with **swappable adapters** under `src/platform/adapters/` (`supabase/auth.supabase.ts`, `supabase/database.supabase.ts`, `expo/notifications.expo.ts`, `sentry.monitoring.ts`, `cloudinary.media.ts`, `payments.deferred.ts`, plus `mock/*` for every contract), env-selected configs (`src/platform/config/{local,staging,production}.config.ts`), `bundle.ts`, `featureFlags.ts`, and `runtime.ts`. Providers compose through `src/providers/{AppProviders,PlatformProvider}.tsx`.
- **`apps/company-hub`** — the second Expo app (NativeWind + Tailwind, `eas.json`, `app.json`, `dist/`).
- The contracts/adapters design means the apps are **stack-portable by construction**: the UI talks to contracts, not to Supabase/Expo directly. That is the single most decision-relevant fact — it lowers a hypothetical Flutter migration cost *and* raises the case for staying on Expo (the abstraction already delivers the testability a stack migration is usually chasing).
- Web shared packages (`@henryco/config`, `@henryco/i18n`, `@henryco/pricing`, `@henryco/payment-router`, `@henryco/observability`) are TypeScript — reusable on Expo/RN, **not** reusable on Flutter (Dart) without reimplementation. This is the largest hidden migration cost and must be quantified, not hand-waved.

**The gap this pass closes:** D8 is unratified. The owner needs a *decision artifact* — a measured comparison, an honest 12-month cost model, and a risk analysis — not a vibe. This pass produces it and ratifies the stack so V3-87 (parity wave 1) builds on solid ground.

## Mandatory scope

### S1 — Spike branch `v3/86-mobile-spike`
A throwaway, never-merged spike that makes the comparison concrete (not a thought experiment):
- Stand up a minimal Flutter app — **3 screens: home / list / detail** — using the Supabase Flutter SDK against the same project ref, plus the three native integrations the production app depends on so the comparison is real: **Sentry (Flutter), Mapbox (Flutter), and Supabase auth**.
- Build the *same* 3 screens as an isolated comparison route inside the existing Expo super-app (reuse the platform contracts) so the two stacks are measured on identical work.
- Capture real numbers, not estimates: cold-start time, JS/Dart bundle/APK size, time-to-first-frame, a scroll-jank sample (FPS under a list scroll), `eas build` (Expo) vs `flutter build apk` wall-clock, and a library-availability audit for each production dependency (Supabase, Mapbox, OneSignal push, Cloudinary, Stripe/Paystack SDKs, biometric auth).

### S2 — Decision document `docs/v3/mobile-architecture-decision.md`
The deliverable the owner signs. It contains:
- **Side-by-side comparison table** on the S1 axes (DX, build time, bundle/APK size, runtime perf, library availability, shared-code reuse, hiring/skill availability, OTA-update story).
- **Shared-code reuse analysis** — the load-bearing factor: enumerate exactly which `@henryco/*` packages (`config`, `i18n`, `pricing`, `payment-router`, `observability`) are reusable on Expo/RN and would require Dart reimplementation on Flutter, with a LOC estimate per package. This is the dominant migration cost.
- **12-month cost model** — continue-Expo cost (incremental investment toward V3-87 parity) vs migrate-to-Flutter cost (port the contracts/adapters, reimplement the shared TS packages in Dart, re-skill, re-establish CI), in engineer-weeks and dollars.
- **Risk analysis** — vendor lock-in (Expo/EAS), OTA-update policy compliance, performance ceiling for the heaviest screens (maps, video rooms), team re-skill risk, and the anti-clone posture (mobile is part of the moat — D12).
- **Recommendation** — ratify continue-Expo per the D8 baseline OR a defensible Flutter migration plan, with the decision criteria made explicit so the owner can disagree on stated grounds.
- **D8 ratification record** — the owner's confirmed answer captured inline, dated, in the DECISIONS-REQUIRED.md format ("Owner answer: Option A because …").

### S3 — Architecture summary update
Extend `docs/architecture-summary.md` (or `apps/super-app/docs/` if the canonical mobile arch lives there) for the chosen stack: the contracts/adapters layering, the env-config selection, the bundle/feature-flag model, and the package-reuse boundary. This becomes the map V3-87 builds parity against.

### S4 — Telemetry
N/A — this is a decision pass; no production code, therefore no runtime events. State this explicitly in the report rather than omitting the section.

## Out of scope
- Building full mobile feature parity — **V3-87** (parity wave 1 on the chosen stack).
- Store submission, metadata, EAS submit config — **V3-88**.
- Any production schema, RLS, or live integration — the spike is throwaway and never merged to `main`.
- Native payment compliance — **V3-23**.

## Dependencies
- **Requires:** V3-12 (Foundation Lock CERTIFIED) — the foundation must be solid before the mobile chapter opens.
- **Owner gate:** D8 — recommendation on record is **continue Expo**; this pass tests and ratifies (or documents a pivot). Confirm on stated grounds; do not re-open from scratch.
- **Blocks:** V3-87 (parity wave 1 builds on the ratified stack); informs V3-88 (submission tooling per chosen stack), V3-23 (native payments on the chosen stack).

## Inheritance
- `apps/super-app` + `apps/company-hub` — the existing Expo apps, their `app.json`/`eas.json`, the `src/platform/contracts` + `src/platform/adapters` abstraction, the `src/platform/config/*` env selection.
- The web shared packages (`@henryco/config`, `@henryco/i18n`, `@henryco/pricing`, `@henryco/payment-router`, `@henryco/observability`) — the reuse boundary that dominates the cost model.

## Implementation requirements
### Files
- `docs/v3/mobile-architecture-decision.md` (S2), `docs/architecture-summary.md` extension (S3), the spike on branch `v3/86-mobile-spike` (S1 — **not merged**).
### Trust / safety / compliance
- The spike uses the **anon** Supabase key + a throwaway test account only — no service-role key, no production credential in the spike. Anti-clone (D12): the decision doc notes that mobile is part of the moat and the chosen stack must keep proprietary logic server-side (the contracts/adapters layer already enforces this).
### Mobile + desktop parity
- N/A — spike + decision only. The *purpose* of the parity work is V3-87; this pass chooses the vehicle.
### i18n
- N/A — no user-facing production strings ship in this pass. (The decision doc notes that whichever stack is chosen must consume `@henryco/i18n` on mobile, which Flutter cannot do without a Dart i18n reimplementation — a cost-model line item.)
### Brand & design system
- N/A for shipped UI. Note in the decision doc: the chosen stack renders the Henry Onyx brand via `@henryco/config` (`company.ts`) and the locked design tokens; **`apps/super-app/app.json` currently carries the stale `"name": "Henry & Co."` and a placeholder EAS project ID + hardcoded `staging.henrycogroup.com` deep-link host** — flag these as V3-87/V3-88 fixes (do not change them in this decision pass).

## Validation gates
1. **Spike runs** on a simulator/emulator and demonstrates Supabase auth + Mapbox render + Sentry event capture on both stacks.
2. **Real measurements captured** for every S1 axis — numbers, not adjectives.
3. **Decision doc complete** — comparison table, shared-code reuse analysis with LOC estimates, 12-month cost model, risk analysis, explicit recommendation criteria.
4. **D8 ratified or pivoted** with the owner's dated answer recorded in DECISIONS-REQUIRED.md.
5. **Architecture summary** updated for the chosen stack.
6. Standard CI is N/A for the spike branch (never merged); the decision doc + architecture-summary edits land via a normal `docs`-only PR off `origin/main` with `Lint, typecheck, test, build` green.

## Deployment gate
The owner signs the decision (D8 answer recorded). The docs-only PR (decision doc + architecture summary) merges to `main`; the spike branch is **not** merged. No production deploy — this pass ships a decision and a map, nothing runtime.

## Final report contract
`.codex-temp/v3-86-mobile-architecture-decision/report.md` with the standard 9 sections (exec summary · files changed · migration/RLS/env [N/A, state so] · validation evidence · smoke [spike run] · live verification [N/A] · telemetry baseline [N/A — decision pass] · deferred items · pass-closure assertion) + the measured comparison table + the cost model.

## Self-verification
- [ ] D8 answer read; recommendation (continue Expo) tested with evidence, not assumed.
- [ ] Spike branch `v3/86-mobile-spike` with 3 Flutter screens + the matching Expo comparison route; Supabase + Mapbox + Sentry proven on both; spike NOT merged.
- [ ] Real measurements captured for every comparison axis (cold start, bundle/APK, TTFF, jank, build time, library availability).
- [ ] Shared-code reuse analysis with per-package LOC estimates (the dominant migration cost).
- [ ] 12-month cost model (continue-Expo vs migrate-Flutter) in engineer-weeks + dollars; risk analysis incl. anti-clone (D12).
- [ ] Decision doc complete with explicit recommendation criteria; D8 ratified/pivoted with the owner's dated answer in DECISIONS-REQUIRED.md.
- [ ] `docs/architecture-summary.md` updated for the chosen stack; stale `app.json` brand/EAS/deep-link items flagged for V3-87/V3-88.
- [ ] No production code, schema, or live credential shipped.
- [ ] Report written. Hand-off: V3-87 (parity wave 1 on the ratified stack).
