# @henryco/interactions

The ten interaction **Engines** from the Public-Pages Interaction & Earning
Doctrine (`docs/v3/public-pages-interaction-principles.md`, Part IV), packaged
for reuse across every division and the V3 showcase.

## Design

Each engine is two parts:

- a **pure logic core** (`<engine>.logic.ts`) — a DOM-free, deterministic
  decision function (takes `now` as a parameter, never calls `Date.now()`),
  unit-tested with `tsx --test`;
- a **thin `"use client"` React wrapper** that renders the core's output.

The package **injects its dependencies at the edges** rather than hard-importing
app systems:

| Concern | Injected via | Wired by the app to |
|---|---|---|
| Telemetry | `InteractionTelemetryProvider` | `@henryco/observability` |
| Copy / i18n | `InteractionLabelsProvider` | `@henryco/i18n` (Pattern B) |
| Currency | `CurrencyProvider` | `@henryco/pricing` |
| Cross-session state | per-engine adapter prop | server-backed anonymous session (V3-01) |

This keeps the package pure, testable in isolation, and reusable across all 9
divisions without behavior drift.

## The engines

1. **CTA** — three-state, width-locked, optimistic action button.
2. **Micro-Commitment** — the consensual commitment ladder.
3. **Trust Reveal** — progressive trust staircase (browse → consider → commit → pay).
4. **Abandonment Recovery** — consented, well-timed recovery.
5. **Joy** — the ≤600 ms success state.
6. **Earn-With-Us** — the "other side of this" invitation.
7. **Newsletter Earn** — high-intent capture after value.
8. **Pricing Reveal** — honest price + itemized fee + FX.
9. **Concierge Handoff** — opt-in specialist handoff.
10. **Local Boost** — transparent promoted placement.

## Scripts

```bash
pnpm --filter @henryco/interactions test       # tsx --test (pure logic cores)
pnpm --filter @henryco/interactions typecheck  # tsc -p tsconfig.json
```
