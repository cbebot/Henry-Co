# V3-11 — Foundation: One Job per Card

**Pass ID:** V3-11
**Phase:** B (FOUNDATION LOCK)
**Pillar:** P12 (Global)
**Dependencies:** V3-04 (deep links)
**Effort:** M (1–2 weeks)
**Parallel-safe:** NO (depends on V3-04)
**Owner gate:** None
**Risk class:** None

---

## Role

You are the V3 Foundation engineer for HenryCo. You execute exactly this one pass, then stop and report.

The owner's literal question, verbatim:

> "For every card, button, and summary module, ask: Does this open the exact next step, or does it just show more text? That one question will save you months of cleanup."

This pass answers that question for every card, button, and summary module across all 10 web apps + 2 mobile apps. Decorative-only surfaces get demoted or removed. Cards that look actionable but lead nowhere get fixed or removed.

---

## Project

| Field | Value |
|---|---|
| Repo | `github.com/cbebot/Henry-Co` |
| Default branch | `main` |
| Working branch | `v3/11-one-job-per-card` |
| Deploy | Vercel (10 web projects) |
| OS context | Windows + bash; pnpm 9.15.5; Node 24.x |

---

## Audit summary (lifted from AUDIT-BASELINE.md cross-cutting)

> ### Cross-cutting foundation issues
> - **Every-card-one-job audit:** not yet done — this is the owner's literal question.

This pass IS the audit + the fix.

---

## Mandatory scope

### S1 — Inventory every "card-like" surface

Build `scripts/v3/card-inventory.mjs`:
- Walks `apps/` for components named `*Card.tsx`, `*Tile.tsx`, `*Module.tsx`, `*Panel.tsx`, `*Summary.tsx`.
- Walks for JSX with `role="article"` or class names matching `card-*`, `tile-*`.
- Walks for `dashboard-modules-*` component exports.
- For each match, identify:
  - Source file:line.
  - Does the card have an `href` or `onClick` that performs a navigation OR a mutation?
  - If yes: what is the "exact next step" the card opens?
  - If no: what does the card display, and is it useful?

Output `docs/v3/one-job-per-card-inventory.md`.

### S2 — Classify each card

Per the owner's question, every card is one of:

**A — Opens the exact next step.** Good. Verify the next-step target is correct + alive (cross-check V3-04 deep-link inventory + V3-06 dead-link sweep).

**B — Opens a generic listing or hub page, not the exact next step.** Demote — make the card a richer summary that includes the next-step CTA, OR add a primary action on the card that opens the exact next step.

**C — Shows information only; no action.** Decide:
- **C1** — information is critical (e.g., outstanding balance, urgent KYC needed) — keep as informational but PAIR with the action it implies (e.g., "Pay now" CTA).
- **C2** — information is nice-to-have (e.g., "Trending in marketplace this week") — keep but lower visual priority.
- **C3** — information is decorative (e.g., "Welcome to HenryCo" greeting card on a recurring visit) — REMOVE.

**D — Looks actionable but does nothing.** REMOVE or FIX.

### S3 — Apply fixes per classification

For each B card: add the missing action OR rewrite the card as a summary panel with explicit next-step CTA.

For each C3 card: remove.

For each D card: fix the underlying action OR remove the card.

For each A card: verify the next-step target. No action needed if verified.

### S4 — Buttons audit

Every `<button>` and `<Button>` in shipped code:
- Has an `onClick` or is `type="submit"` inside a form.
- Has accessible label.
- Performs an action that the user can verify happened (toast, navigation, mutation result).

Audit + fix. Buttons that "do nothing visible" lose user trust.

### S5 — Summary modules audit

Every "summary" component (financial summary, account summary, activity summary):
- Pulls real data (verified in V3-08 already).
- Has a clear "view all" or "manage" CTA that opens the relevant detail surface.
- Avoids redundancy with adjacent modules.

### S6 — Cross-card consistency

Cards across divisions should follow consistent patterns:
- Click target — entire card OR specific CTA (consistent per division).
- Visual hover state — consistent.
- Action affordance (chevron, button, etc.) — consistent.

If divisions have wildly different patterns, standardize on the cleanest one. The V3 PASS 21 editorial rebuild + PASS 25 typography establish the baseline; this audit ensures every card respects it.

### S7 — Card density review

Some surfaces have too many small cards; some have too few large ones. Per owner's feedback in `feedback_no_giant_hero_text.md` (premium = capability evidence above the fold, not headline size), card density should:
- Show capability evidence above the fold (KPIs, real items, verified counts).
- Not feel sparse on desktop OR crowded on mobile.
- Respect the V3-08 hidden-when-empty pattern.

Audit each app's home / dashboard / landing for density health.

### S8 — Mobile card touch behavior

Every card on mobile:
- Entire card is tappable (not just a tiny button inside it).
- Active state visible on tap (subtle press feedback).
- Swipe gestures consistent where applicable.

Cross-reference V3-09 mobile consistency findings.

### S9 — Telemetry

Events:
- `henry.ui.card.rendered` (card_id, classification, division)
- `henry.ui.card.clicked` (card_id, target)
- `henry.ui.card.demoted` (during this pass — track which cards were demoted/removed)

After deployment, owner-workspace tile shows "Cards by click-through rate" — low click cards may indicate poor next-step alignment.

---

## Out of scope

- New card designs (preserve V3 PASS 25 typography + V3 PASS 21 editorial).
- A/B testing card variants (V3-91).
- Personalized card ordering (V3-34).

---

## Dependencies

- V3-04 (deep links) — every card's "exact next step" target verified against the deep-link inventory.

Blocks:
- V3-12 (foundation lock acceptance) — this is one of the final waves before sign-off.
- V3-94 (V3 integration test) — re-runs the audit.

---

## Inheritance

- V3 PASS 21 editorial rebuild outputs — preserve premium hero treatment.
- V3 PASS 25 typography refinements — preserve.
- `@henryco/ui` card primitives (`HenryCoHeroCard`, `HenryCoTactileCard`) — extend.
- `@henryco/dashboard-modules-*` — extend module contract with `nextStep` field per module.

---

## Implementation requirements

### Files

- `scripts/v3/card-inventory.mjs` (new)
- `docs/v3/one-job-per-card-inventory.md` (new — output + classifications)
- Per-app fixes for B/C3/D classified cards
- `packages/dashboard-shell/src/module-contract.ts` — add `nextStep?: { href: string; label: string }` to module type
- `apps/hub/app/owner/(command)/dashboard/card-clickthrough-tile.tsx` (new per S9)

### No migrations.

### Telemetry events wired in `@henryco/observability`.

---

## Trust / safety / compliance

- Removing cards never removes the user's only access to a function — verify every "View all" or "Manage" link reaches the page another way.
- ANTI-CLONE: tighter UI is harder to clone visually (and feels more premium).

## Mobile + desktop parity

- Cross-reference V3-09 mobile audit. Mobile card behavior verified per S8.

## i18n

- Card labels via `@henryco/i18n`.

---

## Validation gates

1. Standard CI.
2. **Inventory complete** — every card classified A/B/C/D.
3. **Smoke** — owner walks 10 representative surfaces; confirms each card has a clear next step OR a clear informational purpose.
4. **No D cards remain** — script enforces.

## Deployment gate

- All gates pass.
- Owner reviews 10 surface screenshots.
- 48-hour soak.

## Final report contract

`.codex-temp/v3-11-one-job-per-card/report.md` with the standard 9 sections + full inventory + classification statistics + before/after screenshots of 10+ representative surfaces.

---

## Self-verification

- [ ] Inventory complete.
- [ ] Every B card upgraded to A or demoted to C with paired action.
- [ ] Every C3 card removed.
- [ ] Every D card fixed or removed.
- [ ] Buttons audit complete.
- [ ] Cross-card consistency standardized per division.
- [ ] Mobile card behavior verified.
- [ ] 3 new telemetry events emitting.
- [ ] Owner card-clickthrough tile rendering.
- [ ] Report written. Hand-off named: V3-12 (foundation lock acceptance).
