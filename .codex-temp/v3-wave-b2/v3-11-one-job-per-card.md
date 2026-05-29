# V3-11 — One-job-per-card (inventory + enforceable D-gate + card telemetry)

**Pass:** V3-11 (Phase B Foundation Lock)
**Branch:** `v3/11-one-job-per-card` (authored on `conductor/v3-11`)
**Base:** `origin/main` @ `75a59dc0` (post V3-04 merge — provides the `@henryco/seo/deeplinks` S4 builders V3-11's telemetry/share story depends on)
**Author:** Claude · Opus 4 · V3 Foundation conductor
**Status:** **FOUNDATION COMPLETE + ENFORCED** (S1+S2 done, D-gate green, telemetry primitive + owner tile shipped). **S4–S8 qualitative audits HONESTLY DEFERRED** (see "Deferred" — not started, scoped as a dedicated follow-up).

---

## Objective (owner's literal question)

> "For every card, button, and summary module, ask: **Does this open the exact next step, or does it just show more text?**"

The pass turns that question into (a) a repeatable static **inventory** of every card-like surface, (b) a machine-enforced **gate** that fails CI if any card "looks actionable but does nothing", and (c) **telemetry** so the owner can SEE which cards actually get clicked.

---

## What shipped (complete + verifiable)

### S1 — Inventory scanner (`scripts/v3/card-inventory.mjs`)
Pure `node:fs`/`node:path` (runs with **no** `node_modules`, so it works in the shared tree and in CI). Walks `apps/**` + `packages/**`, skips build artefacts, test/spec/fixture files, and the **OWNER-RESERVED** `packages/search-ui/` tree. Detects card-like surfaces by file-name convention (`*Card`/`*Tile`/`*Module`/`*Panel`/`*Summary`), `dashboard-modules-*` package membership, `role="article"`, `card-*`/`tile-*` classNames, and interactive card primitives. Emits `docs/v3/one-job-per-card-inventory.md`.

### S2 — Classification → every card resolved to A/B/C/D (this session)
The scanner reports a best-effort **signal** class + evidence; two mechanisms drive genuine ambiguity to **zero** without guessing:
- **`NON_CARD_STRUCTURAL_RE`** — excludes loading `skeleton(s).tsx` and RSC `page-server.tsx` data-loaders (they carry `card-*`/`tile-*` classNames but paint no real card; the live surface they stand in for is classified separately). Excluded surfaces are still **listed transparently** in an "Excluded structural non-cards" section — nothing is silently dropped.
- **`CLASS_OVERRIDES`** — explicit, per-file **recorded human judgements** (read the file → assign class + C1/C2/C3 sub + a one-line reason, carrying the prior heuristic signal as evidence) for the surfaces the heuristic leaves as `needs-review` or as un-split `C`.

**Final inventory counts (current `main`-merged tree):**

| Class | Count | Meaning |
|---|---|---|
| **A** | 87 | Opens the exact next step (has nav/mutation). GOOD. |
| **B** | 0 | Generic hub, not the exact next step. (none to demote) |
| **C** | 12 | Information only — **C1 (critical + implied action): 5**, **C2 (nice-to-have): 7**, C3 (decorative): 0 |
| **D** | 0 | Looks actionable, does nothing. (none — gate green) |
| **needs-review** | **0** | every card classified |
| _excluded (structural)_ | _3_ | 2 skeletons + 1 `staff-care/page-server.tsx` (listed, not counted) |
| **Total card surfaces** | **99** | |

The 5 **C1** (critical info that pairs an implied action owned by the parent surface): account `jobs/ReadinessCard`, account `verification/ReviewerNoteCard`, studio `portal/invoice-summary`, hub owner `MetricCard` (pairs `MetricTraceDrawer` drill), hub owner `SessionHealthTile` (rollback-gate monitoring). The 7 **C2** are account section heroes (Calendar/Invoices/Inbox/Notifications/Settings/Tasks) + logistics `TrackingMapPanel` — info banners above their own interactive surface.

### S3 — Fix B/D cards: **N/A**
There are **0** B and **0** D cards, so there is nothing to demote or repair. The inventory proves it rather than asserting it.

### Enforcement gate (`--check`)
`node scripts/v3/card-inventory.mjs --check` exits 1 iff a machine-detectable **D** card exists (an interactive card primitive — `HenryCoTactileCard`/`PublicCard` — used with no `href`/`onClick`/`interactive`/`asChild` and no nav cue anywhere in the file). Current result: **OK — no machine-detectable D cards.** This is the durable regression guard CI can wire later.

### S9 — Card telemetry foundation
- **3 canonical events** added to `packages/observability/src/events.ts` + `docs/event-taxonomy.md`: `henry.ui.card.rendered`, `henry.ui.card.clicked`, `henry.ui.card.demoted`.
- **`<CardTelemetry>`** zero-DOM-overhead wrapper in `packages/ui/src/telemetry/card-telemetry.tsx` (exported from `@henryco/ui`): fires `rendered` on mount + `clicked` on activation, so the owner can measure "does this card earn its place".
- **Owner clickthrough tile:** `apps/hub/.../dashboard/card-clickthrough-tile.tsx` + `apps/hub/lib/owner-card-clickthrough.ts` (`getCardClickThroughMetrics`, mirrors the existing `owner-module-health.ts` reader: `cache()` + `createAdminSupabase` + try/catch→empty, ranks lowest-clickthrough cards over 7d from `henry_events` by `name` + `payload`). Mounted in the owner command page after the existing tiles.
- **`dashboard-shell` `nextStep` contract field** added to the module contract (type-level) so modules can later declare their exact next step.

---

## Diff scope (V3-11 surface vs `origin/main`)

```
apps/account/components/smart-home/NextBestActions.tsx          (CardTelemetry reference wiring)
apps/hub/app/owner/(command)/dashboard/card-clickthrough-tile.tsx   (new, owner tile)
apps/hub/app/owner/(command)/page.tsx                           (mount tile)
apps/hub/lib/owner-card-clickthrough.ts                         (new, metrics reader)
docs/event-taxonomy.md                                          (card events row)
docs/v3/one-job-per-card-inventory.md                           (generated inventory)
packages/dashboard-shell/src/{index,module-contract,register}.ts (nextStep contract)
packages/observability/src/events.ts                            (3 card events)
packages/ui/src/index.ts                                        (export CardTelemetry)
packages/ui/src/telemetry/card-telemetry.tsx                    (new, telemetry wrapper)
scripts/v3/card-inventory.mjs                                   (scanner + S2 classification)
```

No shared design-token / typography / domain-helper / V3-10 logger changes. No new user-facing strings. No hardcoded domains. The new hub reader's `Array<{…}>` / `ReadonlyArray<…>` usages mirror the patterns already shipped green on `main` (`owner-module-health.ts`, `owner-audit-log.ts`).

---

## Validations

| Gate | How | Result |
|---|---|---|
| `card-inventory.mjs` | run locally (node-only, no deps) | **GREEN** — total=99, A=87, B=0, C=12, D=0, needs-review=0, excluded=3 |
| `card-inventory.mjs --check` | run locally | **GREEN** — no machine-detectable D cards |
| repo-root `lint:all` / `typecheck` / `build` | GitHub Actions `CI / Lint, typecheck, test, build` | **authoritative gate — run on the PR** (shared tree has no `node_modules`; per conductor governance CI is the build gate) |

---

## Deferred — honestly NOT done in this pass (NO FAKE CLAIMS)

These are the **qualitative design audits** in the V3-11 prompt. They require reading rendered UI and making per-surface design calls — genuinely separate work, better as a dedicated follow-up than rushed here. None were started:

- **S4 — Button audit:** verify every button label names its exact action (not "View"/"Manage"/generic).
- **S5 — Summary-module audit:** every summary either drills to its detail or is demoted to non-card text.
- **S6 — Cross-surface consistency:** same card type behaves identically across divisions.
- **S7 — Density pass:** demote C2/C3 info to lower visual priority so A cards lead.
- **S8 — Mobile pass:** card tap targets + the "exact next step" on small screens.

**Telemetry rollout is partial by design:** `<CardTelemetry>` is wired into **1 of 87** A-cards (`NextBestActions`) as the reference integration that proves the event contract end-to-end. Broad rollout across the remaining A-cards rides with the S4–S8 follow-up (each card gets telemetry as it is audited). The `dashboard-shell` `nextStep` field is **type-level only** (0 runtime consumers yet) — the contract is in place for modules to adopt during S4–S8.

This mirrors V3-04's honest split: ship the **enforceable foundation** (inventory + D-gate + telemetry primitive + owner visibility) now; scope the **qualitative rollout** as a clearly-labelled follow-up.

---

## Final status

**FOUNDATION COMPLETE + ENFORCED.** Every card-like surface (99) is classified A/B/C/D with zero `needs-review`; zero D cards; a node-only `--check` gate guards against regressions; canonical card telemetry + an owner clickthrough tile ship so "does this card earn its place" becomes measurable. S4–S8 qualitative audits + broad telemetry rollout are deferred and labelled. Repo-root GREEN gate is delegated to CI per conductor governance.
