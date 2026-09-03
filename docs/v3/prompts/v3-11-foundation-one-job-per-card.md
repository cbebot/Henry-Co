# V3-11 — Foundation: One Job per Card

> **STATUS: SHIPPED — PR #167.** Closed and certified inside Foundation Lock (V3-12, #168). The card inventory was taken, every card classified A/B/C/D, decorative-only surfaces removed, and the `nextStep` module contract landed. Treat this as the elevated canonical spec and the standing regression contract — V3-94 re-runs the card audit, and V3-34 (personalized home) inherits the `nextStep` field. Residual hardening is named at the end, not reopened as scope.

**Pass ID:** V3-11  ·  **Phase:** B (Foundation Lock)  ·  **Pillar:** P12 (Global)
**Dependencies:** V3-04 (deep links)  ·  **Effort:** M  ·  **Parallel-safe:** N
**Owner gate:** none  ·  **Risk class:** —

---

## Role

You are the V3 Foundation engineer for Henry Onyx. You execute exactly this one pass, then stop and report. You answer the owner's literal question for every card, button, and summary module across all 10 web apps + the account/staff shells:

> "For every card, button, and summary module, ask: Does this open the exact next step, or does it just show more text? That one question will save you months of cleanup."

Every card resolves to one verdict: it opens the exact next step, or it earns a clear informational purpose, or it is removed. The line you must not cross: you change card *behaviour and information architecture*, never the V3 PASS 21 editorial design or PASS 25 typography; and you never delete a user's only access path to a function.

## Project

| Field | Value |
|---|---|
| Repo | `github.com/cbebot/Henry-Co` |
| Default branch | `main` |
| Working branch | `v3/11-one-job-per-card` |
| Deploy | Vercel |
| Backend | Supabase (project ref `rzkbgwuznmdxnnhmjazy`) |
| Package manager | pnpm 9.15.5 · Node 24.x |
| OS context | Windows + bash |

## Audit summary

The every-card-one-job audit had never been done — it is the owner's literal question and the last behavioural sweep before Foundation Lock sign-off. Across the apps, surfaces shipped a mix of: cards that open the exact next step (good), cards that bounce to a generic listing instead of the specific action, information-only cards (some critical, some nice-to-have, some purely decorative), and cards that *look* actionable but do nothing. The `@henryco/ui` card primitives (`HenryCoHeroCard`, `HenryCoTactileCard`) and the `@henryco/dashboard-modules-*` exports render these surfaces but carried no machine-readable notion of "the next step this card opens." This pass inventories every card, classifies it, fixes or removes per classification, and extends the module contract with a typed `nextStep`. It runs after V3-04 so every card's "exact next step" target is validated against the deep-link inventory, and after V3-09 so mobile card touch behaviour is the standardised version.

## Mandatory scope

### S1 — Inventory every card-like surface
Ship `scripts/v3/card-inventory.mjs` that walks `apps/` for components named `*Card.tsx`, `*Tile.tsx`, `*Module.tsx`, `*Panel.tsx`, `*Summary.tsx`, JSX with `role="article"` or class names matching `card-*` / `tile-*`, and `dashboard-modules-*` exports. For each match record: source `file:line`; whether it has an `href`/`onClick` that navigates or mutates; if yes, the exact next step it opens; if no, what it displays and whether that is useful. Output `docs/v3/one-job-per-card-inventory.md`.

### S2 — Classify each card
- **A — opens the exact next step.** Good. Verify the target is correct + alive (cross-check the V3-04 deep-link inventory and V3-06 dead-link sweep).
- **B — opens a generic listing/hub, not the exact next step.** Promote to A: add a primary action that opens the exact next step, or rewrite as a summary panel with an explicit next-step CTA.
- **C — information only, no action.** Decide:
  - **C1** — critical (outstanding balance, urgent KYC) → keep, but pair with the action it implies (e.g. "Pay now").
  - **C2** — nice-to-have ("trending this week") → keep at lower visual priority.
  - **C3** — decorative (e.g. a recurring "Welcome to Henry Onyx" greeting on a return visit) → **remove.**
- **D — looks actionable, does nothing.** Fix the underlying action or remove.

### S3 — Apply fixes per classification
Every B → A or a summary panel with explicit CTA. Every C3 → removed. Every D → fixed or removed. Every A → target verified, no further change. Record each disposition in the inventory doc.

### S4 — Buttons audit
Every `<button>` / `<Button>` in shipped code has an `onClick` or is `type="submit"` inside a form, has an accessible label, and produces a user-verifiable result (toast, navigation, or visible mutation result). Buttons that do nothing visible erode trust — fix or remove.

### S5 — Summary modules audit
Every summary component (financial, account, activity) pulls real data (already truthed in V3-08), exposes a clear "View all" / "Manage" CTA into the relevant detail surface, and avoids redundancy with adjacent modules.

### S6 — Cross-card consistency
Standardise per division: whole-card click target vs specific CTA, hover state, and action affordance (chevron / button). Where divisions diverge wildly, converge on the cleanest pattern. The PASS 21 editorial rebuild + PASS 25 typography are the fixed baseline this audit respects.

### S7 — Card-density review
Per `feedback_no_giant_hero_text.md` (premium = capability evidence above the fold, not headline size): each app's home/dashboard/landing shows real capability evidence above the fold (KPIs, real items, verified counts), is neither sparse on desktop nor crowded on mobile, and respects the V3-08 hidden-when-empty pattern.

### S8 — Mobile card touch behaviour
Every card on mobile: the whole card is tappable (not a tiny inner button), a visible active/press state on tap, and swipe gestures consistent where applicable — all per the standardised `@henryco/ui/mobile` behaviour from V3-09.

### S9 — `nextStep` module contract + telemetry
Extend the dashboard module type with `nextStep?: { href: string; label: string }` (`packages/dashboard-shell/src/module-contract.ts`) so "the exact next step" becomes machine-readable and V3-34 can reason over it. Emit via `@henryco/observability` `emitEvent({ name, classification, outcome, payload })`:
- `henry.ui.card.rendered` (payload `{ card_id, classification, division }`)
- `henry.ui.card.clicked` (payload `{ card_id, target }`)
- `henry.ui.card.demoted` (payload `{ card_id, from, to }` — track demotions/removals during this pass)

After deployment, an owner-workspace tile shows "Cards by click-through rate" so low-click cards surface poor next-step alignment.

## Out of scope
- New card designs (PASS 25 typography + PASS 21 editorial preserved).
- A/B testing card variants → V3-91.
- Personalized card ordering → V3-34 (which consumes the `nextStep` contract shipped here).

## Dependencies
V3-04 (deep links) — every card's "exact next step" target validated against the deep-link inventory. Blocks: V3-12 (Foundation Lock acceptance — this is a final wave before sign-off) and V3-94 (re-runs the audit).

## Inheritance
- PASS 21 editorial rebuild + PASS 25 typography — preserve.
- `@henryco/ui` card primitives (`HenryCoHeroCard`, `HenryCoTactileCard`) — extend.
- `@henryco/dashboard-modules-*` — extend the module contract with `nextStep`.
- `@henryco/observability` `emitEvent` taxonomy.

## Implementation requirements

### Files
- `scripts/v3/card-inventory.mjs` (new)
- `docs/v3/one-job-per-card-inventory.md` (new — inventory + classifications + dispositions)
- Per-app fixes for B / C3 / D cards.
- `packages/dashboard-shell/src/module-contract.ts` — add `nextStep?: { href: string; label: string }`.
- Owner card-clickthrough tile under the hub owner workspace.
- No migrations.

### Trust / safety / compliance
Removing a card never removes the user's only access to a function — verify every "View all" / "Manage" path reaches the page another way before deleting. Tighter UI is itself an anti-clone advantage (harder to copy, reads more premium). No behavioural change to payment cards beyond ensuring their CTA opens the correct money flow.

### Mobile + desktop parity
Mobile card behaviour verified per S8 against the V3-09 standard; desktop hover/click parity preserved.

### i18n
All card labels and `nextStep.label` strings via `@henryco/i18n` — the existing per-surface namespaces (e.g. `surface:dashboard`, `surface:account`). The C3 example greeting "Welcome to Henry Onyx" is itself a localized string resolved from copy + `@henryco/config` brand, never hardcoded. No hardcoded user-facing strings.

### Brand & design system
Brand strings resolve from `@henryco/config` (`COMPANY.group.name = "Henry Onyx"`); zero hardcoded domains — card `href`s go through `henryDomain()` / `henryWebRoot()` / `getAccountUrl()`. Locked `--site-*` / `--accent` tokens + Fraunces where editorial; light + dark; mobile + desktop; CLS ≈ 0; contrast not regressed.

## Validation gates
1. Standard CI: `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`.
2. Inventory complete — every card classified A/B/C/D in `one-job-per-card-inventory.md`.
3. `card-inventory.mjs` reports **zero D cards remaining**.
4. Owner smoke: walk 10 representative surfaces; each card has a clear next step or a clear informational purpose.
5. Telemetry: the three `henry.ui.card.*` events observed emitting; clickthrough tile renders.
6. `pnpm a11y:contrast` not regressed; CLS ≈ 0.

## Deployment gate
All gates green. Owner reviews 10 surface screenshots and confirms the next-step verdict per card. 48-hour soak.

## Final report contract
`.codex-temp/v3-11-one-job-per-card/report.md` with the standard 9 sections (exec summary · files changed · migration/RLS/env · validation evidence · smoke · live verification · telemetry baseline · deferred items · pass-closure assertion), plus the full inventory, classification statistics (A/B/C1/C2/C3/D counts), and before/after screenshots of 10+ representative surfaces.

## Self-verification
- [ ] S1: `card-inventory.mjs` shipped; `one-job-per-card-inventory.md` lists every card with `file:line`.
- [ ] S2: every card classified A/B/C1/C2/C3/D.
- [ ] S3: every B promoted to A or summary-with-CTA; every C3 removed; every D fixed or removed.
- [ ] S4: buttons audit complete — every button has an accessible label and a verifiable result.
- [ ] S5: every summary module pulls real data and exposes a "View all" / "Manage" CTA.
- [ ] S6: cross-card consistency standardised per division.
- [ ] S7: card density healthy above the fold on desktop and mobile.
- [ ] S8: mobile card touch behaviour matches the V3-09 standard.
- [ ] S9: `nextStep` added to the module contract; three `henry.ui.card.*` events emit; clickthrough tile renders.
- [ ] Brand/domain/i18n/token hard rules satisfied; no user lost their only access path; report written and hands off to V3-12.
